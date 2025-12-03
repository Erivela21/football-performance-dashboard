"""Analytics API router for training load, injury risk, and insights."""

from typing import List, Dict, Any
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.db.database import get_db
from app.models.models import Player, TrainingSession, SessionStats

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/training-load")
def get_training_load(
    team_id: int = Query(None),
    days: int = Query(7, ge=1, le=365),
    db: Session = Depends(get_db)
):
    """Get training load analysis for all players."""
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    # Query to get player training load
    query = db.query(
        Player.id,
        Player.name,
        Player.position,
        Player.photo_url,
        func.count(TrainingSession.id).label('session_count'),
        func.sum(TrainingSession.duration_minutes).label('total_minutes'),
        func.avg(SessionStats.distance_km).label('avg_distance'),
        func.max(SessionStats.max_speed_kmh).label('max_speed'),
        func.avg(SessionStats.avg_heart_rate).label('avg_hr')
    ).join(
        TrainingSession, Player.id == TrainingSession.player_id
    ).outerjoin(
        SessionStats, TrainingSession.id == SessionStats.session_id
    ).filter(
        TrainingSession.session_date >= cutoff_date
    )
    
    if team_id:
        query = query.filter(Player.team_id == team_id)
    
    results = query.group_by(Player.id).all()
    
    players_load = []
    for result in results:
        # Calculate load score (0-100)
        total_mins = result.total_minutes or 0
        avg_dist = result.avg_distance or 0
        load_score = min(100, (total_mins / (days * 90)) * 100)  # 90 mins per day is 100%
        
        # Determine recommendation
        if load_score > 85:
            recommendation = "High load - Consider rest day"
            status_level = "warning"
        elif load_score > 70:
            recommendation = "Optimal training load"
            status_level = "optimal"
        elif load_score > 50:
            recommendation = "Moderate load - Can increase intensity"
            status_level = "moderate"
        else:
            recommendation = "Low load - Increase training volume"
            status_level = "low"
        
        players_load.append({
            "player_id": result.id,
            "player_name": result.name,
            "position": result.position,
            "photo_url": result.photo_url,
            "session_count": result.session_count,
            "total_minutes": total_mins,
            "avg_distance_km": round(avg_dist, 2) if avg_dist else 0,
            "max_speed_kmh": round(result.max_speed or 0, 2),
            "avg_heart_rate": round(result.avg_hr or 0, 0),
            "load_score": round(load_score, 1),
            "status": status_level,
            "recommendation": recommendation
        })
    
    # Sort by load score descending
    players_load.sort(key=lambda x: x['load_score'], reverse=True)
    
    return {
        "period_days": days,
        "total_players": len(players_load),
        "players": players_load
    }


@router.get("/injury-risk")
def get_injury_risk(
    team_id: int = Query(None),
    db: Session = Depends(get_db)
):
    """Get injury risk analysis for all players."""
    # Get recent data (last 14 days)
    cutoff_date = datetime.utcnow() - timedelta(days=14)
    
    query = db.query(
        Player.id,
        Player.name,
        Player.position,
        Player.age,
        Player.photo_url,
        func.count(TrainingSession.id).label('session_count'),
        func.sum(TrainingSession.duration_minutes).label('total_minutes'),
        func.avg(SessionStats.max_heart_rate).label('avg_max_hr'),
        func.sum(SessionStats.sprints_count).label('total_sprints')
    ).join(
        TrainingSession, Player.id == TrainingSession.player_id
    ).outerjoin(
        SessionStats, TrainingSession.id == SessionStats.session_id
    ).filter(
        TrainingSession.session_date >= cutoff_date
    )
    
    if team_id:
        query = query.filter(Player.team_id == team_id)
    
    results = query.group_by(Player.id).all()
    
    injury_risks = []
    for result in results:
        # Calculate injury risk score (0-100, higher is more risk)
        risk_factors = []
        risk_score = 0
        
        # Factor 1: High training load
        total_mins = result.total_minutes or 0
        if total_mins > 1400:  # > 100 mins/day avg
            risk_score += 30
            risk_factors.append("Excessive training volume")
        
        # Factor 2: Age
        age = result.age or 25
        if age > 30:
            risk_score += 15
            risk_factors.append("Age-related risk")
        
        # Factor 3: High intensity (heart rate)
        avg_max_hr = result.avg_max_hr or 0
        if avg_max_hr > 180:
            risk_score += 25
            risk_factors.append("High intensity sessions")
        
        # Factor 4: Sprint load
        total_sprints = result.total_sprints or 0
        if total_sprints > 200:
            risk_score += 20
            risk_factors.append("High sprint volume")
        
        # Determine risk level
        if risk_score >= 60:
            risk_level = "high"
            recommendation = "Immediate rest recommended - Monitor closely"
        elif risk_score >= 40:
            risk_level = "medium"
            recommendation = "Reduce training intensity - Active recovery"
        elif risk_score >= 20:
            risk_level = "low-medium"
            recommendation = "Monitor workload - Maintain current regime"
        else:
            risk_level = "low"
            recommendation = "Continue current training program"
        
        injury_risks.append({
            "player_id": result.id,
            "player_name": result.name,
            "position": result.position,
            "age": age,
            "photo_url": result.photo_url,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "risk_factors": risk_factors,
            "recommendation": recommendation,
            "metrics": {
                "total_minutes": total_mins,
                "session_count": result.session_count,
                "avg_max_hr": round(avg_max_hr, 0),
                "total_sprints": total_sprints
            }
        })
    
    # Sort by risk score descending (highest risk first)
    injury_risks.sort(key=lambda x: x['risk_score'], reverse=True)
    
    # Calculate summary stats
    high_risk_count = sum(1 for p in injury_risks if p['risk_level'] == 'high')
    medium_risk_count = sum(1 for p in injury_risks if p['risk_level'] == 'medium')
    
    return {
        "total_players": len(injury_risks),
        "high_risk_count": high_risk_count,
        "medium_risk_count": medium_risk_count,
        "overall_risk": "high" if high_risk_count > 0 else "medium" if medium_risk_count > 2 else "low",
        "players": injury_risks
    }


@router.get("/insights")
def get_insights(
    team_id: int = Query(None),
    days: int = Query(7, ge=1, le=365),
    db: Session = Depends(get_db)
):
    """Get comprehensive insights for recovery, injury prevention, and workload optimization."""
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    # Get all relevant data
    query = db.query(
        Player,
        func.count(TrainingSession.id).label('session_count'),
        func.sum(TrainingSession.duration_minutes).label('total_minutes'),
        func.avg(SessionStats.distance_km).label('avg_distance'),
        func.avg(SessionStats.avg_heart_rate).label('avg_hr'),
        func.max(SessionStats.max_heart_rate).label('max_hr')
    ).join(
        TrainingSession, Player.id == TrainingSession.player_id
    ).outerjoin(
        SessionStats, TrainingSession.id == SessionStats.session_id
    ).filter(
        TrainingSession.session_date >= cutoff_date
    )
    
    if team_id:
        query = query.filter(Player.team_id == team_id)
    
    results = query.group_by(Player.id).all()
    
    insights = {
        "recovery_recommendations": [],
        "injury_prevention": [],
        "workload_optimization": [],
        "summary": {}
    }
    
    total_players = len(results)
    needs_recovery = 0
    optimal_load = 0
    
    for result in results:
        player = result.Player
        total_mins = result.total_minutes or 0
        avg_hr = result.avg_hr or 0
        
        # Recovery recommendations
        if total_mins > 1200:  # High volume
            needs_recovery += 1
            insights["recovery_recommendations"].append({
                "player_name": player.name,
                "reason": "High training volume detected",
                "action": "Schedule 2 rest days this week",
                "priority": "high"
            })
        elif avg_hr > 165:
            insights["recovery_recommendations"].append({
                "player_name": player.name,
                "reason": "Elevated average heart rate",
                "action": "Focus on low-intensity recovery sessions",
                "priority": "medium"
            })
        else:
            optimal_load += 1
        
        # Injury prevention
        if player.age and player.age > 30 and total_mins > 1000:
            insights["injury_prevention"].append({
                "player_name": player.name,
                "risk_factor": "Age + High workload combination",
                "prevention": "Implement additional stretching and mobility work",
                "priority": "high"
            })
        
        # Workload optimization
        if total_mins < 400:  # Low volume
            insights["workload_optimization"].append({
                "player_name": player.name,
                "current_load": "Below optimal",
                "recommendation": "Gradually increase training volume by 10-15%",
                "target_minutes": 600
            })
    
    insights["summary"] = {
        "total_players_analyzed": total_players,
        "players_needing_recovery": needs_recovery,
        "players_optimal_load": optimal_load,
        "recovery_percentage": round((needs_recovery / total_players * 100) if total_players > 0 else 0, 1),
        "period_days": days
    }
    
    return insights
