# GAMASUSCO AI Platform - Carbon Accounting & ESG Reporting Platform

🌍 **Production-Ready Carbon Accounting Platform with AI-Powered Document Processing**

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115%2B-green)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.2-blue)](https://react.dev/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Frontend Setup](#frontend-setup)
- [Database Setup](#database-setup)
- [Usage Guide](#usage-guide)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

---

## 🎯 Overview

GAMASUSCO AI Platform is a comprehensive carbon accounting and ESG reporting platform designed for enterprises to track, analyze, and report their carbon emissions. The platform supports GHG Protocol Scope 1, 2, and 3 emissions across all 15 categories, with AI-powered document processing and intelligent recommendations.

### Key Capabilities

- **Carbon Footprint Tracking**: Complete Scope 1, 2, and 3 emissions tracking
- **AI Document Processing**: Automatically extract emissions data from PDFs, Excel, CSV, and images
- **Emission Calculations**: 19,000+ emission factors from IPCC, DEFRA, EPA, and India-specific sources
- **Goal Tracking**: Set and monitor emission reduction goals with progress tracking
- **AI Recommendations**: GPT-4 powered insights for emission reduction strategies
- **Reporting**: BRSR, CDP, and custom report generation
- **Benchmarking**: Industry comparison and performance metrics
- **CBAM Compliance**: EU Carbon Border Adjustment Mechanism reporting support

---

## ✨ Features

### Core Features

- 🔐 **JWT Authentication & User Management**
  - Secure authentication with JWT tokens
  - Multi-company support
  - Role-based access control (Admin, User)

- 📊 **Emission Tracking (Scope 1, 2, 3)**
  - Complete GHG Protocol compliance
  - All 15 Scope 3 categories supported
  - Activity-based and spend-based calculations
  - Real-time emission calculations

- 📁 **AI Document Processing**
  - PDF extraction with OCR support
  - Excel and CSV bulk import
  - Image processing (JPG, PNG, WebP)
  - Automatic data extraction and classification
  - Support for BRSR reports, invoices, travel documents, etc.

- 📥 **Bulk Import with Validation**
  - Excel/CSV template support
  - Data validation and error reporting
  - Multi-row import with progress tracking

- 🎯 **Goal Setting & Progress Tracking**
  - Set emission reduction targets
  - Year-over-year tracking
  - Progress visualization
  - Automatic projections

- 💡 **AI-Powered Recommendations**
  - GPT-4 powered analysis
  - Prioritized action plans
  - ROI-focused insights
  - Historical pattern analysis

- 📈 **Advanced Analytics & Reports**
  - Real-time dashboard
  - Trend analysis
  - Scope breakdown charts
  - Custom report generation
  - BRSR/CDP export formats

- 🏆 **Industry Benchmarking**
  - Sector-specific comparisons
  - Performance metrics
  - Best practice identification

- 🔍 **Data Quality Monitoring**
  - Confidence scoring
  - Data quality indicators
  - Calculation method tracking

### Advanced Features

- **Water Footprint Tracking**: Track water consumption and associated emissions
- **Waste Management**: Monitor waste disposal and recycling metrics
- **Energy Management**: Detailed energy consumption tracking
- **CBAM Compliance**: EU Carbon Border Adjustment Mechanism reporting
- **Lifecycle Analysis**: Cradle-to-grave emission assessment

---

## 🏗️ Architecture

### Backend (FastAPI)

```
app/
├── main.py                 # FastAPI application entry point
├── config.py              # Configuration and environment variables
├── database.py            # Database connection and session management
├── models.py              # SQLAlchemy database models
├── routers/               # API route handlers
│   ├── auth.py           # Authentication endpoints
│   ├── activities.py     # Emission activities CRUD
│   ├── upload.py         # Document upload and processing
│   ├── bulk.py           # Bulk import endpoints
│   ├── goals.py          # Goal management
│   ├── recommendations.py # AI recommendations
│   ├── reports.py        # Report generation
│   ├── benchmarks.py     # Benchmarking
│   ├── dashboard.py      # Dashboard data
│   ├── analytics.py      # Analytics endpoints
│   ├── scope3.py         # Scope 3 specific endpoints
│   ├── energy.py         # Energy tracking
│   ├── water.py          # Water tracking
│   ├── waste.py          # Waste tracking
│   └── cbam.py           # CBAM compliance
├── ai/                    # AI processing modules
│   ├── universal_document_processor.py
│   ├── chatgpt_extractor.py
│   ├── scope_classifier.py
│   └── [various extractors]
├── calculators/           # Emission calculation engines
│   ├── unified_emission_engine.py
│   ├── scope1.py
│   ├── scope2.py
│   ├── scope3.py
│   └── [various calculators]
├── services/              # Business logic services
│   ├── recommendation_engine.py
│   ├── report_generator.py
│   └── scope3_service.py
└── schemas/               # Pydantic schemas
```

### Frontend (React + Vite)

```
frontend-2/frontend/
├── src/
│   ├── components/        # React components
│   ├── context/          # React context (Auth, Theme)
│   ├── services/         # API service layer
│   ├── hooks/            # Custom React hooks
│   └── utils/            # Utility functions
├── public/               # Static assets
└── dist/                 # Build output
```

### Database

- **SQLite** (Development/Default)
- **PostgreSQL/MySQL** (Production - configure via DATABASE_URL)

---

## 📦 Prerequisites

### Backend Requirements

- **Python 3.10+** (3.13 compatible)
- **pip** (Python package manager)
- **OpenAI API Key** (for AI features)

### Frontend Requirements

- **Node.js 18+**
- **npm** or **yarn**

### Optional (for OCR features)

- **Tesseract OCR** (for Windows: Install from [GitHub](https://github.com/UB-Mannheim/tesseract/wiki))

### System Requirements

- **RAM**: 4GB minimum (8GB recommended)
- **Storage**: 2GB free space
- **OS**: Windows, macOS, or Linux

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/rahulpal73071/GamaSusco_production_ready.git
cd GamaSusco_production_ready
```

### 2. Backend Setup

#### Create Virtual Environment

**Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

**macOS/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

#### Install Dependencies

```bash
pip install -r requirements.txt
```

#### Create Environment File

Create a `.env` file in the root directory:

```bash
# Copy the example environment file
cp env.example .env

# Or create manually using the template
```

Edit `.env` and add your configuration (see [Configuration](#configuration) section).

### 3. Frontend Setup

```bash
cd frontend-2/frontend
npm install
```

### 4. Database Initialization

```bash
# From project root directory
python initialize_database.py
```

This will:
- Create database tables
- Seed emission factors
- Create demo company and users

**Demo Credentials:**
- Admin: `username=admin`, `password=admin123`
- User: `username=user`, `password=user123`

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# OpenAI Configuration (Required for AI features)
OPENAI_API_KEY=your-openai-api-key-here

# Model Selection
EXTRACTION_MODEL=gpt-4o-mini
CLASSIFICATION_MODEL=gpt-4o-mini
RECOMMENDATION_MODEL=gpt-4o-mini

# Authentication
SECRET_KEY=your-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_HOURS=24

# Database
DATABASE_URL=sqlite:///./carbon_accounting.db
# For PostgreSQL: DATABASE_URL=postgresql://user:password@localhost/carbon_accounting
# For MySQL: DATABASE_URL=mysql+pymysql://user:password@localhost/carbon_accounting

# Processing Limits
MAX_PDF_PAGES=10
MAX_IMAGE_SIZE_MB=10
MAX_TEXT_LENGTH=8000

# File Upload
UPLOAD_FOLDER=uploads

# AI Estimation
AI_ESTIMATION_ENABLED=true

# Data Directory (for emission factor CSVs)
DATA_DIR=data
```

### Frontend Configuration

Create `frontend-2/frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
```

For production:

```env
VITE_API_URL=https://your-api-domain.com
```

---

## 🏃 Running the Application

### Development Mode

#### Start Backend Server

```bash
# From project root
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Or use Python directly:

```bash
python -m uvicorn app.main:app --reload
```

The API will be available at:
- **API**: http://localhost:8000
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

#### Start Frontend Development Server

```bash
cd frontend-2/frontend
npm run dev
```

The frontend will be available at: http://localhost:5173

### Production Mode

#### Backend

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

For production, consider using:
- **Gunicorn** with Uvicorn workers
- **Nginx** as reverse proxy
- **SSL/TLS** certificates
- **Process manager** (systemd, PM2, supervisor)

#### Frontend

```bash
cd frontend-2/frontend
npm run build
npm run preview
```

Or serve the `dist` folder with a web server (Nginx, Apache, etc.)

---

## 📚 API Documentation

### Interactive Documentation

Once the backend is running, access:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key API Endpoints

#### Authentication

```http
POST /api/v1/auth/register    # Register new user
POST /api/v1/auth/login       # Login and get JWT token
GET  /api/v1/auth/me          # Get current user info
```

#### Activities

```http
GET    /api/v1/activities              # List activities
POST   /api/v1/activities              # Create activity
GET    /api/v1/activities/{id}         # Get activity
PUT    /api/v1/activities/{id}         # Update activity
DELETE /api/v1/activities/{id}         # Delete activity
```

#### Document Upload

```http
POST /api/v1/upload/document           # Upload and process document
GET  /api/v1/upload/status/{job_id}    # Check processing status
```

#### Bulk Import

```http
POST /api/v1/bulk/import               # Bulk import from Excel/CSV
GET  /api/v1/bulk/template             # Download import template
```

#### Dashboard & Analytics

```http
GET /api/v1/dashboard                  # Dashboard data
GET /api/v1/analytics/trends           # Emission trends
GET /api/v1/analytics/breakdown        # Scope breakdown
```

#### Goals

```http
GET    /api/v1/goals                   # List goals
POST   /api/v1/goals                   # Create goal
GET    /api/v1/goals/{id}              # Get goal
PUT    /api/v1/goals/{id}              # Update goal
DELETE /api/v1/goals/{id}              # Delete goal
```

#### Recommendations

```http
GET /api/v1/recommendations            # Get AI recommendations
```

#### Reports

```http
GET  /api/v1/reports                   # List reports
POST /api/v1/reports/generate          # Generate report
GET  /api/v1/reports/{id}              # Get report
GET  /api/v1/reports/{id}/download     # Download report
```

### Authentication

All protected endpoints require a JWT token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

---

## 💻 Frontend Setup

### Development

```bash
cd frontend-2/frontend
npm install
npm run dev
```

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Project Structure

```
frontend-2/frontend/src/
├── components/          # React components
│   ├── Auth/           # Authentication components
│   ├── Dashboard/      # Dashboard components
│   ├── Activities/     # Activity management
│   ├── Reports/        # Report generation
│   └── ...
├── context/            # React Context providers
│   ├── AuthContext.jsx
│   └── ThemeContext.jsx
├── services/           # API service layer
│   └── api.js
├── hooks/              # Custom hooks
└── utils/              # Utility functions
```

---

## 🗄️ Database Setup

### Initialization

```bash
python initialize_database.py
```

This script:
1. Creates all database tables
2. Seeds emission factors (19,000+ factors)
3. Creates demo company and users

### Manual Database Operations

```python
from app.database import init_db, seed_emission_factors, seed_cbam_goods

# Initialize tables
init_db()

# Seed emission factors
seed_emission_factors()

# Seed CBAM goods
seed_cbam_goods()
```

### Database Migrations

For production, consider using Alembic for database migrations:

```bash
# Initialize Alembic (if not already done)
alembic init alembic

# Create migration
alembic revision --autogenerate -m "Description"

# Apply migration
alembic upgrade head
```

---

## 📖 Usage Guide

### 1. Getting Started

1. **Register/Login**: Create an account or login with demo credentials
2. **Create Company**: Set up your company profile
3. **Add Activities**: Start tracking emissions by adding activities

### 2. Adding Emissions Data

#### Method 1: Manual Entry

Use the Activities API or frontend form to manually add emission activities:

```bash
POST /api/v1/activities
{
  "activity_type": "diesel",
  "quantity": 100,
  "unit": "litre",
  "activity_date": "2024-01-15",
  "description": "Generator fuel consumption"
}
```

#### Method 2: Document Upload

Upload a document (PDF, Excel, CSV) and let AI extract the data:

```bash
POST /api/v1/upload/document
Content-Type: multipart/form-data

file: [your-document.pdf]
```

#### Method 3: Bulk Import

Use the bulk import template to upload multiple activities:

```bash
POST /api/v1/bulk/import
Content-Type: multipart/form-data

file: [activities.xlsx]
```

### 3. Viewing Dashboard

Access the dashboard to see:
- Total emissions (Scope 1, 2, 3)
- Scope breakdown charts
- Trend analysis
- Top emission sources
- Goal progress

### 4. Setting Goals

Set emission reduction goals:

```bash
POST /api/v1/goals
{
  "target_year": 2025,
  "reduction_percentage": 20,
  "base_year": 2024,
  "scope": "all"
}
```

### 5. Getting Recommendations

Get AI-powered recommendations for emission reduction:

```bash
GET /api/v1/recommendations
```

### 6. Generating Reports

Generate compliance reports:

```bash
POST /api/v1/reports/generate
{
  "report_type": "BRSR",
  "year": 2024,
  "format": "pdf"
}
```

---

## 🚢 Production Deployment

📖 **Full deployment guide available:** See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed Hostinger VPS deployment instructions.

🚀 **Quick deployment:** See [QUICK_START_DEPLOYMENT.md](./QUICK_START_DEPLOYMENT.md) for a condensed guide.

### Backend Deployment

#### Using Docker (Recommended)

Create `Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build and run:

```bash
docker build -t gamasusco-api .
docker run -p 8000:8000 --env-file .env gamasusco-api
```

#### Using Gunicorn

```bash
pip install gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

#### Nginx Configuration

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Frontend Deployment

#### Build and Serve

```bash
cd frontend-2/frontend
npm run build
```

Serve the `dist` folder with:
- **Nginx**
- **Apache**
- **Vercel**
- **Netlify**
- **AWS S3 + CloudFront**

#### Environment Variables

Ensure `VITE_API_URL` points to your production API:

```env
VITE_API_URL=https://api.yourdomain.com
```

### Database (Production)

For production, use PostgreSQL or MySQL:

1. Create database
2. Update `DATABASE_URL` in `.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/carbon_accounting
```

3. Run migrations:

```bash
python initialize_database.py
```

### Security Checklist

- [ ] Change `SECRET_KEY` to a strong random value
- [ ] Use HTTPS/SSL certificates
- [ ] Configure CORS properly (restrict origins)
- [ ] Use environment variables for all secrets
- [ ] Enable rate limiting
- [ ] Set up proper logging
- [ ] Configure database backups
- [ ] Use a production-grade database (PostgreSQL/MySQL)
- [ ] Set up monitoring and alerts
- [ ] Review and restrict file upload limits
- [ ] Enable API authentication on all endpoints

---

## 🐛 Troubleshooting

### Common Issues

#### 1. OpenAI API Key Error

**Error**: `⚠️ WARNING: OPENAI_API_KEY not found`

**Solution**: 
- Add `OPENAI_API_KEY` to your `.env` file
- Verify the key is valid
- Check API key permissions

#### 2. Database Connection Error

**Error**: `Database connection failed`

**Solution**:
- Verify `DATABASE_URL` in `.env`
- Ensure database file exists (SQLite) or database server is running
- Check file permissions

#### 3. Import Errors

**Error**: `ModuleNotFoundError`

**Solution**:
```bash
pip install -r requirements.txt
```

#### 4. Frontend Build Errors

**Error**: Build fails

**Solution**:
```bash
cd frontend-2/frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### 5. OCR Not Working (Windows)

**Error**: Tesseract not found

**Solution**:
- Install Tesseract OCR from [GitHub](https://github.com/UB-Mannheim/tesseract/wiki)
- Default path: `C:\Program Files\Tesseract-OCR\tesseract.exe`
- Or update path in `app/config.py`

#### 6. Port Already in Use

**Error**: `Address already in use`

**Solution**:
- Change port: `uvicorn app.main:app --port 8001`
- Or kill process using the port

### Getting Help

- Check API documentation: http://localhost:8000/docs
- Review logs for detailed error messages
- Check GitHub issues
- Contact support: support@carbonplatform.com

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow PEP 8 for Python code
- Use TypeScript/ESLint for frontend code
- Write tests for new features
- Update documentation
- Follow existing code style

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👥 Authors

- **SHUB-0510** - Initial work
- **GAMASUSCO Team** - Development and maintenance

---

## 🙏 Acknowledgments

- **GHG Protocol** - Emission calculation standards
- **IPCC** - Emission factor database
- **DEFRA** - UK emission factors
- **EPA** - US emission factors
- **FastAPI** - Web framework
- **React** - Frontend framework
- **OpenAI** - AI capabilities

---

## 📞 Support

For support, email support@carbonplatform.com or create an issue in the GitHub repository.

---

## 🔗 Links

- **GitHub Repository**: https://github.com/rahulpal73071/GamaSusco_production_ready
- **API Documentation**: http://localhost:8000/docs (when running)
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

**Made with ❤️ for a sustainable future**

