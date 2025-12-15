# setup_fixed_system.ps1
# Windows PowerShell setup script for the fixed carbon accounting platform

Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host "🔧 Carbon Accounting Platform - Windows Setup Script" -ForegroundColor Cyan
Write-Host "========================================================================" -ForegroundColor Cyan

# ============================================================================
# STEP 1: Backup old files
# ============================================================================

Write-Host ""
Write-Host "1️⃣  Creating backup of old calculator files..." -ForegroundColor Yellow

$BackupDir = "backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null

$OldFiles = @(
    "app\calculators\emission_calculator.py",
    "app\calculators\smart_emission_calculator.py",
    "app\calculators\csv_factor_matcher.py",
    "app\calculators\emission_factor_matcher.py"
)

foreach ($file in $OldFiles) {
    if (Test-Path $file) {
        Copy-Item $file $BackupDir
        Write-Host "   ✅ Backed up: $file" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Not found: $file" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "   Backup created in: $BackupDir" -ForegroundColor Green

# ============================================================================
# STEP 2: Delete old files
# ============================================================================

Write-Host ""
Write-Host "2️⃣  Deleting redundant calculator files..." -ForegroundColor Yellow

foreach ($file in $OldFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "   ✅ Deleted: $file" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Already deleted: $file" -ForegroundColor Yellow
    }
}

# ============================================================================
# STEP 3: Verify critical files exist
# ============================================================================

Write-Host ""
Write-Host "3️⃣  Verifying critical files..." -ForegroundColor Yellow

$CriticalFiles = @(
    "app\calculators\unified_emission_engine.py",
    "app\ai\universal_document_processor.py",
    "app\ai\chatgpt_extractor.py",
    "app\ai\scope_classifier.py",
    "app\routers\upload.py",
    "app\config.py",
    "app\models.py",
    "app\database.py"
)

$Missing = 0

foreach ($file in $CriticalFiles) {
    if (Test-Path $file) {
        Write-Host "   ✅ Found: $file" -ForegroundColor Green
    } else {
        Write-Host "   ❌ MISSING: $file" -ForegroundColor Red
        $Missing++
    }
}

if ($Missing -gt 0) {
    Write-Host ""
    Write-Host "   ❌ $Missing critical files missing!" -ForegroundColor Red
    exit 1
}

# ============================================================================
# STEP 4: Check .env file
# ============================================================================

Write-Host ""
Write-Host "4️⃣  Checking environment configuration..." -ForegroundColor Yellow

if (Test-Path ".env") {
    Write-Host "   ✅ .env file exists" -ForegroundColor Green

    $envContent = Get-Content ".env" -Raw
    if ($envContent -match "OPENAI_API_KEY") {
        Write-Host "   ✅ OPENAI_API_KEY found" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  OPENAI_API_KEY not found in .env" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ❌ .env file not found" -ForegroundColor Red
    Write-Host ""
    Write-Host "   Creating sample .env file..." -ForegroundColor Yellow

    $envTemplate = @"
# OpenAI Configuration
OPENAI_API_KEY=your-api-key-here

# Model Selection
EXTRACTION_MODEL=gpt-4o
CLASSIFICATION_MODEL=gpt-4o-mini
RECOMMENDATION_MODEL=gpt-4o

# Processing Limits
MAX_PDF_PAGES=10
MAX_IMAGE_SIZE_MB=10
MAX_TEXT_LENGTH=8000

# File Upload
UPLOAD_FOLDER=uploads

# Authentication
SECRET_KEY=your-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_HOURS=24

# Database
DATABASE_URL=sqlite:///./carbon_accounting.db

# AI Estimation
AI_ESTIMATION_ENABLED=true

# Data Directory
DATA_DIR=data
"@

    $envTemplate | Out-File -FilePath ".env" -Encoding UTF8

    Write-Host "   ✅ Created .env file" -ForegroundColor Green
    Write-Host "   ⚠️  Please edit .env and add your OPENAI_API_KEY" -ForegroundColor Yellow
}

# ============================================================================
# STEP 5: Create required directories
# ============================================================================

Write-Host ""
Write-Host "5️⃣  Creating required directories..." -ForegroundColor Yellow

$Directories = @("uploads", "data")

foreach ($dir in $Directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "   ✅ Created: $dir" -ForegroundColor Green
    } else {
        Write-Host "   ✅ Exists: $dir" -ForegroundColor Green
    }
}

# ============================================================================
# STEP 6: Check CSV data files
# ============================================================================

Write-Host ""
Write-Host "6️⃣  Checking emission factor CSV files..." -ForegroundColor Yellow

$CsvFiles = @(
    "data\ipcc_all_factors.csv",
    "data\defra_factors.csv",
    "data\india_emission_factors.csv"
)

foreach ($file in $CsvFiles) {
    if (Test-Path $file) {
        $lines = (Get-Content $file).Count
        Write-Host "   ✅ Found: $file ($lines lines)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Missing: $file" -ForegroundColor Yellow
    }
}

# ============================================================================
# STEP 7: Run system test
# ============================================================================

Write-Host ""
Write-Host "7️⃣  Running system test..." -ForegroundColor Yellow
Write-Host ""

if (Test-Path "test_system.py") {
    python test_system.py
} else {
    Write-Host "   ⚠️  test_system.py not found - skipping" -ForegroundColor Yellow
}

# ============================================================================
# FINAL SUMMARY
# ============================================================================

Write-Host ""
Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host "✅ SETUP COMPLETE!" -ForegroundColor Green
Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "WHAT'S CHANGED:" -ForegroundColor Yellow
Write-Host "  ✅ Deleted 4 redundant calculator files"
Write-Host "  ✅ Using unified_emission_engine.py as single calculator"
Write-Host "  ✅ Fixed chatgpt_extractor.py"
Write-Host "  ✅ Updated universal_document_processor.py"
Write-Host "  ✅ Updated upload.py router"
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host "  1. Edit .env file and add your OPENAI_API_KEY"
Write-Host "  2. Ensure CSV data files are in data\ directory"
Write-Host "  3. Start server: uvicorn app.main:app --reload"
Write-Host "  4. Open: http://localhost:8000/docs"
Write-Host "  5. Test uploading a document"
Write-Host ""
Write-Host "BACKUP LOCATION: $BackupDir" -ForegroundColor Cyan
Write-Host "========================================================================" -ForegroundColor Cyan