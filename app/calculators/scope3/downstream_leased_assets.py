"""Category 3.13 – Downstream leased assets

Emissions from assets owned by the company but leased to others,
such as retail space or equipment【974843948574610†L229-L232】.  Uses the
common calculation helpers from ``.base``.
"""

from .base import (
    calculate_spend_based,
    calculate_supplier_specific,
    calculate_activity_based,
    calculate_hybrid,
)

CATEGORY_CODE = "3.13"
CATEGORY_NAME = "Downstream leased assets"