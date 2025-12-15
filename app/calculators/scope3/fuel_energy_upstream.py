"""Category 3.3 – Fuel‑ and energy‑related activities (not included in Scope 1 or 2)

Emissions from producing and transporting fuels and energy that a
company uses but does not own or directly control【974843948574610†L172-L176】.
This module exposes the common calculation functions for this
category.
"""

from .base import (
    calculate_spend_based,
    calculate_supplier_specific,
    calculate_activity_based,
    calculate_hybrid,
)

CATEGORY_CODE = "3.3"
CATEGORY_NAME = "Fuel and energy related activities"