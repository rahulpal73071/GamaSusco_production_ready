# app/ai/lca_extractor.py
"""
LCA (Life Cycle Assessment) Report Reader
==========================================
Extracts product carbon footprints from LCA reports
Scope 3.1 - Purchased Goods & Services (supplier emissions)

Handles:
- ISO 14040/14044 LCA reports
- Product Carbon Footprint (PCF) declarations
- Environmental Product Declarations (EPD)
- Supplier emission reports
"""
from openai import OpenAI
import json
import PyPDF2
from typing import Dict, List
from datetime import datetime
from pathlib import Path
from app.config import OPENAI_API_KEY, EXTRACTION_MODEL

client = OpenAI(api_key=OPENAI_API_KEY)


def extract_lca_report(file_path: str) -> Dict:
    """
    Extract LCA/PCF data from report

    Args:
        file_path: Path to LCA report (PDF)

    Returns:
        {
            'success': bool,
            'data': {
                'product_name': str,
                'manufacturer': str,
                'report_date': 'YYYY-MM-DD',
                'functional_unit': str,
                'system_boundary': str,
                'lifecycle_stages': {
                    'raw_material_extraction': float,
                    'manufacturing': float,
                    'transportation': float,
                    'use_phase': float,
                    'end_of_life': float
                },
                'total_carbon_footprint_kgco2e': float,
                'per_unit_kgco2e': float,
                'methodology': str,
                'data_quality': str
            }
        }
    """

    print("\n📊 Extracting LCA report data...")

    try:
        # Extract text from PDF
        text_content = extract_pdf_text(file_path)

        if not text_content:
            return {
                'success': False,
                'error': 'Could not extract text from PDF'
            }

        print(f"   📄 Extracted {len(text_content)} characters from PDF")

        # Use AI to extract structured data
        extracted_data = extract_with_ai(text_content)

        if not extracted_data.get('success'):
            return extracted_data

        data = extracted_data['data']

        print(f"   ✅ Extracted: {data.get('product_name', 'Unknown product')}")
        print(f"   🌍 Carbon footprint: {data.get('total_carbon_footprint_kgco2e', 0):.2f} kgCO2e")

        return {
            'success': True,
            'data': data,
            'document_type': 'lca_report',
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


def extract_pdf_text(file_path: str) -> str:
    """Extract text from PDF"""

    try:
        with open(file_path, 'rb') as f:
            pdf = PyPDF2.PdfReader(f)
            text = ""

            # Extract from all pages (LCA reports are typically detailed)
            for page_num, page in enumerate(pdf.pages[:20]):  # First 20 pages
                text += f"\n--- PAGE {page_num + 1} ---\n"
                text += page.extract_text()

        return text

    except Exception as e:
        print(f"   ⚠️  PDF extraction error: {e}")
        return ""


def extract_with_ai(text_content: str) -> Dict:
    """Use ChatGPT to extract structured LCA data"""

    # Truncate for token limits
    text_to_process = text_content[:16000]

    prompt = f"""
Extract Life Cycle Assessment (LCA) data from this report.

REPORT TEXT:
{text_to_process}

Return ONLY valid JSON (no markdown, no ```json):
{{
    "product_name": "Product name",
    "manufacturer": "Company name",
    "report_date": "YYYY-MM-DD",
    "report_standard": "ISO 14040/14044" or "PAS 2050" or "GHG Protocol Product Standard",
    "functional_unit": "1 kg" or "1 unit" or "1 m2",
    "system_boundary": "cradle-to-gate" or "cradle-to-grave" or "gate-to-gate",

    "lifecycle_stages": {{
        "raw_material_extraction": 45.2,
        "manufacturing": 120.5,
        "transportation": 35.8,
        "distribution": 15.3,
        "use_phase": 200.0,
        "end_of_life": 25.1
    }},

    "total_carbon_footprint_kgco2e": 441.9,
    "per_unit_kgco2e": 441.9,

    "ghg_breakdown": {{
        "co2": 380.5,
        "ch4": 45.2,
        "n2o": 16.2
    }},

    "methodology": "Brief description",
    "data_quality": "Primary data" or "Secondary data" or "Mixed",
    "uncertainty": "+/- 15%",
    "reference_year": 2024
}}

EXTRACTION GUIDELINES:

1. PRODUCT IDENTIFICATION:
   - Extract product/material name
   - Extract manufacturer/supplier name
   - Extract report date

2. FUNCTIONAL UNIT:
   - Look for "Functional Unit:", "Per unit:", "Declared unit:"
   - Common units: kg, unit, m2, m3, litre, tonne

3. SYSTEM BOUNDARY:
   - Cradle-to-gate: Raw materials to factory gate
   - Cradle-to-grave: Full lifecycle including use & disposal
   - Gate-to-gate: Manufacturing only

4. LIFECYCLE STAGES:
   - Extract emissions for each stage if breakdown provided
   - Common stages: Raw materials, Manufacturing, Transport, Use, End-of-life
   - Values in kgCO2e

5. TOTAL CARBON FOOTPRINT:
   - Look for: "Total GHG emissions:", "Carbon footprint:", "Global Warming Potential (GWP)"
   - Convert to kgCO2e if in other units:
     * tCO2e → multiply by 1000
     * gCO2e → divide by 1000

6. GHG BREAKDOWN:
   - Extract CO2, CH4, N2O contributions if available
   - All in CO2 equivalents (kgCO2e)

7. DATA QUALITY:
   - Primary data: From actual measurements
   - Secondary data: From databases/literature
   - Mixed: Combination

Return ONLY the JSON object.
"""

    try:
        response = client.chat.completions.create(
            model=EXTRACTION_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert at extracting lifecycle assessment and carbon footprint data from technical reports. Return only valid JSON."
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

        # Validate data
        data = validate_lca_data(data)

        return {
            'success': True,
            'data': data
        }

    except Exception as e:
        return {
            'success': False,
            'error': f'AI extraction failed: {str(e)}'
        }


def validate_lca_data(data: Dict) -> Dict:
    """Validate and normalize LCA data"""

    # Ensure total carbon footprint
    if data.get('total_carbon_footprint_kgco2e', 0) == 0:
        # Try to calculate from lifecycle stages
        stages = data.get('lifecycle_stages', {})
        total = sum(stages.values())
        if total > 0:
            data['total_carbon_footprint_kgco2e'] = total

    # Ensure per_unit equals total if functional unit is "1 unit"
    if not data.get('per_unit_kgco2e'):
        data['per_unit_kgco2e'] = data.get('total_carbon_footprint_kgco2e', 0)

    # Default system boundary if missing
    if not data.get('system_boundary'):
        # Infer from presence of lifecycle stages
        stages = data.get('lifecycle_stages', {})
        if 'use_phase' in stages or 'end_of_life' in stages:
            data['system_boundary'] = 'cradle-to-grave'
        else:
            data['system_boundary'] = 'cradle-to-gate'

    return data


def convert_lca_to_activities(extracted_data: Dict, purchase_quantity: float = 1.0, purchase_unit: str = 'unit') -> \
List[Dict]:
    """
    Convert LCA report to activities

    Args:
        extracted_data: Extracted LCA data
        purchase_quantity: How much was purchased (user input)
        purchase_unit: Unit of purchase (user input)

    Returns:
        List of activities for each lifecycle stage
    """

    if not extracted_data.get('success'):
        return []

    data = extracted_data['data']
    activities = []

    product_name = data.get('product_name', 'Product')
    manufacturer = data.get('manufacturer', 'Supplier')
    per_unit_kgco2e = data.get('per_unit_kgco2e', 0)
    functional_unit = data.get('functional_unit', 'unit')

    # Calculate total emissions for purchase
    total_emissions = per_unit_kgco2e * purchase_quantity

    # Main activity: Total product carbon footprint
    activities.append({
        'activity_name': f"{product_name} - Product Carbon Footprint",
        'activity_type': 'product_lca',
        'quantity': purchase_quantity,
        'unit': purchase_unit,
        'emissions_kgco2e': total_emissions,
        'date': datetime.now().strftime('%Y-%m-%d'),
        'description': f"LCA-based emissions from {manufacturer}",
        'manufacturer': manufacturer,
        'functional_unit': functional_unit,
        'per_unit_kgco2e': per_unit_kgco2e,
        'system_boundary': data.get('system_boundary', 'Unknown'),
        'data_quality': data.get('data_quality', 'Secondary'),
        'report_standard': data.get('report_standard', 'LCA'),
        'scope': 'Scope 3',
        'category': 'Purchased Goods & Services',
        'sub_category': '3.1'
    })

    # Optional: Break down by lifecycle stages
    lifecycle_stages = data.get('lifecycle_stages', {})
    if lifecycle_stages:
        for stage_name, stage_emissions_per_unit in lifecycle_stages.items():
            if stage_emissions_per_unit > 0:
                stage_total = stage_emissions_per_unit * purchase_quantity

                activities.append({
                    'activity_name': f"{product_name} - {stage_name.replace('_', ' ').title()}",
                    'activity_type': f"lca_{stage_name}",
                    'quantity': purchase_quantity,
                    'unit': purchase_unit,
                    'emissions_kgco2e': stage_total,
                    'date': datetime.now().strftime('%Y-%m-%d'),
                    'description': f"Lifecycle stage: {stage_name}",
                    'manufacturer': manufacturer,
                    'lifecycle_stage': stage_name,
                    'scope': 'Scope 3',
                    'category': 'Purchased Goods & Services',
                    'sub_category': '3.1'
                })

    return activities


# ============================================================================
# TESTING
# ============================================================================

if __name__ == "__main__":
    # Test with sample LCA text
    lca_sample = """
    LIFE CYCLE ASSESSMENT REPORT
    Product Carbon Footprint Declaration

    Product: Aluminum Beverage Can (330ml)
    Manufacturer: Can Industries Ltd
    Report Date: January 2024

    Standard: ISO 14040/14044
    Functional Unit: 1 can (330ml capacity)
    System Boundary: Cradle-to-grave

    CARBON FOOTPRINT SUMMARY

    Lifecycle Stage Analysis:

    1. Raw Material Extraction (Bauxite mining)
       GHG Emissions: 85.2 g CO2e

    2. Manufacturing (Smelting & can production)
       GHG Emissions: 120.5 g CO2e

    3. Transportation (To filling plant)
       GHG Emissions: 15.8 g CO2e

    4. Distribution (To retailers)
       GHG Emissions: 8.3 g CO2e

    5. Use Phase
       GHG Emissions: 0 g CO2e (no energy use)

    6. End-of-Life (Recycling)
       GHG Emissions: -50.0 g CO2e (avoided emissions)

    TOTAL CARBON FOOTPRINT: 179.8 g CO2e per can
    (0.1798 kg CO2e per functional unit)

    Data Quality: Primary data from manufacturing, 
                  Secondary data from databases for raw materials

    Uncertainty: ± 12%
    Reference Year: 2023

    This report complies with ISO 14040 and ISO 14044 standards.
    """

    print("=" * 70)
    print("  TEST: LCA REPORT EXTRACTION")
    print("=" * 70)

    # For testing without actual PDF, we'll use text directly
    result = extract_with_ai(lca_sample)

    if result.get('success'):
        data = result['data']
        print("\n✅ Extraction successful!")
        print(f"\n📦 Product: {data.get('product_name')}")
        print(f"🏭 Manufacturer: {data.get('manufacturer')}")
        print(f"📅 Report Date: {data.get('report_date')}")
        print(f"📏 Functional Unit: {data.get('functional_unit')}")
        print(f"🔄 System Boundary: {data.get('system_boundary')}")

        print(f"\n🌍 Carbon Footprint:")
        print(f"   Total: {data.get('total_carbon_footprint_kgco2e', 0):.4f} kgCO2e")
        print(f"   Per Unit: {data.get('per_unit_kgco2e', 0):.4f} kgCO2e")

        print(f"\n📊 Lifecycle Stages:")
        stages = data.get('lifecycle_stages', {})
        for stage, emissions in stages.items():
            if emissions != 0:
                print(f"   {stage.replace('_', ' ').title()}: {emissions:.2f} kgCO2e")

        print(f"\n📋 Methodology: {data.get('methodology', 'N/A')}")
        print(f"✓ Data Quality: {data.get('data_quality', 'N/A')}")

        # Convert to activities (example: purchased 1000 cans)
        print("\n" + "=" * 70)
        print("  EXAMPLE: PURCHASING 1000 CANS")
        print("=" * 70)

        activities = convert_lca_to_activities(
            result,
            purchase_quantity=1000,
            purchase_unit='units'
        )

        print(f"\nExtracted {len(activities)} activities:")

        for act in activities:
            print(f"\n  • {act['activity_name']}")
            print(f"    Emissions: {act.get('emissions_kgco2e', 0):.2f} kgCO2e")
            if 'lifecycle_stage' in act:
                print(f"    Stage: {act['lifecycle_stage']}")
    else:
        print(f"\n❌ Failed: {result.get('error')}")