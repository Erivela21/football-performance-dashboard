"""
Database Seeding Utility.

This module provides functions to seed the database with demo data including:
- A demo coach user
- A demo team
- Demo players with realistic data
- Training sessions with statistics
- Upcoming match schedule
"""

import random
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session

from app.models.models import User, Team, Player, TrainingSession, SessionStats, MatchSchedule
from app.utils.auth import get_password_hash


# Demo players data - these will be added to the database
DEMO_PLAYERS = [
    {"name": "Marcus", "surname": "Silva", "position": "Forward", "jersey": 9, "age": 24},
    {"name": "James", "surname": "Rodriguez", "position": "Midfielder", "jersey": 10, "age": 28},
    {"name": "Carlos", "surname": "Martinez", "position": "Defender", "jersey": 4, "age": 26},
    {"name": "Mohamed", "surname": "Williams", "position": "Forward", "jersey": 11, "age": 22},
    {"name": "Kevin", "surname": "Jones", "position": "Midfielder", "jersey": 8, "age": 30},
    {"name": "Sergio", "surname": "Garcia", "position": "Goalkeeper", "jersey": 1, "age": 29},
    {"name": "David", "surname": "Johnson", "position": "Defender", "jersey": 5, "age": 25},
    {"name": "Alex", "surname": "Brown", "position": "Midfielder", "jersey": 6, "age": 23},
    {"name": "Bruno", "surname": "Miller", "position": "Forward", "jersey": 7, "age": 27},
    {"name": "Luka", "surname": "Davis", "position": "Midfielder", "jersey": 14, "age": 31},
    {"name": "Toni", "surname": "Fernandez", "position": "Defender", "jersey": 3, "age": 28},
    {"name": "Joshua", "surname": "Lopez", "position": "Defender", "jersey": 2, "age": 24},
    {"name": "Erling", "surname": "Gonzalez", "position": "Forward", "jersey": 17, "age": 23},
    {"name": "Kylian", "surname": "Wilson", "position": "Forward", "jersey": 19, "age": 25},
    {"name": "Vinicius", "surname": "Anderson", "position": "Midfielder", "jersey": 20, "age": 22},
    {"name": "Jude", "surname": "Thomas", "position": "Midfielder", "jersey": 22, "age": 21},
    {"name": "Phil", "surname": "Taylor", "position": "Midfielder", "jersey": 47, "age": 24},
    {"name": "Mason", "surname": "Moore", "position": "Forward", "jersey": 25, "age": 23},
    {"name": "Bukayo", "surname": "Jackson", "position": "Forward", "jersey": 7, "age": 22},
    {"name": "Jamal", "surname": "Martin", "position": "Midfielder", "jersey": 34, "age": 21},
]


def calculate_birth_date(age: int) -> str:
    """Calculate birth date from age."""
    today = datetime.now(timezone.utc)
    birth_year = today.year - age
    return f"{birth_year}-06-15"  # Use June 15 as a standard birth date


def seed_demo_coach(db: Session) -> User:
    """Create or get the demo coach user."""
    demo_coach = db.query(User).filter(User.username == "demo_coach").first()
    
    if not demo_coach:
        demo_coach = User(
            username="demo_coach",
            email="coach@pitchperfect.com",
            password_hash=get_password_hash("Coach1234"),
            role="coach",
            is_active=1
        )
        db.add(demo_coach)
        db.commit()
        db.refresh(demo_coach)
        print(f"[SEED] ✓ Created demo coach: coach@pitchperfect.com / Coach1234")
    else:
        print(f"[SEED] Demo coach already exists (id={demo_coach.id})")
    
    return demo_coach


def seed_demo_team(db: Session, coach: User) -> Team:
    """Create or get the demo team."""
    demo_team = db.query(Team).filter(
        Team.user_id == coach.id,
        Team.name == "PitchPerfect FC"
    ).first()
    
    if not demo_team:
        demo_team = Team(
            user_id=coach.id,
            name="PitchPerfect FC",
            division="Premier League",
            color_primary="#00ff88",
            color_secondary="#00ccff"
        )
        db.add(demo_team)
        db.commit()
        db.refresh(demo_team)
        print(f"[SEED] ✓ Created demo team: PitchPerfect FC (id={demo_team.id})")
    else:
        print(f"[SEED] Demo team already exists (id={demo_team.id})")
    
    return demo_team


def seed_demo_players(db: Session, team: Team) -> list:
    """Create demo players for the team."""
    created_players = []
    
    # Check how many players already exist for this team
    existing_count = db.query(Player).filter(Player.team_id == team.id).count()
    
    if existing_count >= 15:
        print(f"[SEED] Team already has {existing_count} players, skipping player seeding")
        return db.query(Player).filter(Player.team_id == team.id).all()
    
    for player_data in DEMO_PLAYERS:
        # Check if player already exists (by name and team)
        existing = db.query(Player).filter(
            Player.name == player_data["name"],
            Player.surname == player_data["surname"],
            Player.team_id == team.id
        ).first()
        
        if existing:
            created_players.append(existing)
            continue
        
        player = Player(
            name=player_data["name"],
            surname=player_data["surname"],
            position=player_data["position"],
            jersey_number=player_data["jersey"],
            birth_date=calculate_birth_date(player_data["age"]),
            team_id=team.id,
            team=team.name
        )
        db.add(player)
        created_players.append(player)
    
    db.commit()
    
    # Refresh all players to get their IDs
    for player in created_players:
        db.refresh(player)
    
    print(f"[SEED] ✓ Created/found {len(created_players)} players for {team.name}")
    return created_players


def seed_training_sessions(db: Session, players: list) -> None:
    """Create training sessions with stats for the last 14 days."""
    session_types = ["Fitness", "Tactical", "Technical", "Match Prep", "Recovery"]
    
    # Check if sessions already exist
    if players:
        existing_sessions = db.query(TrainingSession).filter(
            TrainingSession.player_id == players[0].id
        ).count()
        if existing_sessions > 5:
            print(f"[SEED] Training sessions already exist ({existing_sessions}), skipping")
            return
    
    sessions_created = 0
    
    for player in players:
        # Create 5-10 sessions per player over the last 14 days
        num_sessions = random.randint(5, 10)
        
        for _ in range(num_sessions):
            # Random date in last 14 days
            days_ago = random.randint(0, 13)
            session_date = datetime.now(timezone.utc) - timedelta(days=days_ago)
            
            # Create training session
            session = TrainingSession(
                player_id=player.id,
                session_date=session_date,
                duration_minutes=random.randint(60, 120),
                session_type=random.choice(session_types),
                notes=f"Regular {random.choice(session_types).lower()} session"
            )
            db.add(session)
            db.flush()  # Get the session ID
            
            # Create stats for this session
            stats = SessionStats(
                session_id=session.id,
                distance_km=round(random.uniform(5.0, 12.0), 2),
                max_speed_kmh=round(random.uniform(25.0, 35.0), 1),
                avg_heart_rate=random.randint(130, 170),
                max_heart_rate=random.randint(170, 195),
                calories_burned=random.randint(400, 900),
                sprints_count=random.randint(10, 40)
            )
            db.add(stats)
            sessions_created += 1
    
    db.commit()
    print(f"[SEED] ✓ Created {sessions_created} training sessions with stats")


def seed_match_schedule(db: Session, team: Team) -> None:
    """Create upcoming match schedule."""
    # Check if schedule already exists
    existing_events = db.query(MatchSchedule).filter(
        MatchSchedule.team_id == team.id
    ).count()
    
    if existing_events > 3:
        print(f"[SEED] Schedule already exists ({existing_events} events), skipping")
        return
    
    opponents = [
        "Manchester United", "Liverpool FC", "Arsenal", "Chelsea",
        "Manchester City", "Tottenham", "Newcastle United"
    ]
    locations = [
        "Home Stadium", "Away Ground", "National Stadium", "Training Complex"
    ]
    
    events = [
        {
            "event_type": "match",
            "title": f"League Match vs {random.choice(opponents)}",
            "opponent": random.choice(opponents),
            "days_ahead": 3,
            "location": "Home Stadium",
            "is_important": True
        },
        {
            "event_type": "training",
            "title": "Team Training Session",
            "opponent": None,
            "days_ahead": 1,
            "location": "Training Complex",
            "is_important": False
        },
        {
            "event_type": "match",
            "title": f"Cup Match vs {random.choice(opponents)}",
            "opponent": random.choice(opponents),
            "days_ahead": 7,
            "location": "Away Ground",
            "is_important": True
        },
        {
            "event_type": "training",
            "title": "Recovery Session",
            "opponent": None,
            "days_ahead": 2,
            "location": "Training Complex",
            "is_important": False
        },
        {
            "event_type": "important_match",
            "title": f"Derby Match vs {random.choice(opponents)}",
            "opponent": random.choice(opponents),
            "days_ahead": 10,
            "location": "Home Stadium",
            "is_important": True
        }
    ]
    
    for event_data in events:
        event = MatchSchedule(
            team_id=team.id,
            event_type=event_data["event_type"],
            title=event_data["title"],
            opponent=event_data["opponent"],
            event_date=datetime.now(timezone.utc) + timedelta(days=event_data["days_ahead"]),
            location=event_data["location"],
            is_important=event_data["is_important"]
        )
        db.add(event)
    
    db.commit()
    print(f"[SEED] ✓ Created {len(events)} scheduled events")


def seed_all_demo_data(db: Session) -> dict:
    """
    Seed all demo data into the database.
    
    Returns a summary of what was created.
    """
    print("\n" + "="*50)
    print("[SEED] Starting database seeding...")
    print("="*50)
    
    try:
        # 1. Create demo coach
        coach = seed_demo_coach(db)
        
        # 2. Create demo team
        team = seed_demo_team(db, coach)
        
        # 3. Create demo players
        players = seed_demo_players(db, team)
        
        # 4. Create training sessions with stats
        seed_training_sessions(db, players)
        
        # 5. Create match schedule
        seed_match_schedule(db, team)
        
        print("="*50)
        print("[SEED] ✓ Database seeding completed successfully!")
        print(f"[SEED] Demo login: coach@pitchperfect.com / Coach1234")
        print("="*50 + "\n")
        
        return {
            "success": True,
            "coach_id": coach.id,
            "team_id": team.id,
            "players_count": len(players)
        }
        
    except Exception as e:
        print(f"[SEED] ✗ Error during seeding: {e}")
        db.rollback()
        return {"success": False, "error": str(e)}
