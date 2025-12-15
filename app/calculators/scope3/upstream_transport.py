"""Category 3.4 – Upstream transport and distribution

Emissions from transporting and distributing products before they
reach the company, including third‑party logistics services
【974843948574610†L178-L181】.  Use the generic calculation functions from
``.base``.
"""

from .base import (
    calculate_spend_based,
    calculate_supplier_specific,
    calculate_activity_based,
    calculate_hybrid,
)

CATEGORY_CODE = "3.4"
CATEGORY_NAME = "Upstream transportation and distribution"