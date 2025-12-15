"""
Energy Footprint Calculator
==========================

This module provides helper functions to compute energy intensity metrics and
total emissions for different energy sources.  It is designed to complement
Scope 2 calculations by providing per‑unit output intensities and renewable
energy ratios.
"""

from typing import Optional, Tuple

def intensity(consumption_kwh: float, output_units: float) -> Optional[float]:
    """Compute energy intensity (kWh per unit of output).

    Returns None if output_units is zero.
    """
    if output_units == 0:
        return None
    return consumption_kwh / output_units


def renewable_share(renewable_kwh: float, total_kwh: float) -> Optional[float]:
    """Calculate the share of renewable energy in total consumption (0–1).

    Returns None if total_kwh is zero.
    """
    if total_kwh == 0:
        return None
    return renewable_kwh / total_kwh


def energy_emissions(consumption_kwh: float, emission_factor: float) -> float:
    """Compute emissions for given energy consumption and emission factor."""
    return consumption_kwh * emission_factor