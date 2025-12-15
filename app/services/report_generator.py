# app/services/report_generator.py
"""
Core Report Generation Service
Handles creation, customization, and export of reports
"""

from sqlalchemy.orm import Session
from typing import Dict, List, Optional, Any
from datetime import datetime, date
import json
from pathlib import Path


class ReportGeneratorService:
    """
    Main service for generating professional reports
    """

    def __init__(self, db: Session):
        self.db = db

    def create_report(
            self,
            company_id: int,
            user_id: int,
            template_id: int,
            title: str,
            report_type: str,
            period_start: date,
            period_end: date,
            branding_settings: Optional[Dict] = None,
            selected_sections: Optional[Dict] = None
    ) -> Dict:
        """
        Create a new report from template
        """
        from app.models import GeneratedReport, ReportTemplate, ReportSection

        # Get template
        template = self.db.query(ReportTemplate).filter(
            ReportTemplate.id == template_id
        ).first()

        if not template:
            raise ValueError(f"Template {template_id} not found")

        # Create report record
        report = GeneratedReport(
            company_id=company_id,
            user_id=user_id,
            template_id=template_id,
            title=title,
            report_type=report_type,
            reporting_period_start=period_start,
            reporting_period_end=period_end,
            status="draft",
            branding_settings=branding_settings or template.default_settings,
            selected_sections=selected_sections or self._get_default_sections(template),
            version=1
        )

        self.db.add(report)
        self.db.flush()

        # Create sections from template
        sections_config = template.sections_config.get('sections', [])
        for section_def in sections_config:
            if selected_sections and section_def['code'] not in selected_sections.get('included', []):
                continue

            section = ReportSection(
                report_id=report.id,
                section_name=section_def['name'],
                section_code=section_def['code'],
                section_order=section_def['order'],
                content={},
                is_included=True,
                is_completed=False
            )
            self.db.add(section)

        self.db.commit()
        self.db.refresh(report)

        # Log creation
        self._log_audit(report.id, user_id, "created", f"Report created: {title}")

        return report.to_dict()

    def populate_report_data(
            self,
            report_id: int,
            company_id: int,
            period_start: date,
            period_end: date
    ) -> Dict:
        """
        Auto-populate report with data from database
        """
        from app.models import GeneratedReport, EmissionActivity, WasteDisposal, EnergyConsumption, WaterUsage
        from app.services.lifecycle_aggregator import LifecycleAggregator

        report = self.db.query(GeneratedReport).filter(
            GeneratedReport.id == report_id,
            GeneratedReport.company_id == company_id
        ).first()

        if not report:
            raise ValueError(f"Report {report_id} not found")

        # Get all relevant data
        data = {}

        # 1. Emissions data
        emissions = self.db.query(EmissionActivity).filter(
            EmissionActivity.company_id == company_id,
            EmissionActivity.activity_date >= period_start,
            EmissionActivity.activity_date <= period_end
        ).all()

        data['emissions'] = {
            'total_activities': len(emissions),
            'scope1': sum(e.emissions_kgco2e for e in emissions if e.scope_number == 1),
            'scope2': sum(e.emissions_kgco2e for e in emissions if e.scope_number == 2),
            'scope3': sum(e.emissions_kgco2e for e in emissions if e.scope_number == 3),
            'total': sum(e.emissions_kgco2e for e in emissions),
            'activities_by_category': self._group_by_category(emissions)
        }

        # 2. Lifecycle data
        lifecycle_agg = LifecycleAggregator(self.db)
        lifecycle_data = lifecycle_agg.get_lifecycle_overview(
            company_id=company_id,
            start_date=datetime.combine(period_start, datetime.min.time()),
            end_date=datetime.combine(period_end, datetime.max.time())
        )
        data['lifecycle'] = lifecycle_data

        # 3. Energy data
        energy_records = self.db.query(EnergyConsumption).filter(
            EnergyConsumption.company_id == company_id,
            EnergyConsumption.consumption_date >= period_start,
            EnergyConsumption.consumption_date <= period_end
        ).all()

        data['energy'] = {
            'total_consumption': sum(e.consumption_amount for e in energy_records),
            'by_source': self._group_energy_by_source(energy_records),
            'renewable_percentage': self._calculate_renewable_percentage(energy_records)
        }

        # 4. Water data
        water_records = self.db.query(WaterUsage).filter(
            WaterUsage.company_id == company_id,
            WaterUsage.usage_date >= period_start,
            WaterUsage.usage_date <= period_end
        ).all()

        data['water'] = {
            'total_withdrawal': sum(w.withdrawal_amount for w in water_records),
            'by_source': self._group_water_by_source(water_records)
        }

        # 5. Waste data
        waste_records = self.db.query(WasteDisposal).filter(
            WasteDisposal.company_id == company_id,
            WasteDisposal.created_at >= datetime.combine(period_start, datetime.min.time()),
            WasteDisposal.created_at <= datetime.combine(period_end, datetime.max.time())
        ).all()

        data['waste'] = {
            'total_quantity': sum(w.quantity for w in waste_records),
            'by_type': self._group_waste_by_type(waste_records),
            'by_disposal_method': self._group_waste_by_disposal(waste_records),
            'recycling_rate': self._calculate_recycling_rate(waste_records)
        }

        # Store data in report's custom_data field
        report.custom_data = data
        self.db.commit()

        return data

    def get_report_structure(self, report_id: int) -> Dict:
        """
        Get complete report structure with all sections
        """
        from app.models import GeneratedReport

        report = self.db.query(GeneratedReport).filter(
            GeneratedReport.id == report_id
        ).first()

        if not report:
            raise ValueError(f"Report {report_id} not found")

        sections = []
        for section in report.sections:
            sections.append({
                'id': section.id,
                'name': section.section_name,
                'code': section.section_code,
                'order': section.section_order,
                'is_included': section.is_included,
                'is_completed': section.is_completed,
                'content': section.content,
                'notes': section.notes
            })

        return {
            'report': report.to_dict(),
            'sections': sorted(sections, key=lambda x: x['order']),
            'data': report.custom_data or {}
        }

    def update_section_content(
            self,
            section_id: int,
            content: Dict,
            user_id: int
    ) -> Dict:
        """
        Update content of a specific section
        """
        from app.models import ReportSection

        section = self.db.query(ReportSection).filter(
            ReportSection.id == section_id
        ).first()

        if not section:
            raise ValueError(f"Section {section_id} not found")

        old_content = section.content
        section.content = content
        section.is_completed = content.get('is_completed', False)
        section.updated_at = datetime.utcnow()

        self.db.commit()

        # Log the change
        self._log_audit(
            section.report_id,
            user_id,
            "section_updated",
            f"Updated section: {section.section_name}",
            changes={
                'section_id': section_id,
                'old_content': old_content,
                'new_content': content
            }
        )

        return section.to_dict()

    def finalize_report(self, report_id: int, user_id: int) -> Dict:
        """
        Mark report as final and ready for export
        """
        from app.models import GeneratedReport

        report = self.db.query(GeneratedReport).filter(
            GeneratedReport.id == report_id
        ).first()

        if not report:
            raise ValueError(f"Report {report_id} not found")

        # Check if all required sections are completed
        incomplete_sections = [s for s in report.sections if s.is_included and not s.is_completed]
        if incomplete_sections:
            raise ValueError(f"Cannot finalize: {len(incomplete_sections)} sections incomplete")

        report.status = "final"
        report.finalized_at = datetime.utcnow()

        self.db.commit()

        self._log_audit(report_id, user_id, "finalized", "Report marked as final")

        return report.to_dict()

    def create_new_version(self, report_id: int, user_id: int) -> Dict:
        """
        Create a new version of existing report
        """
        from app.models import GeneratedReport, ReportSection

        original_report = self.db.query(GeneratedReport).filter(
            GeneratedReport.id == report_id
        ).first()

        if not original_report:
            raise ValueError(f"Report {report_id} not found")

        # Create new version
        new_report = GeneratedReport(
            company_id=original_report.company_id,
            user_id=user_id,
            template_id=original_report.template_id,
            title=f"{original_report.title} (v{original_report.version + 1})",
            report_type=original_report.report_type,
            reporting_period_start=original_report.reporting_period_start,
            reporting_period_end=original_report.reporting_period_end,
            status="draft",
            branding_settings=original_report.branding_settings,
            selected_sections=original_report.selected_sections,
            custom_data=original_report.custom_data,
            version=original_report.version + 1,
            parent_report_id=original_report.id
        )

        self.db.add(new_report)
        self.db.flush()

        # Copy sections
        for old_section in original_report.sections:
            new_section = ReportSection(
                report_id=new_report.id,
                section_name=old_section.section_name,
                section_code=old_section.section_code,
                section_order=old_section.section_order,
                content=old_section.content,
                data_sources=old_section.data_sources,
                is_included=old_section.is_included,
                is_completed=old_section.is_completed,
                notes=old_section.notes
            )
            self.db.add(new_section)

        self.db.commit()
        self.db.refresh(new_report)

        self._log_audit(new_report.id, user_id, "version_created", f"Created version {new_report.version}")

        return new_report.to_dict()

    # Helper methods

    def _get_default_sections(self, template) -> Dict:
        """Get default section selection from template"""
        sections_config = template.sections_config.get('sections', [])
        return {
            'included': [s['code'] for s in sections_config if s.get('required', True)]
        }

    def _group_by_category(self, activities: List) -> Dict:
        """Group activities by category"""
        result = {}
        for activity in activities:
            category = activity.category or activity.activity_type
            if category not in result:
                result[category] = 0
            result[category] += activity.emissions_kgco2e or 0
        return result

    def _group_energy_by_source(self, records: List) -> Dict:
        """Group energy by source"""
        result = {}
        for record in records:
            source = record.energy_source
            if source not in result:
                result[source] = 0
            result[source] += record.consumption_amount or 0
        return result

    def _calculate_renewable_percentage(self, records: List) -> float:
        """Calculate percentage of renewable energy"""
        renewable_sources = ['solar', 'wind', 'hydro', 'biomass', 'geothermal']
        total = sum(r.consumption_amount for r in records) or 1
        renewable = sum(r.consumption_amount for r in records if r.energy_source in renewable_sources)
        return round((renewable / total) * 100, 2)

    def _group_water_by_source(self, records: List) -> Dict:
        """Group water by source"""
        result = {}
        for record in records:
            source = record.source_type or 'Unknown'
            if source not in result:
                result[source] = 0
            result[source] += record.withdrawal_amount or 0
        return result

    def _group_waste_by_type(self, records: List) -> Dict:
        """Group waste by type"""
        result = {}
        for record in records:
            waste_type = record.waste_type
            if waste_type not in result:
                result[waste_type] = 0
            result[waste_type] += record.quantity or 0
        return result

    def _group_waste_by_disposal(self, records: List) -> Dict:
        """Group waste by disposal method"""
        result = {}
        for record in records:
            method = record.disposal_method
            if method not in result:
                result[method] = 0
            result[method] += record.quantity or 0
        return result

    def _calculate_recycling_rate(self, records: List) -> float:
        """Calculate waste recycling rate"""
        total = sum(r.quantity for r in records) or 1
        recycled = sum(r.quantity for r in records if r.disposal_method in ['recycling', 'composting'])
        return round((recycled / total) * 100, 2)

    def _log_audit(
            self,
            report_id: int,
            user_id: int,
            action: str,
            description: str,
            changes: Optional[Dict] = None
    ):
        """Log audit trail"""
        from app.models import ReportAuditLog

        log = ReportAuditLog(
            report_id=report_id,
            user_id=user_id,
            action=action,
            description=description,
            changes=changes
        )
        self.db.add(log)
        self.db.commit()