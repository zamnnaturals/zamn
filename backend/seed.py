"""Idempotent seeding of admin user, default settings, default categories, and demo products."""
import os
from datetime import datetime, timezone
from auth import hash_password, verify_password
from models import Settings, now_iso

DEFAULT_CATEGORIES = [
    # Women - Skincare
    ("Herbal Skincare", "women", "skincare"),
    ("Serum", "women", "skincare"),
    ("Moisturizer", "women", "skincare"),
    ("Lotion", "women", "skincare"),
    ("Sunscreen", "women", "skincare"),
    ("Face Wash", "women", "skincare"),
    ("Herbal Shampoo", "women", "skincare"),
    ("Herbal Oil", "women", "skincare"),
    ("Herbal Body Oil", "women", "skincare"),
    ("Herbal Body Wash", "women", "skincare"),
    # Women - Cosmetics
    ("Herbal Medicated Lipstick", "women", "cosmetics"),
    ("Lip Tint", "women", "cosmetics"),
    ("Chemical-Free Foundation", "women", "cosmetics"),
    ("BB Cream", "women", "cosmetics"),
    # Men - Skincare
    ("Serum", "men", "skincare"),
    ("Moisturizer", "men", "skincare"),
    ("Lotion", "men", "skincare"),
    ("Sunscreen", "men", "skincare"),
    ("Face Wash", "men", "skincare"),
    ("Herbal Shampoo", "men", "skincare"),
    ("Medicated Herbal Shampoo", "men", "skincare"),
    ("Hair Oil", "men", "skincare"),
    ("Body Oil", "men", "skincare"),
    ("Body Wash", "men", "skincare"),
    # Men - Cosmetics
    ("BB Glow Foundation", "men", "cosmetics"),
    ("Medicated Hair Dye", "men", "cosmetics"),
    # Kids - Skincare
    ("Sunscreen", "kids", "skincare"),
    ("Body Wash", "kids", "skincare"),
    ("Moisturizer", "kids", "skincare"),
    ("Lotion", "kids", "skincare"),
    # Kids - Cosmetics
    ("Cheek Tint", "kids", "cosmetics"),
    ("Blush Tint", "kids", "cosmetics"),
    ("Lip Gloss", "kids", "cosmetics"),
]


DEMO_PRODUCTS = [
    {
        "name": "Rosehip Radiance Serum",
        "description": "A potent herbal serum infused with rosehip, vitamin C, and natural botanicals to brighten and rejuvenate your skin.",
        "price": 2499.0,
        "compare_at_price": 2999.0,
        "section": "women",
        "sub_section": "skincare",
        "category_name": "Serum",
        "images": ["https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?q=80&w=800&auto=format&fit=crop"],
        "stock": 24,
        "is_featured": True,
        "badge": "Bestseller",
    },
    {
        "name": "Pure Argan Body Oil",
        "description": "Cold-pressed argan oil enriched with herbal extracts for silky, deeply nourished skin.",
        "price": 1899.0,
        "section": "women",
        "sub_section": "skincare",
        "category_name": "Herbal Body Oil",
        "images": ["https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=800&auto=format&fit=crop"],
        "stock": 18,
        "is_featured": True,
    },
    {
        "name": "Velvet Rose Lip Tint",
        "description": "Chemical-free, herbal-infused lip tint that gives a natural rosy flush. Long-lasting and hydrating.",
        "price": 1299.0,
        "section": "women",
        "sub_section": "cosmetics",
        "category_name": "Lip Tint",
        "images": ["https://images.unsplash.com/photo-1599305090598-fe179d501227?q=80&w=800&auto=format&fit=crop"],
        "stock": 32,
        "is_featured": True,
        "badge": "New",
    },
    {
        "name": "Activated Charcoal Face Wash",
        "description": "Deep cleansing herbal face wash with activated charcoal and neem. Refreshing for daily use.",
        "price": 1199.0,
        "section": "men",
        "sub_section": "skincare",
        "category_name": "Face Wash",
        "images": ["https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=800&auto=format&fit=crop"],
        "stock": 40,
        "is_featured": True,
    },
    {
        "name": "Argan & Amla Hair Oil",
        "description": "Strengthening hair oil with argan, amla, and traditional herbs for thicker, healthier hair.",
        "price": 1599.0,
        "section": "men",
        "sub_section": "skincare",
        "category_name": "Hair Oil",
        "images": ["https://images.unsplash.com/photo-1571781926291-c477ebfd024b?q=80&w=800&auto=format&fit=crop"],
        "stock": 22,
        "is_featured": True,
    },
    {
        "name": "Matte Finish BB Glow",
        "description": "Lightweight herbal BB glow foundation with SPF protection. Evens skin tone for a natural matte finish.",
        "price": 2199.0,
        "section": "men",
        "sub_section": "cosmetics",
        "category_name": "BB Glow Foundation",
        "images": ["https://images.unsplash.com/photo-1631730486572-226d1f595b68?q=80&w=800&auto=format&fit=crop"],
        "stock": 15,
    },
    {
        "name": "Gentle Mineral Sunscreen SPF 50",
        "description": "Ultra-gentle, mineral-based sunscreen formulated for delicate kid's skin. Reef-safe and non-greasy.",
        "price": 1499.0,
        "section": "kids",
        "sub_section": "skincare",
        "category_name": "Sunscreen",
        "images": ["https://images.unsplash.com/photo-1556228852-80b6e5eeff06?q=80&w=800&auto=format&fit=crop"],
        "stock": 30,
        "is_featured": True,
        "badge": "Safe for Kids",
    },
    {
        "name": "Berry Blush Cheek Tint",
        "description": "Soft berry-tinted herbal blush for little ones. Safe, smooth, and pediatrician-approved formula.",
        "price": 999.0,
        "section": "kids",
        "sub_section": "cosmetics",
        "category_name": "Cheek Tint",
        "images": ["https://images.unsplash.com/photo-1631214540242-4cbb3a7e1c9a?q=80&w=800&auto=format&fit=crop"],
        "stock": 28,
    },
]


def slugify(text: str) -> str:
    return "-".join(text.lower().replace("&", "and").replace("'", "").split()).strip("-")


async def seed_admin(db) -> None:
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@zamnnaturals.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "ZamnAdmin@2026")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        import uuid as _uuid
        await db.users.insert_one({
            "id": str(_uuid.uuid4()),
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "Admin",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password)}},
        )


async def seed_settings(db) -> None:
    existing = await db.settings.find_one({"id": "settings"})
    if existing is None:
        await db.settings.insert_one(Settings().model_dump())


async def seed_categories(db) -> None:
    count = await db.categories.count_documents({})
    if count > 0:
        return
    import uuid as _uuid
    docs = []
    for name, section, sub in DEFAULT_CATEGORIES:
        docs.append({
            "id": str(_uuid.uuid4()),
            "name": name,
            "slug": f"{section}-{sub}-{slugify(name)}",
            "section": section,
            "sub_section": sub,
            "created_at": now_iso(),
        })
    if docs:
        await db.categories.insert_many(docs)


async def seed_products(db) -> None:
    count = await db.products.count_documents({})
    if count > 0:
        return
    import uuid as _uuid
    docs = []
    for p in DEMO_PRODUCTS:
        slug = slugify(p["name"])
        docs.append({
            "id": str(_uuid.uuid4()),
            "slug": slug,
            "compare_at_price": None,
            "category_id": None,
            "sku": None,
            "is_active": True,
            "is_featured": False,
            "badge": None,
            "stock": 0,
            **p,
            "created_at": now_iso(),
            "updated_at": now_iso(),
        })
    if docs:
        await db.products.insert_many(docs)


async def create_indexes(db) -> None:
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.products.create_index("slug", unique=True)
    await db.products.create_index("id", unique=True)
    await db.products.create_index([("section", 1), ("sub_section", 1)])
    await db.categories.create_index("id", unique=True)
    await db.categories.create_index([("section", 1), ("sub_section", 1)])
    await db.orders.create_index("id", unique=True)
    await db.orders.create_index("order_number", unique=True)


async def run_all(db) -> None:
    await create_indexes(db)
    await seed_admin(db)
    await seed_settings(db)
    await seed_categories(db)
    await seed_products(db)
