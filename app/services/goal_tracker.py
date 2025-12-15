# app/services/goal_tracker.py
"""
Goal Tracking Service
=====================
Track emission reduction goals and progress
"""

from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from app.models import EmissionActivity, Company


def calculate_baseline(
        db: Session,
        company_id: int,
        baseline_year: int
) -> Dict:
    """
    Calculate baseline emissions for a specific year

    Args:
        db: Database session
        company_id: Company ID
        baseline_year: Year for baseline (e.g., 2023)

    Returns:
        Baseline emissions breakdown
    """

    # Get activities from baseline year
    activities = db.query(EmissionActivity).filter(
        EmissionActivity.company_id == company_id,
        extract('year', EmissionActivity.activity_date) == baseline_year
    ).all()

    if not activities:
        return {
            "success": False,
            "error": f"No data found for baseline year {baseline_year}"
        }

    # Calculate totals
    total = sum(a.emissions_kgco2e for a in activities)
    scope_1 = sum(a.emissions_kgco2e for a in activities if a.scope_number == 1)
    scope_2 = sum(a.emissions_kgco2e for a in activities if a.scope_number == 2)
    scope_3 = sum(a.emissions_kgco2e for a in activities if a.scope_number == 3)

    return {
        "success": True,
        "baseline_year": baseline_year,
        "total_emissions_kg": round(total, 2),
        "total_emissions_tonnes": round(total / 1000, 2),
        "scope_breakdown": {
            "scope_1_kg": round(scope_1, 2),
            "scope_2_kg": round(scope_2, 2),
            "scope_3_kg": round(scope_3, 2)
        },
        "activity_count": len(activities),
        "calculated_at": datetime.now().isoformat()
    }


def calculate_current_progress(
        db: Session,
        company_id: int,
        baseline_kg: float,
        target_year: int,
        target_reduction_percentage: float
) -> Dict:
    """
    Calculate current progress toward goal

    Args:
        db: Database session
        company_id: Company ID
        baseline_kg: Baseline emissions in kg
        target_year: Target year
        target_reduction_percentage: Target reduction %

    Returns:
        Progress metrics
    """

    current_year = datetime.now().year

    # Get YTD emissions
    ytd_start = datetime(current_year, 1, 1)
    ytd_activities = db.query(EmissionActivity).filter(
        EmissionActivity.company_id == company_id,
        EmissionActivity.activity_date >= ytd_start
    ).all()

    if not ytd_activities:
        return {
            "success": False,
            "error": "No current year data available"
        }

    # Calculate current emissions
    current_total = sum(a.emissions_kgco2e for a in ytd_activities)

    # Calculate target
    target_kg = baseline_kg * (1 - target_reduction_percentage / 100)

    # Calculate reduction achieved
    reduction_kg = baseline_kg - current_total
    reduction_percentage = (reduction_kg / baseline_kg * 100) if baseline_kg > 0 else 0

    # Calculate progress toward goal
    progress_percentage = (
                reduction_percentage / target_reduction_percentage * 100) if target_reduction_percentage > 0 else 0

    # On track?
    years_elapsed = current_year - (target_year - 10)  # Assuming 10-year goal from baseline
    expected_progress = (years_elapsed / 10) * target_reduction_percentage if years_elapsed > 0 else 0
    on_track = reduction_percentage >= expected_progress

    return {
        "success": True,
        "current_year": current_year,
        "current_emissions_kg": round(current_total, 2),
        "current_emissions_tonnes": round(current_total / 1000, 2),
        "baseline_emissions_kg": baseline_kg,
        "target_emissions_kg": round(target_kg, 2),
        "reduction_achieved_kg": round(reduction_kg, 2),
        "reduction_achieved_percentage": round(reduction_percentage, 2),
        "target_reduction_percentage": target_reduction_percentage,
        "progress_toward_goal_percentage": round(progress_percentage, 2),
        "on_track": on_track,
        "status": "On Track" if on_track else "Behind Target",
        "remaining_reduction_needed_kg": round(max(0, current_total - target_kg), 2),
        "ytd_activity_count": len(ytd_activities)
    }


def project_future_emissions(
        db: Session,
        company_id: int,
        target_year: int
) -> Dict:
    """
    Project future emissions based on historical trends

    Uses linear regression on past 12 months
    """

    # Get last 12 months of data
    twelve_months_ago = datetime.now() - timedelta(days=365)
    activities = db.query(EmissionActivity).filter(
        EmissionActivity.company_id == company_id,
        EmissionActivity.activity_date >= twelve_months_ago
    ).all()

    if len(activities) < 10:
        return {
            "success": False,
            "error": "Insufficient historical data for projection"
        }

    # Group by month
    monthly_totals = {}
    for a in activities:
        if a.activity_date:
            month_key = a.activity_date.strftime("%Y-%m")
            if month_key not in monthly_totals:
                monthly_totals[month_key] = 0
            monthly_totals[month_key] += a.emissions_kgco2e

    # Simple trend analysis
    months = sorted(monthly_totals.keys())
    if len(months) < 3:
        return {
            "success": False,
            "error": "Insufficient months for projection"
        }

    # Calculate trend
    recent_avg = sum(monthly_totals[m] for m in months[-3:]) / 3
    older_avg = sum(monthly_totals[m] for m in months[:3]) / 3

    trend_percentage = ((recent_avg - older_avg) / older_avg * 100) if older_avg > 0 else 0

    # Project to target year
    current_year = datetime.now().year
    years_to_target = target_year - current_year

    current_annual = sum(monthly_totals.values())
    projected_annual = current_annual * ((1 + trend_percentage / 100) ** years_to_target)

    return {
        "success": True,
        "projection_method": "trend_analysis",
        "historical_trend_percentage": round(trend_percentage, 2),
        "current_annual_emissions_kg": round(current_annual, 2),
        "projected_emissions_kg": round(projected_annual, 2),
        "projected_emissions_tonnes": round(projected_annual / 1000, 2),
        "target_year": target_year,
        "confidence": "Medium",
        "note": "Projection assumes current trend continues"
    }


def generate_goal_roadmap(
        baseline_kg: float,
        target_kg: float,
        target_year: int,
        current_year: int = None
) -> Dict:
    """
    Generate year-by-year roadmap to achieve goal
    """

    if current_year is None:
        current_year = datetime.now().year

    years_remaining = target_year - current_year
    if years_remaining <= 0:
        return {
            "success": False,
            "error": "Target year must be in the future"
        }

    total_reduction_needed = baseline_kg - target_kg
    annual_reduction_needed = total_reduction_needed / years_remaining

    # Generate milestones
    milestones = []
    cumulative_reduction = 0

    for year in range(current_year, target_year + 1):
        years_from_now = year - current_year
        cumulative_reduction = annual_reduction_needed * years_from_now
        target_for_year = baseline_kg - cumulative_reduction

        milestones.append({
            "year": year,
            "target_emissions_kg": round(target_for_year, 2),
            "target_emissions_tonnes": round(target_for_year / 1000, 2),
            "cumulative_reduction_kg": round(cumulative_reduction, 2),
            "cumulative_reduction_percentage": round((cumulative_reduction / baseline_kg * 100), 2),
            "annual_reduction_needed_kg": round(annual_reduction_needed, 2)
        })

    return {
        "success": True,
        "baseline_year": current_year - 1,  # Assuming previous year as baseline
        "baseline_emissions_kg": baseline_kg,
        "target_year": target_year,
        "target_emissions_kg": target_kg,
        "total_reduction_needed_kg": round(total_reduction_needed, 2),
        "annual_reduction_needed_kg": round(annual_reduction_needed, 2),
        "years_remaining": years_remaining,
        "milestones": milestones
    }