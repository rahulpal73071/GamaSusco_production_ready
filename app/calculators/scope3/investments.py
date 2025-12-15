"""Category 3.15 – Investments

Emissions from companies in which the reporting company invests,
including subsidiaries, joint ventures and financial investments【974843948574610†L234-L241】.
This module exposes calculation helpers for investments.
"""

from .base import (
    calculate_spend_based,
    calculate_supplier_specific,
    calculate_activity_based,
    calculate_hybrid,
)

CATEGORY_CODE = "3.15"
CATEGORY_NAME = "Investments"