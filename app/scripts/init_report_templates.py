# app/scripts/init_report_templates.py
"""
Initialize report templates in database
Run this once after database migration
"""

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import ReportTemplate
from app.templates.cdp_template import get_cdp_template
from app.templates.brsr_template import get_brsr_template


def init_templates():
    """Initialize CDP and BRSR templates"""
    db = SessionLocal()

    try:
        # Check if templates already exist
        existing = db.query(ReportTemplate).count()
        if existing > 0:
            print(f"⚠️  {existing} templates already exist. Skipping initialization.")
            return

        # Create CDP template
        cdp_data = get_cdp_template()
        cdp_template = ReportTemplate(
            name=cdp_data['name'],
            type=cdp_data['type'],
            version=cdp_data['version'],
            description=cdp_data['description'],
            template_structure=cdp_data['template_structure'],
            sections_config=cdp_data['sections_config'],
            default_settings=cdp_data['default_settings'],
            is_active=True,
            is_system=True
        )
        db.add(cdp_template)
        print("✅ CDP template created")

        # Create BRSR template
        brsr_data = get_brsr_template()
        brsr_template = ReportTemplate(
            name=brsr_data['name'],
            type=brsr_data['type'],
            version=brsr_data['version'],
            description=brsr_data['description'],
            template_structure=brsr_data['template_structure'],
            sections_config=brsr_data['sections_config'],
            default_settings=brsr_data['default_settings'],
            is_active=True,
            is_system=True
        )
        db.add(brsr_template)
        print("✅ BRSR template created")

        # Create Basic Custom template
        custom_template = ReportTemplate(
            name="Basic Sustainability Report",
            type="CUSTOM",
            version="1.0",
            description="Simple sustainability report with emissions, energy, water, and waste",
            template_structure={
                "sections": [
                    {"code": "exec", "name": "Executive Summary"},
                    {"code": "emissions", "name": "Emissions Data"},
                    {"code": "energy", "name": "Energy Consumption"},
                    {"code": "water", "name": "Water Usage"},
                    {"code": "waste", "name": "Waste Management"}
                ]
            },
            sections_config={
                "sections": [
                    {
                        "code": "exec",
                        "name": "Executive Summary",
                        "order": 1,
                        "required": True,
                        "fields": [
                            {"name": "summary_text", "type": "textarea", "required": True}
                        ]
                    },
                    {
                        "code": "emissions",
                        "name": "Emissions Data",
                        "order": 2,
                        "required": True,
                        "auto_populate": True,
                        "data_mapping": ["emissions"]
                    },
                    {
                        "code": "energy",
                        "name": "Energy Consumption",
                        "order": 3,
                        "required": True,
                        "auto_populate": True,
                        "data_mapping": ["energy"]
                    },
                    {
                        "code": "water",
                        "name": "Water Usage",
                        "order": 4,
                        "required": False,
                        "auto_populate": True,
                        "data_mapping": ["water"]
                    },
                    {
                        "code": "waste",
                        "name": "Waste Management",
                        "order": 5,
                        "required": False,
                        "auto_populate": True,
                        "data_mapping": ["waste"]
                    }
                ]
            },
            default_settings={
                "page_size": "A4",
                "font_family": "Helvetica",
                "include_charts": True,
                "include_tables": True
            },
            is_active=True,
            is_system=True
        )
        db.add(custom_template)
        print("✅ Custom template created")

        db.commit()
        print("🎉 All templates initialized successfully!")

    except Exception as e:
        db.rollback()
        print(f"❌ Error initializing templates: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("🚀 Initializing report templates...")
    init_templates()