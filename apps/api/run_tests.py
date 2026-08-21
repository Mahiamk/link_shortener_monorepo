import os
import sys
import unittest

# Setup in-memory SQLite for testing
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["SECRET_KEY"] = "test-secret-key-for-unit-testing-32-chars-long-min!"
os.environ["ALGORITHM"] = "HS256"
os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"] = "60"
os.environ["SUPERUSER_EMAILS"] = "admin@example.com"

from starlette.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.database import Base, get_db
from app.db import models
from app.core.security import get_password_hash, create_access_token

engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

class TestSecurityAndAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app, raise_server_exceptions=False)

    def setUp(self):
        Base.metadata.create_all(bind=engine)
        self.db = TestingSessionLocal()

        # Users
        self.user_a = models.User(
            id=1,
            email="usera@example.com",
            hashed_password=get_password_hash("password123"),
            is_active=True,
            is_superuser=False
        )
        self.user_b = models.User(
            id=2,
            email="userb@example.com",
            hashed_password=get_password_hash("password123"),
            is_active=True,
            is_superuser=False
        )
        self.admin_user = models.User(
            id=3,
            email="admin@example.com",
            hashed_password=get_password_hash("adminpass123"),
            is_active=True,
            is_superuser=True
        )
        self.db.add_all([self.user_a, self.user_b, self.admin_user])
        self.db.commit()

        # Links
        self.link_a = models.Link(
            id=1,
            original_url="https://example.com/user-a-link",
            short_code="linkA1",
            owner_id=1
        )
        self.link_b = models.Link(
            id=2,
            original_url="https://example.com/user-b-link",
            short_code="linkB2",
            owner_id=2
        )
        self.link_pub = models.Link(
            id=3,
            original_url="https://example.com/public-link",
            short_code="linkPub3",
            owner_id=None
        )
        self.db.add_all([self.link_a, self.link_b, self.link_pub])
        self.db.commit()

        self.token_user_a = create_access_token({"sub": "usera@example.com"})
        self.token_user_b = create_access_token({"sub": "userb@example.com"})
        self.token_admin = create_access_token({"sub": "admin@example.com"})

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(bind=engine)

    # --------------------------------------------------------------------------
    # 1. Information Disclosure & Exception Handling Tests
    # --------------------------------------------------------------------------
    def test_unhandled_exception_returns_generic_message(self):
        """Ensure 500 errors NEVER expose tracebacks or internal details."""
        from unittest.mock import patch
        with patch("app.crud.get_link_count", side_effect=RuntimeError("Sensitive database host 10.0.0.1 failed on /var/secrets/key.pem")):
            res = self.client.get("/links/public/stats")
            self.assertEqual(res.status_code, 500)
            data = res.json()
            self.assertEqual(data, {"detail": "Internal server error"})
            self.assertNotIn("Traceback", res.text)
            self.assertNotIn("Sensitive", res.text)
            self.assertNotIn("/var/secrets", res.text)

    def test_invalid_validation_request_clean_response(self):
        """Ensure validation errors do not leak stack traces."""
        res = self.client.post("/auth/register", json={"email": "not-an-email", "password": "123"})
        self.assertIn(res.status_code, (400, 422))
        self.assertNotIn("Traceback", res.text)

    # --------------------------------------------------------------------------
    # 2. Response Validation & Missing / Null Owner Handling
    # --------------------------------------------------------------------------
    def test_admin_get_all_links_with_null_and_valid_owners(self):
        """
        Ensure /admin/links serializes both legitimate owned links and public/null owner links
        without throwing 500 ResponseValidationError.
        """
        res = self.client.get("/admin/links", headers={"Authorization": f"Bearer {self.token_admin}"})
        self.assertEqual(res.status_code, 200)
        links = res.json()
        self.assertEqual(len(links), 3)

        owned_link = next(l for l in links if l["id"] == 1)
        self.assertEqual(owned_link["owner_id"], 1)
        self.assertIsNotNone(owned_link["owner"])
        self.assertEqual(owned_link["owner"]["email"], "usera@example.com")

        public_link = next(l for l in links if l["id"] == 3)
        self.assertIsNone(public_link["owner_id"])
        self.assertIsNone(public_link["owner"])

    def test_user_links_returns_only_valid_user_data(self):
        """User A's /links/ route returns their links cleanly."""
        res = self.client.get("/links/", headers={"Authorization": f"Bearer {self.token_user_a}"})
        self.assertEqual(res.status_code, 200)
        links = res.json()
        self.assertEqual(len(links), 1)
        self.assertEqual(links[0]["id"], 1)
        self.assertEqual(links[0]["owner_id"], 1)

    # --------------------------------------------------------------------------
    # 3. Authentication Tests
    # --------------------------------------------------------------------------
    def test_unauthenticated_requests_return_401(self):
        """Protected endpoints return 401 when unauthenticated."""
        self.assertEqual(self.client.get("/links/").status_code, 401)
        self.assertEqual(self.client.get("/auth/me").status_code, 401)
        self.assertEqual(self.client.get("/admin/stats").status_code, 401)
        self.assertEqual(self.client.get("/admin/users").status_code, 401)
        self.assertEqual(self.client.get("/admin/links").status_code, 401)
        self.assertEqual(self.client.get("/api/contact-submissions/").status_code, 401)

    def test_valid_login_and_me_endpoint(self):
        """Test /auth/token and /auth/me."""
        login_res = self.client.post("/auth/token", data={"username": "usera@example.com", "password": "password123"})
        self.assertEqual(login_res.status_code, 200)
        self.assertIn("access_token", login_res.json())

        me_res = self.client.get("/auth/me", headers={"Authorization": f"Bearer {self.token_user_a}"})
        self.assertEqual(me_res.status_code, 200)
        self.assertEqual(me_res.json()["email"], "usera@example.com")

    # --------------------------------------------------------------------------
    # 4. Authorization / BOLA / IDOR Protection Tests
    # --------------------------------------------------------------------------
    def test_user_a_cannot_access_user_b_links(self):
        """User A cannot see User B's links on /links/."""
        res = self.client.get("/links/", headers={"Authorization": f"Bearer {self.token_user_a}"})
        self.assertEqual(res.status_code, 200)
        link_ids = [l["id"] for l in res.json()]
        self.assertIn(1, link_ids)
        self.assertNotIn(2, link_ids)

    def test_user_a_cannot_delete_user_b_link(self):
        """User A cannot delete User B's link (IDOR protection)."""
        res = self.client.delete("/links/2", headers={"Authorization": f"Bearer {self.token_user_a}"})
        self.assertEqual(res.status_code, 404)

    def test_user_a_cannot_view_user_b_stats(self):
        """User A cannot view stats of User B's link."""
        res = self.client.get("/links/2/stats", headers={"Authorization": f"Bearer {self.token_user_a}"})
        self.assertEqual(res.status_code, 404)

    def test_non_admin_cannot_access_admin_endpoints(self):
        """Normal user cannot access /admin/ endpoints (403 Forbidden)."""
        self.assertEqual(self.client.get("/admin/stats", headers={"Authorization": f"Bearer {self.token_user_a}"}).status_code, 403)
        self.assertEqual(self.client.get("/admin/users", headers={"Authorization": f"Bearer {self.token_user_a}"}).status_code, 403)
        self.assertEqual(self.client.get("/admin/links", headers={"Authorization": f"Bearer {self.token_user_a}"}).status_code, 403)
        self.assertEqual(self.client.get("/api/contact-submissions/", headers={"Authorization": f"Bearer {self.token_user_a}"}).status_code, 403)

    def test_admin_cannot_deactivate_or_delete_self(self):
        """Admin cannot deactivate or delete their own account."""
        res_deact = self.client.patch(
            "/admin/users/3",
            json={"is_active": False},
            headers={"Authorization": f"Bearer {self.token_admin}"}
        )
        self.assertEqual(res_deact.status_code, 400)

        res_del = self.client.delete(
            "/admin/users/3",
            headers={"Authorization": f"Bearer {self.token_admin}"}
        )
        self.assertEqual(res_del.status_code, 400)

    # --------------------------------------------------------------------------
    # 5. Public URL Shortening & Redirects
    # --------------------------------------------------------------------------
    def test_public_shorten_and_redirect(self):
        """Public shortener creates working links."""
        res = self.client.post("/links/public/shorten", json={"url": "https://example.com/target"})
        self.assertEqual(res.status_code, 201)
        code = res.json()["short_code"]

        redirect_res = self.client.get(f"/{code}", follow_redirects=False)
        self.assertEqual(redirect_res.status_code, 307)
        self.assertEqual(redirect_res.headers["location"], "https://example.com/target")

if __name__ == "__main__":
    unittest.main()
