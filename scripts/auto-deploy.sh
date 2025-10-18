#!/bin/bash

###############################################################################
# Auto-Deployment Script
# This script is called by GitHub Actions for automatic deployments
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Auto-Deployment Started${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

cd /home/ubuntu/constructify

echo -e "${YELLOW}Step 1: Pulling latest code...${NC}"
git fetch origin main
git reset --hard origin/main
echo -e "${GREEN}✓ Code updated${NC}"

echo ""
echo -e "${YELLOW}Step 2: Stopping containers...${NC}"
docker-compose down
echo -e "${GREEN}✓ Containers stopped${NC}"

echo ""
echo -e "${YELLOW}Step 3: Rebuilding containers...${NC}"
docker-compose build --no-cache
echo -e "${GREEN}✓ Containers rebuilt${NC}"

echo ""
echo -e "${YELLOW}Step 4: Starting containers...${NC}"
docker-compose up -d
echo -e "${GREEN}✓ Containers started${NC}"

echo ""
echo -e "${YELLOW}Step 5: Waiting for services to be ready...${NC}"
sleep 10

echo ""
echo -e "${YELLOW}Step 6: Running database migrations...${NC}"
docker-compose exec -T backend php artisan migrate --force
echo -e "${GREEN}✓ Migrations completed${NC}"

echo ""
echo -e "${YELLOW}Step 7: Clearing and caching configurations...${NC}"
docker-compose exec -T backend php artisan config:cache
docker-compose exec -T backend php artisan route:cache
docker-compose exec -T backend php artisan view:cache
echo -e "${GREEN}✓ Cache optimized${NC}"

echo ""
echo -e "${YELLOW}Step 8: Setting permissions...${NC}"
docker-compose exec -T backend chown -R www-data:www-data /var/www/html/storage
docker-compose exec -T backend chmod -R 775 /var/www/html/storage
echo -e "${GREEN}✓ Permissions set${NC}"

echo ""
echo -e "${YELLOW}Step 9: Verifying deployment...${NC}"
docker-compose ps
echo ""

# Check if containers are running
if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}✓ All containers are running${NC}"
else
    echo -e "${RED}✗ Some containers are not running${NC}"
    docker-compose logs --tail=50
    exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Deployment Completed Successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Application is live at:"
echo -e "Frontend: ${GREEN}http://3.93.201.157${NC}"
echo -e "Backend: ${GREEN}http://3.93.201.157:8000${NC}"
echo ""

