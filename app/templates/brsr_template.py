# app/templates/brsr_template.py
"""
BRSR (Business Responsibility and Sustainability Report) Template
SEBI-mandated format for top 1000 Indian companies
"""

BRSR_TEMPLATE = {
    "name": "BRSR Report 2024",
    "type": "BRSR",
    "version": "2024",
    "description": "Complete BRSR template following SEBI guidelines for Indian companies",
    "template_structure": {
        "sections": [
            {
                "code": "A",
                "name": "Section A: General Disclosures",
                "subsections": ["A.1", "A.2", "A.3"]
            },
            {
                "code": "B",
                "name": "Section B: Management and Process Disclosures",
                "subsections": ["B.1", "B.2", "B.3", "B.4", "B.5", "B.6", "B.7", "B.8", "B.9"]
            },
            {
                "code": "C",
                "name": "Section C: Principle-wise Performance Disclosure",
                "subsections": ["C.P1", "C.P2", "C.P3", "C.P4", "C.P5", "C.P6", "C.P7", "C.P8", "C.P9"]
            }
        ]
    },
    "sections_config": {
        "sections": [
            # SECTION A - General Disclosures
            {
                "code": "A.1",
                "name": "Details of the listed entity",
                "order": 1,
                "required": True,
                "fields": [
                    {"name": "corporate_identity_number", "type": "text", "required": True},
                    {"name": "company_name", "type": "text", "required": True},
                    {"name": "year_of_incorporation", "type": "year", "required": True},
                    {"name": "registered_office_address", "type": "textarea", "required": True},
                    {"name": "corporate_office_address", "type": "textarea", "required": True},
                    {"name": "email", "type": "email", "required": True},
                    {"name": "telephone", "type": "text", "required": True},
                    {"name": "website", "type": "url", "required": True},
                    {"name": "financial_year", "type": "text", "required": True},
                    {"name": "stock_exchanges", "type": "textarea", "required": True},
                    {"name": "paid_up_capital", "type": "number", "unit": "₹ crores", "required": True},
                    {"name": "contact_person_name", "type": "text", "required": True},
                    {"name": "contact_person_designation", "type": "text", "required": True},
                    {"name": "contact_person_telephone", "type": "text", "required": True},
                    {"name": "contact_person_email", "type": "email", "required": True}
                ]
            },
            {
                "code": "A.2",
                "name": "Products/Services",
                "order": 2,
                "required": True,
                "fields": [
                    {"name": "products_services", "type": "table", "required": True},
                    {"name": "nic_codes", "type": "textarea", "required": True}
                ]
            },
            {
                "code": "A.3",
                "name": "Operations",
                "order": 3,
                "required": True,
                "fields": [
                    {"name": "number_of_locations_national", "type": "number", "required": True},
                    {"name": "number_of_locations_international", "type": "number", "required": True},
                    {"name": "locations_details", "type": "table", "required": True},
                    {"name": "markets_served", "type": "textarea", "required": True}
                ]
            },

            # SECTION B - Management and Process Disclosures
            {
                "code": "B.1",
                "name": "Policy and Management Processes",
                "order": 4,
                "required": True,
                "fields": [
                    {"name": "sustainability_policy", "type": "textarea", "required": True},
                    {"name": "policy_approved_by", "type": "select", "required": True,
                     "options": ["Board of Directors", "CEO", "Other"]},
                    {"name": "policy_link", "type": "url", "required": False}
                ]
            },
            {
                "code": "B.2",
                "name": "Board Committee",
                "order": 5,
                "required": True,
                "fields": [
                    {"name": "board_committee_name", "type": "text", "required": True},
                    {"name": "committee_composition", "type": "textarea", "required": True},
                    {"name": "frequency_of_meetings", "type": "number", "required": True}
                ]
            },

            # SECTION C - Principle-wise Performance
            # Principle 1: Ethics, Transparency and Accountability
            {
                "code": "C.P1",
                "name": "Principle 1: Ethics, Transparency and Accountability",
                "order": 6,
                "required": True,
                "fields": [
                    {"name": "percentage_inputs_from_sustainable_sources", "type": "number", "unit": "%",
                     "required": True},
                    {"name": "percentage_inputs_recyclable", "type": "number", "unit": "%", "required": True}
                ]
            },

            # Principle 2: Product Lifecycle Sustainability
            {
                "code": "C.P2",
                "name": "Principle 2: Product Lifecycle Sustainability",
                "order": 7,
                "required": True,
                "fields": [
                    {"name": "percentage_recycled_or_reused_input_materials", "type": "number", "unit": "%",
                     "required": True},
                    {"name": "products_and_services_reduce_environmental_impact", "type": "textarea", "required": True}
                ]
            },

            # Principle 3: Employee Well-being
            {
                "code": "C.P3",
                "name": "Principle 3: Employee Well-being",
                "order": 8,
                "required": True,
                "fields": [
                    {"name": "total_employees_permanent", "type": "number", "required": True},
                    {"name": "total_employees_temporary", "type": "number", "required": True},
                    {"name": "female_employees_percentage", "type": "number", "unit": "%", "required": True},
                    {"name": "differently_abled_employees", "type": "number", "required": True}
                ]
            },

            # Principle 4: Stakeholder Engagement
            {
                "code": "C.P4",
                "name": "Principle 4: Stakeholder Engagement",
                "order": 9,
                "required": True,
                "fields": [
                    {"name": "stakeholder_groups_identified", "type": "textarea", "required": True},
                    {"name": "engagement_mechanisms", "type": "textarea", "required": True}
                ]
            },

            # Principle 5: Human Rights
            {
                "code": "C.P5",
                "name": "Principle 5: Human Rights",
                "order": 10,
                "required": True,
                "fields": [
                    {"name": "human_rights_training_provided", "type": "boolean", "required": True},
                    {"name": "percentage_employees_trained", "type": "number", "unit": "%", "required": False},
                    {"name": "complaints_received", "type": "number", "required": True},
                    {"name": "complaints_resolved", "type": "number", "required": True}
                ]
            },

            # Principle 6: Environment (MOST IMPORTANT FOR CARBON ACCOUNTING)
            {
                "code": "C.P6",
                "name": "Principle 6: Environment",
                "order": 11,
                "required": True,
                "auto_populate": True,
                "data_mapping": ["emissions", "energy", "water", "waste"],
                "fields": [
                    # Energy
                    {"name": "total_energy_consumption", "type": "number", "unit": "GJ", "required": True},
                    {"name": "energy_from_renewable_sources", "type": "number", "unit": "GJ", "required": True},
                    {"name": "energy_intensity_per_rupee", "type": "number", "required": True},
                    {"name": "energy_intensity_optional_metric", "type": "number", "required": False},

                    # Water
                    {"name": "total_water_withdrawal", "type": "number", "unit": "KL", "required": True},
                    {"name": "water_withdrawal_surface", "type": "number", "unit": "KL", "required": True},
                    {"name": "water_withdrawal_groundwater", "type": "number", "unit": "KL", "required": True},
                    {"name": "water_withdrawal_third_party", "type": "number", "unit": "KL", "required": True},
                    {"name": "water_intensity_per_rupee", "type": "number", "required": True},
                    {"name": "water_discharge", "type": "number", "unit": "KL", "required": True},

                    # Emissions
                    {"name": "total_scope1_emissions", "type": "number", "unit": "tonnes CO2e", "required": True},
                    {"name": "total_scope2_emissions", "type": "number", "unit": "tonnes CO2e", "required": True},
                    {"name": "total_scope3_emissions", "type": "number", "unit": "tonnes CO2e", "required": False},
                    {"name": "emissions_intensity_per_rupee", "type": "number", "required": True},
                    {"name": "emissions_intensity_optional_metric", "type": "number", "required": False},

                    # Waste
                    {"name": "plastic_waste_generated", "type": "number", "unit": "tonnes", "required": True},
                    {"name": "e_waste_generated", "type": "number", "unit": "tonnes", "required": True},
                    {"name": "bio_medical_waste_generated", "type": "number", "unit": "tonnes", "required": True},
                    {"name": "construction_waste_generated", "type": "number", "unit": "tonnes", "required": True},
                    {"name": "battery_waste_generated", "type": "number", "unit": "tonnes", "required": True},
                    {"name": "radioactive_waste_generated", "type": "number", "unit": "tonnes", "required": True},
                    {"name": "other_hazardous_waste", "type": "number", "unit": "tonnes", "required": True},
                    {"name": "other_non_hazardous_waste", "type": "number", "unit": "tonnes", "required": True},
                    {"name": "waste_recycled", "type": "number", "unit": "tonnes", "required": True},
                    {"name": "waste_re_used", "type": "number", "unit": "tonnes", "required": True},
                    {"name": "waste_other_recovery", "type": "number", "unit": "tonnes", "required": True},
                    {"name": "waste_incinerated", "type": "number", "unit": "tonnes", "required": True},
                    {"name": "waste_landfill", "type": "number", "unit": "tonnes", "required": True}
                ]
            },

            # Principle 7: Public Policy Advocacy
            {
                "code": "C.P7",
                "name": "Principle 7: Public Policy Advocacy",
                "order": 12,
                "required": True,
                "fields": [
                    {"name": "trade_industry_chambers_membership", "type": "textarea", "required": True},
                    {"name": "public_policy_positions", "type": "textarea", "required": False}
                ]
            },

            # Principle 8: Inclusive Growth
            {
                "code": "C.P8",
                "name": "Principle 8: Inclusive Growth",
                "order": 13,
                "required": True,
                "fields": [
                    {"name": "csr_expenditure", "type": "number", "unit": "₹ lakhs", "required": True},
                    {"name": "focus_areas", "type": "textarea", "required": True}
                ]
            },

            # Principle 9: Customer Value
            {
                "code": "C.P9",
                "name": "Principle 9: Customer Value",
                "order": 14,
                "required": True,
                "fields": [
                    {"name": "consumer_complaints_received", "type": "number", "required": True},
                    {"name": "consumer_complaints_resolved", "type": "number", "required": True},
                    {"name": "product_recalls", "type": "number", "required": True}
                ]
            }
        ]
    },
    "default_settings": {
        "page_size": "A4",
        "font_family": "Helvetica",
        "include_charts": True,
        "include_tables": True,
        "financial_year_format": "indian",  # April-March
        "currency": "INR"
    }
}


def get_brsr_template():
    """Get BRSR template structure"""
    return BRSR_TEMPLATE