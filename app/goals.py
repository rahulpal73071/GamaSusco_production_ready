# app/routers/goals.py
"""
Goal Tracking API (SECURED)
============================
Set and track emission reduction goals
WITH authentication and company data isolation
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timezone

from app.database import get_db
from app.models import Company, User
from app.services.goal_tracker import (
    calculate_baseline,
    calculate_current_progress,
    project_future_emissions,
    generate_goal_roadmap
)
from app.routers.auth import get_current_user

router = APIRouter(
    prefix="/api/companies/{company_id}/goals",
    tags=["Goal Tracking"]
)


# ============================================================================
# SECURITY HELPER
# ============================================================================

def verify_company_access(company_id: int, current_user: User, db: Session):
    """Verify user has access to company"""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )

    if current_user.company_id != company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    return company


# ============================================================================
# REQUEST MODELS
# ============================================================================

# ============================================================================
# REQUEST MODELS
# ============================================================================

class GoalCreateRequest(BaseModel):
    """Request to create emission reduction goal"""
    goal_name: str = Field(..., description="Goal name (e.g., 'Net Zero by 2050')")
    baseline_year: int = Field(..., description="Baseline year for comparison")
    target_year: int = Field(..., description="Target year to achieve goal")
    target_reduction_percentage: float = Field(..., gt=0, le=100, description="Target reduction %")
    scope_target: Optional[str] = Field("All", description="'Scope 1', 'Scope 2', 'Scope 3', or 'All'")  # ← FIXED
    description: Optional[str] = Field(None, description="Goal description")

    model_config = {
        "json_schema_extra": {
            "example": {
                "goal_name": "Carbon Neutral by 2030",
                "baseline_year": 2023,
                "target_year": 2030,
                "target_reduction_percentage": 50,
                "scope_target": "All",
                "description": "Reduce total emissions by 50% compared to 2023 baseline"
            }
        }
    }
# ============================================================================
# CREATE GOAL (SECURED)
# ============================================================================

@router.post("")
async def create_goal(
        company_id: int,
        request: GoalCreateRequest,
        current_user: User = Depends(get_current_user),  # ← AUTHENTICATION REQUIRED
        db: Session = Depends(get_db)
):
    """
    🎯 **Create emission reduction goal (SECURED)**

    **Authentication Required:** JWT token
    **Authorization:** User must belong to the company

    **Examples:**
    - "Reduce emissions by 30% by 2030"
    - "Net Zero by 2050"
    - "Carbon Neutral by 2040"

    **Process:**
    1. Verify user access to company
    2. Calculate baseline emissions
    3. Set target emissions
    4. Generate year-by-year roadmap
    5. Track progress automatically
    """

    print(f"\n{'=' * 70}")
    print(f"🎯 CREATE GOAL - Company {company_id}")
    print(f"👤 User: {current_user.username}")
    print(f"{'=' * 70}")

    # SECURITY CHECK
    company = verify_company_access(company_id, current_user, db)
    print(f"✅ Access granted to: {company.name}")

    # Validate years
    current_year = datetime.now().year
    if request.baseline_year >= current_year:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Baseline year must be in the past"
        )

    if request.target_year <= current_year:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Target year must be in the future"
        )

    # Calculate baseline
    print(f"\n1️⃣ Calculating baseline ({request.baseline_year})...")
    baseline = calculate_baseline(db, company_id, request.baseline_year)

    if not baseline['success']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=baseline.get('error', 'Failed to calculate baseline')
        )

    print(f"   ✅ Baseline: {baseline['total_emissions_tonnes']} tonnes CO2e")

    # Calculate target
    target_kg = baseline['total_emissions_kg'] * (1 - request.target_reduction_percentage / 100)

    print(f"\n2️⃣ Setting target...")
    print(f"   Target: {target_kg / 1000:.2f} tonnes CO2e by {request.target_year}")
    print(f"   Reduction: {request.target_reduction_percentage}%")

    # Generate roadmap
    print(f"\n3️⃣ Generating roadmap...")
    roadmap = generate_goal_roadmap(
        baseline_kg=baseline['total_emissions_kg'],
        target_kg=target_kg,
        target_year=request.target_year,
        current_year=current_year
    )

    print(f"   ✅ Created {len(roadmap['milestones'])} year milestones")

    # Calculate current progress
    print(f"\n4️⃣ Calculating current progress...")
    progress = calculate_current_progress(
        db=db,
        company_id=company_id,
        baseline_kg=baseline['total_emissions_kg'],
        target_year=request.target_year,
        target_reduction_percentage=request.target_reduction_percentage
    )

    if progress['success']:
        print(f"   ✅ Current progress: {progress['reduction_achieved_percentage']:.1f}%")
        print(f"   Status: {progress['status']}")

    print(f"\n{'=' * 70}")
    print(f"✅ GOAL CREATED BY {current_user.username}")
    print(f"{'=' * 70}\n")

    return {
        "success": True,
        "message": f"Goal '{request.goal_name}' created successfully",
        "goal": {
            "id": company_id,  # In a real app, you'd create a Goal model and return goal.id
            "goal_name": request.goal_name,
            "description": request.description,
            "baseline_year": request.baseline_year,
            "target_year": request.target_year,
            "target_reduction_percentage": request.target_reduction_percentage,
            "scope_target": request.scope_target,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "created_by": current_user.username
        },
        "baseline": baseline,
        "target": {
            "target_emissions_kg": round(target_kg, 2),
            "target_emissions_tonnes": round(target_kg / 1000, 2),
            "reduction_needed_kg": round(baseline['total_emissions_kg'] - target_kg, 2)
        },
        "current_progress": progress if progress['success'] else None,
        "roadmap": roadmap
    }


# ============================================================================
# GET GOAL PROGRESS (SECURED)
# ============================================================================

@router.get("/progress")
async def get_goal_progress(
        company_id: int,
        baseline_year: int = Query(..., description="Baseline year"),
        target_year: int = Query(..., description="Target year"),
        target_reduction_percentage: float = Query(..., description="Target reduction %"),
        current_user: User = Depends(get_current_user),  # ← AUTHENTICATION REQUIRED
        db: Session = Depends(get_db)
):
    """
    📊 **Get current progress toward goal (SECURED)**

    **Authentication Required:** JWT token
    **Authorization:** User must belong to the company

    **Returns:**
    - Current emissions vs baseline
    - Reduction achieved (%)
    - Progress toward goal (%)
    - On track status
    - Remaining reduction needed
    """

    # SECURITY CHECK
    company = verify_company_access(company_id, current_user, db)

    # Calculate baseline
    baseline = calculate_baseline(db, company_id, baseline_year)
    if not baseline['success']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=baseline['error']
        )

    # Calculate progress
    progress = calculate_current_progress(
        db=db,
        company_id=company_id,
        baseline_kg=baseline['total_emissions_kg'],
        target_year=target_year,
        target_reduction_percentage=target_reduction_percentage
    )

    if not progress['success']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=progress['error']
        )

    return {
        "success": True,
        "company": {
            "id": company.id,
            "name": company.name
        },
        "baseline": baseline,
        "progress": progress
    }


# ============================================================================
# GET EMISSIONS PROJECTION (SECURED)
# ============================================================================

@router.get("/projection")
async def get_emissions_projection(
        company_id: int,
        target_year: int = Query(..., description="Year to project to"),
        current_user: User = Depends(get_current_user),  # ← AUTHENTICATION REQUIRED
        db: Session = Depends(get_db)
):
    """
    🔮 **Project future emissions (SECURED)**

    **Authentication Required:** JWT token
    **Authorization:** User must belong to the company

    Uses historical trends to predict future emissions

    **Returns:**
    - Current trend (increasing/decreasing)
    - Projected emissions for target year
    - Confidence level
    """

    # SECURITY CHECK
    company = verify_company_access(company_id, current_user, db)

    # Project emissions
    projection = project_future_emissions(db, company_id, target_year)

    if not projection['success']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=projection['error']
        )

    return {
        "success": True,
        "company": {
            "id": company.id,
            "name": company.name
        },
        "projection": projection
    }


# ============================================================================
# GET GOAL ROADMAP (SECURED)
# ============================================================================

@router.get("/roadmap")
async def get_goal_roadmap(
        company_id: int,
        baseline_year: int = Query(..., description="Baseline year"),
        target_year: int = Query(..., description="Target year"),
        target_reduction_percentage: float = Query(..., description="Target reduction %"),
        current_user: User = Depends(get_current_user),  # ← AUTHENTICATION REQUIRED
        db: Session = Depends(get_db)
):
    """
    🗺️ **Get year-by-year roadmap to achieve goal (SECURED)**

    **Authentication Required:** JWT token
    **Authorization:** User must belong to the company

    **Returns:**
    - Annual milestones
    - Required reductions each year
    - Cumulative progress targets
    """

    # SECURITY CHECK
    company = verify_company_access(company_id, current_user, db)

    # Calculate baseline
    baseline = calculate_baseline(db, company_id, baseline_year)
    if not baseline['success']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=baseline['error']
        )

    # Calculate target
    target_kg = baseline['total_emissions_kg'] * (1 - target_reduction_percentage / 100)

    # Generate roadmap
    roadmap = generate_goal_roadmap(
        baseline_kg=baseline['total_emissions_kg'],
        target_kg=target_kg,
        target_year=target_year
    )

    if not roadmap['success']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=roadmap['error']
        )

    return {
        "success": True,
        "company": {
            "id": company.id,
            "name": company.name
        },
        "baseline": baseline,
        "roadmap": roadmap
    }


# ============================================================================
# GET COMPLETE GOAL STATUS (SECURED)
# ============================================================================

@router.get("/status")
async def get_goal_status(
        company_id: int,
        baseline_year: int = Query(..., description="Baseline year"),
        target_year: int = Query(..., description="Target year"),
        target_reduction_percentage: float = Query(..., description="Target reduction %"),
        current_user: User = Depends(get_current_user),  # ← AUTHENTICATION REQUIRED
        db: Session = Depends(get_db)
):
    """
    📈 **Get complete goal status (SECURED)**

    **Authentication Required:** JWT token
    **Authorization:** User must belong to the company

    Combines:
    - Baseline
    - Current progress
    - Projection
    - Roadmap

    **Perfect for dashboard display!**
    """

    # SECURITY CHECK
    company = verify_company_access(company_id, current_user, db)

    # Calculate baseline
    baseline = calculate_baseline(db, company_id, baseline_year)
    if not baseline['success']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=baseline['error']
        )

    # Calculate target
    target_kg = baseline['total_emissions_kg'] * (1 - target_reduction_percentage / 100)

    # Get progress
    progress = calculate_current_progress(
        db=db,
        company_id=company_id,
        baseline_kg=baseline['total_emissions_kg'],
        target_year=target_year,
        target_reduction_percentage=target_reduction_percentage
    )

    # Get projection
    projection = project_future_emissions(db, company_id, target_year)

    # Get roadmap
    roadmap = generate_goal_roadmap(
        baseline_kg=baseline['total_emissions_kg'],
        target_kg=target_kg,
        target_year=target_year
    )

    # Will we achieve the goal?
    will_achieve = False
    if projection['success']:
        will_achieve = projection['projected_emissions_kg'] <= target_kg

    return {
        "success": True,
        "company": {
            "id": company.id,
            "name": company.name,
            "industry": company.industry
        },
        "goal": {
            "baseline_year": baseline_year,
            "target_year": target_year,
            "target_reduction_percentage": target_reduction_percentage,
            "years_remaining": target_year - datetime.now().year
        },
        "baseline": baseline,
        "current_progress": progress,
        "projection": projection if projection['success'] else None,
        "roadmap": roadmap,
        "assessment": {
            "on_track": progress.get('on_track', False) if progress['success'] else False,
            "will_likely_achieve": will_achieve,
            "status": progress.get('status', 'Unknown') if progress['success'] else 'Unknown',
            "risk_level": "Low" if will_achieve else "High"
        }
    }



