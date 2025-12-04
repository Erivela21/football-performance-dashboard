"""Players API router for CRUD operations on players."""

from typing import List
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.models import Player, User
from app.schemas.schemas import PlayerCreate, PlayerUpdate, PlayerResponse
from app.utils.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/players", tags=["players"])


@router.get("", response_model=List[PlayerResponse])
def get_players(skip: int = 0, limit: int = 100, team_id: int = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get players with optional team filtering and pagination. Coaches only."""
    print(f"[DEBUG] get_players called by user {current_user.username} with role='{current_user.role}'")
    if current_user.role == 'admin':
        print(f"[DEBUG] Blocking admin user {current_user.username}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admins cannot access players"
        )
    print(f"[DEBUG] Allowing coach {current_user.username} to access players")
    query = db.query(Player)
    if team_id:
        query = query.filter(Player.team_id == team_id)
    players = query.order_by(Player.id).offset(skip).limit(limit).all()
    return players


@router.get("/{player_id}", response_model=PlayerResponse)
def get_player(player_id: int, db: Session = Depends(get_db)):
    """Get a specific player by ID."""
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Player with id {player_id} not found",
        )
    return player


@router.post("", response_model=PlayerResponse, status_code=status.HTTP_201_CREATED)
def create_player(player: PlayerCreate, db: Session = Depends(get_db)):
    """Create a new player."""
    try:
        logger.info(f"Creating player with data: {player}")
        db_player = Player(**player.model_dump())
        db.add(db_player)
        db.commit()
        db.refresh(db_player)
        return db_player
    except Exception as e:
        logger.error(f"Error creating player: {e}", exc_info=True)
        raise


@router.put("/{player_id}", response_model=PlayerResponse)
def update_player(
    player_id: int, player: PlayerUpdate, db: Session = Depends(get_db)
):
    """Update an existing player."""
    db_player = db.query(Player).filter(Player.id == player_id).first()
    if not db_player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Player with id {player_id} not found",
        )

    # Log photo persistence
    existing_photo = db_player.photo_url
    print(f"[DEBUG] Updating player {player_id} '{db_player.name}'")
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
def delete_player(player_id: int, db: Session = Depends(get_db)):
    """Delete a player."""
    db_player = db.query(Player).filter(Player.id == player_id).first()
    if not db_player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Player with id {player_id} not found",
        )
    db.delete(db_player)
    db.commit()
    return None
