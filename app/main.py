"""
FastAPI Backend - Carbon Accounting Platform
============================================
RESTful API endpoints for frontend dashboard
Provides emission data with full scope/category breakdown

Author: SHUB-0510
Version: 3.0 - Enhanced with new features
Updated: 2025-10-12 20:41:44
"""

print("🔹 Starting imports...")

from fastapi import FastAPI, Depends, HTTPException

print("✅ FastAPI imported")

from fastapi.middleware.cors import CORSMiddleware

print("✅ CORS imported")

from sqlalchemy.orm import Session
from sqlalchemy import func, desc, text  # ← Add ", text" here

# from sqlalchemy.orm import Session
# from sqlalchemy import func, desc

print("✅ SQLAlchemy imported")

from typing import Optional
from datetime import datetime

print("✅ Standard libs imported")

print("🔹 Importing database...")

from app.database import SessionLocal, engine, Base, get_db, seed_cbam_goods  # ✅ Make sure get_db is here

print("✅ Database imported")

print("🔹 Importing models...")
from app.models import (
    Company, EmissionActivity, EmissionSummary,
    get_company_emissions_dashboard,
    # CBAM models - ensure they're imported so tables are created
    CBAMInstallation, CBAMGoods, CBAMEmission, CBAMPrecursor, CBAMQuarterlyReport
)

# Import Scope 3 models to ensure their tables are created by Base.metadata.create_all
import app.models_scope3  # noqa: F401  (unused import)

# Around line 20-40 in main.py

print("🔹 Importing routers...")

ROUTERS_AVAILABLE = False

try:
    from app.routers import auth

    print("   ✅ Auth router")

    from app.routers import activities

    print("   ✅ Activities router")

    from app.routers import upload

    print("   ✅ Upload router")

    from app.routers import bulk

    print("   ✅ Bulk router")

    from app.routers import goals

    print("   ✅ Goals router")

    try:
        # Import from reports2.py which has the working implementation
        from app import reports2
        reports = reports2
        print("   ✅ Reports router (from reports2.py)")
    except ImportError:
        try:
            from app.routers import reports
            print("   ✅ Reports router (from routers)")
        except ImportError as e:
            print(f"   ⚠️ Reports router not found: {e}")
            reports = None

    from app.routers import benchmarks

    print("   ✅ Benchmarks router")

    # New routers for water and waste footprints
    from app.routers import energy  # Ensure energy already imported earlier

    print("   ✅ Energy router")
    from app.routers import water

    print("   ✅ Water router")
    from app.routers import waste

    print("   ✅ Waste router")

    # New router for Scope 3 value‑chain emissions
    from app.routers import scope3

    print("   ✅ Scope3 router")

    from app.routers import recommendations  # ← ADD THIS

    print("   ✅ Recommendations router")

    # Dashboard router with lifecycle overview
    from app.routers import dashboard

    print("   ✅ Dashboard router")

    # Analytics router with month-wise emission tracking
    from app.routers import analytics

    print("   ✅ Analytics router")

    # CBAM (Carbon Border Adjustment Mechanism) router
    from app.routers import cbam

    print("   ✅ CBAM router")

    # Add this after the router imports but before registration
    print("🔍 Testing recommendations import...")
    try:
        print(f"   Recommendations module: {recommendations}")
        print(f"   Router attribute exists: {hasattr(recommendations, 'router')}")
        print(f"   Router type: {type(recommendations.router)}")
        print(f"   Router routes: {len(recommendations.router.routes)} routes")
    except Exception as e:
        print(f"   ❌ Error accessing recommendations: {e}")

    ROUTERS_AVAILABLE = True
    print("✅ All routers imported")

except ImportError as e:
    print(f"⚠️ Router import error: {e}")
    import traceback

    traceback.print_exc()
#
#

# Create tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="Carbon Accounting Platform API",
    description="Comprehensive Carbon Emissions Tracking, Analysis & Reporting Platform with AI-Powered Features",
    version="3.0",
    contact={
        "name": "SHUB-0510",
        "email": "support@carbonplatform.com"
    },
    license_info={
        "name": "MIT",
        "url": "https://opensource.org/licenses/MIT"
    }
)

# CORS configuration for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ADD THIS TO app/main.py - After CORS middleware, before router registration

from fastapi import Request
from app.routers.auth import decode_token


# ============================================================================
# SECURITY MIDDLEWARE - Company Context Injection
# ============================================================================

@app.middleware("http")
async def add_company_context(request: Request, call_next):
    """
    Extract company_id from JWT token and inject into request state
    This ensures all queries are automatically filtered by company_id
    """

    # Skip auth for public endpoints
    public_paths = [
        "/",
        "/docs",
        "/redoc",
        "/openapi.json",
        "/health",
        "/api/info",
        "/api/v1/auth/login",
        "/api/v1/auth/register"
    ]

    if request.url.path in public_paths:
        response = await call_next(request)
        return response

    # Extract token from Authorization header
    auth_header = request.headers.get("Authorization")

    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]

        # Decode token and extract company_id
        payload = decode_token(token)

        if payload:
            request.state.user_id = payload.get("user_id")
            request.state.company_id = payload.get("company_id")
            request.state.username = payload.get("sub")
            request.state.role = payload.get("role")
        else:
            # Invalid token - set to None
            request.state.company_id = None
            request.state.user_id = None
    else:
        # No token provided
        request.state.company_id = None
        request.state.user_id = None

    response = await call_next(request)
    return response


print("🔹 Registering routers...")

# Include new routers (if available)
if ROUTERS_AVAILABLE:
    print("🔹 Registering routers...")

    try:
        app.include_router(auth.router)
        print("✅ Auth router registered")
    except Exception as e:
        print(f"⚠️ Auth router not available: {e}")

    try:
        app.include_router(activities.router)
        print("✅ Activities router registered")
    except Exception as e:
        print(f"⚠️ Activities router not available: {e}")

    try:
        app.include_router(upload.router)
        print("✅ Upload router registered")
    except Exception as e:
        print(f"⚠️ Upload router not available: {e}")

    try:
        app.include_router(bulk.router)
        print("✅ Bulk router registered")
    except Exception as e:
        print(f"⚠️ Bulk router not available: {e}")

    try:
        app.include_router(goals.router)
        print("✅ Goals router registered")
    except Exception as e:
        print(f"⚠️ Goals router not available: {e}")

    try:
        print(f"🔍 Attempting to register recommendations router...")
        print(f"🔍 Router object: {recommendations}")
        print(f"🔍 Router.router: {recommendations.router}")
        try:
            app.include_router(recommendations.router)
            print("✅ Recommendations router registered")
        except Exception as e:
            print(f"⚠️ Recommendations router not available: {e}")
            import traceback

            traceback.print_exc()
    except Exception as e:
        print(f"❌ Recommendations router registration failed: {e}")
        print(f"❌ Error type: {type(e).__name__}")
        import traceback

        traceback.print_exc()

    try:
        if reports and hasattr(reports, 'router'):
            app.include_router(reports.router)
            print("✅ Reports router registered")
        else:
            print("⚠️ Reports router not available (module not loaded)")
    except Exception as e:
        print(f"⚠️ Reports router not available: {e}")

    try:
        app.include_router(benchmarks.router)
        print("✅ Benchmarks router registered")
    except Exception as e:
        print(f"⚠️ Benchmarks router not available: {e}")

    # Register energy, water and waste routers
    try:
        app.include_router(energy.router)
        print("✅ Energy router registered")
    except Exception as e:
        print(f"⚠️ Energy router not available: {e}")

    try:
        app.include_router(water.router)
        print("✅ Water router registered")
    except Exception as e:
        print(f"⚠️ Water router not available: {e}")

    try:
        app.include_router(waste.router)
        print("✅ Waste router registered")
    except Exception as e:
        print(f"⚠️ Waste router not available: {e}")

    # Register Scope 3 router
    try:
        app.include_router(scope3.router)
        print("✅ Scope3 router registered")
    except Exception as e:
        print(f"⚠️ Scope3 router not available: {e}")

    # Register Dashboard router
    try:
        app.include_router(dashboard.router)
        print("✅ Dashboard router registered")
    except Exception as e:
        print(f"⚠️ Dashboard router not available: {e}")

    # Register Analytics router
    try:
        app.include_router(analytics.router)
        print("✅ Analytics router registered")
    except Exception as e:
        print(f"⚠️ Analytics router not available: {e}")

    # Register CBAM router
    try:
        app.include_router(cbam.router)
        print("✅ CBAM router registered")
    except Exception as e:
        print(f"⚠️ CBAM router not available: {e}")

print("✅ App initialization complete!")


# ══════════════════════════════════════════════════════════════════
# DATABASE DEPENDENCY
# ══════════════════════════════════════════════════════════════════

# ══════════════════════════════════════════════════════════════════
# ROOT & INFO ENDPOINTS
# ══════════════════════════════════════════════════════════════════

@app.get("/")
def root():
    """API root endpoint with feature overview"""
    features_list = [
        "🔐 JWT Authentication & User Management",
        "📊 Emission Tracking (Scope 1, 2, 3)",
        "📁 AI Document Processing (PDF, Excel, CSV)",
        "📥 Bulk Import with Validation",
        "🎯 Goal Setting & Progress Tracking",
        "💡 AI-Powered Recommendations",
        "📈 Advanced Analytics & Reports",
        "🏆 Industry Benchmarking",
        "📱 Real-time Dashboard",
        "🔍 Data Quality Monitoring"
    ]

    endpoints_map = {
        "legacy_dashboard": "/api/companies/{company_id}/dashboard",
        "authentication": "/api/v1/auth",
        "activities_new": "/api/v1/activities",
        "upload": "/api/v1/upload",
        "bulk_import": "/api/v1/bulk",
        "goals": "/api/v1/goals",
        "recommendations": "/api/v1/recommendations",
        "reports": "/api/v1/reports",
        "benchmarks": "/api/v1/benchmarks",
        "companies": "/api/companies",
        "company_dashboard": "/api/companies/{id}/dashboard"
    }

    return {
        "message": "🌍 Carbon Accounting Platform API",
        "version": "3.0",
        "status": "running",
        "timestamp": datetime.utcnow().isoformat(),
        "user": "SHUB-0510",
        "features": features_list,
        "endpoints": endpoints_map,
        "documentation": {
            "swagger_ui": "/docs",
            "redoc": "/redoc",
            "openapi_json": "/openapi.json"
        },
        "health_check": "/health"
    }


@app.get("/api/info")
def api_info():
    """Get detailed API information"""
    return {
        "api_name": "Carbon Accounting Platform",
        "version": "3.0",
        "author": "SHUB-0510",
        "last_updated": "2025-10-12 20:41:44",
        "features": {
            "authentication": "JWT Bearer Token",
            "ai_processing": True,
            "bulk_operations": True,
            "goal_tracking": True,
            "recommendations": True,
            "reporting": True,
            "benchmarking": True
        },
        "supported_formats": {
            "upload": ["PDF", "Excel", "CSV", "JPEG", "PNG"],
            "export": ["JSON", "CSV", "Excel", "PDF"]
        },
        "scopes_supported": [1, 2, 3],
        "ghg_protocol_compliant": True
    }


# ══════════════════════════════════════════════════════════════════
# COMPANY ENDPOINTS (Legacy - Keep for backwards compatibility)
# ══════════════════════════════════════════════════════════════════

@app.get("/api/companies")
def get_companies(
        skip: int = 0,
        limit: int = 100,
        db: Session = Depends(get_db)
):
    """Get all companies"""
    companies = db.query(Company).filter(
        Company.is_active == True
    ).offset(skip).limit(limit).all()

    return {
        "count": len(companies),
        "companies": [
            {
                "id": c.id,
                "name": c.name,
                "industry": c.industry,
                "city": c.city,
                "state": c.state,
                "employee_count": c.employee_count
            }
            for c in companies
        ]
    }


@app.get("/api/companies/{company_id}")
def get_company(company_id: int, db: Session = Depends(get_db)):
    """Get company details"""
    company = db.query(Company).filter(Company.id == company_id).first()

    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    return {
        "id": company.id,
        "name": company.name,
        "industry": company.industry,
        "industry_code": company.industry_code,
        "country": company.country,
        "state": company.state,
        "city": company.city,
        "email": company.email,
        "website": company.website,
        "employee_count": company.employee_count,
        "fiscal_year_start": company.fiscal_year_start,
        "created_at": company.created_at.isoformat() if company.created_at else None
    }


# ══════════════════════════════════════════════════════════════════
# DASHBOARD ENDPOINT (Primary Frontend Endpoint)
# ══════════════════════════════════════════════════════════════════

@app.get("/api/companies/{company_id}/dashboard")
def get_company_dashboard(
        company_id: int,
        period: Optional[str] = None,
        db: Session = Depends(get_db)
):
    """
    📊 MAIN DASHBOARD ENDPOINT
    Returns complete emissions data for frontend visualization

    This is the primary endpoint your frontend should use!
    """
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    # Get dashboard data using helper function
    dashboard_data = get_company_emissions_dashboard(db, company_id, period)

    # Add company info
    dashboard_data['company'] = {
        'id': company.id,
        'name': company.name,
        'industry': company.industry
    }

    # Add links to new features
    dashboard_data['new_features'] = {
        "set_goals": f"/api/v1/goals",
        "get_recommendations": f"/api/v1/recommendations",
        "generate_report": f"/api/v1/reports/generate",
        "benchmark_comparison": f"/api/v1/benchmarks/compare",
        "upload_documents": f"/api/v1/upload/document"
    }

    return dashboard_data


# ══════════════════════════════════════════════════════════════════
# LIFECYCLE FLOW ENDPOINT
# Add this to app/main.py after the existing dashboard endpoints
# ══════════════════════════════════════════════════════════════════

# @app.get("/api/companies/{company_id}/lifecycle-flow")
# def get_lifecycle_flow(
#         company_id: int,
#         period: Optional[str] = None,
#         db: Session = Depends(get_db)
# ):
#     """
#     🔄 LIFECYCLE FLOW DASHBOARD
#     Categorizes emissions into 4 phases:
#     - UPSTREAM: Scope 3 categories 1-4, 8
#     - IN-PROCESS: Scope 1 & 2
#     - DOWNSTREAM: Scope 3 categories 9-15
#     - WASTE: Category 3.5 + WasteDisposal table
#     """
#     from app.models import WasteDisposal
#
#     # Import Scope 3 models
#     try:
#         from app.models_scope3 import (
#             Scope3EmissionRecord,
#             Scope3Category,
#             TransportRecord,
#             BusinessTravelRecord,
#             EmployeeCommuteRecord,
#             LeasedAssetRecord,
#             InvestmentRecord,
#             ProductUseRecord,
#             EndOfLifeRecord,
#             FranchiseRecord
#         )
#         scope3_available = True
#     except ImportError:
#         scope3_available = False
#
#     # ═══════════════════════════════════════════════════════
#     # 1. UPSTREAM EMISSIONS (Scope 3: Categories 1-4, 8)
#     # ═══════════════════════════════════════════════════════
#
#     upstream_categories = ['3.1', '3.2', '3.3', '3.4', '3.8']
#
#     # From EmissionActivity
#     upstream_activities = db.query(EmissionActivity).filter(
#         EmissionActivity.company_id == company_id,
#         EmissionActivity.scope_number == 3
#     ).all()
#
#     upstream_emissions = sum(
#         a.emissions_kgco2e for a in upstream_activities
#         if any(cat in (a.category or '') for cat in upstream_categories)
#     )
#
#     upstream_count = sum(
#         1 for a in upstream_activities
#         if any(cat in (a.category or '') for cat in upstream_categories)
#     )
#
#     # Add Scope 3 detailed records if available
#     if scope3_available:
#         # Get upstream Scope 3 records (categories 1-4, 8)
#         upstream_scope3 = db.query(Scope3EmissionRecord).join(
#             Scope3Category
#         ).filter(
#             Scope3EmissionRecord.company_id == company_id,
#             Scope3Category.code.in_(['3.1', '3.2', '3.3', '3.4', '3.8'])
#         ).all()
#
#         upstream_emissions += sum(r.total_emissions for r in upstream_scope3)
#         upstream_count += len(upstream_scope3)
#
#     # ═══════════════════════════════════════════════════════
#     # 2. IN-PROCESS EMISSIONS (Scope 1 & 2)
#     # ═══════════════════════════════════════════════════════
#
#     inprocess_activities = db.query(EmissionActivity).filter(
#         EmissionActivity.company_id == company_id,
#         EmissionActivity.scope_number.in_([1, 2])
#     ).all()
#
#     inprocess_emissions = sum(a.emissions_kgco2e for a in inprocess_activities)
#     inprocess_count = len(inprocess_activities)
#
#     # Breakdown by Scope 1 & 2
#     scope1_emissions = sum(
#         a.emissions_kgco2e for a in inprocess_activities
#         if a.scope_number == 1
#     )
#     scope2_emissions = sum(
#         a.emissions_kgco2e for a in inprocess_activities
#         if a.scope_number == 2
#     )
#
#     # ═══════════════════════════════════════════════════════
#     # 3. DOWNSTREAM EMISSIONS (Scope 3: Categories 9-15)
#     # ═══════════════════════════════════════════════════════
#
#     downstream_categories = ['3.9', '3.10', '3.11', '3.12', '3.13', '3.14', '3.15']
#
#     # From EmissionActivity
#     downstream_activities = db.query(EmissionActivity).filter(
#         EmissionActivity.company_id == company_id,
#         EmissionActivity.scope_number == 3
#     ).all()
#
#     downstream_emissions = sum(
#         a.emissions_kgco2e for a in downstream_activities
#         if any(cat in (a.category or '') for cat in downstream_categories)
#     )
#
#     downstream_count = sum(
#         1 for a in downstream_activities
#         if any(cat in (a.category or '') for cat in downstream_categories)
#     )
#
#     # Add Scope 3 detailed records if available
#     if scope3_available:
#         # Get downstream Scope 3 records (categories 9-15)
#         downstream_scope3 = db.query(Scope3EmissionRecord).join(
#             Scope3Category
#         ).filter(
#             Scope3EmissionRecord.company_id == company_id,
#             Scope3Category.code.in_(['3.9', '3.10', '3.11', '3.12', '3.13', '3.14', '3.15'])
#         ).all()
#
#         downstream_emissions += sum(r.total_emissions for r in downstream_scope3)
#         downstream_count += len(downstream_scope3)
#
#     # ═══════════════════════════════════════════════════════
#     # 4. WASTE EMISSIONS (Category 3.5 + WasteDisposal)
#     # ═══════════════════════════════════════════════════════
#
#     # From EmissionActivity (Category 3.5)
#     waste_activities = db.query(EmissionActivity).filter(
#         EmissionActivity.company_id == company_id,
#         EmissionActivity.category.like('%3.5%')
#     ).all()
#
#     waste_emissions = sum(a.emissions_kgco2e for a in waste_activities)
#     waste_count = len(waste_activities)
#
#     # Add WasteDisposal emissions
#     waste_disposals = db.query(WasteDisposal).filter(
#         WasteDisposal.company_id == company_id
#     ).all()
#
#     waste_disposal_emissions = sum(
#         w.emissions_kgco2e or 0 for w in waste_disposals
#     )
#     waste_emissions += waste_disposal_emissions
#     waste_count += len(waste_disposals)
#
#     # Total waste quantity
#     total_waste_kg = sum(w.quantity for w in waste_disposals)
#     recycled_waste_kg = sum(
#         w.quantity for w in waste_disposals
#         if w.disposal_method == 'recycling'
#     )
#     recycling_rate = (recycled_waste_kg / total_waste_kg * 100) if total_waste_kg > 0 else 0
#
#     # Add Scope 3 waste records if available
#     if scope3_available:
#         waste_scope3 = db.query(Scope3EmissionRecord).join(
#             Scope3Category
#         ).filter(
#             Scope3EmissionRecord.company_id == company_id,
#             Scope3Category.code == '3.5'
#         ).all()
#
#         waste_emissions += sum(r.total_emissions for r in waste_scope3)
#         waste_count += len(waste_scope3)
#
#     # ═══════════════════════════════════════════════════════
#     # CALCULATE TOTALS & PERCENTAGES
#     # ═══════════════════════════════════════════════════════
#
#     total_emissions = upstream_emissions + inprocess_emissions + downstream_emissions + waste_emissions
#
#     return {
#         "lifecycle_flow": {
#             "upstream": {
#                 "emissions_kg": round(upstream_emissions, 2),
#                 "emissions_tonnes": round(upstream_emissions / 1000, 3),
#                 "percentage": round((upstream_emissions / total_emissions * 100) if total_emissions > 0 else 0, 1),
#                 "activity_count": upstream_count,
#                 "categories": [
#                     "3.1 - Purchased Goods & Services",
#                     "3.2 - Capital Goods",
#                     "3.3 - Fuel & Energy Activities",
#                     "3.4 - Upstream Transportation",
#                     "3.8 - Upstream Leased Assets"
#                 ],
#                 "icon": "📦",
#                 "color": "#3b82f6"  # blue
#             },
#             "in_process": {
#                 "emissions_kg": round(inprocess_emissions, 2),
#                 "emissions_tonnes": round(inprocess_emissions / 1000, 3),
#                 "percentage": round((inprocess_emissions / total_emissions * 100) if total_emissions > 0 else 0, 1),
#                 "activity_count": inprocess_count,
#                 "breakdown": {
#                     "scope_1": round(scope1_emissions / 1000, 3),
#                     "scope_2": round(scope2_emissions / 1000, 3)
#                 },
#                 "categories": [
#                     "Scope 1 - Direct Emissions",
#                     "Scope 2 - Purchased Energy"
#                 ],
#                 "icon": "🏭",
#                 "color": "#ef4444"  # red
#             },
#             "downstream": {
#                 "emissions_kg": round(downstream_emissions, 2),
#                 "emissions_tonnes": round(downstream_emissions / 1000, 3),
#                 "percentage": round((downstream_emissions / total_emissions * 100) if total_emissions > 0 else 0, 1),
#                 "activity_count": downstream_count,
#                 "categories": [
#                     "3.9 - Downstream Transportation",
#                     "3.10 - Processing of Products",
#                     "3.11 - Use of Products",
#                     "3.12 - End-of-Life Treatment",
#                     "3.13 - Downstream Leased",
#                     "3.14 - Franchises",
#                     "3.15 - Investments"
#                 ],
#                 "icon": "🚚",
#                 "color": "#8b5cf6"  # purple
#             },
#             "waste": {
#                 "emissions_kg": round(waste_emissions, 2),
#                 "emissions_tonnes": round(waste_emissions / 1000, 3),
#                 "percentage": round((waste_emissions / total_emissions * 100) if total_emissions > 0 else 0, 1),
#                 "activity_count": waste_count,
#                 "total_waste_kg": round(total_waste_kg, 2),
#                 "recycled_waste_kg": round(recycled_waste_kg, 2),
#                 "recycling_rate": round(recycling_rate, 1),
#                 "categories": [
#                     "3.5 - Waste in Operations",
#                     "Waste Disposal & Treatment"
#                 ],
#                 "icon": "♻️",
#                 "color": "#10b981"  # green
#             },
#             "total": {
#                 "emissions_kg": round(total_emissions, 2),
#                 "emissions_tonnes": round(total_emissions / 1000, 3),
#                 "total_activities": upstream_count + inprocess_count + downstream_count + waste_count
#             }
#         },
#         "data_sources": {
#             "emission_activities": True,
#             "scope3_records": scope3_available,
#             "waste_disposal": True
#         }
#     }
# ══════════════════════════════════════════════════════════════════
# EMISSION SUMMARY ENDPOINTS
# ══════════════════════════════════════════════════════════════════

@app.get("/api/companies/{company_id}/summary")
def get_emission_summary(
        company_id: int,
        period: Optional[str] = None,
        db: Session = Depends(get_db)
):
    """
    Get emission summary with full scope breakdown
    Perfect for pie charts and summary cards
    """
    query = db.query(EmissionSummary).filter(
        EmissionSummary.company_id == company_id
    )

    if period:
        summary = query.filter(EmissionSummary.reporting_period == period).first()
    else:
        summary = query.order_by(desc(EmissionSummary.created_at)).first()

    if not summary:
        raise HTTPException(status_code=404, detail="No summary found")

    return summary.to_dict()


@app.get("/api/companies/{company_id}/scope-breakdown")
def get_scope_breakdown(
        company_id: int,
        period: Optional[str] = None,
        db: Session = Depends(get_db)
):
    """
    Get detailed scope breakdown with categories
    Returns data ready for stacked bar charts
    Always calculates from activities for real-time data
    """
    # Always calculate from activities for consistency
    activities_query = db.query(EmissionActivity).filter(
        EmissionActivity.company_id == company_id
    )

    # Apply period filter if specified
    if period:
        activities_query = activities_query.filter(
            EmissionActivity.reporting_period == period
        )

    activities = activities_query.all()

    if not activities:
        return {
            "scope_1": {"total": 0, "percentage": 0, "categories": []},
            "scope_2": {"total": 0, "percentage": 0, "categories": []},
            "scope_3": {"total": 0, "percentage": 0, "categories": []},
            "total_emissions": 0,
            "total_emissions_tonnes": 0
        }

    # Calculate totals from activities
    scope_1_total = sum(a.emissions_kgco2e for a in activities if a.scope_number == 1)
    scope_2_total = sum(a.emissions_kgco2e for a in activities if a.scope_number == 2)
    scope_3_total = sum(a.emissions_kgco2e for a in activities if a.scope_number == 3)
    total_emissions = scope_1_total + scope_2_total + scope_3_total

    # Calculate category breakdowns
    scope_1_categories = []
    scope_2_categories = []
    scope_3_categories = []

    # Group activities by category for breakdown
    from collections import defaultdict
    category_totals = defaultdict(float)

    for activity in activities:
        if activity.category:
            category_totals[activity.category] += activity.emissions_kgco2e

    # Build category lists (convert to tonnes)
    for category, total in category_totals.items():
        if category.startswith('1.'):
            scope_1_categories.append({"name": category, "value": round(total / 1000, 3)})
        elif category.startswith('2.'):
            scope_2_categories.append({"name": category, "value": round(total / 1000, 3)})
        elif category.startswith('3.'):
            scope_3_categories.append({"name": category, "value": round(total / 1000, 3)})

    return {
        "scope_1": {
            "total": round(scope_1_total / 1000, 3),
            "percentage": round((scope_1_total / total_emissions * 100) if total_emissions > 0 else 0, 2),
            "categories": scope_1_categories
        },
        "scope_2": {
            "total": round(scope_2_total / 1000, 3),
            "percentage": round((scope_2_total / total_emissions * 100) if total_emissions > 0 else 0, 2),
            "categories": scope_2_categories
        },
        "scope_3": {
            "total": round(scope_3_total / 1000, 3),
            "percentage": round((scope_3_total / total_emissions * 100) if total_emissions > 0 else 0, 2),
            "categories": scope_3_categories
        },
        "total_emissions": round(total_emissions, 2),
        "total_emissions_tonnes": round(total_emissions / 1000, 3)
    }


# ══════════════════════════════════════════════════════════════════
# EMISSION ACTIVITIES ENDPOINTS
# ══════════════════════════════════════════════════════════════════

@app.get("/api/companies/{company_id}/activities")
def get_emission_activities(
        company_id: int,
        scope: Optional[str] = None,  # Changed to str to handle comma-separated or array
        category: Optional[str] = None,  # Changed to str to handle comma-separated or array
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
        db: Session = Depends(get_db)
):
    """
    Get emission activities with filtering
    Supports filtering by multiple scopes, categories, date range
    """
    query = db.query(EmissionActivity).filter(
        EmissionActivity.company_id == company_id
    )

    # Apply filters - handle multiple values
    if scope:
        scope_list = [int(s.strip()) for s in scope.split(',') if s.strip()]
        if scope_list:
            query = query.filter(EmissionActivity.scope_number.in_(scope_list))

    if category:
        category_list = [c.strip() for c in category.split(',') if c.strip()]
        if category_list:
            query = query.filter(EmissionActivity.category.in_(category_list))

    if start_date:
        query = query.filter(EmissionActivity.activity_date >= datetime.fromisoformat(start_date))

    if end_date:
        query = query.filter(EmissionActivity.activity_date <= datetime.fromisoformat(end_date))

    # Get total count
    total = query.count()

    # Get paginated results
    activities = query.order_by(
        desc(EmissionActivity.activity_date)
    ).offset(skip).limit(limit).all()

    return {
        "total": total,
        "count": len(activities),
        "activities": [a.to_dict() for a in activities]
    }


@app.get("/api/companies/{company_id}/activities/by-scope")
def get_activities_by_scope(
        company_id: int,
        db: Session = Depends(get_db)
):
    """
    Get activities grouped by scope
    Perfect for scope-wise tables in frontend
    """
    activities = db.query(EmissionActivity).filter(
        EmissionActivity.company_id == company_id
    ).order_by(
        EmissionActivity.scope_number,
        desc(EmissionActivity.emissions_kgco2e)
    ).all()

    # Group by scope
    scope_1 = [a.to_dict() for a in activities if a.scope_number == 1]
    scope_2 = [a.to_dict() for a in activities if a.scope_number == 2]
    scope_3 = [a.to_dict() for a in activities if a.scope_number == 3]

    return {
        "scope_1": {
            "count": len(scope_1),
            "total_emissions": sum(a['emissions_kgco2e'] for a in scope_1),
            "activities": scope_1
        },
        "scope_2": {
            "count": len(scope_2),
            "total_emissions": sum(a['emissions_kgco2e'] for a in scope_2),
            "activities": scope_2
        },
        "scope_3": {
            "count": len(scope_3),
            "total_emissions": sum(a['emissions_kgco2e'] for a in scope_3),
            "activities": scope_3
        }
    }


@app.get("/api/companies/{company_id}/activities/by-category")
def get_activities_by_category(
        company_id: int,
        scope: Optional[int] = None,
        db: Session = Depends(get_db)
):
    """
    Get activities grouped by category
    Perfect for category breakdown charts
    """
    query = db.query(
        EmissionActivity.category,
        EmissionActivity.scope,
        func.count(EmissionActivity.id).label('count'),
        func.sum(EmissionActivity.emissions_kgco2e).label('total_emissions')
    ).filter(
        EmissionActivity.company_id == company_id
    )

    if scope:
        query = query.filter(EmissionActivity.scope_number == scope)

    results = query.group_by(
        EmissionActivity.category,
        EmissionActivity.scope
    ).order_by(
        desc('total_emissions')
    ).all()

    return {
        "categories": [
            {
                "category": r.category,
                "scope": r.scope,
                "count": r.count,
                "total_emissions": r.total_emissions,
                "total_tonnes": r.total_emissions / 1000
            }
            for r in results
        ]
    }


@app.get("/api/companies/{company_id}/top-emitters")
def get_top_emitters(
        company_id: int,
        limit: int = 10,
        scope: Optional[int] = None,
        db: Session = Depends(get_db)
):
    """
    Get top emission sources grouped by activity type
    Perfect for "Biggest Contributors" widget
    """
    query = db.query(
        EmissionActivity.activity_type,
        EmissionActivity.scope,
        EmissionActivity.category,
        func.count(EmissionActivity.id).label('count'),
        func.sum(EmissionActivity.emissions_kgco2e).label('total_emissions')
    ).filter(
        EmissionActivity.company_id == company_id
    )

    if scope:
        query = query.filter(EmissionActivity.scope_number == scope)

    results = query.group_by(
        EmissionActivity.activity_type,
        EmissionActivity.scope,
        EmissionActivity.category
    ).order_by(
        desc('total_emissions')
    ).limit(limit).all()

    return {
        "top_emitters": [
            {
                "activity_type": r.activity_type,
                "scope": r.scope,
                "category": r.category,
                "count": r.count,
                "emissions_kgco2e": r.total_emissions,
                "emissions_tonnes": r.total_emissions / 1000
            }
            for r in results
        ]
    }


# ══════════════════════════════════════════════════════════════════
# TIMELINE & TRENDS ENDPOINTS
# ══════════════════════════════════════════════════════════════════

@app.get("/api/companies/{company_id}/timeline")
def get_emissions_timeline(
        company_id: int,
        group_by: str = "month",  # month, quarter, year
        db: Session = Depends(get_db)
):
    """
    Get emissions over time
    Perfect for line/area charts showing trends
    """
    # Query activities with date grouping
    if group_by == "day":
        date_group = func.strftime('%Y-%m-%d', EmissionActivity.activity_date)
    elif group_by == "month":
        date_group = func.strftime('%Y-%m', EmissionActivity.activity_date)
    elif group_by == "quarter":
        date_group = func.strftime('%Y-Q', EmissionActivity.activity_date)
    else:
        date_group = func.strftime('%Y', EmissionActivity.activity_date)

    results = db.query(
        date_group.label('period'),
        EmissionActivity.scope_number,
        func.sum(EmissionActivity.emissions_kgco2e).label('total')
    ).filter(
        EmissionActivity.company_id == company_id,
        EmissionActivity.activity_date.isnot(None)
    ).group_by(
        'period',
        EmissionActivity.scope_number
    ).order_by('period').all()

    # Organize by period
    timeline = {}
    for period, scope, total in results:
        if period not in timeline:
            timeline[period] = {
                "period": period,
                "scope_1": 0,
                "scope_2": 0,
                "scope_3": 0,
                "total": 0
            }

        # Convert to tonnes for frontend display
        timeline[period][f"scope_{scope}"] = round(total / 1000, 3)
        timeline[period]["total"] += round(total / 1000, 3)

    # Round totals
    for period_data in timeline.values():
        period_data["total"] = round(period_data["total"], 3)

    return {
        "timeline": list(timeline.values())
    }


# ══════════════════════════════════════════════════════════════════
# DATA QUALITY ENDPOINTS
# ══════════════════════════════════════════════════════════════════

@app.get("/api/companies/{company_id}/data-quality")
def get_data_quality_report(
        company_id: int,
        db: Session = Depends(get_db)
):
    """
    Get data quality metrics
    Shows confidence levels and calculation methods
    """
    # Count by data quality
    quality_counts = db.query(
        EmissionActivity.data_quality,
        func.count(EmissionActivity.id).label('count'),
        func.sum(EmissionActivity.emissions_kgco2e).label('total')
    ).filter(
        EmissionActivity.company_id == company_id
    ).group_by(
        EmissionActivity.data_quality
    ).all()

    # Count by calculation method
    method_counts = db.query(
        EmissionActivity.calculation_method,
        func.count(EmissionActivity.id).label('count')
    ).filter(
        EmissionActivity.company_id == company_id
    ).group_by(
        EmissionActivity.calculation_method
    ).all()

    # Average confidence by scope
    confidence_by_scope = db.query(
        EmissionActivity.scope_number,
        func.avg(EmissionActivity.confidence).label('avg_confidence')
    ).filter(
        EmissionActivity.company_id == company_id,
        EmissionActivity.confidence.isnot(None)
    ).group_by(
        EmissionActivity.scope_number
    ).all()

    return {
        "quality_distribution": [
            {
                "quality": q,
                "count": c,
                "total_emissions": t
            }
            for q, c, t in quality_counts
        ],
        "calculation_methods": [
            {
                "method": m,
                "count": c
            }
            for m, c in method_counts
        ],
        "confidence_by_scope": [
            {
                "scope": s,
                "average_confidence": round(c, 2)
            }
            for s, c in confidence_by_scope
        ]
    }


# ══════════════════════════════════════════════════════════════════
# STATISTICS & INSIGHTS
# ══════════════════════════════════════════════════════════════════

@app.get("/api/companies/{company_id}/statistics")
def get_company_statistics(
        company_id: int,
        db: Session = Depends(get_db)
):
    """
    Get key statistics for KPI cards
    """
    # Total emissions
    total = db.query(
        func.sum(EmissionActivity.emissions_kgco2e)
    ).filter(
        EmissionActivity.company_id == company_id
    ).scalar() or 0

    # Activity counts
    total_activities = db.query(
        func.count(EmissionActivity.id)
    ).filter(
        EmissionActivity.company_id == company_id
    ).scalar() or 0

    # Scope breakdown
    scope_totals = db.query(
        EmissionActivity.scope_number,
        func.sum(EmissionActivity.emissions_kgco2e).label('total')
    ).filter(
        EmissionActivity.company_id == company_id
    ).group_by(
        EmissionActivity.scope_number
    ).all()

    scope_dict = {s: t for s, t in scope_totals}

    # Most recent activity
    latest_activity = db.query(EmissionActivity).filter(
        EmissionActivity.company_id == company_id
    ).order_by(
        desc(EmissionActivity.created_at)
    ).first()

    return {
        "total_emissions_kg": total,
        "total_emissions_tonnes": total / 1000,
        "total_activities": total_activities,
        "scope_1_total": scope_dict.get(1, 0),
        "scope_2_total": scope_dict.get(2, 0),
        "scope_3_total": scope_dict.get(3, 0),
        "latest_activity_date": latest_activity.activity_date.isoformat() if latest_activity and latest_activity.activity_date else None,
        "last_updated": latest_activity.created_at.isoformat() if latest_activity else None
    }


# ══════════════════════════════════════════════════════════════════
# HEALTH CHECK
# ══════════════════════════════════════════════════════════════════

@app.get("/health")
def health_check():
    """Health check endpoint with database connectivity check"""
    try:
        # Test database connection - simplified version
        from app.database import SessionLocal
        from app.models import Company
        db = SessionLocal()
        db.query(Company).first()
        db.close()
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"

    return {
        "status": "healthy",
        "service": "carbon-accounting-api",
        "version": "3.0",
        "timestamp": datetime.utcnow().isoformat(),
        "database": db_status,
        "routers_loaded": ROUTERS_AVAILABLE
    }


# ══════════════════════════════════════════════════════════════════
# STARTUP MESSAGE
# ══════════════════════════════════════════════════════════════════

@app.on_event("startup")
async def startup_event():
    """Initialize database and seed data on startup"""
    try:
        # Seed CBAM goods if not already seeded
        seed_cbam_goods()
    except Exception as e:
        print(f"⚠️ Error seeding CBAM goods: {e}")
    
    print("=" * 70)
    print("🚀 CARBON ACCOUNTING PLATFORM API v3.0")
    print("=" * 70)
    print(f"✅ Server started at: {datetime.utcnow().isoformat()}")
    print(f"👤 User: SHUB-0510")
    print(f"📊 Routers loaded: {ROUTERS_AVAILABLE}")
    print("=" * 70)
    print("📚 API Documentation:")
    print("   - Swagger UI: http://localhost:8000/docs")
    print("   - ReDoc: http://localhost:8000/redoc")
    print("=" * 70)
    print("🎯 Key Endpoints:")
    print("   - Health Check: /health")
    print("   - API Info: /api/info")
    print("   - Companies: /api/companies")
    print("   - Dashboard: /api/companies/{id}/dashboard")
    if ROUTERS_AVAILABLE:
        print("   - Auth: /api/v1/auth")
        print("   - Goals: /api/v1/goals")
        print("   - Reports: /api/v1/reports")
        print("   - Recommendations: /api/v1/recommendations")
    print("=" * 70)


# ══════════════════════════════════════════════════════════════════
# PYDANTIC MODELS FOR REQUESTS
# ══════════════════════════════════════════════════════════════════

from pydantic import BaseModel


class ActivityCreate(BaseModel):
    activity_type: str
    quantity: float
    unit: str
    activity_date: str
    description: Optional[str] = None
    location: Optional[str] = None


class CalculateRequest(BaseModel):
    activity_type: str
    quantity: float
    unit: str
    region: Optional[str] = "India"


# ══════════════════════════════════════════════════════════════════
# EMISSION CALCULATOR ENDPOINT
# ══════════════════════════════════════════════════════════════════

@app.post("/api/emissions/calculate")
def calculate_emissions(request: CalculateRequest):
    """Calculate emissions for given activity"""

    # Emission factors based on your existing data
    emission_factors = {
        'diesel': {'factor': 2.68, 'unit': 'litre', 'scope': 1, 'category': 'Stationary Combustion'},
        'petrol': {'factor': 2.31, 'unit': 'litre', 'scope': 1, 'category': 'Mobile Combustion'},
        'natural_gas': {'factor': 2.03, 'unit': 'm3', 'scope': 1, 'category': 'Stationary Combustion'},
        'electricity': {'factor': 0.82, 'unit': 'kwh', 'scope': 2, 'category': 'Purchased Electricity'},
        'lpg': {'factor': 3.00, 'unit': 'kg', 'scope': 1, 'category': 'Stationary Combustion'},
        'coal': {'factor': 2.42, 'unit': 'kg', 'scope': 1, 'category': 'Stationary Combustion'},
        'air_travel': {'factor': 0.158, 'unit': 'km', 'scope': 3, 'category': 'Business Travel'},
        'road_travel': {'factor': 0.192, 'unit': 'km', 'scope': 3, 'category': 'Business Travel'},
        'rail_travel': {'factor': 0.041, 'unit': 'km', 'scope': 3, 'category': 'Business Travel'},
        'refrigerant_r410a': {'factor': 2088.0, 'unit': 'kg', 'scope': 1, 'category': 'Fugitive Emissions'},
    }

    activity_lower = request.activity_type.lower()

    if activity_lower not in emission_factors:
        raise HTTPException(
            status_code=404,
            detail=f"Emission factor not found for: {request.activity_type}"
        )

    ef = emission_factors[activity_lower]
    emissions = request.quantity * ef['factor']

    return {
        "success": True,
        "emissions_kg_co2e": round(emissions, 2),
        "emission_factor": ef['factor'],
        "unit": ef['unit'],
        "scope": ef['scope'],
        "confidence": 0.90,
        "category": ef['category']
    }


# ══════════════════════════════════════════════════════════════════
# CREATE ACTIVITY ENDPOINT
# ══════════════════════════════════════════════════════════════════

@app.post("/api/companies/{company_id}/activities")
def create_activity(
        company_id: int,
        activity: ActivityCreate,
        db: Session = Depends(get_db)
):
    """Create new emission activity"""
    try:
        # Parse date
        activity_date = datetime.fromisoformat(activity.activity_date)

        # Calculate emissions using the calculator
        calc_request = CalculateRequest(
            activity_type=activity.activity_type,
            quantity=activity.quantity,
            unit=activity.unit
        )
        calc_result = calculate_emissions(calc_request)

        # Determine scope
        scope_map = {1: "Scope 1", 2: "Scope 2", 3: "Scope 3"}
        scope_number = calc_result['scope']
        scope = scope_map.get(scope_number, "Scope 1")

        # Create activity name
        activity_name = activity.description or f"{activity.activity_type} - {activity.quantity} {activity.unit}"

        # Create new activity
        new_activity = EmissionActivity(
            company_id=company_id,
            activity_type=activity.activity_type,
            activity_name=activity_name,
            quantity=activity.quantity,
            unit=activity.unit,
            activity_date=activity_date,
            description=activity.description,
            location=activity.location,
            emissions_kgco2e=calc_result['emissions_kg_co2e'],
            emission_factor=calc_result['emission_factor'],
            scope=scope,
            scope_number=scope_number,
            category=calc_result['category'],
            subcategory=calc_result['category'],
            confidence=calc_result['confidence'],
            data_quality="High",
            calculation_method="direct_calculation"
        )

        db.add(new_activity)
        db.commit()
        db.refresh(new_activity)

        return {
            "success": True,
            "message": "Activity created successfully",
            "activity": new_activity.to_dict()
        }
    except Exception as e:
        db.rollback()
        print(f"Error creating activity: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


# ══════════════════════════════════════════════════════════════════
# DELETE ACTIVITY ENDPOINT
# ══════════════════════════════════════════════════════════════════

@app.delete("/api/companies/{company_id}/activities/{activity_id}")
def delete_activity(
        company_id: int,
        activity_id: int,
        db: Session = Depends(get_db)
):
    """Delete an activity"""
    activity = db.query(EmissionActivity).filter(
        EmissionActivity.id == activity_id,
        EmissionActivity.company_id == company_id
    ).first()

    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")

    db.delete(activity)
    db.commit()

    return {
        "success": True,
        "message": "Activity deleted successfully"
    }


if __name__ == "__main__":
    import uvicorn

    print("\n🚀 Starting server...")
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )