"""Admin routes for managing coaches only."""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.models import User
from app.schemas.schemas import UserResponse, AdminUserUpdate, CoachListResponse
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


@router.post("/coaches", response_model=UserResponse)
def create_coach(
    username: str,
    email: str,
    password: str,
    admin: User = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Create a new coach account. Admin only."""
    # Check if username already exists
    existing_user = db.query(User).filter(User.username == username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )
    
    # Check if email already exists
    existing_email = db.query(User).filter(User.email == email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists"
        )
    
    # Create new coach
    new_coach = User(
        username=username,
        email=email,
        password_hash=get_password_hash(password),
        role="coach",
        is_active=1
    )
    db.add(new_coach)
    db.commit()
    db.refresh(new_coach)
    return new_coach


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
    """Update coach (username, email, password, role, or status). Admin only."""
    coach = db.query(User).filter(User.id == coach_id).first()
    if not coach:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Coach not found"
        )
    
    # Update username if provided
    if update_data.username and update_data.username != coach.username:
        existing = db.query(User).filter(User.username == update_data.username).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
        coach.username = update_data.username
    
    # Update email if provided
    if update_data.email and update_data.email != coach.email:
        existing = db.query(User).filter(User.email == update_data.email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        coach.email = update_data.email
    
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
    """Delete a coach account (cascade deletes teams and players). Admin only."""
    coach = db.query(User).filter(User.id == coach_id).first()
    if not coach:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Coach not found"
        )
    
    db.delete(coach)
    db.commit()
    return None

