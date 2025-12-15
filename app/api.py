# api.py
"""
FastAPI Application for Carbon Accounting Platform
==================================================
Main API entry point with all routers
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os

# Import existing routers
from app.routers import emissions

# Import NEW routers (Features 1-5)
from app.routers import activities, upload, bulk, recommendations, goals

# Create FastAPI app
app = FastAPI(
    title="🌱 Carbon Accounting Platform API",
    description="""
    **AI-Powered Carbon Accounting with 19,000+ Emission Factors**

    ## ✨ Features

    ### 📊 Emission Calculation
    - Real-time emission calculations
    - 19,012 emission factors (IPCC + DEFRA)
    - AI-powered estimation for missing data
    - Multi-layer smart matching (5 layers)

    ### 📝 Activity Management
    - Add single activities manually
    - Bulk import from Excel/CSV
    - Update and delete activities
    - Filter by scope, category, date

    ### 📄 Document Processing
    - Upload ANY document type
    - Auto-detect document type (AI)
    - Extract data automatically
    - Support for 15+ document types

    ### 🤖 AI Recommendations
    - Powered by OpenAI GPT-4
    - Analyzes historical patterns
    - Prioritized action plans
    - ROI-focused insights

    ### 🎯 Goal Tracking
    - Set emission reduction goals
    - Track progress automatically
    - Year-by-year roadmap
    - Future projections

    ## 🚀 Quick Start

    1. **Create an activity:** `POST /api/companies/{id}/activities`
    2. **Upload a document:** `POST /api/companies/{id}/upload-document`
    3. **Get recommendations:** `GET /api/companies/{id}/recommendations`
    4. **Set a goal:** `POST /api/companies/{id}/goals`
    """,
    version="3.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers
app.include_router(emissions.router)  # Existing
app.include_router(activities.router)  # NEW - Feature 1
app.include_router(upload.router)  # NEW - Feature 2
app.include_router(bulk.router)  # NEW - Feature 3
app.include_router(recommendations.router)  # NEW - Feature 4
app.include_router(goals.router)  # NEW - Feature 5


# Root endpoint
@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "message": "🌱 Carbon Accounting Platform API",
        "version": "3.0.0",
        "status": "operational",
        "features": {
            "core": [
                "✅ 19,012 emission factors (IPCC + DEFRA)",
                "✅ AI-powered estimation for missing data",
                "✅ Multi-layer smart matching (5 layers)",
                "✅ GHG Protocol Scope 1/2/3 classification"
            ],
            "new": [
                "✅ Manual activity creation",
                "✅ File upload & auto-processing",
                "✅ Bulk Excel/CSV import",
                "✅ AI recommendations (GPT-4)",
                "✅ Goal tracking & progress"
            ],
            "coming_soon": [
                "⏳ Industry benchmarking",
                "⏳ Report exports (BRSR/CDP)",
                "⏳ User authentication"
            ]
        },
        "endpoints": {
            "docs": "/docs",
            "health": "/health",
            "calculate": "/api/emissions/calculate",
            "activities": "/api/companies/{id}/activities",
            "upload": "/api/companies/{id}/upload-document",
            "bulk_import": "/api/companies/{id}/bulk-import",
            "recommendations": "/api/companies/{id}/recommendations",
            "goals": "/api/companies/{id}/goals"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    from app.calculators.unified_emission_engine import get_engine

    try:
        engine = get_engine()
        stats = engine.get_statistics()

        return {
            "status": "healthy",
            "database": {
                "total_factors": stats['total_factors'],
                "databases_loaded": stats['databases_loaded'],
                "ai_enabled": stats.get('ai_enabled', False)
            },
            "openai_configured": bool(os.getenv('OPENAI_API_KEY')),
            "features_status": {
                "emission_calculation": "✅ operational",
                "activity_management": "✅ operational",
                "file_upload": "✅ operational",
                "bulk_import": "✅ operational",
                "ai_recommendations": "✅ operational" if os.getenv('OPENAI_API_KEY') else "⚠️ API key required",
                "goal_tracking": "✅ operational"
            }
        }
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "error": str(e)
            }
        )


# Error handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={
            "error": "Endpoint not found",
            "message": f"The endpoint {request.url.path} does not exist",
            "docs": "/docs"
        }
    )


@app.exception_handler(500)
async def internal_error_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": str(exc)
        }
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)