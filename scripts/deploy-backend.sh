#!/bin/bash
# Backend Deployment Script for GAMASUSCO AI Platform
# Usage: ./scripts/deploy-backend.sh

set -e  # Exit on error

echo "🚀 Starting GAMASUSCO Backend Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   echo -e "${RED}❌ Please do not run as root. Use a regular user with sudo privileges.${NC}"
   exit 1
fi

# Variables
APP_DIR=$(pwd)
VENV_DIR="$APP_DIR/venv"
PYTHON_CMD="python3"

echo -e "${GREEN}📍 Working directory: $APP_DIR${NC}"

# Step 1: Update code from Git
echo -e "\n${YELLOW}1️⃣ Pulling latest code from Git...${NC}"
git pull origin main || echo "⚠️  Git pull failed or not a git repo, continuing..."

# Step 2: Create/Activate virtual environment
echo -e "\n${YELLOW}2️⃣ Setting up virtual environment...${NC}"
if [ ! -d "$VENV_DIR" ]; then
    echo "Creating virtual environment..."
    $PYTHON_CMD -m venv venv
fi

source venv/bin/activate
echo "✅ Virtual environment activated"

# Step 3: Upgrade pip
echo -e "\n${YELLOW}3️⃣ Upgrading pip...${NC}"
pip install --upgrade pip

# Step 4: Install/Update dependencies
echo -e "\n${YELLOW}4️⃣ Installing dependencies...${NC}"
pip install -r requirements.txt
pip install gunicorn psycopg2-binary 2>/dev/null || echo "⚠️  psycopg2-binary installation failed (may need system packages)"

# Step 5: Create required directories
echo -e "\n${YELLOW}5️⃣ Creating required directories...${NC}"
mkdir -p uploads data logs

# Step 6: Check .env file
echo -e "\n${YELLOW}6️⃣ Checking environment configuration...${NC}"
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo "Please create .env file from env.example"
    echo "cp env.example .env"
    echo "Then edit .env with your configuration"
    exit 1
fi

# Step 7: Run database migrations (if needed)
echo -e "\n${YELLOW}7️⃣ Running database setup...${NC}"
read -p "Initialize/update database? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    python initialize_database.py
fi

# Step 8: Test application
echo -e "\n${YELLOW}8️⃣ Testing application...${NC}"
python -c "from app.main import app; print('✅ Application imports successfully')" || {
    echo -e "${RED}❌ Application import failed!${NC}"
    exit 1
}

# Step 9: Restart service
echo -e "\n${YELLOW}9️⃣ Restarting systemd service...${NC}"
if systemctl is-active --quiet gamasusco-api; then
    echo "Restarting gamasusco-api service..."
    sudo systemctl restart gamasusco-api
    sleep 2
    
    if systemctl is-active --quiet gamasusco-api; then
        echo -e "${GREEN}✅ Service restarted successfully${NC}"
    else
        echo -e "${RED}❌ Service failed to start!${NC}"
        echo "Check logs with: sudo journalctl -u gamasusco-api -n 50"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  Service not found or not running${NC}"
    echo "You may need to create the systemd service file manually"
fi

# Step 10: Check service status
echo -e "\n${YELLOW}🔟 Checking service status...${NC}"
sudo systemctl status gamasusco-api --no-pager -l | head -20

echo -e "\n${GREEN}✅ Backend deployment completed!${NC}"
echo -e "\n📝 Useful commands:"
echo "  View logs: sudo journalctl -u gamasusco-api -f"
echo "  Restart:   sudo systemctl restart gamasusco-api"
echo "  Status:    sudo systemctl status gamasusco-api"

