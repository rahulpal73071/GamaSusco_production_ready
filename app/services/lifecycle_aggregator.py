"""
Lifecycle Aggregator Service
============================
Aggregates emission activities into lifecycle phases:
- Upstream (Scope 3 upstream categories)
- In-Process (Scope 1 & 2)
- Downstream (Scope 3 downstream categories)
- Waste Generated (Waste-related emissions)

Author: SHUB-0510
Date: 2024-11-24
"""

from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, List, Optional
from app.models import EmissionActivity, WasteDisposal
from datetime import datetime


class LifecycleAggregator:
    """Service to aggregate emissions by lifecycle phases"""

    # Lifecycle phase mappings
    LIFECYCLE_MAPPING = {
        "UPSTREAM": {
            "scope3_categories": [
                "purchased_goods",
                "capital_goods",
                "upstream_transport",
                "upstream_leased_assets",
                "fuel_energy_upstream",
                "3.1",  # Purchased goods and services
                "3.2",  # Capital goods
                "3.3",  # Fuel and energy related activities
                "3.4",  # Upstream transportation and distribution
                "3.8",  # Upstream leased assets
            ],
            "keywords": [
                "supplier", "procurement", "raw_material", "purchased",
                "upstream", "material", "capital", "goods"
            ]
        },

        "IN_PROCESS": {
            "scope1_categories": [
                "stationary_combustion",
                "mobile_combustion",
                "fugitive_emissions",
                "process_emissions",
                "1.1", "1.2", "1.3", "1.4"
            ],
            "scope2_categories": [
                "electricity",
                "heating",
                "cooling",
                "steam",
                "2.1", "2.2"
            ],
            "keywords": [
                "manufacturing", "operations", "facility", "production",
                "electricity", "fuel", "energy", "combustion"
            ]
        },

        "DOWNSTREAM": {
            "scope3_categories": [
                "downstream_transport",
                "processing_sold_products",
                "use_of_sold_products",
                "end_of_life",
                "downstream_leased_assets",
                "franchises",
                "3.9",  # Downstream transportation
                "3.10",  # Processing of sold products
                "3.11",  # Use of sold products
                "3.12",  # End-of-life treatment
                "3.13",  # Downstream leased assets
                "3.14",  # Franchises
            ],
            "keywords": [
                "distribution", "logistics", "customer", "downstream",
                "transport", "delivery", "sold_products"
            ]
        },

        "WASTE": {
            "scope3_categories": [
                "waste_generated_operations",
                "3.5"  # Waste generated in operations
            ],
            "waste_types": ["solid", "liquid", "hazardous", "recyclable"],
            "keywords": [
                "waste", "disposal", "recycling", "treatment",
                "landfill", "incineration", "composting"
            ]
        }
    }

    def __init__(self, db: Session):
        self.db = db

    def _categorize_activity(self, activity: EmissionActivity) -> str:
        """
        Categorize an activity into a lifecycle phase
        Returns: 'UPSTREAM', 'IN_PROCESS', 'DOWNSTREAM', or 'WASTE'
        """

        # Check WASTE first (most specific)
        if self._is_waste_activity(activity):
            return "WASTE"

        # Check IN_PROCESS (Scope 1 & 2)
        if activity.scope_number in [1, 2]:
            return "IN_PROCESS"

        # For Scope 3, check category and keywords
        if activity.scope_number == 3:
            # Check UPSTREAM
            if self._matches_phase(activity, "UPSTREAM"):
                return "UPSTREAM"

            # Check DOWNSTREAM
            if self._matches_phase(activity, "DOWNSTREAM"):
                return "DOWNSTREAM"

            # Default Scope 3 to UPSTREAM if not clearly downstream
            return "UPSTREAM"

        # Default fallback
        return "IN_PROCESS"

    def _is_waste_activity(self, activity: EmissionActivity) -> bool:
        """Check if activity is waste-related"""
        waste_keywords = self.LIFECYCLE_MAPPING["WASTE"]["keywords"]
        waste_categories = self.LIFECYCLE_MAPPING["WASTE"]["scope3_categories"]

        # Check category
        if activity.category and any(cat in str(activity.category).lower() for cat in waste_categories):
            return True

        # Check subcategory
        if activity.subcategory and any(cat in str(activity.subcategory).lower() for cat in waste_categories):
            return True

        # Check activity type and name
        text_fields = [
            activity.activity_type or "",
            activity.activity_name or "",
            activity.description or ""
        ]
        combined_text = " ".join(text_fields).lower()

        return any(keyword in combined_text for keyword in waste_keywords)

    def _matches_phase(self, activity: EmissionActivity, phase: str) -> bool:
        """Check if activity matches a lifecycle phase"""
        phase_data = self.LIFECYCLE_MAPPING[phase]

        # Check category match
        if "scope3_categories" in phase_data:
            category_str = str(activity.category or "").lower()
            subcategory_str = str(activity.subcategory or "").lower()

            for cat in phase_data["scope3_categories"]:
                if cat in category_str or cat in subcategory_str:
                    return True

        # Check keyword match
        if "keywords" in phase_data:
            text_fields = [
                activity.activity_type or "",
                activity.activity_name or "",
                activity.description or ""
            ]
            combined_text = " ".join(text_fields).lower()

            return any(keyword in combined_text for keyword in phase_data["keywords"])

        return False

    def get_lifecycle_overview(
            self,
            company_id: int,
            start_date: Optional[datetime] = None,
            end_date: Optional[datetime] = None
    ) -> Dict:
        """
        Get complete lifecycle overview for a company
        Returns emissions breakdown by lifecycle phase
        """

        # Build base query
        query = self.db.query(EmissionActivity).filter(
            EmissionActivity.company_id == company_id
        )

        # Apply date filters if provided
        if start_date:
            query = query.filter(EmissionActivity.activity_date >= start_date)
        if end_date:
            query = query.filter(EmissionActivity.activity_date <= end_date)

        # Get all activities
        activities = query.all()

        # Also get waste disposal records
        waste_query = self.db.query(WasteDisposal).filter(
            WasteDisposal.company_id == company_id
        )
        if start_date:
            waste_query = waste_query.filter(WasteDisposal.created_at >= start_date)
        if end_date:
            waste_query = waste_query.filter(WasteDisposal.created_at <= end_date)

        waste_records = waste_query.all()

        # Initialize phase data
        phases = {
            "UPSTREAM": {
                "total_emissions_kg": 0.0,
                "total_emissions_tonnes": 0.0,
                "activity_count": 0,
                "breakdown": {},
                "activities": []
            },
            "IN_PROCESS": {
                "total_emissions_kg": 0.0,
                "total_emissions_tonnes": 0.0,
                "scope1_emissions": 0.0,
                "scope2_emissions": 0.0,
                "activity_count": 0,
                "breakdown": {},
                "activities": []
            },
            "DOWNSTREAM": {
                "total_emissions_kg": 0.0,
                "total_emissions_tonnes": 0.0,
                "activity_count": 0,
                "breakdown": {},
                "activities": []
            },
            "WASTE": {
                "total_emissions_kg": 0.0,
                "total_emissions_tonnes": 0.0,
                "total_weight_kg": 0.0,
                "activity_count": 0,
                "breakdown": {},
                "activities": []
            }
        }

        # Categorize and aggregate activities
        for activity in activities:
            phase = self._categorize_activity(activity)

            # Add to phase totals
            phases[phase]["total_emissions_kg"] += activity.emissions_kgco2e or 0.0
            phases[phase]["activity_count"] += 1

            # Add to breakdown by category
            category_key = activity.category or activity.activity_type or "Other"
            if category_key not in phases[phase]["breakdown"]:
                phases[phase]["breakdown"][category_key] = 0.0
            phases[phase]["breakdown"][category_key] += activity.emissions_kgco2e or 0.0

            # Store activity summary
            phases[phase]["activities"].append({
                "id": activity.id,
                "type": activity.activity_type,
                "name": activity.activity_name,
                "emissions": activity.emissions_kgco2e,
                "date": activity.activity_date.isoformat() if activity.activity_date else None
            })

            # Special handling for IN_PROCESS scope breakdown
            if phase == "IN_PROCESS":
                if activity.scope_number == 1:
                    phases[phase]["scope1_emissions"] += activity.emissions_kgco2e or 0.0
                elif activity.scope_number == 2:
                    phases[phase]["scope2_emissions"] += activity.emissions_kgco2e or 0.0

            # Special handling for WASTE weight tracking
            if phase == "WASTE":
                # Try to extract weight from quantity based on unit
                if activity.unit:
                    unit_lower = activity.unit.lower()
                    quantity = activity.quantity or 0.0

                    # Handle different weight units
                    if "kg" in unit_lower:
                        phases[phase]["total_weight_kg"] += quantity
                    elif "tonne" in unit_lower or unit_lower == "t":
                        phases[phase]["total_weight_kg"] += quantity * 1000  # Convert tonnes to kg
                    elif "g" in unit_lower and "kg" not in unit_lower:  # grams
                        phases[phase]["total_weight_kg"] += quantity / 1000  # Convert grams to kg
                    elif "lb" in unit_lower or "pound" in unit_lower:
                        phases[phase]["total_weight_kg"] += quantity * 0.453592  # Convert pounds to kg
                    else:
                        # If unit doesn't indicate weight, still count the quantity
                        phases[phase]["total_weight_kg"] += quantity

        # Process waste disposal records and add to WASTE phase
        for waste_record in waste_records:
            phases["WASTE"]["activity_count"] += 1

            # Add emissions if available
            if waste_record.emissions_kgco2e:
                phases["WASTE"]["total_emissions_kg"] += waste_record.emissions_kgco2e

            # Add waste weight
            quantity = waste_record.quantity or 0.0
            unit_lower = (waste_record.unit or "kg").lower()

            if "kg" in unit_lower:
                phases["WASTE"]["total_weight_kg"] += quantity
            elif "tonne" in unit_lower or unit_lower == "t":
                phases["WASTE"]["total_weight_kg"] += quantity * 1000
            elif "g" in unit_lower and "kg" not in unit_lower:
                phases["WASTE"]["total_weight_kg"] += quantity / 1000
            elif "lb" in unit_lower or "pound" in unit_lower:
                phases["WASTE"]["total_weight_kg"] += quantity * 0.453592
            else:
                phases["WASTE"]["total_weight_kg"] += quantity

            # Add to breakdown
            waste_type_key = waste_record.waste_type or "Other"
            if waste_type_key not in phases["WASTE"]["breakdown"]:
                phases["WASTE"]["breakdown"][waste_type_key] = 0.0
            phases["WASTE"]["breakdown"][waste_type_key] += waste_record.emissions_kgco2e or 0.0

            # Store waste record summary
            phases["WASTE"]["activities"].append({
                "id": waste_record.id,
                "type": waste_record.waste_type,
                "name": f"{waste_record.disposal_method} disposal",
                "emissions": waste_record.emissions_kgco2e or 0.0,
                "date": waste_record.created_at.isoformat() if waste_record.created_at else None,
                "quantity": waste_record.quantity,
                "unit": waste_record.unit
            })

        # Convert to tonnes and round
        for phase in phases.values():
            phase["total_emissions_tonnes"] = round(phase["total_emissions_kg"] / 1000, 2)
            phase["total_emissions_kg"] = round(phase["total_emissions_kg"], 2)

            # Round breakdown values
            for key in phase["breakdown"]:
                phase["breakdown"][key] = round(phase["breakdown"][key], 2)

        # Calculate total emissions
        total_emissions_kg = sum(p["total_emissions_kg"] for p in phases.values())

        return {
            "company_id": company_id,
            "date_range": {
                "start": start_date.isoformat() if start_date else None,
                "end": end_date.isoformat() if end_date else None
            },
            "total_emissions_kg": round(total_emissions_kg, 2),
            "total_emissions_tonnes": round(total_emissions_kg / 1000, 2),
            "phases": phases,
            "summary": {
                "upstream_percentage": round((phases["UPSTREAM"][
                                                  "total_emissions_kg"] / total_emissions_kg * 100) if total_emissions_kg > 0 else 0,
                                             1),
                "in_process_percentage": round((phases["IN_PROCESS"][
                                                    "total_emissions_kg"] / total_emissions_kg * 100) if total_emissions_kg > 0 else 0,
                                               1),
                "downstream_percentage": round((phases["DOWNSTREAM"][
                                                    "total_emissions_kg"] / total_emissions_kg * 100) if total_emissions_kg > 0 else 0,
                                               1),
                "waste_percentage": round(
                    (phases["WASTE"]["total_emissions_kg"] / total_emissions_kg * 100) if total_emissions_kg > 0 else 0,
                    1)
            }
        }

    def get_phase_details(
            self,
            company_id: int,
            phase: str,
            start_date: Optional[datetime] = None,
            end_date: Optional[datetime] = None,
            limit: int = 100
    ) -> List[Dict]:
        """
        Get detailed activities for a specific lifecycle phase
        """

        # Build base query
        query = self.db.query(EmissionActivity).filter(
            EmissionActivity.company_id == company_id
        )

        # Apply date filters
        if start_date:
            query = query.filter(EmissionActivity.activity_date >= start_date)
        if end_date:
            query = query.filter(EmissionActivity.activity_date <= end_date)

        # Get all activities and filter by phase
        activities = query.all()

        phase_activities = []
        for activity in activities:
            if self._categorize_activity(activity) == phase.upper():
                phase_activities.append(activity.to_dict())

                if len(phase_activities) >= limit:
                    break

        # If WASTE phase, also include waste disposal records
        if phase.upper() == "WASTE" and len(phase_activities) < limit:
            waste_query = self.db.query(WasteDisposal).filter(
                WasteDisposal.company_id == company_id
            )
            if start_date:
                waste_query = waste_query.filter(WasteDisposal.created_at >= start_date)
            if end_date:
                waste_query = waste_query.filter(WasteDisposal.created_at <= end_date)

            waste_records = waste_query.limit(limit - len(phase_activities)).all()

            for waste_record in waste_records:
                phase_activities.append({
                    'id': waste_record.id,
                    'activity_type': waste_record.waste_type,
                    'activity_name': f"{waste_record.disposal_method} disposal",
                    'quantity': waste_record.quantity,
                    'unit': waste_record.unit,
                    'emissions_kgco2e': waste_record.emissions_kgco2e or 0.0,
                    'activity_date': waste_record.created_at.isoformat() if waste_record.created_at else None,
                    'disposal_method': waste_record.disposal_method,
                    'facility_name': waste_record.facility_name
                })

        return phase_activities