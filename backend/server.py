from dotenv import load_dotenv
from pathlib import Path
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import uuid
import logging
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, UploadFile, File, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient

from auth import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    set_auth_cookies,
    clear_auth_cookies,
    get_current_user,
    require_admin,
    get_current_customer,
    decode_token,
    get_token_from_request,
)
from models import (
    LoginInput,
    CategoryCreate,
    Category,
    ProductCreate,
    ProductUpdate,
    Product,
    Settings,
    SettingsUpdate,
    OrderCreate,
    Order,
    OrderStatusUpdate,
    PaymentStatusUpdate,
    CustomerSignup,
    Customer,
    MediaItem,
    MediaUpdate,
    ContentBlock,
    ContentUpdate,
    CouponCreate,
    Coupon,
    ReviewCreate,
    Review,
    now_iso,
    new_id,
)
from seed import run_all as seed_all, slugify

# ----- App init -----
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

app = FastAPI(title="Zamn Naturals API")
api_router = APIRouter(prefix="/api")

# Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ----- Helpers -----
def strip_mongo_id(doc: dict) -> dict:
    if doc is None:
        return doc
    doc.pop("_id", None)
    return doc


async def gen_unique_slug(name: str, exclude_id: Optional[str] = None) -> str:
    base = slugify(name)
    slug = base
    i = 2
    while True:
        q = {"slug": slug}
        if exclude_id:
            q["id"] = {"$ne": exclude_id}
        if not await db.products.find_one(q):
            return slug
        slug = f"{base}-{i}"
        i += 1


async def gen_order_number() -> str:
    today = datetime.now(timezone.utc).strftime("%Y%m%d")
    count = await db.orders.count_documents({}) + 1
    return f"ZN-{today}-{count:05d}"


# ============================ AUTH ============================
@api_router.post("/auth/login")
async def login(payload: LoginInput, response: Response):
    email = payload.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    access = create_access_token(user["id"], user["email"], user.get("role", "user"))
    refresh = create_refresh_token(user["id"])
    set_auth_cookies(response, access, refresh)
    user.pop("_id", None)
    user.pop("password_hash", None)
    return {"user": user, "access_token": access}


@api_router.post("/auth/logout")
async def logout(response: Response):
    clear_auth_cookies(response)
    return {"message": "Logged out"}


@api_router.get("/auth/me")
async def me(request: Request):
    user = await get_current_user(request, db)
    return user


@api_router.post("/auth/refresh")
async def refresh(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    payload = decode_token(token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid token type")
    user = await db.users.find_one({"id": payload["sub"]})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    access = create_access_token(user["id"], user["email"], user.get("role", "user"))
    new_refresh = create_refresh_token(user["id"])
    set_auth_cookies(response, access, new_refresh)
    return {"message": "refreshed"}


# ============================ CATEGORIES ============================
@api_router.get("/categories")
async def list_categories(section: Optional[str] = None, sub_section: Optional[str] = None):
    q = {}
    if section:
        q["section"] = section
    if sub_section:
        q["sub_section"] = sub_section
    cats = await db.categories.find(q).sort("name", 1).to_list(1000)
    return [strip_mongo_id(c) for c in cats]


@api_router.post("/categories")
async def create_category(payload: CategoryCreate, request: Request):
    await require_admin(request, db)
    doc = Category(
        name=payload.name,
        slug=f"{payload.section}-{payload.sub_section}-{slugify(payload.name)}",
        section=payload.section,
        sub_section=payload.sub_section,
    ).model_dump()
    await db.categories.insert_one(doc)
    return strip_mongo_id(doc)


@api_router.delete("/categories/{cat_id}")
async def delete_category(cat_id: str, request: Request):
    await require_admin(request, db)
    result = await db.categories.delete_one({"id": cat_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "deleted"}


# ============================ PRODUCTS ============================
@api_router.get("/products")
async def list_products(
    section: Optional[str] = None,
    sub_section: Optional[str] = None,
    category_id: Optional[str] = None,
    featured: Optional[bool] = None,
    is_active: Optional[bool] = True,
    search: Optional[str] = None,
    limit: int = 100,
):
    q = {}
    if section:
        q["section"] = section
    if sub_section:
        q["sub_section"] = sub_section
    if category_id:
        q["category_id"] = category_id
    if featured is not None:
        q["is_featured"] = featured
    if is_active is not None:
        q["is_active"] = is_active
    if search:
        q["name"] = {"$regex": search, "$options": "i"}
    products = await db.products.find(q).sort("created_at", -1).to_list(limit)
    return [strip_mongo_id(p) for p in products]


@api_router.get("/products/{id_or_slug}")
async def get_product(id_or_slug: str):
    doc = await db.products.find_one({"$or": [{"id": id_or_slug}, {"slug": id_or_slug}]})
    if not doc:
        raise HTTPException(status_code=404, detail="Product not found")
    return strip_mongo_id(doc)


@api_router.post("/products")
async def create_product(payload: ProductCreate, request: Request):
    await require_admin(request, db)
    slug = await gen_unique_slug(payload.name)
    product = Product(slug=slug, **payload.model_dump())
    await db.products.insert_one(product.model_dump())
    return product.model_dump()


@api_router.put("/products/{product_id}")
async def update_product(product_id: str, payload: ProductUpdate, request: Request):
    await require_admin(request, db)
    existing = await db.products.find_one({"id": product_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if "name" in updates and updates["name"] != existing.get("name"):
        updates["slug"] = await gen_unique_slug(updates["name"], exclude_id=product_id)
    updates["updated_at"] = now_iso()
    await db.products.update_one({"id": product_id}, {"$set": updates})
    doc = await db.products.find_one({"id": product_id})
    return strip_mongo_id(doc)


@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, request: Request):
    await require_admin(request, db)
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "deleted"}


# ============================ UPLOAD / MEDIA LIBRARY ============================
ALLOWED_EXT = {"jpg", "jpeg", "png", "webp", "gif"}
MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10MB


async def _save_upload(file: UploadFile) -> dict:
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing filename")
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_EXT:
        raise HTTPException(status_code=400, detail=f"Unsupported file type. Allowed: {sorted(ALLOWED_EXT)}")
    data = await file.read()
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")
    name = f"{uuid.uuid4()}.{ext}"
    dest = UPLOAD_DIR / name
    dest.write_bytes(data)
    url = f"/api/uploads/{name}"

    # Insert into media library
    media = MediaItem(
        url=url,
        filename=file.filename,
        content_type=file.content_type or f"image/{ext}",
        size=len(data),
    ).model_dump()
    await db.media.insert_one(media)
    media.pop("_id", None)
    return media


@api_router.post("/upload")
async def upload_image(request: Request, file: UploadFile = File(...)):
    """Legacy single-file upload (keeps backward compat) — also records to media library."""
    await require_admin(request, db)
    media = await _save_upload(file)
    return {"url": media["url"], "filename": media["filename"], "size": media["size"], "id": media["id"]}


@api_router.post("/media")
async def upload_media(request: Request, file: UploadFile = File(...)):
    await require_admin(request, db)
    media = await _save_upload(file)
    return media


@api_router.post("/media/bulk")
async def upload_media_bulk(request: Request, files: List[UploadFile] = File(...)):
    await require_admin(request, db)
    results = []
    for f in files:
        try:
            results.append(await _save_upload(f))
        except HTTPException as e:
            results.append({"error": e.detail, "filename": f.filename})
    return {"items": results}


@api_router.get("/media")
async def list_media(request: Request, limit: int = 200, search: Optional[str] = None):
    await require_admin(request, db)
    q = {}
    if search:
        q["$or"] = [
            {"filename": {"$regex": search, "$options": "i"}},
            {"alt_text": {"$regex": search, "$options": "i"}},
            {"tags": {"$in": [search.lower()]}},
        ]
    items = await db.media.find(q).sort("created_at", -1).to_list(limit)
    return [strip_mongo_id(i) for i in items]


@api_router.patch("/media/{media_id}")
async def update_media(media_id: str, payload: MediaUpdate, request: Request):
    await require_admin(request, db)
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await db.media.update_one({"id": media_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Media not found")
    doc = await db.media.find_one({"id": media_id})
    return strip_mongo_id(doc)


@api_router.delete("/media/{media_id}")
async def delete_media(media_id: str, request: Request):
    await require_admin(request, db)
    doc = await db.media.find_one({"id": media_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Media not found")
    # delete file from disk (best-effort)
    try:
        name = doc["url"].rsplit("/", 1)[-1]
        path = UPLOAD_DIR / name
        if path.exists():
            path.unlink()
    except Exception as e:
        logger.warning(f"Failed to delete file: {e}")
    await db.media.delete_one({"id": media_id})
    return {"message": "deleted"}


# ============================ CONTENT BLOCKS (CMS) ============================
@api_router.get("/content/{key}")
async def get_content(key: str):
    doc = await db.content.find_one({"key": key})
    if not doc:
        return {"key": key, "data": {}}
    return strip_mongo_id(doc)


@api_router.get("/content")
async def list_content():
    docs = await db.content.find().to_list(100)
    return {d["key"]: strip_mongo_id(d) for d in docs}


@api_router.put("/content/{key}")
async def update_content(key: str, payload: ContentUpdate, request: Request):
    await require_admin(request, db)
    doc = {"key": key, "data": payload.data, "updated_at": now_iso()}
    await db.content.update_one({"key": key}, {"$set": doc}, upsert=True)
    return doc


# ============================ SETTINGS ============================
@api_router.get("/settings")
async def get_settings():
    doc = await db.settings.find_one({"id": "settings"})
    if not doc:
        default = Settings().model_dump()
        await db.settings.insert_one(default)
        return default
    return strip_mongo_id(doc)


@api_router.put("/settings")
async def update_settings(payload: SettingsUpdate, request: Request):
    await require_admin(request, db)
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    updates["updated_at"] = now_iso()
    await db.settings.update_one({"id": "settings"}, {"$set": updates}, upsert=True)
    doc = await db.settings.find_one({"id": "settings"})
    return strip_mongo_id(doc)


# ============================ COUPONS ============================
async def _calc_discount(coupon: dict, subtotal: float) -> float:
    if coupon["discount_type"] == "percent":
        discount = subtotal * (coupon["discount_value"] / 100.0)
    else:
        discount = float(coupon["discount_value"])
    if coupon.get("max_discount"):
        discount = min(discount, float(coupon["max_discount"]))
    return round(min(discount, subtotal), 2)


async def _validate_coupon(code: str, subtotal: float) -> dict:
    coupon = await db.coupons.find_one({"code": code.upper()})
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    if not coupon.get("is_active", True):
        raise HTTPException(status_code=400, detail="Coupon is inactive")
    if coupon.get("expires_at"):
        if datetime.now(timezone.utc).isoformat() > coupon["expires_at"]:
            raise HTTPException(status_code=400, detail="Coupon expired")
    if coupon.get("usage_limit") and coupon.get("used_count", 0) >= coupon["usage_limit"]:
        raise HTTPException(status_code=400, detail="Coupon usage limit reached")
    if subtotal < coupon.get("min_subtotal", 0):
        raise HTTPException(status_code=400, detail=f"Order must be at least Rs. {coupon['min_subtotal']:.0f}")
    return coupon


@api_router.get("/coupons/validate")
async def validate_coupon(code: str, subtotal: float):
    coupon = await _validate_coupon(code, subtotal)
    discount = await _calc_discount(coupon, subtotal)
    return {
        "code": coupon["code"],
        "discount": discount,
        "discount_type": coupon["discount_type"],
        "discount_value": coupon["discount_value"],
    }


@api_router.get("/coupons")
async def list_coupons(request: Request):
    await require_admin(request, db)
    docs = await db.coupons.find().sort("created_at", -1).to_list(500)
    return [strip_mongo_id(d) for d in docs]


@api_router.post("/coupons")
async def create_coupon(payload: CouponCreate, request: Request):
    await require_admin(request, db)
    payload_dict = payload.model_dump()
    payload_dict["code"] = payload_dict["code"].upper()
    existing = await db.coupons.find_one({"code": payload_dict["code"]})
    if existing:
        raise HTTPException(status_code=400, detail="Coupon code already exists")
    coupon = Coupon(**payload_dict).model_dump()
    await db.coupons.insert_one(coupon)
    coupon.pop("_id", None)
    return coupon


@api_router.delete("/coupons/{coupon_id}")
async def delete_coupon(coupon_id: str, request: Request):
    await require_admin(request, db)
    result = await db.coupons.delete_one({"id": coupon_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Coupon not found")
    return {"message": "deleted"}


# ============================ CUSTOMER AUTH ============================
@api_router.post("/customer/auth/signup")
async def customer_signup(payload: CustomerSignup, response: Response):
    email = payload.email.lower()
    if await db.customers.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Account already exists with this email")
    customer = Customer(email=email, name=payload.name, phone=payload.phone).model_dump()
    customer["password_hash"] = hash_password(payload.password)
    await db.customers.insert_one(customer)
    access = create_access_token(customer["id"], customer["email"], "customer")
    refresh = create_refresh_token(customer["id"])
    set_auth_cookies(response, access, refresh)
    customer.pop("password_hash", None)
    customer.pop("_id", None)
    return {"user": customer, "access_token": access}


@api_router.post("/customer/auth/login")
async def customer_login(payload: LoginInput, response: Response):
    email = payload.email.lower()
    customer = await db.customers.find_one({"email": email})
    if not customer or not verify_password(payload.password, customer["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    access = create_access_token(customer["id"], customer["email"], "customer")
    refresh = create_refresh_token(customer["id"])
    set_auth_cookies(response, access, refresh)
    customer.pop("password_hash", None)
    customer.pop("_id", None)
    return {"user": customer, "access_token": access}


@api_router.post("/customer/auth/logout")
async def customer_logout(response: Response):
    clear_auth_cookies(response)
    return {"message": "Logged out"}


@api_router.get("/customer/auth/me")
async def customer_me(request: Request):
    return await get_current_customer(request, db)


@api_router.get("/customer/orders")
async def my_orders(request: Request):
    customer = await get_current_customer(request, db)
    if customer.get("role") == "admin":
        raise HTTPException(status_code=403, detail="Admins should use /api/orders")
    orders = await db.orders.find({"customer_id": customer["id"]}).sort("created_at", -1).to_list(200)
    return [strip_mongo_id(o) for o in orders]


# ============================ REVIEWS ============================
async def _recompute_product_rating(product_id: str) -> None:
    reviews = await db.reviews.find({"product_id": product_id, "is_approved": True}).to_list(1000)
    if not reviews:
        await db.products.update_one({"id": product_id}, {"$set": {"avg_rating": 0, "review_count": 0}})
        return
    avg = sum(r["rating"] for r in reviews) / len(reviews)
    await db.products.update_one(
        {"id": product_id},
        {"$set": {"avg_rating": round(avg, 2), "review_count": len(reviews)}},
    )


@api_router.get("/reviews")
async def list_reviews(product_id: Optional[str] = None, limit: int = 100):
    q = {"is_approved": True}
    if product_id:
        q["product_id"] = product_id
    reviews = await db.reviews.find(q).sort("created_at", -1).to_list(limit)
    return [strip_mongo_id(r) for r in reviews]


@api_router.post("/reviews")
async def create_review(payload: ReviewCreate, request: Request):
    customer = await get_current_customer(request, db)
    if customer.get("role") == "admin":
        raise HTTPException(status_code=400, detail="Admin cannot post customer reviews")
    if payload.rating < 1 or payload.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    product = await db.products.find_one({"id": payload.product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    # One review per customer per product
    existing = await db.reviews.find_one({"product_id": payload.product_id, "customer_id": customer["id"]})
    if existing:
        await db.reviews.update_one(
            {"id": existing["id"]},
            {"$set": {
                "rating": payload.rating,
                "title": payload.title,
                "comment": payload.comment,
                "created_at": now_iso(),
            }},
        )
        review_id = existing["id"]
    else:
        review = Review(
            product_id=payload.product_id,
            customer_id=customer["id"],
            customer_name=customer["name"],
            rating=payload.rating,
            title=payload.title,
            comment=payload.comment,
        ).model_dump()
        await db.reviews.insert_one(review)
        review_id = review["id"]
    await _recompute_product_rating(payload.product_id)
    doc = await db.reviews.find_one({"id": review_id})
    return strip_mongo_id(doc)


@api_router.delete("/reviews/{review_id}")
async def delete_review(review_id: str, request: Request):
    """Admin can delete any review; customer can delete their own."""
    token = get_token_from_request(request)
    payload = decode_token(token)
    review = await db.reviews.find_one({"id": review_id})
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if payload.get("role") != "admin" and review.get("customer_id") != payload.get("sub"):
        raise HTTPException(status_code=403, detail="Not allowed")
    await db.reviews.delete_one({"id": review_id})
    await _recompute_product_rating(review["product_id"])
    return {"message": "deleted"}


# ============================ ORDERS ============================
@api_router.post("/orders")
async def create_order(payload: OrderCreate, request: Request):
    settings_doc = await db.settings.find_one({"id": "settings"}) or Settings().model_dump()
    methods = settings_doc.get("payment_methods", {})
    if not methods.get(payload.payment_method, False):
        raise HTTPException(status_code=400, detail="Selected payment method is not enabled")

    # Verify items + decrement inventory (best-effort, non-blocking if stock=0 means made-to-order)
    for item in payload.items:
        product = await db.products.find_one({"id": item.product_id})
        if not product:
            raise HTTPException(status_code=400, detail=f"Product not found: {item.name}")
        if not product.get("is_active", True):
            raise HTTPException(status_code=400, detail=f"Product unavailable: {item.name}")
        # Only enforce stock if it's tracked (>0). If stock is 0, treat as made-to-order/unlimited.
        if product.get("stock", 0) > 0 and product["stock"] < item.quantity:
            raise HTTPException(status_code=400, detail=f"Not enough stock for {item.name}")

    subtotal = sum(item.price * item.quantity for item in payload.items)

    # Coupon
    discount = 0.0
    coupon_doc = None
    if payload.coupon_code:
        coupon_doc = await _validate_coupon(payload.coupon_code, subtotal)
        discount = await _calc_discount(coupon_doc, subtotal)

    shipping_fee = 0.0 if (subtotal - discount) >= settings_doc.get("free_shipping_above", 5000) else settings_doc.get("shipping_fee", 200)
    total = max(0.0, subtotal - discount + shipping_fee)
    order_number = await gen_order_number()

    # Optional customer id (if logged in via Bearer/cookie as customer)
    customer_id = None
    try:
        cust = await get_current_customer(request, db)
        if cust.get("role") == "customer":
            customer_id = cust["id"]
    except Exception:
        pass

    order = Order(
        order_number=order_number,
        items=payload.items,
        customer=payload.customer,
        customer_id=customer_id,
        subtotal=subtotal,
        discount=discount,
        coupon_code=coupon_doc["code"] if coupon_doc else None,
        shipping_fee=shipping_fee,
        total=total,
        payment_method=payload.payment_method,
        payment_status="confirmed" if payload.payment_method == "cod" else "pending",
    )
    await db.orders.insert_one(order.model_dump())

    # Decrement inventory (only for tracked items)
    for item in payload.items:
        await db.products.update_one(
            {"id": item.product_id, "stock": {"$gt": 0}},
            {"$inc": {"stock": -item.quantity}},
        )

    # Increment coupon usage
    if coupon_doc:
        await db.coupons.update_one({"id": coupon_doc["id"]}, {"$inc": {"used_count": 1}})

    return order.model_dump()


@api_router.get("/orders")
async def list_orders(request: Request, status: Optional[str] = None, limit: int = 200):
    await require_admin(request, db)
    q = {}
    if status:
        q["status"] = status
    orders = await db.orders.find(q).sort("created_at", -1).to_list(limit)
    return [strip_mongo_id(o) for o in orders]


@api_router.patch("/orders/{order_id}")
async def update_order_status(order_id: str, payload: OrderStatusUpdate, request: Request):
    await require_admin(request, db)
    result = await db.orders.update_one({"id": order_id}, {"$set": {"status": payload.status}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    doc = await db.orders.find_one({"id": order_id})
    return strip_mongo_id(doc)


@api_router.patch("/orders/{order_id}/payment")
async def update_payment_status(order_id: str, payload: PaymentStatusUpdate, request: Request):
    await require_admin(request, db)
    updates = {"payment_status": payload.payment_status}
    if payload.payment_reference is not None:
        updates["payment_reference"] = payload.payment_reference
    result = await db.orders.update_one({"id": order_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    doc = await db.orders.find_one({"id": order_id})
    return strip_mongo_id(doc)


# ============================ HEALTH ============================
@api_router.get("/")
async def root():
    return {"name": "Zamn Naturals API", "status": "ok"}


# Mount router
app.include_router(api_router)

# Mount static uploads under /api/uploads so it goes through ingress
app.mount("/api/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")


# CORS — allow any preview/preview-fork host with credentials by using a regex
cors_origins_env = os.environ.get("CORS_ORIGINS", "")
frontend_url = os.environ.get("FRONTEND_URL", "")

if cors_origins_env and cors_origins_env != "*":
    cors_origins = [o.strip() for o in cors_origins_env.split(",") if o.strip()]
    cors_kwargs = {"allow_origins": cors_origins}
else:
    # Reflect any origin so cookies + credentials work across forked preview URLs.
    cors_kwargs = {"allow_origin_regex": ".*"}

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    **cors_kwargs,
)


@app.on_event("startup")
async def on_startup():
    try:
        await seed_all(db)
        logger.info("Seeding complete")
    except Exception as e:
        logger.exception(f"Seeding failed: {e}")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
