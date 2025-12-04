#!/usr/bin/env python3
"""Test script to verify admin can see coaches list."""

from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import User
from app.config import settings

def test_coaches():
    """Check if coaches exist and can be retrieved."""
    try:
        # Get database URL
        db_url = settings.database_url
        print(f"[TEST] Database: {db_url}")
        
        # Create engine and connect
        engine = create_engine(db_url)
        
        with Session(engine) as db:
            # Get all users
            all_users = db.query(User).all()
            print(f"\n[TEST] Total users in database: {len(all_users)}\n")
            print("[TEST] All Users:")
            print("-" * 80)
            for user in all_users:
                print(f"  ID: {user.id:2d} | Username: {user.username:20s} | Role: {user.role:10s} | Email: {user.email}")
            print("-" * 80)
            
            # Count by role
            admins = db.query(User).filter(User.role == "admin").all()
            coaches = db.query(User).filter(User.role == "coach").all()
            nulls = db.query(User).filter(User.role == None).all()
            others = db.query(User).filter(~User.role.in_(["admin", "coach"])).all()
            
            print(f"\n[TEST] SUMMARY:")
            print(f"  - Admins (role='admin'):   {len(admins)}")
            print(f"  - Coaches (role='coach'):  {len(coaches)}")
            print(f"  - NULL roles:              {len(nulls)}")
            print(f"  - Other roles:             {len(others)}")
            
            if len(coaches) == 0:
                print(f"\n⚠️  WARNING: NO COACHES FOUND!")
                print(f"[TEST] Coaches with NULL or other roles:")
                non_admin = db.query(User).filter(User.role != "admin").all()
                for user in non_admin:
                    print(f"  - {user.username}: role='{user.role}'")
            
            print(f"\n[TEST] Expected Admin Query (/admin/coaches):")
            print(f"  Query: User.role == 'coach'")
            print(f"  Result: {len(coaches)} coaches")
            
            if coaches:
                print(f"\n[TEST] Coaches that would be returned:")
                for coach in coaches:
                    print(f"  - {coach.username} (ID={coach.id})")
    
    except Exception as e:
        print(f"[ERROR] {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_coaches()
