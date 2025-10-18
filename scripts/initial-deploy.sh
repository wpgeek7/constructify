#!/bin/bash

###############################################################################
# Initial Deployment Script for EC2
# This script will be run ONCE to set up the application on EC2
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Constructify - Initial Deployment${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if running on EC2
if [ ! -f /home/ubuntu ]; then
    echo -e "${YELLOW}Warning: This script is designed to run on EC2 Ubuntu instance${NC}"
fi

echo -e "${YELLOW}Step 1: Updating system packages...${NC}"
sudo apt-get update -y
sudo apt-get upgrade -y

echo ""
echo -e "${YELLOW}Step 2: Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker ubuntu
    echo -e "${GREEN}✓ Docker installed${NC}"
else
    echo -e "${GREEN}✓ Docker already installed${NC}"
fi

echo ""
echo -e "${YELLOW}Step 3: Installing Docker Compose...${NC}"
if ! docker compose version &> /dev/null; then
    sudo apt-get install -y docker-compose-plugin
    echo -e "${GREEN}✓ Docker Compose installed${NC}"
else
    echo -e "${GREEN}✓ Docker Compose already installed${NC}"
fi

echo ""
echo -e "${YELLOW}Step 4: Installing Git...${NC}"
if ! command -v git &> /dev/null; then
    sudo apt-get install -y git
    echo -e "${GREEN}✓ Git installed${NC}"
else
    echo -e "${GREEN}✓ Git already installed${NC}"
fi

echo ""
echo -e "${YELLOW}Step 5: Cloning repository...${NC}"
cd /home/ubuntu
if [ -d "constructify" ]; then
    echo -e "${YELLOW}Repository already exists, pulling latest changes...${NC}"
    cd constructify
    git pull origin main
else
    git clone https://github.com/wpgeek7/constructify.git
    cd constructify
    echo -e "${GREEN}✓ Repository cloned${NC}"
fi

echo ""
echo -e "${YELLOW}Step 6: Configuring environment...${NC}"

# Copy main environment file
if [ ! -f .env ]; then
    cp env.docker.example .env
    
    # Update with EC2 IP
    sed -i "s|APP_URL=.*|APP_URL=http://3.93.201.157|g" .env
    sed -i "s|DB_PASSWORD=.*|DB_PASSWORD=ConstructifySecure2025!|g" .env
    
    echo -e "${GREEN}✓ Main .env configured${NC}"
else
    echo -e "${YELLOW}✓ Main .env already exists${NC}"
fi

# Copy backend environment file
cd backend
if [ ! -f .env ]; then
    cp .env.example .env
    
    # Update backend .env
    sed -i "s|APP_URL=.*|APP_URL=http://3.93.201.157|g" .env
    sed -i "s|DB_HOST=.*|DB_HOST=database|g" .env
    sed -i "s|DB_DATABASE=.*|DB_DATABASE=constructify|g" .env
    sed -i "s|DB_USERNAME=.*|DB_USERNAME=constructify_user|g" .env
    sed -i "s|DB_PASSWORD=.*|DB_PASSWORD=ConstructifySecure2025!|g" .env
    
    echo -e "${GREEN}✓ Backend .env configured${NC}"
else
    echo -e "${YELLOW}✓ Backend .env already exists${NC}"
fi

cd ..

echo ""
echo -e "${YELLOW}Step 7: Making scripts executable...${NC}"
chmod +x deploy-ec2.sh setup-ec2.sh scripts/*.sh

echo ""
echo -e "${YELLOW}Step 8: Building and starting Docker containers...${NC}"
docker-compose down 2>/dev/null || true
docker-compose build
docker-compose up -d

echo ""
echo -e "${YELLOW}Step 9: Waiting for containers to be ready...${NC}"
sleep 15

echo ""
echo -e "${YELLOW}Step 10: Generating Laravel application key...${NC}"
docker-compose exec -T backend php artisan key:generate --force

echo ""
echo -e "${YELLOW}Step 11: Running database migrations...${NC}"
docker-compose exec -T backend php artisan migrate --force

echo ""
echo -e "${YELLOW}Step 12: Optimizing Laravel...${NC}"
docker-compose exec -T backend php artisan config:cache
docker-compose exec -T backend php artisan route:cache
docker-compose exec -T backend php artisan view:cache

echo ""
echo -e "${YELLOW}Step 13: Setting permissions...${NC}"
docker-compose exec -T backend chown -R www-data:www-data /var/www/html/storage
docker-compose exec -T backend chmod -R 775 /var/www/html/storage

echo ""
echo -e "${YELLOW}Step 14: Creating deployment user for GitHub Actions...${NC}"
# This allows GitHub Actions to deploy without password
if ! grep -q "# GitHub Actions deployment" /home/ubuntu/.ssh/authorized_keys 2>/dev/null; then
    echo -e "${YELLOW}Note: You'll need to add GitHub Actions SSH key to authorized_keys${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Initial Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Frontend: ${GREEN}http://3.93.201.157${NC}"
echo -e "Backend API: ${GREEN}http://3.93.201.157:8000${NC}"
echo ""
echo -e "${YELLOW}Container Status:${NC}"
docker-compose ps
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Verify application is accessible"
echo "2. Set up GitHub Secrets for CI/CD"
echo "3. Test automatic deployment by pushing to main branch"
echo ""

