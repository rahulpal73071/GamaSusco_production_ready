# app/ai/scope_classifier.py
"""
OPTIMIZED Scope Classifier
- Rule-based classification for 90% of activities (FREE, INSTANT)
- AI fallback for ambiguous cases only (10%)
"""
from openai import OpenAI
import json
from typing import Dict

from app.config import OPENAI_API_KEY, CLASSIFICATION_MODEL

client = OpenAI(api_key=OPENAI_API_KEY)

# ============================================================================
# RULE-BASED CLASSIFICATION (90% of activities)
# ============================================================================

# Pre-defined rules for common activity types
SCOPE_CLASSIFICATION_RULES = {
    # SCOPE 1 - Direct Emissions
    'diesel': ('Scope 1', '1.1', 'Stationary Combustion'),
    'petrol': ('Scope 1', '1.2', 'Mobile Combustion'),
    'gasoline': ('Scope 1', '1.2', 'Mobile Combustion'),
    'natural_gas': ('Scope 1', '1.1', 'Stationary Combustion'),
    'lpg': ('Scope 1', '1.1', 'Stationary Combustion'),
    'cng': ('Scope 1', '1.2', 'Mobile Combustion'),
    'coal': ('Scope 1', '1.1', 'Stationary Combustion'),
    'furnace_oil': ('Scope 1', '1.1', 'Stationary Combustion'),
    'kerosene': ('Scope 1', '1.1', 'Stationary Combustion'),
    'refrigerant': ('Scope 1', '1.3', 'Fugitive Emissions'),
    'refrigerant_r134a': ('Scope 1', '1.3', 'Fugitive Emissions'),
    'refrigerant_r410a': ('Scope 1', '1.3', 'Fugitive Emissions'),
    'refrigerant_r22': ('Scope 1', '1.3', 'Fugitive Emissions'),

    # SCOPE 2 - Purchased Energy
    'electricity': ('Scope 2', '2.1', 'Purchased Electricity'),
    'grid_electricity': ('Scope 2', '2.1', 'Purchased Electricity'),
    'power': ('Scope 2', '2.1', 'Purchased Electricity'),
    'steam': ('Scope 2', '2.2', 'Purchased Heat/Steam'),
    'district_heating': ('Scope 2', '2.2', 'Purchased Heat/Steam'),

    # SCOPE 3 - Business Travel
    'flight': ('Scope 3', '3.6', 'Business Travel'),
    'flight_domestic': ('Scope 3', '3.6', 'Business Travel'),
    'flight_international': ('Scope 3', '3.6', 'Business Travel'),
    'hotel': ('Scope 3', '3.6', 'Business Travel'),
    'hotel_budget': ('Scope 3', '3.6', 'Business Travel'),
    'hotel_economy': ('Scope 3', '3.6', 'Business Travel'),
    'hotel_business': ('Scope 3', '3.6', 'Business Travel'),
    'hotel_luxury': ('Scope 3', '3.6', 'Business Travel'),
    'taxi': ('Scope 3', '3.6', 'Business Travel'),
    'taxi_auto': ('Scope 3', '3.6', 'Business Travel'),
    'taxi_sedan': ('Scope 3', '3.6', 'Business Travel'),
    'taxi_suv': ('Scope 3', '3.6', 'Business Travel'),
    'train': ('Scope 3', '3.6', 'Business Travel'),
    'train_electric': ('Scope 3', '3.6', 'Business Travel'),
    'train_diesel': ('Scope 3', '3.6', 'Business Travel'),

    # SCOPE 3 - Employee Commuting
    'commute': ('Scope 3', '3.7', 'Employee Commuting'),
    'car_petrol': ('Scope 3', '3.7', 'Employee Commuting'),
    'car_diesel': ('Scope 3', '3.7', 'Employee Commuting'),
    'bus_public': ('Scope 3', '3.7', 'Employee Commuting'),
    'metro': ('Scope 3', '3.7', 'Employee Commuting'),
    'motorcycle': ('Scope 3', '3.7', 'Employee Commuting'),

    # SCOPE 3 - Waste
    'waste': ('Scope 3', '3.5', 'Waste Generated in Operations'),
    'waste_landfill': ('Scope 3', '3.5', 'Waste Generated in Operations'),
    'waste_incineration': ('Scope 3', '3.5', 'Waste Generated in Operations'),
    'waste_recycling': ('Scope 3', '3.5', 'Waste Generated in Operations'),
    'wastewater': ('Scope 3', '3.5', 'Waste Generated in Operations'),

    # SCOPE 3 - Water
    'water': ('Scope 3', '3.1', 'Purchased Goods & Services'),
    'water_supply': ('Scope 3', '3.1', 'Purchased Goods & Services'),

    # SCOPE 3 - Materials
    'steel': ('Scope 3', '3.1', 'Purchased Goods & Services'),
    'aluminum': ('Scope 3', '3.1', 'Purchased Goods & Services'),
    'plastic': ('Scope 3', '3.1', 'Purchased Goods & Services'),
    'paper': ('Scope 3', '3.1', 'Purchased Goods & Services'),
    'cardboard': ('Scope 3', '3.1', 'Purchased Goods & Services'),
    'concrete': ('Scope 3', '3.1', 'Purchased Goods & Services'),
    'cement': ('Scope 3', '3.1', 'Purchased Goods & Services'),

    # SCOPE 3 - Logistics
    'freight_air': ('Scope 3', '3.4', 'Upstream Transportation & Distribution'),
    'freight_truck': ('Scope 3', '3.4', 'Upstream Transportation & Distribution'),
    'freight_sea': ('Scope 3', '3.4', 'Upstream Transportation & Distribution'),
    'freight_rail': ('Scope 3', '3.4', 'Upstream Transportation & Distribution'),
}


def classify_scope_and_category(
        activity_description: str,
        category: str,
        quantity: float,
        unit: str,
        activity_type: str = None
) -> Dict:
    """
    OPTIMIZED: Rule-based first (90%), AI fallback (10%)

    Args:
        activity_description: Text description
        category: Rough category (if known)
        quantity: Amount
        unit: Unit of measurement
        activity_type: Explicit activity type (if known)

    Returns:
        {
            'scope': 'Scope 1/2/3',
            'sub_category': '1.1' | '2.1' | '3.6' etc,
            'category_name': 'Full category name',
            'reasoning': 'Brief explanation',
            'confidence': 0.95,
            'method': 'rule_based' or 'ai'
        }
    """

    # Step 1: Try rule-based classification (FAST & FREE)
    rule_result = try_rule_based_classification(
        activity_type,
        activity_description,
        category
    )

    if rule_result:
        print(f"   ✅ Rule-based: {rule_result['scope']} - {rule_result['category_name']}")
        return rule_result

    # Step 2: Fallback to AI (only for ambiguous cases ~10%)
    print(f"   🤖 Using AI for ambiguous case...")
    return classify_with_ai(activity_description, category, quantity, unit)


def try_rule_based_classification(
        activity_type: str,
        description: str,
        category: str
) -> Dict:
    """
    Try to classify using rules
    Returns None if ambiguous (needs AI)
    """

    # Check explicit activity_type first
    if activity_type:
        activity_lower = activity_type.lower().strip()

        # Direct match
        if activity_lower in SCOPE_CLASSIFICATION_RULES:
            scope, sub_cat, cat_name = SCOPE_CLASSIFICATION_RULES[activity_lower]
            return {
                'scope': scope,
                'sub_category': sub_cat,
                'category_name': cat_name,
                'reasoning': f'Rule-based: {activity_type}',
                'confidence': 0.95,
                'method': 'rule_based'
            }

        # Partial match
        for key, (scope, sub_cat, cat_name) in SCOPE_CLASSIFICATION_RULES.items():
            if key in activity_lower or activity_lower in key:
                return {
                    'scope': scope,
                    'sub_category': sub_cat,
                    'category_name': cat_name,
                    'reasoning': f'Rule-based: matched {key}',
                    'confidence': 0.90,
                    'method': 'rule_based'
                }

    # Check description + category
    combined_text = f"{description} {category}".lower()

    # Keyword matching with confidence scoring
    matches = []
    for key, (scope, sub_cat, cat_name) in SCOPE_CLASSIFICATION_RULES.items():
        if key in combined_text:
            matches.append((key, scope, sub_cat, cat_name))

    if len(matches) == 1:
        # Single clear match
        key, scope, sub_cat, cat_name = matches[0]
        return {
            'scope': scope,
            'sub_category': sub_cat,
            'category_name': cat_name,
            'reasoning': f'Rule-based: keyword {key}',
            'confidence': 0.85,
            'method': 'rule_based'
        }

    elif len(matches) > 1:
        # Multiple matches - pick most specific
        # Prioritize longer keywords (more specific)
        best_match = max(matches, key=lambda x: len(x[0]))
        key, scope, sub_cat, cat_name = best_match
        return {
            'scope': scope,
            'sub_category': sub_cat,
            'category_name': cat_name,
            'reasoning': f'Rule-based: best match {key}',
            'confidence': 0.80,
            'method': 'rule_based'
        }

    # No match - needs AI
    return None


def classify_with_ai(
        activity_description: str,
        category: str,
        quantity: float,
        unit: str
) -> Dict:
    """
    AI classification (fallback for ambiguous cases)
    """

    prompt = f"""
Classify this emission activity into GHG Protocol scope.

Activity: {activity_description}
Category: {category}
Quantity: {quantity} {unit}

Return ONLY valid JSON:
{{
    "scope": "Scope 1" OR "Scope 2" OR "Scope 3",
    "sub_category": "1.1" OR "2.1" OR "3.6" etc,
    "category_name": "Full category name",
    "reasoning": "Brief explanation",
    "confidence": 0.85
}}

GHG Protocol Rules:
- Scope 1: Direct emissions (fuel combustion, refrigerants)
- Scope 2: Purchased electricity/steam
- Scope 3: Supply chain (travel, commute, waste, materials)

Return ONLY JSON.
"""

    try:
        response = client.chat.completions.create(
            model=CLASSIFICATION_MODEL,
            messages=[
                {"role": "system", "content": "GHG Protocol expert. Return only JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,
            max_tokens=300
        )

        result_text = response.choices[0].message.content.strip()

        # Clean JSON
        if result_text.startswith('```json'):
            result_text = result_text[7:]
        if result_text.startswith('```'):
            result_text = result_text[3:]
        if result_text.endswith('```'):
            result_text = result_text[:-3]

        classification = json.loads(result_text.strip())
        classification['method'] = 'ai'

        return classification

    except Exception as e:
        print(f"   ⚠️ AI classification failed: {e}")
        # Ultimate fallback - NEVER return "unknown"
        return {
            'scope': 'Scope 3',
            'sub_category': '3.1',
            'category_name': 'Other',
            'reasoning': 'Fallback classification',
            'confidence': 0.50,
            'method': 'fallback'
        }


# ============================================================================
# STATISTICS TRACKING (optional - for monitoring)
# ============================================================================

_classification_stats = {
    'rule_based': 0,
    'ai': 0,
    'fallback': 0
}


def get_classification_stats():
    """Get statistics on classification methods used"""
    return _classification_stats.copy()


def reset_classification_stats():
    """Reset statistics"""
    global _classification_stats
    _classification_stats = {'rule_based': 0, 'ai': 0, 'fallback': 0}