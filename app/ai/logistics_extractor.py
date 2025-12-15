# app/ai/logistics_extractor.py
"""
Logistics & Freight Invoice Extractor
======================================
Extracts shipping/courier data from invoices and waybills
Scope 3.4 - Upstream Transportation & Distribution
Scope 3.9 - Downstream Transportation & Distribution
"""
from openai import OpenAI
import json
import re
from typing import Dict, List
from datetime import datetime
from app.config import OPENAI_API_KEY, EXTRACTION_MODEL

client = OpenAI(api_key=OPENAI_API_KEY)


def extract_logistics_invoice(file_content: str, file_type: str = "text") -> Dict:
    """
    Extract logistics/courier data from invoices

    Supports:
    - DHL, FedEx, UPS invoices
    - Blue Dart, DTDC, India Post
    - Container shipping bills (FCL/LCL)
    - Freight trucking invoices
    - Last-mile delivery

    Args:
        file_content: Text content from document
        file_type: "text" or "image_base64"

    Returns:
        {
            'success': bool,
            'data': {
                'carrier': str,  # DHL, FedEx, Blue Dart, etc.
                'tracking_number': str,
                'date': 'YYYY-MM-DD',
                'from_location': str,
                'to_location': str,
                'distance_km': float,
                'weight_kg': float,
                'transport_mode': str,  # air/road/sea/rail
                'service_type': str,  # express/standard/economy
                'total_cost': float,
                'currency': str
            },
            'emissions': {
                'total_kgco2e': float,
                'per_tonne_km': float,
                'calculation_method': str
            },
            'scope': str,
            'category': str
        }
    """

    print("\n🚚 Extracting logistics invoice data...")

    try:
        # Extract structured data with AI
        extracted_data = extract_with_ai(file_content)

        if not extracted_data.get('success'):
            return extracted_data

        data = extracted_data['data']

        # Validate and enhance data
        data = validate_logistics_data(data)

        # Calculate emissions
        emissions = calculate_logistics_emissions(data)

        # Determine scope (upstream vs downstream)
        scope, category = determine_logistics_scope(data)

        print(f"   ✅ Extracted: {data.get('carrier', 'Unknown')} shipment")
        print(f"   📦 Weight: {data.get('weight_kg', 0):.1f} kg")
        print(f"   📏 Distance: {data.get('distance_km', 0):.0f} km")
        print(f"   🌍 Emissions: {emissions['total_kgco2e']:.2f} kgCO2e")

        return {
            'success': True,
            'data': data,
            'emissions': emissions,
            'scope': scope,
            'category': category,
            'sub_category': '3.4' if scope == 'Scope 3' and 'Upstream' in category else '3.9'
        }

    except Exception as e:
        print(f"   ❌ Error: {e}")
        return {
            'success': False,
            'error': str(e)
        }


def extract_with_ai(text_content: str) -> Dict:
    """Use ChatGPT to extract structured logistics data"""

    prompt = f"""
Extract logistics/courier shipment details from this invoice or waybill.

DOCUMENT TEXT:
{text_content[:8000]}

Return ONLY valid JSON (no markdown, no ```json):
{{
    "carrier": "DHL" or "FedEx" or "Blue Dart" or "DTDC" or "India Post" or "UPS" or "Truck" or "Container Ship",
    "tracking_number": "Tracking/AWB/Waybill number",
    "date": "YYYY-MM-DD",
    "from_location": "Origin city/country",
    "to_location": "Destination city/country",
    "distance_km": 1200,
    "weight_kg": 25.5,
    "volume_m3": 0.5,
    "transport_mode": "air" or "road" or "sea" or "rail",
    "service_type": "express" or "standard" or "economy",
    "total_cost": 1500.00,
    "currency": "INR" or "USD" etc,
    "shipment_type": "parcel" or "pallet" or "container" or "ltl" or "ftl"
}}

TRANSPORT MODE DETECTION:
- If carrier is DHL Express, FedEx, Blue Dart → "air"
- If carrier is DHL eCommerce, DTDC Surface → "road"
- If mentions "container", "FCL", "LCL", "vessel" → "sea"
- If mentions "train", "railway" → "rail"

DISTANCE ESTIMATION (if not mentioned):
- Use from/to locations to estimate
- Mumbai-Delhi: 1400 km
- Delhi-Bangalore: 2100 km
- Mumbai-Chennai: 1300 km
- Mumbai-Kolkata: 1900 km
- International (India-US): 13000 km
- International (India-Europe): 7000 km
- International (India-Asia): 4000 km

WEIGHT EXTRACTION:
- Look for "Weight:", "Gross Weight:", "Chargeable Weight:"
- Convert all to kg (1 lb = 0.453592 kg)

SERVICE TYPE:
- Express/Overnight/Priority → "express"
- Standard/Regular → "standard"
- Economy/Ground/Surface → "economy"

Return ONLY the JSON object.
"""

    try:
        response = client.chat.completions.create(
            model=EXTRACTION_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert at extracting logistics data from shipping invoices and waybills. Return only valid JSON."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.1,
            max_tokens=1000
        )

        result_text = response.choices[0].message.content.strip()

        # Clean JSON
        if result_text.startswith('```json'):
            result_text = result_text[7:]
        if result_text.startswith('```'):
            result_text = result_text[3:]
        if result_text.endswith('```'):
            result_text = result_text[:-3]

        data = json.loads(result_text.strip())

        return {
            'success': True,
            'data': data
        }

    except Exception as e:
        return {
            'success': False,
            'error': f'AI extraction failed: {str(e)}'
        }


def validate_logistics_data(data: Dict) -> Dict:
    """Validate and enhance logistics data"""

    # Estimate distance if not provided
    if data.get('distance_km', 0) == 0:
        distance = estimate_distance(
            data.get('from_location', ''),
            data.get('to_location', '')
        )
        data['distance_km'] = distance
        data['distance_estimated'] = True

    # Default weight if missing (use cost-based estimate)
    if data.get('weight_kg', 0) == 0:
        cost = data.get('total_cost', 0)
        # Rough estimate: ₹50-100 per kg for domestic courier
        if cost > 0:
            data['weight_kg'] = cost / 75
            data['weight_estimated'] = True
        else:
            data['weight_kg'] = 5  # Default to 5kg parcel

    # Infer transport mode if missing
    if not data.get('transport_mode'):
        carrier = data.get('carrier', '').lower()

        if any(word in carrier for word in ['express', 'fedex', 'blue dart', 'air']):
            data['transport_mode'] = 'air'
        elif any(word in carrier for word in ['surface', 'road', 'truck', 'ground']):
            data['transport_mode'] = 'road'
        elif any(word in carrier for word in ['container', 'ship', 'sea', 'ocean']):
            data['transport_mode'] = 'sea'
        else:
            # Default based on distance
            distance = data.get('distance_km', 0)
            if distance > 5000:
                data['transport_mode'] = 'air'  # Long distance likely air
            else:
                data['transport_mode'] = 'road'  # Short distance likely road

    # Infer service type if missing
    if not data.get('service_type'):
        carrier = data.get('carrier', '').lower()

        if any(word in carrier for word in ['express', 'priority', 'overnight']):
            data['service_type'] = 'express'
        elif any(word in carrier for word in ['economy', 'surface', 'ground']):
            data['service_type'] = 'economy'
        else:
            data['service_type'] = 'standard'

    return data


def estimate_distance(from_location: str, to_location: str) -> float:
    """Estimate distance between two locations"""

    from_lower = from_location.lower()
    to_lower = to_location.lower()

    # Major Indian city distances (km)
    indian_distances = {
        ('mumbai', 'delhi'): 1400,
        ('delhi', 'mumbai'): 1400,
        ('mumbai', 'bangalore'): 1000,
        ('bangalore', 'mumbai'): 1000,
        ('mumbai', 'chennai'): 1300,
        ('chennai', 'mumbai'): 1300,
        ('mumbai', 'kolkata'): 1900,
        ('kolkata', 'mumbai'): 1900,
        ('delhi', 'bangalore'): 2100,
        ('bangalore', 'delhi'): 2100,
        ('delhi', 'chennai'): 2200,
        ('chennai', 'delhi'): 2200,
        ('delhi', 'kolkata'): 1500,
        ('kolkata', 'delhi'): 1500,
        ('bangalore', 'chennai'): 350,
        ('chennai', 'bangalore'): 350,
        ('mumbai', 'pune'): 150,
        ('pune', 'mumbai'): 150,
        ('delhi', 'jaipur'): 280,
        ('jaipur', 'delhi'): 280,
    }

    # Check for city pair match
    for (city1, city2), distance in indian_distances.items():
        if city1 in from_lower and city2 in to_lower:
            return distance
        if city2 in from_lower and city1 in to_lower:
            return distance

    # International estimates
    if any(country in from_lower or country in to_lower for country in ['usa', 'america', 'us']):
        return 13000  # India-USA

    if any(country in from_lower or country in to_lower for country in ['uk', 'europe', 'germany', 'france']):
        return 7000  # India-Europe

    if any(country in from_lower or country in to_lower for country in ['china', 'japan', 'singapore', 'thailand']):
        return 4000  # India-Asia

    # Default: 500 km (local delivery)
    return 500


def calculate_logistics_emissions(data: Dict) -> Dict:
    """
    Calculate emissions from logistics/freight

    Emission factors (per tonne-km):
    - Air freight: 1.09 kgCO2e/tonne-km
    - Heavy truck: 0.11 kgCO2e/tonne-km
    - Light truck/van: 0.28 kgCO2e/tonne-km
    - Rail freight: 0.03 kgCO2e/tonne-km
    - Sea freight: 0.011 kgCO2e/tonne-km

    Sources: GLEC Framework, DEFRA 2024
    """

    # Emission factors (kgCO2e per tonne-km)
    FREIGHT_EMISSION_FACTORS = {
        'air': 1.09,
        'air_express': 1.50,  # Express air has higher emissions
        'road_heavy': 0.11,  # Heavy goods vehicle (>7.5t)
        'road_light': 0.28,  # Light goods vehicle (<3.5t)
        'road_van': 0.35,  # Delivery van
        'sea': 0.011,  # Container ship
        'rail': 0.03  # Rail freight
    }

    transport_mode = data.get('transport_mode', 'road')
    service_type = data.get('service_type', 'standard')
    weight_kg = data.get('weight_kg', 0)
    distance_km = data.get('distance_km', 0)
    shipment_type = data.get('shipment_type', 'parcel')

    # Convert weight to tonnes
    weight_tonnes = weight_kg / 1000

    # Determine specific emission factor
    if transport_mode == 'air':
        if service_type == 'express':
            ef = FREIGHT_EMISSION_FACTORS['air_express']
        else:
            ef = FREIGHT_EMISSION_FACTORS['air']

    elif transport_mode == 'road':
        # Determine vehicle type based on shipment
        if shipment_type in ['ftl', 'container'] or weight_kg > 1000:
            ef = FREIGHT_EMISSION_FACTORS['road_heavy']
        elif shipment_type in ['parcel', 'package'] and weight_kg < 50:
            ef = FREIGHT_EMISSION_FACTORS['road_van']
        else:
            ef = FREIGHT_EMISSION_FACTORS['road_light']

    elif transport_mode == 'sea':
        ef = FREIGHT_EMISSION_FACTORS['sea']

    elif transport_mode == 'rail':
        ef = FREIGHT_EMISSION_FACTORS['rail']

    else:
        ef = FREIGHT_EMISSION_FACTORS['road_light']  # Default

    # Calculate tonne-km
    tonne_km = weight_tonnes * distance_km

    # Calculate total emissions
    total_emissions = ef * tonne_km

    return {
        'total_kgco2e': round(total_emissions, 2),
        'per_tonne_km_kgco2e': ef,
        'tonne_km': round(tonne_km, 2),
        'weight_tonnes': round(weight_tonnes, 3),
        'distance_km': distance_km,
        'transport_mode': transport_mode,
        'calculation_method': f"{weight_tonnes:.3f} tonnes × {distance_km} km × {ef} kgCO2e/tonne-km",
        'emission_factor_source': 'GLEC Framework / DEFRA 2024',
        'notes': f'{transport_mode.capitalize()} freight - {service_type}'
    }


def determine_logistics_scope(data: Dict) -> tuple:
    """
    Determine if logistics is upstream (3.4) or downstream (3.9)

    Heuristics:
    - Inbound/receiving/purchased goods → Scope 3.4 (Upstream)
    - Outbound/delivery/sold goods → Scope 3.9 (Downstream)
    - If unclear, default to Upstream (3.4)
    """

    # Check carrier and shipment context
    carrier = data.get('carrier', '').lower()
    from_loc = data.get('from_location', '').lower()
    to_loc = data.get('to_location', '').lower()

    # Keywords indicating outbound (downstream)
    outbound_keywords = [
        'delivery', 'dispatch', 'outbound', 'shipped to customer',
        'customer delivery', 'fulfillment', 'distribution'
    ]

    # Keywords indicating inbound (upstream)
    inbound_keywords = [
        'receiving', 'inbound', 'purchased', 'supplier',
        'procurement', 'incoming', 'vendor'
    ]

    text_to_check = f"{carrier} {from_loc} {to_loc}".lower()

    # Check for keywords
    if any(kw in text_to_check for kw in outbound_keywords):
        return 'Scope 3', 'Downstream Transportation & Distribution'

    if any(kw in text_to_check for kw in inbound_keywords):
        return 'Scope 3', 'Upstream Transportation & Distribution'

    # Default to Upstream (more common for expense tracking)
    return 'Scope 3', 'Upstream Transportation & Distribution'


def add_logistics_emission_factors_to_db():
    """
    Add logistics emission factors to database
    Run this once to populate emission_factors table
    """
    from app.database import SessionLocal
    from app.models import EmissionFactor

    db = SessionLocal()

    # Check if already exists
    existing = db.query(EmissionFactor).filter(
        EmissionFactor.activity_type == 'freight_air'
    ).first()

    if existing:
        print("✅ Logistics emission factors already in database")
        db.close()
        return

    print("🚚 Adding logistics emission factors to database...")

    factors = [
        # Air freight
        EmissionFactor(
            activity_type='freight_air',
            region='Global',
            unit='tonne-km',
            emission_factor=1.09,
            source='DEFRA 2024',
            year=2024,
            priority=2
        ),
        # Heavy truck
        EmissionFactor(
            activity_type='freight_truck_heavy',
            region='India',
            unit='tonne-km',
            emission_factor=0.12,
            source='GLEC Framework',
            year=2024,
            priority=2
        ),
        EmissionFactor(
            activity_type='freight_truck_heavy',
            region='Global',
            unit='tonne-km',
            emission_factor=0.11,
            source='GLEC Framework',
            year=2024,
            priority=3
        ),
        # Light truck/van
        EmissionFactor(
            activity_type='freight_van',
            region='Global',
            unit='tonne-km',
            emission_factor=0.28,
            source='DEFRA 2024',
            year=2024,
            priority=3
        ),
        # Rail freight
        EmissionFactor(
            activity_type='freight_rail',
            region='India',
            unit='tonne-km',
            emission_factor=0.03,
            source='Indian Railways',
            year=2024,
            priority=2
        ),
        EmissionFactor(
            activity_type='freight_rail',
            region='Global',
            unit='tonne-km',
            emission_factor=0.028,
            source='GLEC Framework',
            year=2024,
            priority=3
        ),
        # Sea freight
        EmissionFactor(
            activity_type='freight_sea',
            region='Global',
            unit='tonne-km',
            emission_factor=0.011,
            source='IMO/GLEC',
            year=2024,
            priority=2
        ),
    ]

    db.add_all(factors)
    db.commit()

    print(f"✅ Added {len(factors)} logistics emission factors")
    db.close()


# ============================================================================
# TESTING
# ============================================================================

if __name__ == "__main__":
    # Test 1: DHL Express invoice
    dhl_sample = """
    DHL EXPRESS INVOICE
    Tracking Number: 1234567890

    Date: March 15, 2024
    From: Mumbai, India
    To: Delhi, India

    Weight: 15.5 kg
    Service: Express Air

    Total Charges: ₹2,450
    """

    # Test 2: Blue Dart surface
    bluedart_sample = """
    BLUE DART SURFACE CONSIGNMENT NOTE
    AWB Number: BD98765432

    Booking Date: 16/03/2024
    Origin: Bangalore
    Destination: Chennai

    Actual Weight: 25 kg
    Service Type: Surface
    Amount: ₹850
    """

    # Test 3: Container shipping
    container_sample = """
    CONTAINER SHIPPING BILL
    B/L Number: MAEU123456789

    Date: 2024-03-20
    Port of Loading: Mumbai (INNSA)
    Port of Discharge: Hamburg, Germany

    Container Type: 20' FCL
    Gross Weight: 15,000 kg
    Freight Charges: $1,200
    """

    print("\n" + "=" * 70)
    print("TEST 1: DHL EXPRESS")
    print("=" * 70)
    result1 = extract_logistics_invoice(dhl_sample)
    print(json.dumps(result1, indent=2))

    print("\n" + "=" * 70)
    print("TEST 2: BLUE DART SURFACE")
    print("=" * 70)
    result2 = extract_logistics_invoice(bluedart_sample)
    print(json.dumps(result2, indent=2))

    print("\n" + "=" * 70)
    print("TEST 3: CONTAINER SHIPPING")
    print("=" * 70)
    result3 = extract_logistics_invoice(container_sample)
    print(json.dumps(result3, indent=2))

    # Add emission factors to database
    print("\n" + "=" * 70)
    add_logistics_emission_factors_to_db()