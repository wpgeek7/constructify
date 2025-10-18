#!/bin/bash

###############################################################################
# SSL Configuration Script for constructefy.ai
# This script installs SSL and configures the domain
###############################################################################

set -e

DOMAIN="constructefy.ai"
WWW_DOMAIN="www.constructefy.ai"
EMAIL="admin@constructefy.ai"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}SSL Setup: $DOMAIN${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

echo -e "${YELLOW}Step 1: Installing Certbot...${NC}"
sudo apt-get update -qq
sudo apt-get install -y certbot

echo ""
echo -e "${YELLOW}Step 2: Stopping containers temporarily...${NC}"
cd /home/ubuntu/constructify
docker compose -f docker-compose.prod.yml down

echo ""
echo -e "${YELLOW}Step 3: Obtaining SSL certificate...${NC}"
sudo certbot certonly --standalone \
  -d $DOMAIN \
  -d $WWW_DOMAIN \
  --non-interactive \
  --agree-tos \
  --email $EMAIL \
  --preferred-challenges http

echo ""
echo -e "${YELLOW}Step 4: Creating Nginx SSL configuration...${NC}"

# Update frontend nginx.conf with SSL
cat > /home/ubuntu/constructify/frontend/nginx-ssl.conf << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name constructefy.ai www.constructefy.ai;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name constructefy.ai www.constructefy.ai;
    
    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/constructefy.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/constructefy.ai/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    root /usr/share/nginx/html;
    index index.html index.htm;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Proxy API requests to backend
    location /api {
        proxy_pass http://webserver:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    error_page 404 /index.html;
}
EOF

echo ""
echo -e "${YELLOW}Step 5: Updating docker-compose for SSL...${NC}"

# Create docker-compose with SSL volumes
cat > /home/ubuntu/constructify/docker-compose.ssl.yml << 'EOF'
version: '3.8'

services:
  database:
    image: mysql:8.0
    container_name: constructify-db
    restart: unless-stopped
    environment:
      MYSQL_DATABASE: ${DB_DATABASE:-constructify}
      MYSQL_ROOT_PASSWORD: ${DB_PASSWORD:-secret}
      MYSQL_PASSWORD: ${DB_PASSWORD:-secret}
      MYSQL_USER: ${DB_USERNAME:-constructify_user}
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - constructify-network
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      timeout: 20s
      retries: 10

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: constructify-backend
    restart: unless-stopped
    working_dir: /var/www/html
    volumes:
      - backend_storage:/var/www/html/storage
    environment:
      APP_NAME: Constructify
      APP_ENV: production
      APP_DEBUG: 'false'
      APP_URL: https://constructefy.ai
      DB_CONNECTION: mysql
      DB_HOST: database
      DB_PORT: 3306
      DB_DATABASE: ${DB_DATABASE:-constructify}
      DB_USERNAME: ${DB_USERNAME:-constructify_user}
      DB_PASSWORD: ${DB_PASSWORD:-secret}
      CACHE_DRIVER: file
      QUEUE_CONNECTION: sync
      SESSION_DRIVER: file
    depends_on:
      database:
        condition: service_healthy
    networks:
      - constructify-network

  webserver:
    image: nginx:alpine
    container_name: constructify-webserver
    restart: unless-stopped
    volumes:
      - ./nginx/backend.conf:/etc/nginx/conf.d/default.conf
    volumes_from:
      - backend
    depends_on:
      - backend
    networks:
      - constructify-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: constructify-frontend
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./frontend/nginx-ssl.conf:/etc/nginx/conf.d/default.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      - backend
      - webserver
    networks:
      - constructify-network

networks:
  constructify-network:
    driver: bridge

volumes:
  mysql_data:
    driver: local
  backend_storage:
    driver: local
EOF

echo ""
echo -e "${YELLOW}Step 6: Updating environment files...${NC}"

# Update .env
sed -i "s|APP_URL=.*|APP_URL=https://constructefy.ai|g" .env

# Update backend/.env
sed -i "s|APP_URL=.*|APP_URL=https://constructefy.ai|g" backend/.env

echo ""
echo -e "${YELLOW}Step 7: Starting containers with SSL...${NC}"
docker compose -f docker-compose.ssl.yml up -d

echo ""
echo -e "${YELLOW}Step 8: Waiting for containers to start...${NC}"
sleep 10

echo ""
echo -e "${YELLOW}Step 9: Running migrations...${NC}"
docker compose -f docker-compose.ssl.yml exec -T backend php artisan migrate --force

echo ""
echo -e "${YELLOW}Step 10: Optimizing Laravel...${NC}"
docker compose -f docker-compose.ssl.yml exec -T backend php artisan config:cache
docker compose -f docker-compose.ssl.yml exec -T backend php artisan route:cache
docker compose -f docker-compose.ssl.yml exec -T backend php artisan view:cache

echo ""
echo -e "${YELLOW}Step 11: Setting up auto-renewal...${NC}"
sudo bash -c 'cat > /etc/cron.d/certbot-renew << EOL
0 12 * * * root certbot renew --quiet --deploy-hook "cd /home/ubuntu/constructify && docker compose -f docker-compose.ssl.yml restart frontend"
EOL'

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ SSL Configuration Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "Your site is now available at:"
echo -e "  ${GREEN}https://constructefy.ai${NC}"
echo -e "  ${GREEN}https://www.constructefy.ai${NC}"
echo ""
echo -e "HTTP requests will automatically redirect to HTTPS!"
echo ""
echo -e "${YELLOW}SSL Certificate Info:${NC}"
sudo certbot certificates
echo ""

