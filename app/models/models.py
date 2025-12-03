"""SQLAlchemy models for the Football Performance Dashboard."""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.db.database import Base


def utc_now():
    """Return the current UTC time."""
    return datetime.now(timezone.utc)


class Player(Base):
    """Player model representing a football athlete."""

    __tablename__ = "players"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    position = Column(String(50), nullable=False)
    team = Column(String(100), nullable=True)
    age = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    sessions = relationship("TrainingSession", back_populates="player")


class TrainingSession(Base):
    """Training session model for tracking athlete workouts."""

    __tablename__ = "training_sessions"

    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    session_date = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    session_type = Column(String(50), nullable=False)
    notes = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=utc_now)

    player = relationship("Player", back_populates="sessions")
    stats = relationship("SessionStats", back_populates="session")


class SessionStats(Base):
    """Statistics recorded during a training session."""

    __tablename__ = "session_stats"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("training_sessions.id"), nullable=False)
    distance_km = Column(Float, nullable=True)
    max_speed_kmh = Column(Float, nullable=True)
    avg_heart_rate = Column(Integer, nullable=True)
    max_heart_rate = Column(Integer, nullable=True)
    calories_burned = Column(Integer, nullable=True)
    sprints_count = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    session = relationship("TrainingSession", back_populates="stats")


class User(Base):
    """User model for authentication and application access."""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(150), unique=True, nullable=False, index=True)
    email = Column(String(254), unique=True, nullable=True, index=True)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Integer, default=1)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)
