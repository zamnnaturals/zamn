from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Literal
from datetime import datetime, timezone
import uuid


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_id() -> str:
    return str(uuid.uuid4())


Section = Literal["women", "men", "kids"]
SubSection = Literal["skincare", "cosmetics"]


# ----- Auth -----
class LoginInput(BaseModel):
    email: EmailStr
    password: str


# ----- Category -----
class CategoryCreate(BaseModel):
    name: str
    section: Section
    sub_section: SubSection


class Category(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=new_id)
    name: str
    slug: str
    section: Section
    sub_section: SubSection
    created_at: str = Field(default_factory=now_iso)


# ----- Product -----
class ProductCreate(BaseModel):
    name: str
    description: str = ""
    price: float
    compare_at_price: Optional[float] = None
    images: List[str] = []
    section: Section
    sub_section: SubSection
    category_id: Optional[str] = None
    category_name: Optional[str] = None
    stock: int = 0
    sku: Optional[str] = None
    is_active: bool = True
    is_featured: bool = False
    badge: Optional[str] = None  # e.g., "New", "Bestseller"


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    compare_at_price: Optional[float] = None
    images: Optional[List[str]] = None
    section: Optional[Section] = None
    sub_section: Optional[SubSection] = None
    category_id: Optional[str] = None
    category_name: Optional[str] = None
    stock: Optional[int] = None
    sku: Optional[str] = None
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None
    badge: Optional[str] = None


class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=new_id)
    name: str
    slug: str
    description: str = ""
    price: float
    compare_at_price: Optional[float] = None
    images: List[str] = []
    section: Section
    sub_section: SubSection
    category_id: Optional[str] = None
    category_name: Optional[str] = None
    stock: int = 0
    sku: Optional[str] = None
    is_active: bool = True
    is_featured: bool = False
    badge: Optional[str] = None
    created_at: str = Field(default_factory=now_iso)
    updated_at: str = Field(default_factory=now_iso)


# ----- Settings -----
class ContactInfo(BaseModel):
    whatsapp: str = "+92 300 0000000"
    phone: str = "+92 300 0000000"
    email: str = "hello@zamnnaturals.com"
    address: str = "Lahore, Pakistan"


class SocialLinks(BaseModel):
    instagram: str = ""
    facebook: str = ""
    tiktok: str = ""
    youtube: str = ""


class PaymentMethods(BaseModel):
    cod: bool = True
    whatsapp_order: bool = True
    easypaisa: bool = False
    jazzcash: bool = False
    stripe: bool = False


class Settings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "settings"
    brand_name: str = "Zamn Naturals"
    tagline: str = "Natural & Herbal Beauty for Everyone"
    contact: ContactInfo = Field(default_factory=ContactInfo)
    social: SocialLinks = Field(default_factory=SocialLinks)
    payment_methods: PaymentMethods = Field(default_factory=PaymentMethods)
    currency: str = "PKR"
    currency_symbol: str = "Rs."
    shipping_fee: float = 200.0
    free_shipping_above: float = 5000.0
    updated_at: str = Field(default_factory=now_iso)


class SettingsUpdate(BaseModel):
    brand_name: Optional[str] = None
    tagline: Optional[str] = None
    contact: Optional[ContactInfo] = None
    social: Optional[SocialLinks] = None
    payment_methods: Optional[PaymentMethods] = None
    currency: Optional[str] = None
    currency_symbol: Optional[str] = None
    shipping_fee: Optional[float] = None
    free_shipping_above: Optional[float] = None


# ----- Order -----
class OrderItem(BaseModel):
    product_id: str
    name: str
    price: float
    quantity: int
    image: Optional[str] = None


class CustomerInfo(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    address: str
    city: str
    notes: Optional[str] = None


class OrderCreate(BaseModel):
    items: List[OrderItem]
    customer: CustomerInfo
    payment_method: Literal["cod", "whatsapp", "easypaisa", "jazzcash", "stripe"] = "cod"


class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=new_id)
    order_number: str
    items: List[OrderItem]
    customer: CustomerInfo
    subtotal: float
    shipping_fee: float
    total: float
    payment_method: str
    status: Literal["pending", "confirmed", "shipped", "delivered", "cancelled"] = "pending"
    created_at: str = Field(default_factory=now_iso)


class OrderStatusUpdate(BaseModel):
    status: Literal["pending", "confirmed", "shipped", "delivered", "cancelled"]
