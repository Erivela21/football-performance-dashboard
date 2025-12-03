"""SQLAlchemy models for the Football Performance Dashboard."""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.ext.hybrid import hybrid_property

from app.db.database import Base


def utc_now():
    """Return the current UTC time."""
    return datetime.now(timezone.utc)


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


class Team(Base):
    """Team model representing a football team."""

    __tablename__ = "teams"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    division = Column(String(100), nullable=True)
    color_primary = Column(String(7), default="#00ff88")  # Hex color
    color_secondary = Column(String(7), default="#00ccff")  # Hex color
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    players = relationship("Player", back_populates="team_rel", cascade="all, delete-orphan")


class Player(Base):
    """Player model representing a football athlete."""

    __tablename__ = "players"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    surname = Column(String(100), nullable=True)
    aka = Column(String(100), nullable=True)  # Nickname or alternative name
    position = Column(String(50), nullable=False)
    team = Column(String(100), nullable=True)  # Keep for backward compatibility
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    birth_date = Column(String(10), nullable=True)  # YYYY-MM-DD format
    jersey_number = Column(Integer, nullable=True)
    photo_url = Column(Text, nullable=True)  # Can store large base64 images
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    sessions = relationship("TrainingSession", back_populates="player", cascade="all, delete-orphan")
    team_rel = relationship("Team", back_populates="players")

    @hybrid_property
    def age(self):
        """Calculate age from birth_date."""
        if not self.birth_date:
            return None
        try:
            birth = datetime.strptime(self.birth_date, "%Y-%m-%d")
            today = datetime.now(timezone.utc).replace(tzinfo=None)
            return today.year - birth.year - ((today.month, today.day) < (birth.month, birth.day))
        except (ValueError, TypeError):
            return None


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
    stats = relationship("SessionStats", back_populates="session", cascade="all, delete-orphan")


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


class MatchSchedule(Base):
    """Match and training schedule for teams."""

    __tablename__ = "match_schedule"

    id = Column(Integer, primary_key=True, index=True)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    event_type = Column(String(50), nullable=False)  # 'match', 'training', 'important_match'
    title = Column(String(200), nullable=False)
    opponent = Column(String(100), nullable=True)
    event_date = Column(DateTime, nullable=False)
    location = Column(String(200), nullable=True)
    notes = Column(Text, nullable=True)
    is_important = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utc_now)
