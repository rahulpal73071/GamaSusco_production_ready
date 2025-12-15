# app/ai/train_extractor.py
"""
Train Ticket Extractor
Extracts rail travel data from train tickets and bookings
Scope 3.6 - Business Travel (Rail Transportation)
"""
from openai import OpenAI
import json
import re
from typing import Dict
from datetime import datetime
from app.config import OPENAI_API_KEY, EXTRACTION_MODEL

client = OpenAI(api_key=OPENAI_API_KEY)


def extract_train_ticket(file_content: str, file_type: str = "text") -> Dict:
    """
    Extract train journey data from tickets

    Supports:
    - IRCTC e-tickets
    - MakeMyTrip bookings
    - Cleartrip bookings
    - Manual train tickets

    Args:
        file_content: Text content from document
        file_type: "text" or "image_base64"

    Returns:
        {
            'success': bool,
            'data': {
                'pnr_number': str,
                'train_number': str,
                'train_name': str,
                'date': 'YYYY-MM-DD',
                'from_station': str,
                'to_station': str,
                'distance_km': float,
                'class': str,  # 1A/2A/3A/SL/CC/2S
                'passenger_count': int,
                'fare_amount': float,
                'booking_reference': str
            },
            'emissions': {
                'total_kgco2e': float,
                'per_passenger_km_kgco2e': float,
                'calculation_method': str
            }
        }
    """

    print("\n🚂 Extracting train ticket data...")

    try:
        # Extract structured data with AI
        extracted_data = extract_with_ai(file_content)

        if not extracted_data.get('success'):
            return extracted_data

        data = extracted_data['data']

        # Validate and clean data
        data = validate_train_data(data)

        # Calculate emissions
        emissions = calculate_train_emissions(data)

        print(f"   ✅ Extracted: {data.get('train_name', 'Train')} journey")
        print(f"   📍 Distance: {data.get('distance_km', 0):.0f} km")
        print(f"   👥 Passengers: {data.get('passenger_count', 1)}")
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
    """Use ChatGPT to extract structured train data"""

    prompt = f"""
Extract train journey details from this ticket or booking confirmation.

DOCUMENT TEXT:
{text_content[:8000]}

Return ONLY valid JSON (no markdown, no ```json):
{{
    "pnr_number": "10-digit PNR",
    "train_number": "12345",
    "train_name": "Full train name",
    "date": "YYYY-MM-DD",
    "from_station": "Starting station name",
    "to_station": "Destination station name",
    "distance_km": 1400,
    "class": "1A/2A/3A/SL/CC/2S",
    "passenger_count": 1,
    "fare_amount": 1500.00,
    "booking_reference": "Booking ID"
}}

TRAIN CLASS CODES:
- 1A: First Class AC
- 2A: Second Class AC (2-tier)
- 3A: Third Class AC (3-tier)
- SL: Sleeper Class
- CC: AC Chair Car
- 2S: Second Seating

DISTANCE ESTIMATION:
- Look for "Distance: X km" or similar
- If not found, estimate from major city pairs:
  - Mumbai-Delhi: 1400 km
  - Delhi-Kolkata: 1500 km
  - Mumbai-Bangalore: 1000 km
  - Delhi-Chennai: 2200 km
  - Bangalore-Chennai: 350 km

If passenger count not mentioned, assume 1.

Return ONLY the JSON object.
"""

    try:
        response = client.chat.completions.create(
            model=EXTRACTION_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert at extracting train journey data from tickets and bookings. Return only valid JSON."
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


def validate_train_data(data: Dict) -> Dict:
    """Validate and clean train data"""

    # Estimate distance if not provided
    if data.get('distance_km', 0) == 0:
        # Try to estimate from station names
        from_station = data.get('from_station', '').lower()
        to_station = data.get('to_station', '').lower()

        # Major city pair distances (rough estimates)
        city_distances = {
            ('mumbai', 'delhi'): 1400,
            ('delhi', 'mumbai'): 1400,
            ('delhi', 'kolkata'): 1500,
            ('kolkata', 'delhi'): 1500,
            ('mumbai', 'bangalore'): 1000,
            ('bangalore', 'mumbai'): 1000,
            ('delhi', 'chennai'): 2200,
            ('chennai', 'delhi'): 2200,
            ('bangalore', 'chennai'): 350,
            ('chennai', 'bangalore'): 350,
            ('mumbai', 'pune'): 150,
            ('pune', 'mumbai'): 150,
            ('delhi', 'jaipur'): 280,
            ('jaipur', 'delhi'): 280
        }

        # Try to find matching city pair
        for (city1, city2), distance in city_distances.items():
            if city1 in from_station and city2 in to_station:
                data['distance_km'] = distance
                data['distance_estimated'] = True
                break

        # If still not found, use fare-based estimate
        if data.get('distance_km', 0) == 0 and data.get('fare_amount', 0) > 0:
            # Rough estimate: ₹0.50-1.00 per km depending on class
            fare = data['fare_amount']
            data['distance_km'] = round(fare / 0.75, 0)
            data['distance_estimated'] = True

    # Normalize class code
    train_class = data.get('class', '').upper()
    valid_classes = ['1A', '2A', '3A', 'SL', 'CC', '2S', 'EC']
    if train_class not in valid_classes:
        # Try to extract from text
        if 'first' in train_class.lower() or '1a' in train_class.lower():
            data['class'] = '1A'
        elif '2a' in train_class.lower() or 'second ac' in train_class.lower():
            data['class'] = '2A'
        elif '3a' in train_class.lower() or 'third ac' in train_class.lower():
            data['class'] = '3A'
        elif 'sleeper' in train_class.lower() or 'sl' in train_class.lower():
            data['class'] = 'SL'
        elif 'chair' in train_class.lower() or 'cc' in train_class.lower():
            data['class'] = 'CC'
        else:
            data['class'] = '3A'  # Default

    # Ensure passenger count
    if not data.get('passenger_count') or data['passenger_count'] == 0:
        data['passenger_count'] = 1

    return data


def calculate_train_emissions(data: Dict) -> Dict:
    """
    Calculate emissions from train journey

    Emission factors (per passenger-km):
    - Electric trains (AC classes): 0.04 kgCO2e/passenger-km
    - Diesel trains (most Indian trains): 0.06 kgCO2e/passenger-km
    - Average (mixed): 0.05 kgCO2e/passenger-km

    Sources:
    - Indian Railways data
    - DEFRA UK 2024
    - IEA railway emission factors
    """

    # Emission factors (kgCO2e per passenger-km)
    # Indian Railways is gradually electrifying, but many routers still diesel
    TRAIN_EMISSION_FACTORS = {
        '1A': 0.04,  # Usually on electric routers
        '2A': 0.04,
        '3A': 0.04,
        'CC': 0.04,  # Chair Car, usually electric
        'SL': 0.06,  # Sleeper, often diesel
        '2S': 0.06,  # Second seating, often diesel
        'EC': 0.03  # Executive Chair, modern trains
    }

    train_class = data.get('class', '3A')
    distance_km = data.get('distance_km', 0)
    passenger_count = data.get('passenger_count', 1)

    # Get emission factor
    ef_per_passenger_km = TRAIN_EMISSION_FACTORS.get(train_class, 0.05)

    # Calculate total emissions
    total_emissions = ef_per_passenger_km * distance_km * passenger_count

    return {
        'total_kgco2e': round(total_emissions, 2),
        'per_passenger_km_kgco2e': ef_per_passenger_km,
        'distance_km': distance_km,
        'passenger_count': passenger_count,
        'train_class': train_class,
        'calculation_method': f"{distance_km} km × {passenger_count} passengers × {ef_per_passenger_km} kgCO2e/p-km",
        'emission_factor_source': 'Indian Railways / DEFRA 2024',
        'notes': f'Class {train_class} train - {passenger_count} passenger(s)'
    }


def add_train_emission_factors_to_db():
    """
    Add train emission factors to database
    Run this once to populate emission_factors table
    """
    from app.database import SessionLocal
    from app.models import EmissionFactor

    db = SessionLocal()

    # Check if already exists
    existing = db.query(EmissionFactor).filter(
        EmissionFactor.activity_type == 'train_electric'
    ).first()

    if existing:
        print("✅ Train emission factors already in database")
        db.close()
        return

    print("🚂 Adding train emission factors to database...")

    factors = [
        EmissionFactor(
            activity_type='train_electric',
            region='India',
            unit='passenger-km',
            emission_factor=0.04,
            source='Indian Railways',
            year=2024,
            priority=2
        ),
        EmissionFactor(
            activity_type='train_diesel',
            region='India',
            unit='passenger-km',
            emission_factor=0.06,
            source='Indian Railways',
            year=2024,
            priority=2
        ),
        EmissionFactor(
            activity_type='train_average',
            region='India',
            unit='passenger-km',
            emission_factor=0.05,
            source='Indian Railways',
            year=2024,
            priority=2
        ),
        # Global average for comparison
        EmissionFactor(
            activity_type='train_average',
            region='Global',
            unit='passenger-km',
            emission_factor=0.041,
            source='DEFRA 2024',
            year=2024,
            priority=3
        )
    ]

    db.add_all(factors)
    db.commit()

    print(f"✅ Added {len(factors)} train emission factors")
    db.close()


# ============================================================================
# TESTING
# ============================================================================

if __name__ == "__main__":
    # Test: IRCTC ticket
    irctc_sample = """
    INDIAN RAILWAYS E-TICKET
    PNR: 1234567890

    Train: 12345 - Rajdhani Express
    Date of Journey: 20th March 2024

    From: NEW DELHI (NDLS)
    To: MUMBAI CENTRAL (BCT)
    Distance: 1,384 km

    Class: 2A (AC 2-Tier)
    Passenger: RAJESH KUMAR

    Total Fare: ₹2,450
    Booking Status: CONFIRMED

    Coach: A1, Berth: 45
    """

    print("\n" + "=" * 70)
    print("TEST: IRCTC TRAIN TICKET")
    print("=" * 70)
    result = extract_train_ticket(irctc_sample)
    print(json.dumps(result, indent=2))

    # Add emission factors to database
    print("\n" + "=" * 70)
    add_train_emission_factors_to_db()