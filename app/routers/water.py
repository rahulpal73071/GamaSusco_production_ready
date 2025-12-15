"""
Water Usage API Router
======================

This router provides secured endpoints for managing water usage records
for a company.  Users belonging to a company can create new water
usage entries and retrieve existing records.  Indirect emissions
associated with water consumption can be calculated on the fly if an
emission factor is supplied in the request.

Endpoints:
    POST /api/companies/{company_id}/water
        Create a new water usage record
    GET /api/companies/{company_id}/water
        List water usage records for the company
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, validator
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Company, User, WaterUsage
from app.routers.auth import get_current_user
from app.calculators.water import water_emissions

router = APIRouter(prefix="/api/companies/{company_id}/water", tags=["Water Usage"])


# ────────────────────────────────────────────────────────────────────────────
# Helpers
# ────────────────────────────────────────────────────────────────────────────

def verify_company_access(company_id: int, current_user: User, db: Session) -> Company:
    """Ensure the current user belongs to the specified company."""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")
    if current_user.company_id != company_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return company


# ────────────────────────────────────────────────────────────────────────────
# Request/Response Models
# ────────────────────────────────────────────────────────────────────────────

class WaterCreateRequest(BaseModel):
    source: str = Field(..., description="Source of water (municipal, groundwater, surface, rainwater)")
    withdrawal_volume: float = Field(..., gt=0, description="Volume withdrawn (in m³)")
    unit: str = Field("m3", description="Unit of measurement (default m3)")
    consumption_volume: Optional[float] = Field(None, ge=0, description="Volume consumed (in m³)")
    discharge_volume: Optional[float] = Field(None, ge=0, description="Volume discharged (in m³)")
    recycled_volume: Optional[float] = Field(None, ge=0, description="Volume recycled (in m³)")
    emission_factor: Optional[float] = Field(None, description="Emission factor (kg CO2e per m³)")
    discharge_quality: Optional[str] = Field(None, description="Quality of discharged water (e.g. BOD/COD levels)")
    water_stress_index: Optional[float] = Field(None, ge=0, description="Local water stress index")
    date: Optional[str] = Field(None, description="Date of usage (YYYY-MM-DD)")
    additional_data: Optional[dict] = Field(None, description="Additional metadata")

    @validator('date')
    def validate_date(cls, v):  # noqa: N805
        if v is not None:
            try:
                datetime.fromisoformat(v)
            except ValueError:
                raise ValueError('date must be in YYYY-MM-DD format')
        return v


class WaterResponse(BaseModel):
    success: bool
    water: dict
    message: str


class WaterListResponse(BaseModel):
    success: bool
    waters: List[dict]


# ────────────────────────────────────────────────────────────────────────────
# Endpoints
# ────────────────────────────────────────────────────────────────────────────

@router.post("", response_model=WaterResponse)
async def create_water(
    company_id: int,
    request: WaterCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new water usage record."""
    verify_company_access(company_id, current_user, db)

    # Compute emissions if emission_factor provided. Use consumption volume if available; otherwise withdrawal volume.
    emissions = None
    if request.emission_factor is not None:
        # Determine the volume for emissions: if consumption provided, use it; else withdrawal_volume
        volume_for_emission = request.consumption_volume if request.consumption_volume is not None else request.withdrawal_volume
        emissions = water_emissions(volume_for_emission, request.emission_factor)

    water_record = WaterUsage(
        company_id=company_id,
        user_id=current_user.id,
        source=request.source,
        withdrawal_volume=request.withdrawal_volume,
        consumption_volume=request.consumption_volume,
        discharge_volume=request.discharge_volume,
        recycled_volume=request.recycled_volume,
        unit=request.unit,
        discharge_quality=request.discharge_quality,
        water_stress_index=request.water_stress_index,
        emissions_kgco2e=emissions,
        additional_data=request.additional_data
    )

    db.add(water_record)
    db.commit()
    db.refresh(water_record)

    return WaterResponse(success=True, water=water_record.to_dict(), message="Water usage recorded")


@router.get("", response_model=WaterListResponse)
async def list_water(
    company_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all water usage records for a company."""
    verify_company_access(company_id, current_user, db)
    records = db.query(WaterUsage).filter(WaterUsage.company_id == company_id).all()
    return WaterListResponse(success=True, waters=[r.to_dict() for r in records])