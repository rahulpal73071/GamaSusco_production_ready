# import_factors.py
"""
Import IPCC and DEFRA emission factors into database
Run AFTER organize_ipcc.py and organize_defra.py
"""
import pandas as pd
from pathlib import Path
from app.database import SessionLocal
from app.models import EmissionFactor
from datetime import datetime


def import_ipcc_factors(csv_path='ipcc_all_factors.csv'):
    """Import IPCC factors from CSV"""

    if not Path(csv_path).exists():
        print(f"❌ {csv_path} not found!")
        print("   Run organize_ipcc.py first")
        return 0

    print(f"\n📥 Importing IPCC factors from {csv_path}...")

    db = SessionLocal()

    # Check if already imported
    existing_ipcc = db.query(EmissionFactor).filter(
        EmissionFactor.source == 'IPCC EFDB'
    ).count()

    if existing_ipcc > 0:
        print(f"   ⚠️  Found {existing_ipcc} existing IPCC factors")
        choice = input("   Delete and reimport? (y/n): ").lower()
        if choice == 'y':
            db.query(EmissionFactor).filter(
                EmissionFactor.source == 'IPCC EFDB'
            ).delete()
            db.commit()
            print("   ✅ Deleted existing IPCC factors")
        else:
            print("   ⏭️  Skipping IPCC import")
            db.close()
            return existing_ipcc

    # Read CSV
    df = pd.read_csv(csv_path)
    print(f"   📊 Found {len(df)} factors in CSV")

    # Import factors
    count = 0
    errors = 0

    for idx, row in df.iterrows():
        try:
            # Check for required fields
            if pd.isna(row.get('emission_factor')) or row.get('emission_factor') <= 0:
                continue

            if pd.isna(row.get('unit')) or not row.get('unit'):
                continue

            factor = EmissionFactor(
                activity_type=str(row.get('activity_type', 'unknown')),
                activity_subtype=str(row.get('activity_subtype', '')),
                activity_category=str(row.get('activity_category', '')),
                region=str(row.get('region', 'Global')),
                country=str(row.get('country', '')) if pd.notna(row.get('country')) else None,
                state_province=None,
                city=None,
                emission_factor=float(row['emission_factor']),
                unit=str(row['unit']),
                co2_factor=float(row['co2_factor']) if pd.notna(row.get('co2_factor')) else None,
                ch4_factor=float(row['ch4_factor']) if pd.notna(row.get('ch4_factor')) else None,
                n2o_factor=float(row['n2o_factor']) if pd.notna(row.get('n2o_factor')) else None,
                gas_type=str(row.get('gas_type', 'CO2e')),
                source='IPCC EFDB',
                source_url='https://www.ipcc-nggip.iges.or.jp/EFDB/',
                methodology=str(row.get('methodology', 'IPCC Guidelines')),
                data_quality=str(row.get('data_quality', 'Medium')),
                year=int(row.get('year', 2023)),
                valid_from='2023-01-01',
                valid_until='2030-12-31',
                priority=int(row.get('priority', 3)),
                confidence_level=float(row.get('confidence_level', 0.85)),
                is_default=bool(row.get('is_default', False)),
                scope=str(row.get('scope', 'Scope 1')),
                scope_category=str(row.get('scope_category', '1.1')),
                category_name=str(row.get('category_name', 'Unknown')),
                industry_sector='All',
                company_size='All',
                notes=str(row.get('notes', ''))[:255] if pd.notna(row.get('notes')) else None,
                tags=str(row.get('tags', ''))[:500] if pd.notna(row.get('tags')) else None,
                created_at=datetime.utcnow()
            )

            db.add(factor)
            count += 1

            # Commit in batches
            if count % 1000 == 0:
                db.commit()
                print(f"   ✅ Imported {count} factors...")

        except Exception as e:
            errors += 1
            if errors <= 5:  # Only show first 5 errors
                print(f"   ⚠️  Row {idx}: {str(e)[:100]}")

    # Final commit
    db.commit()
    db.close()

    print(f"\n✅ IPCC Import Complete:")
    print(f"   • Imported: {count} factors")
    print(f"   • Errors: {errors}")

    return count


def import_defra_factors(csv_path='defra_factors.csv'):
    """Import DEFRA factors from CSV"""

    if not Path(csv_path).exists():
        print(f"❌ {csv_path} not found!")
        print("   Run organize_defra.py first")
        return 0

    print(f"\n📥 Importing DEFRA factors from {csv_path}...")

    db = SessionLocal()

    # Check if already imported
    existing_defra = db.query(EmissionFactor).filter(
        EmissionFactor.source == 'DEFRA 2024'
    ).count()

    if existing_defra > 0:
        print(f"   ⚠️  Found {existing_defra} existing DEFRA factors")
        choice = input("   Delete and reimport? (y/n): ").lower()
        if choice == 'y':
            db.query(EmissionFactor).filter(
                EmissionFactor.source == 'DEFRA 2024'
            ).delete()
            db.commit()
            print("   ✅ Deleted existing DEFRA factors")
        else:
            print("   ⏭️  Skipping DEFRA import")
            db.close()
            return existing_defra

    # Read CSV
    df = pd.read_csv(csv_path)
    print(f"   📊 Found {len(df)} factors in CSV")

    # Import factors (same logic as IPCC)
    count = 0
    errors = 0

    for idx, row in df.iterrows():
        try:
            if pd.isna(row.get('emission_factor')) or row.get('emission_factor') <= 0:
                continue

            if pd.isna(row.get('unit')) or not row.get('unit'):
                continue

            factor = EmissionFactor(
                activity_type=str(row.get('activity_type', 'unknown')),
                activity_subtype=str(row.get('activity_subtype', '')),
                activity_category=str(row.get('activity_category', '')),
                region=str(row.get('region', 'Global')),
                country=str(row.get('country', '')) if pd.notna(row.get('country')) else None,
                emission_factor=float(row['emission_factor']),
                unit=str(row['unit']),
                co2_factor=float(row['co2_factor']) if pd.notna(row.get('co2_factor')) else None,
                ch4_factor=float(row['ch4_factor']) if pd.notna(row.get('ch4_factor')) else None,
                n2o_factor=float(row['n2o_factor']) if pd.notna(row.get('n2o_factor')) else None,
                source='DEFRA 2024',
                source_url='https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2024',
                methodology=str(row.get('methodology', 'Lifecycle Assessment')),
                data_quality=str(row.get('data_quality', 'High')),
                year=2024,
                priority=int(row.get('priority', 3)),
                confidence_level=float(row.get('confidence_level', 0.95)),
                scope=str(row.get('scope', 'Scope 1')),
                scope_category=str(row.get('scope_category', '1.1')),
                category_name=str(row.get('category_name', 'Unknown')),
                notes=str(row.get('notes', ''))[:255] if pd.notna(row.get('notes')) else None,
                tags=str(row.get('tags', ''))[:500] if pd.notna(row.get('tags')) else None,
                created_at=datetime.utcnow()
            )

            db.add(factor)
            count += 1

            if count % 1000 == 0:
                db.commit()
                print(f"   ✅ Imported {count} factors...")

        except Exception as e:
            errors += 1
            if errors <= 5:
                print(f"   ⚠️  Row {idx}: {str(e)[:100]}")

    db.commit()
    db.close()

    print(f"\n✅ DEFRA Import Complete:")
    print(f"   • Imported: {count} factors")
    print(f"   • Errors: {errors}")

    return count


def verify_database():
    """Verify imported factors"""
    print("\n🔍 Verifying database...")

    db = SessionLocal()

    total = db.query(EmissionFactor).count()
    by_source = db.query(
        EmissionFactor.source,
        db.func.count(EmissionFactor.id)
    ).group_by(EmissionFactor.source).all()

    by_scope = db.query(
        EmissionFactor.scope,
        db.func.count(EmissionFactor.id)
    ).group_by(EmissionFactor.scope).all()

    print(f"\n📊 Database Statistics:")
    print(f"   Total Factors: {total}")

    print(f"\n   By Source:")
    for source, count in by_source:
        print(f"      • {source}: {count}")

    print(f"\n   By Scope:")
    for scope, count in by_scope:
        print(f"      • {scope}: {count}")

    db.close()


def main():
    """Main import process"""
    print("=" * 70)
    print("  🌱 EMISSION FACTOR DATABASE IMPORTER")
    print("=" * 70)

    print("\nThis will import emission factors into your database.")
    print("Make sure you've run:")
    print("  1. organize_ipcc.py → generates ipcc_all_factors.csv")
    print("  2. organize_defra.py → generates defra_factors.csv")

    input("\nPress Enter to continue (Ctrl+C to cancel)...")

    # Import IPCC
    ipcc_count = import_ipcc_factors()

    # Import DEFRA
    defra_count = import_defra_factors()

    # Verify
    verify_database()

    print("\n" + "=" * 70)
    print("✅ DATABASE IMPORT COMPLETE!")
    print("=" * 70)
    print(f"\nTotal imported: {ipcc_count + defra_count} emission factors")
    print("\n💡 Your platform now has comprehensive emission factor coverage!")
    print("   • Use smart_emission_calculator.py for calculations")
    print("   • Database query will find exact matches first")
    print("   • AI fallback for missing factors")


if __name__ == '__main__':
    main()