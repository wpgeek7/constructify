#!/bin/bash

###############################################################################
# Quick script to update domain in all configuration files
# Run from local machine to update and push config
###############################################################################

DOMAIN="constructefy.ai"

echo "Updating domain to: $DOMAIN"

# Update docker compose env files
if [ -f .env ]; then
    sed -i.bak "s|APP_URL=http://3.93.201.157|APP_URL=https://$DOMAIN|g" .env
    echo "✓ Updated .env"
fi

if [ -f env.docker.example ]; then
    sed -i.bak "s|APP_URL=http://your-ec2-public-ip-or-domain.com|APP_URL=https://$DOMAIN|g" env.docker.example
    echo "✓ Updated env.docker.example"
fi

# Update backend env example
if [ -f backend/.env.example ]; then
    sed -i.bak "s|APP_URL=http://localhost|APP_URL=https://$DOMAIN|g" backend/.env.example
    echo "✓ Updated backend/.env.example"
fi

if [ -f backend/.env.production ]; then
    sed -i.bak "s|APP_URL=http://localhost|APP_URL=https://$DOMAIN|g" backend/.env.production
    echo "✓ Updated backend/.env.production"
fi

echo ""
echo "Domain updated in local files!"
echo "Next: Commit and push these changes"

