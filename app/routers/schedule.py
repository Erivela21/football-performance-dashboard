"""Match Schedule API router for CRUD operations on schedules."""

from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.models import MatchSchedule
from app.schemas.schemas import MatchScheduleCreate, MatchScheduleUpdate, MatchScheduleResponse

router = APIRouter(prefix="/schedule", tags=["schedule"])


@router.get("", response_model=List[MatchScheduleResponse])
def get_schedules(
    skip: int = 0, 
    limit: int = 100, 
    team_id: Optional[int] = Query(None),
    event_type: Optional[str] = Query(None),
    important_only: bool = Query(False),
    db: Session = Depends(get_db)
):
    """Get all schedules with optional filters."""
    query = db.query(MatchSchedule)
    
    if team_id:
        query = query.filter(MatchSchedule.team_id == team_id)
    if event_type:
        query = query.filter(MatchSchedule.event_type == event_type)
    if important_only:
        query = query.filter(MatchSchedule.is_important == True)
    
    schedules = query.order_by(MatchSchedule.event_date).offset(skip).limit(limit).all()
    return schedules


@router.get("/{schedule_id}", response_model=MatchScheduleResponse)
def get_schedule(schedule_id: int, db: Session = Depends(get_db)):
    """Get a specific schedule by ID."""
    schedule = db.query(MatchSchedule).filter(MatchSchedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Schedule with id {schedule_id} not found",
        )
    return schedule


@router.post("", response_model=MatchScheduleResponse, status_code=status.HTTP_201_CREATED)
def create_schedule(schedule: MatchScheduleCreate, db: Session = Depends(get_db)):
    """Create a new schedule."""
    db_schedule = MatchSchedule(**schedule.model_dump())
    db.add(db_schedule)
    db.commit()
    db.refresh(db_schedule)
    return db_schedule


@router.put("/{schedule_id}", response_model=MatchScheduleResponse)
def update_schedule(
    schedule_id: int, schedule: MatchScheduleUpdate, db: Session = Depends(get_db)
):
    """Update an existing schedule."""
    db_schedule = db.query(MatchSchedule).filter(MatchSchedule.id == schedule_id).first()
    if not db_schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Schedule with id {schedule_id} not found",
        )

    update_data = schedule.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_schedule, key, value)

    db.commit()
    db.refresh(db_schedule)
    return db_schedule


@router.delete("/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_schedule(schedule_id: int, db: Session = Depends(get_db)):
    """Delete a schedule."""
    db_schedule = db.query(MatchSchedule).filter(MatchSchedule.id == schedule_id).first()
    if not db_schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Schedule with id {schedule_id} not found",
        )
    db.delete(db_schedule)
    db.commit()
    return None
