"""
Dashboard Router
================
Main dashboard endpoints including lifecycle overview
Shows upstream, in-process, downstream, and waste phases

Author: SHUB-0510
Date: 2024-11-24
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

from app.database import get_db
from app.models import User
from app.routers.auth import get_current_user
from app.services.lifecycle_aggregator import LifecycleAggregator

router = APIRouter(
    prefix="/api/v1/dashboard",
    tags=["dashboard"]
)


# ============================================================================
# RESPONSE MODELS
# ============================================================================

class LifecycleOverviewResponse(BaseModel):
    """Response model for lifecycle overview"""
    company_id: int
    date_range: Dict[str, Optional[str]]
    total_emissions_kg: float
    total_emissions_tonnes: float
    phases: Dict[str, Any]
    summary: Dict[str, float]

    class Config:
        from_attributes = True


class PhaseDetailResponse(BaseModel):
    """Response model for phase details"""
    phase: str
    activities: list
    total_count: int

    class Config:
        from_attributes = True


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("/lifecycle-overview", response_model=LifecycleOverviewResponse)
async def get_lifecycle_overview(
        start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
        end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """
    Get complete lifecycle overview showing:
    - UPSTREAM emissions (Scope 3 upstream)
    - IN_PROCESS emissions (Scope 1 & 2)
    - DOWNSTREAM emissions (Scope 3 downstream)
    - WASTE emissions and weight

    Query Parameters:
    - start_date: Filter activities from this date (optional)
    - end_date: Filter activities until this date (optional)

    Returns:
    - Complete breakdown by lifecycle phase
    - Total emissions and activity counts
    - Percentage distribution
    """

    # Get user's company_id
    company_id = current_user.company_id

    if not company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with a company"
        )

    # Parse dates if provided
    start_dt = None
    end_dt = None

    try:
        if start_date:
            start_dt = datetime.strptime(start_date, "%Y-%m-%d")
        if end_date:
            end_dt = datetime.strptime(end_date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use YYYY-MM-DD"
        )

    # Get lifecycle data
    aggregator = LifecycleAggregator(db)

    try:
        overview_data = aggregator.get_lifecycle_overview(
            company_id=company_id,
            start_date=start_dt,
            end_date=end_dt
        )

        return overview_data

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch lifecycle overview: {str(e)}"
        )


@router.get("/lifecycle/{phase}", response_model=PhaseDetailResponse)
async def get_phase_details(
        phase: str,
        start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
        end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
        limit: int = Query(100, ge=1, le=500, description="Maximum number of activities to return"),
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """
    Get detailed activities for a specific lifecycle phase

    Path Parameters:
    - phase: One of UPSTREAM, IN_PROCESS, DOWNSTREAM, WASTE

    Query Parameters:
    - start_date: Filter from this date (optional)
    - end_date: Filter until this date (optional)
    - limit: Maximum activities to return (default 100, max 500)

    Returns:
    - List of activities in the specified phase
    - Total count
    """

    # Validate phase
    valid_phases = ["UPSTREAM", "IN_PROCESS", "DOWNSTREAM", "WASTE"]
    phase_upper = phase.upper()

    if phase_upper not in valid_phases:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid phase. Must be one of: {', '.join(valid_phases)}"
        )

    # Get user's company_id
    company_id = current_user.company_id

    if not company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with a company"
        )

    # Parse dates if provided
    start_dt = None
    end_dt = None

    try:
        if start_date:
            start_dt = datetime.strptime(start_date, "%Y-%m-%d")
        if end_date:
            end_dt = datetime.strptime(end_date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use YYYY-MM-DD"
        )

    # Get phase details
    aggregator = LifecycleAggregator(db)

    try:
        activities = aggregator.get_phase_details(
            company_id=company_id,
            phase=phase_upper,
            start_date=start_dt,
            end_date=end_dt,
            limit=limit
        )

        return {
            "phase": phase_upper,
            "activities": activities,
            "total_count": len(activities)
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch phase details: {str(e)}"
        )


@router.get("/summary")
async def get_dashboard_summary(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """
    Get overall dashboard summary

    Returns:
    - Quick stats for the main dashboard
    - Total emissions by scope
    - Activity counts
    - Recent activities
    """

    company_id = current_user.company_id

    if not company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with a company"
        )

    aggregator = LifecycleAggregator(db)

    try:
        # Get lifecycle overview (no date filter for overall summary)
        lifecycle_data = aggregator.get_lifecycle_overview(company_id=company_id)

        # Format summary data
        summary = {
            "total_emissions_tonnes": lifecycle_data["total_emissions_tonnes"],
            "total_emissions_kg": lifecycle_data["total_emissions_kg"],
            "total_activities": sum(
                phase["activity_count"]
                for phase in lifecycle_data["phases"].values()
            ),
            "lifecycle_distribution": lifecycle_data["summary"],
            "phases": {
                phase_name: {
                    "emissions_tonnes": phase["total_emissions_tonnes"],
                    "activity_count": phase["activity_count"],
                    "percentage": lifecycle_data["summary"].get(
                        f"{phase_name.lower()}_percentage", 0
                    )
                }
                for phase_name, phase in lifecycle_data["phases"].items()
            }
        }

        return summary

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch dashboard summary: {str(e)}"
        )