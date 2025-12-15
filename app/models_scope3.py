"""
Scope 3 Models (Standalone)
===========================

This module defines database models for Scope 3 value‑chain emissions.  It
is functionally identical to ``app/models/scope3.py`` but is placed at
the top level of the ``app`` package to avoid conflicts with the
existing ``models.py`` module.  By importing from ``models_scope3``
instead of ``models.scope3``, consumers avoid Python’s ambiguity when a
module and a directory share the same name.

See ``app/models/scope3.py`` for detailed documentation of each class.
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

# Re‑declare all classes defined in the original scope3 module.

class Scope3Category(Base):
    __tablename__ = "scope3_categories"
    id: int = Column(Integer, primary_key=True, index=True)
    code: str = Column(String, unique=True, nullable=False, index=True)
    name: str = Column(String, nullable=False)
    description: Optional[str] = Column(String)
    created_at: datetime = Column(DateTime, default=datetime.utcnow)
    updated_at: datetime = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    emissions = relationship("Scope3EmissionRecord", back_populates="category", cascade="all, delete-orphan")
    def __repr__(self) -> str:
        return f"<Scope3Category(code={self.code}, name={self.name})>"


class Scope3EmissionRecord(Base):
    __tablename__ = "scope3_emission_records"
    id: int = Column(Integer, primary_key=True, index=True)
    company_id: int = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    user_id: Optional[int] = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    category_id: int = Column(Integer, ForeignKey("scope3_categories.id"), nullable=False, index=True)
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
    company = relationship("Company")
    user = relationship("User")
    category = relationship("Scope3Category", back_populates="emissions")
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
    __tablename__ = "transport_records"
    id: int = Column(Integer, primary_key=True, index=True)
    company_id: int = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    mode: Optional[str] = Column(String)
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
    # NOTE:
    # A two-way relationship between TransportRecord and Scope3EmissionRecord using backref
    # caused infinite recursion when FastAPI/Pydantic attempted to generate OpenAPI schemas.
    # To avoid this, we remove the reverse relationship here and rely on the
    # foreign key (`transport_record_id`) on Scope3EmissionRecord for linkage.
    # The transport record can still be accessed via the ID if needed.
    # emission_record = relationship("Scope3EmissionRecord", backref="transport_record", uselist=False)
    def __repr__(self) -> str:
        return f"<TransportRecord(id={self.id}, mode={self.mode}, emissions={self.total_emissions})>"


class BusinessTravelRecord(Base):
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
    # See note in TransportRecord for why this reverse relationship is disabled.
    # emission_record = relationship("Scope3EmissionRecord", backref="business_travel_record", uselist=False)
    def __repr__(self) -> str:
        return f"<BusinessTravelRecord(id={self.id}, mode={self.mode}, emissions={self.total_emissions})>"


class EmployeeCommuteRecord(Base):
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
    # See note in TransportRecord for why this reverse relationship is disabled.
    # emission_record = relationship("Scope3EmissionRecord", backref="employee_commute_record", uselist=False)
    def __repr__(self) -> str:
        return f"<EmployeeCommuteRecord(id={self.id}, mode={self.mode}, emissions={self.total_emissions})>"


class LeasedAssetRecord(Base):
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
    # See note in TransportRecord for why this reverse relationship is disabled.
    # emission_record = relationship("Scope3EmissionRecord", backref="leased_asset_record", uselist=False)
    def __repr__(self) -> str:
        return f"<LeasedAssetRecord(id={self.id}, type={self.asset_type}, emissions={self.total_emissions})>"


class InvestmentRecord(Base):
    __tablename__ = "investment_records"
    id: int = Column(Integer, primary_key=True, index=True)
    company_id: int = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    investment_type: Optional[str] = Column(String)
    value: Optional[float] = Column(Float)
    emission_factor: Optional[float] = Column(Float)
    total_emissions: Optional[float] = Column(Float)
    date: Optional[date] = Column(Date)
    additional_data: Optional[dict] = Column(JSON)
    created_at: datetime = Column(DateTime, default=datetime.utcnow)
    updated_at: datetime = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    company = relationship("Company")
    # See note in TransportRecord for why this reverse relationship is disabled.
    # emission_record = relationship("Scope3EmissionRecord", backref="investment_record", uselist=False)
    def __repr__(self) -> str:
        return f"<InvestmentRecord(id={self.id}, type={self.investment_type}, emissions={self.total_emissions})>"


class ProductUseRecord(Base):
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
    # See note in TransportRecord for why this reverse relationship is disabled.
    # emission_record = relationship("Scope3EmissionRecord", backref="product_use_record", uselist=False)
    def __repr__(self) -> str:
        return f"<ProductUseRecord(id={self.id}, product={self.product_name}, emissions={self.total_emissions})>"


class EndOfLifeRecord(Base):
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
    # See note in TransportRecord for why this reverse relationship is disabled.
    # emission_record = relationship("Scope3EmissionRecord", backref="end_of_life_record", uselist=False)
    def __repr__(self) -> str:
        return f"<EndOfLifeRecord(id={self.id}, product={self.product_name}, emissions={self.total_emissions})>"


class FranchiseRecord(Base):
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
    # See note in TransportRecord for why this reverse relationship is disabled.
    # emission_record = relationship("Scope3EmissionRecord", backref="franchise_record", uselist=False)
    def __repr__(self) -> str:
        return f"<FranchiseRecord(id={self.id}, franchise={self.franchise_name}, emissions={self.total_emissions})>"
