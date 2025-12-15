"""
Smart Emission Calculator
=========================

This module wraps the ``UnifiedEmissionEngine`` provided by
``unified_emission_engine.py`` and exposes a simple function
``calculate_with_transparency``.  The function returns a plain
dictionary containing all relevant fields needed by other parts of
the application (e.g., the interactive upload CLI).  It hides the
complexity of the engine's ``EmissionResult`` object and ensures
callers always receive a predictable structure.

Example
-------
>>> from smart_emission_calculator import calculate_with_transparency
>>> result = calculate_with_transparency(
...     db=None,
...     activity_type="diesel",
...     quantity=100,
...     unit="litre",
...     region="India"
... )
>>> result['co2e_kg']
268.0

Author: SHUB‑0510 (extended by assistant)
Date: 2025‑10‑18
"""

from typing import Dict, Optional
from sqlalchemy.orm import Session

from app.calculators.unified_emission_engine import get_engine


def calculate_with_transparency(
    db: Optional[Session],
    activity_type: str,
    quantity: float,
    unit: str,
    region: str = "India",
    description: Optional[str] = None,
    context: Optional[str] = None,
    company_id: Optional[int] = None
) -> Dict:
    """Calculate emissions and return a simple dictionary.

    Parameters
    ----------
    db : Optional[Session]
        Database session (currently unused but kept for future integration).
    activity_type : str
        Name of the activity (e.g., 'diesel', 'electricity').
    quantity : float
        Quantity consumed.
    unit : str
        Unit of the quantity (e.g., 'litre', 'kwh', 'km').
    region : str, optional
        Geographic region (default is 'India').
    description : Optional[str], optional
        Optional description of the activity (passed to the engine for context).
    context : Optional[str], optional
        Additional context for the calculation (e.g., 'production', 'transport').
    company_id : Optional[int], optional
        Company identifier for custom emission factors.

    Returns
    -------
    Dict
        A dictionary containing the calculated emissions and metadata.  Keys
        include 'co2e_kg', 'emission_factor_used', 'emission_factor_unit',
        'calculation_method', 'data_quality', 'confidence', and
        'factor_source'.
    """
    # Obtain the engine.  We call ``get_engine`` on demand to ensure the
    # databases are loaded and the engine is ready.  Reusing a single
    # instance across calls is acceptable as ``get_engine`` caches the engine.
    engine = get_engine()

    # Perform the calculation using the unified engine.  The engine
    # returns an ``EmissionResult`` dataclass which we convert into
    # a plain dictionary.
    result = engine.calculate_emissions(
        activity_type=activity_type,
        quantity=quantity,
        unit=unit,
        region=region,
        description=description or "",
        context=context or "",
        company_id=company_id
    )

    # Map the dataclass attributes to a flat dictionary.  Some fields are
    # renamed for clarity and to align with other parts of the application.
    return {
        'co2e_kg': result.co2e_kg,
        'emission_factor_used': result.emission_factor,
        'emission_factor_unit': result.emission_factor_unit,
        'calculation_method': result.calculation_method,
        'data_quality': result.data_quality,
        'confidence': result.confidence,
        'factor_source': result.source,
        'layer': result.layer,
        'match_details': result.match_details,
        'alternatives': result.alternatives,
        'error': result.error,
        'suggestion': result.suggestion,
        'timestamp': result.timestamp,
        'validation_warnings': result.validation_warnings
    }