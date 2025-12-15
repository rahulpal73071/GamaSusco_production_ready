# app/database.py
"""
Database connection and session management
Comprehensive emission factor database based on international standards
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base  # ✅ ADD THIS
from sqlalchemy.orm import sessionmaker

# ✅ DEFINE BASE HERE - NOT in models.py
Base = declarative_base()

# SQLite database for development (easy setup, no installation needed)
DATABASE_URL = "sqlite:///./carbon_accounting.db"

# Create engine
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}  # Needed for SQLite
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    """
    Initialize database - create all tables
    """
    # Import models here to avoid circular import
    from app import models  # This loads all models

    print("🔧 Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Database initialized!")


def get_db():
    """
    Dependency for FastAPI - get database session
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def seed_emission_factors():
    """
    Add comprehensive emission factors to database
    Based on international standards:
    - DEFRA UK 2024
    - EPA USA 2024
    - IPCC Guidelines
    - IEA (International Energy Agency)
    - CEA (Central Electricity Authority - India)
    - GLEC Framework (Logistics)
    - ICAO (Aviation)
    """
    from app.models import EmissionFactor

    db = SessionLocal()

    # Check if already seeded
    if db.query(EmissionFactor).count() > 0:
        print("✅ Emission factors already exist")
        db.close()
        return

    print("🌱 Seeding comprehensive emission factors...")
    print("   📚 Sources: DEFRA, EPA, IPCC, IEA, CEA, GLEC, ICAO")

    factors = []

    # ========================================================================
    # SCOPE 1: DIRECT EMISSIONS
    # ========================================================================

    # --- STATIONARY COMBUSTION (1.1) ---
    print("   ⚡ Adding stationary combustion factors...")

    # Natural Gas
    factors.extend([
        EmissionFactor(
            activity_type="natural_gas",
            region="Global",
            unit="m3",
            emission_factor=2.0,  # kgCO2e per cubic meter
            source="IPCC 2024",
            year=2024,
            priority=3
        ),
        EmissionFactor(
            activity_type="natural_gas",
            region="India",
            unit="m3",
            emission_factor=1.98,
            source="MoEFCC",
            year=2024,
            priority=2
        ),
    ])

    # Diesel (stationary - generators, boilers)
    factors.extend([
        EmissionFactor(
            activity_type="diesel",
            region="Global",
            unit="litre",
            emission_factor=2.67,
            source="DEFRA 2024",
            year=2024,
            priority=3
        ),
        EmissionFactor(
            activity_type="diesel",
            region="India",
            unit="litre",
            emission_factor=2.64,
            source="CPCB",
            year=2024,
            priority=1
        ),
    ])

    # LPG
    factors.extend([
        EmissionFactor(
            activity_type="lpg",
            region="Global",
            unit="kg",
            emission_factor=2.98,
            source="DEFRA 2024",
            year=2024,
            priority=3
        ),
        EmissionFactor(
            activity_type="lpg",
            region="India",
            unit="kg",
            emission_factor=2.95,
            source="CPCB",
            year=2024,
            priority=2
        ),
    ])

    # Coal
    factors.extend([
        EmissionFactor(
            activity_type="coal",
            region="Global",
            unit="kg",
            emission_factor=2.42,
            source="IPCC 2024",
            year=2024,
            priority=3
        ),
        EmissionFactor(
            activity_type="coal",
            region="India",
            unit="kg",
            emission_factor=2.38,
            source="CEA",
            year=2024,
            priority=1
        ),
    ])

    # --- MOBILE COMBUSTION (1.2) ---
    print("   🚗 Adding mobile combustion factors...")

    # Petrol (vehicles)
    factors.extend([
        EmissionFactor(
            activity_type="petrol",
            region="Global",
            unit="litre",
            emission_factor=2.30,
            source="DEFRA 2024",
            year=2024,
            priority=3
        ),
        EmissionFactor(
            activity_type="petrol",
            region="India",
            unit="litre",
            emission_factor=2.28,
            source="CPCB",
            year=2024,
            priority=1
        ),
    ])

    # CNG
    factors.extend([
        EmissionFactor(
            activity_type="cng",
            region="India",
            unit="kg",
            emission_factor=2.75,
            source="IPCC 2024",
            year=2024,
            priority=2
        ),
        EmissionFactor(
            activity_type="cng",
            region="Global",
            unit="kg",
            emission_factor=2.80,
            source="DEFRA 2024",
            year=2024,
            priority=3
        ),
    ])

    # --- FUGITIVE EMISSIONS (1.3) ---
    print("   ❄️  Adding refrigerant factors...")

    factors.extend([
        # R-134a (common in ACs)
        EmissionFactor(
            activity_type="refrigerant_r134a",
            region="Global",
            unit="kg",
            emission_factor=1430,
            source="IPCC AR6",
            year=2024,
            priority=1
        ),
        # R-410A (split ACs)
        EmissionFactor(
            activity_type="refrigerant_r410a",
            region="Global",
            unit="kg",
            emission_factor=2088,
            source="IPCC AR6",
            year=2024,
            priority=1
        ),
        # R-32 (newer ACs)
        EmissionFactor(
            activity_type="refrigerant_r32",
            region="Global",
            unit="kg",
            emission_factor=675,
            source="IPCC AR6",
            year=2024,
            priority=1
        ),
    ])

    # ========================================================================
    # SCOPE 2: INDIRECT EMISSIONS (ENERGY)
    # ========================================================================

    print("   ⚡ Adding electricity grid factors...")

    # --- ELECTRICITY - INDIA (State-wise) ---
    factors.extend([
        # All India average
        EmissionFactor(
            activity_type="electricity",
            region="India",
            unit="kWh",
            emission_factor=0.82,
            source="CEA 2023-24",
            year=2024,
            priority=1
        ),
        # Maharashtra
        EmissionFactor(
            activity_type="electricity",
            region="Maharashtra, India",
            unit="kWh",
            emission_factor=0.79,
            source="CEA 2023-24",
            year=2024,
            priority=1
        ),
        # Karnataka
        EmissionFactor(
            activity_type="electricity",
            region="Karnataka, India",
            unit="kWh",
            emission_factor=0.85,
            source="CEA 2023-24",
            year=2024,
            priority=1
        ),
        # Tamil Nadu
        EmissionFactor(
            activity_type="electricity",
            region="Tamil Nadu, India",
            unit="kWh",
            emission_factor=0.87,
            source="CEA 2023-24",
            year=2024,
            priority=1
        ),
        # Delhi
        EmissionFactor(
            activity_type="electricity",
            region="Delhi, India",
            unit="kWh",
            emission_factor=0.75,
            source="CEA 2023-24",
            year=2024,
            priority=1
        ),
        # Gujarat
        EmissionFactor(
            activity_type="electricity",
            region="Gujarat, India",
            unit="kWh",
            emission_factor=0.88,
            source="CEA 2023-24",
            year=2024,
            priority=1
        ),
    ])

    # --- ELECTRICITY - GLOBAL ---
    factors.extend([
        EmissionFactor(
            activity_type="electricity",
            region="Global",
            unit="kWh",
            emission_factor=0.475,
            source="IEA 2024",
            year=2024,
            priority=3
        ),
        EmissionFactor(
            activity_type="electricity",
            region="USA",
            unit="kWh",
            emission_factor=0.386,
            source="EPA 2024",
            year=2024,
            priority=2
        ),
        EmissionFactor(
            activity_type="electricity",
            region="UK",
            unit="kWh",
            emission_factor=0.193,
            source="DEFRA 2024",
            year=2024,
            priority=2
        ),
        EmissionFactor(
            activity_type="electricity",
            region="China",
            unit="kWh",
            emission_factor=0.581,
            source="IEA 2024",
            year=2024,
            priority=2
        ),
    ])

    # ========================================================================
    # SCOPE 3: VALUE CHAIN EMISSIONS
    # ========================================================================

    # --- CATEGORY 3.4 & 3.9: TRANSPORTATION & LOGISTICS ---
    print("   🚚 Adding logistics factors...")

    # Road Freight
    factors.extend([
        # Heavy goods vehicle (diesel truck)
        EmissionFactor(
            activity_type="freight_truck_heavy",
            region="India",
            unit="tonne-km",
            emission_factor=0.12,
            source="GLEC Framework",
            year=2024,
            priority=2
        ),
        EmissionFactor(
            activity_type="freight_truck_heavy",
            region="Global",
            unit="tonne-km",
            emission_factor=0.11,
            source="GLEC Framework",
            year=2024,
            priority=3
        ),
        # Light goods vehicle
        EmissionFactor(
            activity_type="freight_van",
            region="Global",
            unit="tonne-km",
            emission_factor=0.28,
            source="DEFRA 2024",
            year=2024,
            priority=3
        ),
    ])

    # Rail Freight
    factors.extend([
        EmissionFactor(
            activity_type="freight_rail",
            region="India",
            unit="tonne-km",
            emission_factor=0.03,
            source="Indian Railways",
            year=2024,
            priority=2
        ),
        EmissionFactor(
            activity_type="freight_rail",
            region="Global",
            unit="tonne-km",
            emission_factor=0.028,
            source="GLEC Framework",
            year=2024,
            priority=3
        ),
    ])

    # Sea Freight
    factors.extend([
        EmissionFactor(
            activity_type="freight_sea",
            region="Global",
            unit="tonne-km",
            emission_factor=0.011,
            source="IMO/GLEC",
            year=2024,
            priority=2
        ),
    ])

    # Air Freight
    factors.extend([
        EmissionFactor(
            activity_type="freight_air",
            region="Global",
            unit="tonne-km",
            emission_factor=1.09,
            source="DEFRA 2024",
            year=2024,
            priority=2
        ),
    ])

    # --- CATEGORY 3.6: BUSINESS TRAVEL ---
    print("   ✈️  Adding travel factors...")

    # Aviation
    factors.extend([
        # Domestic flights
        EmissionFactor(
            activity_type="flight_domestic",
            region="India",
            unit="km",
            emission_factor=0.18,
            source="DEFRA 2024",
            year=2024,
            priority=2
        ),
        # International economy
        EmissionFactor(
            activity_type="flight_international_economy",
            region="Global",
            unit="km",
            emission_factor=0.15,
            source="ICAO 2024",
            year=2024,
            priority=2
        ),
        # International business class
        EmissionFactor(
            activity_type="flight_international_business",
            region="Global",
            unit="km",
            emission_factor=0.43,
            source="ICAO 2024",
            year=2024,
            priority=2
        ),
        # Short haul (<500km)
        EmissionFactor(
            activity_type="flight_short_haul",
            region="Global",
            unit="km",
            emission_factor=0.25,
            source="DEFRA 2024",
            year=2024,
            priority=2
        ),
    ])

    # Rail Travel (Passenger)
    factors.extend([
        # India - AC classes
        EmissionFactor(
            activity_type="train_electric",
            region="India",
            unit="passenger-km",
            emission_factor=0.04,
            source="Indian Railways",
            year=2024,
            priority=1
        ),
        EmissionFactor(
            activity_type="train_electric",
            region="India",
            unit="km",
            emission_factor=0.04,
            source="Indian Railways",
            year=2024,
            priority=1
        ),
        # India - Sleeper/Non-AC
        EmissionFactor(
            activity_type="train_diesel",
            region="India",
            unit="passenger-km",
            emission_factor=0.06,
            source="Indian Railways",
            year=2024,
            priority=1
        ),
        EmissionFactor(
            activity_type="train_diesel",
            region="India",
            unit="km",
            emission_factor=0.06,
            source="Indian Railways",
            year=2024,
            priority=1
        ),
        # Global average
        EmissionFactor(
            activity_type="train_average",
            region="Global",
            unit="passenger-km",
            emission_factor=0.041,
            source="DEFRA 2024",
            year=2024,
            priority=3
        ),
        EmissionFactor(
            activity_type="train_average",
            region="Global",
            unit="km",
            emission_factor=0.041,
            source="DEFRA 2024",
            year=2024,
            priority=3
        ),
    ])

    # Taxi/Cab
    factors.extend([
        # Auto-rickshaw (CNG)
        EmissionFactor(
            activity_type="taxi_auto",
            region="India",
            unit="km",
            emission_factor=0.08,
            source="DEFRA 2024",
            year=2024,
            priority=2
        ),
        # Small car (Uber Go/Ola Micro)
        EmissionFactor(
            activity_type="taxi_mini",
            region="India",
            unit="km",
            emission_factor=0.12,
            source="DEFRA 2024",
            year=2024,
            priority=2
        ),
        # Medium car (sedan)
        EmissionFactor(
            activity_type="taxi_sedan",
            region="India",
            unit="km",
            emission_factor=0.18,
            source="DEFRA 2024",
            year=2024,
            priority=2
        ),
        # Large car (SUV)
        EmissionFactor(
            activity_type="taxi_suv",
            region="India",
            unit="km",
            emission_factor=0.25,
            source="DEFRA 2024",
            year=2024,
            priority=2
        ),
        # Premium sedan
        EmissionFactor(
            activity_type="taxi_prime",
            region="India",
            unit="km",
            emission_factor=0.20,
            source="DEFRA 2024",
            year=2024,
            priority=2
        ),
    ])

    # Hotel Accommodation
    factors.extend([
        EmissionFactor(
            activity_type="hotel_budget",
            region="Global",
            unit="night",
            emission_factor=10.0,
            source="HCMI 2024",
            year=2024,
            priority=3
        ),
        EmissionFactor(
            activity_type="hotel_economy",
            region="Global",
            unit="night",
            emission_factor=15.0,
            source="HCMI 2024",
            year=2024,
            priority=3
        ),
        EmissionFactor(
            activity_type="hotel_business",
            region="Global",
            unit="night",
            emission_factor=25.0,
            source="HCMI 2024",
            year=2024,
            priority=3
        ),
        EmissionFactor(
            activity_type="hotel_luxury",
            region="Global",
            unit="night",
            emission_factor=40.0,
            source="HCMI 2024",
            year=2024,
            priority=3
        ),
        # India-specific
        EmissionFactor(
            activity_type="hotel_economy",
            region="India",
            unit="night",
            emission_factor=12.0,
            source="India Hotel Association",
            year=2024,
            priority=2
        ),
    ])

    # --- CATEGORY 3.5: WASTE ---
    print("   ♻️  Adding waste disposal factors...")

    factors.extend([
        # Landfill
        EmissionFactor(
            activity_type="waste_landfill",
            region="India",
            unit="kg",
            emission_factor=0.95,
            source="IPCC 2024",
            year=2024,
            priority=2
        ),
        # Incineration
        EmissionFactor(
            activity_type="waste_incineration",
            region="Global",
            unit="kg",
            emission_factor=1.20,
            source="IPCC 2024",
            year=2024,
            priority=3
        ),
        # Recycling (avoided emissions)
        EmissionFactor(
            activity_type="waste_recycling",
            region="Global",
            unit="kg",
            emission_factor=0.02,
            source="DEFRA 2024",
            year=2024,
            priority=3
        ),
        # Composting
        EmissionFactor(
            activity_type="waste_composting",
            region="Global",
            unit="kg",
            emission_factor=0.05,
            source="IPCC 2024",
            year=2024,
            priority=3
        ),
    ])

    # --- CATEGORY 3.1: PURCHASED GOODS (SPEND-BASED) ---
    print("   📦 Adding spend-based factors...")

    factors.extend([
        # General goods (spend-based fallback)
        EmissionFactor(
            activity_type="spend_goods_general",
            region="India",
            unit="INR",
            emission_factor=0.15,  # kgCO2e per rupee
            source="EEIO India",
            year=2024,
            priority=3
        ),
        EmissionFactor(
            activity_type="spend_goods_general",
            region="USA",
            unit="USD",
            emission_factor=0.42,  # kgCO2e per dollar
            source="EPA EEIO",
            year=2024,
            priority=3
        ),
    ])

    # --- WATER & WASTEWATER ---
    print("   💧 Adding water factors...")

    factors.extend([
        EmissionFactor(
            activity_type="water_supply",
            region="India",
            unit="m3",
            emission_factor=0.34,
            source="WRI India",
            year=2024,
            priority=2
        ),
        EmissionFactor(
            activity_type="wastewater_treatment",
            region="India",
            unit="m3",
            emission_factor=0.71,
            source="IPCC 2024",
            year=2024,
            priority=2
        ),
    ])

    # ========================================================================
    # COMMIT TO DATABASE
    # ========================================================================

    db.add_all(factors)
    db.commit()

    # Print summary
    print(f"\n✅ Seeded {len(factors)} emission factors")
    print(f"\n📊 Summary by Source:")
    print(f"   • CEA (India): Electricity grid factors")
    print(f"   • CPCB (India): Fuel combustion")
    print(f"   • DEFRA UK: Transport & logistics")
    print(f"   • EPA USA: Electricity & EEIO")
    print(f"   • IPCC: Refrigerants, waste, water")
    print(f"   • IEA: Global electricity")
    print(f"   • GLEC: Freight & logistics")
    print(f"   • ICAO: Aviation")
    print(f"   • Indian Railways: Rail transport")
    print(f"   • HCMI: Hotel accommodation")

    db.close()


def seed_cbam_goods():
    """
    Seed initial CBAM goods catalog with common goods categories
    Based on EU CBAM regulation
    """
    from app.models import CBAMGoods
    
    db = SessionLocal()
    
    # Check if already seeded
    if db.query(CBAMGoods).count() > 0:
        print("✅ CBAM goods already exist")
        db.close()
        return
    
    print("🌱 Seeding CBAM goods catalog...")
    
    goods = [
        # Cement
        CBAMGoods(
            cn_code="2523",
            goods_category="Cement",
            description="Portland cement, aluminous cement, slag cement, supersulphate cement and similar hydraulic cements",
            is_complex_good=False
        ),
        # Iron & Steel
        CBAMGoods(
            cn_code="7201",
            goods_category="Iron & Steel",
            description="Pig iron and spiegeleisen in pigs, blocks or other primary forms",
            is_complex_good=False
        ),
        CBAMGoods(
            cn_code="7202",
            goods_category="Iron & Steel",
            description="Ferro-alloys",
            is_complex_good=False
        ),
        CBAMGoods(
            cn_code="7203",
            goods_category="Iron & Steel",
            description="Ferrous products obtained by direct reduction of iron ore",
            is_complex_good=False
        ),
        CBAMGoods(
            cn_code="7204",
            goods_category="Iron & Steel",
            description="Ferrous waste and scrap; remelting scrap ingots of iron or steel",
            is_complex_good=False
        ),
        # Aluminium
        CBAMGoods(
            cn_code="7601",
            goods_category="Aluminium",
            description="Unwrought aluminium",
            is_complex_good=False
        ),
        CBAMGoods(
            cn_code="7602",
            goods_category="Aluminium",
            description="Aluminium waste and scrap",
            is_complex_good=False
        ),
        # Fertilisers
        CBAMGoods(
            cn_code="3102",
            goods_category="Fertilisers",
            description="Mineral or chemical fertilisers, nitrogenous",
            is_complex_good=False
        ),
        CBAMGoods(
            cn_code="3105",
            goods_category="Fertilisers",
            description="Mineral or chemical fertilisers containing two or three of the fertilising elements nitrogen, phosphorus and potassium",
            is_complex_good=False
        ),
        # Electricity
        CBAMGoods(
            cn_code="2716",
            goods_category="Electricity",
            description="Electrical energy",
            is_complex_good=False
        ),
        # Hydrogen
        CBAMGoods(
            cn_code="2804",
            goods_category="Hydrogen",
            description="Hydrogen, rare gases and other non-metals",
            is_complex_good=False
        ),
    ]
    
    db.add_all(goods)
    db.commit()
    
    print(f"✅ Seeded {len(goods)} CBAM goods")
    db.close()


if __name__ == "__main__":
    # Run this to initialize database
    init_db()
    seed_emission_factors()
    seed_cbam_goods()