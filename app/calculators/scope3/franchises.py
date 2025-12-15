"""Category 3.14 – Franchises

Emissions from activities of franchisees operating under the
company’s brand【974843948574610†L234-L237】.  Franchise operations are
semi‑independent but still contribute to the parent company’s
carbon footprint.  Uses the generic calculation methods.
"""

from .base import (
    calculate_spend_based,
    calculate_supplier_specific,
    calculate_activity_based,
    calculate_hybrid,
)

CATEGORY_CODE = "3.14"
CATEGORY_NAME = "Franchises"