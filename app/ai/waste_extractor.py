# app/ai/waste_extractor.py
"""
Waste Invoice Extractor
========================
Extracts waste disposal data from invoices
Scope 3.5 - Waste Generated in Operations

Handles:
- Municipal solid waste
- Hazardous waste
- E-waste
- Construction & demolition waste
- Biomedical waste
- Recycling
"""
from openai import OpenAI
import json
from typing import Dict, List
from datetime import datetime
from app.config import OPENAI_API_KEY, EXTRACTION_MODEL

client = OpenAI(api_key=OPENAI_API_KEY)


def extract_waste_invoice(file_content: str, file_type: str = "text") -> Dict:
    """
    Extract waste disposal invoice data

    Args:
        file_content: Text content from document
        file_type: "text" or "image_base64"

    Returns:
        {
            'success': bool,
            'data': {
                'invoice_number': str,
                'vendor_name': str,
                'date': 'YYYY-MM-DD',
                'waste_items': [
                    {
                        'waste_type': str,  # Maps to activity_type in database
                        'disposal_method': str,  # landfill/incineration/recycling
                        'quantity': float,
                        'unit': str,
                        'cost': float
                    }
                ],
                'total_weight_kg': float,
                'total_amount': float,
                'facility_name': str,
                'facility_location': str
            }
        }
    """

    print("\n♻️ Extracting waste invoice data...")

    try:
        # Extract structured data with AI
        extracted_data = extract_with_ai(file_content)

        if not extracted_data.get('success'):
            return extracted_data

        data = extracted_data['data']

        print(f"   ✅ Extracted: {data.get('vendor_name', 'Unknown vendor')}")
        print(f"   📋 Waste items: {len(data.get('waste_items', []))}")
        print(f"   ⚖️ Total weight: {data.get('total_weight_kg', 0):.1f} kg")

        return {
            'success': True,
            'data': data,
            'document_type': 'waste_invoice',
            'scope': 'Scope 3',
            'category': 'Waste Generated in Operations',
            'sub_category': '3.5'
        }

    except Exception as e:
        print(f"   ❌ Error: {e}")
        return {
            'success': False,
            'error': str(e)
        }


def extract_with_ai(text_content: str) -> Dict:
    """Use ChatGPT to extract structured waste data"""

    prompt = f"""
Extract waste disposal invoice details from this document.

DOCUMENT TEXT:
{text_content[:8000]}

Return ONLY valid JSON (no markdown, no ```json):
{{
    "invoice_number": "WD-2024-001",
    "vendor_name": "Clean City Waste Management",
    "date": "YYYY-MM-DD",
    "waste_items": [
        {{
            "waste_type": "municipal_solid_waste",
            "disposal_method": "landfill",
            "quantity": 500,
            "unit": "kg",
            "cost": 1500.00,
            "description": "General office waste"
        }},
        {{
            "waste_type": "paper_cardboard",
            "disposal_method": "recycling",
            "quantity": 200,
            "unit": "kg",
            "cost": 500.00
        }}
    ],
    "total_weight_kg": 700,
    "total_amount": 2000.00,
    "currency": "INR",
    "facility_name": "Green Valley Landfill",
    "facility_location": "Navi Mumbai"
}}

WASTE TYPE CLASSIFICATION (maps to database activity_types):

**General Waste:**
- municipal_solid_waste (mixed MSW)
- general_waste (non-hazardous)
- organic_waste (food waste, garden waste)

**Recyclables:**
- paper_cardboard (paper, cardboard for recycling)
- plastic_recyclable (PET, HDPE, etc.)
- metal_recyclable (aluminum, steel scrap)
- glass_recyclable

**Hazardous Waste:**
- hazardous_waste (chemicals, batteries, etc.)
- electronic_waste (e-waste, WEEE)
- biomedical_waste (medical waste)

**Construction Waste:**
- construction_debris (concrete, bricks, etc.)
- wood_waste (timber, furniture)

**Other:**
- textile_waste
- rubber_waste
- sludge

DISPOSAL METHOD:
- landfill (sent to landfill)
- incineration (burned with energy recovery)
- recycling (recycled/reused)
- composting (organic composting)
- treatment (chemical/biological treatment)
- deep_well_injection (liquid waste)

UNIT STANDARDIZATION:
- Convert all weight to "kg"
- Tonnes → kg (× 1000)
- Grams → kg (÷ 1000)
- If volume given (m3, litres), keep as is but note it

QUANTITY EXTRACTION:
- Extract total weight per waste type
- If multiple pickups, sum them
- Convert units to kg

Return ONLY the JSON object.
"""

    try:
        response = client.chat.completions.create(
            model=EXTRACTION_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert at extracting waste disposal data. Identify waste types and disposal methods accurately. Return only valid JSON."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.1,
            max_tokens=1500
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
        data = validate_waste_data(data)

        return {
            'success': True,
            'data': data
        }

    except Exception as e:
        return {
            'success': False,
            'error': f'AI extraction failed: {str(e)}'
        }


def validate_waste_data(data: Dict) -> Dict:
    """Validate and normalize waste data"""

    waste_items = data.get('waste_items', [])
    total_weight = 0

    for item in waste_items:
        # Normalize units
        unit = item.get('unit', '').lower()
        quantity = item.get('quantity', 0)

        if unit in ['tonne', 'tonnes', 'ton', 'tons', 'mt']:
            item['quantity'] = quantity * 1000
            item['unit'] = 'kg'

        elif unit in ['gram', 'grams', 'g']:
            item['quantity'] = quantity / 1000
            item['unit'] = 'kg'

        elif unit in ['lb', 'lbs', 'pound', 'pounds']:
            item['quantity'] = quantity * 0.453592
            item['unit'] = 'kg'

        # Default waste type if missing
        if not item.get('waste_type'):
            item['waste_type'] = 'general_waste'

        # Default disposal method if missing
        if not item.get('disposal_method'):
            # Infer from waste type
            if 'recycl' in item.get('description', '').lower():
                item['disposal_method'] = 'recycling'
            elif 'compost' in item.get('description', '').lower():
                item['disposal_method'] = 'composting'
            else:
                item['disposal_method'] = 'landfill'  # Default

        # Sum total weight
        if item['unit'] == 'kg':
            total_weight += item['quantity']

    # Update total weight if not provided
    if total_weight > 0 and not data.get('total_weight_kg'):
        data['total_weight_kg'] = total_weight

    return data


def convert_waste_to_activities(extracted_data: Dict) -> List[Dict]:
    """
    Convert extracted waste invoice to activities
    Each waste item becomes an activity
    """

    if not extracted_data.get('success'):
        return []

    data = extracted_data['data']
    activities = []

    invoice_date = data.get('date', datetime.now().strftime('%Y-%m-%d'))
    vendor = data.get('vendor_name', 'Unknown Vendor')
    facility = data.get('facility_name', '')

    for item in data.get('waste_items', []):
        # Build activity type based on waste type + disposal method
        waste_type = item.get('waste_type', 'general_waste')
        disposal_method = item.get('disposal_method', 'landfill')

        # Activity type format: waste_{type}_{method}
        # e.g., waste_paper_recycling, waste_general_landfill
        activity_type = f"waste_{waste_type}_{disposal_method}"

        # Fallback to simpler format if too complex
        if len(activity_type.split('_')) > 3:
            activity_type = f"waste_{disposal_method}"

        activity_name = f"{item.get('description', waste_type.replace('_', ' ').title())} - {disposal_method.title()}"

        activity = {
            'activity_name': activity_name,
            'activity_type': activity_type,
            'quantity': item.get('quantity', 0),
            'unit': item.get('unit', 'kg'),
            'date': invoice_date,
            'description': f"Waste disposal via {vendor} - {facility}",
            'amount': item.get('cost', 0),
            'vendor': vendor,
            'facility': facility,
            'disposal_method': disposal_method,
            'waste_type': waste_type,
            'scope': 'Scope 3',
            'category': 'Waste Generated in Operations',
            'sub_category': '3.5'
        }

        activities.append(activity)

    return activities


# ============================================================================
# TESTING
# ============================================================================

if __name__ == "__main__":
    # Test sample
    waste_invoice = """
    WASTE MANAGEMENT SERVICES - TAX INVOICE

    Invoice No: WM/2024/00567
    Date: March 22, 2024

    Service Provider: Green Earth Waste Management Pvt Ltd
    GSTIN: 27AAGCG1234F1Z5

    Client: ABC Manufacturing Ltd
    Site: Pune Industrial Estate

    Waste Collection & Disposal Details:

    1. Municipal Solid Waste (General Waste)
       Disposal Method: Landfill
       Quantity: 500 kg
       Rate: ₹3.00 per kg
       Amount: ₹1,500.00
       Disposal Site: Uruli Devachi Landfill

    2. Paper & Cardboard (Recyclable)
       Disposal Method: Recycling
       Quantity: 200 kg
       Rate: ₹2.50 per kg
       Amount: ₹500.00
       Recycling Facility: Pune Recycling Center

    3. E-Waste (Electronics)
       Disposal Method: Authorized E-Waste Recycler
       Quantity: 50 kg
       Rate: ₹15.00 per kg
       Amount: ₹750.00
       Certificate No: EWR-2024-123

    4. Hazardous Waste (Solvents & Chemicals)
       Disposal Method: Incineration
       Quantity: 25 kg
       Rate: ₹50.00 per kg
       Amount: ₹1,250.00
       TSDF: Maharashtra TSDF, Taloja

    Sub Total: ₹4,000.00
    GST @18%: ₹720.00
    Total Amount: ₹4,720.00

    Note: All disposals are in compliance with Solid Waste Management Rules, 2016
    """

    print("=" * 70)
    print("  TEST: WASTE DISPOSAL INVOICE")
    print("=" * 70)

    result = extract_waste_invoice(waste_invoice)

    if result['success']:
        print("\n✅ Extraction successful!")
        print(f"\nVendor: {result['data'].get('vendor_name')}")
        print(f"Invoice: {result['data'].get('invoice_number')}")
        print(f"Date: {result['data'].get('date')}")
        print(f"Facility: {result['data'].get('facility_name')}")

        print(f"\n📋 Waste Items:")
        for idx, item in enumerate(result['data'].get('waste_items', []), 1):
            print(f"\n  {idx}. {item.get('waste_type', 'Unknown').replace('_', ' ').title()}")
            print(f"     Disposal: {item.get('disposal_method', 'Unknown').title()}")
            print(f"     Quantity: {item.get('quantity')} {item.get('unit')}")
            print(f"     Cost: ₹{item.get('cost', 0):,.2f}")

        print(f"\n⚖️ Total Weight: {result['data'].get('total_weight_kg', 0):.1f} kg")
        print(f"💰 Total Cost: ₹{result['data'].get('total_amount', 0):,.2f}")

        # Convert to activities
        print("\n" + "=" * 70)
        print("  CONVERTED TO ACTIVITIES")
        print("=" * 70)

        activities = convert_waste_to_activities(result)
        print(f"\nExtracted {len(activities)} activities:")

        for act in activities:
            print(f"\n  • {act['activity_name']}")
            print(f"    Type: {act['activity_type']}")
            print(f"    Quantity: {act['quantity']} {act['unit']}")
            print(f"    Disposal: {act['disposal_method']}")
    else:
        print(f"\n❌ Failed: {result.get('error')}")