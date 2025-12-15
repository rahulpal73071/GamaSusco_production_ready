# app/templates/cdp_template.py
"""
CDP (Carbon Disclosure Project) Report Template
Complete questionnaire structure for CDP Climate Change
"""

CDP_TEMPLATE = {
    "name": "CDP Climate Change Questionnaire 2024",
    "type": "CDP",
    "version": "2024",
    "description": "Complete CDP Climate Change questionnaire template following CDP 2024 guidelines",
    "template_structure": {
        "modules": [
            {
                "code": "C0",
                "name": "Introduction",
                "required": True,
                "sections": ["C0.1", "C0.2", "C0.3", "C0.4", "C0.5"]
            },
            {
                "code": "C1",
                "name": "Governance",
                "required": True,
                "sections": ["C1.1", "C1.2", "C1.3"]
            },
            {
                "code": "C2",
                "name": "Risks and Opportunities",
                "required": True,
                "sections": ["C2.1", "C2.2", "C2.3", "C2.4"]
            },
            {
                "code": "C3",
                "name": "Business Strategy",
                "required": True,
                "sections": ["C3.1", "C3.2", "C3.3", "C3.4"]
            },
            {
                "code": "C4",
                "name": "Targets and Performance",
                "required": True,
                "sections": ["C4.1", "C4.2", "C4.3", "C4.5"]
            },
            {
                "code": "C5",
                "name": "Emissions Methodology",
                "required": True,
                "sections": ["C5.1", "C5.2"]
            },
            {
                "code": "C6",
                "name": "Emissions Data - Scope 1",
                "required": True,
                "sections": ["C6.1", "C6.2", "C6.3", "C6.4", "C6.5"]
            },
            {
                "code": "C7",
                "name": "Emissions Data - Scope 2",
                "required": True,
                "sections": ["C7.1", "C7.2", "C7.3", "C7.5"]
            },
            {
                "code": "C8",
                "name": "Emissions Data - Scope 3",
                "required": True,
                "sections": ["C8.1", "C8.2", "C8.3", "C8.4"]
            },
            {
                "code": "C9",
                "name": "Additional Metrics",
                "required": False,
                "sections": ["C9.1"]
            },
            {
                "code": "C10",
                "name": "Verification",
                "required": True,
                "sections": ["C10.1", "C10.2"]
            },
            {
                "code": "C11",
                "name": "Carbon Pricing",
                "required": False,
                "sections": ["C11.1", "C11.2", "C11.3"]
            },
            {
                "code": "C12",
                "name": "Engagement",
                "required": True,
                "sections": ["C12.1", "C12.3"]
            }
        ]
    },
    "sections_config": {
        "sections": [
            # C0 - Introduction
            {
                "code": "C0.1",
                "name": "General Organization Information",
                "order": 1,
                "required": True,
                "data_mapping": ["company.name", "company.industry", "company.location"],
                "fields": [
                    {"name": "organization_name", "type": "text", "required": True},
                    {"name": "reporting_year", "type": "year", "required": True},
                    {"name": "financial_year", "type": "date_range", "required": True},
                    {"name": "primary_industry", "type": "select", "required": True},
                    {"name": "headquarters_country", "type": "select", "required": True}
                ]
            },
            {
                "code": "C0.2",
                "name": "Reporting Boundary",
                "order": 2,
                "required": True,
                "fields": [
                    {"name": "boundary_description", "type": "textarea", "required": True},
                    {"name": "exclusions", "type": "textarea", "required": False},
                    {"name": "consolidation_approach", "type": "select", "required": True, "options": ["Financial control", "Operational control", "Equity share"]}
                ]
            },
            {
                "code": "C0.3",
                "name": "Select Modules",
                "order": 3,
                "required": True,
                "fields": [
                    {"name": "module_c1", "type": "boolean", "label": "Governance", "default": True},
                    {"name": "module_c2", "type": "boolean", "label": "Risks and Opportunities", "default": True},
                    {"name": "module_c11", "type": "boolean", "label": "Carbon Pricing", "default": False}
                ]
            },
            # C6 - Scope 1 Emissions
            {
                "code": "C6.1",
                "name": "Scope 1 Emissions Breakdown",
                "order": 10,
                "required": True,
                "auto_populate": True,
                "data_mapping": ["emissions.scope1"],
                "fields": [
                    {"name": "total_scope1", "type": "number", "unit": "tonnes CO2e", "required": True},
                    {"name": "by_country", "type": "table", "required": True},
                    {"name": "by_business_division", "type": "table", "required": False},
                    {"name": "by_facility", "type": "table", "required": False}
                ]
            },
            {
                "code": "C6.2",
                "name": "Scope 1 GHG Breakdown",
                "order": 11,
                "required": True,
                "auto_populate": True,
                "fields": [
                    {"name": "co2", "type": "number", "unit": "tonnes", "required": True},
                    {"name": "ch4", "type": "number", "unit": "tonnes", "required": True},
                    {"name": "n2o", "type": "number", "unit": "tonnes", "required": True},
                    {"name": "hfcs", "type": "number", "unit": "tonnes", "required": False},
                    {"name": "pfcs", "type": "number", "unit": "tonnes", "required": False},
                    {"name": "sf6", "type": "number", "unit": "tonnes", "required": False}
                ]
            },
            {
                "code": "C6.3",
                "name": "Scope 1 Activities",
                "order": 12,
                "required": True,
                "auto_populate": True,
                "data_mapping": ["emissions.activities.scope1"],
                "fields": [
                    {"name": "activity_type", "type": "select", "required": True},
                    {"name": "description", "type": "textarea", "required": True},
                    {"name": "fuel_consumed", "type": "table", "required": True}
                ]
            },
            # C7 - Scope 2 Emissions
            {
                "code": "C7.1",
                "name": "Scope 2 Emissions Breakdown",
                "order": 13,
                "required": True,
                "auto_populate": True,
                "data_mapping": ["emissions.scope2"],
                "fields": [
                    {"name": "location_based", "type": "number", "unit": "tonnes CO2e", "required": True},
                    {"name": "market_based", "type": "number", "unit": "tonnes CO2e", "required": False},
                    {"name": "by_country", "type": "table", "required": True}
                ]
            },
            {
                "code": "C7.2",
                "name": "Energy Activities",
                "order": 14,
                "required": True,
                "auto_populate": True,
                "data_mapping": ["energy.consumption"],
                "fields": [
                    {"name": "electricity_consumed", "type": "number", "unit": "MWh", "required": True},
                    {"name": "heating_consumed", "type": "number", "unit": "MWh", "required": False},
                    {"name": "cooling_consumed", "type": "number", "unit": "MWh", "required": False},
                    {"name": "steam_consumed", "type": "number", "unit": "MWh", "required": False}
                ]
            },
            # C8 - Scope 3 Emissions
            {
                "code": "C8.1",
                "name": "Scope 3 Categories Applicability",
                "order": 15,
                "required": True,
                "fields": [
                    {"name": "category_1_applicable", "type": "boolean", "label": "Purchased goods and services"},
                    {"name": "category_2_applicable", "type": "boolean", "label": "Capital goods"},
                    {"name": "category_3_applicable", "type": "boolean", "label": "Fuel and energy related activities"},
                    {"name": "category_4_applicable", "type": "boolean", "label": "Upstream transportation"},
                    {"name": "category_5_applicable", "type": "boolean", "label": "Waste generated in operations"},
                    {"name": "category_6_applicable", "type": "boolean", "label": "Business travel"},
                    {"name": "category_7_applicable", "type": "boolean", "label": "Employee commuting"},
                    {"name": "category_8_applicable", "type": "boolean", "label": "Upstream leased assets"},
                    {"name": "category_9_applicable", "type": "boolean", "label": "Downstream transportation"},
                    {"name": "category_10_applicable", "type": "boolean", "label": "Processing of sold products"},
                    {"name": "category_11_applicable", "type": "boolean", "label": "Use of sold products"},
                    {"name": "category_12_applicable", "type": "boolean", "label": "End-of-life treatment"},
                    {"name": "category_13_applicable", "type": "boolean", "label": "Downstream leased assets"},
                    {"name": "category_14_applicable", "type": "boolean", "label": "Franchises"},
                    {"name": "category_15_applicable", "type": "boolean", "label": "Investments"}
                ]
            },
            {
                "code": "C8.2",
                "name": "Scope 3 Emissions by Category",
                "order": 16,
                "required": True,
                "auto_populate": True,
                "data_mapping": ["emissions.scope3"],
                "fields": [
                    {"name": "total_scope3", "type": "number", "unit": "tonnes CO2e", "required": True},
                    {"name": "by_category", "type": "table", "required": True}
                ]
            }
        ]
    },
    "default_settings": {
        "page_size": "A4",
        "font_family": "Helvetica",
        "include_charts": True,
        "include_tables": True,
        "include_appendices": True
    }
}

def get_cdp_template():
    """Get CDP template structure"""
    return CDP_TEMPLATE