"""
Scope 3 API Router
===================

This router exposes endpoints for calculating and storing Scope 3
emissions by category.  Each category has a dedicated POST endpoint
under ``/api/companies/{company_id}/scope3`` that accepts a
payload conforming to ``Scope3BaseRequest`` and returns the saved
emission record.  A GET endpoint at the root of the prefix
returns all Scope 3 emission records for a company.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Company, User
from app.routers.auth import get_current_user
from app.schemas.scope3_schemas import Scope3BaseRequest, Scope3EmissionResponse
from app.services.scope3_service import Scope3Service

# Import Scope3EmissionRecord at module level so that SQLAlchemy table
# definitions are registered and available for queries.  Without this,
# only the service layer knows about the model and the GET endpoint
# would attempt a dynamic import on every request.  Importing here
# ensures that Base.metadata.create_all() picks up the table and
# allows us to query it directly.
from app.models_scope3 import Scope3EmissionRecord

# Set up router
router = APIRouter(prefix="/api/companies/{company_id}/scope3", tags=["Scope3"])


def verify_company_access(company_id: int, current_user: User, db: Session) -> Company:
    """Ensure the current user belongs to the specified company."""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")
    if current_user.company_id != company_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return company


@router.get("", response_model=List[Scope3EmissionResponse])
async def list_scope3_records(
    company_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all Scope 3 emission records for a company."""
    # Verify the current user belongs to the requested company
    verify_company_access(company_id, current_user, db)
    # Query all Scope3 emission records for the company
    records = (
        db.query(Scope3EmissionRecord)
        .filter(Scope3EmissionRecord.company_id == company_id)
        .all()
    )
    return records


def _post_endpoint(category_code: str):
    """Factory to create POST endpoints for each Scope 3 category."""

    async def endpoint(
        company_id: int,
        request: Scope3BaseRequest,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ) -> Scope3EmissionResponse:
        verify_company_access(company_id, current_user, db)
        service = Scope3Service(db)
        record = service.create_emission(
            company_id=company_id,
            user_id=current_user.id if current_user else None,
            category_code=category_code,
            method=request.method,
            quantity=request.quantity,
            spend=request.spend,
            emission_factor=request.emission_factor,
            supplier_emission_factor=request.supplier_emission_factor,
            unit=request.unit,
            date_val=request.date,
            data=request.data,
        )
        return record

    return endpoint


# Register individual category endpoints
router.post("/3.1/purchased-goods", response_model=Scope3EmissionResponse)(_post_endpoint("3.1"))
router.post("/3.2/capital-goods", response_model=Scope3EmissionResponse)(_post_endpoint("3.2"))
router.post("/3.3/fuel-energy-upstream", response_model=Scope3EmissionResponse)(_post_endpoint("3.3"))
router.post("/3.4/upstream-transport", response_model=Scope3EmissionResponse)(_post_endpoint("3.4"))
router.post("/3.5/waste", response_model=Scope3EmissionResponse)(_post_endpoint("3.5"))
router.post("/3.6/business-travel", response_model=Scope3EmissionResponse)(_post_endpoint("3.6"))
router.post("/3.7/employee-commuting", response_model=Scope3EmissionResponse)(_post_endpoint("3.7"))
router.post("/3.8/upstream-leased", response_model=Scope3EmissionResponse)(_post_endpoint("3.8"))
router.post("/3.9/downstream-transport", response_model=Scope3EmissionResponse)(_post_endpoint("3.9"))
router.post("/3.10/processing", response_model=Scope3EmissionResponse)(_post_endpoint("3.10"))
router.post("/3.11/use-of-product", response_model=Scope3EmissionResponse)(_post_endpoint("3.11"))
router.post("/3.12/end-of-life", response_model=Scope3EmissionResponse)(_post_endpoint("3.12"))
router.post("/3.13/downstream-leased", response_model=Scope3EmissionResponse)(_post_endpoint("3.13"))
router.post("/3.14/franchises", response_model=Scope3EmissionResponse)(_post_endpoint("3.14"))
router.post("/3.15/investments", response_model=Scope3EmissionResponse)(_post_endpoint("3.15"))