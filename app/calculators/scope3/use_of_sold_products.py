"""Category 3.11 – Use of sold products

Emissions from consumers and businesses using the company’s products
throughout their lifetime【974843948574610†L218-L222】.  Often the largest
downstream category for many products.  Provides access to the
generic calculation methods.
"""

from .base import (
    calculate_spend_based,
    calculate_supplier_specific,
    calculate_activity_based,
    calculate_hybrid,
)

CATEGORY_CODE = "3.11"
CATEGORY_NAME = "Use of sold products"