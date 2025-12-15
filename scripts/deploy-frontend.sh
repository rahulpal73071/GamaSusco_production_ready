#!/bin/bash
# Frontend Deployment Script for GAMASUSCO AI Platform
# Usage: ./scripts/deploy-frontend.sh

set -e  # Exit on error

echo "🚀 Starting GAMASUSCO Frontend Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variables
FRONTEND_DIR="frontend-2/frontend"

echo -e "${GREEN}📍 Frontend directory: $FRONTEND_DIR${NC}"

# Check if frontend directory exists
if [ ! -d "$FRONTEND_DIR" ]; then
    echo -e "${RED}❌ Frontend directory not found: $FRONTEND_DIR${NC}"
    exit 1
fi

cd "$FRONTEND_DIR"

# Step 1: Check Node.js
echo -e "\n${YELLOW}1️⃣ Checking Node.js installation...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found!${NC}"
    echo "Install Node.js first:"
    echo "curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
    echo "sudo apt install -y nodejs"
    exit 1
fi

NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
echo "✅ Node.js: $NODE_VERSION"
echo "✅ npm: $NPM_VERSION"

# Step 2: Check .env.production
echo -e "\n${YELLOW}2️⃣ Checking environment configuration...${NC}"
if [ ! -f .env.production ]; then
    echo -e "${YELLOW}⚠️  .env.production not found, creating from template...${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env.production
        echo "Please edit .env.production with your API URL"
    else
        echo "VITE_API_URL=https://api.yourdomain.com" > .env.production
        echo "Created .env.production with default values"
        echo -e "${YELLOW}⚠️  Please edit .env.production with your actual API URL${NC}"
    fi
fi

# Step 3: Install/Update dependencies
echo -e "\n${YELLOW}3️⃣ Installing dependencies...${NC}"
npm install

# Step 4: Build for production
echo -e "\n${YELLOW}4️⃣ Building for production...${NC}"
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Build failed! dist directory not found${NC}"
    exit 1
fi

# Step 5: Check build output
echo -e "\n${YELLOW}5️⃣ Verifying build...${NC}"
DIST_SIZE=$(du -sh dist | cut -f1)
echo "✅ Build completed successfully"
echo "✅ Build size: $DIST_SIZE"

# Step 6: Set permissions
echo -e "\n${YELLOW}6️⃣ Setting file permissions...${NC}"
chmod -R 755 dist

# Step 7: Reload Nginx (if configured)
echo -e "\n${YELLOW}7️⃣ Reloading Nginx...${NC}"
if command -v nginx &> /dev/null; then
    if sudo nginx -t 2>/dev/null; then
        sudo systemctl reload nginx
        echo -e "${GREEN}✅ Nginx reloaded${NC}"
    else
        echo -e "${YELLOW}⚠️  Nginx configuration test failed${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Nginx not found or not accessible${NC}"
fi

echo -e "\n${GREEN}✅ Frontend deployment completed!${NC}"
echo -e "\n📝 Build output: $(pwd)/dist"
echo -e "\n💡 Tips:"
echo "  - Ensure Nginx is configured to serve the dist folder"
echo "  - Check that .env.production has the correct API URL"
echo "  - Clear browser cache if you see old content"

cd - > /dev/null

