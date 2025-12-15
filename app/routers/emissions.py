"""
Emission Calculation API Routes
================================
Integrated with Unified Emission Engine v3.0
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict
from datetime import datetime

from app.calculators.unified_emission_engine import get_engine

router = APIRouter(
    prefix="/api/emissions",
    tags=["Emissions Calculation"]
)


# ================================================================
# REQUEST/RESPONSE MODELS
# ================================================================

class EmissionCalculationRequest(BaseModel):
    """Request model for emission calculation"""
    activity_type: str = Field(..., description="Activity name (e.g., 'diesel', 'steel', 'electricity')")
    quantity: float = Field(..., gt=0, description="Amount/quantity")
    unit: str = Field(..., description="Unit of measurement (e.g., 'litre', 'kg', 'kwh')")
    region: str = Field(default="India", description="Geographic region")
    description: Optional[str] = Field(None, description="Additional context")
    context: Optional[str] = Field(None, description="Hint: 'production', 'combustion', 'transport'")
    company_id: Optional[int] = Field(None, description="Company ID for custom factors")

    @validator('activity_type')
    def validate_activity(cls, v):
        if not v or v.strip() == "":
            raise ValueError("Activity type cannot be empty")
        return v.strip().lower()

    @validator('unit')
    def validate_unit(cls, v):
        if not v or v.strip() == "":
            raise ValueError("Unit cannot be empty")
        return v.strip().lower()

    class Config:
        schema_extra = {
            "example": {
                "activity_type": "diesel",
                "quantity": 100,
                "unit": "litre",
                "region": "India",
                "description": "Diesel fuel for generator"
            }
        }


class EmissionCalculationResponse(BaseModel):
    """Response model for emission calculation"""
    success: bool
    emissions_kg_co2e: Optional[float] = None
    emission_factor: Optional[float] = None
    emission_factor_unit: Optional[str] = None
    calculation_method: Optional[str] = None
    layer: Optional[int] = None
    confidence: float
    data_quality: Optional[str] = None
    source: Optional[str] = None
    scope: Optional[int] = None
    category: Optional[str] = None
    intent_detected: Optional[str] = None
    match_details: Optional[Dict] = None
    alternatives: Optional[List[Dict]] = None
    validation_warnings: Optional[List[str]] = None
    error: Optional[str] = None
    suggestion: Optional[str] = None
    timestamp: str

    class Config:
        schema_extra = {
            "example": {
                "success": True,
                "emissions_kg_co2e": 268.0,
                "emission_factor": 2.68,
                "emission_factor_unit": "kg CO2e/litre",
                "calculation_method": "defra_fuzzy",
                "layer": 1,
                "confidence": 0.95,
                "data_quality": "High",
                "source": "DEFRA 2024",
                "scope": 1,
                "category": "stationary_combustion",
                "timestamp": "2025-01-11T20:53:50"
            }
        }


class BatchEmissionRequest(BaseModel):
    """Request model for batch emission calculations"""
    items: List[EmissionCalculationRequest] = Field(..., max_items=100)

    class Config:
        schema_extra = {
            "example": {
                "items": [
                    {"activity_type": "diesel", "quantity": 100, "unit": "litre", "region": "India"},
                    {"activity_type": "electricity", "quantity": 5000, "unit": "kwh", "region": "India"}
                ]
            }
        }


class EngineStatsResponse(BaseModel):
    """Response model for engine statistics"""
    ipcc_factors: int
    defra_factors: int
    india_factors: int
    total_factors: int
    databases_loaded: List[str]
    ai_enabled: bool
    search_stats: Dict


# ================================================================
# API ENDPOINTS
# ================================================================

@router.post("/calculate", response_model=EmissionCalculationResponse)
async def calculate_emissions(request: EmissionCalculationRequest):
    """
    Calculate emissions for a single activity

    **Supported Activities:**
    - Fuels: diesel, petrol, natural gas, coal, LPG
    - Energy: electricity, power
    - Transport: flight, train, taxi, bus
    - Materials: steel, cement, concrete, aluminum, plastic

    **Search Strategy:**
    1. India-specific database (if available)
    2. IPCC International (18,475 factors)
    3. DEFRA UK (537 factors)
    4. AI Estimation (GPT-4 powered)

    **Returns:**
    - Emissions in kg CO2e
    - Emission factor with source
    - Confidence score (0-100%)
    - Data quality rating
    - GHG Protocol scope classification
    """

    try:
        engine = get_engine()

        result = engine.calculate_emissions(
            activity_type=request.activity_type,
            quantity=request.quantity,
            unit=request.unit,
            region=request.region,
            description=request.description or "",
            context=request.context or "",
            company_id=request.company_id
        )

        return EmissionCalculationResponse(
            success=result.success,
            emissions_kg_co2e=result.co2e_kg,
            emission_factor=result.emission_factor,
            emission_factor_unit=result.emission_factor_unit,
            calculation_method=result.calculation_method,
            layer=result.layer,
            confidence=result.confidence,
            data_quality=result.data_quality,
            source=result.source,
            scope=result.scope,
            category=result.category,
            intent_detected=result.intent_detected,
            match_details=result.match_details,
            alternatives=result.alternatives,
            validation_warnings=result.validation_warnings,
            error=result.error,
            suggestion=result.suggestion,
            timestamp=result.timestamp
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Calculation error: {str(e)}")


@router.post("/calculate/batch")
async def calculate_emissions_batch(request: BatchEmissionRequest):
    """
    Calculate emissions for multiple activities in batch

    **Limits:**
    - Maximum 100 items per batch

    **Returns:**
    - Array of emission calculation results
    - Summary statistics
    """

    try:
        engine = get_engine()
        results = []

        total_emissions = 0.0
        successful = 0
        ai_estimated = 0

        for item in request.items:
            result = engine.calculate_emissions(
                activity_type=item.activity_type,
                quantity=item.quantity,
                unit=item.unit,
                region=item.region,
                description=item.description or "",
                context=item.context or ""
            )

            results.append(result.to_dict())

            if result.success:
                successful += 1
                total_emissions += result.co2e_kg or 0
                if result.calculation_method == 'ai_estimation':
                    ai_estimated += 1

        return {
            "success": True,
            "total_items": len(request.items),
            "successful": successful,
            "failed": len(request.items) - successful,
            "total_emissions_kg_co2e": round(total_emissions, 2),
            "ai_estimated_count": ai_estimated,
            "results": results
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch calculation error: {str(e)}")


@router.get("/stats", response_model=EngineStatsResponse)
async def get_engine_statistics():
    """
    Get emission engine statistics

    **Returns:**
    - Total emission factors available
    - Databases loaded (India, IPCC, DEFRA, AI)
    - Search performance stats
    - AI availability status
    """

    try:
        engine = get_engine()
        stats = engine.get_statistics()

        return EngineStatsResponse(**stats)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Stats error: {str(e)}")


@router.get("/search")
async def search_emission_factors(
        query: str = Query(..., min_length=2, description="Search query"),
        unit: Optional[str] = Query(None, description="Filter by unit"),
        limit: int = Query(10, ge=1, le=50, description="Max results")
):
    """
    Search available emission factors

    **Use Case:**
    - Autocomplete for activity types
    - Browse available factors
    - Find similar activities

    **Returns:**
    - List of matching emission factors
    - Source, unit, and quality information
    """

    try:
        engine = get_engine()

        query_lower = query.lower()
        results = []

        # Search DEFRA
        if not engine.defra_df.empty:
            matches = engine.defra_df[
                engine.defra_df['activity_name'].str.contains(query_lower, case=False, na=False)
            ]

            if unit:
                matches = matches[
                    matches['unit'].str.contains(unit, case=False, na=False)
                ]

            for idx, row in matches.head(limit).iterrows():
                results.append({
                    'activity': row['activity_name'],
                    'emission_factor': float(row['emission_factor']),
                    'unit': row['unit'],
                    'source': f"DEFRA {row['year']}",
                    'region': row['region'],
                    'data_quality': row['data_quality']
                })

        # Search IPCC
        if not engine.ipcc_df.empty and len(results) < limit:
            matches = engine.ipcc_df[
                engine.ipcc_df['activity_type'].str.contains(query_lower, case=False, na=False)
            ]

            if unit:
                matches = matches[
                    matches['unit'].str.contains(unit, case=False, na=False)
                ]

            for idx, row in matches.head(limit - len(results)).iterrows():
                results.append({
                    'activity': row['activity_type'],
                    'emission_factor': float(row['emission_factor']),
                    'unit': row['unit'],
                    'source': 'IPCC EFDB',
                    'region': row['region'],
                    'data_quality': row['data_quality']
                })

        return {
            "success": True,
            "query": query,
            "count": len(results),
            "results": results
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search error: {str(e)}")


@router.get("/activities")
async def list_common_activities():
    """
    Get list of commonly used activities

    **Returns:**
    - Categorized list of activities
    - Supported units for each
    """

    return {
        "success": True,
        "categories": {
            "fuels": {
                "activities": ["diesel", "petrol", "natural gas", "LPG", "coal"],
                "units": ["litre", "kg", "m3", "tonne"]
            },
            "energy": {
                "activities": ["electricity", "heating", "cooling"],
                "units": ["kwh", "mwh", "gj"]
            },
            "transport": {
                "activities": ["flight", "train", "taxi", "bus", "car"],
                "units": ["km", "passenger-km"]
            },
            "materials": {
                "activities": ["steel", "cement", "concrete", "aluminum", "plastic", "paper"],
                "units": ["kg", "tonne"]
            }
        }
    }