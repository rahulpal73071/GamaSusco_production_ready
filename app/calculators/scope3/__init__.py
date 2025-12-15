"""
Scope 3 Calculator Package
==========================

This package contains calculation modules for each of the 15 categories of
Scope 3 emissions defined by the GHG Protocol.  Each module exposes
functions for computing emissions using a variety of methods:

* ``calculate_spend_based(spend, emission_factor)`` – multiplies spend by an
  emissions factor (e.g. kg CO₂e per monetary unit) to estimate
  emissions.  This method is useful when only financial data is
  available【974843948574610†L272-L274】.
* ``calculate_supplier_specific(quantity, supplier_ef)`` – uses primary
  emission factors from suppliers for quantity‑based calculations【974843948574610†L265-L276】.
* ``calculate_activity_based(quantity, emission_factor)`` – multiplies
  activity data (distance, weight, etc.) by an emission factor.
* ``calculate_hybrid(spend, quantity, spend_ef, supplier_ef)`` – combines
  spend‑based and supplier‑specific approaches by summing their
  emissions.

Category‑specific modules import these functions from ``.base`` and do
not redefine them.  This design minimises code duplication and makes
it easy to update calculation logic in one place.
"""

from .base import (
    calculate_spend_based,
    calculate_supplier_specific,
    calculate_activity_based,
    calculate_hybrid,
)

# Import category modules so they can be discovered by services.
from . import purchased_goods
from . import capital_goods
from . import fuel_energy_upstream
from . import upstream_transport
from . import waste_generated_operations
from . import business_travel
from . import employee_commuting
from . import upstream_leased_assets
from . import downstream_transport
from . import processing_sold_products
from . import use_of_sold_products
from . import end_of_life
from . import downstream_leased_assets
from . import franchises
from . import investments

__all__ = [
    "calculate_spend_based",
    "calculate_supplier_specific",
    "calculate_activity_based",
    "calculate_hybrid",
    "purchased_goods",
    "capital_goods",
    "fuel_energy_upstream",
    "upstream_transport",
    "waste_generated_operations",
    "business_travel",
    "employee_commuting",
    "upstream_leased_assets",
    "downstream_transport",
    "processing_sold_products",
    "use_of_sold_products",
    "end_of_life",
    "downstream_leased_assets",
    "franchises",
    "investments",
]