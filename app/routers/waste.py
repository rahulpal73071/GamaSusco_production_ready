"""
Waste Disposal API Router
========================

This router provides secured endpoints for managing waste disposal records
for a company.  Users belonging to a company can create new waste
disposal entries and retrieve existing records.  Emissions from waste
disposal can be calculated on the fly if an emission factor is supplied
in the request.

Endpoints:
    POST /api/companies/{company_id}/waste
        Create a new waste disposal record
    GET /api/companies/{company_id}/waste
        List waste disposal records for the company
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, validator
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Company, User, WasteDisposal
from app.routers.auth import get_current_user
from app.calculators.waste import waste_emissions

router = APIRouter(prefix="/api/companies/{company_id}/waste", tags=["Waste Disposal"])


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

class WasteCreateRequest(BaseModel):
    waste_type: str = Field(..., description="Type of waste (paper_cardboard, plastics, metals, e_waste, biohazard, construction)")
    disposal_method: str = Field(..., description="Disposal method (landfill, incineration, recycling, composting)")
    quantity: float = Field(..., gt=0, description="Quantity of waste")
    unit: str = Field("kg", description="Unit of quantity (default kg)")
    cost: Optional[float] = Field(None, ge=0, description="Cost of disposal")
    emission_factor: Optional[float] = Field(None, description="Emission factor (kg CO2e per unit of waste)")
    hazard: Optional[bool] = Field(False, description="Whether waste is hazardous")
    facility_name: Optional[str] = Field(None, description="Name of disposal facility")
    facility_location: Optional[str] = Field(None, description="Location of disposal facility")
    date: Optional[str] = Field(None, description="Date of disposal (YYYY-MM-DD)")
    additional_data: Optional[dict] = Field(None, description="Additional metadata")

    @validator('date')
    def validate_date(cls, v):  # noqa: N805
        if v is not None:
            try:
                datetime.fromisoformat(v)
            except ValueError:
                raise ValueError('date must be in YYYY-MM-DD format')
        return v


class WasteResponse(BaseModel):
    success: bool
    waste: dict
    message: str


class WasteListResponse(BaseModel):
    success: bool
    wastes: List[dict]


# ────────────────────────────────────────────────────────────────────────────
# Endpoints
# ────────────────────────────────────────────────────────────────────────────

@router.post("", response_model=WasteResponse)
async def create_waste(
    company_id: int,
    request: WasteCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new waste disposal record."""
    verify_company_access(company_id, current_user, db)

    # Compute emissions if emission_factor provided
    emissions = None
    if request.emission_factor is not None:
        emissions = waste_emissions(request.quantity, request.emission_factor)

    waste_record = WasteDisposal(
        company_id=company_id,
        user_id=current_user.id,
        waste_type=request.waste_type,
        disposal_method=request.disposal_method,
        quantity=request.quantity,
        unit=request.unit,
        cost=request.cost,
        emissions_kgco2e=emissions,
        hazard=request.hazard if request.hazard is not None else False,
        facility_name=request.facility_name,
        facility_location=request.facility_location,
        additional_data=request.additional_data
    )

    db.add(waste_record)
    db.commit()
    db.refresh(waste_record)

    return WasteResponse(success=True, waste=waste_record.to_dict(), message="Waste disposal recorded")


@router.get("", response_model=WasteListResponse)
async def list_waste(
    company_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all waste disposal records for a company."""
    verify_company_access(company_id, current_user, db)
    records = db.query(WasteDisposal).filter(WasteDisposal.company_id == company_id).all()
    return WasteListResponse(success=True, wastes=[r.to_dict() for r in records])