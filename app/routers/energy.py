"""
Energy Consumption API Router
============================

This router provides secured endpoints for managing energy consumption records
for a company.  Users belonging to a company can create new energy
consumption entries and retrieve existing records.  Emissions can be
calculated on the fly if an emission factor is supplied in the request.

Endpoints:
    POST /api/companies/{company_id}/energy
        Create a new energy consumption record
    GET /api/companies/{company_id}/energy
        List energy consumption records for the company
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, validator
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Company, User, EnergyConsumption
from app.routers.auth import get_current_user
from app.calculators.energy import energy_emissions

router = APIRouter(prefix="/api/companies/{company_id}/energy", tags=["Energy Consumption"])


# ────────────────────────────────────────────────────────────────────────────
# Helpers
# ────────────────────────────────────────────────────────────────────────────

def verify_company_access(company_id: int, current_user: User, db: Session) -> Company:
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")
    if current_user.company_id != company_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return company


# ────────────────────────────────────────────────────────────────────────────
# Request/Response Models
# ────────────────────────────────────────────────────────────────────────────

class EnergyCreateRequest(BaseModel):
    energy_type: str = Field(..., description="Type of energy (electricity, diesel, gas, etc.)")
    quantity: float = Field(..., gt=0, description="Quantity consumed")
    unit: str = Field(..., description="Unit of consumption (kWh, MJ, GJ, litre)")
    date: Optional[str] = Field(None, description="Date of consumption (YYYY-MM-DD)")
    emission_factor: Optional[float] = Field(None, description="Emission factor (kg CO2e per unit)")
    emission_factor_unit: Optional[str] = Field(None, description="Unit of emission factor")
    location: Optional[str] = Field(None, description="Location of consumption")
    renewable_percentage: Optional[float] = Field(None, ge=0, le=100, description="Percentage of renewable energy (0-100)")
    certificate_id: Optional[str] = Field(None, description="Identifier for renewable energy certificate")
    additional_data: Optional[dict] = Field(None, description="Additional metadata")

    @validator('date')
    def validate_date(cls, v):
        if v is not None:
            try:
                datetime.fromisoformat(v)
            except ValueError:
                raise ValueError('date must be in YYYY-MM-DD format')
        return v


class EnergyResponse(BaseModel):
    success: bool
    energy: dict
    message: str


class EnergyListResponse(BaseModel):
    success: bool
    energies: List[dict]


# ────────────────────────────────────────────────────────────────────────────
# Endpoints
# ────────────────────────────────────────────────────────────────────────────

@router.post("", response_model=EnergyResponse)
async def create_energy(
    company_id: int,
    request: EnergyCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new energy consumption record."""
    verify_company_access(company_id, current_user, db)

    # Compute emissions if emission_factor provided
    emissions = None
    if request.emission_factor is not None:
        emissions = energy_emissions(request.quantity, request.emission_factor)

    energy_record = EnergyConsumption(
        company_id=company_id,
        user_id=current_user.id,
        energy_type=request.energy_type,
        quantity=request.quantity,
        unit=request.unit,
        emission_factor=request.emission_factor,
        emission_factor_unit=request.emission_factor_unit,
        emissions_kgco2e=emissions,
        location=request.location,
        renewable_percentage=request.renewable_percentage,
        certificate_id=request.certificate_id,
        additional_data=request.additional_data
    )

    db.add(energy_record)
    db.commit()
    db.refresh(energy_record)

    return EnergyResponse(success=True, energy=energy_record.to_dict(), message="Energy consumption recorded")


@router.get("", response_model=EnergyListResponse)
async def list_energy(
    company_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all energy consumption records for a company."""
    verify_company_access(company_id, current_user, db)
    records = db.query(EnergyConsumption).filter(EnergyConsumption.company_id == company_id).all()
    return EnergyListResponse(success=True, energies=[r.to_dict() for r in records])