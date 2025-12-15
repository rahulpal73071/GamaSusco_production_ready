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

    python interactive_upload_test.py

Note: This test does not persist any data and runs independently of
the FastAPI server.  It is intended for development and unit
testing.
"""

from pathlib import Path
import json

from orchestrator import run_full_pipeline


# Configure these values before running the test
COMPANY_ID = 1  # change to an existing company ID
SAMPLE_FILE = SAMPLE_FILE = r"C:\Users\shubh\Downloads\project (3)\project\uploads\HOTEL-NH73028312556876.pdf" # update this path


def main():
    # Ensure sample file exists
    file_path = Path(SAMPLE_FILE)
    if not file_path.exists():
        raise FileNotFoundError(f"Sample file not found: {file_path}")

    result = run_full_pipeline(company_id=COMPANY_ID, file_path=str(file_path))
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()