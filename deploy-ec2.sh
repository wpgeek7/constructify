#!/bin/bash

###############################################################################
# AWS EC2 Deployment Script for Constructify
# This script helps deploy the Dockerized application to AWS EC2
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Constructify - AWS EC2 Deployment${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    echo -e "${YELLOW}Please copy .env.example to .env and configure it.${NC}"
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}Error: docker-compose is not installed!${NC}"
    echo "Please install Docker Compose first."
    exit 1
fi

# Load environment variables
source .env

echo -e "${YELLOW}Step 1: Stopping existing containers...${NC}"
docker-compose down

echo ""
echo -e "${YELLOW}Step 2: Building Docker images...${NC}"
docker-compose build --no-cache

echo ""
echo -e "${YELLOW}Step 3: Starting containers...${NC}"
docker-compose up -d

echo ""
echo -e "${YELLOW}Step 4: Waiting for database to be ready...${NC}"
sleep 10

echo ""
echo -e "${YELLOW}Step 5: Running database migrations...${NC}"
docker-compose exec -T backend php artisan migrate --force

echo ""
echo -e "${YELLOW}Step 6: Optimizing Laravel...${NC}"
docker-compose exec -T backend php artisan config:cache
docker-compose exec -T backend php artisan route:cache
docker-compose exec -T backend php artisan view:cache

echo ""
echo -e "${YELLOW}Step 7: Setting permissions...${NC}"
docker-compose exec -T backend chown -R www-data:www-data /var/www/html/storage
docker-compose exec -T backend chmod -R 775 /var/www/html/storage

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Frontend: ${GREEN}http://${APP_URL:-localhost}${NC}"
echo -e "Backend API: ${GREEN}http://${APP_URL:-localhost}:8000${NC}"
echo ""
echo -e "${YELLOW}To view logs:${NC}"
echo "  docker-compose logs -f"
echo ""
echo -e "${YELLOW}To stop the application:${NC}"
echo "  docker-compose down"
echo ""

