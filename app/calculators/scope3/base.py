"""
Base functions for Scope 3 emission calculations.

These helper functions implement common calculation methods as
recommended by the GHG Protocol Scope 3 guidance.  All category
modules import and reuse these functions.
"""

from typing import Optional


def calculate_spend_based(spend: float, emission_factor: float) -> float:
    """Calculate emissions using a spend‑based method.

    Multiply the monetary spend by a spend‑based emission factor (e.g.
    kg CO₂e per unit of currency).  If either argument is missing,
    returns 0.
    """
    try:
        return float(spend or 0) * float(emission_factor or 0)
    except Exception:
        return 0.0


def calculate_supplier_specific(quantity: float, supplier_ef: float) -> float:
    """Calculate emissions using supplier‑specific data.

    Multiply an activity quantity (e.g. kg, km) by a supplier‑provided
    emission factor.  Returns 0 if inputs are invalid.
    """
    try:
        return float(quantity or 0) * float(supplier_ef or 0)
    except Exception:
        return 0.0


def calculate_activity_based(quantity: float, emission_factor: float) -> float:
    """Calculate emissions using activity data and a generic emission factor."""
    try:
        return float(quantity or 0) * float(emission_factor or 0)
    except Exception:
        return 0.0


def calculate_hybrid(spend: Optional[float], quantity: Optional[float], spend_ef: float, supplier_ef: float) -> float:
    """Calculate emissions using a hybrid method.

    Combine spend‑based and supplier‑specific emissions by summing the
    results.  Any missing components are treated as zero.
    """
    spend_emissions = calculate_spend_based(spend or 0, spend_ef or 0)
    supplier_emissions = calculate_supplier_specific(quantity or 0, supplier_ef or 0)
    return spend_emissions + supplier_emissions