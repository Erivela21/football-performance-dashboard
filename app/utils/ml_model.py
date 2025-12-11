"""
Simple Machine Learning Model for Injury Risk Prediction.

This module provides:
1. Synthetic data generation for training
2. A simple ML model to predict injury risk based on player metrics
3. Functions to get predictions for individual players
"""

import random
from typing import Dict, List, Optional
from datetime import datetime, timedelta

# Simple model weights (simulating a trained logistic regression)
# In a real scenario, you'd train this on actual historical data
MODEL_WEIGHTS = {
    "high_training_load": 0.25,      # High weekly training minutes increases risk
    "high_intensity_ratio": 0.20,    # Too much high-intensity work
    "insufficient_rest": 0.20,       # Not enough rest days
    "age_factor": 0.15,              # Older players have higher risk
    "previous_injuries": 0.15,       # History of injuries
    "fatigue_accumulation": 0.05,    # Cumulative fatigue
}

# Thresholds for risk factors
THRESHOLDS = {
    "weekly_training_minutes_high": 600,    # More than 10 hours/week
    "weekly_training_minutes_optimal": 400,  # 6-7 hours/week ideal
    "high_intensity_percentage": 40,         # More than 40% high intensity is risky
    "min_rest_days_per_week": 2,            # At least 2 rest days needed
    "age_risk_threshold": 30,               # Increased risk after 30
    "max_heart_rate_warning": 185,          # Sustained high HR
    "sprint_count_high": 50,                # Too many sprints per session
}


def generate_synthetic_players(count: int = 20) -> List[Dict]:
    """
    Generate synthetic player data for demonstration purposes.
    
    Returns a list of players with realistic training metrics.
    """
    positions = ["Goalkeeper", "Defender", "Midfielder", "Forward"]
    first_names = ["Marcus", "James", "Carlos", "Mohamed", "Kevin", "Sergio", 
                   "David", "Alex", "Bruno", "Luka", "Toni", "Joshua",
                   "Erling", "Kylian", "Vinicius", "Jude", "Phil", "Mason",
                   "Bukayo", "Jamal"]
    last_names = ["Silva", "Rodriguez", "Martinez", "Williams", "Jones", 
                  "Garcia", "Johnson", "Brown", "Miller", "Davis",
                  "Fernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
                  "Thomas", "Taylor", "Moore", "Jackson", "Martin"]
    
    players = []
    for i in range(count):
        # Generate age (18-36 years old)
        age = random.randint(18, 36)
        
        # Generate training load (varies by position and randomly)
        base_minutes = random.randint(300, 700)
        
        # Generate realistic metrics
        player = {
            "id": i + 1,
            "name": f"{random.choice(first_names)} {random.choice(last_names)}",
            "position": random.choice(positions),
            "age": age,
            "metrics": {
                "weekly_training_minutes": base_minutes,
                "sessions_this_week": random.randint(3, 7),
                "high_intensity_percentage": random.randint(20, 55),
                "rest_days_last_week": random.randint(0, 3),
                "avg_heart_rate": random.randint(140, 175),
                "max_heart_rate_recorded": random.randint(170, 200),
                "total_distance_km": round(random.uniform(25, 70), 1),
                "sprint_count_weekly": random.randint(20, 80),
                "previous_injuries_count": random.randint(0, 4),
                "days_since_last_injury": random.randint(30, 500) if random.random() > 0.3 else random.randint(7, 29),
                "fatigue_score": random.randint(1, 10),  # 1=fresh, 10=exhausted
                "sleep_quality_avg": round(random.uniform(5, 9), 1),  # 1-10 scale
            }
        }
        players.append(player)
    
    return players


def calculate_injury_risk(player_metrics: Dict, age: int = 25) -> Dict:
    """
    Calculate injury risk score for a player based on their metrics.
    
    Uses a weighted scoring system that considers multiple risk factors.
    Returns a risk score (0-100) and detailed breakdown.
    
    Args:
        player_metrics: Dictionary containing player's training metrics
        age: Player's age
        
    Returns:
        Dictionary with risk_score, risk_level, and contributing factors
    """
    risk_factors = []
    total_risk = 0
    
    # 1. Training Load Risk
    weekly_minutes = player_metrics.get("weekly_training_minutes", 400)
    if weekly_minutes > THRESHOLDS["weekly_training_minutes_high"]:
        load_risk = min(25, (weekly_minutes - THRESHOLDS["weekly_training_minutes_high"]) / 10)
        total_risk += load_risk
        risk_factors.append({
            "factor": "High Training Load",
            "description": f"Training {weekly_minutes} min/week exceeds safe threshold ({THRESHOLDS['weekly_training_minutes_high']} min)",
            "contribution": round(load_risk, 1),
            "severity": "high" if load_risk > 15 else "medium"
        })
    
    # 2. High Intensity Ratio Risk
    intensity_pct = player_metrics.get("high_intensity_percentage", 30)
    if intensity_pct > THRESHOLDS["high_intensity_percentage"]:
        intensity_risk = min(20, (intensity_pct - THRESHOLDS["high_intensity_percentage"]) * 0.8)
        total_risk += intensity_risk
        risk_factors.append({
            "factor": "High Intensity Overload",
            "description": f"{intensity_pct}% high-intensity training (recommended: <{THRESHOLDS['high_intensity_percentage']}%)",
            "contribution": round(intensity_risk, 1),
            "severity": "high" if intensity_risk > 12 else "medium"
        })
    
    # 3. Insufficient Rest Risk
    rest_days = player_metrics.get("rest_days_last_week", 2)
    if rest_days < THRESHOLDS["min_rest_days_per_week"]:
        rest_risk = (THRESHOLDS["min_rest_days_per_week"] - rest_days) * 10
        total_risk += rest_risk
        risk_factors.append({
            "factor": "Insufficient Recovery",
            "description": f"Only {rest_days} rest days last week (minimum: {THRESHOLDS['min_rest_days_per_week']})",
            "contribution": round(rest_risk, 1),
            "severity": "high" if rest_days == 0 else "medium"
        })
    
    # 4. Age Factor Risk
    if age > THRESHOLDS["age_risk_threshold"]:
        age_risk = min(15, (age - THRESHOLDS["age_risk_threshold"]) * 2)
        total_risk += age_risk
        risk_factors.append({
            "factor": "Age-Related Risk",
            "description": f"Players over {THRESHOLDS['age_risk_threshold']} require more careful load management",
            "contribution": round(age_risk, 1),
            "severity": "medium"
        })
    
    # 5. Previous Injuries Risk
    prev_injuries = player_metrics.get("previous_injuries_count", 0)
    if prev_injuries > 0:
        injury_history_risk = min(15, prev_injuries * 4)
        total_risk += injury_history_risk
        risk_factors.append({
            "factor": "Injury History",
            "description": f"{prev_injuries} previous injuries on record",
            "contribution": round(injury_history_risk, 1),
            "severity": "high" if prev_injuries >= 3 else "medium"
        })
    
    # 6. Recent Injury Risk
    days_since_injury = player_metrics.get("days_since_last_injury", 365)
    if days_since_injury < 30:
        recent_injury_risk = max(0, (30 - days_since_injury) * 0.5)
        total_risk += recent_injury_risk
        risk_factors.append({
            "factor": "Recent Injury",
            "description": f"Only {days_since_injury} days since last injury - elevated re-injury risk",
            "contribution": round(recent_injury_risk, 1),
            "severity": "high"
        })
    
    # 7. Fatigue Accumulation Risk
    fatigue = player_metrics.get("fatigue_score", 5)
    if fatigue > 7:
        fatigue_risk = (fatigue - 7) * 5
        total_risk += fatigue_risk
        risk_factors.append({
            "factor": "Accumulated Fatigue",
            "description": f"High fatigue score ({fatigue}/10) - muscles not fully recovered",
            "contribution": round(fatigue_risk, 1),
            "severity": "high" if fatigue >= 9 else "medium"
        })
    
    # 8. Sprint Overload Risk
    sprints = player_metrics.get("sprint_count_weekly", 30)
    if sprints > THRESHOLDS["sprint_count_high"]:
        sprint_risk = min(10, (sprints - THRESHOLDS["sprint_count_high"]) * 0.3)
        total_risk += sprint_risk
        risk_factors.append({
            "factor": "Sprint Overload",
            "description": f"{sprints} sprints this week (threshold: {THRESHOLDS['sprint_count_high']})",
            "contribution": round(sprint_risk, 1),
            "severity": "medium"
        })
    
    # Cap total risk at 100
    total_risk = min(100, total_risk)
    
    # Determine risk level
    if total_risk >= 70:
        risk_level = "critical"
        recommendation = "IMMEDIATE REST REQUIRED - High probability of injury within 7 days"
    elif total_risk >= 50:
        risk_level = "high"
        recommendation = "Reduce training intensity by 40% and add extra rest day"
    elif total_risk >= 30:
        risk_level = "moderate"
        recommendation = "Monitor closely and consider reducing high-intensity work"
    else:
        risk_level = "low"
        recommendation = "Continue current training plan - athlete is in good condition"
    
    return {
        "risk_score": round(total_risk, 1),
        "risk_level": risk_level,
        "recommendation": recommendation,
        "risk_factors": risk_factors,
        "metrics_analyzed": {
            "weekly_training_minutes": weekly_minutes,
            "high_intensity_percentage": intensity_pct,
            "rest_days": rest_days,
            "fatigue_score": fatigue,
            "sprint_count": sprints,
            "age": age
        }
    }


def predict_all_players(players: Optional[List[Dict]] = None) -> List[Dict]:
    """
    Run injury risk prediction for all players.
    
    Args:
        players: List of player dictionaries. If None, generates synthetic data.
        
    Returns:
        List of players with their injury risk predictions
    """
    if players is None:
        players = generate_synthetic_players(20)
    
    results = []
    for player in players:
        prediction = calculate_injury_risk(
            player_metrics=player.get("metrics", {}),
            age=player.get("age", 25)
        )
        results.append({
            "player_id": player.get("id"),
            "player_name": player.get("name"),
            "position": player.get("position"),
            "age": player.get("age"),
            **prediction
        })
    
    # Sort by risk score (highest first)
    results.sort(key=lambda x: x["risk_score"], reverse=True)
    
    return results


def get_team_risk_summary(predictions: List[Dict]) -> Dict:
    """
    Generate a summary of injury risk across the team.
    
    Args:
        predictions: List of player predictions from predict_all_players()
        
    Returns:
        Dictionary with team-level statistics
    """
    if not predictions:
        return {"error": "No predictions available"}
    
    risk_levels = {"critical": 0, "high": 0, "moderate": 0, "low": 0}
    total_risk = 0
    
    for p in predictions:
        risk_levels[p["risk_level"]] += 1
        total_risk += p["risk_score"]
    
    avg_risk = total_risk / len(predictions)
    
    # Find most common risk factors
    all_factors = []
    for p in predictions:
        for factor in p.get("risk_factors", []):
            all_factors.append(factor["factor"])
    
    factor_counts = {}
    for f in all_factors:
        factor_counts[f] = factor_counts.get(f, 0) + 1
    
    top_factors = sorted(factor_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    
    return {
        "total_players": len(predictions),
        "average_risk_score": round(avg_risk, 1),
        "risk_distribution": risk_levels,
        "players_at_critical_risk": risk_levels["critical"],
        "players_at_high_risk": risk_levels["high"],
        "top_risk_factors": [{"factor": f, "affected_players": c} for f, c in top_factors],
        "team_health_status": "ALERT" if risk_levels["critical"] > 0 else "CAUTION" if risk_levels["high"] > 2 else "GOOD"
    }


# Pre-generate synthetic players for consistent demo data
DEMO_PLAYERS = generate_synthetic_players(20)
