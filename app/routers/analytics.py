"""
Analytics Router
================
Comprehensive analytics endpoints with month-wise emission segregation
Ensures data consistency with dashboard

Author: SHUB-0510
Date: 2025-12-08
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, and_
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from collections import defaultdict

from app.database import get_db
from app.models import EmissionActivity, Company, User, EmissionSummary
from app.routers.auth import get_current_user

router = APIRouter(
    prefix="/api/v1/analytics",
    tags=["Analytics"]
)


# ============================================================================
# RESPONSE MODELS
# ============================================================================

class AnalyticsSummaryResponse(BaseModel):
    """Analytics summary matching dashboard format"""
    total_emissions_kg: float
    total_emissions_tonnes: float
    scope_1_total: float
    scope_2_total: float
    scope_3_total: float
    scope_1_percentage: float
    scope_2_percentage: float
    scope_3_percentage: float
    total_activities: int
    date_range: Dict[str, Optional[str]]


class MonthlyEmissionResponse(BaseModel):
    """Month-wise emission breakdown"""
    month: str  # Format: "2024-10"
    month_name: str  # Format: "October 2024"
    scope_1: float
    scope_2: float
    scope_3: float
    total: float
    activity_count: int


class CategoryBreakdownResponse(BaseModel):
    """Category-wise breakdown"""
    category: str
    scope: str
    emissions_kg: float
    emissions_tonnes: float
    percentage: float
    activity_count: int


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def verify_company_access(company_id: int, current_user: User, db: Session):
    """Verify user has access to company data"""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )

    if current_user.company_id != company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You don't have permission to access this company's data"
        )

    return company


def get_month_name(year: int, month: int) -> str:
    """Convert year-month to readable format"""
    month_names = {
        1: "January", 2: "February", 3: "March", 4: "April",
        5: "May", 6: "June", 7: "July", 8: "August",
        9: "September", 10: "October", 11: "November", 12: "December"
    }
    return f"{month_names[month]} {year}"


# ============================================================================
# ANALYTICS ENDPOINTS
# ============================================================================

@router.get("/summary")
async def get_analytics_summary(
        company_id: int = Query(..., description="Company ID"),
        start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
        end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """
    📊 Get analytics summary matching dashboard data

    **Returns:**
    - Total emissions by scope (matches dashboard exactly)
    - Scope percentages
    - Total activities
    - Date range applied

    **Note:** This endpoint returns the SAME data as the dashboard
    to ensure consistency between views.
    """

    # Verify access
    company = verify_company_access(company_id, current_user, db)

    # Build query
    query = db.query(EmissionActivity).filter(
        EmissionActivity.company_id == company_id
    )

    # Apply date filters
    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date)
            query = query.filter(EmissionActivity.activity_date >= start_dt)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid start_date format. Use YYYY-MM-DD"
            )

    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date)
            query = query.filter(EmissionActivity.activity_date <= end_dt)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid end_date format. Use YYYY-MM-DD"
            )

    # Get all activities
    activities = query.all()

    if not activities:
        return {
            "total_emissions_kg": 0,
            "total_emissions_tonnes": 0,
            "scope_1_total": 0,
            "scope_2_total": 0,
            "scope_3_total": 0,
            "scope_1_percentage": 0,
            "scope_2_percentage": 0,
            "scope_3_percentage": 0,
            "total_activities": 0,
            "date_range": {
                "start": start_date,
                "end": end_date
            }
        }

    # Calculate totals
    scope_1_total = sum(a.emissions_kgco2e for a in activities if a.scope_number == 1)
    scope_2_total = sum(a.emissions_kgco2e for a in activities if a.scope_number == 2)
    scope_3_total = sum(a.emissions_kgco2e for a in activities if a.scope_number == 3)
    total_emissions = scope_1_total + scope_2_total + scope_3_total

    # Calculate percentages
    scope_1_pct = (scope_1_total / total_emissions * 100) if total_emissions > 0 else 0
    scope_2_pct = (scope_2_total / total_emissions * 100) if total_emissions > 0 else 0
    scope_3_pct = (scope_3_total / total_emissions * 100) if total_emissions > 0 else 0

    return {
        "total_emissions_kg": round(total_emissions, 2),
        "total_emissions_tonnes": round(total_emissions / 1000, 3),
        "scope_1_total": round(scope_1_total, 2),
        "scope_2_total": round(scope_2_total, 2),
        "scope_3_total": round(scope_3_total, 2),
        "scope_1_percentage": round(scope_1_pct, 2),
        "scope_2_percentage": round(scope_2_pct, 2),
        "scope_3_percentage": round(scope_3_pct, 2),
        "total_activities": len(activities),
        "date_range": {
            "start": start_date,
            "end": end_date
        }
    }


@router.get("/monthly-emissions")
async def get_monthly_emissions(
        company_id: int = Query(..., description="Company ID"),
        start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
        end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """
    📅 Get month-wise emission breakdown

    **Perfect for:**
    - Line charts showing emission trends
    - Monthly comparison charts
    - Time-series analysis

    **Returns:**
    - Array of monthly data with scope breakdown
    - Each month includes: scope_1, scope_2, scope_3, total
    - Activity count per month
    - Month in readable format (e.g., "October 2024")
    """

    # Verify access
    company = verify_company_access(company_id, current_user, db)

    # Build query
    query = db.query(
        extract('year', EmissionActivity.activity_date).label('year'),
        extract('month', EmissionActivity.activity_date).label('month'),
        EmissionActivity.scope_number,
        func.sum(EmissionActivity.emissions_kgco2e).label('total'),
        func.count(EmissionActivity.id).label('count')
    ).filter(
        EmissionActivity.company_id == company_id,
        EmissionActivity.activity_date.isnot(None)
    )

    # Apply date filters
    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date)
            query = query.filter(EmissionActivity.activity_date >= start_dt)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid start_date format. Use YYYY-MM-DD"
            )

    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date)
            query = query.filter(EmissionActivity.activity_date <= end_dt)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid end_date format. Use YYYY-MM-DD"
            )

    # Group by year, month, and scope
    results = query.group_by('year', 'month', EmissionActivity.scope_number).all()

    # Organize data by month
    monthly_data = defaultdict(lambda: {
        'scope_1': 0,
        'scope_2': 0,
        'scope_3': 0,
        'total': 0,
        'activity_count': 0,
        'year': 0,
        'month': 0
    })

    for year, month, scope, total, count in results:
        year = int(year)
        month = int(month)
        month_key = f"{year:04d}-{month:02d}"

        monthly_data[month_key]['year'] = year
        monthly_data[month_key]['month'] = month
        monthly_data[month_key][f'scope_{scope}'] = round(total, 2)
        monthly_data[month_key]['total'] += round(total, 2)
        monthly_data[month_key]['activity_count'] += count

    # Convert to sorted list
    monthly_list = []
    for month_key in sorted(monthly_data.keys()):
        data = monthly_data[month_key]
        monthly_list.append({
            "month": month_key,
            "month_name": get_month_name(data['year'], data['month']),
            "scope_1": data['scope_1'],
            "scope_2": data['scope_2'],
            "scope_3": data['scope_3'],
            "total": round(data['total'], 2),
            "activity_count": data['activity_count']
        })

    return {
        "success": True,
        "company_id": company_id,
        "company_name": company.name,
        "data": monthly_list,
        "total_months": len(monthly_list)
    }


@router.get("/scope-breakdown")
async def get_scope_breakdown(
        company_id: int = Query(..., description="Company ID"),
        start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
        end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """
    🎯 Get detailed scope breakdown with categories

    **Returns:**
    - Scope 1 breakdown (by categories 1.1, 1.2, 1.3, 1.4)
    - Scope 2 breakdown (by categories 2.1, 2.2)
    - Scope 3 breakdown (by categories 3.1-3.15)
    - Percentages and activity counts

    **Note:** Matches dashboard scope-breakdown endpoint exactly
    """

    # Verify access
    company = verify_company_access(company_id, current_user, db)

    # Build query
    query = db.query(EmissionActivity).filter(
        EmissionActivity.company_id == company_id
    )

    # Apply date filters
    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date)
            query = query.filter(EmissionActivity.activity_date >= start_dt)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid start_date format. Use YYYY-MM-DD"
            )

    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date)
            query = query.filter(EmissionActivity.activity_date <= end_dt)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid end_date format. Use YYYY-MM-DD"
            )

    # Get all activities
    activities = query.all()

    if not activities:
        return {
            "scope_1": {"total": 0, "percentage": 0, "categories": []},
            "scope_2": {"total": 0, "percentage": 0, "categories": []},
            "scope_3": {"total": 0, "percentage": 0, "categories": []},
            "total_emissions": 0,
            "total_emissions_tonnes": 0
        }

    # Calculate totals
    scope_1_total = sum(a.emissions_kgco2e for a in activities if a.scope_number == 1)
    scope_2_total = sum(a.emissions_kgco2e for a in activities if a.scope_number == 2)
    scope_3_total = sum(a.emissions_kgco2e for a in activities if a.scope_number == 3)
    total_emissions = scope_1_total + scope_2_total + scope_3_total

    # Group by category
    category_totals = defaultdict(float)
    category_counts = defaultdict(int)

    for activity in activities:
        if activity.category:
            category_totals[activity.category] += activity.emissions_kgco2e
            category_counts[activity.category] += 1

    # Build category lists
    scope_1_categories = []
    scope_2_categories = []
    scope_3_categories = []

    for category, total in category_totals.items():
        category_data = {
            "name": category,
            "value": round(total, 2),
            "percentage": round((total / total_emissions * 100) if total_emissions > 0 else 0, 2),
            "activity_count": category_counts[category]
        }

        if category.startswith('1.'):
            scope_1_categories.append(category_data)
        elif category.startswith('2.'):
            scope_2_categories.append(category_data)
        elif category.startswith('3.'):
            scope_3_categories.append(category_data)

    # Sort by value (descending)
    scope_1_categories.sort(key=lambda x: x['value'], reverse=True)
    scope_2_categories.sort(key=lambda x: x['value'], reverse=True)
    scope_3_categories.sort(key=lambda x: x['value'], reverse=True)

    return {
        "scope_1": {
            "total": round(scope_1_total, 2),
            "percentage": round((scope_1_total / total_emissions * 100) if total_emissions > 0 else 0, 2),
            "categories": scope_1_categories
        },
        "scope_2": {
            "total": round(scope_2_total, 2),
            "percentage": round((scope_2_total / total_emissions * 100) if total_emissions > 0 else 0, 2),
            "categories": scope_2_categories
        },
        "scope_3": {
            "total": round(scope_3_total, 2),
            "percentage": round((scope_3_total / total_emissions * 100) if total_emissions > 0 else 0, 2),
            "categories": scope_3_categories
        },
        "total_emissions": round(total_emissions, 2),
        "total_emissions_tonnes": round(total_emissions / 1000, 3)
    }


@router.get("/category-breakdown")
async def get_category_breakdown(
        company_id: int = Query(..., description="Company ID"),
        scope: Optional[int] = Query(None, ge=1, le=3, description="Filter by scope (1, 2, or 3)"),
        start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
        end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
        limit: int = Query(10, ge=1, le=50, description="Number of top categories to return"),
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """
    📊 Get top emission categories

    **Perfect for:**
    - Pie charts showing category distribution
    - Bar charts of top emitters
    - Category comparison analysis
    """

    # Verify access
    company = verify_company_access(company_id, current_user, db)

    # Build query
    query = db.query(
        EmissionActivity.category,
        EmissionActivity.scope,
        func.sum(EmissionActivity.emissions_kgco2e).label('total'),
        func.count(EmissionActivity.id).label('count')
    ).filter(
        EmissionActivity.company_id == company_id
    )

    # Apply scope filter
    if scope:
        query = query.filter(EmissionActivity.scope_number == scope)

    # Apply date filters
    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date)
            query = query.filter(EmissionActivity.activity_date >= start_dt)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid start_date format. Use YYYY-MM-DD"
            )

    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date)
            query = query.filter(EmissionActivity.activity_date <= end_dt)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid end_date format. Use YYYY-MM-DD"
            )

    # Group and order
    results = query.group_by(
        EmissionActivity.category,
        EmissionActivity.scope
    ).order_by(func.sum(EmissionActivity.emissions_kgco2e).desc()).limit(limit).all()

    # Calculate total for percentages
    total_emissions = sum(r.total for r in results)

    # Format results
    categories = []
    for category, scope, total, count in results:
        categories.append({
            "category": category or "Uncategorized",
            "scope": scope or "N/A",
            "emissions_kg": round(total, 2),
            "emissions_tonnes": round(total / 1000, 3),
            "percentage": round((total / total_emissions * 100) if total_emissions > 0 else 0, 2),
            "activity_count": count
        })

    return {
        "success": True,
        "company_id": company_id,
        "company_name": company.name,
        "categories": categories,
        "total_categories": len(categories)
    }


@router.get("/trends")
async def get_emission_trends(
        company_id: int = Query(..., description="Company ID"),
        months: int = Query(12, ge=1, le=36, description="Number of months to analyze"),
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """
    📈 Get emission trends analysis

    **Returns:**
    - Month-over-month change
    - Trend direction (increasing/decreasing/stable)
    - Average monthly emissions
    - Peak and lowest months
    """

    # Verify access
    company = verify_company_access(company_id, current_user, db)

    # Calculate date range
    end_date = datetime.now()
    start_date = end_date - timedelta(days=months * 30)

    # Get monthly data
    results = db.query(
        extract('year', EmissionActivity.activity_date).label('year'),
        extract('month', EmissionActivity.activity_date).label('month'),
        func.sum(EmissionActivity.emissions_kgco2e).label('total')
    ).filter(
        EmissionActivity.company_id == company_id,
        EmissionActivity.activity_date >= start_date,
        EmissionActivity.activity_date.isnot(None)
    ).group_by('year', 'month').order_by('year', 'month').all()

    if not results:
        return {
            "success": True,
            "trend": "no_data",
            "message": "No emission data available for trend analysis"
        }

    # Analyze trends
    monthly_totals = [r.total for r in results]
    average_monthly = sum(monthly_totals) / len(monthly_totals)

    peak_month_idx = monthly_totals.index(max(monthly_totals))
    lowest_month_idx = monthly_totals.index(min(monthly_totals))

    # Calculate month-over-month change
    if len(monthly_totals) >= 2:
        recent_change = ((monthly_totals[-1] - monthly_totals[-2]) / monthly_totals[-2] * 100) if monthly_totals[-2] > 0 else 0
    else:
        recent_change = 0

    # Determine trend
    if len(monthly_totals) >= 3:
        recent_avg = sum(monthly_totals[-3:]) / 3
        earlier_avg = sum(monthly_totals[:3]) / 3

        if recent_avg > earlier_avg * 1.1:
            trend = "increasing"
        elif recent_avg < earlier_avg * 0.9:
            trend = "decreasing"
        else:
            trend = "stable"
    else:
        trend = "insufficient_data"

    peak_result = results[peak_month_idx]
    lowest_result = results[lowest_month_idx]

    return {
        "success": True,
        "company_id": company_id,
        "trend": trend,
        "average_monthly_emissions": round(average_monthly, 2),
        "recent_month_change_percentage": round(recent_change, 2),
        "peak_month": {
            "month": get_month_name(int(peak_result.year), int(peak_result.month)),
            "emissions": round(peak_result.total, 2)
        },
        "lowest_month": {
            "month": get_month_name(int(lowest_result.year), int(lowest_result.month)),
            "emissions": round(lowest_result.total, 2)
        },
        "months_analyzed": len(results)
    }
