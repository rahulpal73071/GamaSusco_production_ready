# app/ai/brsr_extractor.py
"""
Enhanced BRSR Report Extraction
Handles multi-year data, complex tables, and edge cases
"""
from openai import OpenAI
import json
import PyPDF2
import re
from typing import Dict, List, Optional
from app.config import OPENAI_API_KEY, EXTRACTION_MODEL
from app.ai.scope_classifier import classify_scope_and_category

client = OpenAI(api_key=OPENAI_API_KEY)


def extract_brsr_emissions(file_path: str) -> Dict:
    """
    Extract emissions from BRSR report with enhanced accuracy

    Handles:
    - Multi-year data tables (FY 2023-24 vs FY 2022-23)
    - Complex table structures
    - Different units (tCO2e, kgCO2e, MtCO2e)
    - Missing or incomplete data
    """

    print(f"\n📄 Processing BRSR Report...")
    print("=" * 70)

    try:
        # Step 1: Extract ALL pages
        print("1️⃣ Reading PDF pages...")
        pages_text = extract_all_pages(file_path)
        total_pages = len(pages_text)
        print(f"   ✅ Read {total_pages} pages")

        # Step 2: Identify reporting period from first pages
        print("\n2️⃣ Identifying reporting period...")
        reporting_period = identify_reporting_period(pages_text[:5])
        print(f"   ✅ Reporting Period: {reporting_period}")

        # Step 3: Extract company info
        print("\n3️⃣ Extracting company metadata...")
        company_info = extract_company_info(pages_text[0])
        print(f"   ✅ Company: {company_info.get('company_name', 'Unknown')}")

        # Step 4: Find Principle 6 pages
        print("\n4️⃣ Locating Principle 6 (Environmental)...")
        relevant_pages = find_principle_6_pages(pages_text)

        if not relevant_pages:
            print("   ⚠️ Principle 6 not found, searching for emission keywords...")
            relevant_pages = find_emission_keywords(pages_text)

        print(f"   ✅ Found {len(relevant_pages)} relevant pages")
        print(f"   📄 Page numbers: {[p + 1 for p in relevant_pages[:10]]}")

        # Step 5: Extract emissions with reporting period context
        print("\n5️⃣ Extracting emission data with AI...")
        relevant_text = compile_relevant_text(pages_text, relevant_pages, reporting_period)

        chars_in_text = len(relevant_text)
        print(f"   📊 Processing {chars_in_text:,} characters from {min(8, len(relevant_pages))} pages")

        emissions_data = extract_emissions_with_ai_enhanced(
            relevant_text,
            reporting_period,
            total_pages
        )

        # Step 6: Validate and clean data
        print("\n6️⃣ Validating extracted data...")
        emissions_data = validate_emissions_data(emissions_data)

        # Step 7: Process activities
        print("\n7️⃣ Categorizing emission activities...")
        activities = process_activities(emissions_data)
        print(f"   ✅ Extracted {len(activities)} activities")

        # Calculate cost
        tokens_estimate = chars_in_text / 4
        cost_estimate = (tokens_estimate / 1000) * 0.00015

        # Build summary
        summary = {
            'company_name': company_info.get('company_name', 'Unknown'),
            'reporting_period': reporting_period,
            'scope_1_total_kgco2e': emissions_data.get('scope_1_total_kgco2e', 0),
            'scope_2_total_kgco2e': emissions_data.get('scope_2_total_kgco2e', 0),
            'scope_3_total_kgco2e': emissions_data.get('scope_3_total_kgco2e', 0),
            'total_emissions_kgco2e': emissions_data.get('total_emissions_kgco2e', 0)
        }

        # Add data quality indicators
        summary['data_quality'] = {
            'has_scope_1': summary['scope_1_total_kgco2e'] > 0,
            'has_scope_2': summary['scope_2_total_kgco2e'] > 0,
            'has_scope_3': summary['scope_3_total_kgco2e'] > 0,
            'confidence': emissions_data.get('confidence_score', 0.7)
        }

        print("\n" + "=" * 70)
        print("✅ BRSR Processing Complete!")
        print(f"   Total pages: {total_pages}")
        print(f"   Pages processed: {min(8, len(relevant_pages))}")
        print(f"   Reporting period: {reporting_period}")
        print(f"   Scope 1: {summary['scope_1_total_kgco2e']:,.0f} kgCO2e")
        print(f"   Scope 2: {summary['scope_2_total_kgco2e']:,.0f} kgCO2e")
        print(f"   Scope 3: {summary['scope_3_total_kgco2e']:,.0f} kgCO2e")
        print(f"   Total: {summary['total_emissions_kgco2e']:,.0f} kgCO2e")
        print(f"   Data quality: {summary['data_quality']['confidence'] * 100:.0f}%")
        print(f"   Estimated cost: ${cost_estimate:.4f}")
        print("=" * 70)

        return {
            'success': True,
            'page_count': total_pages,
            'relevant_pages': [p + 1 for p in relevant_pages],
            'confidence': emissions_data.get('confidence_score', 0.85),
            'data': emissions_data,
            'extracted_activities': activities,
            'summary': summary,
            'processing_cost_estimate': round(cost_estimate, 4),
            'reporting_period': reporting_period
        }

    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

        return {
            'success': False,
            'error': str(e),
            'extracted_activities': [],
            'summary': {}
        }


def extract_all_pages(file_path: str) -> List[str]:
    """Extract text from ALL PDF pages"""
    pages = []

    try:
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            total_pages = len(pdf_reader.pages)

            print(f"   Reading {total_pages} pages...", end="", flush=True)

            for page_num in range(total_pages):
                page = pdf_reader.pages[page_num]
                text = page.extract_text()
                pages.append(text)

                if (page_num + 1) % 10 == 0:
                    print(f" {page_num + 1}", end="", flush=True)

            print()

    except Exception as e:
        print(f"\n   ⚠️ Error reading PDF: {e}")

    return pages


def identify_reporting_period(first_pages: List[str]) -> str:
    """
    Identify the reporting period (e.g., "FY 2023-24", "FY 2024-25")
    This is CRITICAL for multi-year tables
    """
    combined_text = "\n".join(first_pages)

    # Pattern 1: "FY 2023-24" or "FY 2024-25"
    fy_patterns = [
        r'FY\s*(\d{4})-(\d{2,4})',
        r'F\.Y\.?\s*(\d{4})-(\d{2,4})',
        r'Financial Year\s*(\d{4})-(\d{2,4})',
        r'year ended.*?(\d{1,2})\s*[,\s]*(\d{4})'  # "year ended March 31, 2024"
    ]

    for pattern in fy_patterns:
        matches = re.findall(pattern, combined_text, re.IGNORECASE)
        if matches:
            # Get the most recent year mentioned
            years = []
            for match in matches:
                if len(match) == 2:
                    year1 = match[0]
                    year2 = match[1]

                    # Handle 2-digit year
                    if len(year2) == 2:
                        year2 = year1[:2] + year2

                    years.append((int(year1), int(year2)))

            if years:
                # Get the latest year
                latest = max(years, key=lambda x: x[1])
                return f"FY {latest[0]}-{str(latest[1])[-2:]}"

    # Fallback: Look for year in dates
    year_matches = re.findall(r'\b(202[3-9])\b', combined_text)
    if year_matches:
        latest_year = max(map(int, year_matches))
        return f"FY {latest_year - 1}-{str(latest_year)[-2:]}"

    return "FY Unknown"


def find_principle_6_pages(pages_text: List[str]) -> List[int]:
    """Find pages with Principle 6 content"""
    keywords = [
        'principle 6',
        'principle six',
        'principle vi',
        'environmental',
        'greenhouse gas',
        'ghg emissions',
        'scope 1 emissions',
        'scope 2 emissions',
        'scope 3 emissions',
        'carbon emissions',
        'co2 emissions',
        'tco2e',
        'emission intensity'
    ]

    relevant_pages = []

    for i, text in enumerate(pages_text):
        text_lower = text.lower()
        keyword_count = sum(1 for keyword in keywords if keyword in text_lower)

        if keyword_count >= 2:
            relevant_pages.append(i)

    return relevant_pages


def find_emission_keywords(pages_text: List[str]) -> List[int]:
    """Fallback: Find pages with emission data"""
    emission_terms = [
        'tco2e', 'kgco2e', 'mtco2e',
        'scope 1:', 'scope 2:', 'scope 3:',
        'emission intensity',
        'carbon footprint'
    ]

    relevant_pages = []

    for i, text in enumerate(pages_text):
        text_lower = text.lower()
        if any(term in text_lower for term in emission_terms):
            relevant_pages.append(i)

    return relevant_pages[:15]


def extract_company_info(first_page_text: str) -> Dict:
    """Extract company name from first page"""
    lines = first_page_text.split('\n')

    info = {'company_name': 'Unknown'}

    for line in lines[:15]:
        line_clean = line.strip()
        if any(word in line_clean.lower() for word in ['limited', 'ltd', 'bank', 'corporation']):
            if len(line_clean) > 5 and len(line_clean) < 100:
                info['company_name'] = line_clean
                break

    return info


def compile_relevant_text(pages_text: List[str], relevant_pages: List[int], reporting_period: str) -> str:
    """Compile text from relevant pages with context"""

    compiled = f"REPORTING PERIOD: {reporting_period}\n\n"
    compiled += "CRITICAL INSTRUCTION: Extract data ONLY for the reporting period mentioned above.\n"
    compiled += "If you see multiple years/columns, choose the CURRENT year (most recent).\n\n"
    compiled += "=" * 70 + "\n\n"

    for i in relevant_pages[:8]:
        compiled += f"=== PAGE {i + 1} ===\n\n"
        compiled += pages_text[i]
        compiled += "\n\n"

    return compiled


def extract_emissions_with_ai_enhanced(text: str, reporting_period: str, total_pages: int) -> Dict:
    """Enhanced AI extraction with reporting period awareness"""

    text_to_process = text[:16000]  # Increased limit for better context

    prompt = f"""
You are analyzing a BRSR report ({total_pages} pages total).

REPORTING PERIOD: {reporting_period}

CRITICAL RULES:
1. Extract emissions data ONLY for {reporting_period} (the CURRENT/LATEST year)
2. IGNORE data from previous years (FY 2022-23, FY 2021-22, etc.)
3. If you see a table with multiple columns like:

   Parameter         {reporting_period}    Previous Year
   Scope 1           2,113.9               1,856.2

   Extract ONLY the {reporting_period} column (2,113.9)

4. ALL emissions must be in kgCO2e:
   - If in tCO2e (tonnes): multiply by 1,000
   - If in MtCO2e: multiply by 1,000,000
   - If unlabeled but looks like tonnes (e.g., "2,113.9"): multiply by 1,000

5. Extract individual activities/categories when available

REPORT TEXT:
{text_to_process}

Return ONLY valid JSON (no markdown, no ```json):
{{
    "scope_1_total_kgco2e": 0,
    "scope_2_total_kgco2e": 0,
    "scope_3_total_kgco2e": 0,
    "total_emissions_kgco2e": 0,
    "activities": [
        {{
            "scope": "Scope 1/2/3",
            "category": "Stationary Combustion/Purchased Electricity/etc",
            "quantity": 0,
            "unit": "kgCO2e",
            "description": "...",
            "source_text": "Quote the exact text you found this in"
        }}
    ],
    "data_year": "{reporting_period}",
    "confidence_score": 0.9,
    "notes": "Any important observations"
}}

REMEMBER: Only extract data for {reporting_period}, NOT previous years!
"""

    try:
        response = client.chat.completions.create(
            model=EXTRACTION_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": f"You are an expert at extracting GHG emissions from Indian BRSR reports. You MUST extract data only for {reporting_period} and ignore all previous year data. Always convert to kgCO2e."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.05,  # Lower temperature for consistency
            max_tokens=2500
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

        # Ensure totals
        if data.get('total_emissions_kgco2e', 0) == 0:
            data['total_emissions_kgco2e'] = (
                    data.get('scope_1_total_kgco2e', 0) +
                    data.get('scope_2_total_kgco2e', 0) +
                    data.get('scope_3_total_kgco2e', 0)
            )

        print(f"   ✅ Extracted emissions for {data.get('data_year', reporting_period)}")

        return data

    except Exception as e:
        print(f"   ⚠️ AI extraction error: {e}")
        return {
            'scope_1_total_kgco2e': 0,
            'scope_2_total_kgco2e': 0,
            'scope_3_total_kgco2e': 0,
            'total_emissions_kgco2e': 0,
            'activities': [],
            'confidence_score': 0.0
        }


def validate_emissions_data(data: Dict) -> Dict:
    """Validate and clean extracted emissions data"""

    # Check for reasonable values
    scope_1 = data.get('scope_1_total_kgco2e', 0)
    scope_2 = data.get('scope_2_total_kgco2e', 0)
    scope_3 = data.get('scope_3_total_kgco2e', 0)

    # Validate units (should be in millions or billions for large companies)
    if scope_1 > 0 and scope_1 < 100:  # Suspiciously low - might be in tonnes
        print(f"   ⚠️ Scope 1 looks like tonnes ({scope_1}), converting...")
        data['scope_1_total_kgco2e'] = scope_1 * 1000

    if scope_2 > 0 and scope_2 < 100:
        print(f"   ⚠️ Scope 2 looks like tonnes ({scope_2}), converting...")
        data['scope_2_total_kgco2e'] = scope_2 * 1000

    if scope_3 > 0 and scope_3 < 100:
        print(f"   ⚠️ Scope 3 looks like tonnes ({scope_3}), converting...")
        data['scope_3_total_kgco2e'] = scope_3 * 1000

    # Recalculate total
    data['total_emissions_kgco2e'] = (
            data['scope_1_total_kgco2e'] +
            data['scope_2_total_kgco2e'] +
            data['scope_3_total_kgco2e']
    )

    print(f"   ✅ Validation complete")

    return data


def process_activities(emissions_data: Dict) -> List[Dict]:
    """Convert extracted activities to standardized format"""
    activities = []

    for activity_raw in emissions_data.get('activities', []):
        try:
            scope = activity_raw.get('scope', '')
            category = activity_raw.get('category', '')

            if not scope or not category:
                classification = classify_scope_and_category(
                    activity_raw.get('description', ''),
                    category,
                    activity_raw.get('quantity', 0),
                    activity_raw.get('unit', 'kgCO2e')
                )
                scope = classification['scope']
                category = classification['category_name']

            activities.append({
                'scope': scope,
                'category': category,
                'activity_type': 'brsr_reported',
                'quantity': activity_raw.get('quantity', 0),
                'unit': activity_raw.get('unit', 'kgCO2e'),
                'description': activity_raw.get('description', ''),
                'source_text': activity_raw.get('source_text', ''),
                'confidence': 0.8
            })

        except Exception as e:
            print(f"   ⚠️ Skipping activity: {e}")

    return activities