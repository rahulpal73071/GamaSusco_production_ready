# app/routers/activities.py
"""
Activity Management API - SECURED VERSION
==========================================
Create, read, update, delete emission activities
WITH authentication and company data isolation
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, case, func, String
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime, timezone

from app.database import get_db
from app.models import EmissionActivity, Company, User
from app.calculators.unified_emission_engine import get_engine
from app.ai.scope_classifier import classify_scope_and_category
from app.routers.auth import get_current_user, get_current_admin_user

router = APIRouter(
    prefix="/api/companies/{company_id}/activities",
    tags=["Activity Management"]
)


# ============================================================================
# SECURITY HELPER
# ============================================================================

def verify_company_access(company_id: int, current_user: User, db: Session):
    """
    Verify user has access to company data

    Raises HTTPException if:
    - Company doesn't exist
    - User doesn't belong to this company
    """
    # Check company exists
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )

    # Check user belongs to this company
    if current_user.company_id != company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You don't have permission to access this company's data"
        )

    return company


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class ActivityCreateRequest(BaseModel):
    """Request to create new emission activity"""
    activity_type: str = Field(..., description="Type of activity (e.g., 'diesel', 'electricity', 'flight')")
    activity_name: Optional[str] = Field(None, description="User-friendly name")
    quantity: float = Field(..., gt=0, description="Amount consumed")
    unit: str = Field(..., description="Unit (e.g., 'litre', 'kwh', 'km')")
    activity_date: Optional[str] = Field(None, description="Date of activity (YYYY-MM-DD)")
    description: Optional[str] = Field(None, description="Additional details")
    location: Optional[str] = Field(None, description="Location (e.g., 'Mumbai office')")
    from_location: Optional[str] = Field(None, description="Origin (for travel)")
    to_location: Optional[str] = Field(None, description="Destination (for travel)")
    source_document: Optional[str] = Field(None, description="Source file name")

    @field_validator('activity_date')
    @classmethod
    def validate_date(cls, v):
        if v:
            try:
                datetime.fromisoformat(v)
                return v
            except ValueError:
                raise ValueError('Date must be in YYYY-MM-DD format')
        return v

    model_config = {
        "json_schema_extra": {
            "example": {
                "activity_type": "diesel",
                "activity_name": "Generator fuel - Mumbai office",
                "quantity": 150,
                "unit": "litre",
                "activity_date": "2024-10-15",
                "description": "Monthly generator diesel consumption",
                "location": "Mumbai office"
            }
        }
    }


class ActivityUpdateRequest(BaseModel):
    """Request to update existing activity"""
    activity_name: Optional[str] = None
    quantity: Optional[float] = Field(None, gt=0)
    unit: Optional[str] = None
    activity_date: Optional[str] = None
    description: Optional[str] = None
    is_verified: Optional[bool] = None
    notes: Optional[str] = None


class ActivityResponse(BaseModel):
    """Response with activity details"""
    success: bool
    activity: dict
    message: str


class BulkActivityResponse(BaseModel):
    """Response for bulk operations"""
    success: bool
    total_processed: int
    successful: int
    failed: int
    activities: List[dict]
    errors: Optional[List[dict]] = None


# ============================================================================
# CREATE ACTIVITY (SECURED)
# ============================================================================

@router.post("", response_model=ActivityResponse)
async def create_activity(
        company_id: int,
        request: ActivityCreateRequest,
        current_user: User = Depends(get_current_user),  # ← AUTHENTICATION REQUIRED
        db: Session = Depends(get_db)
):
    """
    ✨ Create a new emission activity (SECURED)

    **Authentication Required:** JWT token
    **Authorization:** User must belong to the company

    **Process:**
    1. Verify user has access to company
    2. Calculate emissions using Unified Engine
    3. Classify scope/category using AI
    4. Save to database

    **Returns:**
    - Activity details with emissions
    - Scope classification
    - Data quality indicators
    """

    print(f"\n{'=' * 70}")
    print(f"📝 CREATE ACTIVITY - Company {company_id}")
    print(f"👤 User: {current_user.username} (ID: {current_user.id})")
    print(f"{'=' * 70}")

    # SECURITY CHECK: Verify user can access this company
    company = verify_company_access(company_id, current_user, db)
    print(f"✅ Access granted to: {company.name}")

    try:
        # STEP 1: Calculate emissions
        print(f"\n1️⃣ Calculating emissions...")
        engine = get_engine()

        calculation = engine.calculate_emissions(
            activity_type=request.activity_type,
            quantity=request.quantity,
            unit=request.unit,
            region=request.location or "India",
            description=request.description or "",
            company_id=company_id
        )

        if not calculation.success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Emission calculation failed: {calculation.error}"
            )

        print(f"   ✅ Emissions: {calculation.co2e_kg:.2f} kg CO2e")

        # STEP 2: Classify scope and category
        print(f"\n2️⃣ Classifying scope...")
        classification = classify_scope_and_category(
            activity_description=request.description or request.activity_type,
            category=request.activity_type,
            quantity=request.quantity,
            unit=request.unit
        )

        print(f"   ✅ {classification['scope']} - {classification['category_name']}")

        # STEP 3: Create activity record
        print(f"\n3️⃣ Saving to database...")

        activity = EmissionActivity(
            company_id=company_id,
            activity_type=request.activity_type,
            activity_name=request.activity_name or f"{request.activity_type} - {request.quantity} {request.unit}",
            description=request.description,
            quantity=request.quantity,
            unit=request.unit,
            emissions_kgco2e=calculation.co2e_kg,
            emission_factor=calculation.emission_factor,
            emission_factor_unit=calculation.emission_factor_unit,
            calculation_method=calculation.calculation_method,
            data_quality=calculation.data_quality,
            confidence=calculation.confidence,
            source=calculation.source,
            scope=classification['scope'],
            scope_number=int(classification['scope'].split()[1]),
            category=classification['category_name'],
            subcategory=classification['sub_category'],
            activity_date=datetime.fromisoformat(request.activity_date) if request.activity_date else datetime.now(
                timezone.utc),
            location=request.location,
            from_location=request.from_location,
            to_location=request.to_location,
            source_document=request.source_document,
            created_by=current_user.username,  # ← Track who created it
            layer=calculation.layer,
            created_at=datetime.now(timezone.utc)
        )

        db.add(activity)
        db.commit()
        db.refresh(activity)

        print(f"   ✅ Saved - Activity ID: {activity.id}")

        # STEP 4: Update company summary (if function exists)
        print(f"\n4️⃣ Updating summary...")
        try:
            from app.models import calculate_summary_for_company
            calculate_summary_for_company(db, company_id, reporting_period="Current")
        except ImportError:
            print("   ⚠️  Summary calculation not available")

        print(f"\n{'=' * 70}")
        print(f"✅ ACTIVITY CREATED SUCCESSFULLY")
        print(f"{'=' * 70}\n")

        return {
            "success": True,
            "activity": {
                "id": activity.id,
                "activity_name": activity.activity_name,
                "activity_type": activity.activity_type,
                "quantity": activity.quantity,
                "unit": activity.unit,
                "emissions_kgco2e": activity.emissions_kgco2e,
                "emissions_tonnes": round(activity.emissions_kgco2e / 1000, 3),
                "scope": activity.scope,
                "category": activity.category,
                "subcategory": activity.subcategory,
                "emission_factor": activity.emission_factor,
                "emission_factor_unit": activity.emission_factor_unit,
                "calculation_method": activity.calculation_method,
                "data_quality": activity.data_quality,
                "confidence": activity.confidence,
                "source": activity.source,
                "activity_date": activity.activity_date.isoformat() if activity.activity_date else None,
                "created_at": activity.created_at.isoformat(),
                "created_by": activity.created_by
            },
            "message": f"Activity created successfully. Emissions: {activity.emissions_kgco2e:.2f} kg CO2e"
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create activity: {str(e)}"
        )


# ============================================================================
# GET ACTIVITIES (SECURED)
# ============================================================================

@router.get("", response_model=dict)
async def get_activities(
        company_id: int,
        current_user: User = Depends(get_current_user),  # ← AUTHENTICATION REQUIRED
        scope: Optional[str] = Query(None, description="Filter by scope(s) - comma-separated (1,2,3)"),
        category: Optional[str] = Query(None, description="Filter by category (exact match or comma-separated)"),
        activity_type: Optional[str] = Query(None, description="Filter by activity type (comma-separated)"),
        search: Optional[str] = Query(None, description="Search in activity name, description, and type"),
        start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD) - filters by activity_date"),
        end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD) - filters by activity_date"),
        sort_by: Optional[str] = Query("activity_date", description="Sort field: activity_date, emissions_kgco2e, activity_name, created_at"),
        sort_order: Optional[str] = Query("desc", description="Sort order: asc or desc"),
        skip: int = Query(0, ge=0, description="Number of records to skip"),
        limit: int = Query(50, ge=1, le=1000, description="Number of records to return"),
        db: Session = Depends(get_db)
):
    """
    📋 Get emission activities with filtering and sorting (SECURED)

    **Authentication Required:** JWT token
    **Authorization:** User must belong to the company

    **Filters:**
    - Scope (comma-separated: "1,2,3")
    - Category (exact match or comma-separated)
    - Activity Type (comma-separated)
    - Search (searches in name, description, type)
    - Date range (start_date, end_date)

    **Sorting:**
    - sort_by: activity_date, emissions_kgco2e, activity_name, created_at
    - sort_order: asc or desc
    """

    # SECURITY CHECK
    company = verify_company_access(company_id, current_user, db)

    # Build query - ONLY for this company
    query = db.query(EmissionActivity).filter(
        EmissionActivity.company_id == company_id  # ← Company isolation
    )

    # Apply filters
    if scope:
        # Handle comma-separated scopes (e.g., "1,2,3")
        scope_list = [int(s.strip()) for s in scope.split(',') if s.strip().isdigit()]
        if scope_list:
            query = query.filter(EmissionActivity.scope_number.in_(scope_list))

    if category:
        # Handle comma-separated categories or single category
        category_list = [c.strip() for c in category.split(',') if c.strip()]
        if category_list:
            # Use exact match for better performance, with OR logic for multiple categories
            query = query.filter(or_(*[EmissionActivity.category.ilike(f"%{cat}%") for cat in category_list]))

    if activity_type:
        # Handle comma-separated activity types
        activity_type_list = [at.strip() for at in activity_type.split(',') if at.strip()]
        if activity_type_list:
            query = query.filter(or_(*[EmissionActivity.activity_type.ilike(f"%{at}%") for at in activity_type_list]))

    if search:
        # Search across multiple fields
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                EmissionActivity.activity_name.ilike(search_term),
                EmissionActivity.activity_type.ilike(search_term),
                EmissionActivity.description.ilike(search_term),
                EmissionActivity.category.ilike(search_term)
            )
        )

    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date)
            # Use activity_date if available, otherwise use created_at
            query = query.filter(
                or_(
                    and_(EmissionActivity.activity_date.isnot(None), EmissionActivity.activity_date >= start_dt),
                    and_(EmissionActivity.activity_date.is_(None), EmissionActivity.created_at >= start_dt)
                )
            )
        except ValueError:
            pass  # Invalid date format, skip filter

    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date)
            # Include time component to cover entire day
            end_dt = end_dt.replace(hour=23, minute=59, second=59)
            # Use activity_date if available, otherwise use created_at
            query = query.filter(
                or_(
                    and_(EmissionActivity.activity_date.isnot(None), EmissionActivity.activity_date <= end_dt),
                    and_(EmissionActivity.activity_date.is_(None), EmissionActivity.created_at <= end_dt)
                )
            )
        except ValueError:
            pass  # Invalid date format, skip filter

    # Get total count BEFORE sorting/pagination
    total = query.count()

    # Apply sorting
    valid_sort_fields = {
        "activity_date": EmissionActivity.activity_date,
        "emissions_kgco2e": EmissionActivity.emissions_kgco2e,
        "activity_name": EmissionActivity.activity_name,
        "created_at": EmissionActivity.created_at
    }

    sort_order_lower = sort_order.lower() if sort_order else "desc"
    
    # Validate sort_by parameter
    if sort_by not in valid_sort_fields:
        sort_by = "activity_date"
    
    sort_field = valid_sort_fields[sort_by]

    # Build order_by with proper null handling for each field type
    if sort_by == "activity_date":
        # For activity_date, use created_at as fallback for null values
        order_by_field = case(
            (EmissionActivity.activity_date.isnot(None), EmissionActivity.activity_date),
            else_=EmissionActivity.created_at
        )
        # Apply sorting
        if sort_order_lower == "asc":
            query = query.order_by(order_by_field.asc(), EmissionActivity.created_at.desc())
        else:
            query = query.order_by(order_by_field.desc(), EmissionActivity.created_at.desc())
            
    elif sort_by == "emissions_kgco2e":
        # For emissions, null values should go last in both ascending and descending
        # Use COALESCE with a very large number for asc (nulls last) or -1 for desc (nulls last)
        if sort_order_lower == "asc":
            # For asc: use a very large number so nulls go to the end
            query = query.order_by(
                func.coalesce(EmissionActivity.emissions_kgco2e, 999999999).asc(),
                EmissionActivity.created_at.desc()
            )
        else:
            # For desc: use -1 so nulls (coalesced to -1) go last (after all positive values)
            query = query.order_by(
                func.coalesce(EmissionActivity.emissions_kgco2e, -1).desc(),
                EmissionActivity.created_at.desc()
            )
            
    elif sort_by == "activity_name":
        # For activity_name, use COALESCE to handle nulls
        # Simple fallback: use activity_type if activity_name is null
        fallback_name = func.coalesce(EmissionActivity.activity_name, EmissionActivity.activity_type, '')
        if sort_order_lower == "asc":
            query = query.order_by(fallback_name.asc(), EmissionActivity.created_at.desc())
        else:
            query = query.order_by(fallback_name.desc(), EmissionActivity.created_at.desc())
            
    else:
        # For created_at and other fields, use directly (shouldn't be null normally)
        if sort_order_lower == "asc":
            query = query.order_by(sort_field.asc(), EmissionActivity.id.desc())
        else:
            query = query.order_by(sort_field.desc(), EmissionActivity.id.desc())

    # Apply pagination
    activities = query.offset(skip).limit(limit).all()

    return {
        "success": True,
        "company_id": company_id,
        "company_name": company.name,
        "total": total,
        "count": len(activities),
        "skip": skip,
        "limit": limit,
        "sort_by": sort_by,
        "sort_order": sort_order_lower,
        "filters_applied": {
            "scope": scope,
            "category": category,
            "activity_type": activity_type,
            "search": search,
            "start_date": start_date,
            "end_date": end_date
        },
        "activities": [a.to_dict() for a in activities]
    }


# ============================================================================
# GET SINGLE ACTIVITY (SECURED)
# ============================================================================

@router.get("/{activity_id}", response_model=dict)
async def get_activity(
        company_id: int,
        activity_id: int,
        current_user: User = Depends(get_current_user),  # ← AUTHENTICATION REQUIRED
        db: Session = Depends(get_db)
):
    """
    🔍 Get single activity details (SECURED)

    **Authentication Required:** JWT token
    **Authorization:** User must belong to the company
    """

    # SECURITY CHECK
    verify_company_access(company_id, current_user, db)

    # Query with company_id filter
    activity = db.query(EmissionActivity).filter(
        EmissionActivity.id == activity_id,
        EmissionActivity.company_id == company_id  # ← Company isolation
    ).first()

    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activity not found"
        )

    return {
        "success": True,
        "activity": activity.to_dict()
    }


# ============================================================================
# UPDATE ACTIVITY (SECURED)
# ============================================================================

@router.put("/{activity_id}", response_model=ActivityResponse)
async def update_activity(
        company_id: int,
        activity_id: int,
        request: ActivityUpdateRequest,
        current_user: User = Depends(get_current_user),  # ← AUTHENTICATION REQUIRED
        db: Session = Depends(get_db)
):
    """
    ✏️ Update existing activity (SECURED)

    **Authentication Required:** JWT token
    **Authorization:** User must belong to the company

    **Note:** If quantity/unit changes, emissions are recalculated
    """

    # SECURITY CHECK
    verify_company_access(company_id, current_user, db)

    # Query with company_id filter
    activity = db.query(EmissionActivity).filter(
        EmissionActivity.id == activity_id,
        EmissionActivity.company_id == company_id  # ← Company isolation
    ).first()

    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activity not found"
        )

    try:
        # Track if recalculation needed
        needs_recalc = False

        # Update fields
        if request.activity_name:
            activity.activity_name = request.activity_name

        if request.quantity:
            activity.quantity = request.quantity
            needs_recalc = True

        if request.unit:
            activity.unit = request.unit
            needs_recalc = True

        if request.activity_date:
            activity.activity_date = datetime.fromisoformat(request.activity_date)

        if request.description:
            activity.description = request.description

        if request.is_verified is not None:
            activity.is_verified = request.is_verified

        if request.notes:
            activity.notes = request.notes

        # Recalculate if needed
        if needs_recalc:
            print(f"🔄 Recalculating emissions...")
            engine = get_engine()
            calculation = engine.calculate_emissions(
                activity_type=activity.activity_type,
                quantity=activity.quantity,
                unit=activity.unit,
                region=activity.location or "India"
            )

            if calculation.success:
                activity.emissions_kgco2e = calculation.co2e_kg
                activity.emission_factor = calculation.emission_factor
                activity.calculation_method = calculation.calculation_method
                activity.confidence = calculation.confidence

        activity.updated_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(activity)

        print(f"✅ Activity {activity_id} updated by {current_user.username}")

        return {
            "success": True,
            "activity": activity.to_dict(),
            "message": "Activity updated successfully"
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Update failed: {str(e)}"
        )


# ============================================================================
# DELETE ACTIVITY (SECURED)
# ============================================================================

@router.delete("/{activity_id}")
async def delete_activity(
        company_id: int,
        activity_id: int,
        current_user: User = Depends(get_current_user),  # ← AUTHENTICATION REQUIRED
        db: Session = Depends(get_db)
):
    """
    🗑️ Delete activity (SECURED)

    **Authentication Required:** JWT token
    **Authorization:** User must belong to the company
    """

    # SECURITY CHECK
    verify_company_access(company_id, current_user, db)

    # Query with company_id filter
    activity = db.query(EmissionActivity).filter(
        EmissionActivity.id == activity_id,
        EmissionActivity.company_id == company_id  # ← Company isolation
    ).first()

    if not activity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activity not found"
        )

    db.delete(activity)
    db.commit()

    print(f"🗑️ Activity {activity_id} deleted by {current_user.username}")

    return {
        "success": True,
        "message": f"Activity {activity_id} deleted successfully"
    }


# ============================================================================
# BULK CREATE (SECURED)
# ============================================================================

@router.post("/bulk", response_model=BulkActivityResponse)
async def create_activities_bulk(
        company_id: int,
        activities: List[ActivityCreateRequest],
        current_user: User = Depends(get_current_user),  # ← AUTHENTICATION REQUIRED
        db: Session = Depends(get_db)
):
    """
    📦 Create multiple activities at once (SECURED)

    **Authentication Required:** JWT token
    **Authorization:** User must belong to the company

    **Limit:** 100 activities per request
    """

    if len(activities) > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 100 activities per bulk request"
        )

    # SECURITY CHECK
    company = verify_company_access(company_id, current_user, db)

    print(f"\n📦 BULK CREATE - {len(activities)} activities")
    print(f"👤 User: {current_user.username}")
    print(f"🏢 Company: {company.name}")

    created_activities = []
    errors = []

    for idx, activity_req in enumerate(activities, 1):
        try:
            print(f"\n   Processing {idx}/{len(activities)}...")

            # Calculate emissions
            engine = get_engine()
            calculation = engine.calculate_emissions(
                activity_type=activity_req.activity_type,
                quantity=activity_req.quantity,
                unit=activity_req.unit,
                region=activity_req.location or "India"
            )

            if not calculation.success:
                errors.append({
                    "index": idx,
                    "activity": activity_req.activity_type,
                    "error": calculation.error
                })
                continue

            # Classify
            classification = classify_scope_and_category(
                activity_description=activity_req.description or activity_req.activity_type,
                category=activity_req.activity_type,
                quantity=activity_req.quantity,
                unit=activity_req.unit
            )

            # Create activity
            activity = EmissionActivity(
                company_id=company_id,  # ← Locked to user's company
                activity_type=activity_req.activity_type,
                activity_name=activity_req.activity_name or f"{activity_req.activity_type} - {activity_req.quantity} {activity_req.unit}",
                description=activity_req.description,
                quantity=activity_req.quantity,
                unit=activity_req.unit,
                emissions_kgco2e=calculation.co2e_kg,
                emission_factor=calculation.emission_factor,
                calculation_method=calculation.calculation_method,
                data_quality=calculation.data_quality,
                confidence=calculation.confidence,
                scope=classification['scope'],
                scope_number=int(classification['scope'].split()[1]),
                category=classification['category_name'],
                activity_date=datetime.fromisoformat(
                    activity_req.activity_date) if activity_req.activity_date else datetime.now(timezone.utc),
                location=activity_req.location,
                created_by=f"{current_user.username}_BULK",  # ← Track creator
                created_at=datetime.now(timezone.utc)
            )

            db.add(activity)
            created_activities.append(activity)

        except Exception as e:
            errors.append({
                "index": idx,
                "activity": activity_req.activity_type,
                "error": str(e)
            })

    # Commit all
    try:
        db.commit()
        print(f"\n✅ Created {len(created_activities)} activities")
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Bulk create failed: {str(e)}"
        )

    return {
        "success": True,
        "total_processed": len(activities),
        "successful": len(created_activities),
        "failed": len(errors),
        "activities": [
            {
                "id": a.id,
                "activity_name": a.activity_name,
                "emissions_kgco2e": a.emissions_kgco2e
            } for a in created_activities
        ],
        "errors": errors if errors else None
    }


# ============================================================================
# ADMIN ENDPOINT: View All Companies' Activities
# ============================================================================

@router.get("/admin/all-activities")
async def get_all_activities_admin(
        current_user: User = Depends(get_current_admin_user),  # ← ADMIN ONLY
        skip: int = Query(0, ge=0),
        limit: int = Query(50, ge=1, le=1000),
        db: Session = Depends(get_db)
):
    """
    🔐 Admin Only: View activities across ALL companies

    **Authentication Required:** JWT token
    **Authorization:** Admin role required
    """

    print(f"🔐 Admin access by: {current_user.username}")

    # Admin can see all activities
    query = db.query(EmissionActivity)
    total = query.count()

    activities = query.order_by(
        EmissionActivity.created_at.desc()
    ).offset(skip).limit(limit).all()

    return {
        "success": True,
        "admin_view": True,
        "total": total,
        "count": len(activities),
        "activities": [a.to_dict() for a in activities]
    }