# app/processors/manual_entry_processor.py
"""
MANUAL ENTRY PROCESSOR
======================
Allows users to manually enter emission activities
Simple form-based input with smart classification
"""
from typing import Dict, Optional, List
from datetime import datetime
from app.database import SessionLocal
from app.models import EmissionActivity, Company
from app.ai.scope_classifier import classify_scope_and_category
from app.services.smart_emission_calculator import calculate_with_transparency
import json


class ManualEntryProcessor:
    """
    Process manual data entries from users
    Handles both simple and bulk entries
    """

    def __init__(self):
        self.db = SessionLocal()

    def process_single_entry(
            self,
            company_id: int,
            activity_name: str,
            quantity: float,
            unit: str,
            date: str,
            location: Optional[str] = None,
            notes: Optional[str] = None,
            user_category_hint: Optional[str] = None
    ) -> Dict:
        """
        Process a single manual entry

        Args:
            company_id: Company ID
            activity_name: User-friendly name ("Office Electricity", "Diesel for Generator")
            quantity: Amount consumed
            unit: Unit of measurement (from dropdown)
            date: Activity date (YYYY-MM-DD)
            location: Optional location
            notes: Optional user notes
            user_category_hint: Optional category hint from user

        Returns:
            {
                'success': bool,
                'activity_id': int,
                'simple_summary': str,
                'emissions': {
                    'kg': float,
                    'tonnes': float,
                    'readable': str
                },
                'scope': str,
                'category': str,
                'data_quality': str
            }
        """

        print(f"\n📝 Processing manual entry: {activity_name}")

        try:
            # Step 1: Infer activity type from name and unit
            activity_type = self._infer_activity_type(activity_name, unit, user_category_hint)
            print(f"   Inferred type: {activity_type}")

            # Step 2: Classify into scope and category
            classification = classify_scope_and_category(
                activity_description=activity_name,
                category=user_category_hint or '',
                quantity=quantity,
                unit=unit
            )
            print(f"   Classified: {classification['scope']} - {classification['category_name']}")

            # Step 3: Calculate emissions
            calculation = calculate_with_transparency(
                db=self.db,
                activity_type=activity_type,
                quantity=quantity,
                unit=unit,
                region=location or 'India',
                activity_description=activity_name
            )

            if not calculation.get('success'):
                return {
                    'success': False,
                    'error': calculation.get('error', 'Could not calculate emissions'),
                    'suggestion': calculation.get('suggestion', '')
                }

            emissions_kg = calculation['co2e_kg']
            print(f"   Emissions: {emissions_kg:.2f} kgCO2e")

            # Step 4: Save to database
            activity = EmissionActivity(
                company_id=company_id,
                date=datetime.strptime(date, '%Y-%m-%d'),
                scope=classification['scope'],
                category=classification['category_name'],
                sub_category=classification.get('sub_category', ''),
                activity_type=activity_type,
                quantity=quantity,
                unit=unit,
                emissions_kgco2e=emissions_kg,
                emission_factor_used=calculation.get('emission_factor'),
                emission_factor_source=calculation.get('source', ''),
                description=activity_name,
                source_document='Manual Entry',
                confidence=calculation.get('confidence_level', 0.8),
                created_at=datetime.utcnow()
            )

            # Add metadata as JSON in notes field
            metadata = {
                'location': location,
                'user_notes': notes,
                'calculation_method': calculation.get('calculation_method'),
                'data_quality': calculation.get('data_quality'),
                'warning': calculation.get('warning'),
                'alternatives': calculation.get('alternatives', [])
            }
            activity.description = f"{activity_name} | {json.dumps(metadata)}"

            self.db.add(activity)
            self.db.commit()
            self.db.refresh(activity)

            print(f"   ✅ Saved activity ID: {activity.id}")

            # Step 5: Generate simple summary
            summary = self._generate_summary(activity_name, emissions_kg, classification)

            return {
                'success': True,
                'activity_id': activity.id,
                'simple_summary': summary,
                'emissions': {
                    'kg': round(emissions_kg, 2),
                    'tonnes': round(emissions_kg / 1000, 3),
                    'readable': self._format_emissions(emissions_kg),
                    'equivalent_to': self._get_equivalent(emissions_kg)
                },
                'scope': classification['scope'],
                'category_simple': self._simplify_category(classification),
                'category_technical': classification['category_name'],
                'data_quality': calculation.get('data_quality', 'medium'),
                'quality_badge': self._get_quality_badge(calculation.get('data_quality')),
                'warnings': calculation.get('warning'),
                'recommendations': calculation.get('alternatives', [])
            }

        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }

    def process_bulk_entries(
            self,
            company_id: int,
            entries: List[Dict]
    ) -> Dict:
        """
        Process multiple manual entries at once

        Args:
            company_id: Company ID
            entries: List of entry dicts (same format as process_single_entry)

        Returns:
            {
                'success': bool,
                'total_processed': int,
                'successful': int,
                'failed': int,
                'results': [...]
            }
        """

        print(f"\n📋 Processing {len(entries)} bulk entries...")

        results = []
        successful = 0
        failed = 0

        for idx, entry in enumerate(entries, 1):
            print(f"\n[{idx}/{len(entries)}]", end=" ")

            result = self.process_single_entry(
                company_id=company_id,
                activity_name=entry.get('activity_name', ''),
                quantity=entry.get('quantity', 0),
                unit=entry.get('unit', ''),
                date=entry.get('date', ''),
                location=entry.get('location'),
                notes=entry.get('notes'),
                user_category_hint=entry.get('category_hint')
            )

            if result['success']:
                successful += 1
            else:
                failed += 1

            results.append({
                'entry': entry,
                'result': result
            })

        print(f"\n✅ Bulk processing complete: {successful} succeeded, {failed} failed")

        return {
            'success': True,
            'total_processed': len(entries),
            'successful': successful,
            'failed': failed,
            'results': results
        }

    def get_available_units(self, activity_hint: Optional[str] = None) -> Dict:
        """
        Get list of available units (for form dropdown)
        Optionally filtered by activity type

        Returns:
            {
                'energy': ['kWh', 'MWh', 'GJ'],
                'fuel': ['litre', 'kg', 'm3'],
                'distance': ['km', 'miles'],
                'weight': ['kg', 'tonne'],
                'volume': ['m3', 'litre'],
                'time': ['night', 'hour', 'day']
            }
        """

        all_units = {
            'energy': {
                'kWh': 'Kilowatt-hours (electricity)',
                'MWh': 'Megawatt-hours (large electricity)',
                'GJ': 'Gigajoules (heat/steam)',
                'kBtu': 'Thousand BTU'
            },
            'fuel': {
                'litre': 'Litres (diesel, petrol, LPG)',
                'kg': 'Kilograms (coal, LPG, CNG)',
                'm3': 'Cubic meters (natural gas)',
                'gallon': 'Gallons (US)'
            },
            'distance': {
                'km': 'Kilometers (travel, transport)',
                'miles': 'Miles',
                'passenger-km': 'Passenger-kilometers (shared travel)',
                'tonne-km': 'Tonne-kilometers (freight)'
            },
            'weight': {
                'kg': 'Kilograms',
                'tonne': 'Tonnes (metric ton)',
                'lb': 'Pounds'
            },
            'volume': {
                'm3': 'Cubic meters (water, gas)',
                'litre': 'Litres',
                'gallon': 'Gallons'
            },
            'time': {
                'night': 'Nights (hotel accommodation)',
                'hour': 'Hours',
                'day': 'Days'
            },
            'count': {
                'unit': 'Units (items)',
                'pieces': 'Pieces'
            }
        }

        # If activity hint provided, suggest relevant units
        if activity_hint:
            hint_lower = activity_hint.lower()

            if any(word in hint_lower for word in ['electric', 'power', 'energy']):
                return {'suggested': all_units['energy'], 'all': all_units}
            elif any(word in hint_lower for word in ['diesel', 'petrol', 'fuel', 'gas', 'lpg']):
                return {'suggested': all_units['fuel'], 'all': all_units}
            elif any(word in hint_lower for word in ['travel', 'flight', 'taxi', 'train', 'car']):
                return {'suggested': all_units['distance'], 'all': all_units}
            elif any(word in hint_lower for word in ['hotel', 'stay', 'accommodation']):
                return {'suggested': all_units['time'], 'all': all_units}
            elif any(word in hint_lower for word in ['waste', 'disposal']):
                return {'suggested': all_units['weight'], 'all': all_units}
            elif any(word in hint_lower for word in ['water']):
                return {'suggested': all_units['volume'], 'all': all_units}

        return {'all': all_units}

    def get_activity_suggestions(self, partial_name: str) -> List[str]:
        """
        Get activity name suggestions (for autocomplete)
        Based on common activities
        """

        common_activities = [
            # Energy
            "Office Electricity",
            "Factory Electricity",
            "Warehouse Electricity",
            "Data Center Electricity",

            # Fuels
            "Diesel for Generator",
            "Diesel for Vehicles",
            "Petrol for Company Cars",
            "Natural Gas for Boiler",
            "LPG for Canteen",
            "CNG for Fleet",

            # Travel
            "Domestic Flight",
            "International Flight",
            "Train Travel",
            "Taxi/Cab",
            "Employee Commute",
            "Hotel Stay",

            # Transport/Logistics
            "Courier Services",
            "Freight Trucking",
            "Container Shipping",
            "Air Freight",

            # Waste
            "Waste Disposal - Landfill",
            "Waste Disposal - Incineration",
            "Recycling",
            "E-waste Disposal",

            # Water
            "Water Consumption",
            "Wastewater Treatment",

            # Refrigerants
            "AC Refrigerant Top-up",
            "Refrigerant Leak",

            # Purchased Goods
            "Steel Purchase",
            "Aluminum Purchase",
            "Plastic Purchase",
            "Paper Purchase",
            "Packaging Materials"
        ]

        # Filter based on partial name
        if partial_name:
            partial_lower = partial_name.lower()
            suggestions = [
                activity for activity in common_activities
                if partial_lower in activity.lower()
            ]
        else:
            suggestions = common_activities

        return suggestions[:10]  # Return top 10 matches

    def _infer_activity_type(self, activity_name: str, unit: str, hint: Optional[str]) -> str:
        """Infer technical activity_type from user inputs"""

        name_lower = activity_name.lower()
        unit_lower = unit.lower()
        hint_lower = hint.lower() if hint else ''

        # Energy
        if 'kwh' in unit_lower or 'mwh' in unit_lower or 'electric' in name_lower:
            return 'electricity'

        # Fuels
        if 'diesel' in name_lower:
            return 'diesel'
        elif 'petrol' in name_lower or 'gasoline' in name_lower:
            return 'petrol'
        elif 'natural gas' in name_lower or (('m3' in unit_lower or 'cubic meter' in unit_lower) and 'gas' in name_lower):
            return 'natural_gas'
        elif 'lpg' in name_lower:
            return 'lpg'
        elif 'cng' in name_lower:
            return 'cng'
        elif 'coal' in name_lower:
            return 'coal'

        # Travel
        if 'flight' in name_lower:
            return 'flight_domestic' if 'domestic' in name_lower else 'flight_international_economy'
        elif 'train' in name_lower:
            return 'train_electric'
        elif 'taxi' in name_lower or 'cab' in name_lower:
            return 'taxi_sedan'
        elif 'hotel' in name_lower:
            return 'hotel_economy'

        # Transport
        if 'truck' in name_lower or 'freight' in name_lower:
            return 'freight_truck_heavy'
        elif 'courier' in name_lower or 'shipping' in name_lower:
            return 'freight_air' if 'air' in name_lower else 'freight_truck_heavy'

        # Waste
        if 'waste' in name_lower:
            if 'landfill' in name_lower:
                return 'waste_landfill'
            elif 'incinerat' in name_lower:
                return 'waste_incineration'
            elif 'recycl' in name_lower:
                return 'waste_recycling'
            else:
                return 'waste_landfill'


        # Water (check BEFORE natural gas, since both use m3)
        if 'water' in name_lower:
            return 'water_supply' if 'wastewater' not in name_lower else 'wastewater_treatment'
        # Refrigerants
        if 'refrigerant' in name_lower or 'ac' in name_lower or 'hvac' in name_lower:
            return 'refrigerant_r134a'

        # Default
        return 'unknown'

    def _generate_summary(self, activity_name: str, emissions_kg: float, classification: Dict) -> str:
        """Generate simple summary for user"""
        return f"{activity_name} generated {self._format_emissions(emissions_kg)}"

    def _format_emissions(self, emissions_kg: float) -> str:
        """Format emissions in readable units"""
        if emissions_kg < 1:
            return f"{emissions_kg * 1000:.0f} grams CO2e"
        elif emissions_kg < 1000:
            return f"{emissions_kg:.1f} kg CO2e"
        else:
            return f"{emissions_kg / 1000:.2f} tonnes CO2e"

    def _get_equivalent(self, emissions_kg: float) -> str:
        """Get relatable equivalent"""
        km_in_car = emissions_kg / 0.22
        if emissions_kg < 10:
            return f"{emissions_kg / 0.008:.0f} smartphone charges"
        elif emissions_kg < 100:
            return f"{km_in_car:.0f} km in a petrol car"
        else:
            trees = emissions_kg / 20
            return f"{trees:.1f} trees needed for 1 year to offset"

    def _simplify_category(self, classification: Dict) -> str:
        """Convert technical category to simple language"""
        scope = classification['scope']
        if scope == 'Scope 1':
            return "Direct emissions from your operations"
        elif scope == 'Scope 2':
            return "Indirect emissions from energy you bought"
        else:
            return "Supply chain emissions"

    def _get_quality_badge(self, quality: str) -> str:
        """Get quality badge"""
        badges = {
            'high': '🟢 High Quality Data',
            'medium': '🟡 Medium Quality Data',
            'low': '🟠 Low Quality Data',
            'estimated': '🔴 AI Estimated'
        }
        return badges.get(quality, '⚪ Unknown')

    def close(self):
        """Close database connection"""
        self.db.close()


# ============================================================================
# API-FRIENDLY WRAPPER
# ============================================================================

def add_manual_activity(
        company_id: int,
        activity_name: str,
        quantity: float,
        unit: str,
        date: str,
        location: Optional[str] = None,
        notes: Optional[str] = None
) -> Dict:
    """
    API-friendly wrapper for single entry

    Example usage:
    ```python
    result = add_manual_activity(
        company_id=1,
        activity_name="Office Electricity",
        quantity=5000,
        unit="kWh",
        date="2024-01-15",
        location="Mumbai office"
    )

    if result['success']:
        print(result['simple_summary'])
        print(f"Emissions: {result['emissions']['readable']}")
    ```
    """
    processor = ManualEntryProcessor()
    result = processor.process_single_entry(
        company_id=company_id,
        activity_name=activity_name,
        quantity=quantity,
        unit=unit,
        date=date,
        location=location,
        notes=notes
    )
    processor.close()
    return result


def add_bulk_activities(company_id: int, entries: List[Dict]) -> Dict:
    """
    API-friendly wrapper for bulk entries

    Example usage:
    ```python
    entries = [
        {
            'activity_name': 'Office Electricity',
            'quantity': 5000,
            'unit': 'kWh',
            'date': '2024-01-15'
        },
        {
            'activity_name': 'Diesel for Generator',
            'quantity': 500,
            'unit': 'litre',
            'date': '2024-01-20'
        }
    ]

    result = add_bulk_activities(company_id=1, entries=entries)
    print(f"Processed: {result['successful']}/{result['total_processed']}")
    ```
    """
    processor = ManualEntryProcessor()
    result = processor.process_bulk_entries(company_id, entries)
    processor.close()
    return result


# ============================================================================
# TESTING
# ============================================================================

if __name__ == "__main__":
    print("=" * 70)
    print("  🖊️  MANUAL ENTRY PROCESSOR TEST")
    print("=" * 70)

    # Test single entry
    result = add_manual_activity(
        company_id=1,
        activity_name="Office Electricity",
        quantity=5000,
        unit="kWh",
        date="2024-01-15",
        location="Mumbai office",
        notes="Main office consumption"
    )

    if result['success']:
        print("\n✅ Single Entry Test:")
        print(f"   {result['simple_summary']}")
        print(f"   {result['emissions']['readable']}")
        print(f"   Category: {result['category_simple']}")
        print(f"   Quality: {result['quality_badge']}")
    else:
        print(f"\n❌ Failed: {result['error']}")

    # Test bulk entry
    entries = [
        {
            'activity_name': 'Diesel for Generator',
            'quantity': 500,
            'unit': 'litre',
            'date': '2024-01-20'
        },
        {
            'activity_name': 'Flight to Delhi',
            'quantity': 1400,
            'unit': 'km',
            'date': '2024-01-25'
        }
    ]

    bulk_result = add_bulk_activities(company_id=1, entries=entries)

    print(f"\n✅ Bulk Entry Test:")
    print(f"   Processed: {bulk_result['successful']}/{bulk_result['total_processed']}")