"""Admin routes for managing coaches only."""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.models import User
from app.schemas.schemas import UserResponse, AdminUserUpdate, CoachListResponse, UserCreate
from app.utils.auth import get_current_user, get_password_hash

router = APIRouter(prefix="/admin", tags=["admin"])


def verify_admin(current_user: User = Depends(get_current_user)):
    """Verify that current user is an admin."""
    print(f"[DEBUG] verify_admin called for user: {current_user.username}, role='{current_user.role}' (type: {type(current_user.role)})")
    
    # Check if role is 'admin' (handle None, empty string, whitespace)
    is_admin = current_user.role and current_user.role.strip().lower() == "admin"
    
    if not is_admin:
        print(f"[DEBUG] DENIED: User {current_user.username} has role='{current_user.role}' (not 'admin')")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    print(f"[DEBUG] ALLOWED: User {current_user.username} is admin")
    return current_user


@router.post("/coaches", response_model=UserResponse)
def create_coach(
    user_data: UserCreate,
    admin: User = Depends(verify_admin),
    db: Session = Depends(get_db)
):
    """Create a new coach account. Admin only."""
    print(f"[DEBUG] Admin {admin.username} creating coach: {user_data.username}")
    
    # Check if username already exists
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        print(f"[DEBUG] Username {user_data.username} already exists")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )
    
    # Check if email already exists
    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        print(f"[DEBUG] Email {user_data.email} already exists")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists"
        )
    
    # Create new coach
    new_coach = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        role="coach",
        is_active=1
    )
    db.add(new_coach)
    db.commit()
    db.refresh(new_coach)
    print(f"[DEBUG] ✓ Coach {new_coach.username} created with id={new_coach.id}")
    return new_coach


@router.get("/coaches", response_model=List[CoachListResponse])
def list_coaches(admin: User = Depends(verify_admin), db: Session = Depends(get_db)):
    """List all coaches with their teams."""
    # Debug: Count all users first
    total_users = db.query(User).count()
    print("[DEBUG] ===== COACHES LIST REQUESTED =====")
    print(f"[DEBUG] Admin user: {admin.username} (id={admin.id}, role='{admin.role}')")
    print(f"[DEBUG] Total users in database: {total_users}")
    
    # Get all users and show their roles
    all_users = db.query(User).all()
    print("[DEBUG] All users in database:")
    for user in all_users:
        role_display = f"'{user.role}'" if user.role else "NULL"
        print(f"[DEBUG]   {user.id}: {user.username:20s} | role={role_display:10s} | email={user.email} | active={user.is_active}")
    
    # Get coaches - MUST have role='coach' (not NULL, not admin, case-insensitive)
    # Explicitly select only the fields we need to avoid serializing relationships
    coaches = db.query(
        User.id,
        User.username,
        User.email,
        User.role,
        User.is_active
    ).filter(
        User.role == "coach"
    ).all()
    
    print("[DEBUG] Query: User.role == 'coach'")
    print(f"[DEBUG] Found {len(coaches)} users with role='coach'")
    for coach in coaches:
        print(f"[DEBUG]   - ID={coach.id}, username={coach.username}, role='{coach.role}', email={coach.email}, active={coach.is_active}")
    
    # DEBUG: Also try case-insensitive search to see if there's a case mismatch
    coaches_case_insensitive = db.query(User).filter(
        User.role.ilike("coach")
    ).all()
    if len(coaches_case_insensitive) > len(coaches):
        print(f"[DEBUG] ⚠️  Case-insensitive search found {len(coaches_case_insensitive)} coaches (case mismatch detected!)")
        for coach in coaches_case_insensitive:
            if coach not in coaches:
                print(f"[DEBUG]   - MISSED: ID={coach.id}, username={coach.username}, role='{coach.role}'")
    
    print("[DEBUG] ===== END COACHES LIST =====\n")
    
    # Convert Row objects to CoachListResponse for serialization
    result = []
    for row in coaches:
        coach_response = CoachListResponse(
            id=row.id,
            username=row.username,
            email=row.email,
            role=row.role,
            is_active=row.is_active
        )
        result.append(coach_response)
    
    return result


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
    print(f"[DEBUG] update_coach called with coach_id={coach_id}")
    print(f"[DEBUG] update_data type: {type(update_data)}")
    print(f"[DEBUG] update_data dict: {update_data.model_dump()}")
    
    coach = db.query(User).filter(User.id == coach_id).first()
    if not coach:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Coach not found"
        )
    
    print(f"[DEBUG] Found coach: {coach.username}, updating with: username={getattr(update_data, 'username', None)}, email={getattr(update_data, 'email', None)}, password={'***' if getattr(update_data, 'password', None) else None}")
    
    # Update username if provided
    if update_data.username and update_data.username != coach.username:
        existing = db.query(User).filter(User.username == update_data.username).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
        coach.username = update_data.username
        print(f"[DEBUG] Updated username to: {update_data.username}")
    
    # Update email if provided
    if update_data.email and update_data.email != coach.email:
        existing = db.query(User).filter(User.email == update_data.email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        coach.email = update_data.email
        print(f"[DEBUG] Updated email to: {update_data.email}")
    
    # Update password if provided
    if update_data.password:
        coach.password_hash = get_password_hash(update_data.password)
        print(f"[DEBUG] Updated password")
    
    # Update role if provided
    if update_data.role:
        coach.role = update_data.role
        print(f"[DEBUG] Updated role to: {update_data.role}")
    
    # Update is_active if provided
    if update_data.is_active is not None:
        coach.is_active = int(update_data.is_active)
        print(f"[DEBUG] Updated is_active to: {coach.is_active}")
    
    db.commit()
    db.refresh(coach)
    print(f"✓ Coach {coach.id} updated successfully")
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

