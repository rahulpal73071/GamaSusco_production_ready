# Deployment Guide: GAMASUSCO AI Platform on Hostinger VPS

Complete guide for deploying the backend (FastAPI) and frontend (React) on a Hostinger VPS server.

---

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [VPS Server Setup](#vps-server-setup)
- [Backend Deployment](#backend-deployment)
- [Frontend Deployment](#frontend-deployment)
- [Nginx Configuration](#nginx-configuration)
- [SSL/HTTPS Setup](#sslhttps-setup)
- [Database Setup (PostgreSQL)](#database-setup-postgresql)
- [Process Management](#process-management)
- [Domain Configuration](#domain-configuration)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Troubleshooting](#troubleshooting)

---

## ✅ Prerequisites

Before starting, ensure you have:

- **Hostinger VPS** access (SSH credentials)
- **Domain name** pointing to your VPS IP (optional but recommended)
- **OpenAI API Key** for AI features
- **SSH client** (PuTTY for Windows, or terminal for Mac/Linux)
- Basic knowledge of Linux commands

### VPS Requirements

- **OS**: Ubuntu 20.04+ or Debian 11+ (recommended)
- **RAM**: Minimum 2GB (4GB+ recommended)
- **Storage**: 20GB+ free space
- **CPU**: 2+ cores recommended

---

## 🖥️ VPS Server Setup

### 1. Connect to Your VPS

```bash
ssh root@your-vps-ip
# Or with username
ssh username@your-vps-ip
```

### 2. Update System Packages

```bash
sudo apt update
sudo apt upgrade -y
```

### 3. Create a Non-Root User (Recommended)

```bash
# Create new user
sudo adduser gamasusco
# Add to sudo group
sudo usermod -aG sudo gamasusco
# Switch to new user
su - gamasusco
```

### 4. Install Essential Tools

```bash
sudo apt install -y curl wget git build-essential software-properties-common
```

### 5. Configure Firewall

```bash
# Install UFW if not present
sudo apt install ufw

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS (we'll configure these later)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## 🐍 Backend Deployment

### Step 1: Install Python and Dependencies

```bash
# Install Python 3.10+
sudo apt install -y python3.10 python3.10-venv python3-pip python3-dev

# Verify installation
python3 --version
pip3 --version
```

### Step 2: Install PostgreSQL (Production Database)

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql

# In PostgreSQL prompt:
CREATE DATABASE carbon_accounting;
CREATE USER gamasusco_user WITH ENCRYPTED PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE carbon_accounting TO gamasusco_user;
\q
```

### Step 3: Clone Repository

```bash
# Navigate to home directory or create app directory
cd ~
mkdir -p apps
cd apps

# Clone repository
git clone https://github.com/rahulpal73071/GamaSusco_production_ready.git
cd GamaSusco_production_ready
```

### Step 4: Setup Python Virtual Environment

```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt

# Also install production dependencies
pip install gunicorn psycopg2-binary
```

### Step 5: Configure Environment Variables

```bash
# Copy example env file
cp env.example .env

# Edit .env file
nano .env
```

Update the `.env` file with production values:

```env
# OpenAI Configuration
OPENAI_API_KEY=your-actual-openai-api-key

# Model Selection
EXTRACTION_MODEL=gpt-4o-mini
CLASSIFICATION_MODEL=gpt-4o-mini
RECOMMENDATION_MODEL=gpt-4o-mini

# Authentication (IMPORTANT: Generate a strong secret key!)
SECRET_KEY=your-production-secret-key-generate-with-secrets-token-urlsafe-32
ACCESS_TOKEN_EXPIRE_HOURS=24

# Database (PostgreSQL)
DATABASE_URL=postgresql://gamasusco_user:your_secure_password_here@localhost:5432/carbon_accounting

# Processing Limits
MAX_PDF_PAGES=10
MAX_IMAGE_SIZE_MB=10
MAX_TEXT_LENGTH=8000

# File Upload
UPLOAD_FOLDER=/home/gamasusco/apps/GamaSusco_production_ready/uploads

# AI Estimation
AI_ESTIMATION_ENABLED=true

# Data Directory
DATA_DIR=/home/gamasusco/apps/GamaSusco_production_ready/data

# Environment
ENVIRONMENT=production
DEBUG=false
```

**Generate a secure SECRET_KEY:**
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Step 6: Create Required Directories

```bash
mkdir -p uploads
mkdir -p data
mkdir -p logs
```

### Step 7: Initialize Database

```bash
# Make sure virtual environment is activated
source venv/bin/activate

# Initialize database
python initialize_database.py
```

### Step 8: Test Backend Locally

```bash
# Test with uvicorn first
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Should see server starting message
# Test in another terminal:
curl http://localhost:8000/health
```

Press `Ctrl+C` to stop the test server.

### Step 9: Create Systemd Service for Backend

```bash
sudo nano /etc/systemd/system/gamasusco-api.service
```

Add the following content:

```ini
[Unit]
Description=GAMASUSCO AI Platform API (FastAPI)
After=network.target postgresql.service

[Service]
User=gamasusco
Group=gamasusco
WorkingDirectory=/home/gamasusco/apps/GamaSusco_production_ready
Environment="PATH=/home/gamasusco/apps/GamaSusco_production_ready/venv/bin"
ExecStart=/home/gamasusco/apps/GamaSusco_production_ready/venv/bin/gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 127.0.0.1:8000 --timeout 120 --access-logfile /home/gamasusco/apps/GamaSusco_production_ready/logs/access.log --error-logfile /home/gamasusco/apps/GamaSusco_production_ready/logs/error.log

Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Save and enable the service:

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable gamasusco-api

# Start the service
sudo systemctl start gamasusco-api

# Check status
sudo systemctl status gamasusco-api

# View logs
sudo journalctl -u gamasusco-api -f
```

---

## ⚛️ Frontend Deployment

### Step 1: Install Node.js and npm

```bash
# Install Node.js 18+ using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

### Step 2: Navigate to Frontend Directory

```bash
cd ~/apps/GamaSusco_production_ready/frontend-2/frontend
```

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Create Production Environment File

```bash
nano .env.production
```

Add:

```env
VITE_API_URL=https://api.yourdomain.com
# Or if using same domain:
# VITE_API_URL=https://yourdomain.com/api
```

### Step 5: Build Frontend for Production

```bash
# Build the application
npm run build

# This creates a 'dist' folder with production-ready files
```

### Step 6: Test Build Locally (Optional)

```bash
npm run preview
```

---

## 🌐 Nginx Configuration

### Step 1: Install Nginx

```bash
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
```

### Step 2: Configure Nginx for Backend API

```bash
sudo nano /etc/nginx/sites-available/gamasusco-api
```

Add configuration:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;  # Replace with your domain or IP

    # API proxy
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support (if needed)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Increase body size for file uploads
    client_max_body_size 50M;
}
```

### Step 3: Configure Nginx for Frontend

```bash
sudo nano /etc/nginx/sites-available/gamasusco-frontend
```

Add configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;  # Replace with your domain

    root /home/gamasusco/apps/GamaSusco_production_ready/frontend-2/frontend/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    # Serve frontend files
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache";
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Proxy API requests to backend
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        client_max_body_size 50M;
    }
}
```

### Step 4: Enable Sites and Test Configuration

```bash
# Enable sites
sudo ln -s /etc/nginx/sites-available/gamasusco-api /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/gamasusco-frontend /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# If test is successful, reload Nginx
sudo systemctl reload nginx
```

---

## 🔒 SSL/HTTPS Setup (Let's Encrypt)

### Step 1: Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### Step 2: Obtain SSL Certificates

```bash
# For API subdomain
sudo certbot --nginx -d api.yourdomain.com

# For main domain
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow the prompts:
- Enter your email address
- Agree to terms of service
- Choose whether to redirect HTTP to HTTPS (recommended: Yes)

### Step 3: Auto-Renewal Setup

Certbot automatically sets up auto-renewal. Test it:

```bash
# Test renewal
sudo certbot renew --dry-run
```

### Step 4: Update Nginx Configurations

Certbot automatically updates your Nginx configs to use HTTPS. Verify:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🗄️ Database Setup (PostgreSQL)

### Backup Database

```bash
# Create backup directory
mkdir -p ~/backups

# Backup command (run regularly via cron)
pg_dump -U gamasusco_user -d carbon_accounting > ~/backups/carbon_accounting_$(date +%Y%m%d_%H%M%S).sql

# Restore (if needed)
psql -U gamasusco_user -d carbon_accounting < ~/backups/carbon_accounting_backup.sql
```

### Setup Automated Backups

```bash
# Create backup script
nano ~/backup-db.sh
```

Add:

```bash
#!/bin/bash
BACKUP_DIR="/home/gamasusco/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/carbon_accounting_$DATE.sql"

# Create backup
pg_dump -U gamasusco_user carbon_accounting > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Delete backups older than 7 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

Make executable and add to crontab:

```bash
chmod +x ~/backup-db.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add this line:
0 2 * * * /home/gamasusco/backup-db.sh
```

---

## 🔄 Process Management

### Backend Service Commands

```bash
# Start service
sudo systemctl start gamasusco-api

# Stop service
sudo systemctl stop gamasusco-api

# Restart service
sudo systemctl restart gamasusco-api

# Check status
sudo systemctl status gamasusco-api

# View logs
sudo journalctl -u gamasusco-api -f
sudo journalctl -u gamasusco-api -n 100  # Last 100 lines

# Enable on boot
sudo systemctl enable gamasusco-api
```

### Nginx Commands

```bash
# Start/Stop/Restart
sudo systemctl start nginx
sudo systemctl stop nginx
sudo systemctl restart nginx
sudo systemctl reload nginx  # Reload without downtime

# Check status
sudo systemctl status nginx

# Test configuration
sudo nginx -t

# View logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

---

## 🌍 Domain Configuration

### DNS Setup

1. **Point Domain to VPS IP:**
   - Login to your domain registrar
   - Go to DNS settings
   - Add/Update A records:
     - `@` → Your VPS IP address
     - `www` → Your VPS IP address
     - `api` → Your VPS IP address (for API subdomain)

2. **Wait for DNS Propagation:**
   - Usually takes 5 minutes to 24 hours
   - Check with: `nslookup yourdomain.com`

### Update Nginx Configurations

After DNS propagates, update server names in Nginx configs to match your domain.

---

## 📊 Monitoring & Maintenance

### Monitor System Resources

```bash
# CPU and Memory usage
htop
# Or
top

# Disk usage
df -h

# Check running processes
ps aux | grep gunicorn
ps aux | grep nginx
```

### Application Logs

```bash
# Backend logs
tail -f /home/gamasusco/apps/GamaSusco_production_ready/logs/error.log
tail -f /home/gamasusco/apps/GamaSusco_production_ready/logs/access.log

# System service logs
sudo journalctl -u gamasusco-api -f

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Regular Maintenance Tasks

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update application code
cd ~/apps/GamaSusco_production_ready
git pull origin main
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart gamasusco-api

# Clear old logs (optional)
sudo journalctl --vacuum-time=30d  # Keep last 30 days
```

---

## 🔧 Troubleshooting

### Backend Not Starting

```bash
# Check service status
sudo systemctl status gamasusco-api

# Check logs
sudo journalctl -u gamasusco-api -n 50

# Test manually
cd ~/apps/GamaSusco_production_ready
source venv/bin/activate
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### Database Connection Issues

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
psql -U gamasusco_user -d carbon_accounting

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-*-main.log
```

### Nginx 502 Bad Gateway

```bash
# Check if backend is running
curl http://127.0.0.1:8000/health

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Verify backend service
sudo systemctl status gamasusco-api
```

### Frontend Not Loading

```bash
# Check if dist folder exists
ls -la ~/apps/GamaSusco_production_ready/frontend-2/frontend/dist

# Check Nginx configuration
sudo nginx -t

# Check file permissions
sudo chown -R gamasusco:gamasusco ~/apps/GamaSusco_production_ready/frontend-2/frontend/dist
```

### SSL Certificate Issues

```bash
# Check certificate status
sudo certbot certificates

# Renew manually
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run
```

### Port Already in Use

```bash
# Check what's using port 8000
sudo lsof -i :8000

# Kill process (replace PID)
sudo kill -9 <PID>

# Or change port in systemd service file
```

---

## 📝 Quick Reference Commands

```bash
# Backend
sudo systemctl restart gamasusco-api
sudo journalctl -u gamasusco-api -f

# Frontend (rebuild)
cd ~/apps/GamaSusco_production_ready/frontend-2/frontend
npm run build

# Nginx
sudo nginx -t
sudo systemctl reload nginx

# Database backup
pg_dump -U gamasusco_user carbon_accounting > backup.sql

# View logs
tail -f ~/apps/GamaSusco_production_ready/logs/error.log
```

---

## ✅ Deployment Checklist

- [ ] VPS server provisioned and accessible
- [ ] System packages updated
- [ ] Firewall configured (ports 22, 80, 443)
- [ ] Python 3.10+ installed
- [ ] PostgreSQL installed and configured
- [ ] Repository cloned
- [ ] Virtual environment created
- [ ] Dependencies installed
- [ ] .env file configured with production values
- [ ] Database initialized
- [ ] Backend systemd service created and running
- [ ] Node.js 18+ installed
- [ ] Frontend dependencies installed
- [ ] Frontend built for production
- [ ] Nginx installed and configured
- [ ] SSL certificates obtained (Let's Encrypt)
- [ ] DNS records configured
- [ ] Backups configured
- [ ] Monitoring setup
- [ ] Application tested and working

---

## 🆘 Support

If you encounter issues:

1. Check logs first
2. Verify all services are running
3. Test each component individually
4. Review error messages carefully
5. Check firewall and port configurations

---

**Deployment completed successfully!** 🎉

Your GAMASUSCO AI Platform should now be accessible at:
- Frontend: `https://yourdomain.com`
- API: `https://api.yourdomain.com` or `https://yourdomain.com/api`
- API Docs: `https://yourdomain.com/api/docs`

