"""Stats API router for CRUD operations on session statistics."""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.models import SessionStats, TrainingSession
from app.schemas.schemas import StatsCreate, StatsUpdate, StatsResponse

router = APIRouter(prefix="/stats", tags=["stats"])


@router.get("", response_model=List[StatsResponse])
def get_all_stats(
    skip: int = 0,
    limit: int = 100,
    session_id: int = None,
    db: Session = Depends(get_db),
):
    """Get all session statistics with optional filtering by session."""
    query = db.query(SessionStats)
    if session_id:
        query = query.filter(SessionStats.session_id == session_id)
    stats = query.offset(skip).limit(limit).all()
    return stats


@router.get("/{stats_id}", response_model=StatsResponse)
def get_stats(stats_id: int, db: Session = Depends(get_db)):
    """Get specific session statistics by ID."""
    stats = db.query(SessionStats).filter(SessionStats.id == stats_id).first()
    if not stats:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Stats with id {stats_id} not found",
        )
    return stats


@router.post("", response_model=StatsResponse, status_code=status.HTTP_201_CREATED)
def create_stats(stats: StatsCreate, db: Session = Depends(get_db)):
    """Create new session statistics."""
    session = (
        db.query(TrainingSession).filter(TrainingSession.id == stats.session_id).first()
    )
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Training session with id {stats.session_id} not found",
        )

    db_stats = SessionStats(**stats.model_dump())
    db.add(db_stats)
    db.commit()
    db.refresh(db_stats)
    return db_stats


@router.put("/{stats_id}", response_model=StatsResponse)
def update_stats(stats_id: int, stats: StatsUpdate, db: Session = Depends(get_db)):
    """Update existing session statistics."""
    db_stats = db.query(SessionStats).filter(SessionStats.id == stats_id).first()
    if not db_stats:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Stats with id {stats_id} not found",
        )

    update_data = stats.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_stats, key, value)

    db.commit()
    db.refresh(db_stats)
    return db_stats


@router.delete("/{stats_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_stats(stats_id: int, db: Session = Depends(get_db)):
    """Delete session statistics."""
    db_stats = db.query(SessionStats).filter(SessionStats.id == stats_id).first()
    if not db_stats:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Stats with id {stats_id} not found",
        )
    db.delete(db_stats)
    db.commit()
    return None
