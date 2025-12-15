"""
Waste Footprint Calculator
==========================

This module provides utility functions to analyse waste generation data.
Functions include calculation of diversion rates and emissions from waste
disposal.
"""

from typing import Optional

def diversion_rate(recycled_weight: float, total_weight: float) -> Optional[float]:
    """Compute the waste diversion rate (recycled / total).  Returns None if total is zero."""
    if total_weight == 0:
        return None
    return recycled_weight / total_weight


def waste_emissions(weight: float, emission_factor: float) -> float:
    """Estimate emissions from waste disposal given the emission factor."""
    return weight * emission_factor