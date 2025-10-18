#!/bin/bash

###############################################################################
# Domain Setup Script for constructefy.ai
# Run this AFTER DNS is pointing to your server
###############################################################################

set -e

DOMAIN="constructefy.ai"
WWW_DOMAIN="www.constructefy.ai"
EC2_IP="3.93.201.157"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Domain Setup: $DOMAIN${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if running on EC2
if [ ! -d /home/ubuntu ]; then
    echo -e "${RED}This script should be run on the EC2 instance${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Verifying DNS propagation...${NC}"
DNS_IP=$(dig +short $DOMAIN | tail -n1)

if [ "$DNS_IP" != "$EC2_IP" ]; then
    echo -e "${RED}DNS not propagated yet!${NC}"
    echo -e "Current DNS points to: ${RED}$DNS_IP${NC}"
    echo -e "Should point to: ${GREEN}$EC2_IP${NC}"
    echo ""
    echo "Please wait for DNS to propagate (10 minutes to 48 hours)"
    echo "Check status at: https://dnschecker.org"
    exit 1
fi

echo -e "${GREEN}✓ DNS is correctly pointing to $EC2_IP${NC}"

echo ""
echo -e "${YELLOW}Step 2: Installing Certbot for SSL...${NC}"
sudo apt-get update -qq
sudo apt-get install -y certbot python3-certbot-nginx

echo ""
echo -e "${YELLOW}Step 3: Updating environment files...${NC}"
cd /home/ubuntu/constructify

# Update main .env
if [ -f .env ]; then
    sed -i "s|APP_URL=.*|APP_URL=https://$DOMAIN|g" .env
    echo -e "${GREEN}✓ Updated main .env${NC}"
fi

# Update backend .env
if [ -f backend/.env ]; then
    sed -i "s|APP_URL=.*|APP_URL=https://$DOMAIN|g" backend/.env
    echo -e "${GREEN}✓ Updated backend/.env${NC}"
fi

echo ""
echo -e "${YELLOW}Step 4: Creating Nginx configuration for domain...${NC}"

# Create nginx config for frontend with domain
sudo tee /etc/nginx/sites-available/constructefy.ai > /dev/null <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN $WWW_DOMAIN;

    root /var/www/html;
    index index.html;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

echo ""
echo -e "${YELLOW}Step 5: Obtaining SSL certificate from Let's Encrypt...${NC}"
echo -e "${YELLOW}Note: You'll need to accept terms and provide email${NC}"
echo ""

sudo certbot --nginx -d $DOMAIN -d $WWW_DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN --redirect

echo ""
echo -e "${YELLOW}Step 6: Restarting Docker containers with new configuration...${NC}"
docker compose -f docker-compose.prod.yml restart

echo ""
echo -e "${YELLOW}Step 7: Testing SSL certificate renewal...${NC}"
sudo certbot renew --dry-run

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Domain Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Your application is now available at:"
echo -e "  ${GREEN}https://$DOMAIN${NC}"
echo -e "  ${GREEN}https://$WWW_DOMAIN${NC}"
echo ""
echo -e "${YELLOW}SSL Certificate Info:${NC}"
sudo certbot certificates
echo ""
echo -e "${YELLOW}Auto-renewal:${NC}"
echo "Certbot will automatically renew your certificate before expiry"
echo ""

