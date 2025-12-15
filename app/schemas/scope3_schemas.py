"""
Pydantic schemas for Scope 3 endpoints (Pydantic v2 compatible).

These request/response models ensure clean validation and stable
OpenAPI generation without recursive typing issues.
"""

from datetime import date as DateType
from typing import Optional, Dict, Union

from pydantic import BaseModel, Field, ConfigDict


class Scope3BaseRequest(BaseModel):
    """
    Base request fields for Scope 3 calculations.
    """

    method: str = Field(
        ...,
        description="Calculation method: spend, supplier, hybrid or activity"
    )
    quantity: Optional[float] = Field(
        None, description="Activity quantity (e.g. kg, km, kWh)"
    )
    spend: Optional[float] = Field(
        None, description="Monetary spend for spend-based calculations"
    )
    emission_factor: Optional[float] = Field(
        None, description="Emission factor for spend/activity methods"
    )
    supplier_emission_factor: Optional[float] = Field(
        None,
        description="Supplier-specific emission factor for supplier/hybrid methods"
    )
    unit: Optional[str] = Field(
        None, description="Unit of the quantity (e.g. kg, km, INR, USD)"
    )
    date: Union[DateType, None] = Field(
        default=None, description="Date of the activity or transaction"
    )

    # JSON metadata, simple safe dict (NO recursive type)
    data: Optional[Dict[str, object]] = Field(
        None, description="Additional JSON metadata for the record"
    )

    model_config = ConfigDict(extra="allow")


class Scope3EmissionResponse(BaseModel):
    """
    Response model for Scope 3 emission records.
    """

    id: int
    company_id: int
    user_id: Optional[int] = None
    category_id: int
    method: str
    quantity: Optional[float] = None
    spend: Optional[float] = None
    unit: Optional[str] = None
    emission_factor: Optional[float] = None
    supplier_emission_factor: Optional[float] = None
    total_emissions: float
    date: Union[DateType, None] = None

    # Safe JSON dict (NO default mutable object)
    data: Optional[Dict[str, object]] = None

    # Pydantic v2 equivalent of orm_mode
    model_config = ConfigDict(from_attributes=True)