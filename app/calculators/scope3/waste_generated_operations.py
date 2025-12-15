"""Category 3.5 – Waste generated in operations

Emissions from treating and disposing of waste created during
operations【974843948574610†L183-L186】.  The same spend‑based,
supplier‑specific, activity‑based and hybrid calculations apply.
"""

from .base import (
    calculate_spend_based,
    calculate_supplier_specific,
    calculate_activity_based,
    calculate_hybrid,
)

CATEGORY_CODE = "3.5"
CATEGORY_NAME = "Waste generated in operations"