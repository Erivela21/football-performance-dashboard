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
    """Get teams for the current user only. Coaches only."""
    print(f"[DEBUG] get_teams called by user {current_user.username} with role='{current_user.role}'")
    if current_user.role == 'admin':
        print(f"[DEBUG] Blocking admin user {current_user.username}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admins cannot access teams"
        )
    print(f"[DEBUG] Allowing coach {current_user.username} to access teams")
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
    """Delete a team and all related data (user's team only)."""
    from app.models.models import MatchSchedule, Player, TrainingSession, SessionStats
    
    db_team = db.query(Team).filter(Team.id == team_id, Team.user_id == current_user.id).first()
    if not db_team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Team with id {team_id} not found",
        )
    
    # Delete related match schedules first
    db.query(MatchSchedule).filter(MatchSchedule.team_id == team_id).delete()
    
    # Get all players for this team to delete their sessions and stats
    players = db.query(Player).filter(Player.team_id == team_id).all()
    for player in players:
        # Delete session stats for each session
        sessions = db.query(TrainingSession).filter(TrainingSession.player_id == player.id).all()
        for session in sessions:
            db.query(SessionStats).filter(SessionStats.session_id == session.id).delete()
        # Delete sessions
        db.query(TrainingSession).filter(TrainingSession.player_id == player.id).delete()
    
    # Delete players
    db.query(Player).filter(Player.team_id == team_id).delete()
    
    # Finally delete the team
    db.delete(db_team)
    db.commit()
    return None


@router.post("/seed-demo-data", status_code=status.HTTP_201_CREATED)
def seed_demo_data_for_user(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Seed demo data (team, players, sessions) for the current user if they have no teams."""
    if current_user.role == 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admins cannot seed demo data"
        )
    
    # Check if user already has teams
    existing_teams = db.query(Team).filter(Team.user_id == current_user.id).count()
    if existing_teams > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have teams. Delete them first if you want to seed demo data."
        )
    
    # Import and run the seeding functions
    from app.utils.seed_data import seed_demo_team, seed_demo_players, seed_training_sessions, seed_match_schedule
    
    # Create demo team for THIS user
    team = seed_demo_team(db, current_user)
    players = seed_demo_players(db, team)
    seed_training_sessions(db, players)
    seed_match_schedule(db, team)
    
    return {
        "message": "Demo data seeded successfully!",
        "team_id": team.id,
        "team_name": team.name,
        "players_count": len(players)
    }
