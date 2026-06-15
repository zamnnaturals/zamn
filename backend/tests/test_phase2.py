"""Phase 2 backend tests for Zamn Naturals.

Covers: CMS content blocks, media library CRUD, customer auth, coupons,
order with coupon + inventory decrement + payment statuses, reviews,
payment_instructions in settings.
"""
import io
import os
import uuid
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
    return r.json()["access_token"]


@pytest.fixture(scope="session")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope="session")
def unique_email():
    return f"test_customer_{uuid.uuid4().hex[:8]}@example.com"


@pytest.fixture(scope="session")
def customer_session(unique_email):
    """Sign up a customer and return token + user info."""
    payload = {"email": unique_email, "password": "Test@1234", "name": "TEST Customer", "phone": "+923009999999"}
    r = requests.post(f"{API}/customer/auth/signup", json=payload, timeout=20)
    assert r.status_code == 200, f"signup failed: {r.status_code} {r.text}"
    data = r.json()
    assert "access_token" in data
    assert data["user"]["email"] == unique_email
    assert data["user"]["role"] == "customer"
    return {"token": data["access_token"], "user": data["user"], "password": "Test@1234"}


@pytest.fixture(scope="session")
def customer_headers(customer_session):
    return {"Authorization": f"Bearer {customer_session['token']}"}


def _tiny_png():
    return bytes.fromhex(
        "89504E470D0A1A0A0000000D49484452000000010000000108060000001F15C4"
        "890000000A49444154789C6300010000000500010D0A2DB40000000049454E44AE426082"
    )


# ============================ CMS / Content ============================
class TestContent:
    def test_list_content_blocks(self):
        r = requests.get(f"{API}/content", timeout=20)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, dict)
        # Seeded blocks
        for key in ["hero", "values", "categories_section"]:
            assert key in data, f"missing content block: {key}"
        assert "data" in data["hero"]

    def test_get_hero_block(self):
        r = requests.get(f"{API}/content/hero", timeout=20)
        assert r.status_code == 200
        body = r.json()
        assert body["key"] == "hero"
        assert isinstance(body.get("data"), dict)
        # Common hero fields per request
        for k in ["title_top", "image_url", "primary_cta_label"]:
            assert k in body["data"], f"hero missing field {k}"

    def test_update_hero_requires_admin(self):
        r = requests.put(f"{API}/content/hero", json={"data": {"title_top": "Hacked"}}, timeout=20)
        assert r.status_code == 401

    def test_update_hero_admin(self, admin_headers):
        # snapshot
        original = requests.get(f"{API}/content/hero", timeout=20).json()["data"]
        new_data = dict(original)
        new_data["title_top"] = "TEST Hero Title"
        r = requests.put(f"{API}/content/hero", json={"data": new_data}, headers=admin_headers, timeout=20)
        assert r.status_code == 200, r.text
        # verify persisted
        g = requests.get(f"{API}/content/hero", timeout=20).json()
        assert g["data"]["title_top"] == "TEST Hero Title"
        # restore
        requests.put(f"{API}/content/hero", json={"data": original}, headers=admin_headers, timeout=20)


# ============================ Media Library ============================
class TestMedia:
    def test_media_requires_admin(self):
        r = requests.get(f"{API}/media", timeout=20)
        assert r.status_code == 401

    def test_media_upload_list_patch_delete(self, admin_headers):
        # Upload single
        files = {"file": ("test_media.png", io.BytesIO(_tiny_png()), "image/png")}
        r = requests.post(f"{API}/media", files=files, headers=admin_headers, timeout=20)
        assert r.status_code == 200, r.text
        media = r.json()
        for k in ["id", "url", "filename", "size"]:
            assert k in media
        assert media["url"].startswith("/api/uploads/")
        assert media["size"] > 0
        mid = media["id"]

        # List
        l = requests.get(f"{API}/media", headers=admin_headers, timeout=20)
        assert l.status_code == 200
        items = l.json()
        assert any(i["id"] == mid for i in items)

        # Patch
        p = requests.patch(
            f"{API}/media/{mid}",
            json={"alt_text": "TEST alt", "tags": ["test", "phase2"]},
            headers=admin_headers,
            timeout=20,
        )
        assert p.status_code == 200
        assert p.json()["alt_text"] == "TEST alt"
        assert "test" in p.json()["tags"]

        # Delete
        d = requests.delete(f"{API}/media/{mid}", headers=admin_headers, timeout=20)
        assert d.status_code == 200

        # Confirm gone
        l2 = requests.get(f"{API}/media", headers=admin_headers, timeout=20).json()
        assert not any(i["id"] == mid for i in l2)

    def test_bulk_upload(self, admin_headers):
        files = [
            ("files", ("a.png", io.BytesIO(_tiny_png()), "image/png")),
            ("files", ("b.png", io.BytesIO(_tiny_png()), "image/png")),
        ]
        r = requests.post(f"{API}/media/bulk", files=files, headers=admin_headers, timeout=30)
        assert r.status_code == 200, r.text
        body = r.json()
        assert "items" in body and len(body["items"]) == 2
        # cleanup
        for it in body["items"]:
            if "id" in it:
                requests.delete(f"{API}/media/{it['id']}", headers=admin_headers, timeout=20)


# ============================ Customer Auth ============================
class TestCustomerAuth:
    def test_signup_and_me(self, customer_session, customer_headers):
        r = requests.get(f"{API}/customer/auth/me", headers=customer_headers, timeout=20)
        assert r.status_code == 200
        body = r.json()
        assert body["email"] == customer_session["user"]["email"]
        assert body["role"] == "customer"
        assert "password_hash" not in body
        assert "_id" not in body

    def test_signup_duplicate_email(self, customer_session):
        r = requests.post(
            f"{API}/customer/auth/signup",
            json={"email": customer_session["user"]["email"], "password": "anything", "name": "dup"},
            timeout=20,
        )
        assert r.status_code == 400

    def test_customer_login(self, customer_session):
        r = requests.post(
            f"{API}/customer/auth/login",
            json={"email": customer_session["user"]["email"], "password": customer_session["password"]},
            timeout=20,
        )
        assert r.status_code == 200
        body = r.json()
        assert body["access_token"]
        assert body["user"]["email"] == customer_session["user"]["email"]

    def test_admin_cannot_login_as_customer(self):
        r = requests.post(
            f"{API}/customer/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
            timeout=20,
        )
        # admin is not in customers collection
        assert r.status_code == 401

    def test_customer_orders_empty_initially(self, customer_headers):
        r = requests.get(f"{API}/customer/orders", headers=customer_headers, timeout=20)
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# ============================ Coupons ============================
class TestCoupons:
    @pytest.fixture(scope="class")
    def coupon_id(self, admin_headers):
        # Ensure none exists
        existing = requests.get(f"{API}/coupons", headers=admin_headers, timeout=20).json()
        for c in existing:
            if c["code"] == "WELCOME10":
                requests.delete(f"{API}/coupons/{c['id']}", headers=admin_headers, timeout=20)
        r = requests.post(
            f"{API}/coupons",
            json={"code": "WELCOME10", "discount_type": "percent", "discount_value": 10},
            headers=admin_headers,
            timeout=20,
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["code"] == "WELCOME10"
        assert body["discount_value"] == 10
        yield body["id"]
        # teardown
        requests.delete(f"{API}/coupons/{body['id']}", headers=admin_headers, timeout=20)

    def test_create_requires_admin(self):
        r = requests.post(f"{API}/coupons", json={"code": "X", "discount_value": 5}, timeout=20)
        assert r.status_code == 401

    def test_validate_coupon(self, coupon_id):
        r = requests.get(f"{API}/coupons/validate", params={"code": "WELCOME10", "subtotal": 2000}, timeout=20)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["code"] == "WELCOME10"
        assert body["discount"] == 200.0

    def test_validate_unknown_coupon(self):
        r = requests.get(f"{API}/coupons/validate", params={"code": "NOPE_NOPE_NOPE", "subtotal": 1000}, timeout=20)
        assert r.status_code == 404

    def test_lowercase_code_normalized(self, coupon_id):
        # codes stored uppercase; validate accepts lowercase too
        r = requests.get(f"{API}/coupons/validate", params={"code": "welcome10", "subtotal": 1000}, timeout=20)
        # backend normalizes via .upper()
        assert r.status_code == 200


# ============================ Reviews ============================
class TestReviews:
    @pytest.fixture(scope="class")
    def product(self):
        return requests.get(f"{API}/products", timeout=20).json()[0]

    def test_review_requires_auth(self, product):
        r = requests.post(f"{API}/reviews", json={"product_id": product["id"], "rating": 5, "title": "x", "comment": "y"}, timeout=20)
        assert r.status_code == 401

    def test_create_and_update_review_is_idempotent(self, customer_headers, product):
        # first review
        r = requests.post(
            f"{API}/reviews",
            json={"product_id": product["id"], "rating": 4, "title": "TEST title", "comment": "good"},
            headers=customer_headers,
            timeout=20,
        )
        assert r.status_code == 200, r.text
        first = r.json()
        assert first["rating"] == 4
        assert first["product_id"] == product["id"]
        rid = first["id"]

        # second review by same customer → should UPDATE the first (same id)
        r2 = requests.post(
            f"{API}/reviews",
            json={"product_id": product["id"], "rating": 5, "title": "TEST updated", "comment": "great"},
            headers=customer_headers,
            timeout=20,
        )
        assert r2.status_code == 200
        second = r2.json()
        assert second["id"] == rid, "Should reuse same review id (1 per customer per product)"
        assert second["rating"] == 5

        # GET reviews
        g = requests.get(f"{API}/reviews", params={"product_id": product["id"]}, timeout=20)
        assert g.status_code == 200
        reviews = g.json()
        mine = [x for x in reviews if x["id"] == rid]
        assert len(mine) == 1
        assert mine[0]["rating"] == 5

        # Product avg rating updated
        prod = requests.get(f"{API}/products/{product['id']}", timeout=20).json()
        assert prod["avg_rating"] >= 1
        assert prod["review_count"] >= 1

        # Cleanup
        requests.delete(f"{API}/reviews/{rid}", headers=customer_headers, timeout=20)


# ============================ Settings: payment_instructions ============================
class TestPaymentInstructions:
    def test_update_payment_instructions(self, admin_headers):
        original = requests.get(f"{API}/settings", timeout=20).json()
        new_pi = {
            "easypaisa_account_name": "TEST EP",
            "easypaisa_account_number": "0300-1234567",
            "easypaisa_note": "TEST note",
            "jazzcash_account_name": "TEST JC",
            "jazzcash_account_number": "0311-7654321",
            "jazzcash_note": "TEST note jc",
        }
        r = requests.put(f"{API}/settings", json={"payment_instructions": new_pi}, headers=admin_headers, timeout=20)
        assert r.status_code == 200
        # verify
        g = requests.get(f"{API}/settings", timeout=20).json()
        pi = g.get("payment_instructions", {})
        assert pi["easypaisa_account_number"] == "0300-1234567"
        assert pi["jazzcash_account_number"] == "0311-7654321"
        # restore
        requests.put(
            f"{API}/settings",
            json={"payment_instructions": original.get("payment_instructions", {})},
            headers=admin_headers,
            timeout=20,
        )


# ============================ Orders: coupon, inventory, payments ============================
class TestOrdersPhase2:
    @pytest.fixture(scope="class")
    def stock_product(self, admin_headers):
        # create a tracked-stock product so we can verify inventory decrement
        payload = {
            "name": f"TEST_StockProd_{uuid.uuid4().hex[:6]}",
            "description": "stock tracked",
            "price": 1000.0,
            "section": "women",
            "sub_section": "skincare",
            "stock": 10,
            "is_active": True,
        }
        r = requests.post(f"{API}/products", json=payload, headers=admin_headers, timeout=20)
        assert r.status_code == 200, r.text
        prod = r.json()
        yield prod
        requests.delete(f"{API}/products/{prod['id']}", headers=admin_headers, timeout=20)

    @pytest.fixture(scope="class")
    def coupon(self, admin_headers):
        # create coupon WELCOME10
        existing = requests.get(f"{API}/coupons", headers=admin_headers, timeout=20).json()
        for c in existing:
            if c["code"] == "ORDERTEST10":
                requests.delete(f"{API}/coupons/{c['id']}", headers=admin_headers, timeout=20)
        r = requests.post(
            f"{API}/coupons",
            json={"code": "ORDERTEST10", "discount_type": "percent", "discount_value": 10},
            headers=admin_headers,
            timeout=20,
        )
        assert r.status_code == 200
        yield r.json()
        requests.delete(f"{API}/coupons/{r.json()['id']}", headers=admin_headers, timeout=20)

    def _order_payload(self, product, qty=2, payment_method="cod", coupon_code=None):
        p = {
            "items": [{"product_id": product["id"], "name": product["name"], "price": product["price"], "quantity": qty, "image": None}],
            "customer": {
                "name": "TEST",
                "phone": "+923001234567",
                "email": "test@example.com",
                "address": "House 1",
                "city": "Lahore",
                "notes": "TEST",
            },
            "payment_method": payment_method,
        }
        if coupon_code:
            p["coupon_code"] = coupon_code
        return p

    def test_order_decrements_inventory(self, stock_product, admin_headers):
        # ensure cod enabled
        requests.put(
            f"{API}/settings",
            json={"payment_methods": {"cod": True, "whatsapp_order": True, "easypaisa": True, "jazzcash": True, "stripe": False}},
            headers=admin_headers,
            timeout=20,
        )
        before = requests.get(f"{API}/products/{stock_product['id']}", timeout=20).json()["stock"]
        r = requests.post(f"{API}/orders", json=self._order_payload(stock_product, qty=2, payment_method="cod"), timeout=20)
        assert r.status_code == 200, r.text
        assert r.json()["payment_status"] == "confirmed"  # COD = confirmed
        after = requests.get(f"{API}/products/{stock_product['id']}", timeout=20).json()["stock"]
        assert after == before - 2, f"stock not decremented: before={before} after={after}"

    def test_order_with_coupon(self, stock_product, coupon):
        payload = self._order_payload(stock_product, qty=1, payment_method="cod", coupon_code="ORDERTEST10")
        subtotal = stock_product["price"]  # 1000
        r = requests.post(f"{API}/orders", json=payload, timeout=20)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["discount"] == 100.0
        assert body["coupon_code"] == "ORDERTEST10"
        assert body["subtotal"] == subtotal

    def test_easypaisa_order_pending(self, stock_product, admin_headers):
        r = requests.post(f"{API}/orders", json=self._order_payload(stock_product, qty=1, payment_method="easypaisa"), timeout=20)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["payment_method"] == "easypaisa"
        assert body["payment_status"] == "pending"
        order_id = body["id"]

        # admin updates payment status
        p = requests.patch(
            f"{API}/orders/{order_id}/payment",
            json={"payment_status": "confirmed", "payment_reference": "TXN123"},
            headers=admin_headers,
            timeout=20,
        )
        assert p.status_code == 200
        updated = p.json()
        assert updated["payment_status"] == "confirmed"
        assert updated["payment_reference"] == "TXN123"

    def test_payment_patch_requires_admin(self, stock_product):
        r = requests.post(f"{API}/orders", json=self._order_payload(stock_product, qty=1, payment_method="easypaisa"), timeout=20)
        oid = r.json()["id"]
        u = requests.patch(f"{API}/orders/{oid}/payment", json={"payment_status": "confirmed"}, timeout=20)
        assert u.status_code == 401

    def test_customer_order_appears_in_customer_orders(self, stock_product, customer_headers):
        # logged-in customer creates an order
        payload = self._order_payload(stock_product, qty=1, payment_method="cod")
        r = requests.post(f"{API}/orders", json=payload, headers=customer_headers, timeout=20)
        assert r.status_code == 200, r.text
        oid = r.json()["id"]
        # fetch from /customer/orders
        g = requests.get(f"{API}/customer/orders", headers=customer_headers, timeout=20)
        assert g.status_code == 200
        ids = [o["id"] for o in g.json()]
        assert oid in ids
