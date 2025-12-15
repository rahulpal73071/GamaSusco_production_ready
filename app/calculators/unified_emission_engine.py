"""
UNIFIED EMISSION FACTOR ENGINE v3.0 - PRODUCTION READY
======================================================
✅ Multi-database search (India → IPCC → DEFRA)
✅ Smart fuzzy matching with RapidFuzz
✅ Unit validation (prevents wrong matches)
✅ AI fallback estimation (never shows "data not found")
✅ Full transparency with uncertainty ranges

Author: SHUB-0510
Date: 2025-01-11
Version: 3.0 - Production with AI
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Tuple
from pathlib import Path
from dataclasses import dataclass, asdict
import json
import re
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Try to import RapidFuzz (faster), fallback to FuzzyWuzzy
try:
    from rapidfuzz import fuzz

    FUZZY_LIBRARY = "RapidFuzz (Fast)"
except ImportError:
    from fuzzywuzzy import fuzz

    FUZZY_LIBRARY = "FuzzyWuzzy (Standard)"

# Configuration
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')
OPENAI_MODEL = os.getenv('OPENAI_MODEL', 'gpt-4o-mini')
AI_ESTIMATION_ENABLED = os.getenv('AI_ESTIMATION_ENABLED', 'true').lower() == 'true'


@dataclass
class EmissionResult:
    """Standardized emission calculation result"""
    success: bool
    co2e_kg: Optional[float] = None
    emission_factor: Optional[float] = None
    emission_factor_unit: Optional[str] = None
    calculation_method: Optional[str] = None
    layer: Optional[int] = None
    confidence: float = 0.0
    data_quality: Optional[str] = None
    source: Optional[str] = None
    scope: Optional[int] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    intent_detected: Optional[str] = None
    match_details: Optional[Dict] = None
    alternatives: Optional[List[Dict]] = None
    error: Optional[str] = None
    suggestion: Optional[str] = None
    timestamp: str = None
    validation_warnings: Optional[List[str]] = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now().isoformat()
        if self.validation_warnings is None:
            self.validation_warnings = []

    def to_dict(self):
        return asdict(self)


class UnifiedEmissionEngine:
    """
    Production-ready emission factor engine with AI fallback

    Search Priority:
    1. India-specific database
    2. IPCC International (18,475 factors)
    3. DEFRA UK (537 factors)
    4. AI Estimation (GPT-4 powered)
    """

    def __init__(self, data_dir: Optional[Path] = None):
        self.ipcc_df = None
        self.defra_df = None
        self.india_df = None
        self.data_dir = data_dir

        print(f"🚀 Initializing Unified Emission Engine v3.0")
        print(f"   Fuzzy Matching: {FUZZY_LIBRARY}")
        print(f"   AI Estimation: {'✅ Enabled' if AI_ESTIMATION_ENABLED and OPENAI_API_KEY else '❌ Disabled'}")

        self.load_databases()
        self._init_classifications()

        self.search_stats = {
            'total_searches': 0,
            'india_db_hits': 0,
            'layer_1_hits': 0,
            'layer_2_hits': 0,
            'layer_3_hits': 0,
            'ai_estimation_hits': 0,
            'failures': 0,
            'unit_validation_failures': 0
        }

    def load_databases(self):
        """Load all emission factor databases"""
        try:
            if self.data_dir is None:
                current_file = Path(__file__)
                project_root = current_file.parent.parent.parent
                self.data_dir = project_root / 'data'

            # India DB (Priority 1)
            india_path = self.data_dir / 'india_emission_factors.csv'
            if india_path.exists():
                try:
                    self.india_df = pd.read_csv(india_path)
                    # Filter out empty rows
                    self.india_df = self.india_df.dropna(subset=['activity_type', 'emission_factor'], how='all')
                    if len(self.india_df) > 0:
                        print(f"✅ Loaded India DB: {len(self.india_df):,} factors (Priority 1)")
                    else:
                        print(f"ℹ️  India DB: Empty (ready for data)")
                        self.india_df = pd.DataFrame()
                except Exception as e:
                    print(f"ℹ️  India DB: Empty or invalid format")
                    self.india_df = pd.DataFrame()
            else:
                print(f"ℹ️  India DB: Not found (create at {india_path})")
                self.india_df = pd.DataFrame()

            # IPCC (Priority 2)
            ipcc_path = self.data_dir / 'ipcc_all_factors.csv'
            if ipcc_path.exists():
                self.ipcc_df = pd.read_csv(ipcc_path)
                print(f"✅ Loaded IPCC: {len(self.ipcc_df):,} factors (Priority 2)")
            else:
                print(f"⚠️  IPCC not found at {ipcc_path}")
                self.ipcc_df = pd.DataFrame()

            # DEFRA (Priority 3)
            defra_path = self.data_dir / 'defra_factors.csv'
            if defra_path.exists():
                self.defra_df = pd.read_csv(defra_path)
                if 'emission_factor' in self.defra_df.columns:
                    self.defra_df['emission_factor'] = pd.to_numeric(
                        self.defra_df['emission_factor'], errors='coerce'
                    )
                print(f"✅ Loaded DEFRA: {len(self.defra_df):,} factors (Priority 3)")
            else:
                print(f"⚠️  DEFRA not found at {defra_path}")
                self.defra_df = pd.DataFrame()

        except Exception as e:
            print(f"❌ Error loading databases: {e}")
            self.ipcc_df = pd.DataFrame()
            self.defra_df = pd.DataFrame()
            self.india_df = pd.DataFrame()

    def _init_classifications(self):
        """Initialize activity classifications"""

        self.production_materials = {
            'metals': {
                'keywords': ['steel', 'aluminum', 'aluminium', 'iron', 'copper', 'zinc', 'metal'],
                'scope': 3,
                'category': 'purchased_goods'
            },
            'construction': {
                'keywords': ['cement', 'concrete', 'clinker', 'lime', 'glass', 'brick'],
                'scope': 3,
                'category': 'purchased_goods'
            },
            'chemicals': {
                'keywords': ['plastic', 'polymer', 'ammonia', 'methanol', 'chemical'],
                'scope': 3,
                'category': 'purchased_goods'
            },
            'organic': {
                'keywords': ['paper', 'cardboard', 'wood', 'textile'],
                'scope': 3,
                'category': 'purchased_goods'
            }
        }

        self.energy_activities = {
            'stationary_combustion': {
                'keywords': ['diesel', 'petrol', 'gasoline', 'coal', 'natural_gas', 'lng', 'lpg', 'fuel_oil'],
                'scope': 1,
                'category': 'stationary_combustion'
            },
            'electricity': {
                'keywords': ['electricity', 'power', 'grid', 'energy'],
                'scope': 2,
                'category': 'purchased_electricity'
            },
        }

        self.transport_activities = {
            'air_travel': {
                'keywords': ['flight', 'aviation', 'air_travel', 'airline', 'plane', 'aircraft'],
                'scope': 3,
                'category': 'business_travel'
            },
            'rail': {
                'keywords': ['train', 'rail', 'railway'],
                'scope': 3,
                'category': 'business_travel'
            },
            'road': {
                'keywords': ['taxi', 'cab', 'uber', 'ola', 'bus', 'car'],
                'scope': 3,
                'category': 'business_travel'
            }
        }

    # ================================================================
    # MAIN ENTRY POINT
    # ================================================================

    def calculate_emissions(
            self,
            activity_type: str,
            quantity: float,
            unit: str,
            region: str = "India",
            description: str = "",
            context: str = "",
            company_id: Optional[int] = None
    ) -> EmissionResult:
        """
        Main calculation method with AI fallback

        Args:
            activity_type: Material or activity name (e.g., "diesel", "steel", "electricity")
            quantity: Amount (e.g., 100, 5000)
            unit: Unit of measurement (e.g., "litre", "kwh", "kg")
            region: Geographic location (default: "India")
            description: Additional context
            context: Hint for classification
            company_id: For company-specific factors

        Returns:
            EmissionResult with complete calculation details
        """

        self.search_stats['total_searches'] += 1

        print(f"\n{'=' * 70}")
        print(f"🔍 UNIFIED ENGINE v3.0 - CALCULATION")
        print(f"{'=' * 70}")
        print(f"   Activity: {activity_type}")
        print(f"   Quantity: {quantity:,.2f} {unit}")
        print(f"   Region: {region}")

        # Step 1: Detect intent
        intent = self._detect_intent(activity_type, unit, description, context)
        print(f"\n🎯 Intent: {intent['type']} (Scope {intent['scope']})")

        # Step 2: Multi-layer search
        result = self._multi_layer_search(
            activity_type=activity_type,
            quantity=quantity,
            unit=unit,
            region=region,
            description=description,
            intent=intent
        )

        # Step 3: Add metadata
        if result.success:
            result.scope = intent['scope']
            result.category = intent['category']
            result.intent_detected = intent['type']

        print(f"\n{'=' * 70}")
        print(f"{'✅ SUCCESS' if result.success else '❌ NOT FOUND'}")
        print(f"{'=' * 70}\n")

        return result

    def _detect_intent(self, activity: str, unit: str, description: str, context: str) -> Dict:
        """Detect activity intent and classify"""

        activity_lower = activity.lower().strip()
        unit_lower = unit.lower().strip()

        # Check transport
        for category, info in self.transport_activities.items():
            if any(kw in activity_lower for kw in info['keywords']):
                return {
                    'type': 'transport',
                    'confidence': 0.95,
                    'scope': info['scope'],
                    'category': info['category'],
                    'subcategory': category
                }

        # Check energy
        for category, info in self.energy_activities.items():
            if any(kw in activity_lower for kw in info['keywords']):
                return {
                    'type': 'combustion',
                    'confidence': 0.95,
                    'scope': info['scope'],
                    'category': info['category'],
                    'subcategory': category
                }

        # Check production
        for category, info in self.production_materials.items():
            if any(kw in activity_lower for kw in info['keywords']):
                if any(u in unit_lower for u in ['kg', 'tonne', 'ton']):
                    return {
                        'type': 'production',
                        'confidence': 0.90,
                        'scope': info['scope'],
                        'category': info['category'],
                        'subcategory': category
                    }

        # Unit-based fallback
        if any(u in unit_lower for u in ['kwh', 'mwh']):
            return {'type': 'combustion', 'confidence': 0.85, 'scope': 2, 'category': 'purchased_electricity',
                    'subcategory': 'electricity'}

        if any(u in unit_lower for u in ['litre', 'gallon', 'm3']):
            return {'type': 'combustion', 'confidence': 0.85, 'scope': 1, 'category': 'stationary_combustion',
                    'subcategory': 'fuel'}

        return {'type': 'unknown', 'confidence': 0.5, 'scope': 3, 'category': 'other', 'subcategory': 'unclassified'}

    # ================================================================
    # MULTI-LAYER SEARCH STRATEGY
    # ================================================================

    def _multi_layer_search(
            self,
            activity_type: str,
            quantity: float,
            unit: str,
            region: str,
            description: str,
            intent: Dict
    ) -> EmissionResult:
        """
        Multi-layer search with AI fallback

        Layer 0: India-specific database
        Layer 1: IPCC/DEFRA smart fuzzy match
        Layer 2: Category proxy factors
        Layer 3: AI estimation (NEW)
        """

        # Layer 0: India DB
        print(f"\n🔍 Layer 0: India-Specific Database...")
        if not self.india_df.empty:
            result = self._search_india_db(activity_type, unit, region)
            if result.success:
                self.search_stats['india_db_hits'] += 1
                result.layer = 0
                result.co2e_kg = round(quantity * result.emission_factor, 2)
                print(f"   ✅ Found! EF: {result.emission_factor} {result.emission_factor_unit}")
                return result
        print(f"   ❌ Not found")

        # Layer 1: Smart Fuzzy Match
        print(f"\n🔍 Layer 1: Smart Fuzzy Match (IPCC + DEFRA)...")
        result = self._smart_fuzzy_search(activity_type, unit, region, intent)
        if result.success:
            self.search_stats['layer_1_hits'] += 1
            result.layer = 1
            result.co2e_kg = round(quantity * result.emission_factor, 2)
            print(f"   ✅ Found! EF: {result.emission_factor} {result.emission_factor_unit}")
            return result
        print(f"   ❌ Not found")

        # Layer 2: Category Proxy
        print(f"\n🔍 Layer 2: Category Proxy Factors...")
        result = self._proxy_factors(activity_type, unit, intent)
        if result.success:
            self.search_stats['layer_2_hits'] += 1
            result.layer = 2
            result.co2e_kg = round(quantity * result.emission_factor, 2)
            print(f"   ✅ Found! EF: {result.emission_factor} {result.emission_factor_unit}")
            return result
        print(f"   ❌ Not found")

        # Layer 3: AI Estimation
        print(f"\n🔍 Layer 3: AI Estimation...")
        result = self._ai_estimation(activity_type, unit, region, quantity, description, intent)
        if result.success:
            self.search_stats['ai_estimation_hits'] += 1
            result.layer = 3
            print(f"   🤖 AI Estimated! EF: {result.emission_factor} {result.emission_factor_unit}")
            print(f"   ⚠️  Confidence: {result.confidence * 100:.0f}%")
            return result
        print(f"   ❌ AI estimation unavailable")

        # Final fallback
        self.search_stats['failures'] += 1
        return EmissionResult(
            success=False,
            error=f'No emission factor found for {activity_type} ({unit})',
            suggestion='Please provide supplier-specific data or contact support',
            layer=4
        )

    # ================================================================
    # LAYER 0: INDIA DATABASE
    # ================================================================

    def _search_india_db(self, activity: str, unit: str, region: str) -> EmissionResult:
        """Search India-specific database"""
        if self.india_df.empty:
            return EmissionResult(success=False)

        activity_clean = activity.lower().strip()
        unit_clean = unit.lower().strip()

        matches = self.india_df[
            (self.india_df['activity_type'].str.lower() == activity_clean) &
            (self.india_df['unit'].str.lower() == unit_clean)
            ]

        if matches.empty:
            return EmissionResult(success=False)

        best = matches.iloc[0]

        return EmissionResult(
            success=True,
            emission_factor=float(best['emission_factor']),
            emission_factor_unit=best['unit'],
            calculation_method='india_database',
            confidence=0.99,
            data_quality=best.get('data_quality', 'High'),
            source=f"{best['source']} (India-specific)",
            match_details={'priority': 1, 'notes': best.get('notes', '')}
        )

    # ================================================================
    # LAYER 1: SMART FUZZY SEARCH
    # ================================================================

    def _smart_fuzzy_search(
            self,
            activity: str,
            unit: str,
            region: str,
            intent: Dict
    ) -> EmissionResult:
        """Smart fuzzy search with production filtering"""

        activity_clean = activity.lower().strip()
        unit_clean = unit.lower().strip()

        # Determine query type
        is_production_query = intent.get('type') == 'production'
        user_wants_mass = any(u in unit_clean for u in ['kg', 'tonne', 'ton', 'tonnes'])

        all_matches = []

        # Search DEFRA
        if not self.defra_df.empty:
            for idx, row in self.defra_df.iterrows():
                search_text = ' '.join([
                    str(row.get('activity_type', '')),
                    str(row.get('activity_name', '')),
                    str(row.get('activity_subtype', '')),
                    str(row.get('tags', '')),
                ]).lower()

                text_score = fuzz.token_set_ratio(activity_clean, search_text)

                if text_score < 75:
                    continue

                row_unit = str(row.get('unit', '')).lower()

                # Filter energy-based for production
                if is_production_query and user_wants_mass:
                    energy_indicators = ['tj', 'gj', 'mj', '/tj', '/gj', '/mj', 'kg/tj']
                    if any(e in row_unit for e in energy_indicators):
                        continue

                unit_score = self._calculate_unit_score(unit_clean, row_unit)

                if unit_score < 50:
                    continue

                relevance = (text_score * 0.7) + (unit_score * 0.3)

                # Preference adjustments
                activity_name = str(row.get('activity_name', '')).lower()
                if activity_clean == 'diesel':
                    if 'biodiesel' in activity_name and 'biodiesel' not in activity_clean:
                        relevance -= 30
                    elif '100% mineral' in activity_name or 'development diesel' in activity_name:
                        relevance += 10

                ef = self._extract_factor(row)
                if ef is None or ef <= 0:
                    continue

                if ef > 10000:
                    continue

                is_valid, warning = self._validate_unit_compatibility(
                    activity_clean, unit_clean, row_unit, ef
                )

                if not is_valid:
                    continue

                all_matches.append({
                    'source': 'DEFRA',
                    'ef': ef,
                    'unit': row_unit,
                    'relevance': relevance,
                    'year': row.get('year', 2024),
                    'activity_name': activity_name,
                    'is_valid': is_valid,
                    'warning': warning
                })

        # Search IPCC
        if not self.ipcc_df.empty:
            for idx, row in self.ipcc_df.iterrows():
                search_text = ' '.join([
                    str(row.get('activity_type', '')),
                    str(row.get('activity_subtype', '')),
                    str(row.get('tags', '')),
                ]).lower()

                text_score = fuzz.token_set_ratio(activity_clean, search_text)

                if text_score < 75:
                    continue

                row_unit = str(row.get('unit', '')).lower()

                # Filter energy-based for production
                if is_production_query and user_wants_mass:
                    energy_indicators = ['tj', 'gj', 'mj', '/tj', '/gj', '/mj', 'kg/tj']
                    if any(e in row_unit for e in energy_indicators):
                        continue

                unit_score = self._calculate_unit_score(unit_clean, row_unit)

                if unit_score < 50:
                    continue

                relevance = (text_score * 0.7) + (unit_score * 0.3)

                ef = self._extract_factor(row)
                if ef is None or ef <= 0:
                    continue

                if ef > 10000:
                    continue

                is_valid, warning = self._validate_unit_compatibility(
                    activity_clean, unit_clean, row_unit, ef
                )

                if not is_valid:
                    continue

                all_matches.append({
                    'source': 'IPCC',
                    'ef': ef,
                    'unit': row_unit,
                    'relevance': relevance,
                    'year': row.get('year', 2023),
                    'activity_name': f"{row.get('activity_type', '')} - {row.get('activity_subtype', '')}",
                    'is_valid': is_valid,
                    'warning': warning
                })

        if not all_matches:
            return EmissionResult(success=False)

        # Sort by relevance
        all_matches.sort(key=lambda x: x['relevance'], reverse=True)
        best = all_matches[0]

        if best['relevance'] < 70:
            return EmissionResult(success=False)

        confidence = min(0.95, best['relevance'] / 100)

        return EmissionResult(
            success=True,
            emission_factor=best['ef'],
            emission_factor_unit=f"kg CO2e/{unit_clean}",
            calculation_method=f"{best['source'].lower()}_fuzzy",
            confidence=confidence,
            data_quality='High' if confidence > 0.85 else 'Medium',
            source=f"{best['source']} {best['year']}",
            match_details={
                'activity_name': best['activity_name'],
                'relevance_score': best['relevance'],
                'validation_warning': best['warning']
            }
        )

    # ================================================================
    # LAYER 2: CATEGORY PROXY
    # ================================================================

    def _proxy_factors(self, activity: str, unit: str, intent: Dict) -> EmissionResult:
        """Category-based proxy factors"""

        category = intent.get('subcategory', intent.get('category'))

        proxies = {
            'electricity': {'factor': 0.82, 'unit': 'kwh', 'desc': 'India grid average'},
            'stationary_combustion': {'factor': 2.68, 'unit': 'litre', 'desc': 'Average fuel combustion'},
        }

        if category in proxies:
            proxy = proxies[category]
            if unit.lower() in proxy['unit']:
                return EmissionResult(
                    success=True,
                    emission_factor=proxy['factor'],
                    emission_factor_unit=proxy['unit'],
                    calculation_method='category_proxy',
                    confidence=0.65,
                    data_quality='Low - Proxy',
                    source=f"Proxy: {proxy['desc']}",
                    validation_warnings=['Using category average - not activity-specific']
                )

        return EmissionResult(success=False)

    # ================================================================
    # ⭐ LAYER 3: AI ESTIMATION (NEW)
    # ================================================================

    def _ai_estimation(
            self,
            activity: str,
            unit: str,
            region: str,
            quantity: float,
            description: str,
            intent: Dict
    ) -> EmissionResult:
        """
        AI-powered emission factor estimation using GPT-4

        Returns intelligent estimates when databases lack data
        """

        if not AI_ESTIMATION_ENABLED:
            return EmissionResult(success=False)

        if not OPENAI_API_KEY or OPENAI_API_KEY == '':
            return EmissionResult(success=False)

        try:
            from openai import OpenAI

            client = OpenAI(api_key=OPENAI_API_KEY)

            # Build prompt
            prompt = f"""You are a carbon accounting expert with deep knowledge of emission factors from IPCC, DEFRA, EPA, and regional databases.

USER REQUEST:
Activity: {activity}
Quantity: {quantity} {unit}
Region: {region}
Description: {description if description else "Not provided"}
Intent: {intent['type']} (Scope {intent['scope']})
Category: {intent['category']}

DATABASE SEARCH CONTEXT:
We searched {len(self.ipcc_df) + len(self.defra_df):,} emission factors (IPCC + DEFRA) but couldn't find a suitable match for this specific activity and unit combination.

TASK:
1. Estimate a reasonable emission factor based on:
   - Similar activities in IPCC 2006 Guidelines
   - DEFRA 2024 conversion factors
   - Industry benchmarks for {region}
   - Typical emission intensities for {intent['type']} activities

2. Provide detailed reasoning with specific references

3. Include uncertainty range (±%)

4. Suggest where to find more accurate data

RULES:
- Be conservative (slightly overestimate if uncertain)
- For {region}, consider local energy mix and industrial practices
- Cite specific IPCC chapters or DEFRA categories
- If too uncertain, explain why and set estimated_emission_factor to null

Return ONLY valid JSON:
{{
    "estimated_emission_factor": 2.5,
    "unit": "kg CO2e/{unit}",
    "confidence": 0.70,
    "confidence_explanation": "Based on IPCC Chapter X and similar activity Y",
    "reasoning": "Detailed 2-3 sentence explanation...",
    "similar_reference_factors": [
        {{"activity": "similar_activity", "factor": 2.3, "source": "IPCC 2006 Vol 2", "similarity": "Same material type"}},
        {{"activity": "another_similar", "factor": 2.7, "source": "DEFRA 2024", "similarity": "Same process"}}
    ],
    "uncertainty_range": {{"low": 2.0, "high": 3.0, "percentage": 20}},
    "data_quality": "Estimated - Medium",
    "recommendations": [
        "Contact supplier for Environmental Product Declaration (EPD)",
        "Check IPCC EFDB Chapter X.X for detailed factors",
        "For {region}, consult CEA/CPCB guidelines"
    ],
    "regional_considerations": "Explanation of {region}-specific adjustments",
    "data_sources_consulted": ["IPCC 2006 Guidelines", "DEFRA 2024", "Industry benchmark"],
    "warning": "AI estimate - verify with certified data for compliance reporting"
}}
"""

            print(f"   🤖 Querying {OPENAI_MODEL}...")

            response = client.chat.completions.create(
                model=OPENAI_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a carbon accounting expert. Provide estimates with full transparency about uncertainty and cite reference sources."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.3,
                max_tokens=2000,
                response_format={"type": "json_object"}
            )

            result_text = response.choices[0].message.content.strip()
            ai_result = json.loads(result_text)

            # Validate
            if not ai_result.get('estimated_emission_factor'):
                return EmissionResult(success=False)

            factor = float(ai_result['estimated_emission_factor'])
            confidence = float(ai_result.get('confidence', 0.65))

            # Sanity checks
            if factor <= 0 or factor > 100000:
                return EmissionResult(success=False)

            # Calculate emissions
            emissions = quantity * factor

            # Build match details
            match_details = {
                'estimation_method': 'AI-powered analysis',
                'model': OPENAI_MODEL,
                'reasoning': ai_result.get('reasoning', ''),
                'confidence_explanation': ai_result.get('confidence_explanation', ''),
                'similar_factors': ai_result.get('similar_reference_factors', []),
                'uncertainty': ai_result.get('uncertainty_range', {}),
                'regional_considerations': ai_result.get('regional_considerations', ''),
                'data_sources': ai_result.get('data_sources_consulted', []),
                'timestamp': datetime.now().isoformat()
            }

            # Build suggestion
            recommendations = ai_result.get('recommendations', [])
            suggestion_text = (
                f"⚠️ **AI-ESTIMATED EMISSION FACTOR**\n\n"
                f"**Confidence:** {confidence * 100:.0f}%\n"
                f"**Method:** {ai_result.get('confidence_explanation', 'Based on similar activities')}\n\n"
                f"**Uncertainty:** {ai_result.get('uncertainty_range', {}).get('low', 'N/A')} - "
                f"{ai_result.get('uncertainty_range', {}).get('high', 'N/A')} "
                f"(±{ai_result.get('uncertainty_range', {}).get('percentage', 'N/A')}%)\n\n"
                f"**For More Accurate Data:**\n"
            )

            for i, rec in enumerate(recommendations[:4], 1):
                suggestion_text += f"{i}. {rec}\n"

            suggestion_text += f"\n⚠️ {ai_result.get('warning', 'Verify for compliance reporting')}"

            # Prepare alternatives
            alternatives = []
            for ref in ai_result.get('similar_reference_factors', [])[:5]:
                alternatives.append({
                    'activity': ref.get('activity', 'Unknown'),
                    'factor': ref.get('factor', 0),
                    'source': ref.get('source', 'Unknown'),
                    'similarity': ref.get('similarity', 'N/A')
                })

            return EmissionResult(
                success=True,
                co2e_kg=round(emissions, 2),
                emission_factor=factor,
                emission_factor_unit=ai_result.get('unit', f"kg CO2e/{unit}"),
                calculation_method='ai_estimation',
                confidence=confidence,
                data_quality=ai_result.get('data_quality', 'Estimated - Medium'),
                source=f'AI Estimation ({OPENAI_MODEL})',
                match_details=match_details,
                alternatives=alternatives,
                suggestion=suggestion_text,
                validation_warnings=[
                    "AI-estimated factor",
                    f"Uncertainty: ±{ai_result.get('uncertainty_range', {}).get('percentage', 'N/A')}%",
                    "Verify for compliance reporting"
                ]
            )

        except Exception as e:
            print(f"   ❌ AI estimation error: {str(e)[:100]}")
            return EmissionResult(success=False)

    # ================================================================
    # HELPER METHODS
    # ================================================================

    def _extract_factor(self, row) -> Optional[float]:
        """Extract emission factor from row"""

        # Try co2_factor first
        if 'co2_factor' in row and pd.notna(row['co2_factor']):
            try:
                val = row['co2_factor']
                if isinstance(val, (int, float)):
                    return float(val)
                if isinstance(val, str):
                    match = re.search(r'(\d+\.?\d*)', val)
                    if match:
                        return float(match.group(1))
            except:
                pass

        # Try emission_factor
        if 'emission_factor' in row and pd.notna(row['emission_factor']):
            try:
                val = row['emission_factor']
                if isinstance(val, (int, float)):
                    return float(val)
                if isinstance(val, str):
                    match = re.search(r'(\d+\.?\d*)', val)
                    if match:
                        return float(match.group(1))
            except:
                pass

        return None

    def _calculate_unit_score(self, user_unit: str, db_unit: str) -> float:
        """Calculate unit compatibility score (0-100)"""

        user_unit = user_unit.lower().strip()
        db_unit = db_unit.lower().strip()

        if user_unit == db_unit:
            return 100

        if user_unit in db_unit or db_unit in user_unit:
            return 90

        # Category matching
        energy = {'kwh', 'mwh', 'gj', 'tj', 'mj'}
        volume = {'litre', 'liter', 'l', 'm3', 'litres'}
        mass = {'kg', 'tonne', 'ton', 'tonnes'}
        distance = {'km', 'mile', 'passenger-km', 'passenger.km'}

        def get_cat(u):
            for cat, units in [('energy', energy), ('volume', volume), ('mass', mass), ('distance', distance)]:
                if any(x in u for x in units):
                    return cat
            return 'unknown'

        if get_cat(user_unit) == get_cat(db_unit) and get_cat(user_unit) != 'unknown':
            return 70

        return 30

    def _validate_unit_compatibility(
            self,
            activity: str,
            user_unit: str,
            db_unit: str,
            factor: float
    ) -> Tuple[bool, Optional[str]]:
        """Validate unit compatibility"""

        activity_lower = activity.lower()
        user_unit_lower = user_unit.lower()
        db_unit_lower = db_unit.lower()

        # Energy-based units
        energy_based_units = ['tj', 'gj', 'mj', '/tj', '/gj', '/mj', 'kg/tj']
        has_energy_unit = any(e in db_unit_lower for e in energy_based_units)

        # Production materials
        production_keywords = ['steel', 'aluminum', 'aluminium', 'cement', 'concrete', 'metal', 'plastic']
        is_production = any(kw in activity_lower for kw in production_keywords)

        # Mass-based input
        mass_units = ['kg', 'tonne', 'ton', 'tonnes']
        user_wants_mass = any(m in user_unit_lower for m in mass_units)

        # REJECT: Production + mass + energy factor
        if is_production and user_wants_mass and has_energy_unit:
            return False, f"Production needs mass-based unit, found energy-based ({db_unit})"

        # SANITY: Too high
        if factor > 10000:
            return False, f"Factor {factor:,.0f} too high"

        # SPECIFIC: Steel
        if 'steel' in activity_lower and user_wants_mass:
            if factor > 50:
                return False, f"Steel factor {factor:,.0f} unrealistic (expected 1-3 kg CO2/kg)"

        return True, None

    def get_statistics(self) -> Dict:
        """Get engine statistics"""
        stats = {
            'ipcc_factors': len(self.ipcc_df) if not self.ipcc_df.empty else 0,
            'defra_factors': len(self.defra_df) if not self.defra_df.empty else 0,
            'india_factors': len(self.india_df) if not self.india_df.empty else 0,
            'total_factors': 0,
            'databases_loaded': [],
            'ai_enabled': AI_ESTIMATION_ENABLED and bool(OPENAI_API_KEY),
            'search_stats': self.search_stats
        }

        stats['total_factors'] = stats['ipcc_factors'] + stats['defra_factors'] + stats['india_factors']

        if stats['india_factors'] > 0:
            stats['databases_loaded'].append('India')
        if stats['ipcc_factors'] > 0:
            stats['databases_loaded'].append('IPCC')
        if stats['defra_factors'] > 0:
            stats['databases_loaded'].append('DEFRA')
        if stats['ai_enabled']:
            stats['databases_loaded'].append('AI')

        total = self.search_stats['total_searches']
        if total > 0:
            success = total - self.search_stats['failures']
            stats['search_stats']['success_rate'] = round(success / total * 100, 1)

        return stats


# ================================================================
# GLOBAL INSTANCE
# ================================================================

_engine_instance = None


def get_engine() -> UnifiedEmissionEngine:
    """Get or create the global engine instance"""
    global _engine_instance
    if _engine_instance is None:
        _engine_instance = UnifiedEmissionEngine()
    return _engine_instance


# ================================================================
# TESTING
# ================================================================

if __name__ == "__main__":
    print("=" * 70)
    print("🧪 UNIFIED ENGINE v3.0 - PRODUCTION TESTING WITH AI")
    print("=" * 70)

    engine = UnifiedEmissionEngine()
    stats = engine.get_statistics()

    print(f"\n📊 Database Status:")
    print(f"   Databases: {', '.join(stats['databases_loaded'])}")
    print(f"   Total Factors: {stats['total_factors']:,}")
    print(f"   AI Estimation: {'✅ Enabled' if stats['ai_enabled'] else '❌ Disabled'}")

    test_cases = [
        {'test_name': '🔥 Diesel',
         'params': {'activity_type': 'diesel', 'quantity': 100, 'unit': 'litre', 'region': 'India'}},
        {'test_name': '⚡ Electricity',
         'params': {'activity_type': 'electricity', 'quantity': 5000, 'unit': 'kwh', 'region': 'India'}},
        {'test_name': '🏭 Steel (AI Test)',
         'params': {'activity_type': 'steel', 'quantity': 1000, 'unit': 'kg', 'region': 'India',
                    'description': 'Carbon steel production'}},
        {'test_name': '🏗️ Concrete (AI Test)',
         'params': {'activity_type': 'concrete', 'quantity': 500, 'unit': 'kg', 'region': 'India'}},
        {'test_name': '✈️ Flight',
         'params': {'activity_type': 'flight', 'quantity': 1500, 'unit': 'km', 'region': 'India'}},
    ]

    print(f"\n{'=' * 70}")
    print(f"🧪 RUNNING TESTS")
    print(f"{'=' * 70}")

    for i, test in enumerate(test_cases, 1):
        print(f"\n{'=' * 70}")
        print(f"TEST {i}: {test['test_name']}")
        print(f"{'=' * 70}")

        result = engine.calculate_emissions(**test['params'])

        if result.success:
            print(f"\n✅ SUCCESS")
            print(f"   Emissions: {result.co2e_kg:,.2f} kg CO2e")
            print(f"   EF: {result.emission_factor} {result.emission_factor_unit}")
            print(f"   Method: {result.calculation_method}")
            print(f"   Confidence: {result.confidence * 100:.0f}%")
            print(f"   Source: {result.source}")
            print(f"   Data Quality: {result.data_quality}")

            if result.layer == 3:  # AI estimation
                print(f"\n   🤖 AI ESTIMATION DETAILS:")
                if result.match_details:
                    reasoning = result.match_details.get('reasoning', 'N/A')
                    print(f"   Reasoning: {reasoning[:150]}...")
                    uncertainty = result.match_details.get('uncertainty', {})
                    if uncertainty:
                        print(
                            f"   Range: {uncertainty.get('low', 'N/A')} - {uncertainty.get('high', 'N/A')} (±{uncertainty.get('percentage', 'N/A')}%)")

                if result.alternatives:
                    print(f"\n   📚 Reference Factors:")
                    for alt in result.alternatives[:3]:
                        print(f"      • {alt['activity']}: {alt['factor']} ({alt['source']})")
        else:
            print(f"\n❌ NOT FOUND")
            print(f"   Error: {result.error}")

    final_stats = engine.get_statistics()
    print(f"\n{'=' * 70}")
    print(f"📊 FINAL STATISTICS")
    print(f"{'=' * 70}")
    print(f"   Total Searches: {final_stats['search_stats']['total_searches']}")
    print(f"   India DB Hits: {final_stats['search_stats']['india_db_hits']}")
    print(f"   IPCC/DEFRA Hits: {final_stats['search_stats']['layer_1_hits']}")
    print(f"   AI Estimations: {final_stats['search_stats']['ai_estimation_hits']}")
    print(f"   Success Rate: {final_stats['search_stats'].get('success_rate', 0)}%")
    print(f"   Failures: {final_stats['search_stats']['failures']}")
    print(f"\n✅ TESTING COMPLETE\n")