# app/config.py
"""
Configuration Settings
======================
Environment variables and app settings
"""
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# ============================================================================
# OPENAI CONFIGURATION
# ============================================================================

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY or OPENAI_API_KEY == "your_openai_key_here":
    print("⚠️  WARNING: OPENAI_API_KEY not found in .env file")
    print("   AI features will be disabled")

# Model Selection
EXTRACTION_MODEL = os.getenv("EXTRACTION_MODEL", "gpt-4o-mini")
CLASSIFICATION_MODEL = os.getenv("CLASSIFICATION_MODEL", "gpt-4o-mini")
RECOMMENDATION_MODEL = os.getenv("RECOMMENDATION_MODEL", "gpt-4o-mini")

# ============================================================================
# AUTHENTICATION SETTINGS (JWT)
# ============================================================================

# SECRET_KEY: Change this in production! Generate with: python -c "import secrets; print(secrets.token_urlsafe(32))"
_default_secret = 'CsscY1ichoKRQhLlaDEWXf2cMVsyvAfm0z2um3LhitU'
SECRET_KEY = os.getenv('SECRET_KEY', _default_secret)
if SECRET_KEY == _default_secret:
    print("⚠️  WARNING: Using default SECRET_KEY. This is INSECURE for production!")
    print("   Please set SECRET_KEY in .env file with a strong random value")
    print("   Generate one with: python -c \"import secrets; print(secrets.token_urlsafe(32))\"")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = int(os.getenv('ACCESS_TOKEN_EXPIRE_HOURS', '24'))

# ============================================================================
# DATABASE SETTINGS
# ============================================================================

DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///./carbon_accounting.db')

# ============================================================================
# PROCESSING LIMITS
# ============================================================================

MAX_PDF_PAGES = int(os.getenv("MAX_PDF_PAGES", "10"))
MAX_IMAGE_SIZE_MB = int(os.getenv("MAX_IMAGE_SIZE_MB", "10"))
MAX_TEXT_LENGTH = int(os.getenv("MAX_TEXT_LENGTH", "8000"))

# ============================================================================
# FILE UPLOAD SETTINGS
# ============================================================================

UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", "uploads")
ALLOWED_EXTENSIONS = {'.pdf', '.xlsx', '.xls', '.csv', '.jpg', '.jpeg', '.png', '.webp', '.txt'}

# ============================================================================
# AI ESTIMATION SETTINGS
# ============================================================================

AI_ESTIMATION_ENABLED = os.getenv('AI_ESTIMATION_ENABLED', 'true').lower() == 'true'

# ============================================================================
# EMISSION FACTOR DATABASE PATHS
# ============================================================================

DATA_DIR = os.getenv('DATA_DIR', 'data')
IPCC_CSV_PATH = os.path.join(DATA_DIR, 'ipcc_all_factors.csv')
DEFRA_CSV_PATH = os.path.join(DATA_DIR, 'defra_factors.csv')
INDIA_CSV_PATH = os.path.join(DATA_DIR, 'India_Emission_Factors.csv')

# ============================================================================
# TESSERACT CONFIGURATION (Windows OCR)
# ============================================================================

if os.name == 'nt':  # Windows
    try:
        import pytesseract
        pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
    except (ImportError, Exception):
        # pytesseract not available or incompatible with Python version
        pass

# ============================================================================
# PRINT CONFIGURATION STATUS
# ============================================================================

def print_config_status():
    """Print configuration status on startup"""
    print(f"\n{'='*70}")
    print(f"⚙️  CONFIGURATION STATUS")
    print(f"{'='*70}")
    print(f"   OpenAI API: {'✅ Configured' if OPENAI_API_KEY and OPENAI_API_KEY != 'your_openai_key_here' else '❌ Missing'}")
    print(f"   Extraction Model: {EXTRACTION_MODEL}")
    print(f"   AI Estimation: {'✅ Enabled' if AI_ESTIMATION_ENABLED else '❌ Disabled'}")
    print(f"   Upload Folder: {UPLOAD_FOLDER}")
    print(f"   Max PDF Pages: {MAX_PDF_PAGES}")
    print(f"   Supported Files: {', '.join(ALLOWED_EXTENSIONS)}")
    print(f"   Data Directory: {DATA_DIR}")
    print(f"   Auth Secret: {'✅ Configured' if SECRET_KEY else '❌ Missing'}")
    print(f"{'='*70}\n")

# Auto-print on import
if __name__ != "__main__":
    print_config_status()