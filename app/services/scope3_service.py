"""
Scope 3 Service Layer
=====================

This service provides high‑level functions to calculate and persist
Scope 3 emissions.  It abstracts away the details of selecting
calculation methods and interacting with the database models.

Example usage::

    from app.services.scope3_service import Scope3Service
    service = Scope3Service(db_session)
    record = service.create_emission(
        company_id=1,
        user_id=42,
        category_code="3.1",
        method="spend",
        spend=1_000.0,
        emission_factor=0.5,
        date=date.today(),
    )

"""

from __future__ import annotations

from typing import Optional, Dict, Any
from datetime import date
from importlib import import_module

from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models_scope3 import (
    Scope3Category,
    Scope3EmissionRecord,
    Supplier,
)
from app.calculators.scope3.base import (
    calculate_spend_based,
    calculate_supplier_specific,
    calculate_activity_based,
    calculate_hybrid,
)


class Scope3Service:
    """Service class encapsulating Scope 3 emission logic."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def get_or_create_category(self, code: str, name: Optional[str] = None) -> Scope3Category:
        """Return an existing category by code, creating it if missing.

        Name is optional; if not provided, the code is used as the name.
        """
        category = self.db.query(Scope3Category).filter_by(code=code).first()
        if category:
            return category
        # Create a new category on the fly
        category = Scope3Category(code=code, name=name or code)
        self.db.add(category)
        self.db.commit()
        self.db.refresh(category)
        return category

    def calculate_emission(
        self,
        method: str,
        quantity: Optional[float],
        spend: Optional[float],
        emission_factor: Optional[float],
        supplier_emission_factor: Optional[float],
    ) -> float:
        """Calculate emissions using the specified method and inputs."""
        method = method.lower()
        if method == "spend":
            if spend is None or emission_factor is None:
                raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                                    detail="Spend and emission_factor are required for spend-based calculations")
            return calculate_spend_based(spend, emission_factor)
        elif method == "supplier":
            if quantity is None or supplier_emission_factor is None:
                raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                                    detail="Quantity and supplier_emission_factor are required for supplier-specific calculations")
            return calculate_supplier_specific(quantity, supplier_emission_factor)
        elif method == "hybrid":
            # In hybrid method, both spend and quantity components contribute
            if (spend is None or emission_factor is None) and (quantity is None or supplier_emission_factor is None):
                raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                                    detail="Hybrid calculations require at least one of spend/emission_factor or quantity/supplier_emission_factor")
            return calculate_hybrid(spend, quantity, emission_factor or 0, supplier_emission_factor or 0)
        else:
            # Default to activity-based
            if quantity is None or emission_factor is None:
                raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                                    detail="Quantity and emission_factor are required for activity-based calculations")
            return calculate_activity_based(quantity, emission_factor)

    def create_emission(
        self,
        company_id: int,
        user_id: Optional[int],
        category_code: str,
        method: str,
        quantity: Optional[float] = None,
        spend: Optional[float] = None,
        emission_factor: Optional[float] = None,
        supplier_emission_factor: Optional[float] = None,
        unit: Optional[str] = None,
        date_val: Optional[date] = None,
        data: Optional[Dict[str, Any]] = None,
    ) -> Scope3EmissionRecord:
        """Compute and persist a Scope 3 emission record.

        Validates inputs, calculates emissions, creates a ``Scope3EmissionRecord``
        and returns it.  If the category does not exist it will be
        created on the fly.
        """
        category = self.get_or_create_category(code=category_code, name=None)
        total_emissions = self.calculate_emission(
            method=method,
            quantity=quantity,
            spend=spend,
            emission_factor=emission_factor,
            supplier_emission_factor=supplier_emission_factor,
        )
        record = Scope3EmissionRecord(
            company_id=company_id,
            user_id=user_id,
            category_id=category.id,
            method=method,
            quantity=quantity,
            spend=spend,
            unit=unit,
            emission_factor=emission_factor,
            supplier_emission_factor=supplier_emission_factor,
            total_emissions=total_emissions,
            date=date_val,
            data=data or {},
        )
        self.db.add(record)
        self.db.commit()
        self.db.refresh(record)
        return record