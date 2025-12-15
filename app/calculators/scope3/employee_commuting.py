"""Category 3.7 – Employee commuting

Emissions from employees travelling between home and work using any
means of transport not owned by the company【974843948574610†L193-L196】.
Uses the generic calculation functions for spend‑, supplier‑, activity‑
and hybrid methods.
"""

from .base import (
    calculate_spend_based,
    calculate_supplier_specific,
    calculate_activity_based,
    calculate_hybrid,
)

CATEGORY_CODE = "3.7"
CATEGORY_NAME = "Employee commuting"