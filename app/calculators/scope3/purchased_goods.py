"""Category 3.1 – Purchased goods and services

This module provides calculation helpers for Category 3.1 of the GHG
Protocol Scope 3 Standard.  Purchased goods and services emissions
come from the production of all goods and services that a company
purchases【974843948574610†L160-L166】.  Use the functions imported from
``.base`` to perform spend‑based, supplier‑specific, activity‑based
and hybrid calculations.
"""

from .base import (
    calculate_spend_based,
    calculate_supplier_specific,
    calculate_activity_based,
    calculate_hybrid,
)

CATEGORY_CODE = "3.1"
CATEGORY_NAME = "Purchased goods and services"