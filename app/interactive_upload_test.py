"""
End‑to‑end Test for the Carbon Accounting Backend
=================================================

This script demonstrates how to exercise the full processing pipeline
exposed by the orchestrator.  It loads a sample document, passes it
through the document processor, emission calculator, goal tracker and
recommendation engine, and prints the resulting JSON.  Replace
``SAMPLE_FILE`` with the path to a valid invoice, bill or report to
test with your own data.  The company ID should correspond to a
company record in your database (create one via the auth and
activities API or the interactive CLI).

Run this script directly:

    python -m app.interactive_upload_test

Note: This test does not persist any data and runs independently of
the FastAPI server.  It is intended for development and unit
testing.
"""

from pathlib import Path
import json

from app.orchestrator import run_full_pipeline

# Configure these values before running the test
COMPANY_ID = 1  # change to an existing company ID
SAMPLE_FILE = r"C:\Users\shubh\Downloads\project (3)\project\uploads\HOTEL-NH73028312556876.pdf"  # update this path


def main():
    # Ensure sample file exists
    file_path = Path(SAMPLE_FILE)
    if not file_path.exists():
        raise FileNotFoundError(f"Sample file not found: {file_path}")

    # Run full pipeline - this should include recommendations automatically
    result = run_full_pipeline(company_id=COMPANY_ID, file_path=str(file_path))

    # Print final result
    print("\n" + "=" * 70)
    print("📊 FINAL RESULT WITH RECOMMENDATIONS")
    print("=" * 70)
    print(json.dumps(result, indent=2))

    # Also print formatted recommendations if any
    if result.get("recommendations"):
        print("\n" + "=" * 70)
        print("💡 RECOMMENDATIONS SUMMARY")
        print("=" * 70)
        for i, rec in enumerate(result["recommendations"], 1):
            print(f"\n{i}. {rec.get('title', 'Untitled')}")
            print(f"   Priority: {rec.get('priority', 'N/A')}")
            print(f"   Reduction: {rec.get('estimated_reduction_kg', 0):,.0f} kg CO2e")
            print(f"   Cost: ₹{rec.get('implementation_cost_inr', 0):,.0f}")
            print(f"   Savings: ₹{rec.get('annual_savings_inr', 0):,.0f}/year")
            print(f"   Payback: {rec.get('payback_period_years', 0):.1f} years")
    else:
        print("\n⚠️ No recommendations in result. Check if orchestrator.py includes recommendation generation.")


if __name__ == "__main__":
    main()