# app/routers/recommendations.py
"""
AI Recommendations Router - FIXED VERSION
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db  # ✅ Import from database
from app.models import EmissionActivity, Company
import os

router = APIRouter(prefix="/api/v1/recommendations", tags=["AI Recommendations"])


@router.get("/company/{company_id}")
def get_ai_recommendations(company_id: int, db: Session = Depends(get_db)):
    """
    🤖 Generate AI-powered emission reduction recommendations
    """

    print(f"\n🤖 Generating recommendations for company {company_id}")

    # Get company
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    # Get activities
    activities = db.query(EmissionActivity).filter(
        EmissionActivity.company_id == company_id
    ).all()

    if not activities:
        return {
            "success": False,
            "error": "No emission data found. Please add activities first.",
            "company_id": company_id
        }

    # Calculate totals
    total_emissions = sum(a.emissions_kgco2e for a in activities)
    scope_1 = sum(a.emissions_kgco2e for a in activities if a.scope_number == 1)
    scope_2 = sum(a.emissions_kgco2e for a in activities if a.scope_number == 2)
    scope_3 = sum(a.emissions_kgco2e for a in activities if a.scope_number == 3)

    # Top emitters
    top_activities = sorted(activities, key=lambda x: x.emissions_kgco2e, reverse=True)[:5]

    print(f"   Total: {total_emissions:,.0f} kg CO2e")
    print(f"   Top source: {top_activities[0].activity_name if top_activities else 'None'}")

    # Generate recommendations using OpenAI
    try:
        from openai import OpenAI
        import json

        client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

        # Build prompt
        top_list = "\n".join([
            f"{i + 1}. {a.activity_name}: {a.emissions_kgco2e:,.0f} kg CO2e ({a.scope})"
            for i, a in enumerate(top_activities)
        ])

        prompt = f"""You are a carbon reduction expert. Analyze emissions and provide 5 actionable recommendations.

Company: {company.name}
Industry: {company.industry}
Total: {total_emissions:,.0f} kg CO2e

Breakdown:
- Scope 1: {scope_1:,.0f} kg ({scope_1 / total_emissions * 100:.1f}%)
- Scope 2: {scope_2:,.0f} kg ({scope_2 / total_emissions * 100:.1f}%)
- Scope 3: {scope_3:,.0f} kg ({scope_3 / total_emissions * 100:.1f}%)

Top Sources:
{top_list}

Return JSON:
{{
  "recommendations": [
    {{
      "title": "Clear actionable title",
      "description": "2-3 sentences explaining the recommendation",
      "impact": "High/Medium/Low",
      "reduction_potential_kg": estimated_reduction,
      "reduction_percentage": percentage_of_total,
      "feasibility": "Easy/Medium/Hard",
      "cost": "Description of cost and ROI",
      "timeline": "Implementation time",
      "priority": 1-5,
      "steps": ["Step 1", "Step 2", "Step 3"]
    }}
  ]
}}"""

        print("   🤖 Calling GPT-4...")

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a carbon reduction expert. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=2500,
            response_format={"type": "json_object"}
        )

        result = json.loads(response.choices[0].message.content)

        print(f"   ✅ Generated {len(result.get('recommendations', []))} recommendations")

        return {
            "success": True,
            "company": {
                "id": company.id,
                "name": company.name,
                "industry": company.industry
            },
            "current_emissions": {
                "total_kg": round(total_emissions, 2),
                "total_tonnes": round(total_emissions / 1000, 2),
                "scope_1_kg": round(scope_1, 2),
                "scope_2_kg": round(scope_2, 2),
                "scope_3_kg": round(scope_3, 2)
            },
            "top_emission_sources": [
                {
                    "activity": a.activity_name,
                    "emissions_kg": round(a.emissions_kgco2e, 2),
                    "percentage": round(a.emissions_kgco2e / total_emissions * 100, 1),
                    "scope": a.scope
                }
                for a in top_activities
            ],
            "recommendations": result.get('recommendations', []),
            "model": "gpt-4o",
            "generated_at": "2025-10-15T19:30:00"
        }

    except Exception as e:
        print(f"   ⚠️ AI generation failed: {e}")

        # Fallback to rule-based recommendations
        recommendations = generate_fallback_recommendations(
            scope_1, scope_2, scope_3, total_emissions, top_activities
        )

        return {
            "success": True,
            "company": {
                "id": company.id,
                "name": company.name
            },
            "current_emissions": {
                "total_kg": round(total_emissions, 2),
                "total_tonnes": round(total_emissions / 1000, 2)
            },
            "recommendations": recommendations,
            "model": "Rule-based (AI unavailable)",
            "note": f"Using fallback: {str(e)}"
        }


def generate_fallback_recommendations(scope_1, scope_2, scope_3, total, top_activities):
    """Simple rule-based recommendations"""

    recs = []

    # Scope 2 (Energy)
    if scope_2 > total * 0.3:
        recs.append({
            "title": "Switch to Renewable Energy",
            "description": f"Your Scope 2 emissions are {scope_2 / 1000:.1f} tonnes ({scope_2 / total * 100:.1f}%). Installing solar panels or buying renewable energy can reduce this by 80-100%.",
            "impact": "High",
            "reduction_potential_kg": scope_2 * 0.8,
            "reduction_percentage": round(scope_2 * 0.8 / total * 100, 1),
            "feasibility": "Medium",
            "cost": "High upfront (₹30-50L), 4-6 year payback",
            "timeline": "6-12 months",
            "priority": 1,
            "steps": [
                "Conduct energy audit",
                "Get solar panel quotes",
                "Apply for government subsidies",
                "Install and connect to grid"
            ]
        })

    # Scope 1
    if scope_1 > total * 0.2:
        recs.append({
            "title": "Electrify Vehicles and Equipment",
            "description": f"Scope 1 direct emissions are {scope_1 / 1000:.1f} tonnes. Replace diesel generators and vehicles with electric alternatives.",
            "impact": "High",
            "reduction_potential_kg": scope_1 * 0.6,
            "reduction_percentage": round(scope_1 * 0.6 / total * 100, 1),
            "feasibility": "Medium",
            "cost": "Medium (₹10-20L), 3-5 year payback",
            "timeline": "1-2 years",
            "priority": 2,
            "steps": [
                "Audit diesel usage",
                "Research EV options",
                "Pilot with 1-2 vehicles",
                "Phase out diesel"
            ]
        })

    # Energy efficiency
    recs.append({
        "title": "Improve Energy Efficiency",
        "description": "LED lighting, efficient HVAC, better insulation can reduce energy use by 20-30%.",
        "impact": "Medium",
        "reduction_potential_kg": (scope_2 + scope_1 * 0.3) * 0.25,
        "reduction_percentage": round((scope_2 + scope_1 * 0.3) * 0.25 / total * 100, 1),
        "feasibility": "Easy",
        "cost": "Low (₹5-10L), 1-2 year payback",
        "timeline": "3-6 months",
        "priority": 3,
        "steps": [
            "Energy audit",
            "Replace with LED lights",
            "Upgrade HVAC",
            "Install smart meters"
        ]
    })

    # Scope 3
    if scope_3 > 0:
        recs.append({
            "title": "Optimize Business Travel",
            "description": f"Scope 3 emissions are {scope_3 / 1000:.1f} tonnes. Reduce flights, encourage virtual meetings.",
            "impact": "Medium",
            "reduction_potential_kg": scope_3 * 0.4,
            "reduction_percentage": round(scope_3 * 0.4 / total * 100, 1),
            "feasibility": "Easy",
            "cost": "Low (policy change)",
            "timeline": "Immediate",
            "priority": 4,
            "steps": [
                "Implement virtual-first policy",
                "Set up video conferencing",
                "Track travel emissions"
            ]
        })

    # Top emitter specific
    if top_activities:
        top = top_activities[0]
        recs.append({
            "title": f"Target Biggest Source: {top.activity_name}",
            "description": f"This single activity accounts for {top.emissions_kgco2e / 1000:.1f} tonnes ({top.emissions_kgco2e / total * 100:.1f}%). Focus reduction efforts here for maximum impact.",
            "impact": "High",
            "reduction_potential_kg": top.emissions_kgco2e * 0.5,
            "reduction_percentage": round(top.emissions_kgco2e * 0.5 / total * 100, 1),
            "feasibility": "Medium",
            "cost": "Varies",
            "timeline": "6-12 months",
            "priority": 5,
            "steps": [
                "Analyze this specific activity",
                "Research alternatives",
                "Implement changes",
                "Monitor results"
            ]
        })

    return recs[:5]  # Return top 5


@router.get("/")
def recommendations_info():
    """Info endpoint"""
    return {
        "message": "AI Recommendations Engine",
        "version": "1.0",
        "endpoint": "/api/v1/recommendations/company/{company_id}",
        "status": "active"
    }