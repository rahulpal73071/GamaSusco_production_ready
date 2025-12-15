# app/routers/ai_recommendations.py
"""
AI Recommendations Router - Integrated with working recommendation engine
Author: SHUB-05101995
Date: 2025-10-19
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import datetime, timedelta

from app.database import get_db
from app.db_maintenance import ensure_ai_recommendation_schema
from app.models import EmissionActivity, Company, AIRecommendation, User
from app.services.recommendation_engine import generate_detailed_recommendations
from app.routers.auth import get_current_user

router = APIRouter(
    prefix="/api/v1/recommendations",
    tags=["AI Recommendations"]
)


@router.get("/company/{company_id}")
def get_ai_recommendations(
        company_id: int,
        period: Optional[str] = None,
        max_recommendations: int = Query(5, ge=1, le=10),
        force_refresh: bool = Query(False, description="Force generation of new recommendations"),
        db: Session = Depends(get_db)
):
    """
    🤖 Generate AI-powered emission reduction recommendations with caching

    Returns detailed, comprehensive recommendations with:
    - 400+ word strategic analysis per recommendation
    - Implementation roadmaps with phases and timelines
    - Cost-benefit analysis and ROI calculations
    - Risk assessment and mitigation strategies
    - KPI tracking frameworks
    - Persistent storage across page reloads

    Query Parameters:
    - period: Filter by reporting period
    - max_recommendations: Number of recommendations (1-10)
    - force_refresh: Force new generation ignoring cache
    """

    print(f"\n{'=' * 80}")
    print(f"🤖 AI RECOMMENDATIONS REQUEST")
    print(f"{'=' * 80}")
    print(f"Company ID: {company_id}")
    print(f"Period: {period or 'All time'}")
    print(f"Max Recommendations: {max_recommendations}")
    print(f"Force Refresh: {force_refresh}")

    # Get company
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    print(f"Company: {company.name} ({company.industry})")

    # Check for cached recommendations first (unless force refresh)
    if not force_refresh:
        ensure_ai_recommendation_schema()
        cached_rec = get_cached_recommendations(db, company_id, period, max_recommendations)
        if cached_rec:
            print("✅ Returning cached recommendations")
            return format_cached_response(db, cached_rec, company, period)

    print("🔄 No valid cache found, generating new recommendations...")

    # Check for cached recommendations (unless force refresh)
    if not force_refresh:
        cached_recommendation = get_cached_recommendations(db, company_id, period, max_recommendations)
        if cached_recommendation:
            print("✅ Using cached recommendations")
            return format_cached_response(db, cached_recommendation, company, period)

    print("🔄 Generating new recommendations...")

    # Get activities
    query = db.query(EmissionActivity).filter(
        EmissionActivity.company_id == company_id
    )

    if period:
        query = query.filter(EmissionActivity.reporting_period == period)

    activities = query.all()

    if not activities:
        return {
            "success": False,
            "error": "No emission data found. Please add activities first.",
            "company_id": company_id,
            "company_name": company.name
        }

    print(f"Found {len(activities)} activities")

    # Calculate emissions summary
    total_emissions = sum(a.emissions_kgco2e for a in activities)
    scope_1 = sum(a.emissions_kgco2e for a in activities if a.scope_number == 1)
    scope_2 = sum(a.emissions_kgco2e for a in activities if a.scope_number == 2)
    scope_3 = sum(a.emissions_kgco2e for a in activities if a.scope_number == 3)

    print(f"Total emissions: {total_emissions:,.0f} kg CO2e")
    print(f"  Scope 1: {scope_1:,.0f} kg")
    print(f"  Scope 2: {scope_2:,.0f} kg")
    print(f"  Scope 3: {scope_3:,.0f} kg")

    emissions_summary = {
        'total_emissions_kg': total_emissions,
        'scope_1_kg': scope_1,
        'scope_2_kg': scope_2,
        'scope_3_kg': scope_3
    }

    # Group activities by type to find top sources
    activity_groups = {}
    for activity in activities:
        activity_type = activity.activity_type or 'other'

        if activity_type not in activity_groups:
            activity_groups[activity_type] = {
                'activity_type': activity_type,
                'emissions_kg': 0,
                'quantity': 0,
                'unit': activity.unit or 'unit',
                'count': 0,
                'scope': activity.scope
            }

        activity_groups[activity_type]['emissions_kg'] += activity.emissions_kgco2e
        activity_groups[activity_type]['quantity'] += activity.quantity or 0
        activity_groups[activity_type]['count'] += 1

    # Sort by emissions and get top sources
    top_sources = sorted(
        activity_groups.values(),
        key=lambda x: x['emissions_kg'],
        reverse=True
    )[:max_recommendations]

    print(f"\nTop {len(top_sources)} emission sources:")
    for i, source in enumerate(top_sources, 1):
        print(f"  {i}. {source['activity_type']}: {source['emissions_kg']:,.0f} kg CO2e")

    print("🔄 Generating new recommendations...")
    # Generate comprehensive AI recommendations with storage
    try:
        recommendation_result = generate_detailed_recommendations(
            company_id=company_id,
            emissions_summary=emissions_summary,
            top_sources=top_sources,
            max_recommendations=max_recommendations,
            company_name=company.name,
            industry=company.industry or "Unknown Industry",
            period=period,
            db_session=db,
            ai_recommendation_class=AIRecommendation
        )

        print("✅ Successfully generated comprehensive recommendations")
        print(f"   Generated ID: {recommendation_result.get('recommendation_id', 'N/A')}")
        print(f"   Recommendations count: {len(recommendation_result.get('recommendations', []))}")

        # Add unique IDs to each recommendation for frontend tracking
        recommendations_with_ids = []
        for i, rec in enumerate(recommendation_result.get('recommendations', [])):
            rec_copy = dict(rec)
            unique_id = f"{recommendation_result.get('recommendation_id')}_rec_{i}"
            rec_copy['recommendation_unique_id'] = unique_id
            recommendations_with_ids.append(rec_copy)
            print(f"🔍 Added unique_id to fresh rec {i}: {unique_id}")

        # Format response
        response = {
            "success": True,
            "company": {
                "id": company.id,
                "name": company.name,
                "industry": company.industry
            },
            "period": period,
            "current_emissions": {
                "total_kg": round(total_emissions, 2),
                "total_tonnes": round(total_emissions / 1000, 2),
                "scope_1_kg": round(scope_1, 2),
                "scope_2_kg": round(scope_2, 2),
                "scope_3_kg": round(scope_3, 2),
                "breakdown": {
                    "scope_1_percentage": round(scope_1 / total_emissions * 100, 1) if total_emissions > 0 else 0,
                    "scope_2_percentage": round(scope_2 / total_emissions * 100, 1) if total_emissions > 0 else 0,
                    "scope_3_percentage": round(scope_3 / total_emissions * 100, 1) if total_emissions > 0 else 0
                }
            },
            "top_emission_sources": [
                {
                    "activity_type": source['activity_type'],
                    "emissions_kg": round(source['emissions_kg'], 2),
                    "emissions_tonnes": round(source['emissions_kg'] / 1000, 2),
                    "percentage_of_total": round(source['emissions_kg'] / total_emissions * 100,
                                                 1) if total_emissions > 0 else 0,
                    "scope": source['scope'],
                    "activity_count": source['count']
                }
                for source in top_sources
            ],
            "recommendations": recommendations_with_ids,
            "summary": recommendation_result.get('summary', {}),
            "metadata": recommendation_result.get('metadata', {}),
            "cached": False,
            "recommendation_id": recommendation_result.get('recommendation_id'),
            "generated_at": datetime.utcnow().isoformat() + "Z"
        }

        # Add model info
        response["summary"]["model"] = "GPT-4o with comprehensive analysis"
        response["summary"]["cached"] = False

        return response

    except Exception as e:
        print(f"\n❌ Error generating recommendations: {e}")
        import traceback
        traceback.print_exc()

        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate recommendations: {str(e)}"
        )


@router.get("/")
def recommendations_info():
    """
    Info endpoint for recommendations service
    """
    from app.services.recommendation_engine import client

    return {
        "service": "AI Recommendations Engine",
        "version": "2.0",
        "status": "active",
        "features": [
            "AI-powered recommendations using GPT-4o-mini",
            "Template-based fallback system",
            "250+ word detailed analysis",
            "Implementation guidance",
            "Cost and timeline estimates",
            "Priority-based recommendations"
        ],
        "endpoints": {
            "get_recommendations": "/api/v1/recommendations/company/{company_id}",
            "info": "/api/v1/recommendations/",
            "health": "/api/v1/recommendations/health"
        },
        "openai_configured": client is not None,
        "author": "SHUB-05101995",
        "last_updated": "2025-10-19"
    }


def get_cached_recommendations(db: Session, company_id: int, period: str = None, max_recommendations: int = 5):
    """
    Check for valid cached recommendations.

    Returns AIRecommendation object if valid cache exists, None otherwise.
    """

    # Query for recent, valid recommendations
    query = db.query(AIRecommendation).filter(
        AIRecommendation.company_id == company_id,
        AIRecommendation.is_active == True,
        AIRecommendation.max_recommendations >= max_recommendations  # At least as many as requested
    )

    # Filter by period if specified
    if period:
        query = query.filter(AIRecommendation.period == period)
    else:
        query = query.filter(AIRecommendation.period.is_(None))

    # Get most recent valid recommendation
    cached = query.order_by(AIRecommendation.generated_at.desc()).first()

    if not cached:
        print("   📭 No cached recommendations found")
        return None

    # Check if expired
    if cached.is_expired():
        print(f"   ⏰ Cached recommendations expired (expired: {cached.expires_at})")
        cached.is_active = False  # Mark as inactive
        db.commit()
        return None

    # Check if data might be stale (new activities added after generation)
    latest_activity = db.query(EmissionActivity).filter(
        EmissionActivity.company_id == company_id
    ).order_by(EmissionActivity.created_at.desc()).first()

    if latest_activity and latest_activity.created_at > cached.generated_at:
        print("   🔄 New activities detected since last generation - cache may be stale")
        # Don't automatically invalidate, but could add logic here if needed

    print(f"   ✅ Valid cache found: {cached.recommendation_id} (generated: {cached.generated_at})")
    return cached


def format_cached_response(db: Session, cached_recommendation: AIRecommendation, company: Company, period: str = None):
    """
    Format cached recommendation for API response.
    """

    # Add unique IDs to each recommendation for frontend tracking
    recommendations_with_ids = []
    for i, rec in enumerate(cached_recommendation.recommendations_json):
        rec_copy = dict(rec)
        unique_id = f"{cached_recommendation.recommendation_id}_rec_{i}"
        rec_copy['recommendation_unique_id'] = unique_id
        recommendations_with_ids.append(rec_copy)
        print(f"🔍 Added unique_id to cached rec {i}: {unique_id}")

    # Calculate current emissions for context (might have changed)
    activities_query = db.query(EmissionActivity).filter(
        EmissionActivity.company_id == company.id
    )

    if period:
        activities_query = activities_query.filter(EmissionActivity.reporting_period == period)

    activities = activities_query.all()
    total_emissions = sum(a.emissions_kgco2e for a in activities) if activities else 0
    scope_1 = sum(a.emissions_kgco2e for a in activities if a.scope_number == 1) if activities else 0
    scope_2 = sum(a.emissions_kgco2e for a in activities if a.scope_number == 2) if activities else 0
    scope_3 = sum(a.emissions_kgco2e for a in activities if a.scope_number == 3) if activities else 0

    return {
        "success": True,
        "company": {
            "id": company.id,
            "name": company.name,
            "industry": company.industry
        },
        "period": period,
        "current_emissions": {
            "total_kg": round(total_emissions, 2),
            "total_tonnes": round(total_emissions / 1000, 2),
            "scope_1_kg": round(scope_1, 2),
            "scope_2_kg": round(scope_2, 2),
            "scope_3_kg": round(scope_3, 2),
            "breakdown": {
                "scope_1_percentage": round(scope_1 / total_emissions * 100, 1) if total_emissions > 0 else 0,
                "scope_2_percentage": round(scope_2 / total_emissions * 100, 1) if total_emissions > 0 else 0,
                "scope_3_percentage": round(scope_3 / total_emissions * 100, 1) if total_emissions > 0 else 0
            }
        },
        "title": cached_recommendation.title,
        "executive_summary": cached_recommendation.executive_summary,
        "detailed_analysis": cached_recommendation.detailed_analysis,
        "recommendations": recommendations_with_ids,
        "summary": {
            "total_recommendations": len(cached_recommendation.recommendations_json),
            "total_potential_savings_kg": cached_recommendation.total_potential_savings_kg,
            "total_potential_savings_tonnes": cached_recommendation.total_potential_savings_tonnes,
            "potential_reduction_percentage": cached_recommendation.potential_reduction_percentage,
            "high_priority_count": cached_recommendation.high_priority_count,
            "medium_priority_count": cached_recommendation.medium_priority_count,
            "low_priority_count": cached_recommendation.low_priority_count,
            "model": cached_recommendation.ai_model,
            "cached": True,
            "generated_at": cached_recommendation.generated_at.isoformat() if cached_recommendation.generated_at else None,
            "expires_at": cached_recommendation.expires_at.isoformat() if cached_recommendation.expires_at else None
        },
        "metadata": {
            "recommendation_id": cached_recommendation.recommendation_id,
            "processing_time_seconds": cached_recommendation.processing_time_seconds,
            "generated_by": cached_recommendation.generated_by,
            "cached": True,
            "cache_age_hours": (datetime.utcnow() - cached_recommendation.generated_at).total_seconds() / 3600 if cached_recommendation.generated_at else None
        },
        "top_emission_sources": [],  # Would need to recalculate if needed
        "generated_at": cached_recommendation.generated_at.isoformat() + "Z" if cached_recommendation.generated_at else None
    }


@router.get("/health")
def recommendations_health():
    """
    Health check for recommendations service
    """
    from app.services.recommendation_engine import client

    status = "healthy" if client is not None else "degraded"

    return {
        "status": status,
        "service": "recommendations",
        "openai_configured": client is not None,
        "fallback_available": True,
        "version": "2.0",
        "features": [
            "Comprehensive AI-generated recommendations",
            "Persistent caching across sessions",
            "Detailed implementation roadmaps",
            "Cost-benefit analysis",
            "Risk assessment frameworks"
        ],
        "storage_enabled": True,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }


@router.put("/company/{company_id}/recommendations/{recommendation_id}/save")
def save_recommendation_for_later(
        company_id: int,
        recommendation_id: str,
        db: Session = Depends(get_db)
):
    """
    Save a recommendation for later review.
    The recommendation_id parameter can be either the actual recommendation_id
    or the recommendation_unique_id (which contains the recommendation_id).
    """

    ensure_ai_recommendation_schema()
    print(f"🔍 Save endpoint called with recommendation_id: {recommendation_id}")

    # Get company
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    # Parse recommendation_id - it might be the unique_id format
    actual_recommendation_id = recommendation_id
    if "_rec_" in recommendation_id:
        # Extract the actual recommendation_id from the unique_id format
        parts = recommendation_id.split("_rec_")
        if len(parts) >= 2:
            actual_recommendation_id = parts[0]
        print(f"🔍 Parsed from unique_id: '{recommendation_id}' -> '{actual_recommendation_id}'")

    print(f"🔍 Looking for recommendation_id: {actual_recommendation_id}")

    # Get recommendation
    recommendation = db.query(AIRecommendation).filter(
        AIRecommendation.company_id == company_id,
        AIRecommendation.recommendation_id == actual_recommendation_id
    ).first()

    print(f"🔍 Database query result: {'Found' if recommendation else 'Not found'}")

    if not recommendation:
        # Debug: list all recommendations for this company
        all_recs = db.query(AIRecommendation).filter(
            AIRecommendation.company_id == company_id
        ).all()
        print(f"🔍 All recommendations for company {company_id}:")
        for i, rec in enumerate(all_recs):
            print(f"   {i}: {rec.recommendation_id} (saved: {rec.is_saved}, implemented: {rec.is_implemented})")

        # Try to find by partial match if it's a generated ID
        if recommendation_id.startswith("rec_") and "_rec_" in recommendation_id:
            # This is a fallback ID from frontend, try to find any recent recommendation
            recent_recs = db.query(AIRecommendation).filter(
                AIRecommendation.company_id == company_id
            ).order_by(AIRecommendation.generated_at.desc()).limit(5).all()

            if recent_recs:
                # Try to match by index if possible
                parts = recommendation_id.split("_rec_")
                if len(parts) >= 2:
                    try:
                        rec_index = int(parts[1])
                        if rec_index < len(recent_recs):
                            recommendation = recent_recs[rec_index]
                            print(f"🔍 Using recommendation at index {rec_index}: {recommendation.recommendation_id}")
                        else:
                            recommendation = recent_recs[0]  # Use most recent if index out of bounds
                            print(f"🔍 Index {rec_index} out of bounds, using most recent: {recommendation.recommendation_id}")
                    except ValueError:
                        recommendation = recent_recs[0]  # Use most recent if parsing fails
                        print(f"🔍 Failed to parse index, using most recent: {recommendation.recommendation_id}")
                else:
                    recommendation = recent_recs[0]
                    print(f"🔍 Using most recent recommendation: {recommendation.recommendation_id}")
            else:
                raise HTTPException(status_code=404, detail=f"No recommendations found for company {company_id}")
        else:
            raise HTTPException(status_code=404, detail=f"Recommendation {actual_recommendation_id} not found")

    # Update status
    recommendation.is_saved = True
    recommendation.saved_at = datetime.utcnow()

    db.commit()

    print(f"✅ Successfully saved recommendation {recommendation.recommendation_id}")

    return {
        "success": True,
        "message": "Recommendation saved for later",
        "recommendation_id": recommendation.recommendation_id,
        "saved_at": recommendation.saved_at.isoformat() + "Z"
    }


@router.put("/company/{company_id}/recommendations/{recommendation_id}/implement")
def mark_recommendation_as_implemented(
        company_id: int,
        recommendation_id: str,
        request: Optional[dict] = Body(None),
        db: Session = Depends(get_db)
):
    """
    Mark a recommendation as implemented.
    Optional: Include implementation notes and progress percentage.
    The recommendation_id parameter can be either the actual recommendation_id
    or the recommendation_unique_id (which contains the recommendation_id).
    """

    ensure_ai_recommendation_schema()
    print(f"🔍 Implement endpoint called with recommendation_id: {recommendation_id}")

    # Get company
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    # Parse recommendation_id - it might be the unique_id format
    actual_recommendation_id = recommendation_id
    if "_rec_" in recommendation_id:
        # Extract the actual recommendation_id from the unique_id format
        parts = recommendation_id.split("_rec_")
        if len(parts) >= 2:
            actual_recommendation_id = parts[0]
        print(f"🔍 Parsed from unique_id: '{recommendation_id}' -> '{actual_recommendation_id}'")

    print(f"🔍 Looking for recommendation_id: {actual_recommendation_id}")

    # Get recommendation
    recommendation = db.query(AIRecommendation).filter(
        AIRecommendation.company_id == company_id,
        AIRecommendation.recommendation_id == actual_recommendation_id
    ).first()

    print(f"🔍 Database query result: {'Found' if recommendation else 'Not found'}")

    if not recommendation:
        # Debug: list all recommendations for this company
        all_recs = db.query(AIRecommendation).filter(
            AIRecommendation.company_id == company_id
        ).all()
        print(f"🔍 All recommendations for company {company_id}:")
        for i, rec in enumerate(all_recs):
            print(f"   {i}: {rec.recommendation_id} (saved: {rec.is_saved}, implemented: {rec.is_implemented})")

        # Try to find by partial match if it's a generated ID
        if recommendation_id.startswith("rec_") and "_rec_" in recommendation_id:
            # This is a fallback ID from frontend, try to find any recent recommendation
            recent_recs = db.query(AIRecommendation).filter(
                AIRecommendation.company_id == company_id
            ).order_by(AIRecommendation.generated_at.desc()).limit(5).all()

            if recent_recs:
                # Try to match by index if possible
                parts = recommendation_id.split("_rec_")
                if len(parts) >= 2:
                    try:
                        rec_index = int(parts[1])
                        if rec_index < len(recent_recs):
                            recommendation = recent_recs[rec_index]
                            print(f"🔍 Using recommendation at index {rec_index}: {recommendation.recommendation_id}")
                        else:
                            recommendation = recent_recs[0]  # Use most recent if index out of bounds
                            print(f"🔍 Index {rec_index} out of bounds, using most recent: {recommendation.recommendation_id}")
                    except ValueError:
                        recommendation = recent_recs[0]  # Use most recent if parsing fails
                        print(f"🔍 Failed to parse index, using most recent: {recommendation.recommendation_id}")
                else:
                    recommendation = recent_recs[0]
                    print(f"🔍 Using most recent recommendation: {recommendation.recommendation_id}")
            else:
                raise HTTPException(status_code=404, detail=f"No recommendations found for company {company_id}")
        else:
            raise HTTPException(status_code=404, detail=f"Recommendation {actual_recommendation_id} not found")

    # Update status
    recommendation.is_implemented = True
    recommendation.implemented_at = datetime.utcnow()

    # Optional fields from request body
    if request:
        if "implementation_notes" in request:
            recommendation.implementation_notes = request["implementation_notes"]
        if "implementation_progress" in request:
            recommendation.implementation_progress = float(request["implementation_progress"])

    db.commit()

    print(f"✅ Successfully marked as implemented: {recommendation.recommendation_id}")

    return {
        "success": True,
        "message": "Recommendation marked as implemented",
        "recommendation_id": recommendation.recommendation_id,
        "implemented_at": recommendation.implemented_at.isoformat() + "Z",
        "implementation_notes": recommendation.implementation_notes,
        "implementation_progress": recommendation.implementation_progress
    }


@router.get("/company/{company_id}/saved")
def get_saved_recommendations(company_id: int, db: Session = Depends(get_db)):
    """
    Get all saved recommendations for a company.
    """
    ensure_ai_recommendation_schema()

    # Get company
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    # Get saved recommendations
    saved_recommendations = db.query(AIRecommendation).filter(
        AIRecommendation.company_id == company_id,
        AIRecommendation.is_saved == True,
        AIRecommendation.is_active == True
    ).order_by(AIRecommendation.saved_at.desc()).all()

    return {
        "success": True,
        "company": {
            "id": company.id,
            "name": company.name
        },
        "saved_recommendations": [rec.to_dict() for rec in saved_recommendations],
        "total_saved": len(saved_recommendations)
    }


@router.get("/company/{company_id}/implemented")
def get_implemented_recommendations(company_id: int, db: Session = Depends(get_db)):
    """
    Get all implemented recommendations for a company.
    """
    ensure_ai_recommendation_schema()

    # Get company
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    # Get implemented recommendations
    implemented_recommendations = db.query(AIRecommendation).filter(
        AIRecommendation.company_id == company_id,
        AIRecommendation.is_implemented == True,
        AIRecommendation.is_active == True
    ).order_by(AIRecommendation.implemented_at.desc()).all()

    return {
        "success": True,
        "company": {
            "id": company.id,
            "name": company.name
        },
        "implemented_recommendations": [rec.to_dict() for rec in implemented_recommendations],
        "total_implemented": len(implemented_recommendations)
    }


@router.get("/company/{company_id}/debug")
def debug_recommendations(company_id: int, db: Session = Depends(get_db)):
    """
    Debug endpoint to list all recommendations for a company.
    """
    ensure_ai_recommendation_schema()

    # Get company
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    # Get all recommendations
    all_recommendations = db.query(AIRecommendation).filter(
        AIRecommendation.company_id == company_id
    ).all()

    return {
        "success": True,
        "company": company.name,
        "total_recommendations": len(all_recommendations),
        "recommendations": [
            {
                "id": rec.id,
                "recommendation_id": rec.recommendation_id,
                "is_active": rec.is_active,
                "is_saved": rec.is_saved,
                "is_implemented": rec.is_implemented,
                "generated_at": rec.generated_at.isoformat() if rec.generated_at else None,
                "saved_at": rec.saved_at.isoformat() if rec.saved_at else None,
                "implemented_at": rec.implemented_at.isoformat() if rec.implemented_at else None
            }
            for rec in all_recommendations
        ]
    }


@router.delete("/company/{company_id}/cache")
def clear_recommendation_cache(company_id: int, db: Session = Depends(get_db)):
    """
    Clear cached recommendations for a company.
    Useful for forcing fresh generation.
    """
    ensure_ai_recommendation_schema()

    # Get company
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    # Mark all recommendations as inactive
    updated = db.query(AIRecommendation).filter(
        AIRecommendation.company_id == company_id,
        AIRecommendation.is_active == True
    ).update({"is_active": False})

    db.commit()

    return {
        "success": True,
        "message": f"Cleared {updated} cached recommendations for {company.name}",
        "company_id": company_id
    }
