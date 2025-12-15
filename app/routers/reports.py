# """
# Reports & Analytics Router
# Generate comprehensive emission reports with PDF and Excel exports
# """
# from fastapi import APIRouter, Depends, HTTPException, Response
# from fastapi.responses import StreamingResponse
# from sqlalchemy.orm import Session
# from sqlalchemy import func, extract
# from typing import List, Optional, Dict, Any
# from datetime import datetime, date, timedelta
# from pydantic import BaseModel
# import pandas as pd
# import io
# import json
#
# # PDF Generation imports
# from reportlab.lib import colors
# from reportlab.lib.pagesizes import letter, A4
# from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak, Image
# from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
# from reportlab.lib.units import inch
# from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
#
# # Chart generation imports
# import matplotlib
#
# matplotlib.use('Agg')
# import matplotlib.pyplot as plt
#
# from ..database import get_db
# from ..models import EmissionActivity, Company, User
# from app.routers.auth import get_current_user
#
# router = APIRouter(prefix="/api/v1/reports", tags=["Reports & Analytics"])
#
#
# # ==================== PYDANTIC MODELS ====================
#
# class CompanyProfile(BaseModel):
#     company_name: str
#     address: Optional[str] = "Address not set"
#     industry: Optional[str] = "Industry not set"
#     reporting_officer: str
#     email: str
#     phone: Optional[str] = "N/A"
#     website: Optional[str] = None
#     logo_url: Optional[str] = None
#
#
# class DateRange(BaseModel):
#     start_date: date
#     end_date: date
#
#
# class ReportConfig(BaseModel):
#     report_type: str  # summary, detailed, comparison, trend, comprehensive
#     date_range: DateRange
#     scope: Optional[int] = None
#     category: Optional[str] = None
#     include_water: bool = True
#     include_waste: bool = True
#     include_scope3: bool = True
#     group_by: str = "month"  # day, week, month, quarter, year
#     export_format: str = "json"  # json, csv, excel, pdf
#
#
# class SummaryMetrics(BaseModel):
#     total_emissions_kg: float
#     total_emissions_tons: float
#     scope1_emissions: float
#     scope2_emissions: float
#     scope3_emissions: float
#     top_category: str
#     top_category_emissions: float
#     average_daily_emissions: float
#     total_activities: int
#     comparison_to_previous_period: float
#
#
# class TrendData(BaseModel):
#     period: str
#     emissions_kg: float
#     activities_count: int
#     average_emission_per_activity: float
#
#
# class CategoryBreakdown(BaseModel):
#     category: str
#     emissions_kg: float
#     emissions_percent: float
#     activities_count: int
#
#
# class DetailedReport(BaseModel):
#     summary: SummaryMetrics
#     trends: List[TrendData]
#     category_breakdown: List[CategoryBreakdown]
#     scope_breakdown: Dict[str, float]
#     top_emission_sources: List[Dict[str, Any]]
#     goals_progress: List[Dict[str, Any]]
#     recommendations_summary: Dict[str, Any]
#
#
# class ComprehensiveReportData(BaseModel):
#     company_profile: CompanyProfile
#     summary_metrics: Dict[str, Any]
#     emissions_data: Dict[str, Any]
#     water_data: Dict[str, Any]
#     waste_data: Dict[str, Any]
#     scope3_data: Dict[str, Any]
#     trends: List[Dict[str, Any]]
#     recommendations: List[str]
#     generated_at: datetime
#
#
# # ==================== HELPER FUNCTIONS ====================
#
# def calculate_summary_metrics(
#         db: Session,
#         company_id: int,
#         start_date: date,
#         end_date: date,
#         scope: Optional[int] = None,
#         category: Optional[str] = None
# ) -> SummaryMetrics:
#     """Calculate summary metrics for a date range"""
#
#     # Base query
#     query = db.query(EmissionActivity).filter(
#         EmissionActivity.company_id == company_id,
#         EmissionActivity.activity_date >= start_date,
#         EmissionActivity.activity_date <= end_date
#     )
#
#     if scope:
#         query = query.filter(EmissionActivity.scope_number == scope)
#     if category:
#         query = query.filter(EmissionActivity.category.ilike(f"%{category}%"))
#
#     records = query.all()
#
#     # Calculate totals
#     total_emissions = sum(r.emissions_kgco2e for r in records)
#     scope1 = sum(r.emissions_kgco2e for r in records if r.scope_number == 1)
#     scope2 = sum(r.emissions_kgco2e for r in records if r.scope_number == 2)
#     scope3 = sum(r.emissions_kgco2e for r in records if r.scope_number == 3)
#
#     # Category breakdown
#     category_totals = {}
#     for r in records:
#         cat = r.category or "Uncategorized"
#         category_totals[cat] = category_totals.get(cat, 0) + r.emissions_kgco2e
#
#     top_category = max(category_totals.items(), key=lambda x: x[1]) if category_totals else ("N/A", 0)
#
#     # Calculate average daily emissions
#     days_diff = (end_date - start_date).days + 1
#     avg_daily = total_emissions / days_diff if days_diff > 0 else 0
#
#     # Compare to previous period
#     period_length = (end_date - start_date).days + 1
#     previous_start = start_date - timedelta(days=period_length)
#     previous_end = start_date - timedelta(days=1)
#
#     previous_query = db.query(func.sum(EmissionActivity.emissions_kgco2e)).filter(
#         EmissionActivity.company_id == company_id,
#         EmissionActivity.activity_date >= previous_start,
#         EmissionActivity.activity_date <= previous_end
#     )
#
#     if scope:
#         previous_query = previous_query.filter(EmissionActivity.scope_number == scope)
#     if category:
#         previous_query = previous_query.filter(EmissionActivity.category.ilike(f"%{category}%"))
#
#     previous_emissions = previous_query.scalar() or 0
#
#     comparison = ((total_emissions - previous_emissions) / previous_emissions * 100) if previous_emissions > 0 else 0
#
#     return SummaryMetrics(
#         total_emissions_kg=round(total_emissions, 2),
#         total_emissions_tons=round(total_emissions / 1000, 2),
#         scope1_emissions=round(scope1, 2),
#         scope2_emissions=round(scope2, 2),
#         scope3_emissions=round(scope3, 2),
#         top_category=top_category[0],
#         top_category_emissions=round(top_category[1], 2),
#         average_daily_emissions=round(avg_daily, 2),
#         total_activities=len(records),
#         comparison_to_previous_period=round(comparison, 2)
#     )
#
#
# def generate_trend_data(
#         db: Session,
#         company_id: int,
#         start_date: date,
#         end_date: date,
#         group_by: str,
#         scope: Optional[int] = None,
#         category: Optional[str] = None
# ) -> List[TrendData]:
#     """Generate trend data grouped by specified period"""
#
#     query = db.query(EmissionActivity).filter(
#         EmissionActivity.company_id == company_id,
#         EmissionActivity.activity_date >= start_date,
#         EmissionActivity.activity_date <= end_date
#     )
#
#     if scope:
#         query = query.filter(EmissionActivity.scope_number == scope)
#     if category:
#         query = query.filter(EmissionActivity.category.ilike(f"%{category}%"))
#
#     records = query.all()
#
#     # Group data
#     grouped_data = {}
#
#     for record in records:
#         if not record.activity_date:
#             continue
#
#         if group_by == "day":
#             period_key = record.activity_date.strftime("%Y-%m-%d")
#         elif group_by == "week":
#             period_key = record.activity_date.strftime("%Y-W%U")
#         elif group_by == "month":
#             period_key = record.activity_date.strftime("%Y-%m")
#         elif group_by == "quarter":
#             quarter = (record.activity_date.month - 1) // 3 + 1
#             period_key = f"{record.activity_date.year}-Q{quarter}"
#         elif group_by == "year":
#             period_key = str(record.activity_date.year)
#         else:
#             period_key = record.activity_date.strftime("%Y-%m")
#
#         if period_key not in grouped_data:
#             grouped_data[period_key] = {
#                 "emissions": 0,
#                 "count": 0
#             }
#
#         grouped_data[period_key]["emissions"] += record.emissions_kgco2e
#         grouped_data[period_key]["count"] += 1
#
#     # Convert to list
#     trends = []
#     for period, data in sorted(grouped_data.items()):
#         avg_emission = data["emissions"] / data["count"] if data["count"] > 0 else 0
#         trends.append(TrendData(
#             period=period,
#             emissions_kg=round(data["emissions"], 2),
#             activities_count=data["count"],
#             average_emission_per_activity=round(avg_emission, 2)
#         ))
#
#     return trends
#
#
# def generate_category_breakdown(
#         db: Session,
#         company_id: int,
#         start_date: date,
#         end_date: date,
#         scope: Optional[int] = None
# ) -> List[CategoryBreakdown]:
#     """Generate category breakdown"""
#
#     query = db.query(
#         EmissionActivity.category,
#         func.sum(EmissionActivity.emissions_kgco2e).label('total_emissions'),
#         func.count(EmissionActivity.id).label('count')
#     ).filter(
#         EmissionActivity.company_id == company_id,
#         EmissionActivity.activity_date >= start_date,
#         EmissionActivity.activity_date <= end_date
#     )
#
#     if scope:
#         query = query.filter(EmissionActivity.scope_number == scope)
#
#     results = query.group_by(EmissionActivity.category).all()
#
#     total_emissions = sum(r.total_emissions for r in results)
#
#     breakdown = []
#     for category, emissions, count in results:
#         cat = category or "Uncategorized"
#         percent = (emissions / total_emissions * 100) if total_emissions > 0 else 0
#         breakdown.append(CategoryBreakdown(
#             category=cat,
#             emissions_kg=round(emissions, 2),
#             emissions_percent=round(percent, 2),
#             activities_count=count
#         ))
#
#     # Sort by emissions descending
#     breakdown.sort(key=lambda x: x.emissions_kg, reverse=True)
#
#     return breakdown
#
#
# def get_water_metrics(db: Session, company_id: int, start_date: date, end_date: date) -> Dict[str, Any]:
#     """Get water usage metrics - replace with actual query to WaterUsage model"""
#     # Example query: db.query(WaterUsage).filter(...)
#
#     # Return sample data for now
#     return {
#         "total_usage": 4850.0,
#         "municipal_water": 3200.0,
#         "groundwater": 1650.0,
#         "rainwater": 0.0,
#         "avg_daily": 161.67,
#         "compliance_status": "Compliant"
#     }
#
#
# def get_waste_metrics(db: Session, company_id: int, start_date: date, end_date: date) -> Dict[str, Any]:
#     """Get waste management metrics - replace with actual query to WasteDisposal model"""
#     # Example query: db.query(WasteDisposal).filter(...)
#
#     # Return sample data for now
#     return {
#         "total_waste": 2200.0,
#         "recycled": 880.0,
#         "landfill": 1100.0,
#         "incinerated": 220.0,
#         "recycling_rate": 40.0,
#         "compliance_status": "Compliant"
#     }
#
#
# def get_scope3_metrics(db: Session, company_id: int, start_date: date, end_date: date) -> Dict[str, Any]:
#     """Get Scope 3 breakdown metrics"""
#
#     query = db.query(EmissionActivity).filter(
#         EmissionActivity.company_id == company_id,
#         EmissionActivity.scope_number == 3,
#         EmissionActivity.activity_date >= start_date,
#         EmissionActivity.activity_date <= end_date
#     )
#
#     records = query.all()
#
#     # Group by category
#     breakdown = {}
#     for r in records:
#         cat = r.category or "Other"
#         breakdown[cat] = breakdown.get(cat, 0) + r.emissions_kgco2e
#
#     return breakdown
#
#
# def generate_emissions_chart(data: Dict[str, Any]) -> io.BytesIO:
#     """Generate emissions breakdown pie chart"""
#
#     fig, ax = plt.subplots(figsize=(6, 4))
#
#     scopes = ['Scope 1', 'Scope 2', 'Scope 3']
#     values = [
#         data.get('scope1_emissions', 0),
#         data.get('scope2_emissions', 0),
#         data.get('scope3_emissions', 0)
#     ]
#     colors_list = ['#ef4444', '#f59e0b', '#10b981']
#
#     # Only plot if there's data
#     if sum(values) > 0:
#         ax.pie(values, labels=scopes, autopct='%1.1f%%', colors=colors_list, startangle=90)
#         ax.set_title('Emissions by Scope', fontsize=14, fontweight='bold')
#     else:
#         ax.text(0.5, 0.5, 'No emission data', ha='center', va='center')
#
#     # Save to bytes
#     buf = io.BytesIO()
#     plt.savefig(buf, format='png', dpi=150, bbox_inches='tight')
#     buf.seek(0)
#     plt.close()
#
#     return buf
#
#
# def generate_trend_chart(trends: List[Dict[str, Any]]) -> io.BytesIO:
#     """Generate emissions trend line chart"""
#
#     fig, ax = plt.subplots(figsize=(8, 4))
#
#     if trends and len(trends) > 0:
#         periods = [t['period'] for t in trends]
#         emissions = [t['emissions_kg'] for t in trends]
#
#         ax.plot(periods, emissions, marker='o', linewidth=2, color='#667eea')
#         ax.set_xlabel('Period', fontsize=10)
#         ax.set_ylabel('Emissions (kg CO2e)', fontsize=10)
#         ax.set_title('Emissions Trend', fontsize=14, fontweight='bold')
#         ax.grid(True, alpha=0.3)
#
#         # Rotate x labels if many periods
#         if len(periods) > 6:
#             plt.xticks(rotation=45, ha='right')
#     else:
#         ax.text(0.5, 0.5, 'No trend data', ha='center', va='center', transform=ax.transAxes)
#
#     buf = io.BytesIO()
#     plt.savefig(buf, format='png', dpi=150, bbox_inches='tight')
#     buf.seek(0)
#     plt.close()
#
#     return buf
#
#
# def generate_pdf_report(report_data: ComprehensiveReportData) -> io.BytesIO:
#     """Generate comprehensive PDF report"""
#
#     buffer = io.BytesIO()
#     doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=0.5 * inch, bottomMargin=0.5 * inch)
#     story = []
#     styles = getSampleStyleSheet()
#
#     # Custom styles
#     title_style = ParagraphStyle(
#         'CustomTitle',
#         parent=styles['Heading1'],
#         fontSize=24,
#         textColor=colors.HexColor('#1f2937'),
#         spaceAfter=12,
#         alignment=TA_CENTER
#     )
#
#     heading_style = ParagraphStyle(
#         'CustomHeading',
#         parent=styles['Heading2'],
#         fontSize=16,
#         textColor=colors.HexColor('#374151'),
#         spaceAfter=10,
#         spaceBefore=15
#     )
#
#     # ==================== TITLE PAGE ====================
#
#     story.append(Spacer(1, 0.5 * inch))
#     story.append(Paragraph("COMPREHENSIVE SUSTAINABILITY REPORT", title_style))
#     story.append(Spacer(1, 0.2 * inch))
#
#     # Company info
#     company = report_data.company_profile
#     company_info = f"""
#     <para align=center>
#     <b>{company.company_name}</b><br/>
#     {company.address}<br/>
#     Industry: {company.industry}<br/>
#     Reporting Officer: {company.reporting_officer}<br/>
#     Email: {company.email} | Phone: {company.phone}
#     </para>
#     """
#     story.append(Paragraph(company_info, styles['Normal']))
#     story.append(Spacer(1, 0.3 * inch))
#
#     # Reporting period
#     period_text = f"""
#     <para align=center>
#     <b>Reporting Period:</b> {report_data.summary_metrics['reporting_period_start']}
#     to {report_data.summary_metrics['reporting_period_end']}<br/>
#     <b>Generated:</b> {report_data.generated_at.strftime('%Y-%m-%d %H:%M:%S')}
#     </para>
#     """
#     story.append(Paragraph(period_text, styles['Normal']))
#     story.append(PageBreak())
#
#     # ==================== EXECUTIVE SUMMARY ====================
#
#     story.append(Paragraph("EXECUTIVE SUMMARY", heading_style))
#     story.append(Spacer(1, 0.1 * inch))
#
#     summary = report_data.summary_metrics
#
#     exec_summary = f"""
#     This comprehensive sustainability report provides an overview of environmental performance
#     for {company.company_name} during the reporting period. The report covers greenhouse gas
#     emissions (Scope 1, 2, and 3), water usage, waste management, and compliance metrics.
#     <br/><br/>
#     <b>Key Highlights:</b><br/>
#     • Total GHG Emissions: {summary.get('total_emissions_tons', 0):.2f} tons CO2e<br/>
#     • Total Water Usage: {summary.get('total_water_usage_m3', 0):.2f} m³<br/>
#     • Total Waste Generated: {summary.get('total_waste_kg', 0):.2f} kg<br/>
#     • Waste Recycling Rate: {summary.get('recycling_rate', 0):.1f}%<br/>
#     • Total Activities Tracked: {summary.get('total_activities', 0)}
#     """
#     story.append(Paragraph(exec_summary, styles['Normal']))
#     story.append(Spacer(1, 0.3 * inch))
#
#     # ==================== EMISSIONS BREAKDOWN ====================
#
#     story.append(Paragraph("GREENHOUSE GAS EMISSIONS", heading_style))
#     story.append(Spacer(1, 0.1 * inch))
#
#     # Emissions table
#     total_emissions_kg = summary.get('total_emissions_kg', 0)
#     emissions_data = [
#         ['Scope', 'Emissions (kg CO2e)', 'Emissions (tons CO2e)', 'Percentage'],
#         ['Scope 1 (Direct)',
#          f"{summary.get('scope1_emissions', 0):,.2f}",
#          f"{summary.get('scope1_emissions', 0) / 1000:.2f}",
#          f"{(summary.get('scope1_emissions', 0) / total_emissions_kg * 100 if total_emissions_kg > 0 else 0):.1f}%"],
#         ['Scope 2 (Indirect - Energy)',
#          f"{summary.get('scope2_emissions', 0):,.2f}",
#          f"{summary.get('scope2_emissions', 0) / 1000:.2f}",
#          f"{(summary.get('scope2_emissions', 0) / total_emissions_kg * 100 if total_emissions_kg > 0 else 0):.1f}%"],
#         ['Scope 3 (Value Chain)',
#          f"{summary.get('scope3_emissions', 0):,.2f}",
#          f"{summary.get('scope3_emissions', 0) / 1000:.2f}",
#          f"{(summary.get('scope3_emissions', 0) / total_emissions_kg * 100 if total_emissions_kg > 0 else 0):.1f}%"],
#         ['TOTAL',
#          f"{total_emissions_kg:,.2f}",
#          f"{summary.get('total_emissions_tons', 0):.2f}",
#          '100.0%']
#     ]
#
#     emissions_table = Table(emissions_data, colWidths=[2 * inch, 1.8 * inch, 1.8 * inch, 1.2 * inch])
#     emissions_table.setStyle(TableStyle([
#         ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#667eea')),
#         ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
#         ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
#         ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
#         ('FONTSIZE', (0, 0), (-1, 0), 11),
#         ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
#         ('BACKGROUND', (0, 1), (-1, -2), colors.white),
#         ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#f3f4f6')),
#         ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
#         ('GRID', (0, 0), (-1, -1), 1, colors.grey),
#         ('ROWBACKGROUNDS', (0, 1), (-1, -2), [colors.white, colors.HexColor('#fafafa')])
#     ]))
#
#     story.append(emissions_table)
#     story.append(Spacer(1, 0.3 * inch))
#
#     # Add emissions chart
#     try:
#         chart_buf = generate_emissions_chart(summary)
#         chart_img = Image(chart_buf, width=4 * inch, height=2.7 * inch)
#         story.append(chart_img)
#     except Exception as e:
#         story.append(Paragraph(f"<i>Chart generation error: {str(e)}</i>", styles['Normal']))
#
#     story.append(PageBreak())
#
#     # ==================== WATER USAGE ====================
#
#     story.append(Paragraph("WATER MANAGEMENT", heading_style))
#     story.append(Spacer(1, 0.1 * inch))
#
#     water_data = report_data.water_data
#
#     water_table_data = [
#         ['Metric', 'Value', 'Unit'],
#         ['Total Water Usage', f"{water_data.get('total_usage', 0):,.2f}", 'm³'],
#         ['Municipal Water', f"{water_data.get('municipal_water', 0):,.2f}", 'm³'],
#         ['Groundwater', f"{water_data.get('groundwater', 0):,.2f}", 'm³'],
#         ['Average Daily Usage', f"{water_data.get('avg_daily', 0):.2f}", 'm³/day'],
#         ['Compliance Status', water_data.get('compliance_status', 'N/A'), '-']
#     ]
#
#     water_table = Table(water_table_data, colWidths=[3 * inch, 2 * inch, 1.5 * inch])
#     water_table.setStyle(TableStyle([
#         ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3b82f6')),
#         ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
#         ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
#         ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
#         ('FONTSIZE', (0, 0), (-1, 0), 11),
#         ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
#         ('GRID', (0, 0), (-1, -1), 1, colors.grey),
#         ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#fafafa')])
#     ]))
#
#     story.append(water_table)
#     story.append(Spacer(1, 0.3 * inch))
#
#     # ==================== WASTE MANAGEMENT ====================
#
#     story.append(Paragraph("WASTE MANAGEMENT", heading_style))
#     story.append(Spacer(1, 0.1 * inch))
#
#     waste_data = report_data.waste_data
#
#     waste_table_data = [
#         ['Metric', 'Value', 'Unit'],
#         ['Total Waste Generated', f"{waste_data.get('total_waste', 0):,.2f}", 'kg'],
#         ['Recycled Waste', f"{waste_data.get('recycled', 0):,.2f}", 'kg'],
#         ['Landfill Waste', f"{waste_data.get('landfill', 0):,.2f}", 'kg'],
#         ['Incinerated Waste', f"{waste_data.get('incinerated', 0):,.2f}", 'kg'],
#         ['Recycling Rate', f"{waste_data.get('recycling_rate', 0):.1f}", '%'],
#         ['Compliance Status', waste_data.get('compliance_status', 'N/A'), '-']
#     ]
#
#     waste_table = Table(waste_table_data, colWidths=[3 * inch, 2 * inch, 1.5 * inch])
#     waste_table.setStyle(TableStyle([
#         ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#10b981')),
#         ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
#         ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
#         ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
#         ('FONTSIZE', (0, 0), (-1, 0), 11),
#         ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
#         ('GRID', (0, 0), (-1, -1), 1, colors.grey),
#         ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#fafafa')])
#     ]))
#
#     story.append(waste_table)
#     story.append(Spacer(1, 0.3 * inch))
#
#     # ==================== TRENDS ====================
#
#     if report_data.trends:
#         story.append(PageBreak())
#         story.append(Paragraph("EMISSIONS TREND ANALYSIS", heading_style))
#         story.append(Spacer(1, 0.1 * inch))
#
#         try:
#             trend_chart_buf = generate_trend_chart(report_data.trends)
#             trend_img = Image(trend_chart_buf, width=6 * inch, height=3 * inch)
#             story.append(trend_img)
#         except Exception as e:
#             story.append(Paragraph(f"<i>Trend chart generation error: {str(e)}</i>", styles['Normal']))
#
#     # ==================== RECOMMENDATIONS ====================
#
#     story.append(PageBreak())
#     story.append(Paragraph("RECOMMENDATIONS", heading_style))
#     story.append(Spacer(1, 0.1 * inch))
#
#     for idx, rec in enumerate(report_data.recommendations, 1):
#         story.append(Paragraph(f"{idx}. {rec}", styles['Normal']))
#         story.append(Spacer(1, 0.1 * inch))
#
#     # ==================== FOOTER ====================
#
#     story.append(Spacer(1, 0.5 * inch))
#     footer_text = f"""
#     <para align=center>
#     <i>This report is generated by AI-Powered Carbon Accounting Platform<br/>
#     For questions, contact {company.reporting_officer} at {company.email}</i>
#     </para>
#     """
#     story.append(Paragraph(footer_text, styles['Normal']))
#
#     # Build PDF
#     doc.build(story)
#     buffer.seek(0)
#
#     return buffer
#
#
# # ==================== EXISTING ENDPOINTS (PRESERVED) ====================
#
# @router.post("/generate", response_model=DetailedReport)
# async def generate_report(
#         config: ReportConfig,
#         current_user: User = Depends(get_current_user),
#         db: Session = Depends(get_db)
# ):
#     """Generate a comprehensive emissions report (existing endpoint)"""
#
#     # Validate date range
#     if config.date_range.start_date > config.date_range.end_date:
#         raise HTTPException(
#             status_code=400,
#             detail="Start date must be before end date"
#         )
#
#     # Calculate summary metrics
#     summary = calculate_summary_metrics(
#         db,
#         current_user.company_id,
#         config.date_range.start_date,
#         config.date_range.end_date,
#         config.scope,
#         config.category
#     )
#
#     # Generate trend data
#     trends = generate_trend_data(
#         db,
#         current_user.company_id,
#         config.date_range.start_date,
#         config.date_range.end_date,
#         config.group_by,
#         config.scope,
#         config.category
#     )
#
#     # Generate category breakdown
#     category_breakdown = generate_category_breakdown(
#         db,
#         current_user.company_id,
#         config.date_range.start_date,
#         config.date_range.end_date,
#         config.scope
#     )
#
#     # Scope breakdown
#     scope_query = db.query(
#         EmissionActivity.scope_number,
#         func.sum(EmissionActivity.emissions_kgco2e).label('total')
#     ).filter(
#         EmissionActivity.company_id == current_user.company_id,
#         EmissionActivity.activity_date >= config.date_range.start_date,
#         EmissionActivity.activity_date <= config.date_range.end_date
#     ).group_by(EmissionActivity.scope_number).all()
#
#     scope_breakdown = {f"Scope {scope}": round(total, 2) for scope, total in scope_query}
#
#     # Top emission sources
#     top_sources_query = db.query(
#         EmissionActivity.activity_name,
#         func.sum(EmissionActivity.emissions_kgco2e).label('total'),
#         func.count(EmissionActivity.id).label('count')
#     ).filter(
#         EmissionActivity.company_id == current_user.company_id,
#         EmissionActivity.activity_date >= config.date_range.start_date,
#         EmissionActivity.activity_date <= config.date_range.end_date
#     ).group_by(EmissionActivity.activity_name).order_by(func.sum(EmissionActivity.emissions_kgco2e).desc()).limit(
#         10).all()
#
#     top_sources = [
#         {
#             "activity": name,
#             "total_emissions_kg": round(total, 2),
#             "occurrences": count,
#             "average_per_occurrence": round(total / count, 2) if count > 0 else 0
#         }
#         for name, total, count in top_sources_query
#     ]
#
#     # Goals progress - skip if Goal model not available
#     try:
#         from ..models import Goal
#         goals = db.query(Goal).filter(Goal.user_id == current_user.id).all()
#         goals_progress = [
#             {
#                 "goal_title": goal.title,
#                 "progress_percent": round(goal.progress_percent, 2),
#                 "status": goal.status,
#                 "target_year": goal.target_year
#             }
#             for goal in goals
#         ]
#     except (ImportError, AttributeError):
#         goals_progress = []
#
#     # Recommendations summary
#     recommendations_summary = {
#         "high_priority_actions": 3,
#         "potential_reduction_kg": round(summary.total_emissions_kg * 0.25, 2),
#         "estimated_cost_savings": round(summary.total_emissions_kg * 0.05, 2)
#     }
#
#     return DetailedReport(
#         summary=summary,
#         trends=trends,
#         category_breakdown=category_breakdown,
#         scope_breakdown=scope_breakdown,
#         top_emission_sources=top_sources,
#         goals_progress=goals_progress,
#         recommendations_summary=recommendations_summary
#     )
#
#
# @router.post("/export/csv")
# async def export_report_csv(
#         config: ReportConfig,
#         current_user: User = Depends(get_current_user),
#         db: Session = Depends(get_db)
# ):
#     """Export report as CSV"""
#
#     # Generate report data
#     report = await generate_report(config, current_user, db)
#
#     # Create DataFrame
#     data = []
#     for trend in report.trends:
#         data.append({
#             "Period": trend.period,
#             "Emissions (kg)": trend.emissions_kg,
#             "Activities Count": trend.activities_count,
#             "Avg per Activity": trend.average_emission_per_activity
#         })
#
#     df = pd.DataFrame(data)
#
#     # Convert to CSV
#     stream = io.StringIO()
#     df.to_csv(stream, index=False)
#
#     return Response(
#         content=stream.getvalue(),
#         media_type="text/csv",
#         headers={
#             "Content-Disposition": f"attachment; filename=emissions_report_{datetime.now().strftime('%Y%m%d')}.csv"
#         }
#     )
#
#
# @router.post("/export/excel")
# async def export_report_excel(
#         config: ReportConfig,
#         current_user: User = Depends(get_current_user),
#         db: Session = Depends(get_db)
# ):
#     """Export comprehensive report as Excel with multiple sheets"""
#
#     # Generate report data
#     report = await generate_report(config, current_user, db)
#
#     # Create Excel file in memory
#     output = io.BytesIO()
#
#     with pd.ExcelWriter(output, engine='openpyxl') as writer:
#         # Summary sheet
#         summary_data = {
#             "Metric": [
#                 "Total Emissions (kg)",
#                 "Total Emissions (tons)",
#                 "Scope 1 Emissions",
#                 "Scope 2 Emissions",
#                 "Scope 3 Emissions",
#                 "Top Category",
#                 "Top Category Emissions",
#                 "Average Daily Emissions",
#                 "Total Activities",
#                 "Comparison to Previous Period (%)"
#             ],
#             "Value": [
#                 report.summary.total_emissions_kg,
#                 report.summary.total_emissions_tons,
#                 report.summary.scope1_emissions,
#                 report.summary.scope2_emissions,
#                 report.summary.scope3_emissions,
#                 report.summary.top_category,
#                 report.summary.top_category_emissions,
#                 report.summary.average_daily_emissions,
#                 report.summary.total_activities,
#                 report.summary.comparison_to_previous_period
#             ]
#         }
#         pd.DataFrame(summary_data).to_excel(writer, sheet_name='Summary', index=False)
#
#         # Trends sheet
#         trends_data = [{
#             "Period": t.period,
#             "Emissions (kg)": t.emissions_kg,
#             "Activities": t.activities_count,
#             "Avg per Activity": t.average_emission_per_activity
#         } for t in report.trends]
#         pd.DataFrame(trends_data).to_excel(writer, sheet_name='Trends', index=False)
#
#         # Category breakdown sheet
#         category_data = [{
#             "Category": c.category,
#             "Emissions (kg)": c.emissions_kg,
#             "Percentage": c.emissions_percent,
#             "Activities": c.activities_count
#         } for c in report.category_breakdown]
#         pd.DataFrame(category_data).to_excel(writer, sheet_name='Categories', index=False)
#
#         # Top sources sheet
#         pd.DataFrame(report.top_emission_sources).to_excel(writer, sheet_name='Top Sources', index=False)
#
#         # Goals progress sheet
#         if report.goals_progress:
#             pd.DataFrame(report.goals_progress).to_excel(writer, sheet_name='Goals', index=False)
#
#     output.seek(0)
#
#     return StreamingResponse(
#         io.BytesIO(output.getvalue()),
#         media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
#         headers={
#             "Content-Disposition": f"attachment; filename=emissions_report_{datetime.now().strftime('%Y%m%d')}.xlsx"
#         }
#     )
#
#
# @router.get("/dashboard")
# async def get_dashboard_data(
#         current_user: User = Depends(get_current_user),
#         db: Session = Depends(get_db)
# ):
#     """Get dashboard overview data"""
#
#     # Current month data
#     current_month_start = datetime.now().replace(day=1).date()
#     current_month_end = date.today()
#
#     # Last 30 days
#     last_30_days_start = date.today() - timedelta(days=30)
#
#     # Last 12 months
#     last_12_months_start = date.today() - timedelta(days=365)
#
#     # Current month summary
#     current_month_summary = calculate_summary_metrics(
#         db, current_user.company_id, current_month_start, current_month_end
#     )
#
#     # Last 30 days trend
#     last_30_days_trend = generate_trend_data(
#         db, current_user.company_id, last_30_days_start, date.today(), "day"
#     )
#
#     # Last 12 months trend
#     last_12_months_trend = generate_trend_data(
#         db, current_user.company_id, last_12_months_start, date.today(), "month"
#     )
#
#     # Category breakdown (last 30 days)
#     category_breakdown = generate_category_breakdown(
#         db, current_user.company_id, last_30_days_start, date.today()
#     )
#
#     # Active goals - skip if Goal model not available
#     try:
#         from ..models import Goal
#         active_goals = db.query(Goal).filter(
#             Goal.user_id == current_user.id,
#             Goal.status.in_(["on_track", "at_risk"])
#         ).all()
#
#         goals_summary = [
#             {
#                 "title": goal.title,
#                 "progress": round(goal.progress_percent, 1),
#                 "status": goal.status,
#                 "target_year": goal.target_year
#             }
#             for goal in active_goals[:3]
#         ]
#     except (ImportError, AttributeError):
#         active_goals = []
#         goals_summary = []
#
#     # Recent activities
#     recent_activities = db.query(EmissionActivity).filter(
#         EmissionActivity.company_id == current_user.company_id
#     ).order_by(EmissionActivity.activity_date.desc()).limit(10).all()
#
#     recent_list = [
#         {
#             "id": r.id,
#             "date": r.activity_date.isoformat() if r.activity_date else None,
#             "activity": r.activity_name,
#             "emissions_kg": round(r.emissions_kgco2e, 2),
#             "category": r.category,
#             "scope": r.scope_number
#         }
#         for r in recent_activities
#     ]
#
#     return {
#         "current_month": {
#             "total_emissions_kg": current_month_summary.total_emissions_kg,
#             "comparison_percent": current_month_summary.comparison_to_previous_period,
#             "activities_count": current_month_summary.total_activities,
#             "average_daily": current_month_summary.average_daily_emissions
#         },
#         "last_30_days_trend": [
#             {
#                 "date": t.period,
#                 "emissions": t.emissions_kg
#             }
#             for t in last_30_days_trend
#         ],
#         "last_12_months_trend": [
#             {
#                 "month": t.period,
#                 "emissions": t.emissions_kg
#             }
#             for t in last_12_months_trend
#         ],
#         "category_breakdown": [
#             {
#                 "category": c.category,
#                 "emissions": c.emissions_kg,
#                 "percent": c.emissions_percent
#             }
#             for c in category_breakdown[:5]
#         ],
#         "active_goals": goals_summary,
#         "recent_activities": recent_list,
#         "quick_stats": {
#             "total_lifetime_emissions": db.query(func.sum(EmissionActivity.emissions_kgco2e)).filter(
#                 EmissionActivity.company_id == current_user.company_id
#             ).scalar() or 0,
#             "total_activities_tracked": db.query(func.count(EmissionActivity.id)).filter(
#                 EmissionActivity.company_id == current_user.company_id
#             ).scalar() or 0,
#             "active_goals_count": len(active_goals),
#             "days_tracking": (date.today() - current_user.created_at.date()).days if current_user.created_at else 0
#         }
#     }
#
#
# @router.get("/comparison/{year}")
# async def get_year_comparison(
#         year: int,
#         current_user: User = Depends(get_current_user),
#         db: Session = Depends(get_db)
# ):
#     """Compare emissions across years"""
#
#     current_year = datetime.now().year
#
#     if year > current_year:
#         raise HTTPException(status_code=400, detail="Cannot compare future years")
#
#     years_to_compare = [year - 1, year, year + 1] if year < current_year else [year - 2, year - 1, year]
#     years_to_compare = [y for y in years_to_compare if y <= current_year and y >= 2020]
#
#     comparison_data = []
#
#     for y in years_to_compare:
#         start = date(y, 1, 1)
#         end = date(y, 12, 31) if y < current_year else date.today()
#
#         summary = calculate_summary_metrics(db, current_user.company_id, start, end)
#
#         comparison_data.append({
#             "year": y,
#             "total_emissions_kg": summary.total_emissions_kg,
#             "scope1": summary.scope1_emissions,
#             "scope2": summary.scope2_emissions,
#             "scope3": summary.scope3_emissions,
#             "activities": summary.total_activities
#         })
#
#     return {
#         "comparison": comparison_data,
#         "analysis": {
#             "best_year": min(comparison_data, key=lambda x: x["total_emissions_kg"])[
#                 "year"] if comparison_data else None,
#             "worst_year": max(comparison_data, key=lambda x: x["total_emissions_kg"])[
#                 "year"] if comparison_data else None,
#             "average_emissions": sum(d["total_emissions_kg"] for d in comparison_data) / len(
#                 comparison_data) if comparison_data else 0
#         }
#     }
#
#
# # ==================== NEW COMPREHENSIVE REPORT ENDPOINTS ====================
#
# @router.post("/generate-comprehensive-pdf")
# async def generate_comprehensive_pdf_report(
#         config: ReportConfig,
#         current_user: User = Depends(get_current_user),
#         db: Session = Depends(get_db)
# ):
#     """Generate comprehensive PDF report with all metrics"""
#
#     try:
#         print("🔹 Step 1: Getting company info...")
#         # Get company info
#         company = db.query(Company).filter(Company.id == current_user.company_id).first()
#         print(f"   Company found: {company is not None}")
#
#         print("🔹 Step 2: Creating company profile...")
#         company_profile = CompanyProfile(
#             company_name=getattr(company, 'name', 'Your Company') if company else "Your Company",
#             address=getattr(company, 'address', None) or "Address not set",
#             industry=getattr(company, 'industry', None) or "Industry not set",
#             reporting_officer=getattr(current_user, 'full_name', current_user.email),
#             email=current_user.email,
#             phone=getattr(company, 'phone', None) or "N/A",
#             website=getattr(company, 'website', None)
#         )
#         print(f"   Profile created: {company_profile.company_name}")
#
#         print("🔹 Step 3: Calculating summary metrics...")
#         # Calculate all metrics
#         summary = calculate_summary_metrics(
#             db,
#             current_user.company_id,
#             config.date_range.start_date,
#             config.date_range.end_date
#         )
#         print(f"   Summary calculated: {summary.total_emissions_kg} kg CO2e")
#
#         print("🔹 Step 4: Getting water/waste/scope3 metrics...")
#         # Get water, waste, scope3 metrics
#         water_data = get_water_metrics(db, current_user.company_id, config.date_range.start_date,
#                                        config.date_range.end_date)
#         waste_data = get_waste_metrics(db, current_user.company_id, config.date_range.start_date,
#                                        config.date_range.end_date)
#         scope3_data = get_scope3_metrics(db, current_user.company_id, config.date_range.start_date,
#                                          config.date_range.end_date)
#         print("   Metrics retrieved")
#
#         print("🔹 Step 5: Generating trends...")
#         # Get trends
#         trends_obj = generate_trend_data(
#             db, current_user.company_id, config.date_range.start_date, config.date_range.end_date, config.group_by
#         )
#         trends = [{"period": t.period, "emissions_kg": t.emissions_kg} for t in trends_obj]
#         print(f"   Trends generated: {len(trends)} periods")
#
#         print("🔹 Step 6: Building summary metrics dict...")
#         # Summary metrics dict
#         summary_metrics = {
#             "reporting_period_start": config.date_range.start_date.strftime("%Y-%m-%d"),
#             "reporting_period_end": config.date_range.end_date.strftime("%Y-%m-%d"),
#             "total_emissions_kg": summary.total_emissions_kg,
#             "total_emissions_tons": summary.total_emissions_tons,
#             "scope1_emissions": summary.scope1_emissions,
#             "scope2_emissions": summary.scope2_emissions,
#             "scope3_emissions": summary.scope3_emissions,
#             "total_water_usage_m3": water_data.get('total_usage', 0),
#             "total_waste_kg": waste_data.get('total_waste', 0),
#             "recycled_waste_kg": waste_data.get('recycled', 0),
#             "recycling_rate": waste_data.get('recycling_rate', 0),
#             "total_activities": summary.total_activities,
#             "reporting_period_days": (config.date_range.end_date - config.date_range.start_date).days + 1
#         }
#
#         print("🔹 Step 7: Building emissions data...")
#         # Emissions data for charts
#         emissions_data = {
#             "scope1_emissions": summary.scope1_emissions,
#             "scope2_emissions": summary.scope2_emissions,
#             "scope3_emissions": summary.scope3_emissions,
#             "total_emissions_kg": summary.total_emissions_kg
#         }
#
#         print("🔹 Step 8: Creating recommendations...")
#         # Recommendations
#         recommendations = [
#             "Implement energy-efficient lighting systems to reduce Scope 2 emissions by an estimated 15%.",
#             "Increase waste recycling rate to 50% through improved segregation and employee training.",
#             "Consider renewable energy procurement to offset Scope 2 emissions.",
#             "Optimize water usage in manufacturing processes to reduce consumption by 10%.",
#             "Engage with suppliers to reduce Scope 3 emissions in the value chain.",
#             "Set science-based targets aligned with 1.5°C pathway for long-term emission reduction."
#         ]
#
#         print("🔹 Step 9: Creating ComprehensiveReportData object...")
#         # Create comprehensive report data
#         report_data = ComprehensiveReportData(
#             company_profile=company_profile,
#             summary_metrics=summary_metrics,
#             emissions_data=emissions_data,
#             water_data=water_data,
#             waste_data=waste_data,
#             scope3_data=scope3_data,
#             trends=trends,
#             recommendations=recommendations,
#             generated_at=datetime.now()
#         )
#         print("   Report data object created")
#
#         print("🔹 Step 10: Generating PDF...")
#         # Generate PDF
#         pdf_buffer = generate_pdf_report(report_data)
#         print("   PDF generated successfully")
#
#         filename = f"sustainability_report_{company_profile.company_name.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d')}.pdf"
#
#         print(f"✅ PDF ready: {filename}")
#         return StreamingResponse(
#             pdf_buffer,
#             media_type="application/pdf",
#             headers={"Content-Disposition": f"attachment; filename={filename}"}
#         )
#
#     except Exception as e:
#         print(f"❌ ERROR in PDF generation: {type(e).__name__}")
#         print(f"❌ Error message: {str(e)}")
#         import traceback
#         print("❌ Full traceback:")
#         traceback.print_exc()
#         raise HTTPException(status_code=500, detail=f"Error generating PDF report: {str(e)}")
#
#
# @router.post("/generate-comprehensive-excel")
# async def generate_comprehensive_excel_report(
#         config: ReportConfig,
#         current_user: User = Depends(get_current_user),
#         db: Session = Depends(get_db)
# ):
#     """Generate comprehensive Excel report with all metrics"""
#
#     try:
#         # Get company info
#         company = db.query(Company).filter(Company.id == current_user.company_id).first()
#
#         # Calculate all metrics
#         summary = calculate_summary_metrics(
#             db,
#             current_user.company_id,
#             config.date_range.start_date,
#             config.date_range.end_date
#         )
#
#         water_data = get_water_metrics(db, current_user.company_id, config.date_range.start_date,
#                                        config.date_range.end_date)
#         waste_data = get_waste_metrics(db, current_user.company_id, config.date_range.start_date,
#                                        config.date_range.end_date)
#         scope3_data = get_scope3_metrics(db, current_user.company_id, config.date_range.start_date,
#                                          config.date_range.end_date)
#
#         trends_obj = generate_trend_data(
#             db, current_user.company_id, config.date_range.start_date, config.date_range.end_date, config.group_by
#         )
#
#         # Create Excel file in memory
#         output = io.BytesIO()
#
#         with pd.ExcelWriter(output, engine='openpyxl') as writer:
#
#             # Summary sheet
#             summary_data = {
#                 'Metric': [
#                     'Reporting Period Start',
#                     'Reporting Period End',
#                     'Total Emissions (kg CO2e)',
#                     'Total Emissions (tons CO2e)',
#                     'Scope 1 Emissions',
#                     'Scope 2 Emissions',
#                     'Scope 3 Emissions',
#                     'Total Water Usage (m³)',
#                     'Total Waste (kg)',
#                     'Recycled Waste (kg)',
#                     'Recycling Rate (%)',
#                     'Total Activities Tracked'
#                 ],
#                 'Value': [
#                     config.date_range.start_date.strftime("%Y-%m-%d"),
#                     config.date_range.end_date.strftime("%Y-%m-%d"),
#                     summary.total_emissions_kg,
#                     summary.total_emissions_tons,
#                     summary.scope1_emissions,
#                     summary.scope2_emissions,
#                     summary.scope3_emissions,
#                     water_data.get('total_usage', 0),
#                     waste_data.get('total_waste', 0),
#                     waste_data.get('recycled', 0),
#                     waste_data.get('recycling_rate', 0),
#                     summary.total_activities
#                 ]
#             }
#             pd.DataFrame(summary_data).to_excel(writer, sheet_name='Summary', index=False)
#
#             # Emissions breakdown
#             total_kg = summary.total_emissions_kg if summary.total_emissions_kg > 0 else 1
#             emissions_breakdown = {
#                 'Scope': ['Scope 1', 'Scope 2', 'Scope 3', 'TOTAL'],
#                 'Emissions (kg CO2e)': [
#                     summary.scope1_emissions,
#                     summary.scope2_emissions,
#                     summary.scope3_emissions,
#                     summary.total_emissions_kg
#                 ],
#                 'Emissions (tons CO2e)': [
#                     summary.scope1_emissions / 1000,
#                     summary.scope2_emissions / 1000,
#                     summary.scope3_emissions / 1000,
#                     summary.total_emissions_tons
#                 ],
#                 'Percentage (%)': [
#                     round(summary.scope1_emissions / total_kg * 100, 1),
#                     round(summary.scope2_emissions / total_kg * 100, 1),
#                     round(summary.scope3_emissions / total_kg * 100, 1),
#                     100.0
#                 ]
#             }
#             pd.DataFrame(emissions_breakdown).to_excel(writer, sheet_name='Emissions Breakdown', index=False)
#
#             # Water usage
#             water_usage = {
#                 'Source': ['Municipal Water', 'Groundwater', 'Rainwater', 'TOTAL'],
#                 'Usage (m³)': [
#                     water_data.get('municipal_water', 0),
#                     water_data.get('groundwater', 0),
#                     water_data.get('rainwater', 0),
#                     water_data.get('total_usage', 0)
#                 ]
#             }
#             pd.DataFrame(water_usage).to_excel(writer, sheet_name='Water Usage', index=False)
#
#             # Waste management
#             waste_management = {
#                 'Disposal Method': ['Recycled', 'Landfill', 'Incinerated', 'TOTAL'],
#                 'Weight (kg)': [
#                     waste_data.get('recycled', 0),
#                     waste_data.get('landfill', 0),
#                     waste_data.get('incinerated', 0),
#                     waste_data.get('total_waste', 0)
#                 ]
#             }
#             pd.DataFrame(waste_management).to_excel(writer, sheet_name='Waste Management', index=False)
#
#             # Trends
#             trends_data = [{
#                 'Period': t.period,
#                 'Emissions (kg CO2e)': t.emissions_kg,
#                 'Activities': t.activities_count
#             } for t in trends_obj]
#             if trends_data:
#                 pd.DataFrame(trends_data).to_excel(writer, sheet_name='Trends', index=False)
#
#             # Company info
#             company_info = {
#                 'Field': ['Company Name', 'Reporting Officer', 'Email', 'Report Generated'],
#                 'Value': [
#                     getattr(company, 'name', 'Your Company') if company else "Your Company",
#                     getattr(current_user, 'full_name', current_user.email),
#                     current_user.email,
#                     datetime.now().strftime('%Y-%m-%d %H:%M:%S')
#                 ]
#             }
#             pd.DataFrame(company_info).to_excel(writer, sheet_name='Company Info', index=False)
#
#         output.seek(0)
#
#         filename = f"sustainability_report_{datetime.now().strftime('%Y%m%d')}.xlsx"
#
#         return StreamingResponse(
#             io.BytesIO(output.getvalue()),
#             media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
#             headers={"Content-Disposition": f"attachment; filename={filename}"}
#         )
#
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Error generating Excel report: {str(e)}")
#
#
# @router.get("/company-profile")
# async def get_company_profile(
#         current_user: User = Depends(get_current_user),
#         db: Session = Depends(get_db)
# ):
#     """Get company profile"""
#
#     try:
#         company = db.query(Company).filter(Company.id == current_user.company_id).first()
#
#         if not company:
#             # Return default profile if company not found
#             profile = CompanyProfile(
#                 company_name="Your Company",
#                 address="Company Address",
#                 industry="Industry",
#                 reporting_officer=getattr(current_user, 'full_name', current_user.email),
#                 email=current_user.email,
#                 phone="N/A",
#                 website=None
#             )
#             return profile
#
#         profile = CompanyProfile(
#             company_name=getattr(company, 'name', 'Your Company'),
#             address=getattr(company, 'address', 'Address not set'),
#             industry=getattr(company, 'industry', 'Industry not set'),
#             reporting_officer=getattr(current_user, 'full_name', current_user.email),
#             email=current_user.email,
#             phone=getattr(company, 'phone', 'N/A'),
#             website=getattr(company, 'website', None)
#         )
#
#         return profile
#
#     except Exception as e:
#         # Fallback to default profile on any error
#         return CompanyProfile(
#             company_name="Your Company",
#             address="Company Address",
#             industry="Industry",
#             reporting_officer=getattr(current_user, 'full_name',
#                                       current_user.email) if current_user else "Reporting Officer",
#             email=current_user.email if current_user else "email@company.com",
#             phone="N/A",
#             website=None
#         )
#
#


# app/routers/reports.py
"""
API endpoints for report generation system
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date
from pydantic import BaseModel

from app.database import get_db
from app.routers.auth import get_current_user
from app.models import User, GeneratedReport, ReportTemplate
from app.services.report_generator import ReportGeneratorService
from app.services.pdf_generator import PDFReportGenerator

router = APIRouter(
    prefix="/api/v1/reports",
    tags=["Reports"]
)


# Pydantic models for request/response

class CreateReportRequest(BaseModel):
    template_id: int
    title: str
    report_type: str  # CDP, BRSR, GRI, CUSTOM
    period_start: date
    period_end: date
    branding_settings: Optional[dict] = None
    selected_sections: Optional[dict] = None


class UpdateSectionRequest(BaseModel):
    content: dict
    notes: Optional[str] = None


class ReportResponse(BaseModel):
    id: int
    title: str
    report_type: str
    status: str
    reporting_period_start: date
    reporting_period_end: date
    generated_at: Optional[datetime]
    file_url: Optional[str]

    class Config:
        from_attributes = True


class TemplateResponse(BaseModel):
    id: int
    name: str
    type: str
    version: Optional[str]
    description: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True


# ENDPOINTS

@router.get("/templates", response_model=List[TemplateResponse])
async def list_templates(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Get all available report templates
    """
    templates = db.query(ReportTemplate).filter(
        ReportTemplate.is_active == True
    ).all()

    return templates


@router.get("/templates/{template_id}")
async def get_template_details(
        template_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Get detailed template structure
    """
    template = db.query(ReportTemplate).filter(
        ReportTemplate.id == template_id,
        ReportTemplate.is_active == True
    ).first()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )

    return template.to_dict()


@router.post("/create", response_model=ReportResponse)
async def create_report(
        request: CreateReportRequest,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Create a new report from template
    """
    if not current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must be associated with a company"
        )

    try:
        service = ReportGeneratorService(db)
        report = service.create_report(
            company_id=current_user.company_id,
            user_id=current_user.id,
            template_id=request.template_id,
            title=request.title,
            report_type=request.report_type,
            period_start=request.period_start,
            period_end=request.period_end,
            branding_settings=request.branding_settings,
            selected_sections=request.selected_sections
        )

        # Auto-populate with data
        service.populate_report_data(
            report_id=report['id'],
            company_id=current_user.company_id,
            period_start=request.period_start,
            period_end=request.period_end
        )

        return report

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create report: {str(e)}"
        )


@router.get("/", response_model=List[ReportResponse])
async def list_reports(
        report_status: Optional[str] = None,
        report_type: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    List all reports for current user's company
    """
    if not current_user.company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must be associated with a company"
        )

    query = db.query(GeneratedReport).filter(
        GeneratedReport.company_id == current_user.company_id
    )

    if report_status:
        query = query.filter(GeneratedReport.status == report_status)

    if report_type:
        query = query.filter(GeneratedReport.report_type == report_type)

    reports = query.order_by(
        GeneratedReport.generated_at.desc()
    ).offset(offset).limit(limit).all()

    return reports


@router.get("/{report_id}")
async def get_report(
        report_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Get complete report structure with all sections
    """
    report = db.query(GeneratedReport).filter(
        GeneratedReport.id == report_id,
        GeneratedReport.company_id == current_user.company_id
    ).first()

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )

    service = ReportGeneratorService(db)
    structure = service.get_report_structure(report_id)

    return structure


@router.put("/{report_id}/sections/{section_id}")
async def update_section(
        report_id: int,
        section_id: int,
        request: UpdateSectionRequest,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Update content of a specific section
    """
    # Verify report belongs to user's company
    report = db.query(GeneratedReport).filter(
        GeneratedReport.id == report_id,
        GeneratedReport.company_id == current_user.company_id
    ).first()

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )

    if report.status == "final":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot modify finalized report"
        )

    try:
        service = ReportGeneratorService(db)
        section = service.update_section_content(
            section_id=section_id,
            content=request.content,
            user_id=current_user.id
        )

        return section

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/{report_id}/finalize")
async def finalize_report(
        report_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Mark report as final (no more edits allowed)
    """
    report = db.query(GeneratedReport).filter(
        GeneratedReport.id == report_id,
        GeneratedReport.company_id == current_user.company_id
    ).first()

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )

    try:
        service = ReportGeneratorService(db)
        updated_report = service.finalize_report(
            report_id=report_id,
            user_id=current_user.id
        )

        return updated_report

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/{report_id}/export/{format}")
async def export_report(
        report_id: int,
        format: str,  # pdf, docx, xlsx, pptx
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Export report in specified format
    """
    if format not in ['pdf', 'docx', 'xlsx', 'pptx']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid format. Supported: pdf, docx, xlsx, pptx"
        )

    report = db.query(GeneratedReport).filter(
        GeneratedReport.id == report_id,
        GeneratedReport.company_id == current_user.company_id
    ).first()

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )

    try:
        # Get report structure
        service = ReportGeneratorService(db)
        report_data = service.get_report_structure(report_id)

        # Generate PDF (or other formats)
        if format == 'pdf':
            output_path = f"/tmp/report_{report_id}.pdf"
            pdf_generator = PDFReportGenerator(
                branding=report_data['report'].get('branding_settings')
            )
            pdf_path = pdf_generator.generate_report_pdf(report_data, output_path)

            # TODO: Upload to S3/cloud storage and return URL
            # For now, return local path

            # Update report with file info
            report.file_url = pdf_path
            report.file_format = format
            db.commit()

            return {
                "success": True,
                "file_url": pdf_path,
                "format": format,
                "message": "Report exported successfully"
            }

        else:
            # TODO: Implement Word, Excel, PowerPoint export
            raise HTTPException(
                status_code=status.HTTP_501_NOT_IMPLEMENTED,
                detail=f"{format} export not yet implemented"
            )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to export report: {str(e)}"
        )


@router.post("/{report_id}/duplicate")
async def duplicate_report(
        report_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Create a new version of existing report
    """
    report = db.query(GeneratedReport).filter(
        GeneratedReport.id == report_id,
        GeneratedReport.company_id == current_user.company_id
    ).first()

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )

    try:
        service = ReportGeneratorService(db)
        new_report = service.create_new_version(
            report_id=report_id,
            user_id=current_user.id
        )

        return new_report

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to duplicate report: {str(e)}"
        )


@router.delete("/{report_id}")
async def delete_report(
        report_id: int,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Delete a report (soft delete - archive)
    """
    report = db.query(GeneratedReport).filter(
        GeneratedReport.id == report_id,
        GeneratedReport.company_id == current_user.company_id
    ).first()

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )

    try:
        # Soft delete - change status to archived
        report.status = "archived"
        db.commit()

        return {"success": True, "message": "Report archived successfully"}

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete report: {str(e)}"
        )


@router.get("/{report_id}/audit-log")
async def get_audit_log(
        report_id: int,
        limit: int = 50,
        offset: int = 0,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """
    Get audit trail for a report
    """
    from app.models import ReportAuditLog

    report = db.query(GeneratedReport).filter(
        GeneratedReport.id == report_id,
        GeneratedReport.company_id == current_user.company_id
    ).first()

    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )

    logs = db.query(ReportAuditLog).filter(
        ReportAuditLog.report_id == report_id
    ).order_by(
        ReportAuditLog.timestamp.desc()
    ).offset(offset).limit(limit).all()

    return [log.to_dict() for log in logs]