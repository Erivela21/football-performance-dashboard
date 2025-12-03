"""Test team ownership enforcement."""
import requests
import json
from app.db.database import SessionLocal
from app.models.models import User, Team
from app.utils.auth import get_password_hash

# Setup database
db = SessionLocal()

# Create demo user
demo = db.query(User).filter(User.email == "demo@coach.com").first()
if not demo:
    demo = User(username="demo", email="demo@coach.com", password_hash=get_password_hash("Demo1234"), is_active=1)
    db.add(demo)
    db.commit()
    db.refresh(demo)
else:
    print(f"Demo user already exists: ID={demo.id}")

# Create another user for testing
coach2 = db.query(User).filter(User.email == "coach2@test.com").first()
if not coach2:
    coach2 = User(username="coach2", email="coach2@test.com", password_hash=get_password_hash("Coach2234"), is_active=1)
    db.add(coach2)
    db.commit()
    db.refresh(coach2)
else:
    print(f"Coach2 user already exists: ID={coach2.id}")

# Store IDs before closing session
demo_id = demo.id
coach2_id = coach2.id

# Clear existing teams
db.query(Team).delete()
db.commit()

# Create teams for each user
team1 = Team(name="Demo Team A", user_id=demo_id)
team2 = Team(name="Demo Team B", user_id=demo_id)
team3 = Team(name="Coach2 Team", user_id=coach2_id)
db.add(team1)
db.add(team2)
db.add(team3)
db.commit()

db.close()

print("\n✓ Database setup completed:")
print(f"  Demo user ID: {demo_id}")
print(f"  Coach2 user ID: {coach2_id}")
print(f"  Team A (user {demo_id})")
print(f"  Team B (user {demo_id})")
print(f"  Team C (user {coach2_id})")
print("\nNow run tests with:")
print("  python -m pytest tests/test_api.py -v")
