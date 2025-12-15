"""
IPCC EMISSION FACTOR ORGANIZER - Script 1
==========================================
Recursively processes all IPCC Excel files and extracts GHG emission factors

Author: Carbon Accounting Platform
Version: 1.0
"""

import pandas as pd
import os
from pathlib import Path
from datetime import datetime
import re


class IPCCOrganizer:

    def __init__(self, base_path):
        """
        Initialize IPCC organizer

        Args:
            base_path: Root path to IPCC folder (e.g., C:/Users/shubh/Downloads/IPCC/IPCC)
        """
        self.base_path = Path(base_path)
        self.factors = []
        self.factor_id = 1
        self.stats = {
            'total_files': 0,
            'processed_files': 0,
            'failed_files': 0,
            'total_factors': 0,
            'by_category': {},
            'by_country': {},
            'by_gas': {}
        }

        # IPCC to Scope mapping
        self.category_mapping = {
            '1.A.1': {'scope': 'Scope 1', 'scope_category': '1.1', 'category_name': 'Stationary Combustion',
                      'activity_type': 'energy_industries'},
            '1.A.2': {'scope': 'Scope 1', 'scope_category': '1.1', 'category_name': 'Stationary Combustion',
                      'activity_type': 'manufacturing'},
            '1.A.3': {'scope': 'Scope 1', 'scope_category': '1.2', 'category_name': 'Mobile Combustion',
                      'activity_type': 'transport'},
            '1.A.4': {'scope': 'Scope 1', 'scope_category': '1.1', 'category_name': 'Stationary Combustion',
                      'activity_type': 'other_sectors'},
            '1.A.5': {'scope': 'Scope 1', 'scope_category': '1.1', 'category_name': 'Stationary Combustion',
                      'activity_type': 'non_specified'},
            '1.B.1': {'scope': 'Scope 1', 'scope_category': '1.3', 'category_name': 'Fugitive Emissions',
                      'activity_type': 'solid_fuels'},
            '1.B.2': {'scope': 'Scope 1', 'scope_category': '1.3', 'category_name': 'Fugitive Emissions',
                      'activity_type': 'oil_gas'},
            '2.A': {'scope': 'Scope 1', 'scope_category': '1.4', 'category_name': 'Process Emissions',
                    'activity_type': 'mineral_industry'},
            '2.B': {'scope': 'Scope 1', 'scope_category': '1.4', 'category_name': 'Process Emissions',
                    'activity_type': 'chemical_industry'},
            '2.C': {'scope': 'Scope 1', 'scope_category': '1.4', 'category_name': 'Process Emissions',
                    'activity_type': 'metal_industry'},
            '3': {'scope': 'Scope 1', 'scope_category': '1.4', 'category_name': 'Process Emissions',
                  'activity_type': 'agriculture'},
            '4': {'scope': 'Scope 3', 'scope_category': '3.5', 'category_name': 'Waste Generated in Operations',
                  'activity_type': 'waste'},
        }

    def find_all_excel_files(self):
        """Recursively find all Excel files in IPCC folder"""
        print(f"\n🔍 Searching for Excel files in: {self.base_path}")
        print("=" * 80)

        excel_files = []
        for root, dirs, files in os.walk(self.base_path):
            for file in files:
                if file.endswith(('.xlsx', '.xls')) and not file.startswith('~'):
                    filepath = Path(root) / file
                    excel_files.append(filepath)

        self.stats['total_files'] = len(excel_files)
        print(f"✅ Found {len(excel_files)} Excel files\n")

        return excel_files

    def extract_category_from_path(self, filepath):
        """Extract IPCC category from folder path"""
        path_str = str(filepath)

        # Try to extract category code (e.g., 1.A.1, 1.A.2, etc.)
        patterns = [
            r'(\d+\.[A-Z]\.\d+\.?[a-z]?\.?[i]{0,3})',  # 1.A.1, 1.A.1.a, 1.A.1.a.i
            r'(\d+\.[A-Z]\.\d+)',  # 1.A.1
            r'(\d+\.[A-Z])',  # 1.A
            r'(\d+\.)',  # 1., 2., 3., 4.
        ]

        for pattern in patterns:
            match = re.search(pattern, path_str)
            if match:
                category = match.group(1).rstrip('.')
                return category

        return 'Unknown'

    def map_category_to_scope(self, ipcc_category):
        """Map IPCC category to GHG Protocol scope"""
        # Try exact match
        if ipcc_category in self.category_mapping:
            return self.category_mapping[ipcc_category]

        # Try partial match (e.g., 1.A.1.a matches 1.A.1)
        for key in sorted(self.category_mapping.keys(), key=len, reverse=True):
            if ipcc_category.startswith(key):
                return self.category_mapping[key]

        # Default
        return {
            'scope': 'Scope 1',
            'scope_category': '1.1',
            'category_name': 'Unknown',
            'activity_type': 'unknown'
        }

    def process_excel_file(self, filepath):
        """Process a single IPCC Excel file"""
        filename = filepath.name
        print(f"  📄 Processing: {filename}")

        try:
            # Read Excel file
            df = pd.read_excel(filepath, sheet_name=0)

            # Check if file has expected columns
            if df.empty or len(df.columns) < 5:
                print(f"     ⚠️  Skipped - Empty or invalid format")
                self.stats['failed_files'] += 1
                return

            # Display column names for inspection
            print(f"     Columns: {', '.join(df.columns[:8].tolist())}")

            # Extract category from path
            ipcc_category = self.extract_category_from_path(filepath)
            scope_info = self.map_category_to_scope(ipcc_category)

            # Process rows
            count = 0
            for idx, row in df.iterrows():
                if idx == 0:  # Skip header row
                    continue

                # Extract emission factor data
                factor = self.extract_factor_from_row(row, df.columns, ipcc_category, scope_info, filepath)

                if factor:
                    self.factors.append(factor)
                    count += 1

            print(f"     ✅ Extracted {count} factors")
            self.stats['processed_files'] += 1
            self.stats['total_factors'] += count

        except Exception as e:
            print(f"     ❌ Error: {str(e)}")
            self.stats['failed_files'] += 1

    def extract_factor_from_row(self, row, columns, ipcc_category, scope_info, filepath):
        """Extract emission factor from a row"""

        try:
            # Common IPCC column names (may vary slightly)
            col_mapping = {}
            for idx, col in enumerate(columns):
                col_lower = str(col).lower()
                if 'gas' in col_lower:
                    col_mapping['gas'] = idx
                elif 'fuel' in col_lower and '2006' in col_lower:
                    col_mapping['fuel'] = idx
                elif 'fuel' in col_lower and '1996' not in col_lower:
                    col_mapping['fuel'] = idx
                elif 'value' in col_lower or 'factor' in col_lower:
                    col_mapping['value'] = idx
                elif 'unit' in col_lower:
                    col_mapping['unit'] = idx
                elif 'region' in col_lower or 'country' in col_lower:
                    col_mapping['country'] = idx
                elif 'type' in col_lower and 'parameter' in col_lower:
                    col_mapping['type'] = idx

            # Get gas type (only process GHG gases) - FIXED using iloc
            gas = str(row.iloc[col_mapping.get('gas', 3)]).strip().upper() if 'gas' in col_mapping else ''

            # Filter for GHG gases only (CO2, CH4, N2O)
            ghg_gases = ['CARBON DIOXIDE', 'CO2', 'METHANE', 'CH4', 'NITROUS OXIDE', 'N2O']
            if not any(ghg in gas for ghg in ghg_gases):
                return None

            # Normalize gas name
            if 'CO2' in gas or 'CARBON DIOXIDE' in gas:
                gas_normalized = 'CO2'
            elif 'CH4' in gas or 'METHANE' in gas:
                gas_normalized = 'CH4'
            elif 'N2O' in gas or 'NITROUS' in gas:
                gas_normalized = 'N2O'
            else:
                return None

            # Get emission factor value
            value_col = col_mapping.get('value', 10) if 'value' in col_mapping else None
            if value_col is None or pd.isna(row[value_col]):
                return None

            try:
                emission_factor = float(row[value_col])
                if emission_factor <= 0:
                    return None
            except (ValueError, TypeError):
                return None

            # Get other fields
            fuel = str(row[col_mapping.get('fuel', 5)]) if 'fuel' in col_mapping else 'Unknown'
            unit = str(row[col_mapping.get('unit', 11)]) if 'unit' in col_mapping else 'unit'
            country = str(row[col_mapping.get('country', -1)]) if 'country' in col_mapping else 'Global'
            data_type = str(row[col_mapping.get('type', -1)]) if 'type' in col_mapping else 'IPCC Default'

            # Clean values
            fuel = fuel.replace('\n', ' ').strip() if fuel != 'nan' else 'Unknown'
            country = country.strip() if country and country != 'nan' else 'Global'

            # Determine data quality based on type
            quality_mapping = {
                'Measured': 'High',
                'Country-specific': 'High',
                'IPCC default': 'Medium',
                '2006 IPCC default': 'Medium',
                'Other': 'Medium'
            }
            data_quality = 'Medium'
            for key in quality_mapping:
                if key.lower() in data_type.lower():
                    data_quality = quality_mapping[key]
                    break

            # Generate activity type from fuel
            activity_type = self.generate_activity_type(fuel, scope_info['activity_type'])

            # Create factor dictionary
            factor = {
                'id': self.factor_id,
                'activity_type': activity_type,
                'activity_subtype': scope_info['activity_type'],
                'activity_category': ipcc_category,
                'region': self.determine_region(country),
                'country': country if country != 'Global' else None,
                'state_province': None,
                'city': None,
                'emission_factor': emission_factor,
                'unit': unit.strip(),
                'co2_factor': emission_factor if gas_normalized == 'CO2' else None,
                'ch4_factor': emission_factor if gas_normalized == 'CH4' else None,
                'n2o_factor': emission_factor if gas_normalized == 'N2O' else None,
                'gas_type': gas_normalized,
                'source': 'IPCC EFDB',
                'source_url': 'https://www.ipcc-nggip.iges.or.jp/EFDB/',
                'methodology': data_type,
                'data_quality': data_quality,
                'year': 2023,
                'valid_from': '2023-01-01',
                'valid_until': '2030-12-31',
                'priority': 3 if country == 'Global' else 2,
                'confidence_level': 0.90 if data_quality == 'High' else 0.80,
                'is_default': country == 'Global',
                'scope': scope_info['scope'],
                'scope_category': scope_info['scope_category'],
                'category_name': scope_info['category_name'],
                'industry_sector': 'All',
                'company_size': 'All',
                'notes': f"IPCC {ipcc_category} - {fuel} - {gas_normalized}",
                'tags': self.generate_tags(fuel, activity_type, gas_normalized),
                'conversion_factor': None,
                'original_unit': unit.strip(),
                'ipcc_category': ipcc_category,
                'fuel_type': fuel,
                'source_file': filepath.name
            }

            self.factor_id += 1

            # Update stats
            self.stats['by_category'][ipcc_category] = self.stats['by_category'].get(ipcc_category, 0) + 1
            self.stats['by_country'][country] = self.stats['by_country'].get(country, 0) + 1
            self.stats['by_gas'][gas_normalized] = self.stats['by_gas'].get(gas_normalized, 0) + 1

            return factor

        except Exception as e:
            return None

    def generate_activity_type(self, fuel, default_type):
        """Generate activity type from fuel name"""
        fuel_lower = fuel.lower()

        if 'coal' in fuel_lower:
            return 'coal'
        elif 'diesel' in fuel_lower:
            return 'diesel'
        elif 'petrol' in fuel_lower or 'gasoline' in fuel_lower:
            return 'petrol'
        elif 'natural gas' in fuel_lower or 'gas' in fuel_lower:
            return 'natural_gas'
        elif 'electricity' in fuel_lower:
            return 'electricity'
        elif 'biomass' in fuel_lower:
            return 'biomass'
        else:
            return default_type

    def determine_region(self, country):
        """Determine region from country"""
        if country == 'Global' or not country or country == 'nan':
            return 'Global'

        # Regional mapping (simplified)
        asia_countries = ['India', 'China', 'Japan', 'Indonesia', 'Thailand', 'Vietnam']
        europe_countries = ['UK', 'Germany', 'France', 'Italy', 'Spain']
        americas_countries = ['USA', 'Canada', 'Brazil', 'Mexico']

        if country in asia_countries:
            return 'Asia'
        elif country in europe_countries:
            return 'Europe'
        elif country in americas_countries:
            return 'Americas'
        else:
            return 'Global'

    def generate_tags(self, fuel, activity_type, gas_type):
        """Generate searchable tags"""
        tags = set()

        # Add fuel-related tags
        if fuel and fuel != 'Unknown':
            tags.update(fuel.lower().split())

        # Add activity type
        tags.add(activity_type)

        # Add gas type
        tags.add(gas_type.lower())

        # Clean tags
        tags = {t.strip('(),') for t in tags if t and len(t) > 2 and t != 'nan'}

        return ', '.join(sorted(tags))

    def save_to_csv(self, output_file='ipcc_all_factors.csv'):
        """Save all factors to CSV"""
        print(f"\n💾 Saving to CSV: {output_file}")

        if not self.factors:
            print("  ⚠️  No factors to save!")
            return

        df = pd.DataFrame(self.factors)
        df.to_csv(output_file, index=False, encoding='utf-8')

        print(f"  ✅ Saved {len(self.factors)} factors to {output_file}")

    def generate_summary(self):
        """Generate summary report"""
        print("\n" + "=" * 80)
        print("📊 IPCC EXTRACTION SUMMARY")
        print("=" * 80)

        print(f"\n📁 Files:")
        print(f"  • Total found: {self.stats['total_files']}")
        print(f"  • Processed successfully: {self.stats['processed_files']}")
        print(f"  • Failed: {self.stats['failed_files']}")

        print(f"\n✅ Emission Factors:")
        print(f"  • Total extracted: {self.stats['total_factors']}")

        print(f"\n📋 By IPCC Category:")
        for category, count in sorted(self.stats['by_category'].items())[:10]:
            print(f"  • {category}: {count} factors")

        print(f"\n🌍 By Country/Region:")
        for country, count in sorted(self.stats['by_country'].items(), key=lambda x: x[1], reverse=True)[:10]:
            print(f"  • {country}: {count} factors")

        print(f"\n💨 By Gas Type:")
        for gas, count in sorted(self.stats['by_gas'].items()):
            print(f"  • {gas}: {count} factors")

        print("\n" + "=" * 80)


def main():
    """Main execution function"""
    print("🚀 IPCC EMISSION FACTOR ORGANIZER")
    print("=" * 80)

    # CHANGE THIS PATH TO YOUR IPCC FOLDER
    ipcc_base_path = r"C:\Users\shubh\Downloads\IPCC\IPCC"

    # Verify path exists
    if not Path(ipcc_base_path).exists():
        print(f"❌ ERROR: Path not found: {ipcc_base_path}")
        print("\n💡 Please update the 'ipcc_base_path' variable in the script with your correct path")
        return

    # Initialize organizer
    organizer = IPCCOrganizer(ipcc_base_path)

    # Find all Excel files
    excel_files = organizer.find_all_excel_files()

    if not excel_files:
        print("❌ No Excel files found!")
        return

    # Process each file
    print("🔄 Processing files...")
    print("-" * 80)
    for filepath in excel_files:
        organizer.process_excel_file(filepath)

    # Save results
    organizer.save_to_csv('ipcc_all_factors.csv')

    # Generate summary
    organizer.generate_summary()

    print("\n✅ DONE! IPCC factors extracted successfully.")
    print("\n📄 Output file: ipcc_all_factors.csv")
    print("\n💡 Next step: Run Script 2 to merge with DEFRA data")


if __name__ == '__main__':
    main()