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


# ============================ UPLOAD ============================
ALLOWED_EXT = {"jpg", "jpeg", "png", "webp", "gif"}
MAX_UPLOAD_BYTES = 5 * 1024 * 1024  # 5MB


@api_router.post("/upload")
async def upload_image(request: Request, file: UploadFile = File(...)):
    await require_admin(request, db)
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing filename")
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_EXT:
        raise HTTPException(status_code=400, detail=f"Unsupported file type. Allowed: {sorted(ALLOWED_EXT)}")
    data = await file.read()
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="File too large (max 5MB)")
    name = f"{uuid.uuid4()}.{ext}"
    dest = UPLOAD_DIR / name
    dest.write_bytes(data)
    url = f"/api/uploads/{name}"
    return {"url": url, "filename": name, "size": len(data)}


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


# ============================ ORDERS ============================
@api_router.post("/orders")
async def create_order(payload: OrderCreate):
    settings_doc = await db.settings.find_one({"id": "settings"}) or Settings().model_dump()
    methods = settings_doc.get("payment_methods", {})
    if not methods.get(payload.payment_method, False):
        raise HTTPException(status_code=400, detail="Selected payment method is not enabled")

    subtotal = sum(item.price * item.quantity for item in payload.items)
    shipping_fee = 0.0 if subtotal >= settings_doc.get("free_shipping_above", 5000) else settings_doc.get("shipping_fee", 200)
    total = subtotal + shipping_fee
    order_number = await gen_order_number()
    order = Order(
        order_number=order_number,
        items=payload.items,
        customer=payload.customer,
        subtotal=subtotal,
        shipping_fee=shipping_fee,
        total=total,
        payment_method=payload.payment_method,
    )
    await db.orders.insert_one(order.model_dump())
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


# ============================ HEALTH ============================
@api_router.get("/")
async def root():
    return {"name": "Zamn Naturals API", "status": "ok"}


# Mount router
app.include_router(api_router)

# Mount static uploads under /api/uploads so it goes through ingress
app.mount("/api/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")


# CORS — explicit origin for credentials
frontend_url = os.environ.get("FRONTEND_URL", "*")
cors_origins_env = os.environ.get("CORS_ORIGINS", "")
if cors_origins_env and cors_origins_env != "*":
    cors_origins = [o.strip() for o in cors_origins_env.split(",") if o.strip()]
else:
    cors_origins = [frontend_url] if frontend_url and frontend_url != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
