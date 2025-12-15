"""Category 3.10 – Processing of sold products

Emissions from further processing of intermediate products sold by the
company【974843948574610†L212-L216】.  FMCG companies that sell
ingredients or components to other manufacturers typically report
under this category.  Uses the common calculation methods from
``.base``.
"""

from .base import (
    calculate_spend_based,
    calculate_supplier_specific,
    calculate_activity_based,
    calculate_hybrid,
)

CATEGORY_CODE = "3.10"
CATEGORY_NAME = "Processing of sold products"