# Quick Start: Deploy to Hostinger VPS

A condensed guide for deploying GAMASUSCO Platform to Hostinger VPS. For detailed instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

---

## 🚀 Quick Deployment Steps

### 1. Initial Server Setup (5 minutes)

```bash
# Connect to VPS
ssh root@your-vps-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Create user (optional but recommended)
sudo adduser gamasusco
sudo usermod -aG sudo gamasusco
su - gamasusco

# Install essentials
sudo apt install -y curl wget git build-essential ufw
sudo ufw allow 22,80,443/tcp && sudo ufw enable
```

### 2. Install Prerequisites (10 minutes)

```bash
# Python 3.10+
sudo apt install -y python3.10 python3.10-venv python3-pip python3-dev

# PostgreSQL
sudo apt install -y postgresql postgresql-contrib
sudo -u postgres psql << EOF
CREATE DATABASE carbon_accounting;
CREATE USER gamasusco_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE carbon_accounting TO gamasusco_user;
\q
EOF

# Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### 3. Deploy Backend (10 minutes)

```bash
# Clone repository
cd ~
mkdir -p apps && cd apps
git clone https://github.com/rahulpal73071/GamaSusco_production_ready.git
cd GamaSusco_production_ready

# Setup Python environment
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt gunicorn psycopg2-binary

# Configure environment
cp env.example .env
nano .env  # Edit with your values (see below)

# Create directories
mkdir -p uploads data logs

# Initialize database
python initialize_database.py
```

**Required .env changes:**
```env
DATABASE_URL=postgresql://gamasusco_user:your_secure_password@localhost:5432/carbon_accounting
OPENAI_API_KEY=your-actual-openai-key
SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
ENVIRONMENT=production
DEBUG=false
```

### 4. Create Systemd Service (2 minutes)

```bash
# Make script executable
chmod +x scripts/create-systemd-service.sh

# Run script (requires sudo)
sudo ./scripts/create-systemd-service.sh

# Start service
sudo systemctl start gamasusco-api
sudo systemctl enable gamasusco-api
sudo systemctl status gamasusco-api
```

### 5. Deploy Frontend (5 minutes)

```bash
cd frontend-2/frontend

# Install dependencies
npm install

# Create production env
echo "VITE_API_URL=https://api.yourdomain.com" > .env.production
# Or if using same domain: echo "VITE_API_URL=https://yourdomain.com/api" > .env.production

# Build
npm run build
```

### 6. Setup Nginx (5 minutes)

```bash
# Install Nginx
sudo apt install -y nginx

# Use provided script or manually configure
chmod +x scripts/setup-nginx.sh
sudo ./scripts/setup-nginx.sh yourdomain.com

# Test
sudo nginx -t
sudo systemctl reload nginx
```

### 7. Setup SSL (5 minutes)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificates
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com

# Auto-renewal is automatic, test it:
sudo certbot renew --dry-run
```

---

## ✅ Verification

```bash
# Check backend
curl http://localhost:8000/health
sudo systemctl status gamasusco-api

# Check frontend
ls -la frontend-2/frontend/dist

# Check Nginx
sudo systemctl status nginx
curl http://localhost

# Check SSL
curl https://yourdomain.com
```

---

## 🔄 Future Updates

### Update Backend

```bash
cd ~/apps/GamaSusco_production_ready
git pull origin main
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart gamasusco-api
```

### Update Frontend

```bash
cd ~/apps/GamaSusco_production_ready/frontend-2/frontend
npm install
npm run build
sudo systemctl reload nginx
```

### Or use deployment scripts:

```bash
# Backend
./scripts/deploy-backend.sh

# Frontend
./scripts/deploy-frontend.sh
```

---

## 📋 Quick Commands Reference

```bash
# Backend
sudo systemctl restart gamasusco-api
sudo journalctl -u gamasusco-api -f

# Frontend (rebuild)
cd frontend-2/frontend && npm run build

# Nginx
sudo nginx -t
sudo systemctl reload nginx

# Database backup
pg_dump -U gamasusco_user carbon_accounting > backup_$(date +%Y%m%d).sql

# View logs
tail -f logs/error.log
sudo journalctl -u gamasusco-api -n 100
```

---

## 🐛 Common Issues

### Backend not starting?
```bash
sudo journalctl -u gamasusco-api -n 50
# Check .env file and database connection
```

### Frontend shows blank page?
```bash
# Verify build exists
ls -la frontend-2/frontend/dist
# Check .env.production has correct API URL
# Clear browser cache
```

### 502 Bad Gateway?
```bash
# Check backend is running
curl http://127.0.0.1:8000/health
sudo systemctl status gamasusco-api
```

---

**Need more details?** See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive instructions.

