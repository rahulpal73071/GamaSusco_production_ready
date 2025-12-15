# app/ai/chatgpt_extractor.py
"""
ChatGPT-Powered Document Extractor - FIXED VERSION
======================================================
Handles all extraction tasks:
1. Extract text from PDFs, images, text files
2. Send to OpenAI for structuring
3. Return structured data

Does NOT handle routing - that's universal_document_processor.py
"""

from openai import OpenAI
import json
from pathlib import Path
from typing import Dict, List, Optional
import PyPDF2
# Lazy import pytesseract due to Python 3.14 compatibility issues
try:
    import pytesseract
    PYTESSERACT_AVAILABLE = True
except ImportError as e:
    print(f"⚠️  pytesseract not available (OCR disabled): {e}")
    pytesseract = None
    PYTESSERACT_AVAILABLE = False
from PIL import Image
import re
from datetime import datetime
import pandas as pd

from app.config import OPENAI_API_KEY, EXTRACTION_MODEL

# ✅ FIXED: Don't create client at module level - create it when needed
_client = None

def get_openai_client():
    """Get or create OpenAI client - lazy initialization"""
    global _client
    if _client is None:
        _client = OpenAI(api_key=OPENAI_API_KEY)
    return _client


# ============================================================================
# TEXT EXTRACTION FROM FILES
# ============================================================================

def extract_text_from_pdf(file_path: str, max_pages: int = 10) -> str:
    """
    Extract text from PDF file

    Args:
        file_path: Path to PDF file
        max_pages: Maximum pages to process

    Returns:
        Extracted text
    """
    try:
        text = ""
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)

            num_pages = min(len(pdf_reader.pages), max_pages)

            for page_num in range(num_pages):
                page = pdf_reader.pages[page_num]
                page_text = page.extract_text()
                if page_text:
                    text += f"\n--- Page {page_num + 1} ---\n"
                    text += page_text + "\n"

        return text.strip()

    except Exception as e:
        print(f"   ❌ PDF extraction error: {e}")
        return ""


def extract_text_from_image(file_path: str) -> str:
    """
    Extract text from image using OCR (Tesseract)

    Args:
        file_path: Path to image file

    Returns:
        Extracted text
    """
    if not PYTESSERACT_AVAILABLE:
        print(f"   ⚠️  OCR not available - pytesseract not installed or incompatible")
        return ""
    
    try:
        image = Image.open(file_path)

        # Enhance image for better OCR
        from PIL import ImageEnhance
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(2)

        text = pytesseract.image_to_string(image)
        return text.strip()

    except Exception as e:
        print(f"   ❌ OCR extraction error: {e}")
        return ""


def extract_text_from_excel(file_path: str) -> str:
    """
    Extract text from Excel file

    Args:
        file_path: Path to Excel file

    Returns:
        Text representation of Excel data
    """
    try:
        df = pd.read_excel(file_path, sheet_name=0)

        # Convert to readable text
        text = f"Excel file with {len(df)} rows and {len(df.columns)} columns\n\n"
        text += "Columns: " + ", ".join(df.columns) + "\n\n"
        text += "Data:\n"
        text += df.to_string(index=False, max_rows=50)

        return text

    except Exception as e:
        print(f"   ❌ Excel extraction error: {e}")
        return ""


def extract_text_from_csv(file_path: str) -> str:
    """
    Extract text from CSV file

    Args:
        file_path: Path to CSV file

    Returns:
        Text representation of CSV data
    """
    try:
        df = pd.read_csv(file_path)

        text = f"CSV file with {len(df)} rows and {len(df.columns)} columns\n\n"
        text += "Columns: " + ", ".join(df.columns) + "\n\n"
        text += "Data:\n"
        text += df.to_string(index=False, max_rows=50)

        return text

    except Exception as e:
        print(f"   ❌ CSV extraction error: {e}")
        return ""


def extract_text_from_file(file_path: str) -> str:
    """
    Extract text from any supported file type

    Args:
        file_path: Path to file

    Returns:
        Extracted text
    """
    file_path = Path(file_path)
    extension = file_path.suffix.lower()

    print(f"   Extracting from {extension} file...")

    if extension == '.pdf':
        return extract_text_from_pdf(str(file_path))

    elif extension in ['.jpg', '.jpeg', '.png', '.webp']:
        return extract_text_from_image(str(file_path))

    elif extension in ['.xlsx', '.xls']:
        return extract_text_from_excel(str(file_path))

    elif extension == '.csv':
        return extract_text_from_csv(str(file_path))

    elif extension == '.txt':
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read().strip()
        except Exception as e:
            print(f"   ❌ Text file reading error: {e}")
            return ""

    else:
        print(f"   ⚠️ Unsupported file type: {extension}")
        return ""


# ============================================================================
# AI-POWERED EXTRACTION
# ============================================================================

def extract_with_ai_from_text(
        text: str,
        document_type: str,
        user_context: Optional[Dict] = None
) -> Dict:
    """
    Extract structured data from text using OpenAI

    Args:
        text: Raw text extracted from document
        document_type: Type of document (e.g., 'hotel_bill', 'cab_receipt')
        user_context: Additional context like location, period

    Returns:
        {
            'success': bool,
            'activities': List[Dict],
            'document_info': Dict,
            'confidence': float,
            'error': str (if failed)
        }
    """

    if not text or len(text) < 10:
        return {
            'success': False,
            'error': 'Text too short or empty',
            'activities': []
        }

    # Build context
    context = user_context or {}
    location = context.get('location', 'India')
    period = context.get('period', datetime.now().strftime('%Y-%m'))
    notes = context.get('notes', '')

    # Build extraction prompt
    prompt = build_extraction_prompt(text, document_type, location, period, notes)

    try:
        print(f"   🤖 Sending to OpenAI ({EXTRACTION_MODEL})...")

        # ✅ FIXED: Use lazy client initialization
        client = get_openai_client()

        response = client.chat.completions.create(
            model=EXTRACTION_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert at extracting emission-related data from documents. Extract all activities with quantities and units. Return valid JSON only."
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
        result_text = clean_json_response(result_text)

        result = json.loads(result_text)

        # Validate result
        if not isinstance(result, dict):
            return {
                'success': False,
                'error': 'Invalid JSON structure',
                'activities': []
            }

        activities = result.get('activities', [])

        if not activities:
            return {
                'success': False,
                'error': 'No activities found',
                'activities': []
            }

        print(f"   ✅ Extracted {len(activities)} activities")

        return {
            'success': True,
            'activities': activities,
            'document_info': result.get('document_info', {}),
            'confidence': result.get('confidence', 0.8)
        }

    except json.JSONDecodeError as e:
        print(f"   ❌ JSON parsing error: {e}")
        return {
            'success': False,
            'error': f'Failed to parse AI response: {str(e)}',
            'activities': []
        }

    except Exception as e:
        print(f"   ❌ AI extraction error: {e}")
        return {
            'success': False,
            'error': str(e),
            'activities': []
        }


def clean_json_response(text: str) -> str:
    """Clean JSON response from AI"""

    # Remove markdown code blocks
    if text.startswith('```json'):
        text = text[7:]
    if text.startswith('```'):
        text = text[3:]
    if text.endswith('```'):
        text = text[:-3]

    return text.strip()


# ============================================================================
# PROMPT BUILDERS
# ============================================================================

def build_extraction_prompt(
        text: str,
        document_type: str,
        location: str,
        period: str,
        notes: str
) -> str:
    """
    Build extraction prompt based on document type
    """

    # Truncate text if too long
    text_preview = text[:4000] if len(text) > 4000 else text

    base_prompt = f"""
Extract emission-related activities from this {document_type}.

DOCUMENT TEXT:
{text_preview}

CONTEXT:
- Location: {location}
- Period: {period}
- Notes: {notes}

TASK:
Extract ALL activities with:
1. Activity type (e.g., 'electricity', 'diesel', 'hotel_stay', 'taxi')
2. Category - ALWAYS assign one of these categories: Electricity, Diesel, Petrol, Coal, Natural Gas, Flight, Taxi, Train, Hotel, Refrigerant, Waste, Water, Transport, Fuel, LPG, CNG, Paper, Plastic, Steel, Cement, Other
3. Quantity (number)
4. Unit (e.g., 'kwh', 'litre', 'night', 'km')
5. Date (if available, format: YYYY-MM-DD)
6. Description
7. Any additional details (from_location, to_location, etc.)

IMPORTANT RULES:
- Extract ALL activities found in the document
- ALWAYS assign a category from the list above - this is MANDATORY
- Be precise with quantities and units
- Use standard units: kwh, litre, km, night, kg, tonne
- If date not found, use null
- Keep descriptions concise but informative
- For multi-row data (Excel/CSV), extract each row as separate activity
- Map activity types to categories:
  * electricity, power, grid → Electricity
  * diesel, diesel fuel → Diesel
  * petrol, gasoline → Petrol
  * coal, charcoal → Coal
  * natural_gas, gas → Natural Gas
  * flight, air travel, plane → Flight
  * taxi, cab, uber, ola → Taxi
  * train, rail → Train
  * hotel, accommodation → Hotel
  * refrigerant, ac, cooling → Refrigerant
  * waste, disposal → Waste
  * water, water supply → Water
  * transport, vehicle, car → Transport
  * fuel (generic) → Fuel
  * lpg → LPG
  * cng → CNG
  * paper, cardboard → Paper
  * plastic → Plastic
  * steel, metal → Steel
  * cement, concrete → Cement
  * anything else → Other

Return ONLY valid JSON in this exact format:
{{
    "document_info": {{
        "document_type": "{document_type}",
        "date": "YYYY-MM-DD or null",
        "vendor": "vendor name or null",
        "document_number": "invoice/receipt number or null",
        "total_amount": "amount or null"
    }},
    "activities": [
        {{
            "activity_type": "string (e.g., 'electricity', 'diesel')",
            "category": "string - REQUIRED (e.g., 'Electricity', 'Diesel', 'Flight')",
            "quantity": float (e.g., 100.5),
            "unit": "string (e.g., 'kwh')",
            "date": "YYYY-MM-DD or null",
            "description": "string",
            "from_location": "string or null",
            "to_location": "string or null",
            "additional_details": {{}}
        }}
    ],
    "confidence": 0.0-1.0
}}
"""

    # Add document-specific instructions
    if document_type == 'hotel_bill':
        base_prompt += """

HOTEL BILL SPECIFIC:
- Look for: room nights, electricity usage, meals, laundry
- Activity types: 'hotel_stay', 'electricity', 'meals', 'laundry'
- Extract hotel name, check-in/out dates
"""

    elif document_type == 'cab_receipt':
        base_prompt += """

CAB RECEIPT SPECIFIC:
- Look for: distance traveled, vehicle type, service provider
- Activity types: 'taxi', 'cab', 'ride'
- Extract: from_location, to_location, distance, vehicle type
"""

    elif document_type == 'train_ticket':
        base_prompt += """

TRAIN TICKET SPECIFIC:
- Look for: distance, class, passenger count, from/to stations
- Activity types: 'train', 'rail'
- Extract: from_station, to_station, class, distance
"""

    elif document_type == 'electricity_bill':
        base_prompt += """

ELECTRICITY BILL SPECIFIC:
- Look for: kWh consumed, meter readings, billing period
- Activity type: 'electricity'
- Unit: 'kwh'
- Extract: consumption (current - previous reading)
"""

    elif document_type == 'fuel_receipt':
        base_prompt += """

FUEL RECEIPT SPECIFIC:
- Look for: fuel type (diesel/petrol/CNG), quantity in litres
- Activity types: 'diesel', 'petrol', 'cng'
- Unit: 'litre'
- Extract: fuel type, pump name
"""

    elif document_type == 'flight_ticket':
        base_prompt += """

FLIGHT TICKET SPECIFIC:
- Look for: from/to airports, distance, class, airline
- Activity types: 'flight_domestic', 'flight_international'
- Extract: departure, arrival, distance (if available)
"""

    elif document_type == 'waste_invoice':
        base_prompt += """

WASTE INVOICE SPECIFIC:
- Look for: waste type (landfill/recycling/compost), weight
- Activity types: 'waste_landfill', 'waste_recycling', 'waste_compost'
- Unit: 'kg' or 'tonne'
"""

    elif document_type == 'water_bill':
        base_prompt += """

WATER BILL SPECIFIC:
- Look for: water consumption in cubic meters (m3)
- Activity type: 'water_supply'
- Unit: 'm3'
"""

    elif document_type in ['purchase_invoice', 'general']:
        base_prompt += """

GENERAL INVOICE:
- Look for any materials/services with quantities
- Try to identify: material type, quantity, unit
- Extract: supplier name, invoice date, items
"""

    return base_prompt


# ============================================================================
# MAIN EXTRACTION FUNCTION (for compatibility)
# ============================================================================

def extract_from_document(
        file_path: str,
        document_type: Optional[str] = None,
        user_context: Optional[Dict] = None
) -> Dict:
    """
    Complete extraction pipeline: file -> text -> structured data

    This is the main function called by universal_document_processor

    Args:
        file_path: Path to document
        document_type: Type of document (if known)
        user_context: Additional context

    Returns:
        {
            'success': bool,
            'activities': List[Dict],
            'document_info': Dict,
            'text_extracted': str,
            'confidence': float,
            'error': str (if failed)
        }
    """

    print(f"\n{'=' * 70}")
    print(f"📄 CHATGPT EXTRACTOR")
    print(f"{'=' * 70}")
    print(f"   File: {Path(file_path).name}")
    print(f"   Type: {document_type or 'Unknown'}")

    # Step 1: Extract text
    print(f"\n1️⃣ Extracting text from file...")
    text = extract_text_from_file(file_path)

    if not text:
        return {
            'success': False,
            'error': 'Failed to extract text from file',
            'activities': [],
            'text_extracted': ''
        }

    print(f"   ✅ Extracted {len(text)} characters")

    # Step 2: Send to AI for structuring
    print(f"\n2️⃣ Structuring with AI...")
    result = extract_with_ai_from_text(
        text=text,
        document_type=document_type or 'general',
        user_context=user_context
    )

    # Add extracted text to result
    result['text_extracted'] = text[:500]  # First 500 chars for reference

    print(f"\n{'=' * 70}")
    if result['success']:
        print(f"✅ EXTRACTION COMPLETE - {len(result['activities'])} activities")
    else:
        print(f"❌ EXTRACTION FAILED - {result.get('error')}")
    print(f"{'=' * 70}\n")

    return result


# ============================================================================
# ADDITIONAL HELPER FUNCTION (for specialized extractors)
# ============================================================================

def extract_document_data(file_path: str, doc_type: str) -> Dict:
    """
    Alternative interface for specialized extractors

    Returns data in format expected by specialized extractors
    """

    result = extract_from_document(file_path, doc_type, None)

    if result['success']:
        # Convert to format expected by specialized extractors
        return {
            'success': True,
            'data': {
                'activities': result['activities'],
                **result.get('document_info', {})
            }
        }
    else:
        return {
            'success': False,
            'error': result.get('error'),
            'data': {}
        }


# ============================================================================
# BATCH PROCESSING
# ============================================================================

def extract_from_multiple_files(
        file_paths: List[str],
        user_context: Optional[Dict] = None
) -> List[Dict]:
    """
    Extract from multiple files

    Args:
        file_paths: List of file paths
        user_context: Shared context for all files

    Returns:
        List of extraction results
    """

    results = []

    for i, file_path in enumerate(file_paths, 1):
        print(f"\n{'=' * 70}")
        print(f"Processing file {i}/{len(file_paths)}: {Path(file_path).name}")
        print(f"{'=' * 70}")

        result = extract_from_document(
            file_path=file_path,
            user_context=user_context
        )

        results.append({
            'file': Path(file_path).name,
            'result': result
        })

    return results


# ============================================================================
# VALIDATION HELPERS
# ============================================================================

def validate_extracted_activity(activity: Dict) -> tuple[bool, Optional[str]]:
    """
    Validate extracted activity data

    Returns:
        (is_valid, error_message)
    """

    required_fields = ['activity_type', 'quantity', 'unit']

    for field in required_fields:
        if field not in activity:
            return False, f"Missing required field: {field}"

    # Validate quantity is numeric
    try:
        float(activity['quantity'])
    except:
        return False, "Quantity must be numeric"

    # Validate unit is not empty
    if not activity['unit'] or not activity['unit'].strip():
        return False, "Unit cannot be empty"

    return True, None


def validate_extraction_result(result: Dict) -> Dict:
    """
    Validate and clean extraction result

    Returns:
        Cleaned result with validation info
    """

    if not result.get('success'):
        return result

    activities = result.get('activities', [])
    valid_activities = []
    validation_errors = []

    for i, activity in enumerate(activities):
        is_valid, error = validate_extracted_activity(activity)

        if is_valid:
            valid_activities.append(activity)
        else:
            validation_errors.append({
                'activity_index': i,
                'error': error,
                'activity_data': activity
            })

    result['activities'] = valid_activities
    result['validation_errors'] = validation_errors if validation_errors else None
    result['validation_summary'] = {
        'total': len(activities),
        'valid': len(valid_activities),
        'invalid': len(validation_errors)
    }

    return result


# ============================================================================
# TESTING
# ============================================================================

if __name__ == "__main__":
    print("=" * 70)
    print("🧪 CHATGPT EXTRACTOR - TEST")
    print("=" * 70)

    # Test with sample text
    sample_text = """
    Hotel Bill
    Date: 2024-10-15
    Guest: John Doe

    Room Charges: 2 nights @ Rs 3000/night = Rs 6000
    Electricity Usage: 45 kWh
    Meals: Rs 1500

    Total: Rs 7500
    """

    print("\n🔍 Testing extraction from sample text...")

    result = extract_with_ai_from_text(
        text=sample_text,
        document_type='hotel_bill',
        user_context={
            'location': 'Mumbai, India',
            'period': '2024-10'
        }
    )

    print("\n" + "=" * 70)
    print("RESULT:")
    print("=" * 70)
    print(json.dumps(result, indent=2))

    print("\n" + "=" * 70)
    print("✅ TEST COMPLETE")
    print("=" * 70)