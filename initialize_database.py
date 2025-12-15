# initialize_database.py
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from app.database import engine, Base, SessionLocal
from app.models import Company, User
from datetime import datetime, timezone

print("\n" + "=" * 70)
print("🔧 INITIALIZING DATABASE")
print("=" * 70)

print("\n1️⃣ Dropping existing tables...")
Base.metadata.drop_all(bind=engine)
print("   ✅ Dropped")

print("\n2️⃣ Creating new tables...")
Base.metadata.create_all(bind=engine)
print("   ✅ Created")

print("\n3️⃣ Adding sample data...")
db = SessionLocal()

try:
    # Use timezone-aware datetime
    now = datetime.now(timezone.utc)

    company = Company(
        name="Demo Company Ltd",
        industry="Technology",
        employee_count=100,
        city="Mumbai",
        country="India",
        created_at=now
    )
    db.add(company)
    db.flush()

    # Simple password hashing (compatible with all bcrypt versions)
    import bcrypt


    def hash_password(password: str) -> str:
        """Hash password using bcrypt directly"""
        password_bytes = password.encode('utf-8')
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password_bytes, salt)
        return hashed.decode('utf-8')


    admin = User(
        username="admin",
        email="admin@demo.com",
        full_name="Admin User",
        hashed_password=hash_password("admin123"),
        company_id=company.id,
        role="admin",
        is_active=True,
        is_verified=True,
        created_at=now
    )
    db.add(admin)

    user = User(
        username="user",
        email="user@demo.com",
        full_name="Regular User",
        hashed_password=hash_password("user123"),
        company_id=company.id,
        role="user",
        is_active=True,
        is_verified=True,
        created_at=now
    )
    db.add(user)

    db.commit()

    print(f"   ✅ Company: {company.name} (ID: {company.id})")
    print(f"   ✅ Admin: admin / admin123")
    print(f"   ✅ User: user / user123")

    print("\n" + "=" * 70)
    print("✅ DATABASE INITIALIZED SUCCESSFULLY")
    print("=" * 70)
    print("\n📋 Demo Credentials:")
    print("   Admin:  username=admin  password=admin123")
    print("   User:   username=user   password=user123")
    print("   Company: Demo Company Ltd")
    print("\n")

except Exception as e:
    print(f"\n❌ Error: {e}")
    db.rollback()
    import traceback

    traceback.print_exc()
finally:
    db.close()