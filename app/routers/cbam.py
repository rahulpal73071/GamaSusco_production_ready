"""
CBAM (Carbon Border Adjustment Mechanism) Router
===============================================
API endpoints for CBAM reporting and emissions tracking
EU regulation for tracking carbon emissions in imported goods
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, and_
from typing import List, Optional
from datetime import datetime, date
from pydantic import BaseModel

from ..database import get_db
from ..models import (
    CBAMInstallation, CBAMGoods, CBAMEmission, 
    CBAMPrecursor, CBAMQuarterlyReport, Company
)
from .auth import get_current_user
from ..models import User

router = APIRouter(prefix="/api/companies/{company_id}/cbam", tags=["CBAM"])


# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class CBAMInstallationCreate(BaseModel):
    installation_name: str
    country_code: str
    operator_name: Optional[str] = None
    address: Optional[str] = None
    economic_activity: Optional[str] = None
    un_locode: Optional[str] = None


class CBAMInstallationUpdate(BaseModel):
    installation_name: Optional[str] = None
    country_code: Optional[str] = None
    operator_name: Optional[str] = None
    address: Optional[str] = None
    economic_activity: Optional[str] = None
    un_locode: Optional[str] = None


class CBAMPrecursorCreate(BaseModel):
    precursor_goods_id: int
    precursor_quantity: float
    precursor_emissions: float
    calculation_method: str = "EU_methodology"


class CBAMEmissionCreate(BaseModel):
    installation_id: int
    goods_id: int
    reporting_period: date
    direct_emissions: Optional[float] = None
    indirect_emissions: Optional[float] = None
    quantity_imported: float
    quantity_unit: str
    carbon_price_paid: Optional[float] = None
    carbon_price_currency: str = "EUR"
    carbon_price_country: Optional[str] = None
    calculation_method: str = "EU_methodology"
    precursors: Optional[List[CBAMPrecursorCreate]] = None


class CBAMQuarterlyReportGenerate(BaseModel):
    quarter: int
    year: int


# ============================================================================
# INSTALLATION MANAGEMENT
# ============================================================================

@router.post("/installations", response_model=dict)
async def create_installation(
    installation: CBAMInstallationCreate,
    company_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new CBAM installation"""
    # Verify company access
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    db_installation = CBAMInstallation(
        company_id=company_id,
        **installation.dict()
    )
    db.add(db_installation)
    db.commit()
    db.refresh(db_installation)
    return db_installation.to_dict()


@router.get("/installations", response_model=List[dict])
async def get_installations(
    company_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all installations for a company"""
    installations = db.query(CBAMInstallation).filter(
        CBAMInstallation.company_id == company_id
    ).all()
    return [inst.to_dict() for inst in installations]


@router.get("/installations/{installation_id}", response_model=dict)
async def get_installation(
    installation_id: int,
    company_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific installation"""
    installation = db.query(CBAMInstallation).filter(
        CBAMInstallation.id == installation_id,
        CBAMInstallation.company_id == company_id
    ).first()
    
    if not installation:
        raise HTTPException(status_code=404, detail="Installation not found")
    
    return installation.to_dict()


@router.put("/installations/{installation_id}", response_model=dict)
async def update_installation(
    installation_id: int,
    installation_update: CBAMInstallationUpdate,
    company_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an installation"""
    installation = db.query(CBAMInstallation).filter(
        CBAMInstallation.id == installation_id,
        CBAMInstallation.company_id == company_id
    ).first()
    
    if not installation:
        raise HTTPException(status_code=404, detail="Installation not found")
    
    update_data = installation_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(installation, key, value)
    
    installation.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(installation)
    return installation.to_dict()


@router.delete("/installations/{installation_id}")
async def delete_installation(
    installation_id: int,
    company_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an installation"""
    installation = db.query(CBAMInstallation).filter(
        CBAMInstallation.id == installation_id,
        CBAMInstallation.company_id == company_id
    ).first()
    
    if not installation:
        raise HTTPException(status_code=404, detail="Installation not found")
    
    db.delete(installation)
    db.commit()
    return {"message": "Installation deleted successfully"}


# ============================================================================
# EMISSIONS TRACKING
# ============================================================================

@router.post("/emissions", response_model=dict)
async def record_emissions(
    emission: CBAMEmissionCreate,
    company_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Record CBAM emissions"""
    # Verify installation and goods exist
    installation = db.query(CBAMInstallation).filter(
        CBAMInstallation.id == emission.installation_id,
        CBAMInstallation.company_id == company_id
    ).first()
    
    if not installation:
        raise HTTPException(status_code=404, detail="Installation not found")
    
    goods = db.query(CBAMGoods).filter(CBAMGoods.id == emission.goods_id).first()
    if not goods:
        raise HTTPException(status_code=404, detail="Goods not found")
    
    # Calculate total embedded emissions
    total_embedded = (emission.direct_emissions or 0) + (emission.indirect_emissions or 0)
    
    # Add precursor emissions if provided
    if emission.precursors:
        for precursor_data in emission.precursors:
            total_embedded += precursor_data.precursor_emissions
    
    db_emission = CBAMEmission(
        company_id=company_id,
        total_embedded_emissions=total_embedded,
        **emission.dict(exclude={'precursors'})
    )
    db.add(db_emission)
    db.flush()  # Get the ID
    
    # Add precursors if provided
    if emission.precursors:
        for precursor_data in emission.precursors:
            db_precursor = CBAMPrecursor(
                parent_emission_id=db_emission.id,
                **precursor_data.dict()
            )
            db.add(db_precursor)
    
    db.commit()
    db.refresh(db_emission)
    return db_emission.to_dict()


@router.get("/emissions", response_model=List[dict])
async def get_emissions(
    company_id: int,
    installation_id: Optional[int] = None,
    goods_id: Optional[int] = None,
    quarter: Optional[int] = Query(None, ge=1, le=4),
    year: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get CBAM emissions with optional filters"""
    query = db.query(CBAMEmission).filter(
        CBAMEmission.company_id == company_id
    )
    
    if installation_id:
        query = query.filter(CBAMEmission.installation_id == installation_id)
    if goods_id:
        query = query.filter(CBAMEmission.goods_id == goods_id)
    if quarter and year:
        query = query.filter(
            extract('quarter', CBAMEmission.reporting_period) == quarter,
            extract('year', CBAMEmission.reporting_period) == year
        )
    elif year:
        query = query.filter(extract('year', CBAMEmission.reporting_period) == year)
    
    emissions = query.order_by(CBAMEmission.reporting_period.desc()).all()
    return [em.to_dict() for em in emissions]


@router.get("/emissions/aggregated", response_model=List[dict])
async def get_aggregated_emissions(
    company_id: int,
    quarter: Optional[int] = Query(None, ge=1, le=4),
    year: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get aggregated emissions by goods category"""
    query = db.query(
        CBAMGoods.goods_category,
        CBAMGoods.cn_code,
        func.sum(CBAMEmission.direct_emissions).label('total_direct'),
        func.sum(CBAMEmission.indirect_emissions).label('total_indirect'),
        func.sum(CBAMEmission.total_embedded_emissions).label('total_embedded'),
        func.sum(CBAMEmission.quantity_imported).label('total_quantity')
    ).join(
        CBAMEmission, CBAMEmission.goods_id == CBAMGoods.id
    ).filter(
        CBAMEmission.company_id == company_id
    )
    
    if quarter and year:
        query = query.filter(
            extract('quarter', CBAMEmission.reporting_period) == quarter,
            extract('year', CBAMEmission.reporting_period) == year
        )
    elif year:
        query = query.filter(extract('year', CBAMEmission.reporting_period) == year)
    
    results = query.group_by(CBAMGoods.goods_category, CBAMGoods.cn_code).all()
    
    return [
        {
            "goodsCategory": r.goods_category,
            "cnCode": r.cn_code,
            "direct": float(r.total_direct or 0),
            "indirect": float(r.total_indirect or 0),
            "totalEmbedded": float(r.total_embedded or 0),
            "totalQuantity": float(r.total_quantity or 0)
        }
        for r in results
    ]


# ============================================================================
# QUARTERLY REPORTS
# ============================================================================

def generate_cbam_xml(emissions: List[dict], quarter: int, year: int, company_name: str = "") -> str:
    """Generate CBAM-compliant XML export"""
    xml = f'''<?xml version="1.0" encoding="UTF-8"?>
<CBAMReport>
  <CompanyName>{company_name}</CompanyName>
  <ReportingPeriod>
    <Quarter>{quarter}</Quarter>
    <Year>{year}</Year>
  </ReportingPeriod>
  <Goods>'''
    
    for emission in emissions:
        xml += f'''
    <Good>
      <CNCode>{emission['cnCode']}</CNCode>
      <GoodsCategory>{emission['goodsCategory']}</GoodsCategory>
      <TotalQuantity>{emission['totalQuantity']}</TotalQuantity>
      <DirectEmissions>{emission['direct']}</DirectEmissions>
      <IndirectEmissions>{emission['indirect']}</IndirectEmissions>
      <EmbeddedEmissions>{emission['totalEmbedded']}</EmbeddedEmissions>
    </Good>'''
    
    xml += '''
  </Goods>
</CBAMReport>'''
    return xml


def calculate_submission_deadline(quarter: int, year: int) -> date:
    """Calculate CBAM submission deadline (end of month following quarter end)"""
    quarter_end_months = {1: 3, 2: 6, 3: 9, 4: 12}
    end_month = quarter_end_months[quarter]
    # Deadline is end of following month
    if end_month == 12:
        deadline = date(year + 1, 1, 31)
    else:
        # Simplified: use 28th to avoid month-end issues
        deadline = date(year, end_month + 1, 28)
    return deadline


@router.post("/reports/generate", response_model=dict)
async def generate_quarterly_report(
    report_data: CBAMQuarterlyReportGenerate,
    company_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate quarterly CBAM report"""
    if report_data.quarter < 1 or report_data.quarter > 4:
        raise HTTPException(status_code=400, detail="Quarter must be between 1 and 4")
    
    # Get aggregated emissions
    emissions = await get_aggregated_emissions(
        company_id, 
        report_data.quarter, 
        report_data.year, 
        current_user, 
        db
    )
    
    total_direct = sum(e["direct"] for e in emissions)
    total_indirect = sum(e["indirect"] for e in emissions)
    total_embedded = sum(e["totalEmbedded"] for e in emissions)
    
    # Get company name
    company = db.query(Company).filter(Company.id == company_id).first()
    company_name = company.name if company else ""
    
    # Generate XML export
    xml_export = generate_cbam_xml(emissions, report_data.quarter, report_data.year, company_name)
    
    # Create or update report
    report = db.query(CBAMQuarterlyReport).filter(
        CBAMQuarterlyReport.company_id == company_id,
        CBAMQuarterlyReport.quarter == report_data.quarter,
        CBAMQuarterlyReport.year == report_data.year
    ).first()
    
    if report:
        report.total_direct_emissions = total_direct
        report.total_indirect_emissions = total_indirect
        report.total_embedded_emissions = total_embedded
        report.xml_export = xml_export
        report.updated_at = datetime.utcnow()
    else:
        report = CBAMQuarterlyReport(
            company_id=company_id,
            quarter=report_data.quarter,
            year=report_data.year,
            total_direct_emissions=total_direct,
            total_indirect_emissions=total_indirect,
            total_embedded_emissions=total_embedded,
            xml_export=xml_export,
            submission_deadline=calculate_submission_deadline(report_data.quarter, report_data.year)
        )
        db.add(report)
    
    db.commit()
    db.refresh(report)
    return report.to_dict()


@router.get("/reports", response_model=List[dict])
async def get_quarterly_reports(
    company_id: int,
    year: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all quarterly reports for a company"""
    query = db.query(CBAMQuarterlyReport).filter(
        CBAMQuarterlyReport.company_id == company_id
    )
    
    if year:
        query = query.filter(CBAMQuarterlyReport.year == year)
    
    reports = query.order_by(
        CBAMQuarterlyReport.year.desc(),
        CBAMQuarterlyReport.quarter.desc()
    ).all()
    
    return [r.to_dict() for r in reports]


@router.get("/reports/{report_id}/export")
async def export_report_xml(
    report_id: int,
    company_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export quarterly report as XML"""
    report = db.query(CBAMQuarterlyReport).filter(
        CBAMQuarterlyReport.id == report_id,
        CBAMQuarterlyReport.company_id == company_id
    ).first()
    
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    if not report.xml_export:
        raise HTTPException(status_code=404, detail="XML export not available")
    
    from fastapi.responses import Response
    return Response(
        content=report.xml_export,
        media_type="application/xml",
        headers={
            "Content-Disposition": f"attachment; filename=cbam_report_q{report.quarter}_{report.year}.xml"
        }
    )


# ============================================================================
# CBAM GOODS LOOKUP
# ============================================================================

@router.get("/goods", response_model=List[dict])
async def get_cbam_goods(
    category: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get CBAM goods catalog with optional filters"""
    query = db.query(CBAMGoods)
    
    if category:
        query = query.filter(CBAMGoods.goods_category == category)
    if search:
        query = query.filter(
            CBAMGoods.cn_code.ilike(f"%{search}%") |
            CBAMGoods.description.ilike(f"%{search}%")
        )
    
    goods = query.order_by(CBAMGoods.goods_category, CBAMGoods.cn_code).all()
    return [g.to_dict() for g in goods]


@router.get("/goods/{cn_code}", response_model=dict)
async def get_goods_by_code(
    cn_code: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get goods by CN code"""
    goods = db.query(CBAMGoods).filter(CBAMGoods.cn_code == cn_code).first()
    
    if not goods:
        raise HTTPException(status_code=404, detail="Goods not found")
    
    return goods.to_dict()

