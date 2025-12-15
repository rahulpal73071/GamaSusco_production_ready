"""
Scope 3 Models
================

This module defines database models for Scope 3 value‑chain emissions.  The
GHG Protocol defines 15 categories of Scope 3 emissions that occur
upstream and downstream of a company’s operations【974843948574610†L160-L174】【974843948574610†L218-L241】.  These models capture
the key data needed to calculate and store those emissions using
multiple calculation methods (spend‑based, supplier‑specific, hybrid and
activity‑based).  They extend the existing core schema without
modifying the base `EmissionActivity` model, allowing flexible
record‑keeping and future extensions.

The primary classes are:

* ``Scope3Category`` – lookup table defining the 15 standard Scope 3
  categories (3.1–3.15) with names and descriptions.
* ``Scope3EmissionRecord`` – stores individual Scope 3 emission
  calculations linked to a company, user and category.  Each record
  captures the method used, the input quantities or spend, emission
  factors and resulting emissions.
* ``Supplier`` – stores supplier information and optional emission
  factors.  Supplier relationships are critical for supplier‑specific
  calculations【974843948574610†L265-L276】.
* ``Invoice`` – generic representation of purchased goods/services
  invoices.  Invoices can be linked to Scope 3 emission records.
* ``TransportRecord``, ``BusinessTravelRecord``, ``EmployeeCommuteRecord``,
  ``LeasedAssetRecord``, ``InvestmentRecord``, ``ProductUseRecord``,
  ``EndOfLifeRecord`` and ``FranchiseRecord`` – specialised records for
  common Scope 3 categories.  Each captures key activity data
  (distance, weight, spend, etc.), emission factors and calculated
  emissions.

These models can be related back to the main ``Company`` and ``User``
tables via foreign keys, enabling multi‑tenant queries and access
control.  Timestamps are included for auditing.
"""

from __future__ import annotations

from datetime import datetime, date
from typing import Optional

from sqlalchemy import (
    Column,
    Integer,
    Float,
    String,
    Date,
    DateTime,
    Boolean,
    ForeignKey,
    JSON,
)
from sqlalchemy.orm import relationship

from app.database import Base


class Scope3Category(Base):
    """Lookup table for Scope 3 categories.

    Each category is identified by a code (e.g., ``"3.1"``) and
    includes a descriptive name.  Populating this table during
    migrations allows friendly names to be used throughout the API.
    """

    __tablename__ = "scope3_categories"

    id: int = Column(Integer, primary_key=True, index=True)
    code: str = Column(String, unique=True, nullable=False, index=True)
    name: str = Column(String, nullable=False)
    description: Optional[str] = Column(String)

    created_at: datetime = Column(DateTime, default=datetime.utcnow)
    updated_at: datetime = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship: one category has many emission records
    emissions = relationship("Scope3EmissionRecord", back_populates="category", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Scope3Category(code={self.code}, name={self.name})>"


class Scope3EmissionRecord(Base):
    """Store individual Scope 3 emission calculation results.

    The record captures which company/user produced the calculation,
    which category it belongs to, the calculation method used and
    relevant input values.  A flexible JSON field allows arbitrary
    additional data to be stored (e.g., supplier IDs, invoice numbers).
    """

    __tablename__ = "scope3_emission_records"

    id: int = Column(Integer, primary_key=True, index=True)
    company_id: int = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    user_id: Optional[int] = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    category_id: int = Column(Integer, ForeignKey("scope3_categories.id"), nullable=False, index=True)

    # Calculation metadata
    method: str = Column(String, nullable=False, index=True)  # spend, supplier, hybrid, activity
    quantity: Optional[float] = Column(Float)
    spend: Optional[float] = Column(Float)
    unit: Optional[str] = Column(String)
    emission_factor: Optional[float] = Column(Float)
    supplier_emission_factor: Optional[float] = Column(Float)
    total_emissions: float = Column(Float, nullable=False)
    date: Optional[date] = Column(Date)
    data: Optional[dict] = Column(JSON)

    created_at: datetime = Column(DateTime, default=datetime.utcnow)
    updated_at: datetime = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    company = relationship("Company")
    user = relationship("User")
    category = relationship("Scope3Category", back_populates="emissions")

    # Optional relationships to specific records
    invoice_id: Optional[int] = Column(Integer, ForeignKey("invoices.id"), nullable=True)
    transport_record_id: Optional[int] = Column(Integer, ForeignKey("transport_records.id"), nullable=True)
    business_travel_id: Optional[int] = Column(Integer, ForeignKey("business_travel_records.id"), nullable=True)
    employee_commute_id: Optional[int] = Column(Integer, ForeignKey("employee_commute_records.id"), nullable=True)
    leased_asset_id: Optional[int] = Column(Integer, ForeignKey("leased_asset_records.id"), nullable=True)
    investment_id: Optional[int] = Column(Integer, ForeignKey("investment_records.id"), nullable=True)
    product_use_id: Optional[int] = Column(Integer, ForeignKey("product_use_records.id"), nullable=True)
    end_of_life_id: Optional[int] = Column(Integer, ForeignKey("end_of_life_records.id"), nullable=True)
    franchise_id: Optional[int] = Column(Integer, ForeignKey("franchise_records.id"), nullable=True)

    def __repr__(self) -> str:
        return (
            f"<Scope3EmissionRecord(id={self.id}, category={self.category_id}, method={self.method}, "
            f"emissions={self.total_emissions})>"
        )


class Supplier(Base):
    """Supplier information with optional emission factors.

    Supplier data is used for supplier‑specific and hybrid calculations
    where primary emission factors are provided by vendors【974843948574610†L265-L276】.
    """

    __tablename__ = "suppliers"

    id: int = Column(Integer, primary_key=True, index=True)
    company_id: int = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    name: str = Column(String, nullable=False, index=True)
    description: Optional[str] = Column(String)
    country: Optional[str] = Column(String)
    emission_factor: Optional[float] = Column(Float)
    emission_factor_unit: Optional[str] = Column(String)
    additional_data: Optional[dict] = Column(JSON)

    created_at: datetime = Column(DateTime, default=datetime.utcnow)
    updated_at: datetime = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    company = relationship("Company")
    invoices = relationship("Invoice", back_populates="supplier", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Supplier(id={self.id}, name={self.name})>"


class Invoice(Base):
    """Representation of a supplier invoice for purchased goods and services.

    Invoices may link to Scope 3 emission records when spend‑based
    calculations are performed.
    """

    __tablename__ = "invoices"

    id: int = Column(Integer, primary_key=True, index=True)
    company_id: int = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    supplier_id: Optional[int] = Column(Integer, ForeignKey("suppliers.id"), nullable=True, index=True)
    date: Optional[date] = Column(Date)
    amount: float = Column(Float, nullable=False)
    currency: Optional[str] = Column(String)
    description: Optional[str] = Column(String)
    data: Optional[dict] = Column(JSON)

    created_at: datetime = Column(DateTime, default=datetime.utcnow)
    updated_at: datetime = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    company = relationship("Company")
    supplier = relationship("Supplier", back_populates="invoices")
    # Disable reverse relationship to Scope3EmissionRecord to avoid recursive schema generation. The linkage is via invoice_id on Scope3EmissionRecord.
    # emission_records = relationship("Scope3EmissionRecord", back_populates="invoice", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Invoice(id={self.id}, amount={self.amount}, currency={self.currency})>"


class TransportRecord(Base):
    """Record for upstream/downstream transport and distribution (Categories 3.4 and 3.9).

    Stores the mode (e.g., truck, rail, air), distance travelled (in tonne‑kilometres),
    weight transported, emission factor and calculated emissions.  Linked to a Scope 3
    emission record when used in calculations.
    """

    __tablename__ = "transport_records"

    id: int = Column(Integer, primary_key=True, index=True)
    company_id: int = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    mode: Optional[str] = Column(String)  # truck, rail, ship, air
    distance_tkm: Optional[float] = Column(Float)
    weight_tonnes: Optional[float] = Column(Float)
    emission_factor: Optional[float] = Column(Float)
    total_emissions: Optional[float] = Column(Float)
    from_location: Optional[str] = Column(String)
    to_location: Optional[str] = Column(String)
    date: Optional[date] = Column(Date)
    additional_data: Optional[dict] = Column(JSON)

    created_at: datetime = Column(DateTime, default=datetime.utcnow)
    updated_at: datetime = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    company = relationship("Company")
    # Reverse relationship disabled to prevent recursive schema generation. See models_scope3.py.
    # emission_record = relationship("Scope3EmissionRecord", backref="transport_record", uselist=False)

    def __repr__(self) -> str:
        return f"<TransportRecord(id={self.id}, mode={self.mode}, emissions={self.total_emissions})>"


class BusinessTravelRecord(Base):
    """Record for Category 3.6 (Business travel).

    Captures distance travelled by employees using third‑party transport
    (e.g., flights, trains, rental cars), emission factors and total
    emissions.  Linked to a Scope 3 emission record for consolidation.
    """

    __tablename__ = "business_travel_records"

    id: int = Column(Integer, primary_key=True, index=True)
    company_id: int = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    user_id: Optional[int] = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    mode: Optional[str] = Column(String)
    distance_km: Optional[float] = Column(Float)
    emission_factor: Optional[float] = Column(Float)
    total_emissions: Optional[float] = Column(Float)
    date: Optional[date] = Column(Date)
    additional_data: Optional[dict] = Column(JSON)

    created_at: datetime = Column(DateTime, default=datetime.utcnow)
    updated_at: datetime = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    company = relationship("Company")
    user = relationship("User")
    # Reverse relationship disabled to prevent recursive schema generation.
    # emission_record = relationship("Scope3EmissionRecord", backref="business_travel_record", uselist=False)

    def __repr__(self) -> str:
        return f"<BusinessTravelRecord(id={self.id}, mode={self.mode}, emissions={self.total_emissions})>"


class EmployeeCommuteRecord(Base):
    """Record for Category 3.7 (Employee commuting).

    Stores commute distances and modes for employees.  Useful for
    calculating commuting emissions and engaging staff in emissions
    reduction.
    """

    __tablename__ = "employee_commute_records"

    id: int = Column(Integer, primary_key=True, index=True)
    company_id: int = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    user_id: Optional[int] = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    mode: Optional[str] = Column(String)
    distance_km: Optional[float] = Column(Float)
    emission_factor: Optional[float] = Column(Float)
    total_emissions: Optional[float] = Column(Float)
    date: Optional[date] = Column(Date)
    additional_data: Optional[dict] = Column(JSON)

    created_at: datetime = Column(DateTime, default=datetime.utcnow)
    updated_at: datetime = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    company = relationship("Company")
    user = relationship("User")
    # Reverse relationship disabled to prevent recursive schema generation.
    # emission_record = relationship("Scope3EmissionRecord", backref="employee_commute_record", uselist=False)

    def __repr__(self) -> str:
        return f"<EmployeeCommuteRecord(id={self.id}, mode={self.mode}, emissions={self.total_emissions})>"


class LeasedAssetRecord(Base):
    """Record for Categories 3.8 and 3.13 (Upstream and downstream leased assets).

    Captures data about leased assets (e.g., warehouses, vehicles) where
    emissions are not already included in scope 1 or 2.  Both
    upstream and downstream leased assets can be stored here; the
    category is distinguished via the linked ``Scope3Category``.
    """

    __tablename__ = "leased_asset_records"

    id: int = Column(Integer, primary_key=True, index=True)
    company_id: int = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    asset_type: Optional[str] = Column(String)
    quantity: Optional[float] = Column(Float)
    unit: Optional[str] = Column(String)
    spend: Optional[float] = Column(Float)
    emission_factor: Optional[float] = Column(Float)
    total_emissions: Optional[float] = Column(Float)
    date: Optional[date] = Column(Date)
    additional_data: Optional[dict] = Column(JSON)

    created_at: datetime = Column(DateTime, default=datetime.utcnow)
    updated_at: datetime = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    company = relationship("Company")
    # Reverse relationship disabled to prevent recursive schema generation.
    # emission_record = relationship("Scope3EmissionRecord", backref="leased_asset_record", uselist=False)

    def __repr__(self) -> str:
        return f"<LeasedAssetRecord(id={self.id}, type={self.asset_type}, emissions={self.total_emissions})>"


class InvestmentRecord(Base):
    """Record for Category 3.15 (Investments).

    Stores investment amounts and emission factors for companies or
    financial instruments where emissions are attributed to the
    investing organization.【974843948574610†L218-L241】
    """

    __tablename__ = "investment_records"

    id: int = Column(Integer, primary_key=True, index=True)
    company_id: int = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    investment_type: Optional[str] = Column(String)  # equity, debt, joint venture
    value: Optional[float] = Column(Float)
    emission_factor: Optional[float] = Column(Float)
    total_emissions: Optional[float] = Column(Float)
    date: Optional[date] = Column(Date)
    additional_data: Optional[dict] = Column(JSON)

    created_at: datetime = Column(DateTime, default=datetime.utcnow)
    updated_at: datetime = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    company = relationship("Company")
    # Reverse relationship disabled to prevent recursive schema generation.
    # emission_record = relationship("Scope3EmissionRecord", backref="investment_record", uselist=False)

    def __repr__(self) -> str:
        return f"<InvestmentRecord(id={self.id}, type={self.investment_type}, emissions={self.total_emissions})>"


class ProductUseRecord(Base):
    """Record for Category 3.11 (Use of sold products).

    Captures emissions associated with the use phase of products sold
    by the company.  Useful for appliances, vehicles and other
    energy‑using products.
    """

    __tablename__ = "product_use_records"

    id: int = Column(Integer, primary_key=True, index=True)
    company_id: int = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    product_name: Optional[str] = Column(String)
    quantity: Optional[float] = Column(Float)
    unit: Optional[str] = Column(String)
    emission_factor: Optional[float] = Column(Float)
    total_emissions: Optional[float] = Column(Float)
    date: Optional[date] = Column(Date)
    additional_data: Optional[dict] = Column(JSON)

    created_at: datetime = Column(DateTime, default=datetime.utcnow)
    updated_at: datetime = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    company = relationship("Company")
    # Reverse relationship disabled to prevent recursive schema generation.
    # emission_record = relationship("Scope3EmissionRecord", backref="product_use_record", uselist=False)

    def __repr__(self) -> str:
        return f"<ProductUseRecord(id={self.id}, product={self.product_name}, emissions={self.total_emissions})>"


class EndOfLifeRecord(Base):
    """Record for Category 3.12 (End‑of‑life treatment of sold products).

    Stores data about the weight or number of products collected for
    recycling or disposal, along with emission factors and calculated
    emissions.
    """

    __tablename__ = "end_of_life_records"

    id: int = Column(Integer, primary_key=True, index=True)
    company_id: int = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    product_name: Optional[str] = Column(String)
    weight: Optional[float] = Column(Float)
    unit: Optional[str] = Column(String)
    emission_factor: Optional[float] = Column(Float)
    total_emissions: Optional[float] = Column(Float)
    date: Optional[date] = Column(Date)
    additional_data: Optional[dict] = Column(JSON)

    created_at: datetime = Column(DateTime, default=datetime.utcnow)
    updated_at: datetime = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    company = relationship("Company")
    # Reverse relationship disabled to prevent recursive schema generation.
    # emission_record = relationship("Scope3EmissionRecord", backref="end_of_life_record", uselist=False)

    def __repr__(self) -> str:
        return f"<EndOfLifeRecord(id={self.id}, product={self.product_name}, emissions={self.total_emissions})>"


class FranchiseRecord(Base):
    """Record for Category 3.14 (Franchises).

    Stores franchise activity data (e.g., sales, energy use) and
    corresponding emission factors and totals.  Franchises often
    operate semi‑independently but still contribute to the parent
    company’s carbon footprint【974843948574610†L229-L241】.
    """

    __tablename__ = "franchise_records"

    id: int = Column(Integer, primary_key=True, index=True)
    company_id: int = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    franchise_name: Optional[str] = Column(String)
    sales: Optional[float] = Column(Float)
    emission_factor: Optional[float] = Column(Float)
    total_emissions: Optional[float] = Column(Float)
    date: Optional[date] = Column(Date)
    additional_data: Optional[dict] = Column(JSON)

    created_at: datetime = Column(DateTime, default=datetime.utcnow)
    updated_at: datetime = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    company = relationship("Company")
    # Reverse relationship disabled to prevent recursive schema generation.
    # emission_record = relationship("Scope3EmissionRecord", backref="franchise_record", uselist=False)

    def __repr__(self) -> str:
        return f"<FranchiseRecord(id={self.id}, franchise={self.franchise_name}, emissions={self.total_emissions})>"
