# app/ai/commute_extractor.py
"""
Enhanced Employee Commute Data Extractor
=========================================
Supports:
- Pre-calculated emissions (already in CO2e)
- Raw survey data (calculate emissions)
- Excel, CSV, PDF, Text formats
- Multiple transport modes
- Carpooling calculations
"""

from typing import Dict, List
from pathlib import Path
import pandas as pd
import PyPDF2
import re
from datetime import datetime


def extract_commute_data(file_path: str) -> Dict:
    """
    Extract employee commute data from file

    **NEW: Handles pre-calculated emissions!**

    Supports:
    - Excel (.xlsx, .xls)
    - CSV (.csv)
    - Text files (.txt)
    - PDF survey results

    Returns two scenarios:
    1. Pre-calculated emissions (just record them)
    2. Raw commute data (calculate emissions)
    """

    print("\n🚗 Extracting employee commute data...")

    try:
        file_ext = Path(file_path).suffix.lower()

        # Route to appropriate parser
        if file_ext in ['.xlsx', '.xls']:
            result = extract_from_excel(file_path)
        elif file_ext == '.csv':
            result = extract_from_csv(file_path)
        elif file_ext == '.txt':
            result = extract_from_text(file_path)
        elif file_ext == '.pdf':
            result = extract_from_pdf(file_path)
        else:
            return {
                'success': False,
                'error': f'Unsupported file type: {file_ext}. Use .xlsx, .csv, .txt, or .pdf'
            }

        if result.get('success'):
            data = result.get('data', {})

            # Check if pre-calculated
            if data.get('pre_calculated'):
                print(f"   ℹ️ Found PRE-CALCULATED emissions")
                print(f"   🌍 Total: {data.get('total_emissions_kg', 0):,.0f} kg CO2e")
            else:
                print(f"   ✅ Extracted: {len(data.get('commute_records', []))} commute records")
                print(f"   👥 Total employees: {data.get('total_employees', 0)}")

            return result
        else:
            return result

    except Exception as e:
        print(f"   ❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return {
            'success': False,
            'error': str(e)
        }


def extract_from_excel(file_path: str) -> Dict:
    """Extract from Excel file with pre-calculated detection"""

    try:
        # Read Excel
        df = pd.read_excel(file_path)

        print(f"   📊 Read Excel: {len(df)} rows, {len(df.columns)} columns")
        print(f"   📋 Columns: {list(df.columns)}")

        # Clean column names
        df.columns = df.columns.str.lower().str.strip()

        # ✅ CHECK FOR PRE-CALCULATED EMISSIONS
        emission_columns = [
            'emissions', 'emissions_kg', 'co2e', 'co2_kg', 'carbon_emissions',
            'ghg_emissions', 'total_emissions', 'co2e_kg', 'kgco2e'
        ]

        found_emission_col = None
        for col in emission_columns:
            if col in df.columns:
                found_emission_col = col
                break

        # SCENARIO 1: Pre-calculated emissions found
        if found_emission_col:
            print(f"   ✅ Found pre-calculated emissions in column: '{found_emission_col}'")

            # Sum total emissions
            total_emissions = df[found_emission_col].sum()
            employee_count = len(df)

            # Get survey period if available
            period_col = next((col for col in df.columns if 'period' in col or 'month' in col or 'date' in col), None)
            survey_period = df[period_col].iloc[0] if period_col and len(df) > 0 else "Not specified"

            return {
                'success': True,
                'data': {
                    'pre_calculated': True,  # ← KEY FLAG!
                    'total_emissions_kg': float(total_emissions),
                    'total_employees': employee_count,
                    'survey_period': str(survey_period),
                    'activities': [{
                        'description': f'Total Employee Commute Emissions (Pre-calculated from survey)',
                        'quantity': float(total_emissions),
                        'unit': 'kgCO2e',  # ← Mark as already CO2e
                        'scope': 'Scope 3',
                        'category': '3.7 - Employee Commuting',
                        'employees_count': employee_count,
                        'calculation_method': 'pre_calculated_survey',
                        'data_source': Path(file_path).name
                    }]
                }
            }

        # SCENARIO 2: Raw commute data - need to calculate
        else:
            print(f"   ℹ️ No pre-calculated emissions found, extracting raw commute data")

            # Parse raw commute records
            commute_records = parse_commute_records(df)

            if not commute_records:
                return {
                    'success': False,
                    'error': 'Could not parse commute data. Expected columns: transport_mode, distance, days_per_week'
                }

            return {
                'success': True,
                'data': {
                    'pre_calculated': False,
                    'survey_period': extract_survey_period(df),
                    'total_employees': len(commute_records),
                    'commute_records': commute_records,
                    'activities': convert_to_activities(commute_records)
                }
            }

    except Exception as e:
        return {
            'success': False,
            'error': f'Excel parsing error: {str(e)}'
        }


def extract_from_csv(file_path: str) -> Dict:
    """Extract from CSV file"""

    try:
        # Read CSV
        df = pd.read_csv(file_path)

        print(f"   📊 Read CSV: {len(df)} rows, {len(df.columns)} columns")

        # Clean column names
        df.columns = df.columns.str.lower().str.strip()

        # Check for pre-calculated emissions (same logic as Excel)
        emission_columns = [
            'emissions', 'emissions_kg', 'co2e', 'co2_kg', 'carbon_emissions'
        ]

        found_emission_col = None
        for col in emission_columns:
            if col in df.columns:
                found_emission_col = col
                break

        # Pre-calculated scenario
        if found_emission_col:
            total_emissions = df[found_emission_col].sum()

            return {
                'success': True,
                'data': {
                    'pre_calculated': True,
                    'total_emissions_kg': float(total_emissions),
                    'total_employees': len(df),
                    'activities': [{
                        'description': 'Employee Commute Emissions (Pre-calculated)',
                        'quantity': float(total_emissions),
                        'unit': 'kgCO2e',
                        'scope': 'Scope 3',
                        'category': '3.7 - Employee Commuting'
                    }]
                }
            }

        # Raw data scenario
        else:
            commute_records = parse_commute_records(df)

            return {
                'success': True,
                'data': {
                    'pre_calculated': False,
                    'commute_records': commute_records,
                    'activities': convert_to_activities(commute_records)
                }
            }

    except Exception as e:
        return {
            'success': False,
            'error': f'CSV parsing error: {str(e)}'
        }


def extract_from_text(file_path: str) -> Dict:
    """Extract from text file (simple format)"""

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Check for pre-calculated total
        total_match = re.search(r'total[^\d]*(\d+(?:,\d+)?(?:\.\d+)?)\s*kg\s*co2e', content, re.IGNORECASE)

        if total_match:
            total = float(total_match.group(1).replace(',', ''))

            return {
                'success': True,
                'data': {
                    'pre_calculated': True,
                    'total_emissions_kg': total,
                    'activities': [{
                        'description': 'Employee Commute Emissions',
                        'quantity': total,
                        'unit': 'kgCO2e',
                        'scope': 'Scope 3',
                        'category': '3.7 - Employee Commuting'
                    }]
                }
            }

        # Parse structured text
        return {
            'success': False,
            'error': 'Text file must contain "Total: X kg CO2e" or be in structured format'
        }

    except Exception as e:
        return {
            'success': False,
            'error': f'Text parsing error: {str(e)}'
        }


def extract_from_pdf(file_path: str) -> Dict:
    """Extract from PDF report"""

    try:
        with open(file_path, 'rb') as f:
            pdf = PyPDF2.PdfReader(f)
            text = ""
            for page in pdf.pages[:5]:  # First 5 pages
                text += page.extract_text()

        # Look for pre-calculated total
        patterns = [
            r'total\s+commute\s+emissions[:\s]+(\d+(?:,\d+)?(?:\.\d+)?)\s*kg',
            r'employee\s+commuting[:\s]+(\d+(?:,\d+)?(?:\.\d+)?)\s*kg',
            r'scope\s+3\.7[:\s]+(\d+(?:,\d+)?(?:\.\d+)?)\s*kg'
        ]

        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                total = float(match.group(1).replace(',', ''))

                return {
                    'success': True,
                    'data': {
                        'pre_calculated': True,
                        'total_emissions_kg': total,
                        'activities': [{
                            'description': 'Employee Commute Emissions (from PDF report)',
                            'quantity': total,
                            'unit': 'kgCO2e',
                            'scope': 'Scope 3',
                            'category': '3.7 - Employee Commuting'
                        }]
                    }
                }

        return {
            'success': False,
            'error': 'Could not find commute emissions total in PDF'
        }

    except Exception as e:
        return {
            'success': False,
            'error': f'PDF parsing error: {str(e)}'
        }


def parse_commute_records(df: pd.DataFrame) -> List[Dict]:
    """Parse DataFrame into structured commute records"""

    records = []

    # Column mapping (flexible)
    col_map = {
        'transport_mode': ['transport_mode', 'mode', 'transport', 'vehicle_type', 'travel_mode'],
        'distance': ['distance', 'distance_km', 'distance_one_way', 'one_way_km', 'km'],
        'days_per_week': ['days_per_week', 'days', 'days_week', 'frequency', 'weekly_days'],
        'fuel_type': ['fuel_type', 'fuel', 'vehicle_fuel'],
        'carpooling': ['carpooling', 'carpool', 'shared_ride'],
        'passengers': ['passengers', 'passengers_count', 'carpool_size']
    }

    # Find actual column names
    actual_cols = {}
    for key, possible_names in col_map.items():
        for col in df.columns:
            if col in possible_names:
                actual_cols[key] = col
                break

    # Must have at least transport_mode and distance
    if 'transport_mode' not in actual_cols or 'distance' not in actual_cols:
        return []

    # Parse each row
    for idx, row in df.iterrows():
        try:
            record = {
                'employee_id': str(idx + 1),
                'transport_mode': str(
                    row[actual_cols['transport_mode']]).lower() if 'transport_mode' in actual_cols else 'car',
                'distance_one_way_km': float(row[actual_cols['distance']]) if 'distance' in actual_cols else 0,
                'days_per_week': int(
                    row[actual_cols.get('days_per_week', 'days_per_week')]) if 'days_per_week' in actual_cols else 5,
                'fuel_type': str(
                    row[actual_cols.get('fuel_type', 'fuel_type')]) if 'fuel_type' in actual_cols else 'petrol',
                'carpooling': bool(
                    row[actual_cols.get('carpooling', 'carpooling')]) if 'carpooling' in actual_cols else False,
                'passengers_count': int(
                    row[actual_cols.get('passengers', 'passengers')]) if 'passengers' in actual_cols else 1
            }

            records.append(record)
        except Exception as e:
            print(f"   ⚠️ Skipping row {idx}: {e}")
            continue

    return records


def extract_survey_period(df: pd.DataFrame) -> str:
    """Extract survey period from DataFrame"""

    period_cols = ['period', 'survey_period', 'month', 'date', 'year']

    for col in df.columns:
        if any(p in col.lower() for p in period_cols):
            if len(df) > 0:
                return str(df[col].iloc[0])

    return datetime.now().strftime('%Y-%m')


def convert_to_activities(commute_records: List[Dict]) -> List[Dict]:
    """
    Convert commute records to emission activities
    Groups by transport mode and calculates total distance
    """

    # Group by transport mode
    mode_totals = {}

    for record in commute_records:
        mode = record['transport_mode']
        distance_per_week = record['distance_one_way_km'] * 2 * record['days_per_week']  # Round trip
        distance_per_year = distance_per_week * 48  # 48 working weeks

        if mode not in mode_totals:
            mode_totals[mode] = {
                'distance_km': 0,
                'employees': 0
            }

        mode_totals[mode]['distance_km'] += distance_per_year
        mode_totals[mode]['employees'] += 1

    # Convert to activities
    activities = []

    for mode, data in mode_totals.items():
        activities.append({
            'description': f'Employee Commute - {mode.title()}',
            'quantity': data['distance_km'],
            'unit': 'km',
            'transport_mode': mode,
            'employees_count': data['employees'],
            'scope': 'Scope 3',
            'category': '3.7 - Employee Commuting',
            'calculation_method': 'survey_based'
        })

    return activities


# ============================================================================
# TEST FUNCTION
# ============================================================================

def test_commute_extractor():
    """Test with sample data"""

    print("\n" + "=" * 70)
    print("🧪 TESTING COMMUTE EXTRACTOR")
    print("=" * 70)

    # Test 1: Pre-calculated Excel
    print("\n1️⃣ Testing pre-calculated emissions...")
    test_data_precalc = pd.DataFrame({
        'employee_id': [1, 2, 3],
        'name': ['John', 'Jane', 'Bob'],
        'emissions_kg': [120, 85, 200]
    })
    test_data_precalc.to_excel('test_commute_precalc.xlsx', index=False)

    result1 = extract_commute_data('test_commute_precalc.xlsx')
    if result1['success']:
        print(f"   ✅ Pre-calculated: {result1['data']['total_emissions_kg']} kg CO2e")

    # Test 2: Raw commute data
    print("\n2️⃣ Testing raw commute data...")
    test_data_raw = pd.DataFrame({
        'transport_mode': ['car', 'bike', 'public_transport'],
        'distance_km': [15, 5, 20],
        'days_per_week': [5, 5, 5]
    })
    test_data_raw.to_excel('test_commute_raw.xlsx', index=False)

    result2 = extract_commute_data('test_commute_raw.xlsx')
    if result2['success']:
        print(f"   ✅ Raw data: {len(result2['data']['commute_records'])} employees")
        print(f"   ✅ Activities: {len(result2['data']['activities'])}")

    print("\n" + "=" * 70)


if __name__ == "__main__":
    test_commute_extractor()