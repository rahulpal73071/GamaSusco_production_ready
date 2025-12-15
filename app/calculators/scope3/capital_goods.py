"""Category 3.2 – Capital goods

Emissions from the production of capital goods purchased by the company.
Capital goods include physical assets with a long lifespan used to
manufacture products or provide services【974843948574610†L166-L170】.  This
module re‑exports the generic calculation methods.
"""

from .base import (
    calculate_spend_based,
    calculate_supplier_specific,
    calculate_activity_based,
    calculate_hybrid,
)

CATEGORY_CODE = "3.2"
CATEGORY_NAME = "Capital goods"