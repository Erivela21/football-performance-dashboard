"""Players API router for CRUD operations on players."""

from typing import List
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.models import Player, User, Team
from app.schemas.schemas import PlayerCreate, PlayerUpdate, PlayerResponse
from app.utils.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/players", tags=["players"])


@router.get("", response_model=List[PlayerResponse])
def get_players(skip: int = 0, limit: int = 100, team_id: int = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get players with optional team filtering and pagination. Coaches only - only see their own players."""
    print(f"[DEBUG] get_players called by user {current_user.username} (id={current_user.id}) with role='{current_user.role}'")
    if current_user.role == 'admin':
        print(f"[DEBUG] Blocking admin user {current_user.username}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admins cannot access players"
        )
    
    # Coach can only see players from their own teams
    # Join with Team to filter by current user's teams
    query = db.query(Player).join(Team, Player.team_id == Team.id).filter(Team.user_id == current_user.id)
    
    if team_id:
        # Verify team belongs to current user
        team = db.query(Team).filter(Team.id == team_id, Team.user_id == current_user.id).first()
        if not team:
            print(f"[DEBUG] Coach {current_user.username} trying to access team {team_id} they don't own - DENIED")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this team"
            )
        query = query.filter(Player.team_id == team_id)
        print(f"[DEBUG] Coach {current_user.username} accessing players from their team {team_id}")
    else:
        print(f"[DEBUG] Coach {current_user.username} accessing all their players (all their teams)")
    
    players = query.order_by(Player.id).offset(skip).limit(limit).all()
    print(f"[DEBUG] Returning {len(players)} players for coach {current_user.username}")
    return players


@router.get("/{player_id}", response_model=PlayerResponse)
def get_player(player_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get a specific player by ID (user's player only)."""
    # Join with Team to ensure user owns the team
    player = db.query(Player).join(Team, Player.team_id == Team.id).filter(
        Player.id == player_id,
        Team.user_id == current_user.id
    ).first()
    
    if not player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Player not found or you don't have access",
        )
    return player


@router.post("", response_model=PlayerResponse, status_code=status.HTTP_201_CREATED)
def create_player(player: PlayerCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create a new player (must belong to user's team)."""
    try:
        # Verify the team belongs to current user
        if player.team_id:
            team = db.query(Team).filter(Team.id == player.team_id, Team.user_id == current_user.id).first()
            if not team:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You don't have access to this team"
                )
        
        logger.info(f"Coach {current_user.username} creating player with data: {player}")
        db_player = Player(**player.model_dump())
        db.add(db_player)
        db.commit()
        db.refresh(db_player)
        print(f"[DEBUG] Player created: {db_player.name} for coach {current_user.username}")
        return db_player
    except Exception as e:
        logger.error(f"Error creating player: {e}", exc_info=True)
        raise


@router.put("/{player_id}", response_model=PlayerResponse)
def update_player(
    player_id: int, player: PlayerUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Update an existing player (user's player only)."""
    # Verify ownership
    db_player = db.query(Player).join(Team, Player.team_id == Team.id).filter(
        Player.id == player_id,
        Team.user_id == current_user.id
    ).first()
    
    if not db_player:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Player not found or you don't have access",
        )

    # Log photo persistence
    existing_photo = db_player.photo_url
    print(f"[DEBUG] Updating player {player_id} '{db_player.name}' for coach {current_user.username}")
    print(f"[DEBUG] Existing photo: {'YES (' + str(len(existing_photo)) + ' bytes)' if existing_photo else 'NO'}")

    update_data = player.model_dump(exclude_unset=True)
    print(f"[DEBUG] Update fields received: {list(update_data.keys())}")
    
    for key, value in update_data.items():
        setattr(db_player, key, value)
    
    # Confirm what photo will be saved
    if 'photo_url' in update_data:
        print(f"[DEBUG] New photo_url in request: {'YES (' + str(len(update_data['photo_url'])) + ' bytes)' if update_data['photo_url'] else 'CLEARED'}")
    else:
        print(f"[DEBUG] No photo_url in request - keeping existing: {'YES' if db_player.photo_url else 'NO'}")

    db.commit()
    db.refresh(db_player)
    print(f"[DEBUG] After commit, player {player_id} has photo: {'YES' if db_player.photo_url else 'NO'}")
    return db_player


@router.delete("/{player_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_player(player_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Delete a player (user's player only)."""
    db_player = db.query(Player).join(Team, Player.team_id == Team.id).filter(
        Player.id == player_id,
        Team.user_id == current_user.id
    ).first()
    
    if not db_player:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Player not found or you don't have access",
        )
    
    print(f"[DEBUG] Coach {current_user.username} deleting player {player_id}")
    db.delete(db_player)
    db.commit()
    return None
