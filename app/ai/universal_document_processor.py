# app/ai/universal_document_processor.py
"""
UNIVERSAL DOCUMENT PROCESSOR - FINAL MERGED VERSION
===================================================
Combines:
- Your user-friendly formatting and summaries
- Fixed imports (no redundant calculators)
- Proper chatgpt_extractor integration
- All specialized extractors

One endpoint to rule them all - handles ANY document type automatically
"""

from openai import OpenAI
import json
from typing import Dict, Optional, List
from pathlib import Path
from datetime import datetime
import PyPDF2
import pandas as pd

from app.config import OPENAI_API_KEY, EXTRACTION_MODEL

# ✅ FIXED: Import from correct chatgpt_extractor
from app.ai.chatgpt_extractor import extract_from_document as chatgpt_extract

# ✅ FIXED: Import unified engine (not smart_emission_calculator)
from app.calculators.unified_emission_engine import get_engine

from app.ai.scope_classifier import classify_scope_and_category
from app.database import SessionLocal

# Import all specialized extractors
from app.ai.hotel_extractor import extract_hotel_bill
from app.ai.cab_extractor import extract_cab_receipt
from app.ai.train_extractor import extract_train_ticket
from app.ai.logistics_extractor import extract_logistics_invoice
from app.ai.purchase_invoice_extractor import extract_purchase_invoice
from app.ai.waste_extractor import extract_waste_invoice
from app.ai.water_extractor import extract_water_bill
from app.ai.commute_extractor import extract_commute_data
from app.ai.lca_extractor import extract_lca_report
from app.ai.brsr_extractor import extract_brsr_emissions

client = OpenAI(api_key=OPENAI_API_KEY)


# ============================================================================
# MAIN PROCESSING FUNCTION
# ============================================================================

def process_any_document(
        file_path: str,
        user_context: Optional[Dict] = None
) -> Dict:
    """
    Universal processor - handles ANY document automatically

    User Experience:
    ---------------
    1. User uploads file (any type)
    2. Optional: User adds context ("Mumbai office", "Q3 2024")
    3. System does everything else

    Args:
        file_path: Path to uploaded file
        user_context: Optional dict with:
            - location: "Mumbai office"
            - period: "Q3 2024"
            - notes: "Generator fuel for backup"

    Returns:
        {
            'success': bool,
            'document_type_detected': 'Electricity Bill',
            'simple_summary': 'Your electricity usage generated 2,500 kg CO2e',
            'activities': [...],
            'total_emissions': {...},
            'technical_details': {...},
            'data_quality': 'High',
            'recommendations': [...]
        }
    """

    print(f"\n{'=' * 70}")
    print(f"🌍 UNIVERSAL DOCUMENT PROCESSOR")
    print(f"{'=' * 70}")
    print(f"📄 File: {Path(file_path).name}")
    if user_context:
        print(f"📝 Context: {user_context.get('location', 'N/A')}, {user_context.get('period', 'N/A')}")
    print(f"{'=' * 70}")

    try:
        # STEP 1: Auto-detect document type
        print("\n1️⃣ Detecting document type...")
        doc_type = auto_detect_document_type(file_path)
        print(f"   ✅ Detected: {format_document_type_friendly(doc_type)}")

        # STEP 2: Extract data using appropriate extractor
        print("\n2️⃣ Extracting data...")
        extracted = route_to_extractor(file_path, doc_type, user_context)

        if not extracted.get('success'):
            return {
                'success': False,
                'error': 'Could not extract data from document',
                'details': extracted.get('error')
            }

        print(f"   ✅ Extraction successful")

        # STEP 3: Process activities
        print("\n3️⃣ Processing activities...")
        activities = process_extracted_activities(extracted, doc_type, user_context)
        print(f"   ✅ Found {len(activities)} activities")

        # STEP 4: Calculate emissions
        print("\n4️⃣ Calculating emissions...")
        activities = calculate_emissions_for_activities(activities, user_context)

        # STEP 5: Generate summary
        print("\n5️⃣ Generating summary...")
        summary = generate_simple_summary(activities, doc_type)

        # STEP 6: Calculate totals
        total_emissions_kg = sum(a.get('emissions_kg', 0) for a in activities)

        # STEP 7: Generate recommendations
        recommendations = generate_recommendations(activities, doc_type)

        print(f"\n{'=' * 70}")
        print(f"✅ PROCESSING COMPLETE")
        print(f"{'=' * 70}")
        print(f"📊 {summary}")
        print(f"🌍 Total: {format_emissions_readable(total_emissions_kg)}")
        print(f"{'=' * 70}\n")

        return {
            'success': True,
            'document_type_detected': format_document_type_friendly(doc_type),
            'simple_summary': summary,
            'activities': [format_activity_for_user(a) for a in activities],
            'total_emissions': {
                'kg': round(total_emissions_kg, 2),
                'tonnes': round(total_emissions_kg / 1000, 2),
                'readable': format_emissions_readable(total_emissions_kg),
                'equivalent_to': get_relatable_equivalent(total_emissions_kg)
            },
            'scope_breakdown': calculate_scope_breakdown(activities),
            'technical_details': {
                'document_type_code': doc_type,
                'raw_extracted_data': extracted.get('data', {}),
                'activities_detailed': activities,
                'processing_timestamp': datetime.now().isoformat()
            },
            'data_quality': determine_overall_quality(activities),
            'recommendations': recommendations,
            'user_context': user_context
        }

    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

        return {
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }


# ============================================================================
# DOCUMENT TYPE DETECTION
# ============================================================================

def auto_detect_document_type(file_path: str) -> str:
    """
    Automatically detect document type from content
    Uses fast keyword matching + AI confirmation
    """
    file_ext = Path(file_path).suffix.lower()

    # Quick preview for detection
    preview_text = get_document_preview(file_path, file_ext)

    if not preview_text:
        return 'general'

    # FAST keyword-based detection (no AI cost)
    keywords = {
        'electricity_bill': ['electricity', 'kwh', 'mwh', 'power', 'meter reading', 'energy charges',
                             'electric supply'],
        'fuel_receipt': ['diesel', 'petrol', 'gasoline', 'litre', 'fuel', 'pump', 'filling station'],
        'hotel_bill': ['hotel', 'check-in', 'check-out', 'room', 'guest', 'accommodation', 'booking', 'reservation'],
        'cab_receipt': ['uber', 'ola', 'taxi', 'cab', 'ride', 'trip id', 'pickup', 'drop'],
        'train_ticket': ['train', 'railway', 'irctc', 'pnr', 'berth', 'coach', 'passenger'],
        'flight_ticket': ['flight', 'airline', 'pnr', 'boarding', 'departure', 'arrival', 'passenger'],
        'logistics_invoice': ['courier', 'shipment', 'tracking', 'consignment', 'freight', 'awb', 'dhl', 'fedex',
                              'blue dart'],
        'waste_invoice': ['waste', 'disposal', 'landfill', 'recycling', 'tonnes', 'waste management', 'collection'],
        'water_bill': ['water', 'cubic meter', 'm3', 'consumption', 'municipal', 'meter reading', 'water supply'],
        'purchase_invoice': ['purchase order', 'invoice', 'material', 'quantity', 'supplier', 'vendor', 'gstin'],
        'brsr_report': ['brsr', 'principle 6', 'ghg emission', 'scope 1', 'scope 2', 'scope 3', 'environmental'],
        'lca_report': ['life cycle', 'lca', 'carbon footprint', 'lifecycle', 'functional unit', 'iso 14040', 'cradle'],
        'commute_survey': ['commute', 'employee', 'transport mode', 'distance', 'days per week']
    }

    preview_lower = preview_text.lower()

    # Score each type
    scores = {}
    for doc_type, keywords_list in keywords.items():
        score = sum(1 for kw in keywords_list if kw in preview_lower)
        if score > 0:
            scores[doc_type] = score

    # Get best match
    if scores:
        best_type = max(scores, key=scores.get)
        if scores[best_type] >= 2:  # At least 2 keyword matches
            return best_type

    # Fallback: use AI for ambiguous cases
    return ai_detect_document_type(preview_text)


def ai_detect_document_type(preview_text: str) -> str:
    """AI-based document type detection (fallback)"""

    prompt = f"""
Classify this document into ONE of these types:
- electricity_bill
- fuel_receipt
- hotel_bill
- cab_receipt
- train_ticket
- flight_ticket
- logistics_invoice
- waste_invoice
- water_bill
- purchase_invoice
- brsr_report
- lca_report
- commute_survey
- general (if unclear)

Document preview:
{preview_text[:2000]}

Return ONLY the type name, nothing else.
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a document classifier. Return only the type name."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,
            max_tokens=20
        )

        doc_type = response.choices[0].message.content.strip().lower()
        return doc_type if doc_type else 'general'

    except:
        return 'general'


def get_document_preview(file_path: str, file_ext: str) -> str:
    """Get first few lines/pages for type detection"""
    try:
        if file_ext == '.txt':
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read(3000)

        elif file_ext == '.pdf':
            with open(file_path, 'rb') as f:
                pdf = PyPDF2.PdfReader(f)
                text = ""
                for page in pdf.pages[:2]:
                    text += page.extract_text()
                return text[:3000]

        elif file_ext in ['.xlsx', '.xls', '.csv']:
            df = pd.read_csv(file_path) if file_ext == '.csv' else pd.read_excel(file_path)
            return str(df.head(10))

        return ""
    except:
        return ""


# ============================================================================
# ROUTING TO EXTRACTORS
# ============================================================================

def route_to_extractor(file_path: str, doc_type: str, user_context: Dict) -> Dict:
    """
    Route document to appropriate extractor
    """

    print(f"   Routing to extractor for: {doc_type}")

    try:
        # Get preview for specialized extractors
        file_ext = Path(file_path).suffix.lower()
        preview = get_document_preview(file_path, file_ext)

        # Route to specialized extractors
        if doc_type == 'hotel_bill':
            return extract_hotel_bill(preview, "text")
        elif doc_type == 'cab_receipt':
            return extract_cab_receipt(preview, "text")
        elif doc_type == 'train_ticket':
            return extract_train_ticket(preview, "text")
        elif doc_type == 'logistics_invoice':
            return extract_logistics_invoice(preview, "text")
        elif doc_type == 'waste_invoice':
            return extract_waste_invoice(preview, "text")
        elif doc_type == 'water_bill':
            return extract_water_bill(preview, "text")
        elif doc_type == 'purchase_invoice':
            return extract_purchase_invoice(preview, "text")
        elif doc_type == 'lca_report':
            return extract_lca_report(file_path)
        elif doc_type == 'commute_survey':
            return extract_commute_data(file_path)
        elif doc_type == 'brsr_report':
            return extract_brsr_emissions(file_path)
        else:
            # ✅ FIXED: Use correct chatgpt_extract function
            result = chatgpt_extract(
                file_path=file_path,
                document_type=doc_type,
                user_context=user_context
            )
            # Convert to expected format
            return {
                'success': result.get('success', False),
                'data': {
                    'activities': result.get('activities', [])
                } if result.get('success') else {},
                'error': result.get('error')
            }

    except Exception as e:
        print(f"   ❌ Extractor error: {e}")
        return {
            'success': False,
            'error': str(e)
        }


# ============================================================================
# ACTIVITY PROCESSING
# ============================================================================

def process_extracted_activities(
        extracted: Dict,
        doc_type: str,
        user_context: Optional[Dict]
) -> list:
    """
    Convert extracted data into activities - FIXED VERSION
    """
    activities = []
    data = extracted.get('data', {})

    # ✅ FIX: Handle specialized extractor output
    if doc_type in ['train_ticket', 'hotel_bill', 'cab_receipt']:
        # These extractors return data directly, not in 'activities' array
        activity = normalize_activity_specialized(data, doc_type, user_context)
        if activity['quantity'] > 0:
            activities.append(activity)
    elif data.get('multi_activity') or ('activities' in data and isinstance(data['activities'], list)):
        # Multi-activity document
        for activity_raw in data.get('activities', []):
            activity = normalize_activity(activity_raw, doc_type, user_context)
            activities.append(activity)
    else:
        # Single activity document
        activity = normalize_activity(data, doc_type, user_context)
        activities.append(activity)

    return activities


def normalize_activity_specialized(data: Dict, doc_type: str, user_context: Optional[Dict]) -> Dict:
    """
    Handle specialized extractor output (train, hotel, cab)
    These have different data structures!
    """

    # Extract based on doc type
    if doc_type == 'train_ticket':
        quantity = data.get('distance_km', 0)
        unit = 'km'
        activity_type = 'train_electric'
        category = 'Train'
        description = f"{data.get('train_name', 'Train')} - {data.get('from_station', '')} to {data.get('to_station', '')}"

    elif doc_type == 'hotel_bill':
        quantity = data.get('nights', 0)
        unit = 'night'
        activity_type = f"hotel_{data.get('hotel_category', 'economy')}"
        category = 'Hotel'
        description = f"Hotel Stay - {data.get('hotel_name', 'Accommodation')}"

    elif doc_type == 'cab_receipt':
        quantity = data.get('distance_km', 0)
        unit = 'km'
        activity_type = f"taxi_{data.get('vehicle_type', 'sedan')}"
        category = 'Taxi'
        description = f"Taxi/Cab - {data.get('service_provider', 'Ride')}"

    else:
        # Fallback to original
        return normalize_activity(data, doc_type, user_context)

    print(f"   ✅ Specialized extractor: {quantity} {unit}")

    classification = classify_scope_and_category(
        activity_description=description,
        category=category,
        quantity=quantity,
        unit=unit
    )

    return {
        'activity_name': description,
        'activity_type': activity_type,
        'category': category,  # Store the category
        'quantity': float(quantity),
        'unit': unit,
        'description': description,
        'date': data.get('date') or data.get('booking_date') or data.get('check_in'),
        'location': user_context.get('location') if user_context else data.get('location'),
        'from_location': data.get('from_station') or data.get('pickup') or data.get('from'),
        'to_location': data.get('to_station') or data.get('drop') or data.get('to'),
        'scope': classification['scope'],
        'scope_category': classification['sub_category'],
        'category_name': classification['category_name'],
        'confidence': classification.get('confidence', 0.9),
        'raw_data': data
    }


def normalize_activity(raw_data: Dict, doc_type: str, user_context: Optional[Dict]) -> Dict:
    """Normalize activity data into standard format - NEVER uses 'unknown' category"""

    activity_type = infer_activity_type(raw_data, doc_type)
    
    # Get category from AI extraction or infer from activity type
    extracted_category = raw_data.get('category', '')
    
    # If category is 'unknown' or empty, infer from activity type
    if not extracted_category or extracted_category.lower() == 'unknown':
        extracted_category = infer_category_from_activity_type(activity_type)
    
    # Ensure we never have 'unknown' as category
    if extracted_category.lower() == 'unknown':
        extracted_category = 'Other'

    classification = classify_scope_and_category(
        activity_description=raw_data.get('description', ''),
        category=extracted_category or activity_type,
        quantity=raw_data.get('quantity', 0),
        unit=raw_data.get('unit', '')
    )

    activity_name = build_activity_name(raw_data, doc_type, classification)
    
    # Final category - never 'unknown'
    final_category = extracted_category or classification['category_name']
    if final_category.lower() == 'unknown':
        final_category = 'Other'

    return {
        'activity_name': activity_name,
        'activity_type': activity_type,
        'category': final_category,  # Store the category - NEVER 'unknown'
        'quantity': float(raw_data.get('quantity', 0)),
        'unit': raw_data.get('unit', ''),
        'description': raw_data.get('description', ''),
        'date': raw_data.get('date'),
        'location': user_context.get('location') if user_context else raw_data.get('location'),
        'scope': classification['scope'],
        'scope_category': classification['sub_category'],
        'category_name': final_category if final_category != 'Other' else classification['category_name'],
        'confidence': classification.get('confidence', 0.8),
        'raw_data': raw_data
    }


def infer_category_from_activity_type(activity_type: str) -> str:
    """Infer category from activity type - NEVER returns 'unknown'"""
    if not activity_type:
        return 'Other'
    
    activity_lower = activity_type.lower()
    
    # If it's already "unknown", return "Other" instead
    if activity_lower == 'unknown':
        return 'Other'
    
    # Category mapping - comprehensive list
    category_map = {
        'electricity': 'Electricity',
        'power': 'Electricity',
        'grid': 'Electricity',
        'kwh': 'Electricity',
        'mwh': 'Electricity',
        'diesel': 'Diesel',
        'petrol': 'Petrol',
        'gasoline': 'Petrol',
        'coal': 'Coal',
        'natural_gas': 'Natural Gas',
        'gas': 'Natural Gas',
        'flight': 'Flight',
        'air_travel': 'Flight',
        'plane': 'Flight',
        'aviation': 'Flight',
        'taxi': 'Taxi',
        'cab': 'Taxi',
        'uber': 'Taxi',
        'ola': 'Taxi',
        'ride': 'Taxi',
        'train': 'Train',
        'rail': 'Train',
        'railway': 'Train',
        'metro': 'Train',
        'hotel': 'Hotel',
        'accommodation': 'Hotel',
        'stay': 'Hotel',
        'lodging': 'Hotel',
        'refrigerant': 'Refrigerant',
        'ac': 'Refrigerant',
        'cooling': 'Refrigerant',
        'hvac': 'Refrigerant',
        'r134a': 'Refrigerant',
        'r410a': 'Refrigerant',
        'r22': 'Refrigerant',
        'waste': 'Waste',
        'disposal': 'Waste',
        'landfill': 'Waste',
        'recycling': 'Waste',
        'water': 'Water',
        'supply': 'Water',
        'transport': 'Transport',
        'vehicle': 'Transport',
        'car': 'Transport',
        'truck': 'Transport',
        'logistics': 'Transport',
        'freight': 'Transport',
        'shipping': 'Transport',
        'fuel': 'Fuel',
        'lpg': 'LPG',
        'cng': 'CNG',
        'paper': 'Paper',
        'cardboard': 'Paper',
        'printing': 'Paper',
        'plastic': 'Plastic',
        'polymer': 'Plastic',
        'steel': 'Steel',
        'metal': 'Steel',
        'aluminum': 'Steel',
        'iron': 'Steel',
        'cement': 'Cement',
        'concrete': 'Cement',
        'construction': 'Cement',
        'kerosene': 'Fuel',
        'furnace': 'Fuel',
        'boiler': 'Fuel',
        'generator': 'Diesel',
        'dg': 'Diesel',
        'commute': 'Transport',
        'bus': 'Transport',
        'motorcycle': 'Transport',
        'bike': 'Transport',
        'scope': 'Emissions',  # For BRSR reports
        'emission': 'Emissions',
        'ghg': 'Emissions',
        'carbon': 'Emissions',
    }
    
    # Check for matches
    for key, category in category_map.items():
        if key in activity_lower:
            return category
    
    # NEVER return 'unknown' - always return 'Other'
    return 'Other'


def infer_activity_type(data: Dict, doc_type: str) -> str:
    """Infer activity type from document type and data - NEVER returns 'unknown'"""

    type_mapping = {
        'electricity_bill': 'electricity',
        'fuel_receipt': data.get('fuel_type', 'diesel').lower(),
        'hotel_bill': f"hotel_{data.get('room_type', 'economy')}",
        'cab_receipt': f"taxi_{data.get('vehicle_type', 'sedan')}",
        'train_ticket': 'train_electric',
        'flight_ticket': 'flight_domestic',
        'waste_invoice': f"waste_{data.get('waste_type', 'landfill')}",
        'water_bill': 'water_supply',
        'brsr_report': 'emissions_reported',
        'purchase_invoice': 'purchased_goods',
        'general': 'general_activity'
    }

    activity_type = type_mapping.get(doc_type, data.get('activity_type', ''))
    
    # NEVER return 'unknown' - use 'other' instead
    if not activity_type or activity_type.lower() == 'unknown':
        activity_type = 'other_activity'
    
    return activity_type


def build_activity_name(data: Dict, doc_type: str, classification: Dict) -> str:
    """Build human-readable activity name"""

    names = {
        'electricity_bill': 'Office Electricity',
        'fuel_receipt': f"{data.get('fuel_type', 'Diesel')} Fuel",
        'hotel_bill': f"Hotel Stay - {data.get('hotel_name', 'Accommodation')}",
        'cab_receipt': f"Taxi/Cab - {data.get('service_provider', 'Ride')}",
        'train_ticket': f"Train Travel - {data.get('from_station', '')} to {data.get('to_station', '')}",
        'flight_ticket': f"Flight - {data.get('from', '')} to {data.get('to', '')}",
        'waste_invoice': f"Waste Disposal - {data.get('waste_type', 'General')}",
        'water_bill': 'Water Consumption',
        'brsr_report': data.get('description', f"BRSR Reported - {data.get('scope', 'Total')} Emissions")  # ✅ Added
    }

    return names.get(doc_type, data.get('description', 'Activity'))

# ============================================================================
# EMISSION CALCULATIONS
# ============================================================================

def calculate_emissions_for_activities(activities: List[Dict], user_context: Optional[Dict]) -> List[Dict]:
    """
    Calculate emissions for all activities
    FIXED: Skip calculation if already in CO2e units
    """

    engine = get_engine()
    location = user_context.get('location', 'India') if user_context else 'India'

    for activity in activities:
        try:
            unit = activity.get('unit', '').lower()
            quantity = activity.get('quantity', 0)

            # ✅ FIX: Check if data is already in CO2e
            if unit in ['kgco2e', 'kg co2e', 'kgco₂e', 'co2e', 'tco2e', 'tonnes co2e']:
                print(f"   ℹ️ {activity['activity_name']}: Already in CO2e units, no calculation needed")

                # Convert tonnes to kg if needed
                if 'tco2e' in unit or 'tonnes' in unit:
                    emissions_kg = quantity * 1000
                else:
                    emissions_kg = quantity

                activity['calculation'] = {
                    'success': True,
                    'co2e_kg': emissions_kg,
                    'emission_factor': 1.0,
                    'emission_factor_unit': 'Already in CO2e',
                    'calculation_method': 'direct_reporting',
                    'data_quality': 'High',
                    'confidence': 0.95,
                    'source': 'BRSR/Direct Report'
                }
                activity['emissions_kg'] = emissions_kg
                activity['emissions_readable'] = format_emissions_readable(emissions_kg)
                activity['equivalent_to'] = get_relatable_equivalent(emissions_kg)

                print(f"   ✅ {activity['activity_name']}: {emissions_kg:,.0f} kg CO2e (direct)")
                continue

            # ✅ Normal calculation for other units
            result = engine.calculate_emissions(
                activity_type=activity['activity_type'],
                quantity=quantity,
                unit=unit,
                region=location,
                description=activity.get('description', '')
            )

            if result.success:
                activity['calculation'] = {
                    'success': True,
                    'co2e_kg': result.co2e_kg,
                    'emission_factor': result.emission_factor,
                    'emission_factor_unit': result.emission_factor_unit,
                    'calculation_method': result.calculation_method,
                    'data_quality': result.data_quality,
                    'confidence': result.confidence,
                    'source': result.source
                }
                activity['emissions_kg'] = result.co2e_kg
                activity['emissions_readable'] = format_emissions_readable(result.co2e_kg)
                activity['equivalent_to'] = get_relatable_equivalent(result.co2e_kg)

                print(f"   ✅ {activity['activity_name']}: {result.co2e_kg:.2f} kg CO2e")
            else:
                activity['calculation'] = {'success': False, 'error': result.error}
                activity['emissions_kg'] = 0
                print(f"   ❌ {activity['activity_name']}: Calculation failed")

        except Exception as e:
            print(f"   ❌ Error calculating: {e}")
            activity['calculation'] = {'success': False, 'error': str(e)}
            activity['emissions_kg'] = 0

    return activities

# ============================================================================
# USER-FRIENDLY FORMATTING
# ============================================================================

def format_activity_for_user(activity: Dict) -> Dict:
    """Format activity in simple, non-technical language"""

    calculation = activity.get('calculation', {})

    return {
        'name': activity['activity_name'],
        'what_you_did': describe_activity_simply(activity),
        'emissions': {
            'amount': f"{activity.get('emissions_kg', 0):.1f} kg CO2e",
            'readable': activity.get('emissions_readable', 'Unknown'),
            'equivalent_to': activity.get('equivalent_to', 'Unknown')
        },
        'category': get_simple_category_name(activity),
        'category_raw': activity.get('category', activity.get('category_name', 'Other')),  # Raw category for charts
        'data_quality': get_quality_badge(calculation.get('data_quality')),
        'details': {
            'quantity': f"{activity['quantity']} {activity['unit']}",
            'date': activity.get('date'),
            'location': activity.get('location')
        }
    }


def describe_activity_simply(activity: Dict) -> str:
    """Describe activity in plain English"""

    descriptions = {
        'electricity': f"Used {activity['quantity']} {activity['unit']} of electricity",
        'diesel': f"Consumed {activity['quantity']} {activity['unit']} of diesel fuel",
        'hotel': f"Stayed {activity['quantity']} nights at hotel",
        'taxi': f"Traveled {activity['quantity']} km by taxi",
        'train': f"Traveled {activity['quantity']} km by train",
        'flight': f"Flew {activity['quantity']} km",
        'waste': f"Disposed {activity['quantity']} kg of waste"
    }

    activity_type = activity['activity_type']
    for key in descriptions:
        if key in activity_type:
            return descriptions[key]

    return f"Activity: {activity['quantity']} {activity['unit']}"


def get_simple_category_name(activity: Dict) -> str:
    """Convert technical scope to simple language"""

    scope = activity['scope']
    category = activity['category_name']

    simple_names = {
        'Scope 1': f"Direct Emissions - {category}",
        'Scope 2': "Indirect Emissions from Energy You Bought",
        'Scope 3': f"Supply Chain Emissions - {category}"
    }

    return simple_names.get(scope, category)


def get_quality_badge(quality: str) -> str:
    """Convert quality to user-friendly badge"""

    badges = {
        'High': '🟢 High Quality - Accurate data',
        'Medium': '🟡 Medium Quality - Good estimate',
        'Low': '🟠 Low Quality - Rough estimate',
        'Estimated': '🔴 AI Estimated - Needs verification'
    }

    return badges.get(quality, '⚪ Unknown')


def format_emissions_readable(emissions_kg: float) -> str:
    """Format emissions in readable units"""

    if emissions_kg < 1:
        return f"{emissions_kg * 1000:.0f} grams CO2e"
    elif emissions_kg < 1000:
        return f"{emissions_kg:.1f} kg CO2e"
    else:
        return f"{emissions_kg / 1000:.2f} tonnes CO2e"


def get_relatable_equivalent(emissions_kg: float) -> str:
    """Convert emissions to relatable equivalents"""

    km_in_car = emissions_kg / 0.22
    trees_needed = emissions_kg / 20
    smartphone_charges = emissions_kg / 0.008

    if emissions_kg < 10:
        return f"{smartphone_charges:.0f} smartphone charges"
    elif emissions_kg < 100:
        return f"{km_in_car:.0f} km in a petrol car"
    else:
        return f"{trees_needed:.1f} trees needed for 1 year to offset"


def generate_simple_summary(activities: list, doc_type: str) -> str:
    """Generate plain-English summary"""

    total_emissions = sum(a.get('emissions_kg', 0) for a in activities)

    summaries = {
        'electricity_bill': f"Your electricity usage generated {format_emissions_readable(total_emissions)}",
        'fuel_receipt': f"This fuel purchase will emit {format_emissions_readable(total_emissions)}",
        'hotel_bill': f"Your hotel stay generated {format_emissions_readable(total_emissions)}",
        'cab_receipt': f"This taxi ride generated {format_emissions_readable(total_emissions)}",
        'train_ticket': f"This train journey generated {format_emissions_readable(total_emissions)}",
        'brsr_report': f"Total emissions reported: {format_emissions_readable(total_emissions)}"
    }

    return summaries.get(doc_type, f"Total emissions: {format_emissions_readable(total_emissions)}")


def generate_recommendations(activities: list, doc_type: str) -> list:
    """Generate actionable recommendations"""

    recommendations = []

    for activity in activities:
        emissions = activity.get('emissions_kg', 0)

        if 'electricity' in activity['activity_type']:
            if emissions > 500:
                recommendations.append({
                    'title': 'Switch to Solar Power',
                    'description': 'Consider installing solar panels to reduce grid electricity usage',
                    'potential_reduction': '80%'
                })

        elif 'flight' in activity['activity_type']:
            recommendations.append({
                'title': 'Consider Virtual Meetings',
                'description': 'Video calls can replace short-haul flights',
                'potential_reduction': '100%'
            })

        elif 'diesel' in activity['activity_type']:
            recommendations.append({
                'title': 'Switch to Electric Vehicles',
                'description': 'EVs can reduce emissions by up to 70%',
                'potential_reduction': '70%'
            })

    return recommendations


def determine_overall_quality(activities: list) -> str:
    """Determine overall data quality"""

    quality_scores = {
        'High': 4,
        'Medium': 3,
        'Low': 2,
        'Estimated': 1
    }

    avg_score = sum(
        quality_scores.get(a.get('calculation', {}).get('data_quality', 'Medium'), 3)
        for a in activities
    ) / len(activities) if activities else 3

    if avg_score >= 3.5:
        return 'High'
    elif avg_score >= 2.5:
        return 'Medium'
    else:
        return 'Low'


def calculate_scope_breakdown(activities: list) -> Dict:
    """Calculate emissions by scope"""

    scope_totals = {'scope_1_kg': 0, 'scope_2_kg': 0, 'scope_3_kg': 0}

    for activity in activities:
        scope = activity.get('scope', 'Scope 3')
        emissions = activity.get('emissions_kg', 0)

        if 'Scope 1' in scope:
            scope_totals['scope_1_kg'] += emissions
        elif 'Scope 2' in scope:
            scope_totals['scope_2_kg'] += emissions
        elif 'Scope 3' in scope:
            scope_totals['scope_3_kg'] += emissions

    return {k: round(v, 2) for k, v in scope_totals.items()}


def format_document_type_friendly(doc_type: str) -> str:
    """Convert doc type code to friendly name"""

    friendly_names = {
        'electricity_bill': 'Electricity Bill',
        'fuel_receipt': 'Fuel Receipt',
        'hotel_bill': 'Hotel Bill',
        'cab_receipt': 'Taxi/Cab Receipt',
        'train_ticket': 'Train Ticket',
        'flight_ticket': 'Flight Ticket',
        'logistics_invoice': 'Logistics/Courier Invoice',
        'waste_invoice': 'Waste Disposal Invoice',
        'water_bill': 'Water Bill',
        'purchase_invoice': 'Purchase Invoice',
        'brsr_report': 'BRSR Report',
        'lca_report': 'LCA Report',
        'commute_survey': 'Commute Survey',
        'general': 'Document'
    }

    return friendly_names.get(doc_type, 'Document')


# ============================================================================
# TESTING
# ============================================================================

if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python universal_document_processor.py <file_path>")
        sys.exit(1)

    file_path = sys.argv[1]

    user_context = {
        'location': 'Mumbai office',
        'period': 'Q3 2024',
        'notes': 'Main office electricity'
    }

    result = process_any_document(file_path, user_context)

    if result['success']:
        print("\n" + "=" * 70)
        print("📊 RESULTS")
        print("=" * 70)
        print(f"\n📄 {result['document_type_detected']}")
        print(f"💬 {result['simple_summary']}")
        print(f"\n🌍 {result['total_emissions']['readable']}")
        print(f"💡 Equivalent to: {result['total_emissions']['equivalent_to']}")

        print("\n📋 Activities:")
        for act in result['activities']:
            print(f"   • {act['name']}: {act['emissions']['readable']}")
    else:
        print(f"\n❌ Error: {result['error']}")