"""Pydantic schemas for API request/response validation."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


# Team schemas
class TeamBase(BaseModel):
    """Base schema for team data."""
    
    name: str = Field(..., min_length=1, max_length=100)
    division: Optional[str] = Field(None, max_length=100)
    color_primary: Optional[str] = Field("#00ff88", max_length=7)
    color_secondary: Optional[str] = Field("#00ccff", max_length=7)


class TeamCreate(TeamBase):
    """Schema for creating a new team."""
    pass


class TeamUpdate(BaseModel):
    """Schema for updating a team."""
    
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    division: Optional[str] = Field(None, max_length=100)
    color_primary: Optional[str] = Field(None, max_length=7)
    color_secondary: Optional[str] = Field(None, max_length=7)


class TeamResponse(TeamBase):
    """Schema for team response."""
    
    id: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# Player schemas
class PlayerBase(BaseModel):
    """Base schema for player data."""

    name: str = Field(..., min_length=1, max_length=100)
    position: str = Field(..., min_length=1, max_length=50)
    team: Optional[str] = Field(None, max_length=100)
    team_id: Optional[int] = None
    age: Optional[int] = Field(None, ge=15, le=50)
    jersey_number: Optional[int] = Field(None, ge=1, le=99)
    photo_url: Optional[str] = Field(None, max_length=500)


class PlayerCreate(PlayerBase):
    """Schema for creating a new player."""

    pass


class PlayerUpdate(BaseModel):
    """Schema for updating a player."""

    name: Optional[str] = Field(None, min_length=1, max_length=100)
    position: Optional[str] = Field(None, min_length=1, max_length=50)
    team: Optional[str] = Field(None, max_length=100)
    age: Optional[int] = Field(None, ge=15, le=50)


class PlayerResponse(PlayerBase):
    """Schema for player response."""

    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Training Session schemas
class SessionBase(BaseModel):
    """Base schema for training session data."""

    session_date: datetime
    duration_minutes: int = Field(..., ge=1, le=600)
    session_type: str = Field(..., min_length=1, max_length=50)
    notes: Optional[str] = Field(None, max_length=500)


class SessionCreate(SessionBase):
    """Schema for creating a new training session."""

    player_id: int


class SessionUpdate(BaseModel):
    """Schema for updating a training session."""

    session_date: Optional[datetime] = None
    duration_minutes: Optional[int] = Field(None, ge=1, le=600)
    session_type: Optional[str] = Field(None, min_length=1, max_length=50)
    notes: Optional[str] = Field(None, max_length=500)


class SessionResponse(SessionBase):
    """Schema for training session response."""

    id: int
    player_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Session Stats schemas
class StatsBase(BaseModel):
    """Base schema for session statistics."""

    distance_km: Optional[float] = Field(None, ge=0, le=50)
    max_speed_kmh: Optional[float] = Field(None, ge=0, le=50)
    avg_heart_rate: Optional[int] = Field(None, ge=40, le=220)
    max_heart_rate: Optional[int] = Field(None, ge=40, le=220)
    calories_burned: Optional[int] = Field(None, ge=0, le=5000)
    sprints_count: Optional[int] = Field(None, ge=0, le=500)


class StatsCreate(StatsBase):
    """Schema for creating session statistics."""

    session_id: int


class StatsUpdate(StatsBase):
    """Schema for updating session statistics."""

    pass


class StatsResponse(StatsBase):
    """Schema for session statistics response."""

    id: int
    session_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Health check schemas
class HealthResponse(BaseModel):
    """Schema for health check response."""

    status: str
    version: str
    database: str


# Authentication / User schemas
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=150)
    email: Optional[str] = Field(None, max_length=254)


class UserCreate(UserBase):
    password: str = Field(..., min_length=4)


class UserResponse(UserBase):
    id: int
    is_active: bool = True
    created_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


# Match Schedule schemas
class MatchScheduleBase(BaseModel):
    """Base schema for match schedule data."""
    
    team_id: Optional[int] = None
    event_type: str = Field(..., min_length=1, max_length=50)
    title: str = Field(..., min_length=1, max_length=200)
    opponent: Optional[str] = Field(None, max_length=100)
    event_date: datetime
    location: Optional[str] = Field(None, max_length=200)
    notes: Optional[str] = None
    is_important: bool = False


class MatchScheduleCreate(MatchScheduleBase):
    """Schema for creating a new match schedule."""
    pass


class MatchScheduleUpdate(BaseModel):
    """Schema for updating a match schedule."""
    
    team_id: Optional[int] = None
    event_type: Optional[str] = Field(None, min_length=1, max_length=50)
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    opponent: Optional[str] = Field(None, max_length=100)
    event_date: Optional[datetime] = None
    location: Optional[str] = Field(None, max_length=200)
    notes: Optional[str] = None
    is_important: Optional[bool] = None


class MatchScheduleResponse(MatchScheduleBase):
    """Schema for match schedule response."""
    
    id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
