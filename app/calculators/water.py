"""
Water Footprint Calculator
=========================

This module contains simple helper functions for analysing water usage data.
It can compute intensity metrics, recycling rates and estimate indirect
emissions associated with pumping or treating water.
"""

from typing import Optional

def water_intensity(consumption_m3: float, output_units: float) -> Optional[float]:
    """Compute water intensity (m³ per unit of output).  Returns None if output is zero."""
    if output_units == 0:
        return None
    return consumption_m3 / output_units


def recycling_rate(recycled_m3: float, withdrawal_m3: float) -> Optional[float]:
    """Compute the recycling rate (0–1).  Returns None if withdrawal is zero."""
    if withdrawal_m3 == 0:
        return None
    return recycled_m3 / withdrawal_m3


def water_emissions(consumption_m3: float, emission_factor_per_m3: float) -> float:
    """Estimate indirect emissions from water use (e.g. pumping energy)."""
    return consumption_m3 * emission_factor_per_m3