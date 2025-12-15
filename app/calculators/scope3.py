"""
Scope 3 Calculators
====================

This module contains simplified calculators for each of the fifteen categories
of Scope 3 emissions as defined by the GHG Protocol.  Each function takes
activity data (e.g. spend, quantity) and an emission factor and returns
estimated emissions.  Real implementations should account for supply chain
specifics, supplier‑specific data and life‑cycle assessment models.
"""

from typing import Dict, Any

def generic_calculator(quantity: float, emission_factor: float) -> float:
    """Generic calculation: emissions = quantity × emission_factor"""
    return quantity * emission_factor


# 3.1 Purchased goods and services
def purchased_goods(spend: float, emission_factor: float) -> float:
    return spend * emission_factor

# 3.2 Capital goods
def capital_goods(spend: float, emission_factor: float) -> float:
    return spend * emission_factor

# 3.3 Fuel and energy related activities (not included in Scope 1 or 2)
def fuel_energy_related(quantity: float, emission_factor: float) -> float:
    return quantity * emission_factor

# 3.4 Upstream transport and distribution
def upstream_transport(distance_tkm: float, emission_factor: float) -> float:
    return distance_tkm * emission_factor

# 3.5 Waste generated in operations
def waste_generated(weight: float, emission_factor: float) -> float:
    return weight * emission_factor

# 3.6 Business travel
def business_travel(distance_km: float, emission_factor: float) -> float:
    return distance_km * emission_factor

# 3.7 Employee commuting
def employee_commuting(distance_km: float, emission_factor: float) -> float:
    return distance_km * emission_factor

# 3.8 Upstream leased assets
def upstream_leased_assets(quantity: float, emission_factor: float) -> float:
    return quantity * emission_factor

# 3.9 Downstream transport and distribution
def downstream_transport(distance_tkm: float, emission_factor: float) -> float:
    return distance_tkm * emission_factor

# 3.10 Processing of sold products
def processing_of_sold_products(quantity: float, emission_factor: float) -> float:
    return quantity * emission_factor

# 3.11 Use of sold products
def use_of_sold_products(quantity: float, emission_factor: float) -> float:
    return quantity * emission_factor

# 3.12 End‑of‑life treatment of sold products
def end_of_life(quantity: float, emission_factor: float) -> float:
    return quantity * emission_factor

# 3.13 Downstream leased assets
def downstream_leased_assets(quantity: float, emission_factor: float) -> float:
    return quantity * emission_factor

# 3.14 Franchises
def franchises(quantity: float, emission_factor: float) -> float:
    return quantity * emission_factor

# 3.15 Investments
def investments(quantity: float, emission_factor: float) -> float:
    return quantity * emission_factor