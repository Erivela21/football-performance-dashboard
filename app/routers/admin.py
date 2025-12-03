"""Admin routes for managing coaches, teams, and players."""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.models import User, Team, Player
from app.schemas.schemas import UserResponse, AdminUserUpdate, TeamAssignment, CoachListResponse
from app.utils.auth import get_current_user, get_password_hash

router = APIRouter(prefix="/admin", tags=["admin"])


def verify_admin(current_user: User = Depends(get_current_user)):
    """Verify that current user is an admin."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


@router.get("/coaches", response_model=List[CoachListResponse])
def list_coaches(admin: User = Depends(verify_admin), db: Session = Depends(get_db)):
    """List all coaches with their teams."""
    coaches = db.query(User).filter(User.role == "coach").all()
    return coaches


@router.get("/coaches/{coach_id}", response_model=UserResponse)
def get_coach(coach_id: int, admin: User = Depends(verify_admin), db: Session = Depends(get_db)):
    """Get specific coach details."""
    coach = db.query(User).filter(User.id == coach_id, User.role == "coach").first()
    if not coach:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Coach not found"
        )
    return coach


@router.put("/coaches/{coach_id}", response_model=UserResponse)
def update_coach(
    coach_id: int,
    update_data: AdminUserUpdate,
    admin: User = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Update coach password, role, or status."""
    coach = db.query(User).filter(User.id == coach_id).first()
    if not coach:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Coach not found"
        )
    
    # Update password if provided
    if update_data.password:
        coach.password_hash = get_password_hash(update_data.password)
    
    # Update role if provided
    if update_data.role:
        coach.role = update_data.role
    
    # Update is_active if provided
    if update_data.is_active is not None:
        coach.is_active = int(update_data.is_active)
    
    db.commit()
    db.refresh(coach)
    return coach


@router.delete("/coaches/{coach_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_coach(
    coach_id: int,
    admin: User = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Delete a coach account (cascade deletes teams and players)."""
    coach = db.query(User).filter(User.id == coach_id).first()
    if not coach:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Coach not found"
        )
    
    db.delete(coach)
    db.commit()
    return None


@router.post("/teams/assign", response_model=dict)
def assign_team_to_coach(
    assignment: TeamAssignment,
    admin: User = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Assign a team to a coach."""
    # Verify team exists
    team = db.query(Team).filter(Team.id == assignment.team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    # Verify coach exists
    coach = db.query(User).filter(User.id == assignment.user_id, User.role == "coach").first()
    if not coach:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Coach not found"
        )
    
    # Assign team to coach
    team.user_id = assignment.user_id
    db.commit()
    db.refresh(team)
    
    return {"message": f"Team '{team.name}' assigned to coach '{coach.username}'", "team_id": team.id}


@router.post("/teams/unassign", response_model=dict)
def unassign_team_from_coach(
    team_id: int,
    admin: User = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Unassign a team from a coach (soft delete - sets to null)."""
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    # Delete the team since user_id is NOT NULL
    # Alternatively, could move to a shared/unassigned teams pool
    db.delete(team)
    db.commit()
    
    return {"message": "Team unassigned from coach", "team_id": team_id}


@router.post("/players/reassign", response_model=dict)
def reassign_player_to_team(
    player_id: int,
    team_id: int,
    admin: User = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Reassign a player to a different team."""
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Player not found"
        )
    
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    old_team_id = player.team_id
    player.team_id = team_id
    db.commit()
    db.refresh(player)
    
    return {
        "message": f"Player '{player.name}' reassigned to team '{team.name}'",
        "player_id": player.id,
        "old_team_id": old_team_id,
        "new_team_id": team_id
    }


@router.delete("/players/{player_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_player(
    player_id: int,
    admin: User = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Delete a player."""
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Player not found"
        )
    
    db.delete(player)
    db.commit()
    return None


@router.get("/stats", response_model=dict)
def admin_stats(admin: User = Depends(verify_admin), db: Session = Depends(get_db)):
    """Get system statistics."""
    total_coaches = db.query(User).filter(User.role == "coach").count()
    total_admins = db.query(User).filter(User.role == "admin").count()
    total_teams = db.query(Team).count()
    total_players = db.query(Player).count()
    
    return {
        "total_coaches": total_coaches,
        "total_admins": total_admins,
        "total_teams": total_teams,
        "total_players": total_players
    }
