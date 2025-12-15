# app/ai/cab_extractor.py
"""
Cab Receipt Extractor
Extracts taxi/ride-hailing data from receipts and invoices
Scope 3.6 - Business Travel (Ground Transportation)
"""
from openai import OpenAI
import json
import re
from typing import Dict
from datetime import datetime
from app.config import OPENAI_API_KEY, EXTRACTION_MODEL

client = OpenAI(api_key=OPENAI_API_KEY)


def extract_cab_receipt(file_content: str, file_type: str = "text") -> Dict:
    """
    Extract cab/taxi ride data from receipts

    Supports:
    - Uber invoices
    - Ola receipts
    - Manual taxi bills
    - Auto-rickshaw receipts
    - Corporate cab bookings

    Args:
        file_content: Text content from document
        file_type: "text" or "image_base64"

    Returns:
        {
            'success': bool,
            'data': {
                'service_provider': str,  # Uber, Ola, Manual Taxi, Auto
                'trip_id': str,
                'date': 'YYYY-MM-DD',
                'pickup_location': str,
                'dropoff_location': str,
                'distance_km': float,
                'vehicle_type': str,  # auto/mini/sedan/suv/xl/prime
                'fare_amount': float,
                'currency': str
            },
            'emissions': {
                'total_kgco2e': float,
                'per_km_kgco2e': float,
                'calculation_method': str
            }
        }
    """

    print("\n🚕 Extracting cab receipt data...")

    try:
        # Extract structured data with AI
        extracted_data = extract_with_ai(file_content)

        if not extracted_data.get('success'):
            return extracted_data

        data = extracted_data['data']

        # Validate and clean data
        data = validate_cab_data(data)

        # Calculate emissions
        emissions = calculate_cab_emissions(data)

        print(f"   ✅ Extracted: {data.get('service_provider', 'Taxi')} ride")
        print(f"   📍 Distance: {data.get('distance_km', 0):.1f} km")
        print(f"   🌍 Emissions: {emissions['total_kgco2e']:.2f} kgCO2e")

        return {
            'success': True,
            'data': data,
            'emissions': emissions,
            'scope': 'Scope 3',
            'category': 'Business Travel',
            'sub_category': '3.6'
        }

    except Exception as e:
        print(f"   ❌ Error: {e}")
        return {
            'success': False,
            'error': str(e)
        }


def extract_with_ai(text_content: str) -> Dict:
    """Use ChatGPT to extract structured cab data"""

    prompt = f"""
Extract cab/taxi ride details from this receipt or invoice.

DOCUMENT TEXT:
{text_content[:8000]}

Return ONLY valid JSON (no markdown, no ```json):
{{
    "service_provider": "Uber" or "Ola" or "Manual Taxi" or "Auto-rickshaw" or "Corporate Cab",
    "trip_id": "Trip/booking ID",
    "date": "YYYY-MM-DD",
    "time": "HH:MM",
    "pickup_location": "Starting point address",
    "dropoff_location": "Ending point address",
    "distance_km": 15.5,
    "vehicle_type": "auto/mini/sedan/suv/xl/prime",
    "fare_amount": 350.00,
    "currency": "INR"
}}

VEHICLE TYPE CLASSIFICATION:
- auto: Auto-rickshaw (3-wheeler)
- mini: Hatchback/small cars (Uber Go, Ola Micro)
- sedan: Standard sedans (Uber X, Ola Prime)
- suv: SUVs/large cars (Uber XL, Ola Lux)
- xl: Extra large vehicles (Uber XL)
- prime: Premium sedans (Ola Prime Sedan, Uber Premier)

DISTANCE EXTRACTION:
- Look for: "Distance: X km" or "Trip distance" or "Kms"
- If not found, try to estimate from fare (₹12-15 per km for sedan in India)

SERVICE PROVIDER DETECTION:
- If document contains "Uber" → "Uber"
- If document contains "Ola" → "Ola"
- If document contains "Auto" or "Rickshaw" → "Auto-rickshaw"
- Otherwise → "Manual Taxi"

Return ONLY the JSON object.
"""

    try:
        response = client.chat.completions.create(
            model=EXTRACTION_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert at extracting taxi/cab ride data from receipts and invoices. Return only valid JSON."
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


def validate_cab_data(data: Dict) -> Dict:
    """Validate and clean cab data"""

    # Estimate distance if not provided
    if data.get('distance_km', 0) == 0:
        fare = data.get('fare_amount', 0)
        vehicle_type = data.get('vehicle_type', 'sedan')

        # Average fare per km in India (rough estimates)
        fare_per_km = {
            'auto': 12,
            'mini': 10,
            'sedan': 15,
            'suv': 20,
            'xl': 22,
            'prime': 18
        }

        if fare > 0:
            rate = fare_per_km.get(vehicle_type, 15)
            data['distance_km'] = round(fare / rate, 1)
            data['distance_estimated'] = True

    # Normalize vehicle type
    vehicle_type = data.get('vehicle_type', '').lower()
    if 'auto' in vehicle_type or 'rickshaw' in vehicle_type:
        data['vehicle_type'] = 'auto'
    elif 'mini' in vehicle_type or 'micro' in vehicle_type or 'go' in vehicle_type:
        data['vehicle_type'] = 'mini'
    elif 'suv' in vehicle_type or 'xl' in vehicle_type:
        data['vehicle_type'] = 'suv'
    elif 'prime' in vehicle_type or 'premier' in vehicle_type:
        data['vehicle_type'] = 'prime'
    else:
        data['vehicle_type'] = 'sedan'  # Default

    # Ensure service provider is set
    if not data.get('service_provider'):
        # Try to detect from trip_id or other fields
        text_all = str(data).lower()
        if 'uber' in text_all:
            data['service_provider'] = 'Uber'
        elif 'ola' in text_all:
            data['service_provider'] = 'Ola'
        elif data['vehicle_type'] == 'auto':
            data['service_provider'] = 'Auto-rickshaw'
        else:
            data['service_provider'] = 'Manual Taxi'

    return data


def calculate_cab_emissions(data: Dict) -> Dict:
    """
    Calculate emissions from cab/taxi ride

    Emission factors (per passenger-km):
    - Auto-rickshaw (CNG): 0.08 kgCO2e/km
    - Mini/Hatchback (petrol): 0.12 kgCO2e/km
    - Sedan (petrol): 0.18 kgCO2e/km
    - SUV (diesel): 0.25 kgCO2e/km
    - Prime/Premium: 0.20 kgCO2e/km

    Sources:
    - DEFRA UK 2024 (adjusted for India)
    - Indian taxi fleet average
    - GHG Protocol guidelines
    """

    # Emission factors (kgCO2e per km)
    CAB_EMISSION_FACTORS = {
        'auto': 0.08,  # CNG auto-rickshaw
        'mini': 0.12,  # Small petrol cars
        'sedan': 0.18,  # Standard sedan
        'suv': 0.25,  # Large SUV/diesel
        'xl': 0.25,  # Extra large
        'prime': 0.20  # Premium sedan
    }

    vehicle_type = data.get('vehicle_type', 'sedan')
    distance_km = data.get('distance_km', 0)

    # Get emission factor
    ef_per_km = CAB_EMISSION_FACTORS.get(vehicle_type, 0.18)

    # Calculate total emissions
    total_emissions = ef_per_km * distance_km

    # Service provider adjustment (ride-sharing has lower per-passenger emissions)
    service = data.get('service_provider', '')
    if 'uber pool' in service.lower() or 'ola share' in service.lower():
        # Shared rides have ~50% lower per-passenger emissions
        total_emissions *= 0.5
        calc_note = "Shared ride (50% allocation)"
    else:
        calc_note = "Single passenger"

    return {
        'total_kgco2e': round(total_emissions, 2),
        'per_km_kgco2e': ef_per_km,
        'distance_km': distance_km,
        'vehicle_type': vehicle_type,
        'calculation_method': f"{distance_km} km × {ef_per_km} kgCO2e/km",
        'emission_factor_source': 'DEFRA 2024 (India adjusted)',
        'notes': f'{vehicle_type.capitalize()} taxi - {calc_note}'
    }


def add_cab_emission_factors_to_db():
    """
    Add cab/taxi emission factors to database
    Run this once to populate emission_factors table
    """
    from app.database import SessionLocal
    from app.models import EmissionFactor

    db = SessionLocal()

    # Check if already exists
    existing = db.query(EmissionFactor).filter(
        EmissionFactor.activity_type == 'taxi_auto'
    ).first()

    if existing:
        print("✅ Cab emission factors already in database")
        db.close()
        return

    print("🚕 Adding cab emission factors to database...")

    factors = [
        EmissionFactor(
            activity_type='taxi_auto',
            region='India',
            unit='km',
            emission_factor=0.08,
            source='DEFRA 2024',
            year=2024,
            priority=2
        ),
        EmissionFactor(
            activity_type='taxi_mini',
            region='India',
            unit='km',
            emission_factor=0.12,
            source='DEFRA 2024',
            year=2024,
            priority=2
        ),
        EmissionFactor(
            activity_type='taxi_sedan',
            region='India',
            unit='km',
            emission_factor=0.18,
            source='DEFRA 2024',
            year=2024,
            priority=2
        ),
        EmissionFactor(
            activity_type='taxi_suv',
            region='India',
            unit='km',
            emission_factor=0.25,
            source='DEFRA 2024',
            year=2024,
            priority=2
        ),
        EmissionFactor(
            activity_type='taxi_prime',
            region='India',
            unit='km',
            emission_factor=0.20,
            source='DEFRA 2024',
            year=2024,
            priority=2
        ),
        # Global average for comparison
        EmissionFactor(
            activity_type='taxi_sedan',
            region='Global',
            unit='km',
            emission_factor=0.21,
            source='DEFRA 2024',
            year=2024,
            priority=3
        )
    ]

    db.add_all(factors)
    db.commit()

    print(f"✅ Added {len(factors)} cab emission factors")
    db.close()


# ============================================================================
# TESTING
# ============================================================================

if __name__ == "__main__":
    # Test 1: Uber receipt
    uber_sample = """
    UBER TRIP RECEIPT
    Trip ID: ABC123XYZ
    Date: March 15, 2024
    Time: 10:30 AM

    Pickup: Andheri Station, Mumbai
    Dropoff: BKC, Mumbai

    Distance: 12.5 km
    Vehicle: Uber Go (Mini)
    Fare: ₹185

    Thank you for riding with Uber!
    """

    # Test 2: Ola receipt
    ola_sample = """
    OLA RIDE INVOICE
    Booking #OLA456789
    March 16, 2024

    From: Koramangala, Bangalore
    To: Whitefield, Bangalore

    Trip Distance: 18.2 km
    Car Type: Ola Prime Sedan
    Total Fare: ₹320
    """

    # Test 3: Auto-rickshaw
    auto_sample = """
    AUTO RICKSHAW RECEIPT
    Date: 17/03/2024

    From: Connaught Place
    To: Dwarka
    Distance: 8 km
    Fare: ₹95
    """

    print("\n" + "=" * 70)
    print("TEST 1: UBER RECEIPT")
    print("=" * 70)
    result1 = extract_cab_receipt(uber_sample)
    print(json.dumps(result1, indent=2))

    print("\n" + "=" * 70)
    print("TEST 2: OLA RECEIPT")
    print("=" * 70)
    result2 = extract_cab_receipt(ola_sample)
    print(json.dumps(result2, indent=2))

    print("\n" + "=" * 70)
    print("TEST 3: AUTO-RICKSHAW")
    print("=" * 70)
    result3 = extract_cab_receipt(auto_sample)
    print(json.dumps(result3, indent=2))

    # Add emission factors to database
    print("\n" + "=" * 70)
    add_cab_emission_factors_to_db()