# interactive_upload.py
"""
PRODUCTION EMISSION TRACKING SYSTEM - Interactive CLI
=====================================================
Real-world document upload and processing system
Ready to connect to frontend API

Features:
- Upload any document (bills, receipts, reports)
- Auto-detect document type
- Extract → Calculate → Classify → Save
- Real-time scope breakdown
- Generate comprehensive AI report at end
"""

import os
import sys
from pathlib import Path
from datetime import datetime
from typing import Dict, List

# Add app to path
sys.path.insert(0, str(Path(__file__).parent))

from app.database import SessionLocal, init_db
from app.models import Company, EmissionActivity
from app.ai.chatgpt_extractor import extract_document_data
from app.services.smart_emission_calculator import calculate_with_transparency
from app.ai.scope_classifier import classify_scope_and_category
from app.services.recommendation_engine import generate_detailed_recommendations


class EmissionTrackingSystem:
    """Production emission tracking system"""

    def __init__(self):
        self.db = SessionLocal()
        self.company = None
        self.uploaded_files = []
        self.activities_created = []

    def initialize(self):
        """Initialize database and company"""
        print("\n" + "=" * 70)
        print(" 🌍 EMISSION TRACKING SYSTEM - PRODUCTION MODE")
        print("=" * 70)

        # Initialize database
        print("\n🔧 Initializing database...")
        init_db()
        print("✅ Database ready")

        # Get or create company
        self.company = self.get_or_create_company()

        print(f"\n✅ Company: {self.company.name} (ID: {self.company.id})")
        print(f"   Industry: {self.company.industry}")
        print(f"   Employees: {self.company.employee_count}")

    def get_or_create_company(self) -> Company:
        """Get existing or create new company"""

        print("\n" + "─" * 70)
        print("COMPANY SELECTION")
        print("─" * 70)

        # Check existing companies
        companies = self.db.query(Company).all()

        if companies:
            print("\n📊 Existing companies:")
            for i, comp in enumerate(companies, 1):
                activity_count = self.db.query(EmissionActivity).filter(
                    EmissionActivity.company_id == comp.id
                ).count()
                print(f"   {i}. {comp.name} - {activity_count} activities")

            print(f"   {len(companies) + 1}. Create new company")

            choice = input(f"\nSelect company (1-{len(companies) + 1}): ").strip()

            try:
                choice_num = int(choice)
                if 1 <= choice_num <= len(companies):
                    return companies[choice_num - 1]
            except:
                pass

        # Create new company
        print("\n📝 Create new company:")
        name = input("   Company name: ").strip() or "My Company"

        # Try to get optional fields
        industry = input("   Industry (optional, press Enter to skip): ").strip()

        try:
            emp_count_str = input("   Employee count (optional, press Enter to skip): ").strip()
            emp_count = int(emp_count_str) if emp_count_str else None
        except:
            emp_count = None

        location = input("   Location (optional, press Enter to skip): ").strip()

        # Build company with only required fields + available optional fields
        company_kwargs = {
            'name': name,
            'created_at': datetime.now()
        }

        # Dynamically add fields that exist in the model
        available_columns = [col.key for col in Company.__table__.columns]

        if 'industry' in available_columns and industry:
            company_kwargs['industry'] = industry

        if 'employee_count' in available_columns and emp_count:
            company_kwargs['employee_count'] = emp_count

        # Location might be named differently
        location_field = None
        for field in ['location', 'address', 'city', 'region', 'headquarters']:
            if field in available_columns:
                location_field = field
                break

        if location_field and location:
            company_kwargs[location_field] = location

        company = Company(**company_kwargs)

        self.db.add(company)
        self.db.commit()

        print(f"\n✅ Created company: {name}")

        return company

    def show_current_summary(self):
        """Show current emission summary by scope"""

        activities = self.db.query(EmissionActivity).filter(
            EmissionActivity.company_id == self.company.id
        ).all()

        if not activities:
            print("\n📊 No activities yet. Upload your first document!")
            return

        # Calculate scope totals
        scope_totals = {
            'Scope 1': 0,
            'Scope 2': 0,
            'Scope 3': 0
        }

        category_totals = {}

        for activity in activities:
            scope = activity.scope or 'Unknown'
            emissions = activity.emissions_kgco2e or 0
            category = activity.category or 'Unknown'

            if scope in scope_totals:
                scope_totals[scope] += emissions

            if category not in category_totals:
                category_totals[category] = 0
            category_totals[category] += emissions

        total_emissions = sum(scope_totals.values())

        # Display summary
        print("\n" + "=" * 70)
        print(f" 📊 CURRENT EMISSION SUMMARY - {self.company.name}")
        print("=" * 70)

        print(f"\n🌍 TOTAL EMISSIONS: {total_emissions:,.2f} kg CO2e ({total_emissions / 1000:.2f} tonnes)")

        print(f"\n🔥 SCOPE BREAKDOWN:")
        print(f"   {'─' * 66}")
        print(f"   {'Scope':<20} {'Emissions (kg)':<25} {'%':<15}")
        print(f"   {'─' * 66}")

        for scope in ['Scope 1', 'Scope 2', 'Scope 3']:
            emissions = scope_totals[scope]
            percentage = (emissions / total_emissions * 100) if total_emissions > 0 else 0
            print(f"   {scope:<20} {emissions:>20,.2f}   {percentage:>10.1f}%")

        print(f"   {'─' * 66}")

        # Show top categories
        if category_totals:
            print(f"\n📋 TOP EMISSION CATEGORIES:")
            sorted_categories = sorted(
                category_totals.items(),
                key=lambda x: x[1],
                reverse=True
            )[:5]

            for category, emissions in sorted_categories:
                percentage = (emissions / total_emissions * 100) if total_emissions > 0 else 0
                print(f"   • {category:<35} {emissions:>15,.2f} kg ({percentage:.1f}%)")

        print("\n" + "=" * 70)

    def upload_document(self):
        """Upload and process a single document - COMPLETE VERSION"""

        print("\n" + "─" * 70)
        print("📤 DOCUMENT UPLOAD")
        print("─" * 70)

        # Step 1: Get file path
        file_path = input("\nEnter file path (or 'menu' to go back): ").strip()

        if file_path.lower() == 'menu':
            return False

        if not file_path:
            print("❌ No file path provided")
            return False

        # Remove quotes if present (Windows copy-paste adds quotes)
        file_path = file_path.strip('"').strip("'")

        # Verify file exists
        if not os.path.exists(file_path):
            print(f"❌ File not found: {file_path}")
            print(f"   Path checked: {os.path.abspath(file_path)}")
            return False

        print(f"\n📄 Processing: {Path(file_path).name}")

        # Step 2: Optional document type hint
        print("\n📋 Document type (optional, press Enter to auto-detect):")
        print("   1. electricity_bill")
        print("   2. fuel_receipt")
        print("   3. hotel_bill")
        print("   4. cab_receipt")
        print("   5. train_ticket")
        print("   6. flight_ticket")
        print("   7. waste_invoice")
        print("   8. water_bill")
        print("   9. brsr_report")
        print("   10. auto_detect (default)")

        doc_type = input("\nSelect (1-10 or press Enter): ").strip()

        type_map = {
            '1': 'electricity_bill',
            '2': 'fuel_receipt',
            '3': 'hotel_bill',
            '4': 'cab_receipt',
            '5': 'train_ticket',
            '6': 'flight_ticket',
            '7': 'waste_invoice',
            '8': 'water_bill',
            '9': 'brsr_report',
            '10': 'auto_detect'
        }

        document_type = type_map.get(doc_type, 'auto_detect')

        # Step 3: Extract document
        print(f"\n🔍 Extracting data from document...")

        try:
            extraction_result = extract_document_data(file_path, document_type)
        except Exception as e:
            print(f"❌ Extraction error: {e}")
            import traceback
            traceback.print_exc()
            return False

        # Step 4: Check extraction success
        if not extraction_result.get('success'):
            print(f"❌ Extraction failed: {extraction_result.get('error')}")
            return False

        print("✅ Extraction successful!")

        # Step 5: Check if data exists
        if extraction_result.get('data') is None:
            print("\n⚠️  Document processed but no emission data found")
            print("   This may be a report with no extractable activities")
            return False

        # Step 6: Process extracted activities
        extracted_activities = self.process_extraction_result(extraction_result)

        # Step 7: Validate activities
        if not extracted_activities:
            print("\n⚠️  No emission activities found in document")
            print("   This document may not contain extractable emission data")
            print("\n   💡 Suggestions:")
            print("   • Try selecting a specific document type (not auto-detect)")
            print("   • Ensure the document contains emission-related data")
            print("   • Try a simpler document (electricity bill, fuel receipt)")
            return False

        print(f"\n✅ Found {len(extracted_activities)} activities in document")

        # Step 8: Save activities to database
        print("\n💾 Saving activities to database...")
        saved_count = 0

        for i, activity_data in enumerate(extracted_activities, 1):
            print(f"\n   Activity {i}/{len(extracted_activities)}:")
            if self.save_activity(activity_data, file_path):
                saved_count += 1

        # Step 9: Check if any saved
        if saved_count == 0:
            print("\n⚠️  No activities could be saved to database")
            print("   Check error messages above")
            return False

        print(f"\n✅ Successfully saved {saved_count}/{len(extracted_activities)} activities")

        # Step 10: Track uploaded file
        self.uploaded_files.append({
            'file': Path(file_path).name,
            'type': document_type,
            'activities': saved_count,
            'timestamp': datetime.now()
        })

        return True

    def process_extraction_result(self, extraction_result: Dict) -> List[Dict]:
        """Process extraction result into activities - FIXED VERSION"""

        # Validate extraction result
        if not extraction_result:
            print("⚠️  Empty extraction result")
            return []

        # Get data safely
        data = extraction_result.get('data')

        # Handle None or empty data
        if data is None:
            print("⚠️  No data in extraction result")

            # Check if there are extracted_activities at top level
            if 'extracted_activities' in extraction_result:
                activity_list = extraction_result['extracted_activities']
                if activity_list:
                    print(f"   Found {len(activity_list)} activities at top level")
                    return [self.normalize_activity(act) for act in activity_list]

            return []

        # Data exists but might be empty dict
        if not isinstance(data, dict):
            print(f"⚠️  Invalid data type: {type(data)}")
            return []

        activities = []

        # Check if multi-activity (e.g., BRSR report, Excel with multiple rows)
        if data.get('multi_activity') or 'extracted_activities' in extraction_result:
            # Multiple activities
            activity_list = extraction_result.get('extracted_activities', [])

            # Check if activities are in data dict
            if not activity_list and 'activities' in data:
                activity_list = data['activities']

            # Process each activity
            if activity_list:
                print(f"   Processing {len(activity_list)} activities...")
                for act in activity_list:
                    if act:  # Skip None activities
                        normalized = self.normalize_activity(act)
                        if normalized and normalized.get('quantity', 0) > 0:
                            activities.append(normalized)
            else:
                print("   No activities found in multi-activity document")

        else:
            # Single activity (e.g., one electricity bill)
            if data:
                normalized = self.normalize_activity(data)
                if normalized and normalized.get('quantity', 0) > 0:
                    activities.append(normalized)

        return activities

    def normalize_activity(self, raw_data: Dict) -> Dict:
        """Normalize extracted data into standard activity format"""

        # Infer activity type
        activity_type = raw_data.get('activity_type')

        if not activity_type:
            # Try to infer from data
            if 'consumption_kwh' in raw_data or 'energy_consumption_kwh' in raw_data:
                activity_type = 'electricity'
                quantity = raw_data.get('consumption_kwh') or raw_data.get('energy_consumption_kwh', 0)
                unit = 'kwh'
            elif 'fuel_type' in raw_data:
                activity_type = raw_data.get('fuel_type', 'diesel').lower()
                quantity = raw_data.get('quantity', 0)
                unit = raw_data.get('unit', 'litre')
            elif 'distance_km' in raw_data:
                # Travel activity
                if 'train' in str(raw_data).lower():
                    activity_type = 'train_electric'
                elif 'flight' in str(raw_data).lower():
                    activity_type = 'flight_domestic_economy'
                elif 'taxi' in str(raw_data).lower() or 'uber' in str(raw_data).lower():
                    activity_type = 'taxi_sedan'
                else:
                    activity_type = 'travel'
                quantity = raw_data.get('distance_km', 0)
                unit = 'km'
            elif 'nights' in raw_data or 'hotel' in str(raw_data).lower():
                activity_type = 'hotel_economy'
                quantity = raw_data.get('nights', 1)
                unit = 'night'
            else:
                activity_type = 'unknown'
                quantity = raw_data.get('quantity', 0)
                unit = raw_data.get('unit', 'unit')
        else:
            quantity = raw_data.get('quantity', 0)
            unit = raw_data.get('unit', 'unit')

        # Build activity description
        description = raw_data.get('description', '')
        if not description:
            description = raw_data.get('activity_name', f"{activity_type} activity")

        return {
            'activity_type': activity_type,
            'activity_name': description,
            'quantity': float(quantity) if quantity else 0,
            'unit': unit,
            'description': description,
            'date': raw_data.get('date') or raw_data.get('billing_date'),
            'location': raw_data.get('location'),
            'raw_data': raw_data
        }

    def save_activity(self, activity_data: Dict, source_file: str) -> bool:
        """Calculate emissions, classify, and save activity"""

        try:
            # Safe region extraction from company
            company_region = None
            for attr in ['location', 'address', 'city', 'region', 'headquarters']:
                if hasattr(self.company, attr):
                    company_region = getattr(self.company, attr)
                    if company_region:
                        break

            region = company_region or 'India'

            # Calculate emissions
            calculation = calculate_with_transparency(
                db=self.db,
                activity_type=activity_data['activity_type'],
                quantity=activity_data['quantity'],
                unit=activity_data['unit'],
                region=region
            )

            # Classify scope
            classification = classify_scope_and_category(
                activity_description=activity_data['description'],
                category='',
                quantity=activity_data['quantity'],
                unit=activity_data['unit'],
                activity_type=activity_data['activity_type']
            )

            # Parse date
            activity_date = datetime.now()
            if activity_data.get('date'):
                try:
                    from dateutil import parser
                    activity_date = parser.parse(str(activity_data['date']))
                except:
                    pass

            # Get available columns for EmissionActivity
            available_columns = [col.key for col in EmissionActivity.__table__.columns]

            # Build activity kwargs with only available fields
            activity_kwargs = {
                'company_id': self.company.id,
                'activity_name': activity_data['activity_name'][:200],
                'activity_type': activity_data['activity_type'],
                'quantity': activity_data['quantity'],
                'unit': activity_data['unit'],
                'emissions_kgco2e': calculation.get('co2e_kg', 0),
                'emission_factor': calculation.get('emission_factor_used', 0),
                'calculation_method': calculation.get('calculation_method', ''),
                'data_quality': calculation.get('data_quality', 'medium'),
                'scope': classification['scope'],
                'category': classification['category_name'],
                'activity_date': activity_date,
                'created_at': datetime.now()
            }

            # Add optional fields only if they exist in the model
            if 'description' in available_columns:
                activity_kwargs['description'] = activity_data.get('description', '')[:500]

            if 'subcategory' in available_columns:
                activity_kwargs['subcategory'] = classification.get('sub_category', '')

            if 'emission_factor_unit' in available_columns:
                activity_kwargs['emission_factor_unit'] = calculation.get('emission_factor_unit', '')

            if 'confidence' in available_columns:
                activity_kwargs['confidence'] = calculation.get('confidence', 0.8)

            if 'database_source' in available_columns:
                activity_kwargs['database_source'] = calculation.get('factor_source', '')

            if 'source_document' in available_columns:
                activity_kwargs['source_document'] = Path(source_file).name

            if 'document_path' in available_columns:
                activity_kwargs['document_path'] = source_file

            if 'location' in available_columns and activity_data.get('location'):
                activity_kwargs['location'] = activity_data.get('location')

            # Create activity
            activity = EmissionActivity(**activity_kwargs)

            self.db.add(activity)
            self.db.commit()

            print(f"   ✅ {activity.activity_name}")
            print(f"      {activity.quantity:,.2f} {activity.unit} → {activity.emissions_kgco2e:,.2f} kg CO2e")
            print(f"      {activity.scope} - {activity.category}")

            self.activities_created.append(activity.id)

            return True

        except Exception as e:
            print(f"   ❌ Error saving activity: {e}")
            import traceback
            traceback.print_exc()
            self.db.rollback()
            return False

    def generate_final_report(self):
        """Generate comprehensive AI report with recommendations"""

        print("\n" + "=" * 70)
        print(" 📊 GENERATING COMPREHENSIVE EMISSION REPORT")
        print("=" * 70)

        # Get all activities
        activities = self.db.query(EmissionActivity).filter(
            EmissionActivity.company_id == self.company.id
        ).all()

        if not activities:
            print("\n⚠️  No activities to report on")
            return

        # Calculate summary
        scope_totals = {'Scope 1': 0, 'Scope 2': 0, 'Scope 3': 0}
        category_totals = {}

        for activity in activities:
            scope = activity.scope or 'Unknown'
            emissions = activity.emissions_kgco2e or 0
            category = activity.category or 'Unknown'

            if scope in scope_totals:
                scope_totals[scope] += emissions

            if category not in category_totals:
                category_totals[category] = 0
            category_totals[category] += emissions

        total_emissions = sum(scope_totals.values())

        # Find top emission sources
        top_sources = sorted(
            category_totals.items(),
            key=lambda x: x[1],
            reverse=True
        )[:5]

        top_sources_list = [
            {
                'activity_type': cat,
                'emissions_kg': emissions,
                'quantity': 0,
                'unit': 'mixed'
            }
            for cat, emissions in top_sources
        ]

        # Generate AI recommendations
        print("\n🤖 Generating AI-powered recommendations...")
        print("   (This may take 20-30 seconds...)")

        emissions_summary = {
            'total_emissions_kg': total_emissions,
            'scope_1_kg': scope_totals['Scope 1'],
            'scope_2_kg': scope_totals['Scope 2'],
            'scope_3_kg': scope_totals['Scope 3']
        }

        try:
            recommendations = generate_detailed_recommendations(
                company_id=self.company.id,
                emissions_summary=emissions_summary,
                top_sources=top_sources_list,
                max_recommendations=3
            )

            print(f"✅ Generated {len(recommendations)} recommendations")

        except Exception as e:
            print(f"⚠️  Could not generate recommendations: {e}")
            recommendations = []

        # Display final report
        self.display_final_report(
            total_emissions,
            scope_totals,
            category_totals,
            recommendations
        )

        # Save report
        self.save_report_to_file(
            total_emissions,
            scope_totals,
            category_totals,
            recommendations
        )

    def display_final_report(self, total_emissions, scope_totals, category_totals, recommendations):
        """Display final report to console"""

        print("\n" + "=" * 70)
        print(f" 🌍 FINAL EMISSION REPORT - {self.company.name}")
        print("=" * 70)

        print(f"\n📅 Report Period: {datetime.now().strftime('%B %Y')}")
        print(f"📊 Total Activities: {len(self.activities_created)}")
        print(f"📁 Documents Processed: {len(self.uploaded_files)}")

        print(f"\n🌍 TOTAL EMISSIONS: {total_emissions:,.2f} kg CO2e")
        print(f"   ({total_emissions / 1000:.2f} tonnes CO2e)")

        print(f"\n🔥 SCOPE BREAKDOWN:")
        print(f"   {'─' * 66}")
        for scope in ['Scope 1', 'Scope 2', 'Scope 3']:
            emissions = scope_totals[scope]
            percentage = (emissions / total_emissions * 100) if total_emissions > 0 else 0
            print(f"   {scope:<20} {emissions:>20,.2f} kg CO2e ({percentage:>5.1f}%)")
        print(f"   {'─' * 66}")

        print(f"\n📋 TOP EMISSION CATEGORIES:")
        sorted_categories = sorted(category_totals.items(), key=lambda x: x[1], reverse=True)[:10]
        for i, (category, emissions) in enumerate(sorted_categories, 1):
            percentage = (emissions / total_emissions * 100) if total_emissions > 0 else 0
            print(f"   {i:2}. {category:<40} {emissions:>12,.2f} kg ({percentage:>5.1f}%)")

        if recommendations:
            print(f"\n💡 AI-GENERATED RECOMMENDATIONS:")
            print(f"   {'─' * 66}")
            for i, rec in enumerate(recommendations, 1):
                print(f"\n   {i}. {rec['title']}")
                print(f"      {rec.get('executive_summary', '')[:200]}...")
                print(f"      💰 Cost: ₹{rec.get('implementation_cost_inr', 0):,}")
                print(
                    f"      🌱 Reduction: {rec.get('estimated_reduction_kg', 0):,} kg CO2e ({rec.get('estimated_reduction_percentage', 0):.0f}%)")
                print(f"      ⏱️  Payback: {rec.get('payback_period_years', 0):.1f} years")

        print("\n" + "=" * 70)

    def save_report_to_file(self, total_emissions, scope_totals, category_totals, recommendations):
        """Save report to text file"""

        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"emission_report_{self.company.name.replace(' ', '_')}_{timestamp}.txt"

        try:
            with open(filename, 'w', encoding='utf-8') as f:
                f.write("=" * 70 + "\n")
                f.write(f" EMISSION REPORT - {self.company.name}\n")
                f.write("=" * 70 + "\n\n")

                f.write(f"Report Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
                f.write(f"Company: {self.company.name}\n")
                f.write(f"Industry: {self.company.industry}\n")
                f.write(f"Location: {self.company.location}\n\n")

                f.write(f"Total Emissions: {total_emissions:,.2f} kg CO2e ({total_emissions / 1000:.2f} tonnes)\n\n")

                f.write("SCOPE BREAKDOWN:\n")
                f.write("-" * 70 + "\n")
                for scope in ['Scope 1', 'Scope 2', 'Scope 3']:
                    emissions = scope_totals[scope]
                    percentage = (emissions / total_emissions * 100) if total_emissions > 0 else 0
                    f.write(f"{scope:<20} {emissions:>20,.2f} kg CO2e ({percentage:>5.1f}%)\n")
                f.write("-" * 70 + "\n\n")

                if recommendations:
                    f.write("AI-GENERATED RECOMMENDATIONS:\n")
                    f.write("=" * 70 + "\n\n")
                    for i, rec in enumerate(recommendations, 1):
                        f.write(f"{i}. {rec['title']}\n")
                        f.write("-" * 70 + "\n")
                        f.write(f"{rec.get('detailed_analysis', '')}\n\n")
                        f.write(f"Implementation Cost: ₹{rec.get('implementation_cost_inr', 0):,}\n")
                        f.write(f"Annual Savings: ₹{rec.get('annual_savings_inr', 0):,}\n")
                        f.write(f"Payback Period: {rec.get('payback_period_years', 0):.1f} years\n")
                        f.write(f"Emission Reduction: {rec.get('estimated_reduction_kg', 0):,} kg CO2e\n")
                        f.write("\n" + "=" * 70 + "\n\n")

            print(f"\n💾 Report saved to: {filename}")

        except Exception as e:
            print(f"⚠️  Could not save report: {e}")

    def run(self):
        """Main interactive loop"""

        self.initialize()

        while True:
            self.show_current_summary()

            print("\n" + "─" * 70)
            print("MAIN MENU")
            print("─" * 70)
            print("   1. Upload document")
            print("   2. View detailed breakdown")
            print("   3. Generate final report")
            print("   4. Exit")

            choice = input("\nSelect option (1-4): ").strip()

            if choice == '1':
                self.upload_document()

            elif choice == '2':
                self.show_current_summary()

            elif choice == '3':
                confirm = input("\nGenerate final AI report? (yes/no): ").strip().lower()
                if confirm == 'yes':
                    self.generate_final_report()
                    break

            elif choice == '4':
                print("\n👋 Thank you for using Emission Tracking System!")
                break

            else:
                print("❌ Invalid choice")

        self.db.close()


# ============================================================================
# MAIN EXECUTION
# ============================================================================

if __name__ == "__main__":
    try:
        system = EmissionTrackingSystem()
        system.run()
    except KeyboardInterrupt:
        print("\n\n👋 Session interrupted. Goodbye!")
    except Exception as e:
        print(f"\n❌ System error: {e}")
        import traceback

        traceback.print_exc()