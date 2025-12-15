# app/routers/bulk.py
"""
Bulk Import API (SECURED)
==========================
Import hundreds of activities from Excel/CSV
WITH authentication and company data isolation
"""

from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from pathlib import Path
import pandas as pd
from datetime import datetime, timezone
import os

from app.database import get_db
from app.models import Company, EmissionActivity, User
from app.calculators.unified_emission_engine import get_engine
from app.ai.scope_classifier import classify_scope_and_category
from app.routers.auth import get_current_user

router = APIRouter(
    prefix="/api/companies/{company_id}/bulk-import",
    tags=["Bulk Import"]
)


# ============================================================================
# SECURITY HELPER
# ============================================================================

def verify_company_access(company_id: int, current_user: User, db: Session):
    """Verify user has access to company"""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )

    if current_user.company_id != company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    return company


# ============================================================================
# BULK IMPORT (SECURED)
# ============================================================================

@router.post("")
async def bulk_import_activities(
        company_id: int,
        file: UploadFile = File(...),
        reporting_period: Optional[str] = Form(None, description="Reporting period (e.g., 'FY 2024-25')"),
        location: Optional[str] = Form(None, description="Default location if not in file"),
        validate_only: bool = Form(False, description="Only validate, don't save"),
        current_user: User = Depends(get_current_user),  # ← AUTHENTICATION REQUIRED
        db: Session = Depends(get_db)
):
    """
    📊 **Bulk import activities from Excel/CSV (SECURED)**

    **Authentication Required:** JWT token
    **Authorization:** User must belong to the company

    **File Format:**

    Excel/CSV must have these columns:
```
    | date       | activity_type | quantity | unit   | description (optional) |
    |------------|---------------|----------|--------|------------------------|
    | 2024-10-01 | diesel        | 150      | litre  | Generator fuel         |
    | 2024-10-02 | electricity   | 5000     | kwh    | Office consumption     |
    | 2024-10-03 | flight        | 1500     | km     | Mumbai-Delhi           |
```

    **Optional Columns:**
    - `location`: Activity location
    - `from_location`: Origin (for travel)
    - `to_location`: Destination (for travel)
    - `notes`: Additional notes
    - `category`: Manual category override

    **Process:**
    1. Verify user access to company
    2. Parse Excel/CSV
    3. Validate all rows
    4. Calculate emissions for each
    5. Classify scope/category
    6. Save to database

    **Returns:**
    - Summary statistics
    - Success/failure breakdown
    - Validation errors
    """

    print(f"\n{'=' * 70}")
    print(f"📦 BULK IMPORT - Company {company_id}")
    print(f"👤 User: {current_user.username}")
    print(f"{'=' * 70}")

    # SECURITY CHECK
    company = verify_company_access(company_id, current_user, db)
    print(f"✅ Access granted to: {company.name}")

    # Validate file type
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ['.xlsx', '.xls', '.csv']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type: {file_ext}. Use .xlsx, .xls, or .csv"
        )

    try:
        # STEP 1: Read file
        print(f"\n1️⃣ Reading file: {file.filename}")

        # Save temporarily (company-isolated)
        temp_dir = Path("uploads") / f"company_{company_id}" / "temp"
        temp_dir.mkdir(parents=True, exist_ok=True)

        temp_path = temp_dir / f"bulk_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}{file_ext}"

        with open(temp_path, "wb") as buffer:
            buffer.write(await file.read())

        # Parse
        if file_ext == '.csv':
            df = pd.read_csv(temp_path)
        else:
            df = pd.read_excel(temp_path)

        print(f"   ✅ Found {len(df)} rows")

        # STEP 2: Validate columns
        print(f"\n2️⃣ Validating structure...")

        required_columns = ['activity_type', 'quantity', 'unit']
        missing_cols = [col for col in required_columns if col not in df.columns]

        if missing_cols:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Missing required columns: {', '.join(missing_cols)}"
            )

        # Normalize column names
        df.columns = df.columns.str.lower().str.strip().str.replace(' ', '_')

        print(f"   ✅ All required columns present")

        # STEP 3: Process each row
        print(f"\n3️⃣ Processing activities...")

        engine = get_engine()
        results = {
            'total': len(df),
            'successful': 0,
            'failed': 0,
            'activities': [],
            'errors': []
        }

        activities_to_save = []

        for idx, row in df.iterrows():
            row_num = idx + 2  # Excel row (header = 1)

            try:
                # Parse row
                activity_type = str(row['activity_type']).strip()
                quantity = float(row['quantity'])
                unit = str(row['unit']).strip()

                # Optional fields
                description = str(row.get('description', '')) if pd.notna(row.get('description')) else None
                activity_location = str(row.get('location', location or '')) if pd.notna(
                    row.get('location')) else location
                from_loc = str(row.get('from_location', '')) if pd.notna(row.get('from_location')) else None
                to_loc = str(row.get('to_location', '')) if pd.notna(row.get('to_location')) else None
                notes = str(row.get('notes', '')) if pd.notna(row.get('notes')) else None

                # Parse date
                activity_date = None
                if 'date' in row and pd.notna(row['date']):
                    try:
                        activity_date = pd.to_datetime(row['date'])
                    except:
                        activity_date = datetime.now(timezone.utc)
                else:
                    activity_date = datetime.now(timezone.utc)

                # Validate quantity
                if quantity <= 0:
                    raise ValueError(f"Quantity must be positive")

                # Calculate emissions
                calculation = engine.calculate_emissions(
                    activity_type=activity_type,
                    quantity=quantity,
                    unit=unit,
                    region=activity_location or "India",
                    description=description or ""
                )

                if not calculation.success:
                    raise ValueError(f"Calculation failed: {calculation.error}")

                # Classify scope
                classification = classify_scope_and_category(
                    activity_description=description or activity_type,
                    category=activity_type,
                    quantity=quantity,
                    unit=unit
                )

                # Get category - NEVER use 'unknown'
                category = classification['category_name']
                if not category or category.lower() == 'unknown':
                    # Infer category from activity type
                    act_type = activity_type.lower()
                    if 'electric' in act_type: category = 'Electricity'
                    elif 'diesel' in act_type: category = 'Diesel'
                    elif 'petrol' in act_type or 'gasoline' in act_type: category = 'Petrol'
                    elif 'flight' in act_type or 'air' in act_type: category = 'Flight'
                    elif 'taxi' in act_type or 'cab' in act_type: category = 'Taxi'
                    elif 'train' in act_type or 'rail' in act_type: category = 'Train'
                    elif 'hotel' in act_type: category = 'Hotel'
                    elif 'coal' in act_type: category = 'Coal'
                    elif 'gas' in act_type: category = 'Natural Gas'
                    elif 'refrigerant' in act_type or 'ac' in act_type: category = 'Refrigerant'
                    elif 'waste' in act_type: category = 'Waste'
                    elif 'water' in act_type: category = 'Water'
                    elif 'transport' in act_type or 'vehicle' in act_type: category = 'Transport'
                    elif 'fuel' in act_type: category = 'Fuel'
                    elif 'scope' in act_type or 'emission' in act_type: category = 'Emissions'
                    else: category = 'Other'

                # Create activity object
                activity = EmissionActivity(
                    company_id=company_id,  # ← Locked to user's company
                    activity_type=activity_type,
                    activity_name=description or f"{activity_type} - {quantity} {unit}",
                    description=description,
                    quantity=quantity,
                    unit=unit,
                    emissions_kgco2e=calculation.co2e_kg,
                    emission_factor=calculation.emission_factor,
                    emission_factor_unit=calculation.emission_factor_unit,
                    calculation_method=calculation.calculation_method,
                    data_quality=calculation.data_quality,
                    confidence=calculation.confidence,
                    source=calculation.source,
                    scope=classification['scope'],
                    scope_number=int(classification['scope'].split()[1]),
                    category=category,  # Use validated category - NEVER 'unknown'
                    subcategory=classification['sub_category'],
                    activity_date=activity_date,
                    reporting_period=reporting_period,
                    location=activity_location,
                    from_location=from_loc,
                    to_location=to_loc,
                    notes=notes,
                    source_document=file.filename,
                    created_by=f"{current_user.username}_BULK",  # ← Track creator
                    created_at=datetime.now(timezone.utc)
                )

                activities_to_save.append(activity)

                results['successful'] += 1
                results['activities'].append({
                    'row': row_num,
                    'activity_type': activity_type,
                    'quantity': quantity,
                    'unit': unit,
                    'emissions_kgco2e': calculation.co2e_kg,
                    'scope': classification['scope'],
                    'status': 'success'
                })

                print(f"   ✅ Row {row_num}: {activity_type} - {calculation.co2e_kg:.2f} kg CO2e")

            except Exception as e:
                results['failed'] += 1
                results['errors'].append({
                    'row': row_num,
                    'activity_type': row.get('activity_type', 'Unknown'),
                    'error': str(e)
                })
                print(f"   ❌ Row {row_num}: {str(e)}")

        # STEP 4: Save to database (if not validate_only)
        if not validate_only and activities_to_save:
            print(f"\n4️⃣ Saving to database...")

            try:
                db.add_all(activities_to_save)
                db.commit()
                print(f"   ✅ Saved {len(activities_to_save)} activities")

                # Update summary
                try:
                    from app.models import calculate_summary_for_company
                    calculate_summary_for_company(db, company_id, reporting_period or "Current")
                except ImportError:
                    print("   ⚠️ Summary calculation not available")

            except Exception as e:
                db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Database save failed: {str(e)}"
                )

        # Clean up temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)

        print(f"\n{'=' * 70}")
        print(f"✅ BULK IMPORT COMPLETE")
        print(f"{'=' * 70}")
        print(f"   Total: {results['total']}")
        print(f"   ✅ Success: {results['successful']}")
        print(f"   ❌ Failed: {results['failed']}")
        print(f"{'=' * 70}\n")

        # Calculate totals
        total_emissions = sum(a.emissions_kgco2e for a in activities_to_save)

        return {
            "success": True,
            "message": f"Processed {results['total']} rows: {results['successful']} successful, {results['failed']} failed",
            "company_id": company_id,
            "company_name": company.name,
            "imported_by": current_user.username,
            "summary": {
                "total_rows": results['total'],
                "successful": results['successful'],
                "failed": results['failed'],
                "total_emissions_kg": round(total_emissions, 2),
                "total_emissions_tonnes": round(total_emissions / 1000, 3)
            },
            "validation_only": validate_only,
            "saved_to_database": not validate_only,
            "activities": results['activities'],
            "errors": results['errors'] if results['errors'] else None,
            "scope_breakdown": calculate_scope_breakdown(activities_to_save) if activities_to_save else None
        }

    except HTTPException:
        raise
    except Exception as e:
        # Clean up temp file
        if 'temp_path' in locals() and os.path.exists(temp_path):
            os.remove(temp_path)

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Bulk import failed: {str(e)}"
        )


def calculate_scope_breakdown(activities: list) -> dict:
    """Calculate emissions by scope"""

    breakdown = {
        'Scope 1': 0,
        'Scope 2': 0,
        'Scope 3': 0
    }

    for activity in activities:
        breakdown[activity.scope] += activity.emissions_kgco2e

    return {
        'scope_1_kg': round(breakdown['Scope 1'], 2),
        'scope_2_kg': round(breakdown['Scope 2'], 2),
        'scope_3_kg': round(breakdown['Scope 3'], 2)
    }


# ============================================================================
# DOWNLOAD TEMPLATE (PUBLIC - No Auth Needed)
# ============================================================================

@router.get("/template")
async def download_template():
    """
    📥 Download Excel template for bulk import

    **No authentication required** - This is a public template

    Returns a pre-formatted Excel file with:
    - Required columns
    - Example data
    - Instructions
    """

    # Create sample DataFrame
    sample_data = pd.DataFrame({
        'date': ['2024-10-01', '2024-10-02', '2024-10-03', '2024-10-04'],
        'activity_type': ['diesel', 'electricity', 'flight_domestic', 'hotel_economy'],
        'quantity': [150, 5000, 1500, 2],
        'unit': ['litre', 'kwh', 'km', 'night'],
        'description': [
            'Generator fuel - Mumbai office',
            'Office electricity consumption',
            'Business travel Mumbai-Delhi',
            'Hotel stay for client meeting'
        ],
        'location': ['Mumbai', 'Mumbai', 'India', 'Delhi'],
        'notes': ['Backup power', 'Main office', 'Round trip', 'Conference']
    })

    # Create uploads directory if not exists
    Path("uploads").mkdir(exist_ok=True)

    # Save to temp file
    temp_file = "uploads/bulk_import_template.xlsx"

    with pd.ExcelWriter(temp_file, engine='openpyxl') as writer:
        # Write sample data
        sample_data.to_excel(writer, sheet_name='Sample Data', index=False)

        # Write instructions
        instructions = pd.DataFrame({
            'Column': ['date', 'activity_type', 'quantity', 'unit', 'description', 'location', 'notes'],
            'Required': ['No', 'Yes', 'Yes', 'Yes', 'No', 'No', 'No'],
            'Description': [
                'Activity date (YYYY-MM-DD)',
                'Type: diesel, electricity, flight, etc.',
                'Amount consumed (number)',
                'Unit: litre, kwh, km, night, etc.',
                'Additional details',
                'Location context',
                'Notes'
            ],
            'Example': [
                '2024-10-01',
                'diesel',
                '150',
                'litre',
                'Generator fuel',
                'Mumbai office',
                'Backup power'
            ]
        })
        instructions.to_excel(writer, sheet_name='Instructions', index=False)

    from fastapi.responses import FileResponse
    return FileResponse(
        temp_file,
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        filename='carbon_accounting_bulk_import_template.xlsx'
    )