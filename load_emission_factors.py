# load_emission_factors.py
"""
Load emission factors from CSV into database
Run this ONCE after creating the CSV file
"""
import pandas as pd
from app.database import SessionLocal, init_db
from app.models import EmissionFactor
from datetime import datetime


def load_india_factors():
    """Load India emission factors from CSV"""

    print("\n" + "=" * 70)
    print(" LOADING INDIA EMISSION FACTORS INTO DATABASE")
    print("=" * 70)

    # Initialize database
    init_db()
    db = SessionLocal()

    try:
        # Read CSV
        print("\n📄 Reading data/india_emission_factors.csv...")
        df = pd.read_csv('data/india_emission_factors.csv')
        print(f"✅ Found {len(df)} factors in CSV")

        # Check if already loaded
        existing_count = db.query(EmissionFactor).count()
        if existing_count > 0:
            print(f"\n⚠️  Database already has {existing_count} factors")
            response = input("Delete existing and reload? (yes/no): ")
            if response.lower() != 'yes':
                print("❌ Cancelled")
                return

            # Delete existing
            db.query(EmissionFactor).delete()
            db.commit()
            print("✅ Cleared existing factors")

        # Load factors
        print(f"\n💾 Loading {len(df)} factors into database...")

        added = 0
        for idx, row in df.iterrows():
            try:
                factor = EmissionFactor(
                    activity_type=str(row['activity_type']).strip(),
                    region=str(row['region']).strip(),
                    unit=str(row['unit']).strip(),
                    emission_factor=float(row['emission_factor']),
                    source=str(row['source']).strip(),
                    year=int(row['year']),
                    priority=int(row['priority']),
                    scope=str(row.get('scope', 'Unknown')).strip(),
                    category=str(row.get('category', 'Unknown')).strip(),
                    created_at=datetime.now()
                )

                db.add(factor)
                added += 1

                if (idx + 1) % 10 == 0:
                    print(f"   Loaded {idx + 1}/{len(df)}...", end="\r")

            except Exception as e:
                print(f"\n⚠️  Error on row {idx + 1}: {e}")
                continue

        db.commit()

        print(f"\n✅ Successfully loaded {added} emission factors!")

        # Verify
        total = db.query(EmissionFactor).count()
        india_count = db.query(EmissionFactor).filter(
            EmissionFactor.region == 'India'
        ).count()

        print(f"\n📊 Database Summary:")
        print(f"   Total factors: {total}")
        print(f"   India-specific: {india_count}")
        print(f"   Global/Other: {total - india_count}")

        # Show samples
        print(f"\n📋 Sample factors:")
        samples = db.query(EmissionFactor).limit(5).all()
        for f in samples:
            print(f"   • {f.activity_type} ({f.region}): {f.emission_factor} {f.unit} - {f.source}")

        print("\n" + "=" * 70)
        print("✅ LOADING COMPLETE!")
        print("=" * 70)

    except FileNotFoundError:
        print("\n❌ Error: data/india_emission_factors.csv not found!")
        print("   Please create the CSV file first.")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()

    finally:
        db.close()


if __name__ == "__main__":
    load_india_factors()