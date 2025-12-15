"""
Production Database Models for Carbon Accounting Platform
==========================================================
Complete schema for emissions tracking with:
- Company management
- Scope 1/2/3 segregation with full GHG Protocol subcategories
- User authentication & authorization
- Goal tracking & progress monitoring
- Activity management
- Audit trail & data quality tracking
- Frontend-ready queries

Author: SHUB-0510
Version: 3.0 Production - Enhanced
Date: 2025-10-12 20:49:29
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey, JSON, Enum as SQLEnum, Date, Numeric, UniqueConstraint
from sqlalchemy.orm import Mapped, relationship
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
from app.database import Base
import enum


# ══════════════════════════════════════════════════════════════════
# ENUMS for consistent categorization
# ══════════════════════════════════════════════════════════════════

class ScopeEnum(enum.Enum):
    """GHG Protocol Scopes"""
    SCOPE_1 = "Scope 1"
    SCOPE_2 = "Scope 2"
    SCOPE_3 = "Scope 3"


class DataQualityEnum(enum.Enum):
    """Data quality levels"""
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"
    REPORTED = "Reported - Audited"
    ESTIMATED = "Estimated"


class CalculationMethodEnum(enum.Enum):
    """Calculation methods for tracking"""
    DEFRA_EXACT = "defra_exact"
    DEFRA_FUZZY = "defra_fuzzy"
    IPCC_EXACT = "ipcc_exact"
    IPCC_FUZZY = "ipcc_fuzzy"
    AI_ESTIMATION = "ai_estimation"
    CATEGORY_PROXY = "category_proxy"
    BRSR_REPORTED = "brsr_reported"
    MANUAL_ENTRY = "manual_entry"


# ══════════════════════════════════════════════════════════════════
# ENHANCED USER MODEL (For Authentication & Authorization)
# ══════════════════════════════════════════════════════════════════

class User(Base):
    """
    Enhanced User model for authentication and authorization
    Supports JWT authentication, role-based access, and user management
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    # Authentication
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)

    # Profile
    full_name = Column(String(100))
    company = Column(String(100))

    # Link to company (if using company-based tracking)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)

    # Authorization
    role = Column(String(20), default="user")  # admin, user, viewer
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime)

    # ✅ Relationships
    goals = relationship("Goal", back_populates="user", cascade="all, delete-orphan")
    activities = relationship("Activity", back_populates="user", cascade="all, delete-orphan")
    emission_records = relationship("EmissionRecord", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}', email='{self.email}')>"

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "full_name": self.full_name,
            "company": self.company,
            "company_id": self.company_id,
            "role": self.role,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_login": self.last_login.isoformat() if self.last_login else None # type: ignore
        }


# ══════════════════════════════════════════════════════════════════
# COMPANY MODEL (Your Original - Keeping All Features)
# ══════════════════════════════════════════════════════════════════

class Company(Base):
    """
    Company model - represents an organization
    Each company has many emission activities
    """
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)

    # Basic info
    name = Column(String, nullable=False, index=True)
    industry = Column(String, index=True)
    industry_code = Column(String)  # NAICS/SIC code

    # Location
    country = Column(String, default="India")
    state = Column(String)
    city = Column(String)
    address = Column(Text)

    # Contact
    email = Column(String)
    phone = Column(String)
    website = Column(String)
    domain = Column(String, index=True)  # Domain extracted from email (e.g., company.com)

    # Size & metadata
    employee_count = Column(Integer)
    annual_revenue = Column(Float)
    fiscal_year_start = Column(String)  # e.g., "April"

    # Status
    is_active = Column(Boolean, default=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # ✅ Relationships
    emission_activities = relationship(
        "EmissionActivity",
        back_populates="company",
        cascade="all, delete-orphan"
    )

    emission_summaries = relationship(
        "EmissionSummary",
        back_populates="company",
        cascade="all, delete-orphan"
    )

    ai_recommendations = relationship(
        "AIRecommendation",
        back_populates="company",
        cascade="all, delete-orphan"
    )

    users = relationship("User", foreign_keys=[User.company_id])

    def __repr__(self):
        return f"<Company(id={self.id}, name='{self.name}')>"


# ══════════════════════════════════════════════════════════════════
# EMISSION ACTIVITY MODEL (Your Original - Enhanced)
# ══════════════════════════════════════════════════════════════════

class EmissionActivity(Base):
    """
    Emission Activity - individual emission record
    Core model for storing all emission calculations
    Designed for easy frontend querying and dashboard display
    """
    __tablename__ = "emission_activities"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)

    # Activity details
    activity_type = Column(String, nullable=False, index=True)  # diesel, steel, flight, etc.
    activity_name = Column(String)  # User-friendly name
    description = Column(Text)

    # ══════════════════════════════════════════════════════════════
    # GHG PROTOCOL CLASSIFICATION (Critical for frontend)
    # ══════════════════════════════════════════════════════════════

    # Scope (Scope 1, Scope 2, Scope 3)
    scope = Column(String, nullable=False, index=True)
    scope_number = Column(Integer, index=True)  # 1, 2, or 3

    # Category (e.g., "3.6 - Business Travel")
    category = Column(String, index=True)

    # Subcategory (detailed, e.g., "3.6 - Air travel")
    subcategory = Column(String, index=True)

    # GHG Category (internal grouping)
    ghg_category = Column(String, index=True)

    # ══════════════════════════════════════════════════════════════
    # QUANTITY & UNITS
    # ══════════════════════════════════════════════════════════════

    quantity = Column(Float, nullable=False)
    unit = Column(String, nullable=False)  # kg, litre, km, kwh, etc.

    # ══════════════════════════════════════════════════════════════
    # EMISSION CALCULATION RESULTS
    # ══════════════════════════════════════════════════════════════

    # Emission factor used
    emission_factor = Column(Float)
    emission_factor_unit = Column(String)

    # TOTAL EMISSIONS (in kg CO2e) - Critical for summaries
    emissions_kgco2e = Column(Float, nullable=False, index=True)

    # Breakdown by gas (optional, for detailed reporting)
    co2_kg = Column(Float)
    ch4_kg = Column(Float)
    n2o_kg = Column(Float)

    # ══════════════════════════════════════════════════════════════
    # CALCULATION METADATA (For transparency & auditing)
    # ══════════════════════════════════════════════════════════════

    calculation_method = Column(String, index=True)  # defra_exact, ipcc_fuzzy, ai_estimation, brsr_reported
    database_source = Column(String)  # DEFRA 2024, IPCC EFDB, BRSR Report, etc.
    source = Column(String)  # More detailed source info
    layer = Column(Integer)  # 0-4 (which matching layer found the factor)

    # Quality indicators
    data_quality = Column(String, index=True)  # High, Medium, Low, Reported
    confidence = Column(Float)  # 0.0 to 1.0

    # ══════════════════════════════════════════════════════════════
    # TEMPORAL & LOCATION DATA
    # ══════════════════════════════════════════════════════════════

    activity_date = Column(DateTime, index=True)  # When the activity occurred
    reporting_period = Column(String)  # e.g., "FY 2024-25", "Q1 2024"

    # Location details (for travel/logistics)
    from_location = Column(String)
    to_location = Column(String)
    location = Column(String)  # General location

    # ══════════════════════════════════════════════════════════════
    # SOURCE DOCUMENT TRACKING
    # ══════════════════════════════════════════════════════════════

    source_document = Column(String)  # Original filename
    document_type = Column(String)  # hotel_bill, flight_ticket, brsr_report, etc.
    document_path = Column(String)  # File path if stored

    # ══════════════════════════════════════════════════════════════
    # ADDITIONAL METADATA (JSON for flexibility)
    # ══════════════════════════════════════════════════════════════

    additional_data = Column(JSON)  # Flexible storage for extra fields
    # Example: {"passengers": 2, "vehicle_type": "sedan", "hotel_stars": 4}

    # Notes
    notes = Column(Text)
    tags = Column(String)  # Comma-separated tags for filtering

    # Verification status
    is_verified = Column(Boolean, default=False)
    verified_by = Column(String)
    verified_at = Column(DateTime)

    # ══════════════════════════════════════════════════════════════
    # TIMESTAMPS
    # ══════════════════════════════════════════════════════════════

    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String)  # User who created the record

    @staticmethod
    def get_company_data(db: Session, company_id: int):
        """
        Helper to ensure company_id filtering
        Use this instead of direct db.query() to enforce data isolation
        """
        return db.query(EmissionActivity).filter(
            EmissionActivity.company_id == company_id
        )

    # Optional: Add similar helpers for common queries
    @staticmethod
    def get_by_scope(db: Session, company_id: int, scope_number: int):
        """Get activities filtered by company and scope"""
        return db.query(EmissionActivity).filter(
            EmissionActivity.company_id == company_id,
            EmissionActivity.scope_number == scope_number
        )

    @staticmethod
    def get_total_emissions(db: Session, company_id: int) -> float:
        """Get total emissions for a company"""
        from sqlalchemy import func
        result = db.query(func.sum(EmissionActivity.emissions_kgco2e)).filter(
            EmissionActivity.company_id == company_id
        ).scalar()
        return result or 0.0

    # ✅ Relationship
    company = relationship("Company", back_populates="emission_activities")

    def __repr__(self):
        return f"<EmissionActivity(id={self.id}, type='{self.activity_type}', scope='{self.scope}', co2e={self.emissions_kgco2e})>"

    def to_dict(self):
        """Convert to dictionary for JSON/API responses"""
        return {
            'id': self.id,
            'company_id': self.company_id,
            'activity_type': self.activity_type,
            'activity_name': self.activity_name,
            'description': self.description,
            'scope': self.scope,
            'scope_number': self.scope_number,
            'category': self.category,
            'subcategory': self.subcategory,
            'quantity': self.quantity,
            'unit': self.unit,
            'emissions_kgco2e': self.emissions_kgco2e,
            'emission_factor': self.emission_factor,
            'calculation_method': self.calculation_method,
            'data_quality': self.data_quality,
            'confidence': self.confidence,
            'activity_date': self.activity_date.isoformat() if self.activity_date else None,
            'reporting_period': self.reporting_period,
            'source_document': self.source_document,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


# ══════════════════════════════════════════════════════════════════
# EMISSION SUMMARY MODEL (Your Original - Keep All Features)
# ══════════════════════════════════════════════════════════════════

class EmissionSummary(Base):
    """
    Emission Summary - aggregated view by company/period
    Pre-calculated summaries for fast dashboard loading
    Updated whenever new activities are added
    """
    __tablename__ = "emission_summaries"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)

    # Period
    reporting_period = Column(String, nullable=False, index=True)  # "FY 2024-25", "2024-Q1"
    year = Column(Integer, index=True)
    start_date = Column(DateTime)
    end_date = Column(DateTime)

    # ══════════════════════════════════════════════════════════════
    # SCOPE TOTALS (kg CO2e)
    # ══════════════════════════════════════════════════════════════

    scope_1_total = Column(Float, default=0.0, index=True)
    scope_2_total = Column(Float, default=0.0, index=True)
    scope_3_total = Column(Float, default=0.0, index=True)
    total_emissions = Column(Float, default=0.0, index=True)

    # Total in tonnes (for easier reading)
    total_emissions_tonnes = Column(Float, default=0.0)

    # ══════════════════════════════════════════════════════════════
    # SCOPE 1 BREAKDOWN
    # ══════════════════════════════════════════════════════════════

    scope_1_stationary = Column(Float, default=0.0)  # 1.1
    scope_1_mobile = Column(Float, default=0.0)  # 1.2
    scope_1_process = Column(Float, default=0.0)  # 1.3
    scope_1_fugitive = Column(Float, default=0.0)  # 1.4

    # ══════════════════════════════════════════════════════════════
    # SCOPE 2 BREAKDOWN
    # ══════════════════════════════════════════════════════════════

    scope_2_electricity = Column(Float, default=0.0)  # 2.1
    scope_2_heat_steam = Column(Float, default=0.0)  # 2.2

    # ══════════════════════════════════════════════════════════════
    # SCOPE 3 BREAKDOWN (15 categories)
    # ══════════════════════════════════════════════════════════════

    scope_3_purchased_goods = Column(Float, default=0.0)  # 3.1
    scope_3_capital_goods = Column(Float, default=0.0)  # 3.2
    scope_3_fuel_energy = Column(Float, default=0.0)  # 3.3
    scope_3_upstream_transport = Column(Float, default=0.0)  # 3.4
    scope_3_waste = Column(Float, default=0.0)  # 3.5
    scope_3_business_travel = Column(Float, default=0.0)  # 3.6
    scope_3_employee_commuting = Column(Float, default=0.0)  # 3.7
    scope_3_upstream_leased = Column(Float, default=0.0)  # 3.8
    scope_3_downstream_transport = Column(Float, default=0.0)  # 3.9
    scope_3_processing = Column(Float, default=0.0)  # 3.10
    scope_3_use_of_products = Column(Float, default=0.0)  # 3.11
    scope_3_end_of_life = Column(Float, default=0.0)  # 3.12
    scope_3_downstream_leased = Column(Float, default=0.0)  # 3.13
    scope_3_franchises = Column(Float, default=0.0)  # 3.14
    scope_3_investments = Column(Float, default=0.0)  # 3.15
    scope_3_other = Column(Float, default=0.0)  # 3.X

    # ══════════════════════════════════════════════════════════════
    # ACTIVITY COUNTS
    # ══════════════════════════════════════════════════════════════

    total_activities = Column(Integer, default=0)
    scope_1_activities = Column(Integer, default=0)
    scope_2_activities = Column(Integer, default=0)
    scope_3_activities = Column(Integer, default=0)

    # ══════════════════════════════════════════════════════════════
    # DATA QUALITY SUMMARY
    # ══════════════════════════════════════════════════════════════

    high_quality_count = Column(Integer, default=0)
    medium_quality_count = Column(Integer, default=0)
    low_quality_count = Column(Integer, default=0)

    # Percentage of high-quality data
    data_quality_score = Column(Float)  # 0-100

    # ══════════════════════════════════════════════════════════════
    # METADATA
    # ══════════════════════════════════════════════════════════════

    last_calculated = Column(DateTime, default=datetime.utcnow)
    calculation_notes = Column(Text)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # ✅ Relationship
    company = relationship("Company", back_populates="emission_summaries")

    def __repr__(self):
        return f"<EmissionSummary(company_id={self.company_id}, period='{self.reporting_period}', total={self.total_emissions})>"

    def to_dict(self):
        """Convert to dictionary for dashboard/API"""
        return {
            'company_id': self.company_id,
            'reporting_period': self.reporting_period,
            'total_emissions_kg': self.total_emissions,
            'total_emissions_tonnes': self.total_emissions_tonnes,
            'scope_breakdown': {
                'scope_1': {
                    'total': self.scope_1_total,
                    'percentage': (self.scope_1_total / self.total_emissions * 100) if self.total_emissions > 0 else 0,
                    'categories': {
                        '1.1_stationary': self.scope_1_stationary,
                        '1.2_mobile': self.scope_1_mobile,
                        '1.3_process': self.scope_1_process,
                        '1.4_fugitive': self.scope_1_fugitive
                    }
                },
                'scope_2': {
                    'total': self.scope_2_total,
                    'percentage': (self.scope_2_total / self.total_emissions * 100) if self.total_emissions > 0 else 0,
                    'categories': {
                        '2.1_electricity': self.scope_2_electricity,
                        '2.2_heat_steam': self.scope_2_heat_steam
                    }
                },
                'scope_3': {
                    'total': self.scope_3_total,
                    'percentage': (self.scope_3_total / self.total_emissions * 100) if self.total_emissions > 0 else 0,
                    'categories': {
                        '3.1_purchased_goods': self.scope_3_purchased_goods,
                        '3.6_business_travel': self.scope_3_business_travel,
                        '3.7_employee_commuting': self.scope_3_employee_commuting,
                        '3.4_upstream_transport': self.scope_3_upstream_transport,
                        '3.5_waste': self.scope_3_waste,
                        '3.2_capital_goods': self.scope_3_capital_goods,
                        '3.3_fuel_energy': self.scope_3_fuel_energy,
                        '3.8-3.15_other': (
                                (self.scope_3_upstream_leased or 0) +
                                (self.scope_3_downstream_transport or 0) +
                                (self.scope_3_processing or 0) +
                                (self.scope_3_use_of_products or 0) +
                                (self.scope_3_end_of_life or 0) +
                                (self.scope_3_downstream_leased or 0) +
                                (self.scope_3_franchises or 0) +
                                (self.scope_3_investments or 0) +
                                (self.scope_3_other or 0)
                        )
                    }
                }
            },
            'activity_counts': {
                'total': self.total_activities,
                'scope_1': self.scope_1_activities,
                'scope_2': self.scope_2_activities,
                'scope_3': self.scope_3_activities
            },
            'data_quality': {
                'score': self.data_quality_score,
                'high': self.high_quality_count,
                'medium': self.medium_quality_count,
                'low': self.low_quality_count
            }
        }


# ══════════════════════════════════════════════════════════════════
# EMISSION FACTOR MODEL (Your Original)
# ══════════════════════════════════════════════════════════════════

class EmissionFactor(Base):
    """
    Emission Factor Database
    Stores factors from IPCC, DEFRA, India-specific sources
    """
    __tablename__ = "emission_factors"

    id = Column(Integer, primary_key=True, index=True)

    # Core factor data
    activity_type = Column(String, nullable=False, index=True)
    emission_factor = Column(Float, nullable=False)
    unit = Column(String, nullable=False)

    # Classification
    scope = Column(String, index=True)
    category = Column(String, index=True)
    subcategory = Column(String)

    # Geographic
    region = Column(String, default="Global", index=True)
    country = Column(String, index=True)

    # Source
    source = Column(String, index=True)  # IPCC, DEFRA, CEA, etc.
    source_url = Column(Text)
    year = Column(Integer, index=True)

    # Additional data
    co2_factor = Column(Float)
    ch4_factor = Column(Float)
    n2o_factor = Column(Float)

    # Metadata
    data_quality = Column(String)
    confidence_level = Column(Float)
    methodology = Column(Text)
    notes = Column(Text)
    tags = Column(String)

    # Priority (for matching)
    priority = Column(Integer, default=10)  # Lower = higher priority

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<EmissionFactor(activity='{self.activity_type}', factor={self.emission_factor}, unit='{self.unit}')>"


# ══════════════════════════════════════════════════════════════════
# NEW MODELS FOR ENHANCED FEATURES
# ══════════════════════════════════════════════════════════════════

class Activity(Base):
    """
    Activity definition model - for activity management router
    Reusable activity templates that can be tracked repeatedly
    """
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    name = Column(String(200), nullable=False)
    scope = Column(Integer, nullable=False)  # 1, 2, or 3
    category = Column(String(100), nullable=False)
    description = Column(Text)
    unit = Column(String(50), default="kg")

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="activities")
    emission_records = relationship("EmissionRecord", back_populates="activity")

    def __repr__(self):
        return f"<Activity(id={self.id}, name='{self.name}', scope={self.scope})>"

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "scope": self.scope,
            "category": self.category,
            "description": self.description,
            "unit": self.unit,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class EmissionRecord(Base):
    """
    Individual emission record - for new API tracking system
    Links users to activities with actual emission data
    """
    __tablename__ = "emission_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    activity_id = Column(Integer, ForeignKey("activities.id"))

    activity_name = Column(String(200), nullable=False)
    date = Column(Date, nullable=False, index=True)
    quantity = Column(Float, nullable=False)
    unit = Column(String(50), nullable=False)
    co2_emissions = Column(Float, nullable=False)  # in kg
    scope = Column(Integer, nullable=False)
    category = Column(String(100))
    description = Column(Text)
    source_document = Column(String(255))
    confidence = Column(Float)  # 0-100

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="emission_records")
    activity = relationship("Activity", back_populates="emission_records")

    def __repr__(self):
        return f"<EmissionRecord(id={self.id}, activity='{self.activity_name}', emissions={self.co2_emissions})>"

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "activity_id": self.activity_id,
            "activity_name": self.activity_name,
            "date": self.date.isoformat() if self.date else None,
            "quantity": self.quantity,
            "unit": self.unit,
            "co2_emissions": self.co2_emissions,
            "scope": self.scope,
            "category": self.category,
            "description": self.description,
            "confidence": self.confidence,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class Goal(Base):
    """
    Emission reduction goal - for goal tracking system
    Allows users to set targets and track progress
    """
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    title = Column(String(200), nullable=False)
    target_reduction_percent = Column(Float, nullable=False)
    baseline_year = Column(Integer, nullable=False)
    target_year = Column(Integer, nullable=False)
    baseline_emissions = Column(Float, nullable=False)
    target_emissions = Column(Float, nullable=False)
    current_emissions = Column(Float, default=0)
    progress_percent = Column(Float, default=0)
    status = Column(String(50), default="on_track")  # on_track, at_risk, achieved, failed
    scope = Column(Integer)  # Optional: specific to a scope
    category = Column(String(100))  # Optional: specific to a category
    description = Column(Text)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="goals")

    def __repr__(self):
        return f"<Goal(id={self.id}, title='{self.title}', progress={self.progress_percent}%)>"

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "target_reduction_percent": self.target_reduction_percent,
            "baseline_year": self.baseline_year,
            "target_year": self.target_year,
            "baseline_emissions": self.baseline_emissions,
            "target_emissions": self.target_emissions,
            "current_emissions": self.current_emissions,
            "progress_percent": self.progress_percent,
            "status": self.status,
            "scope": self.scope,
            "category": self.category,
            "description": self.description,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class AIRecommendation(Base):
    """
    AI Recommendation storage model - stores detailed AI-generated recommendations
    Allows caching and persistence of recommendations across page reloads
    """
    __tablename__ = "ai_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)

    # Recommendation metadata
    recommendation_id = Column(String(100), unique=True, index=True)  # Unique identifier for recommendation set
    period = Column(String(50), nullable=True, index=True)  # Reporting period if specified
    max_recommendations = Column(Integer, default=5)

    # Content
    title = Column(String(300), nullable=False)  # Overall recommendation title
    executive_summary = Column(Text)  # High-level summary (200-300 words)
    detailed_analysis = Column(Text)  # Comprehensive analysis (500-800 words)
    recommendations_json = Column(JSON, nullable=False)  # Array of detailed recommendations

    # Impact metrics
    total_potential_savings_kg = Column(Float)
    total_potential_savings_tonnes = Column(Float)
    potential_reduction_percentage = Column(Float)

    # Priority breakdown
    high_priority_count = Column(Integer, default=0)
    medium_priority_count = Column(Integer, default=0)
    low_priority_count = Column(Integer, default=0)

    # Generation metadata
    ai_model = Column(String(50), default="gpt-4o-mini")
    generation_prompt = Column(Text)  # Store the prompt used for transparency
    estimated_cost = Column(Float)  # API call cost estimate
    processing_time_seconds = Column(Float)

    # Status and validation
    is_active = Column(Boolean, default=True)  # Can be invalidated when data changes
    is_implemented = Column(Boolean, default=False)  # Track implementation status
    is_saved = Column(Boolean, default=False)  # Track if user saved for later
    implementation_notes = Column(Text)
    saved_at = Column(DateTime)  # When user saved for later
    implemented_at = Column(DateTime)  # When marked as implemented
    implementation_progress = Column(Float, default=0.0)  # 0-100 progress percentage

    # Audit trail
    generated_by = Column(String(100))  # User/system that generated
    generated_at = Column(DateTime, default=datetime.utcnow, index=True)
    expires_at = Column(DateTime)  # When this recommendation becomes stale
    last_viewed_at = Column(DateTime)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    company = relationship("Company", foreign_keys=[company_id])

    def __repr__(self):
        return f"<AIRecommendation(id={self.id}, company_id={self.company_id}, title='{self.title[:50]}...')>"

    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            "id": self.id,
            "company_id": self.company_id,
            "recommendation_id": self.recommendation_id,
            "period": self.period,
            "max_recommendations": self.max_recommendations,
            "title": self.title,
            "executive_summary": self.executive_summary,
            "detailed_analysis": self.detailed_analysis,
            "recommendations": self.recommendations_json,
            "impact_metrics": {
                "total_potential_savings_kg": self.total_potential_savings_kg,
                "total_potential_savings_tonnes": self.total_potential_savings_tonnes,
                "potential_reduction_percentage": self.potential_reduction_percentage
            },
            "priority_breakdown": {
                "high_priority_count": self.high_priority_count,
                "medium_priority_count": self.medium_priority_count,
                "low_priority_count": self.low_priority_count
            },
            "metadata": {
                "ai_model": self.ai_model,
                "generated_at": self.generated_at.isoformat() if self.generated_at else None,
                "expires_at": self.expires_at.isoformat() if self.expires_at else None,
                "last_viewed_at": self.last_viewed_at.isoformat() if self.last_viewed_at else None,
                "processing_time_seconds": self.processing_time_seconds,
                "estimated_cost": self.estimated_cost
            },
            "status": {
                "is_active": self.is_active,
                "is_implemented": self.is_implemented,
                "is_saved": self.is_saved,
                "implementation_notes": self.implementation_notes,
                "saved_at": self.saved_at.isoformat() if self.saved_at else None,
                "implemented_at": self.implemented_at.isoformat() if self.implemented_at else None,
                "implementation_progress": self.implementation_progress
            },
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

    def is_expired(self) -> bool:
        """Check if recommendation has expired"""
        if not self.expires_at:
            return False
        return datetime.utcnow() > self.expires_at

    def mark_viewed(self):
        """Update last viewed timestamp"""
        self.last_viewed_at = datetime.utcnow()


# ══════════════════════════════════════════════════════════════════
# NEW TABLES FOR ENERGY, WATER AND WASTE FOOTPRINTS
# ══════════════════════════════════════════════════════════════════

class EnergyConsumption(Base):
    """
    Records energy use and related emissions for a company.

    Each record represents a discrete energy consumption event or period.  It
    captures the energy source (electricity, fuel, steam, renewable), the
    quantity and unit, any associated emission factor and resulting emissions.
    Additional metadata such as the location of consumption, the share of
    renewable energy in the mix, and any certificate identifiers can be
    stored in the JSON ``additional_data`` field.
    """
    __tablename__ = "energy_consumption"

    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    company_id: Mapped[int] = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    user_id: Mapped[int] = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)

    # Basic energy fields
    energy_type: Mapped[str] = Column(String(50), nullable=False)  # electricity, diesel, natural_gas, steam, solar
    quantity: Mapped[float] = Column(Float, nullable=False)
    unit: Mapped[str] = Column(String(20), nullable=False)  # kWh, MJ, GJ, litre, kg

    # Emission data
    emission_factor: Mapped[float] = Column(Float, nullable=True)
    emission_factor_unit: Mapped[str] = Column(String(50), nullable=True)
    emissions_kgco2e: Mapped[float] = Column(Float, nullable=True, index=True)

    # Additional metadata
    location: Mapped[str] = Column(String(100), nullable=True)  # e.g. plant location or grid region
    renewable_percentage: Mapped[float] = Column(Float, nullable=True)  # percentage of renewable energy in the mix (0-100)
    certificate_id: Mapped[str] = Column(String(100), nullable=True)  # REC or I-REC identifier
    additional_data: Mapped[JSON] = Column(JSON, nullable=True)  # any extra fields

    created_at: Mapped[datetime] = Column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    company = relationship("Company", backref="energy_consumptions")
    user = relationship("User", backref="energy_consumptions")

    def __repr__(self) -> str:
        return (
            f"<EnergyConsumption(id={self.id}, type='{self.energy_type}', "
            f"quantity={self.quantity}{self.unit}, emissions={self.emissions_kgco2e})>"
        )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "company_id": self.company_id,
            "user_id": self.user_id,
            "energy_type": self.energy_type,
            "quantity": self.quantity,
            "unit": self.unit,
            "emission_factor": self.emission_factor,
            "emission_factor_unit": self.emission_factor_unit,
            "emissions_kgco2e": self.emissions_kgco2e,
            "location": self.location,
            "renewable_percentage": self.renewable_percentage,
            "certificate_id": self.certificate_id,
            "additional_data": self.additional_data,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class WaterUsage(Base):
    """
    Records water withdrawals, consumption, recycling and discharge for a company.

    Water usage records are essential for calculating a company's water footprint.
    They include volumes withdrawn from various sources (municipal, surface,
    groundwater), volumes consumed, recycled and discharged, along with any
    quality metrics or stress indices.  Emissions (if any) can be captured in
    the ``emissions_kgco2e`` field to account for indirect energy use in water
    treatment.
    """
    __tablename__ = "water_usage"

    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    company_id: Mapped[int] = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    user_id: Mapped[int] = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)

    # Water metrics
    source: Mapped[str] = Column(String(50), nullable=False)  # municipal, groundwater, surface, rainwater
    withdrawal_volume: Mapped[float] = Column(Float, nullable=False)
    consumption_volume: Mapped[float] = Column(Float, nullable=True)  # consumed = withdrawn - discharged + recycled
    discharge_volume: Mapped[float] = Column(Float, nullable=True)
    recycled_volume: Mapped[float] = Column(Float, nullable=True)
    unit: Mapped[str] = Column(String(20), default="m3")

    # Water quality and stress
    discharge_quality: Mapped[str] = Column(String(100), nullable=True)  # e.g. BOD/COD levels
    water_stress_index: Mapped[float] = Column(Float, nullable=True)  # measure of local water scarcity
    emissions_kgco2e: Mapped[float] = Column(Float, nullable=True)  # indirect emissions (e.g. pumping energy)

    additional_data: Mapped[JSON] = Column(JSON, nullable=True)

    created_at: Mapped[datetime] = Column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    company = relationship("Company", backref="water_usages")
    user = relationship("User", backref="water_usages")

    def __repr__(self) -> str:
        return (
            f"<WaterUsage(id={self.id}, source='{self.source}', withdrawal={self.withdrawal_volume}{self.unit})>"
        )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "company_id": self.company_id,
            "user_id": self.user_id,
            "source": self.source,
            "withdrawal_volume": self.withdrawal_volume,
            "consumption_volume": self.consumption_volume,
            "discharge_volume": self.discharge_volume,
            "recycled_volume": self.recycled_volume,
            "unit": self.unit,
            "discharge_quality": self.discharge_quality,
            "water_stress_index": self.water_stress_index,
            "emissions_kgco2e": self.emissions_kgco2e,
            "additional_data": self.additional_data,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class WasteDisposal(Base):
    """
    Records waste generation and disposal for a company.

    Each record captures the waste type, disposal method, quantity, unit and cost.
    Additional metadata may include hazard information, facility details and any
    recycling certificates.  Emissions resulting from disposal (e.g. landfill
    methane) can be captured in the ``emissions_kgco2e`` field.
    """
    __tablename__ = "waste_disposal"

    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    company_id: Mapped[int] = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    user_id: Mapped[int] = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)

    waste_type: Mapped[str] = Column(String(50), nullable=False)  # paper_cardboard, plastics, metals, e_waste, biohazard, construction
    disposal_method: Mapped[str] = Column(String(50), nullable=False)  # landfill, incineration, recycling, composting
    quantity: Mapped[float] = Column(Float, nullable=False)
    unit: Mapped[str] = Column(String(20), default="kg")
    cost: Mapped[float] = Column(Float, nullable=True)

    emissions_kgco2e: Mapped[float] = Column(Float, nullable=True, index=True)  # emissions associated with the disposal
    hazard: Mapped[bool] = Column(Boolean, default=False)
    facility_name: Mapped[str] = Column(String(100), nullable=True)
    facility_location: Mapped[str] = Column(String(100), nullable=True)
    additional_data: Mapped[JSON] = Column(JSON, nullable=True)

    created_at: Mapped[datetime] = Column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    company = relationship("Company", backref="waste_disposals")
    user = relationship("User", backref="waste_disposals")

    def __repr__(self) -> str:
        return (
            f"<WasteDisposal(id={self.id}, type='{self.waste_type}', method='{self.disposal_method}', "
            f"quantity={self.quantity}{self.unit}, emissions={self.emissions_kgco2e})>"
        )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "company_id": self.company_id,
            "user_id": self.user_id,
            "waste_type": self.waste_type,
            "disposal_method": self.disposal_method,
            "quantity": self.quantity,
            "unit": self.unit,
            "cost": self.cost,
            "emissions_kgco2e": self.emissions_kgco2e,
            "hazard": self.hazard,
            "facility_name": self.facility_name,
            "facility_location": self.facility_location,
            "additional_data": self.additional_data,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


# ══════════════════════════════════════════════════════════════════
# HELPER FUNCTIONS FOR FRONTEND (Your Original + Enhanced)
# ══════════════════════════════════════════════════════════════════

def get_company_emissions_dashboard(db, company_id: int, period: Optional[str] = None):
    """
    Get complete emissions dashboard data for a company
    Perfect for frontend display
    Now calculates from activities for real-time accuracy

    Returns:
        {
            'summary': calculated summary from activities,
            'recent_activities': [list of recent activities],
            'top_categories': [...],
        }
    """
    from sqlalchemy import func, desc

    # Get all activities
    activities_query = db.query(EmissionActivity).filter(
        EmissionActivity.company_id == company_id
    )

    if period:
        activities_query = activities_query.filter(
            EmissionActivity.reporting_period == period
        )

    activities = activities_query.all()

    # Calculate summary from activities
    scope_1_total = sum(a.emissions_kgco2e for a in activities if a.scope_number == 1)
    scope_2_total = sum(a.emissions_kgco2e for a in activities if a.scope_number == 2)
    scope_3_total = sum(a.emissions_kgco2e for a in activities if a.scope_number == 3)
    total_emissions = scope_1_total + scope_2_total + scope_3_total

    summary_dict = {
        'scope_1_total': round(scope_1_total / 1000, 3),  # Convert to tonnes
        'scope_2_total': round(scope_2_total / 1000, 3),
        'scope_3_total': round(scope_3_total / 1000, 3),
        'total_emissions': round(total_emissions, 2),
        'total_emissions_tonnes': round(total_emissions / 1000, 3),
        'total_activities': len(activities),
        'scope_1_activities': sum(1 for a in activities if a.scope_number == 1),
        'scope_2_activities': sum(1 for a in activities if a.scope_number == 2),
        'scope_3_activities': sum(1 for a in activities if a.scope_number == 3),
    }

    # Get recent activities
    recent = db.query(EmissionActivity).filter(
        EmissionActivity.company_id == company_id
    ).order_by(desc(EmissionActivity.created_at)).limit(10).all()

    # Get top emission categories (in tonnes)
    top_categories = db.query(
        EmissionActivity.category,
        func.sum(EmissionActivity.emissions_kgco2e).label('total')
    ).filter(
        EmissionActivity.company_id == company_id
    ).group_by(EmissionActivity.category).order_by(desc('total')).limit(10).all()

    return {
        'summary': summary_dict,
        'recent_activities': [a.to_dict() for a in recent],
        'top_categories': [{'category': cat, 'total': round(total / 1000, 3)} for cat, total in top_categories]
    }


def calculate_summary_for_company(db, company_id: int, reporting_period: str):
    """
    Calculate/update emission summary for a company
    Call this after adding new activities
    """
    from sqlalchemy import func

    # Get all activities for this period
    activities = db.query(EmissionActivity).filter(
        EmissionActivity.company_id == company_id,
        EmissionActivity.reporting_period == reporting_period
    ).all()

    if not activities:
        return None

    # Calculate totals
    scope_1 = sum(a.emissions_kgco2e for a in activities if a.scope_number == 1)
    scope_2 = sum(a.emissions_kgco2e for a in activities if a.scope_number == 2)
    scope_3 = sum(a.emissions_kgco2e for a in activities if a.scope_number == 3)
    total = scope_1 + scope_2 + scope_3

    # Get or create summary
    summary = db.query(EmissionSummary).filter(
        EmissionSummary.company_id == company_id,
        EmissionSummary.reporting_period == reporting_period
    ).first()

    if not summary:
        summary = EmissionSummary(
            company_id=company_id,
            reporting_period=reporting_period
        )
        db.add(summary)

    # Update totals
    summary.scope_1_total = scope_1
    summary.scope_2_total = scope_2
    summary.scope_3_total = scope_3
    summary.total_emissions = total
    summary.total_emissions_tonnes = total / 1000

    # Update counts
    summary.total_activities = len(activities)
    summary.scope_1_activities = sum(1 for a in activities if a.scope_number == 1)
    summary.scope_2_activities = sum(1 for a in activities if a.scope_number == 2)
    summary.scope_3_activities = sum(1 for a in activities if a.scope_number == 3)

    # Calculate subcategory breakdowns
    for activity in activities:
        if activity.scope_number == 1:
            if '1.1' in (activity.category or ''):
                summary.scope_1_stationary += activity.emissions_kgco2e
            elif '1.2' in (activity.category or ''):
                summary.scope_1_mobile += activity.emissions_kgco2e
            elif '1.3' in (activity.category or ''):
                summary.scope_1_process += activity.emissions_kgco2e
            elif '1.4' in (activity.category or ''):
                summary.scope_1_fugitive += activity.emissions_kgco2e

        elif activity.scope_number == 2:
            if '2.1' in (activity.category or ''):
                summary.scope_2_electricity += activity.emissions_kgco2e
            elif '2.2' in (activity.category or ''):
                summary.scope_2_heat_steam += activity.emissions_kgco2e

        elif activity.scope_number == 3:
            cat = activity.category or ''
            if '3.1' in cat:
                summary.scope_3_purchased_goods += activity.emissions_kgco2e
            elif '3.6' in cat:
                summary.scope_3_business_travel += activity.emissions_kgco2e
            elif '3.7' in cat:
                summary.scope_3_employee_commuting += activity.emissions_kgco2e
            # Add other categories as needed...

    summary.last_calculated = datetime.utcnow()

    db.commit()
    return summary


# Add these models to your app/models.py file

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Date, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship, Mapped
from datetime import datetime
from app.database import Base


class ReportTemplate(Base):
    """
    Stores report templates (CDP, BRSR, GRI, Custom)
    """
    __tablename__ = "report_templates"

    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    name: Mapped[str] = Column(String(200), nullable=False)
    type: Mapped[str] = Column(String(50), nullable=False)  # CDP, BRSR, GRI, CUSTOM
    version: Mapped[str] = Column(String(20), nullable=True)
    description: Mapped[str] = Column(Text, nullable=True)

    # Template structure stored as JSON
    template_structure: Mapped[dict] = Column(JSON, nullable=False)

    # Sections configuration
    sections_config: Mapped[dict] = Column(JSON, nullable=False)

    # Default settings
    default_settings: Mapped[dict] = Column(JSON, nullable=True)

    is_active: Mapped[bool] = Column(Boolean, default=True)
    is_system: Mapped[bool] = Column(Boolean, default=False)  # System templates can't be deleted

    created_at: Mapped[datetime] = Column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    reports = relationship("GeneratedReport", back_populates="template")

    def __repr__(self) -> str:
        return f"<ReportTemplate(id={self.id}, name='{self.name}', type='{self.type}')>"

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "type": self.type,
            "version": self.version,
            "description": self.description,
            "template_structure": self.template_structure,
            "sections_config": self.sections_config,
            "default_settings": self.default_settings,
            "is_active": self.is_active,
            "is_system": self.is_system,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }


class GeneratedReport(Base):
    """
    Stores generated reports for companies
    """
    __tablename__ = "generated_reports"

    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    company_id: Mapped[int] = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    user_id: Mapped[int] = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    template_id: Mapped[int] = Column(Integer, ForeignKey("report_templates.id"), nullable=False)

    # Report metadata
    title: Mapped[str] = Column(String(300), nullable=False)
    report_type: Mapped[str] = Column(String(50), nullable=False)  # CDP, BRSR, etc.

    # Reporting period
    reporting_period_start: Mapped[Date] = Column(Date, nullable=False)
    reporting_period_end: Mapped[Date] = Column(Date, nullable=False)

    # Status workflow
    status: Mapped[str] = Column(String(20), default="draft")  # draft, review, final, submitted, archived

    # File storage
    file_url: Mapped[str] = Column(String(500), nullable=True)
    file_format: Mapped[str] = Column(String(10), nullable=True)  # pdf, docx, xlsx, pptx
    file_size: Mapped[int] = Column(Integer, nullable=True)  # in bytes

    # Customizations
    branding_settings: Mapped[dict] = Column(JSON, nullable=True)  # logo, colors, fonts
    selected_sections: Mapped[dict] = Column(JSON, nullable=True)  # which sections to include
    custom_data: Mapped[dict] = Column(JSON, nullable=True)  # any custom fields

    # Versioning
    version: Mapped[int] = Column(Integer, default=1)
    parent_report_id: Mapped[int] = Column(Integer, ForeignKey("generated_reports.id"), nullable=True)

    # Timestamps
    generated_at: Mapped[datetime] = Column(DateTime, default=datetime.utcnow)
    finalized_at: Mapped[datetime] = Column(DateTime, nullable=True)
    submitted_at: Mapped[datetime] = Column(DateTime, nullable=True)

    # Relationships
    company = relationship("Company", backref="reports")
    user = relationship("User", backref="reports")
    template = relationship("ReportTemplate", back_populates="reports")
    sections = relationship("ReportSection", back_populates="report", cascade="all, delete-orphan")
    audit_logs = relationship("ReportAuditLog", back_populates="report", cascade="all, delete-orphan")
    parent_report = relationship("GeneratedReport", remote_side=[id], backref="versions")

    def __repr__(self) -> str:
        return f"<GeneratedReport(id={self.id}, title='{self.title}', type='{self.report_type}', status='{self.status}')>"

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "company_id": self.company_id,
            "user_id": self.user_id,
            "template_id": self.template_id,
            "title": self.title,
            "report_type": self.report_type,
            "reporting_period_start": self.reporting_period_start.isoformat() if self.reporting_period_start else None,
            "reporting_period_end": self.reporting_period_end.isoformat() if self.reporting_period_end else None,
            "status": self.status,
            "file_url": self.file_url,
            "file_format": self.file_format,
            "file_size": self.file_size,
            "branding_settings": self.branding_settings,
            "selected_sections": self.selected_sections,
            "custom_data": self.custom_data,
            "version": self.version,
            "parent_report_id": self.parent_report_id,
            "generated_at": self.generated_at.isoformat() if self.generated_at else None,
            "finalized_at": self.finalized_at.isoformat() if self.finalized_at else None,
            "submitted_at": self.submitted_at.isoformat() if self.submitted_at else None
        }


class ReportSection(Base):
    """
    Stores individual sections of a report (modular approach)
    """
    __tablename__ = "report_sections"

    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    report_id: Mapped[int] = Column(Integer, ForeignKey("generated_reports.id"), nullable=False, index=True)

    section_name: Mapped[str] = Column(String(100), nullable=False)
    section_code: Mapped[str] = Column(String(20), nullable=True)  # e.g., "C6.1" for CDP
    section_order: Mapped[int] = Column(Integer, nullable=False)

    # Section content
    content: Mapped[dict] = Column(JSON, nullable=False)

    # Data sources for this section
    data_sources: Mapped[dict] = Column(JSON, nullable=True)

    is_included: Mapped[bool] = Column(Boolean, default=True)
    is_completed: Mapped[bool] = Column(Boolean, default=False)

    # Notes and comments
    notes: Mapped[str] = Column(Text, nullable=True)

    created_at: Mapped[datetime] = Column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    report = relationship("GeneratedReport", back_populates="sections")

    def __repr__(self) -> str:
        return f"<ReportSection(id={self.id}, name='{self.section_name}', order={self.section_order})>"

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "report_id": self.report_id,
            "section_name": self.section_name,
            "section_code": self.section_code,
            "section_order": self.section_order,
            "content": self.content,
            "data_sources": self.data_sources,
            "is_included": self.is_included,
            "is_completed": self.is_completed,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }


class ReportAuditLog(Base):
    """
    Audit trail for report changes
    """
    __tablename__ = "report_audit_log"

    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    report_id: Mapped[int] = Column(Integer, ForeignKey("generated_reports.id"), nullable=False, index=True)
    user_id: Mapped[int] = Column(Integer, ForeignKey("users.id"), nullable=False)

    action: Mapped[str] = Column(String(50), nullable=False)  # created, edited, exported, submitted, etc.
    description: Mapped[str] = Column(Text, nullable=True)

    # Store what changed
    changes: Mapped[dict] = Column(JSON, nullable=True)

    # Metadata
    ip_address: Mapped[str] = Column(String(45), nullable=True)
    user_agent: Mapped[str] = Column(String(500), nullable=True)

    timestamp: Mapped[datetime] = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    report = relationship("GeneratedReport", back_populates="audit_logs")
    user = relationship("User")

    def __repr__(self) -> str:
        return f"<ReportAuditLog(id={self.id}, report_id={self.report_id}, action='{self.action}')>"

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "report_id": self.report_id,
            "user_id": self.user_id,
            "action": self.action,
            "description": self.description,
            "changes": self.changes,
            "ip_address": self.ip_address,
            "user_agent": self.user_agent,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None
        }


class ReportShare(Base):
    """
    Track report sharing and access
    """
    __tablename__ = "report_shares"

    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    report_id: Mapped[int] = Column(Integer, ForeignKey("generated_reports.id"), nullable=False, index=True)
    shared_by_user_id: Mapped[int] = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Sharing details
    share_token: Mapped[str] = Column(String(100), unique=True, index=True)
    shared_with_email: Mapped[str] = Column(String(200), nullable=True)
    shared_with_user_id: Mapped[int] = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Permissions
    can_edit: Mapped[bool] = Column(Boolean, default=False)
    can_comment: Mapped[bool] = Column(Boolean, default=True)
    can_download: Mapped[bool] = Column(Boolean, default=True)

    # Expiry
    expires_at: Mapped[datetime] = Column(DateTime, nullable=True)
    is_active: Mapped[bool] = Column(Boolean, default=True)

    # Tracking
    access_count: Mapped[int] = Column(Integer, default=0)
    last_accessed_at: Mapped[datetime] = Column(DateTime, nullable=True)

    created_at: Mapped[datetime] = Column(DateTime, default=datetime.utcnow)

    # Relationships
    report = relationship("GeneratedReport")
    shared_by = relationship("User", foreign_keys=[shared_by_user_id])
    shared_with = relationship("User", foreign_keys=[shared_with_user_id])

    def __repr__(self) -> str:
        return f"<ReportShare(id={self.id}, report_id={self.report_id}, token='{self.share_token[:8]}...')>"

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "report_id": self.report_id,
            "shared_by_user_id": self.shared_by_user_id,
            "share_token": self.share_token,
            "shared_with_email": self.shared_with_email,
            "shared_with_user_id": self.shared_with_user_id,
            "can_edit": self.can_edit,
            "can_comment": self.can_comment,
            "can_download": self.can_download,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "is_active": self.is_active,
            "access_count": self.access_count,
            "last_accessed_at": self.last_accessed_at.isoformat() if self.last_accessed_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


# ══════════════════════════════════════════════════════════════════
# CBAM (Carbon Border Adjustment Mechanism) MODELS
# ══════════════════════════════════════════════════════════════════

class CBAMInstallation(Base):
    """
    CBAM Installation - tracks production facilities outside EU
    Required for CBAM reporting of imported goods
    """
    __tablename__ = "cbam_installations"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    installation_name = Column(String(255), nullable=False)
    country_code = Column(String(3), nullable=False)  # ISO 3166-1 alpha-3
    operator_name = Column(String(255))
    address = Column(Text)
    economic_activity = Column(String(255))
    un_locode = Column(String(10))  # UN Location Code
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    company = relationship("Company", backref="cbam_installations")
    emissions = relationship("CBAMEmission", back_populates="installation", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "company_id": self.company_id,
            "installation_name": self.installation_name,
            "country_code": self.country_code,
            "operator_name": self.operator_name,
            "address": self.address,
            "economic_activity": self.economic_activity,
            "un_locode": self.un_locode,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<CBAMInstallation(id={self.id}, name='{self.installation_name}', country='{self.country_code}')>"


class CBAMGoods(Base):
    """
    CBAM Goods - catalog of goods subject to CBAM
    Includes CN codes (Customs Nomenclature) and goods categories
    """
    __tablename__ = "cbam_goods"

    id = Column(Integer, primary_key=True, index=True)
    cn_code = Column(String(20), unique=True, nullable=False, index=True)  # Customs Nomenclature code
    goods_category = Column(String(50), nullable=False)  # 'cement', 'steel', 'aluminium', 'fertilizers', 'electricity', 'hydrogen'
    description = Column(Text)
    is_complex_good = Column(Boolean, default=False)  # Goods made from precursors
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    emissions = relationship("CBAMEmission", back_populates="goods")
    precursors = relationship("CBAMPrecursor", back_populates="precursor_goods")

    def to_dict(self):
        return {
            "id": self.id,
            "cn_code": self.cn_code,
            "goods_category": self.goods_category,
            "description": self.description,
            "is_complex_good": self.is_complex_good,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f"<CBAMGoods(id={self.id}, cn_code='{self.cn_code}', category='{self.goods_category}')>"


class CBAMEmission(Base):
    """
    CBAM Emissions - records embedded emissions in imported goods
    Tracks direct, indirect, and precursor emissions per reporting period
    """
    __tablename__ = "cbam_emissions"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    installation_id = Column(Integer, ForeignKey("cbam_installations.id"), nullable=False, index=True)
    goods_id = Column(Integer, ForeignKey("cbam_goods.id"), nullable=False, index=True)
    reporting_period = Column(Date, nullable=False, index=True)  # Quarter end date

    # Emissions data (in tCO2e)
    direct_emissions = Column(Numeric(15, 3))  # Direct emissions from production
    indirect_emissions = Column(Numeric(15, 3))  # Indirect emissions from electricity/heat
    total_embedded_emissions = Column(Numeric(15, 3))  # Total = direct + indirect + precursors

    # Activity data
    quantity_imported = Column(Numeric(15, 3))
    quantity_unit = Column(String(20))  # 'tonnes', 'MWh', etc.

    # Carbon pricing
    carbon_price_paid = Column(Numeric(15, 2))  # Price paid in country of origin
    carbon_price_currency = Column(String(3), default='EUR')
    carbon_price_country = Column(String(3))  # Country where carbon price was paid

    # Calculation method
    calculation_method = Column(String(50))  # 'EU_methodology', 'equivalent_method', 'default_values'
    is_verified = Column(Boolean, default=False)
    verifier_name = Column(String(255))
    verification_date = Column(Date)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    company = relationship("Company", backref="cbam_emissions")
    installation = relationship("CBAMInstallation", back_populates="emissions")
    goods = relationship("CBAMGoods", back_populates="emissions")
    precursors = relationship("CBAMPrecursor", back_populates="parent_emission", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "company_id": self.company_id,
            "installation_id": self.installation_id,
            "goods_id": self.goods_id,
            "reporting_period": self.reporting_period.isoformat() if self.reporting_period else None,
            "direct_emissions": float(self.direct_emissions) if self.direct_emissions else None,
            "indirect_emissions": float(self.indirect_emissions) if self.indirect_emissions else None,
            "total_embedded_emissions": float(self.total_embedded_emissions) if self.total_embedded_emissions else None,
            "quantity_imported": float(self.quantity_imported) if self.quantity_imported else None,
            "quantity_unit": self.quantity_unit,
            "carbon_price_paid": float(self.carbon_price_paid) if self.carbon_price_paid else None,
            "carbon_price_currency": self.carbon_price_currency,
            "carbon_price_country": self.carbon_price_country,
            "calculation_method": self.calculation_method,
            "is_verified": self.is_verified,
            "verifier_name": self.verifier_name,
            "verification_date": self.verification_date.isoformat() if self.verification_date else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<CBAMEmission(id={self.id}, embedded={self.total_embedded_emissions} tCO2e, period={self.reporting_period})>"


class CBAMPrecursor(Base):
    """
    CBAM Precursors - tracks precursor materials for complex goods
    Example: Steel made from iron ore (iron ore is the precursor)
    """
    __tablename__ = "cbam_precursors"

    id = Column(Integer, primary_key=True, index=True)
    parent_emission_id = Column(Integer, ForeignKey("cbam_emissions.id", ondelete="CASCADE"), nullable=False, index=True)
    precursor_goods_id = Column(Integer, ForeignKey("cbam_goods.id"), nullable=False, index=True)
    precursor_quantity = Column(Numeric(15, 3))
    precursor_emissions = Column(Numeric(15, 3))  # Emissions from precursor (tCO2e)
    calculation_method = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    parent_emission = relationship("CBAMEmission", back_populates="precursors")
    precursor_goods = relationship("CBAMGoods", back_populates="precursors")

    def to_dict(self):
        return {
            "id": self.id,
            "parent_emission_id": self.parent_emission_id,
            "precursor_goods_id": self.precursor_goods_id,
            "precursor_quantity": float(self.precursor_quantity) if self.precursor_quantity else None,
            "precursor_emissions": float(self.precursor_emissions) if self.precursor_emissions else None,
            "calculation_method": self.calculation_method,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self):
        return f"<CBAMPrecursor(id={self.id}, emissions={self.precursor_emissions} tCO2e)>"


class CBAMQuarterlyReport(Base):
    """
    CBAM Quarterly Reports - stores generated quarterly reports
    Includes XML export for EU submission
    """
    __tablename__ = "cbam_quarterly_reports"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    quarter = Column(Integer, nullable=False)  # 1, 2, 3, or 4
    year = Column(Integer, nullable=False)
    submission_date = Column(Date)
    submission_deadline = Column(Date)
    status = Column(String(20), default='draft')  # 'draft', 'submitted', 'corrected', 'verified'

    # Aggregated emissions
    total_direct_emissions = Column(Numeric(15, 3))
    total_indirect_emissions = Column(Numeric(15, 3))
    total_embedded_emissions = Column(Numeric(15, 3))

    # Report files
    report_file_url = Column(Text)
    xml_export = Column(Text)  # CBAM-compliant XML

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    company = relationship("Company", backref="cbam_reports")

    # Unique constraint: one report per company per quarter per year
    __table_args__ = (
        UniqueConstraint('company_id', 'quarter', 'year', name='unique_quarterly_report'),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "company_id": self.company_id,
            "quarter": self.quarter,
            "year": self.year,
            "submission_date": self.submission_date.isoformat() if self.submission_date else None,
            "submission_deadline": self.submission_deadline.isoformat() if self.submission_deadline else None,
            "status": self.status,
            "total_direct_emissions": float(self.total_direct_emissions) if self.total_direct_emissions else None,
            "total_indirect_emissions": float(self.total_indirect_emissions) if self.total_indirect_emissions else None,
            "total_embedded_emissions": float(self.total_embedded_emissions) if self.total_embedded_emissions else None,
            "report_file_url": self.report_file_url,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self):
        return f"<CBAMQuarterlyReport(id={self.id}, Q{self.quarter} {self.year}, status='{self.status}')>"

