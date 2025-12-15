"""
Database maintenance helpers for runtime schema validation.

These utilities keep legacy SQLite databases aligned with the latest models
without requiring a full Alembic migration workflow. They are intentionally
idempotent and safe to call multiple times on application startup/requests.
"""
from sqlalchemy import text
from app.database import engine, Base

# Columns that newer versions of the AI recommendation feature expect.
# Keys are column names and values are SQLite column definitions.
AI_RECOMMENDATION_COLUMNS = {
    "executive_summary": "TEXT",
    "detailed_analysis": "TEXT",
    "recommendations_json": "TEXT",
    "total_potential_savings_kg": "REAL",
    "total_potential_savings_tonnes": "REAL",
    "potential_reduction_percentage": "REAL",
    "high_priority_count": "INTEGER DEFAULT 0",
    "medium_priority_count": "INTEGER DEFAULT 0",
    "low_priority_count": "INTEGER DEFAULT 0",
    "ai_model": "TEXT",
    "generation_prompt": "TEXT",
    "estimated_cost": "REAL",
    "processing_time_seconds": "REAL",
    "is_active": "BOOLEAN NOT NULL DEFAULT 1",
    "is_implemented": "BOOLEAN NOT NULL DEFAULT 0",
    "is_saved": "BOOLEAN NOT NULL DEFAULT 0",
    "implementation_notes": "TEXT",
    "saved_at": "DATETIME",
    "implemented_at": "DATETIME",
    "implementation_progress": "REAL DEFAULT 0",
    "generated_by": "TEXT",
    "generated_at": "DATETIME",
    "expires_at": "DATETIME",
    "last_viewed_at": "DATETIME",
    "created_at": "DATETIME",
    "updated_at": "DATETIME",
}

_ai_schema_checked = False


def ensure_ai_recommendation_schema():
    """
    Make sure the ai_recommendations table contains the columns required by
    the latest SQLAlchemy model. Missing columns will be added in place using
    ALTER TABLE statements (SQLite allows adding columns without data loss).
    """
    global _ai_schema_checked

    if _ai_schema_checked:
        return

    with engine.begin() as conn:
        existing = {
            row[1]
            for row in conn.execute(text("PRAGMA table_info(ai_recommendations)"))
        }

        # If the table itself is missing, create it via metadata to keep behaviour.
        if not existing:
            from app import models  # Local import to avoid cycles

            Base.metadata.create_all(bind=engine, tables=[models.AIRecommendation.__table__])
            existing = {
                row[1]
                for row in conn.execute(text("PRAGMA table_info(ai_recommendations)"))
            }

        missing = [
            (column, definition)
            for column, definition in AI_RECOMMENDATION_COLUMNS.items()
            if column not in existing
        ]

        for column, definition in missing:
            conn.execute(
                text(
                    f"ALTER TABLE ai_recommendations "
                    f"ADD COLUMN {column} {definition}"
                )
            )

    _ai_schema_checked = True

