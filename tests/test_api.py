"""Tests for the Football Performance Dashboard API."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.database import Base, get_db


# Create test database
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    """Override database dependency for testing."""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="function")
def client():
    """Create a test client with a fresh database for each test."""
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as test_client:
        yield test_client
    Base.metadata.drop_all(bind=engine)


class TestHealthEndpoint:
    """Tests for the health check endpoint."""

    @staticmethod
    def get_coach_token(client):
        """Helper to create a coach and return auth token."""
        user_data = {
            "username": "testcoach",
            "email": "coach@example.com",
            "password": "SecurePassword123",
        }
        client.post("/auth/register", json=user_data)
        
        login_data = {
            "username": "testcoach",
            "password": "SecurePassword123",
        }
        login_response = client.post("/auth/login", json=login_data)
        return login_response.json()["access_token"]

    def test_health_check(self, client):
        """Test health check returns healthy status."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["version"] == "1.0.0"
        assert data["database"] == "healthy"
    def test_get_players_empty(self, client):
        """Test getting players when none exist."""
        # Register and login as a coach first
        user_data = {
            "username": "testcoach",
            "email": "coach@example.com",
            "password": "SecurePassword123",
        }
        client.post("/auth/register", json=user_data)
        
        login_data = {
            "username": "testcoach",
            "password": "SecurePassword123",
        }
        login_response = client.post("/auth/login", json=login_data)
        token = login_response.json()["access_token"]
        
        # Now get players with auth token
        response = client.get("/players", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        assert response.json() == []

    def test_create_player(self, client):
        """Test creating a new player."""
        token = self.get_coach_token(client)
        
        player_data = {
            "name": "John Doe",
            "position": "Forward",
            "birth_date": "2000-12-03",
        }
        response = client.post("/players", json=player_data, headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "John Doe"
        assert data["position"] == "Forward"
        assert "id" in data

    def test_get_player(self, client):
        """Test getting a specific player."""
        token = self.get_coach_token(client)
        
        player_data = {"name": "Jane Smith", "position": "Midfielder"}
        create_response = client.post("/players", json=player_data, headers={"Authorization": f"Bearer {token}"})
        player_id = create_response.json()["id"]

        response = client.get(f"/players/{player_id}", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        assert response.json()["name"] == "Jane Smith"

    def test_get_player_not_found(self, client):
        """Test getting a non-existent player."""
        token = self.get_coach_token(client)
        response = client.get("/players/9999", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 404

    def test_update_player(self, client):
        """Test updating a player."""
        token = self.get_coach_token(client)
        
        player_data = {"name": "Original Name", "position": "Defender"}
        create_response = client.post("/players", json=player_data, headers={"Authorization": f"Bearer {token}"})
        player_id = create_response.json()["id"]

        update_data = {"name": "Updated Name"}
        response = client.put(f"/players/{player_id}", json=update_data, headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 200
        assert response.json()["name"] == "Updated Name"
        assert response.json()["position"] == "Defender"

    def test_delete_player(self, client):
        """Test deleting a player."""
        token = self.get_coach_token(client)
        
        player_data = {"name": "To Delete", "position": "Goalkeeper"}
        create_response = client.post("/players", json=player_data, headers={"Authorization": f"Bearer {token}"})
        player_id = create_response.json()["id"]

        response = client.delete(f"/players/{player_id}", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 204

        get_response = client.get(f"/players/{player_id}", headers={"Authorization": f"Bearer {token}"})
        assert get_response.status_code == 404


class TestSessionsEndpoint:
    """Tests for the sessions API endpoints."""

    @staticmethod
    def get_coach_token(client):
        """Helper to create a coach and return auth token."""
        user_data = {
            "username": "testcoach2",
            "email": "coach2@example.com",
            "password": "SecurePassword123",
        }
        client.post("/auth/register", json=user_data)
        
        login_data = {
            "username": "testcoach2",
            "password": "SecurePassword123",
        }
        login_response = client.post("/auth/login", json=login_data)
        return login_response.json()["access_token"]

    def test_get_sessions_empty(self, client):
        """Test getting sessions when none exist."""
        response = client.get("/sessions")
        assert response.status_code == 200
        assert response.json() == []

    def test_create_session(self, client):
        """Test creating a training session."""
        token = self.get_coach_token(client)
        
        player_data = {"name": "Test Player", "position": "Forward"}
        player_response = client.post("/players", json=player_data, headers={"Authorization": f"Bearer {token}"})
        player_id = player_response.json()["id"]

        session_data = {
            "player_id": player_id,
            "session_date": "2024-01-15T10:00:00",
            "duration_minutes": 90,
            "session_type": "Training",
            "notes": "Practice session",
        }
        response = client.post("/sessions", json=session_data, headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 201
        data = response.json()
        assert data["duration_minutes"] == 90
        assert data["session_type"] == "Training"

    def test_create_session_invalid_player(self, client):
        """Test creating a session with non-existent player."""
        session_data = {
            "player_id": 9999,
            "session_date": "2024-01-15T10:00:00",
            "duration_minutes": 90,
            "session_type": "Training",
        }
        response = client.post("/sessions", json=session_data)
        assert response.status_code == 404


class TestStatsEndpoint:
    """Tests for the stats API endpoints."""

    @staticmethod
    def get_coach_token(client):
        """Helper to create a coach and return auth token."""
        user_data = {
            "username": "testcoach3",
            "email": "coach3@example.com",
            "password": "SecurePassword123",
        }
        client.post("/auth/register", json=user_data)
        
        login_data = {
            "username": "testcoach3",
            "password": "SecurePassword123",
        }
        login_response = client.post("/auth/login", json=login_data)
        return login_response.json()["access_token"]

    def test_get_stats_empty(self, client):
        """Test getting stats when none exist."""
        response = client.get("/stats")
        assert response.status_code == 200
        assert response.json() == []

    def test_create_stats(self, client):
        """Test creating session statistics."""
        token = self.get_coach_token(client)
        
        player_response = client.post(
            "/players", json={"name": "Test Player", "position": "Forward"}, headers={"Authorization": f"Bearer {token}"}
        )
        player_id = player_response.json()["id"]

        session_response = client.post(
            "/sessions",
            json={
                "player_id": player_id,
                "session_date": "2024-01-15T10:00:00",
                "duration_minutes": 90,
                "session_type": "Training",
            },
            headers={"Authorization": f"Bearer {token}"}
        )
        session_id = session_response.json()["id"]

        stats_data = {
            "session_id": session_id,
            "distance_km": 8.5,
            "max_speed_kmh": 28.5,
            "avg_heart_rate": 145,
            "max_heart_rate": 185,
            "calories_burned": 650,
            "sprints_count": 15,
        }
        response = client.post("/stats", json=stats_data, headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 201
        data = response.json()
        assert data["distance_km"] == 8.5
        assert data["max_speed_kmh"] == 28.5

    def test_create_stats_invalid_session(self, client):
        """Test creating stats with non-existent session."""
        stats_data = {
            "session_id": 9999,
            "distance_km": 8.5,
        }
        response = client.post("/stats", json=stats_data)
        assert response.status_code == 404


class TestAuthEndpoint:
    """Tests for the authentication endpoints."""

    def test_register_user(self, client):
        """Test user registration."""
        user_data = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "SecurePassword123",
        }
        response = client.post("/auth/register", json=user_data)
        assert response.status_code == 201
        data = response.json()
        assert data["username"] == "testuser"
        assert data["email"] == "test@example.com"
        assert "password" not in data
        assert "id" in data

    def test_register_duplicate_username(self, client):
        """Test registering with duplicate username."""
        user_data = {
            "username": "testuser",
            "email": "test1@example.com",
            "password": "SecurePassword123",
        }
        client.post("/auth/register", json=user_data)
        
        # Try to register with same username
        user_data2 = {
            "username": "testuser",
            "email": "test2@example.com",
            "password": "SecurePassword456",
        }
        response = client.post("/auth/register", json=user_data2)
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"]

    def test_register_duplicate_email(self, client):
        """Test registering with duplicate email."""
        user_data = {
            "username": "testuser1",
            "email": "test@example.com",
            "password": "SecurePassword123",
        }
        client.post("/auth/register", json=user_data)
        
        # Try to register with same email
        user_data2 = {
            "username": "testuser2",
            "email": "test@example.com",
            "password": "SecurePassword456",
        }
        response = client.post("/auth/register", json=user_data2)
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"]

    def test_login_success(self, client):
        """Test successful login."""
        # Register user first
        user_data = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "SecurePassword123",
        }
        client.post("/auth/register", json=user_data)
        
        # Login
        login_data = {
            "username": "testuser",
            "password": "SecurePassword123",
        }
        response = client.post("/auth/login", json=login_data)
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_invalid_password(self, client):
        """Test login with wrong password."""
        # Register user first
        user_data = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "SecurePassword123",
        }
        client.post("/auth/register", json=user_data)
        
        # Try login with wrong password
        login_data = {
            "username": "testuser",
            "password": "WrongPassword",
        }
        response = client.post("/auth/login", json=login_data)
        assert response.status_code == 401
        assert "Invalid credentials" in response.json()["detail"]

    def test_login_nonexistent_user(self, client):
        """Test login with non-existent user."""
        login_data = {
            "username": "nonexistent",
            "password": "SomePassword123",
        }
        response = client.post("/auth/login", json=login_data)
        assert response.status_code == 401
        assert "Invalid credentials" in response.json()["detail"]
