"""Teams API router for CRUD operations on teams."""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.models import Team, User
from app.schemas.schemas import TeamCreate, TeamUpdate, TeamResponse
from app.utils.auth import get_current_user

router = APIRouter(prefix="/teams", tags=["teams"])


@router.get("", response_model=List[TeamResponse])
def get_teams(skip: int = 0, limit: int = 100, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get teams for the current user only."""
    teams = db.query(Team).filter(Team.user_id == current_user.id).order_by(Team.id).offset(skip).limit(limit).all()
    return teams


@router.get("/{team_id}", response_model=TeamResponse)
def get_team(team_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get a specific team by ID (user's team only)."""
    team = db.query(Team).filter(Team.id == team_id, Team.user_id == current_user.id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Team with id {team_id} not found",
        )
    return team


@router.post("", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
def create_team(team: TeamCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create a new team for the current user."""
    db_team = Team(**team.model_dump(), user_id=current_user.id)
    db.add(db_team)
    db.commit()
    db.refresh(db_team)
    return db_team


@router.put("/{team_id}", response_model=TeamResponse)
def update_team(
    team_id: int, team: TeamUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Update a team (user's team only)."""
    db_team = db.query(Team).filter(Team.id == team_id, Team.user_id == current_user.id).first()
    if not db_team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Team with id {team_id} not found",
        )

    update_data = team.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_team, key, value)

    db.commit()
    db.refresh(db_team)
    return db_team


@router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_team(team_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Delete a team (user's team only)."""
    db_team = db.query(Team).filter(Team.id == team_id, Team.user_id == current_user.id).first()
    if not db_team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Team with id {team_id} not found",
        )
    db.delete(db_team)
    db.commit()
    return None
