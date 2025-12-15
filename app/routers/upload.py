# app/routers/upload.py
"""
File Upload & Document Processing API (SECURED)
================================================
Upload documents, extract data, calculate emissions
WITH authentication and company data isolation
"""

from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from pathlib import Path
import os
import shutil
from datetime import datetime, timezone

from app.database import get_db
from app.models import Company, EmissionActivity, User
from app.routers.auth import get_current_user

# ✅ Import the corrected processor
from app.ai.universal_document_processor import process_any_document

router = APIRouter(
    prefix="/api/companies/{company_id}",
    tags=["File Upload"]
)

# Upload directory
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


# ============================================================================
# SECURITY HELPER
# ============================================================================

def verify_company_access(company_id: int, current_user: User, db: Session):
    """
    Verify user has access to company data

    Raises HTTPException if:
    - Company doesn't exist
    - User doesn't belong to this company
    """
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )

    if current_user.company_id != company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You don't have permission to access this company's data"
        )

    return company


# ============================================================================
# UPLOAD ENDPOINT (SECURED)
# ============================================================================

@router.post("/upload-document")
async def upload_document(
        company_id: int,
        file: UploadFile = File(...),
        location: Optional[str] = Form(None, description="Location context (e.g., 'Mumbai office')"),
        period: Optional[str] = Form(None, description="Reporting period (e.g., 'Q3 2024')"),
        notes: Optional[str] = Form(None, description="Additional notes"),
        auto_save: bool = Form(True, description="Automatically save activities to database"),
        current_user: User = Depends(get_current_user),  # ← AUTHENTICATION REQUIRED
        db: Session = Depends(get_db)
):
    """
    📄 **Upload ANY document and get emissions automatically (SECURED)**

    **Authentication Required:** JWT token
    **Authorization:** User must belong to the company

    **Supported Files:**
    - 📊 Excel/CSV: `.xlsx`, `.xls`, `.csv`
    - 📑 PDFs: `.pdf`
    - 🖼️ Images: `.jpg`, `.jpeg`, `.png`
    - 📝 Text: `.txt`

    **Supported Documents:**
    - ⚡ Electricity bills
    - ⛽ Fuel receipts
    - 🏨 Hotel bills
    - 🚕 Cab/taxi receipts
    - 🚂 Train tickets
    - ✈️ Flight tickets
    - 📦 Logistics invoices
    - 🗑️ Waste invoices
    - 💧 Water bills
    - 🛒 Purchase invoices
    - 📈 BRSR reports
    - 🌱 LCA reports
    - 🚗 Commute surveys
    """

    print(f"\n{'=' * 70}")
    print(f"📤 FILE UPLOAD - Company {company_id}")
    print(f"👤 User: {current_user.username} (ID: {current_user.id})")
    print(f"{'=' * 70}")
    print(f"📄 File: {file.filename}")
    print(f"📍 Location: {location or 'Not specified'}")
    print(f"{'=' * 70}")

    # SECURITY CHECK: Verify user can access this company
    company = verify_company_access(company_id, current_user, db)
    print(f"✅ Access granted to: {company.name}")

    # Validate file type
    allowed_extensions = {'.pdf', '.xlsx', '.xls', '.csv', '.jpg', '.jpeg', '.png', '.txt'}
    file_ext = Path(file.filename).suffix.lower()

    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type: {file_ext}. Allowed: {', '.join(allowed_extensions)}"
        )

    try:
        # STEP 1: Save uploaded file (with company isolation)
        print(f"\n1️⃣ Saving file...")

        # Create company-specific directory
        company_upload_dir = UPLOAD_DIR / f"company_{company_id}"
        company_upload_dir.mkdir(exist_ok=True)

        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        safe_filename = f"{timestamp}_{Path(file.filename).name}"
        file_path = company_upload_dir / safe_filename

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        print(f"   ✅ Saved: {file_path}")

        # STEP 2: Process document with Universal Processor
        print(f"\n2️⃣ Processing document...")

        user_context = {
            'location': location or f"{company.city}, {company.country}" if company.city else "India",
            'period': period,
            'notes': notes,
            'company_name': company.name,
            'company_id': company_id,
            'uploaded_by': current_user.username
        }

        # ✅ Use corrected processor
        result = process_any_document(str(file_path), user_context)

        if not result['success']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Document processing failed: {result.get('error', 'Unknown error')}"
            )

        print(f"   ✅ Processed: {result['document_type_detected']}")
        print(f"   📊 Found {len(result['activities'])} activities")
        print(f"   🌍 Total: {result['total_emissions']['readable']}")

        # STEP 3: Save activities to database (if auto_save enabled)
        saved_activities = []

        if auto_save:
            print(f"\n3️⃣ Saving activities to database...")

            for activity_data in result.get('technical_details', {}).get('activities_detailed', []):
                try:
                    # Get category - NEVER use 'unknown'
                    category = activity_data.get('category') or activity_data.get('category_name', '')
                    if not category or category.lower() == 'unknown':
                        # Infer category from activity type
                        act_type = activity_data.get('activity_type', '').lower()
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
                    
                    activity = EmissionActivity(
                        company_id=company_id,  # ← Locked to user's company
                        activity_type=activity_data['activity_type'],
                        activity_name=activity_data.get('description', activity_data['activity_type']),
                        description=activity_data.get('description'),
                        quantity=activity_data['quantity'],
                        unit=activity_data['unit'],
                        emissions_kgco2e=activity_data['emissions_kg'],
                        emission_factor=activity_data.get('emission_factor'),
                        emission_factor_unit=activity_data.get('emission_factor_unit'),
                        calculation_method=activity_data.get('calculation_method'),
                        data_quality=activity_data.get('data_quality'),
                        confidence=activity_data.get('confidence', 0.8),
                        source=activity_data.get('source'),
                        scope=activity_data['scope'],
                        scope_number=int(activity_data['scope'].split()[1]),
                        category=category,  # Use the validated category - NEVER 'unknown'
                        subcategory=activity_data.get('sub_category'),
                        activity_date=datetime.fromisoformat(activity_data['date']) if activity_data.get(
                            'date') else datetime.now(timezone.utc),
                        location=activity_data.get('location') or location,
                        from_location=activity_data.get('from_location'),
                        to_location=activity_data.get('to_location'),
                        source_document=file.filename,
                        document_type=result['document_type_detected'],
                        notes=notes,
                        created_by=current_user.username,  # ← Track who uploaded
                        created_at=datetime.now(timezone.utc)
                    )

                    db.add(activity)
                    saved_activities.append(activity)

                except Exception as e:
                    print(f"   ⚠️ Failed to save activity: {e}")

            if saved_activities:
                db.commit()
                print(f"   ✅ Saved {len(saved_activities)} activities")

                # Update company summary
                try:
                    from app.models import calculate_summary_for_company
                    calculate_summary_for_company(db, company_id, period or "Current")
                except ImportError:
                    print("   ⚠️ Summary calculation not available")

        print(f"\n{'=' * 70}")
        print(f"✅ PROCESSING COMPLETE")
        print(f"{'=' * 70}\n")

        # STEP 4: Return response
        return {
            "success": True,
            "message": result['simple_summary'],
            "document_info": {
                "filename": file.filename,
                "type_detected": result['document_type_detected'],
                "file_size_kb": round(file_path.stat().st_size / 1024, 2),
                "processed_at": datetime.now(timezone.utc).isoformat(),
                "uploaded_by": current_user.username,
                "company_id": company_id,
                "company_name": company.name
            },
            "emissions_summary": {
                "total_kg": result['total_emissions']['kg'],
                "total_tonnes": result['total_emissions']['tonnes'],
                "readable": result['total_emissions']['readable'],
                "equivalent_to": result['total_emissions']['equivalent_to']
            },
            "scope_breakdown": result['scope_breakdown'],
            "activities": result['activities'],
            "data_quality": result['data_quality'],
            "recommendations": result.get('recommendations', []),
            "saved_to_database": auto_save,
            "database_ids": [a.id for a in saved_activities] if auto_save else [],
            "technical_details": result.get('technical_details', {})
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

        # Clean up file on error
        if 'file_path' in locals() and file_path.exists():
            os.remove(file_path)

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"File processing failed: {str(e)}"
        )
    finally:
        file.file.close()


# ============================================================================
# LIST UPLOADS (SECURED)
# ============================================================================

@router.get("/uploads")
async def list_uploaded_files(
        company_id: int,
        current_user: User = Depends(get_current_user),  # ← AUTHENTICATION REQUIRED
        db: Session = Depends(get_db)
):
    """
    📂 List all uploaded files for company (SECURED)

    **Authentication Required:** JWT token
    **Authorization:** User must belong to the company
    """

    # SECURITY CHECK
    company = verify_company_access(company_id, current_user, db)

    # Get all activities with source documents (only for this company)
    activities = db.query(EmissionActivity).filter(
        EmissionActivity.company_id == company_id,  # ← Company isolation
        EmissionActivity.source_document.isnot(None)
    ).order_by(EmissionActivity.created_at.desc()).all()

    # Group by document
    documents = {}
    for activity in activities:
        doc_name = activity.source_document
        if doc_name not in documents:
            documents[doc_name] = {
                "filename": doc_name,
                "document_type": activity.document_type,
                "uploaded_at": activity.created_at.isoformat(),
                "uploaded_by": activity.created_by,
                "activities_count": 0,
                "total_emissions_kg": 0
            }

        documents[doc_name]["activities_count"] += 1
        documents[doc_name]["total_emissions_kg"] += activity.emissions_kgco2e

    return {
        "success": True,
        "company_id": company_id,
        "company_name": company.name,
        "total_documents": len(documents),
        "documents": list(documents.values())
    }