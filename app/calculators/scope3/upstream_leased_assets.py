"""Category 3.8 – Upstream leased assets

Emissions from the operation of assets leased by the company (not
already included in Scope 1 or 2), such as rented warehouses or
offices【974843948574610†L198-L201】.  See ``leased_asset_records`` model
for data storage.
"""

from .base import (
    calculate_spend_based,
    calculate_supplier_specific,
    calculate_activity_based,
    calculate_hybrid,
)

CATEGORY_CODE = "3.8"
CATEGORY_NAME = "Upstream leased assets"