"""
Scope 2 Calculator
===================

This module provides helper functions to calculate Scope 2 emissions from
purchased electricity, heat and steam.  It distinguishes between
location‑based and market‑based accounting and can incorporate renewable
energy certificates (RECs).
"""

from typing import Optional


def calculate_location_based(consumption_kwh: float, grid_factor: float) -> float:
    """Calculate location‑based Scope 2 emissions.

    Args:
        consumption_kwh: Electricity consumption in kWh.
        grid_factor: Emission factor of the regional grid in kg CO₂e per kWh.

    Returns:
        Emissions in kg CO₂e.
    """
    return consumption_kwh * grid_factor


def calculate_market_based(consumption_kwh: float, residual_mix_factor: float,
                           recs_kwh: float = 0.0, rec_emission_factor: float = 0.0) -> float:
    """Calculate market‑based Scope 2 emissions accounting for renewable certificates.

    The market‑based approach uses supplier‑specific emission factors and can
    deduct renewable energy purchased via certificates.

    Args:
        consumption_kwh: Total electricity consumption.
        residual_mix_factor: Emission factor for electricity without renewable
            certificates (kg CO₂e per kWh).
        recs_kwh: Amount of consumption covered by RECs.
        rec_emission_factor: Emission factor for electricity covered by RECs
            (often 0 or near zero).

    Returns:
        Emissions in kg CO₂e.
    """
    non_rec_kwh = max(consumption_kwh - recs_kwh, 0)
    emissions_non_rec = non_rec_kwh * residual_mix_factor
    emissions_rec = recs_kwh * rec_emission_factor
    return emissions_non_rec + emissions_rec