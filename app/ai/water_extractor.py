# app/ai/water_extractor.py
"""
Water Bill Extractor
====================
Extracts water consumption data from municipal water bills
Scope 3.1 - Purchased Goods & Services (Water Supply)
Scope 3.5 - Waste Generated in Operations (Wastewater Treatment)

Handles:
- Municipal water bills
- Industrial water supply
- Wastewater/sewage charges
"""
from openai import OpenAI
import json
from typing import Dict, List
from datetime import datetime
from app.config import OPENAI_API_KEY, EXTRACTION_MODEL

client = OpenAI(api_key=OPENAI_API_KEY)


def extract_water_bill(file_content: str, file_type: str = "text") -> Dict:
    """
    Extract water bill data

    Args:
        file_content: Text content from document
        file_type: "text" or "image_base64"

    Returns:
        {
            'success': bool,
            'data': {
                'bill_number': str,
                'customer_name': str,
                'customer_id': str,
                'billing_period_start': 'YYYY-MM-DD',
                'billing_period_end': 'YYYY-MM-DD',
                'water_consumption_m3': float,
                'water_charges': float,
                'sewage_charges': float,
                'total_amount': float,
                'currency': str,
                'meter_reading_previous': float,
                'meter_reading_current': float,
                'supply_authority': str,
                'connection_type': str  # domestic/commercial/industrial
            }
        }
    """

    print("\n💧 Extracting water bill data...")

    try:
        # Extract structured data with AI
        extracted_data = extract_with_ai(file_content)

        if not extracted_data.get('success'):
            return extracted_data

        data = extracted_data['data']

        print(f"   ✅ Extracted: {data.get('supply_authority', 'Water supply')}")
        print(f"   💧 Consumption: {data.get('water_consumption_m3', 0):.1f} m³")

        return {
            'success': True,
            'data': data,
            'document_type': 'water_bill',
            'scope': 'Scope 3',
            'category': 'Purchased Goods & Services',
            'sub_category': '3.1'
        }

    except Exception as e:
        print(f"   ❌ Error: {e}")
        return {
            'success': False,
            'error': str(e)
        }


def extract_with_ai(text_content: str) -> Dict:
    """Use ChatGPT to extract structured water bill data"""

    prompt = f"""
Extract water bill details from this document.

DOCUMENT TEXT:
{text_content[:8000]}

Return ONLY valid JSON (no markdown, no ```json):
{{
    "bill_number": "WB-2024-001234",
    "customer_name": "ABC Manufacturing Ltd",
    "customer_id": "1234567890",
    "billing_period_start": "YYYY-MM-DD",
    "billing_period_end": "YYYY-MM-DD",
    "water_consumption_m3": 1500.5,
    "water_charges": 15000.00,
    "sewage_charges": 7500.00,
    "meter_rent": 50.00,
    "other_charges": 100.00,
    "total_amount": 22650.00,
    "currency": "INR",
    "meter_reading_previous": 12345.5,
    "meter_reading_current": 13846.0,
    "meter_number": "WM123456",
    "supply_authority": "Mumbai Municipal Corporation",
    "connection_type": "commercial",
    "address": "Service address"
}}

CRITICAL INSTRUCTIONS:

1. CONSUMPTION CALCULATION:
   - Water consumption = Current reading - Previous reading
   - Unit is typically cubic meters (m³) or kiloliters (KL)
   - 1 KL = 1 m³

2. UNIT CONVERSION:
   - If in kiloliters (KL): keep as m3 (same value)
   - If in liters: divide by 1000 to get m3
   - If in gallons: multiply by 0.00378541 to get m3

3. CHARGES BREAKDOWN:
   - Extract water supply charges separately
   - Extract sewage/wastewater charges separately
   - Sum for total, but keep breakdown

4. CONNECTION TYPE:
   - domestic/residential
   - commercial (offices, shops)
   - industrial (factories, plants)

5. BILLING PERIOD:
   - Extract start and end dates
   - Format as YYYY-MM-DD
   - If only month mentioned (e.g., "March 2024"), use first and last day

6. METER READINGS:
   - Previous reading (opening)
   - Current reading (closing)
   - Both typically in m³ or KL

Return ONLY the JSON object.
"""

    try:
        response = client.chat.completions.create(
            model=EXTRACTION_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert at extracting water bill data. Return only valid JSON."
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

        # Validate and normalize
        data = validate_water_data(data)

        return {
            'success': True,
            'data': data
        }

    except Exception as e:
        return {
            'success': False,
            'error': f'AI extraction failed: {str(e)}'
        }


def validate_water_data(data: Dict) -> Dict:
    """Validate and normalize water bill data"""

    # Calculate consumption if not provided
    if data.get('water_consumption_m3', 0) == 0:
        current = data.get('meter_reading_current', 0)
        previous = data.get('meter_reading_previous', 0)
        if current > 0 and previous > 0:
            data['water_consumption_m3'] = current - previous

    # Ensure positive consumption
    if data.get('water_consumption_m3', 0) < 0:
        data['water_consumption_m3'] = 0

    # Default connection type
    if not data.get('connection_type'):
        # Infer from customer name or charges
        customer = data.get('customer_name', '').lower()
        if any(word in customer for word in ['ltd', 'pvt', 'corporation', 'company', 'industries']):
            data['connection_type'] = 'commercial'
        else:
            data['connection_type'] = 'domestic'

    return data


def convert_water_to_activities(extracted_data: Dict) -> List[Dict]:
    """
    Convert extracted water bill to activities
    Creates 2 activities:
    1. Water supply (Scope 3.1)
    2. Wastewater treatment (Scope 3.5) - if sewage charges present
    """

    if not extracted_data.get('success'):
        return []

    data = extracted_data['data']
    activities = []

    bill_date = data.get('billing_period_end', datetime.now().strftime('%Y-%m-%d'))
    authority = data.get('supply_authority', 'Municipal Corporation')
    consumption_m3 = data.get('water_consumption_m3', 0)

    # Activity 1: Water Supply
    if consumption_m3 > 0:
        activities.append({
            'activity_name': f"Water Supply - {authority}",
            'activity_type': 'water_supply',
            'quantity': consumption_m3,
            'unit': 'm3',
            'date': bill_date,
            'description': f"Municipal water consumption",
            'amount': data.get('water_charges', 0),
            'vendor': authority,
            'bill_number': data.get('bill_number', ''),
            'meter_number': data.get('meter_number', ''),
            'scope': 'Scope 3',
            'category': 'Purchased Goods & Services',
            'sub_category': '3.1'
        })

    # Activity 2: Wastewater Treatment (if sewage charges exist)
    sewage_charges = data.get('sewage_charges', 0)
    if sewage_charges > 0 and consumption_m3 > 0:
        # Assume wastewater = 80-90% of water consumed
        wastewater_m3 = consumption_m3 * 0.85

        activities.append({
            'activity_name': f"Wastewater Treatment - {authority}",
            'activity_type': 'wastewater_treatment',
            'quantity': wastewater_m3,
            'unit': 'm3',
            'date': bill_date,
            'description': f"Municipal wastewater treatment",
            'amount': sewage_charges,
            'vendor': authority,
            'bill_number': data.get('bill_number', ''),
            'scope': 'Scope 3',
            'category': 'Waste Generated in Operations',
            'sub_category': '3.5'
        })

    return activities


# ============================================================================
# TESTING
# ============================================================================

if __name__ == "__main__":
    # Test sample
    water_bill = """
    MUMBAI MUNICIPAL CORPORATION
    WATER SUPPLY DEPARTMENT

    WATER BILL / TAX INVOICE

    Bill No: WB/2024/001234567
    Bill Date: 25th March 2024

    Consumer Details:
    Name: ABC Manufacturing Pvt Ltd
    Consumer No: 1234567890
    Meter No: WM-MB-123456
    Address: Plot No. 45, MIDC Andheri
            Mumbai - 400053

    Connection Type: Commercial - Industrial

    Billing Period: 01/01/2024 to 31/03/2024

    Meter Readings:
    Previous Reading: 12,345.5 m³ (01-Jan-2024)
    Current Reading:  13,846.0 m³ (31-Mar-2024)
    Consumption:      1,500.5 m³

    Charges Breakdown:
    -------------------------------------------------
    Water Supply Charges    @ ₹10.00/m³    ₹15,005.00
    Sewage Charges         @ ₹5.00/m³     ₹7,502.50
    Meter Rent                            ₹50.00
    Service Charges                       ₹100.00
    -------------------------------------------------
    Sub Total                             ₹22,657.50

    Note: Payment due by 10th April 2024
    For queries, call: 1916
    """

    print("=" * 70)
    print("  TEST: MUNICIPAL WATER BILL")
    print("=" * 70)

    result = extract_water_bill(water_bill)

    if result['success']:
        print("\n✅ Extraction successful!")
        print(f"\nSupply Authority: {result['data'].get('supply_authority')}")
        print(f"Bill Number: {result['data'].get('bill_number')}")
        print(f"Customer: {result['data'].get('customer_name')}")
        print(f"Connection Type: {result['data'].get('connection_type')}")

        print(f"\n💧 Water Consumption:")
        print(f"   Previous Reading: {result['data'].get('meter_reading_previous')} m³")
        print(f"   Current Reading:  {result['data'].get('meter_reading_current')} m³")
        print(f"   Consumption:      {result['data'].get('water_consumption_m3')} m³")

        print(f"\n💰 Charges:")
        print(f"   Water Supply:  ₹{result['data'].get('water_charges', 0):,.2f}")
        print(f"   Sewage:        ₹{result['data'].get('sewage_charges', 0):,.2f}")
        print(f"   Total:         ₹{result['data'].get('total_amount', 0):,.2f}")

        # Convert to activities
        print("\n" + "=" * 70)
        print("  CONVERTED TO ACTIVITIES")
        print("=" * 70)

        activities = convert_water_to_activities(result)
        print(f"\nExtracted {len(activities)} activities:")

        for act in activities:
            print(f"\n  • {act['activity_name']}")
            print(f"    Type: {act['activity_type']}")
            print(f"    Quantity: {act['quantity']} {act['unit']}")
            print(f"    Category: {act['category']}")
    else:
        print(f"\n❌ Failed: {result.get('error')}")