# app/ai/hotel_extractor.py
"""
Hotel Bill Extractor
Extracts accommodation data from hotel invoices, booking confirmations, and receipts
Scope 3.6 - Business Travel (Accommodation)
"""
from openai import OpenAI
import json
from typing import Dict
from datetime import datetime
from app.config import OPENAI_API_KEY, EXTRACTION_MODEL

client = OpenAI(api_key=OPENAI_API_KEY)


def extract_hotel_bill(file_content: str, file_type: str = "text") -> Dict:
    """
    Extract hotel accommodation data from bill/invoice

    Supports:
    - Hotel invoices (PDF, image, text)
    - Booking confirmations (MakeMyTrip, Booking.com, etc.)
    - Corporate hotel bills

    Args:
        file_content: Text content from document
        file_type: "text" or "image_base64"

    Returns:
        {
            'success': bool,
            'data': {
                'hotel_name': str,
                'location': str,
                'check_in_date': 'YYYY-MM-DD',
                'check_out_date': 'YYYY-MM-DD',
                'nights': int,
                'room_type': 'budget/economy/business/luxury',
                'room_count': int,
                'guest_name': str,
                'booking_reference': str,
                'total_amount': float,
                'currency': str
            },
            'emissions': {
                'total_kgco2e': float,
                'per_night_kgco2e': float,
                'calculation_method': str
            }
        }
    """

    print("\n🏨 Extracting hotel bill data...")

    try:
        # Extract structured data with AI
        extracted_data = extract_with_ai(file_content)

        if not extracted_data.get('success'):
            return extracted_data

        data = extracted_data['data']

        # Calculate emissions
        emissions = calculate_hotel_emissions(data)

        print(f"   ✅ Extracted: {data.get('hotel_name', 'Unknown Hotel')}")
        print(f"   📅 {data.get('nights', 0)} nights")
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
    """Use ChatGPT to extract structured hotel data"""

    prompt = f"""
Extract hotel accommodation details from this document.

DOCUMENT TEXT:
{text_content[:8000]}

Return ONLY valid JSON (no markdown, no ```json):
{{
    "hotel_name": "Full hotel name",
    "location": "City, Country",
    "check_in_date": "YYYY-MM-DD",
    "check_out_date": "YYYY-MM-DD",
    "nights": 2,
    "room_type": "budget" or "economy" or "business" or "luxury",
    "room_count": 1,
    "guest_name": "Name of guest",
    "booking_reference": "Confirmation/booking number",
    "total_amount": 5000.00,
    "currency": "INR" or "USD" etc
}}

CLASSIFICATION RULES:
- budget: < ₹2000/night (hostels, budget hotels)
- economy: ₹2000-5000/night (3-star, business hotels)
- business: ₹5000-10000/night (4-star, upscale)
- luxury: > ₹10000/night (5-star, luxury resorts)

If check-in/check-out not found, look for:
- Arrival/departure dates
- Stay period
- From/to dates

Calculate nights as: check_out_date - check_in_date

Return ONLY the JSON object.
"""

    try:
        response = client.chat.completions.create(
            model=EXTRACTION_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert at extracting hotel accommodation data from invoices and booking confirmations. Return only valid JSON."
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

        # Validate dates and calculate nights if needed
        data = validate_hotel_data(data)

        return {
            'success': True,
            'data': data
        }

    except Exception as e:
        return {
            'success': False,
            'error': f'AI extraction failed: {str(e)}'
        }


def validate_hotel_data(data: Dict) -> Dict:
    """Validate and clean hotel data"""

    # Calculate nights if not provided
    if data.get('nights', 0) == 0:
        try:
            check_in = datetime.strptime(data.get('check_in_date', ''), '%Y-%m-%d')
            check_out = datetime.strptime(data.get('check_out_date', ''), '%Y-%m-%d')
            data['nights'] = (check_out - check_in).days
        except:
            data['nights'] = 1  # Default to 1 night

    # Ensure room count
    if not data.get('room_count'):
        data['room_count'] = 1

    # Classify room type if not provided
    if not data.get('room_type') and data.get('total_amount'):
        amount = data['total_amount']
        nights = data.get('nights', 1)
        per_night = amount / nights if nights > 0 else amount

        if data.get('currency') == 'INR':
            if per_night < 2000:
                data['room_type'] = 'budget'
            elif per_night < 5000:
                data['room_type'] = 'economy'
            elif per_night < 10000:
                data['room_type'] = 'business'
            else:
                data['room_type'] = 'luxury'
        else:
            data['room_type'] = 'economy'  # Default

    return data


def calculate_hotel_emissions(data: Dict) -> Dict:
    """
    Calculate emissions from hotel stay

    Emission factors (per room per night):
    - Budget: 10 kgCO2e (basic amenities)
    - Economy: 15 kgCO2e (standard 3-star)
    - Business: 25 kgCO2e (4-star with AC, amenities)
    - Luxury: 40 kgCO2e (5-star, full services)

    Sources:
    - Hotel Carbon Measurement Initiative (HCMI)
    - Cornell Hotel Sustainability Benchmarking
    - India-specific adjustments
    """

    # Emission factors (kgCO2e per room per night)
    HOTEL_EMISSION_FACTORS = {
        'budget': 10,
        'economy': 15,
        'business': 25,
        'luxury': 40
    }

    room_type = data.get('room_type', 'economy')
    nights = data.get('nights', 1)
    room_count = data.get('room_count', 1)

    # Get emission factor
    ef_per_night = HOTEL_EMISSION_FACTORS.get(room_type, 15)

    # Calculate total emissions
    total_emissions = ef_per_night * nights * room_count

    # Location adjustment (if international travel)
    location = data.get('location', '')
    if 'india' not in location.lower():
        # International hotels tend to have higher emissions
        total_emissions *= 1.2

    return {
        'total_kgco2e': round(total_emissions, 2),
        'per_night_kgco2e': ef_per_night,
        'nights': nights,
        'room_count': room_count,
        'room_type': room_type,
        'calculation_method': f"{nights} nights × {room_count} rooms × {ef_per_night} kgCO2e/night",
        'emission_factor_source': 'Hotel Carbon Measurement Initiative (HCMI)',
        'notes': f'{room_type.capitalize()} hotel accommodation'
    }


def add_hotel_emission_factors_to_db():
    """
    Add hotel emission factors to database
    Run this once to populate emission_factors table
    """
    from app.database import SessionLocal
    from app.models import EmissionFactor

    db = SessionLocal()

    # Check if already exists
    existing = db.query(EmissionFactor).filter(
        EmissionFactor.activity_type == 'hotel_budget'
    ).first()

    if existing:
        print("✅ Hotel emission factors already in database")
        db.close()
        return

    print("🏨 Adding hotel emission factors to database...")

    factors = [
        EmissionFactor(
            activity_type='hotel_budget',
            region='Global',
            unit='night',
            emission_factor=10.0,
            source='HCMI',
            year=2024,
            priority=3
        ),
        EmissionFactor(
            activity_type='hotel_economy',
            region='Global',
            unit='night',
            emission_factor=15.0,
            source='HCMI',
            year=2024,
            priority=3
        ),
        EmissionFactor(
            activity_type='hotel_business',
            region='Global',
            unit='night',
            emission_factor=25.0,
            source='HCMI',
            year=2024,
            priority=3
        ),
        EmissionFactor(
            activity_type='hotel_luxury',
            region='Global',
            unit='night',
            emission_factor=40.0,
            source='HCMI',
            year=2024,
            priority=3
        ),
        EmissionFactor(
            activity_type='hotel_economy',
            region='India',
            unit='night',
            emission_factor=12.0,
            source='India Hotel Association',
            year=2024,
            priority=2
        )
    ]

    db.add_all(factors)
    db.commit()

    print(f"✅ Added {len(factors)} hotel emission factors")
    db.close()


# ============================================================================
# TESTING
# ============================================================================

if __name__ == "__main__":
    # Test with sample hotel bill text

    sample_bill = """
    TAJ HOTEL MUMBAI
    Invoice #HT-2024-12345

    Guest Name: Rajesh Kumar
    Check-in: January 15, 2024
    Check-out: January 17, 2024

    Room Type: Deluxe Room
    Number of Nights: 2
    Room Rate: ₹12,000 per night

    Total Amount: ₹24,000

    Thank you for staying with us!
    """

    result = extract_hotel_bill(sample_bill, "text")

    print("\n" + "=" * 70)
    print("TEST RESULT:")
    print("=" * 70)
    print(json.dumps(result, indent=2))

    # Add emission factors to database
    print("\n" + "=" * 70)
    add_hotel_emission_factors_to_db()