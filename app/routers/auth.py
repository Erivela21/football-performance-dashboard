"""Authentication routes: register and login."""
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.models import User
from app.schemas.schemas import UserCreate, UserResponse, Token
from app.utils.auth import get_password_hash, verify_password, create_access_token, get_current_user
from app.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user: UserCreate, db: Session = Depends(get_db)):
    # Check existing username
    existing = db.query(User).filter(User.username == user.username).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already registered")

    # Optional: check email uniqueness
    if user.email:
        existing_email = db.query(User).filter(User.email == user.email).first()
        if existing_email:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    user_obj = User(
        username=user.username,
        email=user.email,
        password_hash=get_password_hash(user.password),
    )
    db.add(user_obj)
    db.commit()
    db.refresh(user_obj)
    print(f"[DEBUG] ✓ User {user_obj.username} registered with id={user_obj.id}, role={user_obj.role}")
    return user_obj


@router.post("/login", response_model=Token)
def login(form_data: UserCreate, db: Session = Depends(get_db)):
    try:
        # Here we use UserCreate as a simple container for username/password
        user = db.query(User).filter(User.username == form_data.username).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

        if not verify_password(form_data.password, user.password_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

        access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
        access_token = create_access_token(data={"sub": user.username}, expires_delta=access_token_expires)
        return {"access_token": access_token, "token_type": "bearer"}
    except HTTPException:
        raise
    except Exception as e:
        # Log the error (in a real app)
        print(f"Login error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Login error: {str(e)}")


@router.put("/me", response_model=UserResponse)
def update_profile(
    user_update: UserCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user's profile (username, email, password)."""
    try:
        # Check if new username already exists (if changing username)
        if user_update.username != current_user.username:
            existing = db.query(User).filter(User.username == user_update.username).first()
            if existing:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already taken")
        
        # Check if new email already exists (if changing email)
        if user_update.email and user_update.email != current_user.email:
            existing_email = db.query(User).filter(User.email == user_update.email).first()
            if existing_email:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
        
        # Update fields
        current_user.username = user_update.username
        if user_update.email:
            current_user.email = user_update.email
        if user_update.password:
            current_user.password_hash = get_password_hash(user_update.password)
        
        db.commit()
        db.refresh(current_user)
        return current_user
    except HTTPException:
        raise
    except Exception as e:
        print(f"Profile update error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Update failed: {str(e)}")


@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information including role."""
    return current_user

