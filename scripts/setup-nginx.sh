#!/bin/bash
# Nginx setup script for GAMASUSCO Platform
# Usage: sudo ./scripts/setup-nginx.sh [domain]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

DOMAIN=${1:-"yourdomain.com"}
API_DOMAIN="api.$DOMAIN"
APP_DIR=$(pwd)
FRONTEND_DIR="$APP_DIR/frontend-2/frontend/dist"

echo "🌐 Setting up Nginx for GAMASUSCO Platform"
echo -e "${GREEN}Domain: $DOMAIN${NC}"
echo -e "${GREEN}API Domain: $API_DOMAIN${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
   echo -e "${RED}❌ This script needs sudo privileges${NC}"
   exit 1
fi

# Check if Nginx is installed
if ! command -v nginx &> /dev/null; then
    echo -e "${YELLOW}Installing Nginx...${NC}"
    apt update
    apt install -y nginx
fi

# Create API configuration
echo -e "\n${YELLOW}Creating API configuration...${NC}"
cat > /etc/nginx/sites-available/gamasusco-api << EOF
server {
    listen 80;
    server_name $API_DOMAIN;

    # API proxy
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    client_max_body_size 50M;
}
EOF

# Create Frontend configuration
echo -e "${YELLOW}Creating Frontend configuration...${NC}"
cat > /etc/nginx/sites-available/gamasusco-frontend << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    root $FRONTEND_DIR;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    # Serve frontend files
    location / {
        try_files \$uri \$uri/ /index.html;
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
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        client_max_body_size 50M;
    }
}
EOF

# Enable sites
echo -e "\n${YELLOW}Enabling sites...${NC}"
ln -sf /etc/nginx/sites-available/gamasusco-api /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/gamasusco-frontend /etc/nginx/sites-enabled/

# Remove default site if exists
[ -f /etc/nginx/sites-enabled/default ] && rm /etc/nginx/sites-enabled/default

# Test configuration
echo -e "${YELLOW}Testing Nginx configuration...${NC}"
if nginx -t; then
    echo -e "${GREEN}✅ Nginx configuration is valid${NC}"
    
    # Reload Nginx
    systemctl reload nginx
    echo -e "${GREEN}✅ Nginx reloaded${NC}"
else
    echo -e "${RED}❌ Nginx configuration test failed${NC}"
    exit 1
fi

echo -e "\n${GREEN}✅ Nginx setup completed!${NC}"
echo -e "\n📝 Next steps:"
echo "  1. Update DNS records to point to this server"
echo "  2. Setup SSL with: sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN -d $API_DOMAIN"
echo "  3. Ensure frontend is built: cd frontend-2/frontend && npm run build"

