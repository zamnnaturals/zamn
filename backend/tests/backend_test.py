"""Backend API tests for Zamn Naturals luxury herbal skincare ecommerce.

Covers:
- Auth (login/me/admin guard)
- Categories CRUD
- Products CRUD + filtering + slug fetch
- Upload (admin)
- Settings (get/update + payment toggle)
- Orders (public create with payment method enforcement; admin list/patch)
"""
import io
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://herbal-luxe-3.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@zamnnaturals.com"
ADMIN_PASSWORD = "ZamnAdmin@2026"


# ----------------------- Fixtures -----------------------
@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=20)
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    data = r.json()
    assert "access_token" in data and data["access_token"]
    assert data["user"]["email"] == ADMIN_EMAIL
    assert data["user"]["role"] == "admin"
    return data["access_token"]


@pytest.fixture(scope="session")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# ----------------------- AUTH -----------------------
class TestAuth:
    def test_login_invalid(self):
        r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"}, timeout=20)
        assert r.status_code == 401

    def test_me_requires_auth(self):
        r = requests.get(f"{API}/auth/me", timeout=20)
        assert r.status_code == 401

    def test_me_with_bearer(self, admin_headers):
        r = requests.get(f"{API}/auth/me", headers=admin_headers, timeout=20)
        assert r.status_code == 200
        body = r.json()
        assert body["email"] == ADMIN_EMAIL
        assert body["role"] == "admin"
        assert "password_hash" not in body
        assert "_id" not in body


# ----------------------- PRODUCTS (public reads) -----------------------
class TestProductsPublic:
    def test_list_products(self):
        r = requests.get(f"{API}/products", timeout=20)
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list) and len(items) >= 4
        sample = items[0]
        for k in ["id", "name", "slug", "price", "section", "sub_section"]:
            assert k in sample, f"missing key {k}"
        assert "_id" not in sample

    def test_list_products_section_filter(self):
        r = requests.get(f"{API}/products", params={"section": "women"}, timeout=20)
        assert r.status_code == 200
        items = r.json()
        assert len(items) >= 1
        for p in items:
            assert p["section"] == "women"

    def test_get_product_by_slug(self):
        # use a seeded slug
        r = requests.get(f"{API}/products", timeout=20)
        slug = r.json()[0]["slug"]
        r2 = requests.get(f"{API}/products/{slug}", timeout=20)
        assert r2.status_code == 200
        assert r2.json()["slug"] == slug

    def test_get_product_not_found(self):
        r = requests.get(f"{API}/products/this-does-not-exist-xyz", timeout=20)
        assert r.status_code == 404


# ----------------------- CATEGORIES -----------------------
class TestCategories:
    def test_list_categories(self):
        r = requests.get(f"{API}/categories", timeout=20)
        assert r.status_code == 200
        cats = r.json()
        assert len(cats) > 0
        c = cats[0]
        for k in ["id", "name", "slug", "section", "sub_section"]:
            assert k in c

    def test_create_and_delete_category_admin(self, admin_headers):
        # unauth blocked
        r = requests.post(f"{API}/categories", json={"name": "TEST_Cat", "section": "women", "sub_section": "skincare"}, timeout=20)
        assert r.status_code == 401

        r = requests.post(
            f"{API}/categories",
            json={"name": "TEST_Cat", "section": "women", "sub_section": "skincare"},
            headers=admin_headers,
            timeout=20,
        )
        assert r.status_code == 200
        cat = r.json()
        assert cat["name"] == "TEST_Cat"
        cat_id = cat["id"]

        d = requests.delete(f"{API}/categories/{cat_id}", headers=admin_headers, timeout=20)
        assert d.status_code == 200


# ----------------------- SETTINGS -----------------------
class TestSettings:
    def test_get_settings(self):
        r = requests.get(f"{API}/settings", timeout=20)
        assert r.status_code == 200
        s = r.json()
        assert s["brand_name"]
        assert "payment_methods" in s
        assert "contact" in s
        for k in ["cod", "whatsapp_order", "easypaisa", "jazzcash", "stripe"]:
            assert k in s["payment_methods"]

    def test_update_settings_toggle_payment(self, admin_headers):
        # unauth blocked
        r = requests.put(f"{API}/settings", json={"shipping_fee": 250.0}, timeout=20)
        assert r.status_code == 401

        original = requests.get(f"{API}/settings", timeout=20).json()
        new_pm = dict(original["payment_methods"])
        new_pm["easypaisa"] = not new_pm.get("easypaisa", False)

        r = requests.put(
            f"{API}/settings",
            json={"payment_methods": new_pm, "shipping_fee": 250.0},
            headers=admin_headers,
            timeout=20,
        )
        assert r.status_code == 200
        updated = r.json()
        assert updated["payment_methods"]["easypaisa"] == new_pm["easypaisa"]
        assert updated["shipping_fee"] == 250.0

        # restore
        requests.put(
            f"{API}/settings",
            json={"payment_methods": original["payment_methods"], "shipping_fee": original["shipping_fee"]},
            headers=admin_headers,
            timeout=20,
        )


# ----------------------- UPLOAD -----------------------
class TestUpload:
    def _tiny_png(self):
        # 1x1 PNG
        return bytes.fromhex(
            "89504E470D0A1A0A0000000D49484452000000010000000108060000001F15C4"
            "890000000A49444154789C6300010000000500010D0A2DB40000000049454E44AE426082"
        )

    def test_upload_requires_admin(self):
        files = {"file": ("test.png", io.BytesIO(self._tiny_png()), "image/png")}
        r = requests.post(f"{API}/upload", files=files, timeout=20)
        assert r.status_code == 401

    def test_upload_and_fetch(self, admin_headers):
        files = {"file": ("test.png", io.BytesIO(self._tiny_png()), "image/png")}
        r = requests.post(f"{API}/upload", files=files, headers=admin_headers, timeout=30)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["url"].startswith("/api/uploads/")
        # GET the uploaded file via the public URL
        full_url = f"{BASE_URL}{body['url']}"
        g = requests.get(full_url, timeout=20)
        assert g.status_code == 200
        assert len(g.content) > 0


# ----------------------- PRODUCTS (admin CRUD) -----------------------
class TestProductsAdmin:
    def test_create_update_delete_product(self, admin_headers):
        # unauth blocked
        r = requests.post(f"{API}/products", json={"name": "TEST_x", "price": 10, "section": "women", "sub_section": "skincare"}, timeout=20)
        assert r.status_code == 401

        payload = {
            "name": "TEST_Lavender Cream",
            "description": "Test product",
            "price": 999.0,
            "section": "women",
            "sub_section": "skincare",
            "stock": 5,
            "is_active": True,
            "is_featured": False,
        }
        r = requests.post(f"{API}/products", json=payload, headers=admin_headers, timeout=20)
        assert r.status_code == 200, r.text
        prod = r.json()
        assert prod["name"] == payload["name"]
        assert prod["slug"]
        pid = prod["id"]

        # verify via GET by slug
        g = requests.get(f"{API}/products/{prod['slug']}", timeout=20)
        assert g.status_code == 200
        assert g.json()["price"] == 999.0

        # update
        u = requests.put(f"{API}/products/{pid}", json={"price": 1299.0, "stock": 7}, headers=admin_headers, timeout=20)
        assert u.status_code == 200
        assert u.json()["price"] == 1299.0
        assert u.json()["stock"] == 7

        # delete
        d = requests.delete(f"{API}/products/{pid}", headers=admin_headers, timeout=20)
        assert d.status_code == 200

        # confirm gone
        g2 = requests.get(f"{API}/products/{pid}", timeout=20)
        assert g2.status_code == 404


# ----------------------- ORDERS -----------------------
class TestOrders:
    @pytest.fixture(scope="class")
    def a_product(self):
        return requests.get(f"{API}/products", timeout=20).json()[0]

    def _order_payload(self, product, payment_method="cod"):
        return {
            "items": [
                {"product_id": product["id"], "name": product["name"], "price": product["price"], "quantity": 1, "image": (product.get("images") or [None])[0]}
            ],
            "customer": {
                "name": "TEST Customer",
                "phone": "+923001234567",
                "email": "test@example.com",
                "address": "House 1, Street 1",
                "city": "Lahore",
                "notes": "TEST order",
            },
            "payment_method": payment_method,
        }

    def test_create_cod_order_success(self, a_product, admin_headers):
        # ensure cod is enabled
        requests.put(f"{API}/settings", json={"payment_methods": {"cod": True, "whatsapp_order": True, "easypaisa": False, "jazzcash": False, "stripe": False}}, headers=admin_headers, timeout=20)
        r = requests.post(f"{API}/orders", json=self._order_payload(a_product, "cod"), timeout=20)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["order_number"].startswith("ZN-")
        assert body["payment_method"] == "cod"
        assert body["subtotal"] == a_product["price"]
        assert body["total"] == body["subtotal"] + body["shipping_fee"]

        # admin can list
        l = requests.get(f"{API}/orders", headers=admin_headers, timeout=20)
        assert l.status_code == 200
        orders = l.json()
        assert any(o["id"] == body["id"] for o in orders)

        # patch status
        p = requests.patch(f"{API}/orders/{body['id']}", json={"status": "confirmed"}, headers=admin_headers, timeout=20)
        assert p.status_code == 200
        assert p.json()["status"] == "confirmed"

    def test_create_order_rejects_disabled_method(self, a_product, admin_headers):
        # disable cod, try cod
        requests.put(f"{API}/settings", json={"payment_methods": {"cod": False, "whatsapp_order": True, "easypaisa": False, "jazzcash": False, "stripe": False}}, headers=admin_headers, timeout=20)
        r = requests.post(f"{API}/orders", json=self._order_payload(a_product, "cod"), timeout=20)
        assert r.status_code == 400
        # restore
        requests.put(f"{API}/settings", json={"payment_methods": {"cod": True, "whatsapp_order": True, "easypaisa": False, "jazzcash": False, "stripe": False}}, headers=admin_headers, timeout=20)

    def test_orders_admin_only(self):
        r = requests.get(f"{API}/orders", timeout=20)
        assert r.status_code == 401
