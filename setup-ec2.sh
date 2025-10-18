#!/bin/bash

###############################################################################
# AWS EC2 Initial Setup Script
# Run this script on a fresh EC2 instance to install Docker and dependencies
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Constructify - EC2 Instance Setup${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run this script with sudo or as root${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Updating system packages...${NC}"
apt-get update
apt-get upgrade -y

echo ""
echo -e "${YELLOW}Step 2: Installing required dependencies...${NC}"
apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    git \
    unzip

echo ""
echo -e "${YELLOW}Step 3: Installing Docker...${NC}"
# Add Docker's official GPG key
mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up the repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

echo ""
echo -e "${YELLOW}Step 4: Starting Docker service...${NC}"
systemctl start docker
systemctl enable docker

echo ""
echo -e "${YELLOW}Step 5: Adding ubuntu user to docker group...${NC}"
usermod -aG docker ubuntu || usermod -aG docker $SUDO_USER

echo ""
echo -e "${YELLOW}Step 6: Installing Docker Compose...${NC}"
apt-get install -y docker-compose-plugin

echo ""
echo -e "${YELLOW}Step 7: Configuring firewall (UFW)...${NC}"
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 8000/tcp  # Backend API
echo "y" | ufw enable

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}EC2 Instance Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Log out and log back in for docker group changes to take effect"
echo "2. Clone your application repository"
echo "3. Configure .env file"
echo "4. Run ./deploy-ec2.sh to deploy the application"
echo ""
echo -e "${YELLOW}Verify Docker installation:${NC}"
echo "  docker --version"
echo "  docker compose version"
echo ""

