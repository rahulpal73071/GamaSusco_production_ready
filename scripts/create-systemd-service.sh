#!/bin/bash
# Create systemd service file for GAMASUSCO API
# Usage: ./scripts/create-systemd-service.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🔧 Creating systemd service for GAMASUSCO API..."

# Get current user
CURRENT_USER=$(whoami)
APP_DIR=$(pwd)
SERVICE_NAME="gamasusco-api"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"

echo -e "${GREEN}User: $CURRENT_USER${NC}"
echo -e "${GREEN}App Directory: $APP_DIR${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
   echo -e "${YELLOW}⚠️  This script needs sudo privileges${NC}"
   echo "Run with: sudo ./scripts/create-systemd-service.sh"
   exit 1
fi

# Create service file
echo -e "\n${YELLOW}Creating service file: $SERVICE_FILE${NC}"

cat > $SERVICE_FILE << EOF
[Unit]
Description=GAMASUSCO AI Platform API (FastAPI)
After=network.target postgresql.service

[Service]
User=$CURRENT_USER
Group=$CURRENT_USER
WorkingDirectory=$APP_DIR
Environment="PATH=$APP_DIR/venv/bin"
ExecStart=$APP_DIR/venv/bin/gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 127.0.0.1:8000 --timeout 120 --access-logfile $APP_DIR/logs/access.log --error-logfile $APP_DIR/logs/error.log

Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

echo -e "${GREEN}✅ Service file created${NC}"

# Create logs directory if it doesn't exist
mkdir -p "$APP_DIR/logs"
chown $CURRENT_USER:$CURRENT_USER "$APP_DIR/logs"

# Reload systemd
echo -e "\n${YELLOW}Reloading systemd...${NC}"
systemctl daemon-reload

# Enable service
echo -e "${YELLOW}Enabling service...${NC}"
systemctl enable $SERVICE_NAME

echo -e "\n${GREEN}✅ Service created and enabled!${NC}"
echo -e "\n📝 Next steps:"
echo "  Start service:   sudo systemctl start $SERVICE_NAME"
echo "  Check status:    sudo systemctl status $SERVICE_NAME"
echo "  View logs:       sudo journalctl -u $SERVICE_NAME -f"
echo "  Restart:         sudo systemctl restart $SERVICE_NAME"

