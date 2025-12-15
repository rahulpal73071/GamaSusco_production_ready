# app/ai/purchase_invoice_extractor.py
"""
Purchase Invoice Extractor
===========================
Extracts material/goods purchase data from invoices
Scope 3.1 - Purchased Goods & Services

IMPORTANT: This extractor ONLY extracts data.
Emission factors come from the database.
Calculations happen via smart_emission_calculator.py
"""
from openai import OpenAI
import json
from typing import Dict, List
from datetime import datetime
from app.config import OPENAI_API_KEY, EXTRACTION_MODEL

client = OpenAI(api_key=OPENAI_API_KEY)


def extract_purchase_invoice(file_content: str, file_type: str = "text") -> Dict:
    """
    Extract purchase invoice data

    Returns structured data - does NOT calculate emissions
    Emissions are calculated by smart_emission_calculator using database factors

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
                'line_items': [
                    {
                        'item_name': str,
                        'material_type': str,  # Maps to activity_type in database
                        'quantity': float,
                        'unit': str,
                        'unit_price': float,
                        'total_price': float
                    }
                ],
                'total_amount': float,
                'currency': str
            }
        }
    """

    print("\n📦 Extracting purchase invoice data...")

    try:
        # Extract structured data with AI
        extracted_data = extract_with_ai(file_content)

        if not extracted_data.get('success'):
            return extracted_data

        data = extracted_data['data']

        print(f"   ✅ Extracted: {data.get('vendor_name', 'Unknown vendor')}")
        print(f"   📋 Line items: {len(data.get('line_items', []))}")

        # Return raw extracted data
        # Emission calculation will be done by the universal processor
        return {
            'success': True,
            'data': data,
            'document_type': 'purchase_invoice',
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
    """Use ChatGPT to extract structured purchase data"""

    prompt = f"""
Extract purchase invoice details from this document.

DOCUMENT TEXT:
{text_content[:8000]}

Return ONLY valid JSON (no markdown, no ```json):
{{
    "invoice_number": "INV-2024-001",
    "vendor_name": "ABC Suppliers Ltd",
    "date": "YYYY-MM-DD",
    "line_items": [
        {{
            "item_name": "Cold Rolled Steel Sheet",
            "material_type": "steel",
            "quantity": 1000,
            "unit": "kg",
            "unit_price": 65.00,
            "total_price": 65000.00,
            "specifications": "1mm thickness"
        }},
        {{
            "item_name": "Corrugated Cardboard Boxes",
            "material_type": "cardboard",
            "quantity": 500,
            "unit": "kg",
            "unit_price": 15.00,
            "total_price": 7500.00
        }}
    ],
    "total_amount": 72500.00,
    "currency": "INR"
}}

CRITICAL INSTRUCTIONS:

1. MATERIAL TYPE CLASSIFICATION:
   Identify the material category - this maps to database activity_types:

   **Metals:**
   - steel, aluminum, copper, brass, iron, zinc, stainless_steel

   **Plastics:**
   - plastic_pet, plastic_hdpe, plastic_pvc, plastic_ldpe, plastic_pp
   - For generic plastic: "plastic"

   **Paper/Cardboard:**
   - paper, cardboard, paper_recycled

   **Construction:**
   - concrete, cement, sand, gravel, bricks, glass, timber

   **Chemicals:**
   - solvents, adhesives, paints, lubricants

   **Textiles:**
   - cotton, polyester, fabric

   **Electronics:**
   - electronics, pcb, semiconductors

   **Packaging:**
   - packaging_cardboard, packaging_plastic

   **Generic:**
   - If you cannot identify specific material, use: "goods_general"

2. UNIT STANDARDIZATION:
   Convert all units to standard forms:
   - Weight: "kg" (convert tonnes → kg × 1000, grams → kg ÷ 1000)
   - Volume: "litre" or "m3"
   - Count: "pieces" or "units"
   - Length: "meter"

3. QUANTITY EXTRACTION:
   - Extract numeric quantity only
   - If range given (e.g., "100-150 pcs"), use average (125)
   - If "approx" or "~", still extract the number

4. HANDLE MULTI-LINE DESCRIPTIONS:
   - Combine item descriptions that span multiple lines
   - Extract the primary material type

Return ONLY the JSON object.
"""

    try:
        response = client.chat.completions.create(
            model=EXTRACTION_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert at extracting purchase invoice data. Identify material types accurately. Return only valid JSON."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.1,
            max_tokens=2000
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

        # Validate and normalize data
        data = validate_and_normalize(data)

        return {
            'success': True,
            'data': data
        }

    except Exception as e:
        return {
            'success': False,
            'error': f'AI extraction failed: {str(e)}'
        }


def validate_and_normalize(data: Dict) -> Dict:
    """
    Validate and normalize extracted data
    Ensure units are standardized
    """

    line_items = data.get('line_items', [])

    for item in line_items:
        # Normalize units
        unit = item.get('unit', '').lower()

        # Weight conversions
        if unit in ['tonne', 'tonnes', 'ton', 'tons', 'mt']:
            # Convert to kg
            item['quantity'] = item['quantity'] * 1000
            item['unit'] = 'kg'
            item['unit_converted'] = True

        elif unit in ['gram', 'grams', 'g', 'gm']:
            # Convert to kg
            item['quantity'] = item['quantity'] / 1000
            item['unit'] = 'kg'
            item['unit_converted'] = True

        elif unit in ['lb', 'lbs', 'pound', 'pounds']:
            # Convert to kg
            item['quantity'] = item['quantity'] * 0.453592
            item['unit'] = 'kg'
            item['unit_converted'] = True

        # Volume conversions
        elif unit in ['ml', 'milliliter', 'milliliters']:
            item['quantity'] = item['quantity'] / 1000
            item['unit'] = 'litre'
            item['unit_converted'] = True

        elif unit in ['gallon', 'gallons', 'gal']:
            item['quantity'] = item['quantity'] * 3.78541
            item['unit'] = 'litre'
            item['unit_converted'] = True

        # Count normalizations
        elif unit in ['pcs', 'pc', 'nos', 'no']:
            item['unit'] = 'pieces'

        elif unit in ['box', 'boxes', 'carton', 'cartons']:
            item['unit'] = 'pieces'

        # Ensure material_type exists
        if not item.get('material_type'):
            item['material_type'] = 'goods_general'

    return data


# ============================================================================
# HELPER: Convert extracted invoice to activities for database
# ============================================================================

def convert_invoice_to_activities(extracted_data: Dict) -> List[Dict]:
    """
    Convert extracted invoice data to activity format
    Each line item becomes an activity

    This is used by the universal processor to create EmissionActivity records
    """

    if not extracted_data.get('success'):
        return []

    data = extracted_data['data']
    activities = []

    invoice_date = data.get('date', datetime.now().strftime('%Y-%m-%d'))
    vendor = data.get('vendor_name', 'Unknown Vendor')

    for item in data.get('line_items', []):
        activity = {
            'activity_name': f"{item.get('item_name', 'Material')} - {vendor}",
            'activity_type': item.get('material_type', 'goods_general'),
            'quantity': item.get('quantity', 0),
            'unit': item.get('unit', 'kg'),
            'date': invoice_date,
            'description': f"Purchased from {vendor}",
            'amount': item.get('total_price', 0),
            'vendor': vendor,
            'invoice_number': data.get('invoice_number', ''),
            'scope': 'Scope 3',
            'category': 'Purchased Goods & Services',
            'sub_category': '3.1'
        }

        activities.append(activity)

    return activities


# ============================================================================
# TESTING
# ============================================================================

if __name__ == "__main__":
    # Test sample
    steel_invoice = """
    TAX INVOICE

    Invoice No: SI/2024/00123
    Date: March 20, 2024

    Vendor: Steel India Pvt Ltd
    GSTIN: 27AABCS1234F1Z5

    Bill To:
    ABC Manufacturing Ltd
    Mumbai, Maharashtra

    Item Details:

    1. Cold Rolled Steel Sheet - 1mm thickness
       Quantity: 1,000 kg
       Rate: ₹65.00 per kg
       Amount: ₹65,000.00

    2. Stainless Steel 304 Grade Bars
       Quantity: 500 kg
       Rate: ₹180.00 per kg
       Amount: ₹90,000.00

    3. Aluminum Sheets - 6061 Grade
       Quantity: 250 kg
       Rate: ₹350.00 per kg
       Amount: ₹87,500.00

    Sub Total: ₹2,42,500.00
    GST @18%: ₹43,650.00
    Total Amount: ₹2,86,150.00
    """

    print("=" * 70)
    print("  TEST: STEEL PURCHASE INVOICE")
    print("=" * 70)

    result = extract_purchase_invoice(steel_invoice)

    if result['success']:
        print("\n✅ Extraction successful!")
        print(f"\nVendor: {result['data'].get('vendor_name')}")
        print(f"Invoice: {result['data'].get('invoice_number')}")
        print(f"Date: {result['data'].get('date')}")
        print(f"\nLine Items:")

        for idx, item in enumerate(result['data'].get('line_items', []), 1):
            print(f"\n  {idx}. {item.get('item_name')}")
            print(f"     Material Type: {item.get('material_type')}")
            print(f"     Quantity: {item.get('quantity')} {item.get('unit')}")
            print(f"     Amount: ₹{item.get('total_price'):,.2f}")

        print(f"\nTotal: ₹{result['data'].get('total_amount'):,.2f}")

        # Convert to activities
        print("\n" + "=" * 70)
        print("  CONVERTED TO ACTIVITIES")
        print("=" * 70)

        activities = convert_invoice_to_activities(result)
        print(f"\nExtracted {len(activities)} activities:")

        for act in activities:
            print(f"\n  • {act['activity_name']}")
            print(f"    Type: {act['activity_type']}")
            print(f"    Quantity: {act['quantity']} {act['unit']}")
    else:
        print(f"\n❌ Failed: {result.get('error')}")