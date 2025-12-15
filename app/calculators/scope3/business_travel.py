"""Category 3.6 – Business travel

Emissions from employee business travel in vehicles not owned or
controlled by the company, such as commercial flights or rental
cars【974843948574610†L188-L191】.  This module re‑exports the common
calculation functions.
"""

from .base import (
    calculate_spend_based,
    calculate_supplier_specific,
    calculate_activity_based,
    calculate_hybrid,
)

CATEGORY_CODE = "3.6"
CATEGORY_NAME = "Business travel"