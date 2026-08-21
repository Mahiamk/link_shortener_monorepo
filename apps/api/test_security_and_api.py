import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Setup in-memory SQLite for comprehensive unit & integration tests
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["SECRET_KEY"] = "test-secret-key-for-unit-testing-32-chars-long-min!"
os.environ["ALGORITHM"] = "HS256"
os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"] = "60"
os.environ["SUPERUSER_EMAILS"] = "admin@example.com"

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

@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    # Create User A (normal)
    user_a = models.User(
        id=1,
        email="usera@example.com",
        hashed_password=get_password_hash("password123"),
        is_active=True,
        is_superuser=False
    )
    # Create User B (normal)
    user_b = models.User(
        id=2,
        email="userb@example.com",
        hashed_password=get_password_hash("password123"),
        is_active=True,
        is_superuser=False
    )
    # Create Admin User
    admin_user = models.User(
        id=3,
        email="admin@example.com",
        hashed_password=get_password_hash("adminpass123"),
        is_active=True,
        is_superuser=True
    )
    db.add_all([user_a, user_b, admin_user])
    db.commit()

    # Create Link for User A
    link_a = models.Link(
        id=1,
        original_url="https://example.com/user-a-link",
        short_code="linkA1",
        owner_id=1
    )
    # Create Link for User B
    link_b = models.Link(
        id=2,
        original_url="https://example.com/user-b-link",
        short_code="linkB2",
        owner_id=2
    )
    # Create Public Link (no owner / owner_id is None)
    link_public = models.Link(
        id=3,
        original_url="https://example.com/public-link",
        short_code="linkPub3",
        owner_id=None
    )
    db.add_all([link_a, link_b, link_public])
    db.commit()

    yield db
    db.close()
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture
def token_user_a():
    return create_access_token({"sub": "usera@example.com"})

@pytest.fixture
def token_user_b():
    return create_access_token({"sub": "userb@example.com"})

@pytest.fixture
def token_admin():
    return create_access_token({"sub": "admin@example.com"})


# ==============================================================================
# 1. Information Disclosure & Exception Handling Tests
# ==============================================================================

def test_unhandled_exception_returns_generic_message(client):
    """Ensure 500 errors NEVER expose tracebacks, exception types, or internal paths."""
    # Test route raising unhandled error
    @app.get("/test-internal-crash")
    def crash_route():
        raise RuntimeError("Sensitive internal database path: /var/secrets/key.pem")

    response = client.get("/test-internal-crash")
    assert response.status_code == 500
    data = response.json()
    assert data == {"detail": "Internal server error"}
    assert "Traceback" not in response.text
    assert "Sensitive" not in response.text
    assert "/var/secrets" not in response.text


def test_invalid_validation_request_clean_response(client):
    """Ensure validation errors do not leak stack traces."""
    response = client.post("/auth/register", json={"email": "not-an-email", "password": "123"})
    assert response.status_code in (400, 422)
    assert "Traceback" not in response.text


# ==============================================================================
# 2. Response Validation & Missing / Null Owner Handling
# ==============================================================================

def test_admin_get_all_links_with_null_and_valid_owners(client, token_admin):
    """
    Ensure /admin/links serializes both legitimate owned links and public/null owner links
    without throwing a 500 ResponseValidationError.
    """
    response = client.get("/admin/links", headers={"Authorization": f"Bearer {token_admin}"})
    assert response.status_code == 200
    links = response.json()
    assert len(links) == 3

    # Check owned link
    owned_link = next(l for l in links if l["id"] == 1)
    assert owned_link["owner_id"] == 1
    assert owned_link["owner"]["email"] == "usera@example.com"

    # Check public link with null owner
    public_link = next(l for l in links if l["id"] == 3)
    assert public_link["owner_id"] is None
    assert public_link["owner"] is None


def test_user_links_returns_only_valid_user_data(client, token_user_a):
    """User A's /links/ route returns their links cleanly."""
    response = client.get("/links/", headers={"Authorization": f"Bearer {token_user_a}"})
    assert response.status_code == 200
    links = response.json()
    assert len(links) == 1
    assert links[0]["id"] == 1
    assert links[0]["owner_id"] == 1


# ==============================================================================
# 3. Authentication Tests
# ==============================================================================

def test_unauthenticated_requests_return_401(client):
    """Protected endpoints return 401 when unauthenticated."""
    assert client.get("/links/").status_code == 401
    assert client.get("/auth/me").status_code == 401
    assert client.get("/admin/stats").status_code == 401
    assert client.get("/admin/users").status_code == 401
    assert client.get("/admin/links").status_code == 401
    assert client.get("/api/contact-submissions/").status_code == 401


def test_valid_login_and_me_endpoint(client, token_user_a):
    """Test /auth/token and /auth/me."""
    login_res = client.post("/auth/token", data={"username": "usera@example.com", "password": "password123"})
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()

    me_res = client.get("/auth/me", headers={"Authorization": f"Bearer {token_user_a}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "usera@example.com"


# ==============================================================================
# 4. Authorization / BOLA / IDOR Protection Tests
# ==============================================================================

def test_user_a_cannot_access_user_b_links(client, token_user_a):
    """User A cannot see User B's links on /links/."""
    response = client.get("/links/", headers={"Authorization": f"Bearer {token_user_a}"})
    assert response.status_code == 200
    link_ids = [l["id"] for l in response.json()]
    assert 1 in link_ids
    assert 2 not in link_ids  # User B's link


def test_user_a_cannot_delete_user_b_link(client, token_user_a):
    """User A cannot delete User B's link (IDOR protection)."""
    response = client.delete("/links/2", headers={"Authorization": f"Bearer {token_user_a}"})
    assert response.status_code == 404


def test_user_a_cannot_view_user_b_stats(client, token_user_a):
    """User A cannot view stats of User B's link."""
    response = client.get("/links/2/stats", headers={"Authorization": f"Bearer {token_user_a}"})
    assert response.status_code == 404


def test_non_admin_cannot_access_admin_endpoints(client, token_user_a):
    """Normal user cannot access /admin/ endpoints (403 Forbidden)."""
    assert client.get("/admin/stats", headers={"Authorization": f"Bearer {token_user_a}"}).status_code == 403
    assert client.get("/admin/users", headers={"Authorization": f"Bearer {token_user_a}"}).status_code == 403
    assert client.get("/admin/links", headers={"Authorization": f"Bearer {token_user_a}"}).status_code == 403
    assert client.get("/api/contact-submissions/", headers={"Authorization": f"Bearer {token_user_a}"}).status_code == 403


def test_admin_cannot_deactivate_or_delete_self(client, token_admin):
    """Admin cannot deactivate or delete their own account."""
    res_deactivate = client.patch(
        "/admin/users/3",
        json={"is_active": False},
        headers={"Authorization": f"Bearer {token_admin}"}
    )
    assert res_deactivate.status_code == 400

    res_delete = client.delete(
        "/admin/users/3",
        headers={"Authorization": f"Bearer {token_admin}"}
    )
    assert res_delete.status_code == 400


# ==============================================================================
# 5. Public URL Shortening & Redirects
# ==============================================================================

def test_public_shorten_and_redirect(client):
    """Public shortener creates working links."""
    res = client.post("/links/public/shorten", json={"url": "https://example.com/target"})
    assert res.status_code == 201
    code = res.json()["short_code"]

    redirect_res = client.get(f"/{code}", follow_redirects=False)
    assert redirect_res.status_code == 307
    assert redirect_res.headers["location"] == "https://example.com/target"
