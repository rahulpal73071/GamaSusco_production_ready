"""Category 3.12 – End‑of‑life treatment of sold products

Emissions from disposing of or recycling products after customers are
done with them, including packaging waste management【974843948574610†L224-L227】.
Relies on generic calculation functions.
"""

from .base import (
    calculate_spend_based,
    calculate_supplier_specific,
    calculate_activity_based,
    calculate_hybrid,
)

CATEGORY_CODE = "3.12"
CATEGORY_NAME = "End-of-life treatment of sold products"