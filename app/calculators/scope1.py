"""
Scope 1 Calculator
===================

This module provides basic functions to calculate Scope 1 emissions from
stationary combustion (e.g. boilers, generators), mobile sources (company
vehicles), process emissions (industrial chemistry) and fugitive emissions
(refrigerant leaks).  The functions are intentionally simple; real
implementations should reference detailed emission factors from the
``EmissionFactor`` database and account for higher heating values, lower
heating values, and conversion units.
"""

from typing import Optional, Dict, Tuple

def calculate_stationary(fuel_quantity: float, emission_factor: float) -> float:
    """Calculate emissions for stationary combustion activities.

    Args:
        fuel_quantity: The amount of fuel consumed (in units consistent with
            emission_factor).
        emission_factor: Emission factor in kg CO₂e per unit of fuel.

    Returns:
        Emissions in kg CO₂e.
    """
    return fuel_quantity * emission_factor


def calculate_mobile(distance_km: float, emission_factor: float) -> float:
    """Calculate emissions for mobile sources based on distance.

    This simplified function assumes a constant emission factor per km.  More
    complex implementations may consider fuel type, vehicle efficiency and
    occupancy.
    """
    return distance_km * emission_factor


def calculate_process_emissions(process_output: float, emission_factor: float) -> float:
    """Estimate emissions from industrial process chemistry.

    Args:
        process_output: The quantity of material produced or processed.
        emission_factor: Emission factor per unit of output.

    Returns:
        Emissions in kg CO₂e.
    """
    return process_output * emission_factor


def calculate_fugitive_refrigerants(leak_mass: float, gwp: float) -> float:
    """Estimate emissions from refrigerant leaks.

    Args:
        leak_mass: Mass of refrigerant leaked (kg).
        gwp: Global warming potential of the refrigerant (kg CO₂e per kg).

    Returns:
        Emissions in kg CO₂e.
    """
    return leak_mass * gwp