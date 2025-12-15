"""Category 3.9 – Downstream transportation and distribution

Emissions from transporting and distributing products after they leave
the company, such as shipping finished goods to customers【974843948574610†L207-L210】.
This module provides calculation helpers via the base functions.
"""

from .base import (
    calculate_spend_based,
    calculate_supplier_specific,
    calculate_activity_based,
    calculate_hybrid,
)

CATEGORY_CODE = "3.9"
CATEGORY_NAME = "Downstream transportation and distribution"