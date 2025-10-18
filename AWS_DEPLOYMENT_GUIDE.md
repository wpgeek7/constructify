# AWS EC2 Deployment Guide for Constructify

This comprehensive guide will walk you through deploying the Constructify application on AWS EC2 using Docker.

## ⚠️ SECURITY FIRST

**CRITICAL:** Before proceeding, you must understand these security practices:

1. **Never Share Credentials**: Never share AWS credentials, passwords, or API keys in chat, code, or documentation
2. **Use IAM Best Practices**: Create separate IAM users with minimal required permissions
3. **Enable MFA**: Always enable Multi-Factor Authentication on your AWS account
4. **Rotate Credentials**: Regularly rotate access keys and passwords
5. **Use Secrets Management**: For production, use AWS Secrets Manager or Parameter Store

## Prerequisites

Before starting, ensure you have:

- [ ] AWS Account with billing enabled
- [ ] Basic understanding of Linux command line
- [ ] SSH client installed on your local machine
- [ ] Git installed locally

## Part 1: Setting Up AWS CLI (Local Machine)

### Step 1: Install AWS CLI

**For macOS:**
```bash
brew install awscli
```

**For Linux:**
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

**For Windows:**
Download and install from: https://aws.amazon.com/cli/

### Step 2: Create IAM User for CLI Access

1. **Log in to AWS Console** (use your provided credentials)
2. Navigate to **IAM** service
3. Click **Users** → **Create user**
4. Username: `constructify-deploy-user`
5. Select **Attach policies directly**
6. Attach these policies:
   - `AmazonEC2FullAccess`
   - `AmazonVPCFullAccess` (optional, for network configuration)
7. Click **Next** → **Create user**

### Step 3: Create Access Keys

1. Click on the newly created user
2. Go to **Security credentials** tab
3. Click **Create access key**
4. Choose **Command Line Interface (CLI)**
5. Check the confirmation box
6. Click **Create access key**
7. **IMPORTANT**: Download the CSV file or copy both:
   - Access Key ID
   - Secret Access Key
8. Store these securely (use a password manager)

### Step 4: Configure AWS CLI

```bash
aws configure
```

You'll be prompted for:
```
AWS Access Key ID [None]: YOUR_ACCESS_KEY_ID
AWS Secret Access Key [None]: YOUR_SECRET_ACCESS_KEY
Default region name [None]: us-east-1
Default output format [None]: json
```

### Step 5: Verify Configuration

```bash
aws sts get-caller-identity
```

You should see your account details.

## Part 2: Creating an EC2 Instance

### Step 1: Create Security Group

```bash
# Create security group
aws ec2 create-security-group \
  --group-name constructify-sg \
  --description "Security group for Constructify application"

# Add inbound rules
# SSH
aws ec2 authorize-security-group-ingress \
  --group-name constructify-sg \
  --protocol tcp \
  --port 22 \
  --cidr 0.0.0.0/0

# HTTP
aws ec2 authorize-security-group-ingress \
  --group-name constructify-sg \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

# HTTPS
aws ec2 authorize-security-group-ingress \
  --group-name constructify-sg \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0

# Backend API
aws ec2 authorize-security-group-ingress \
  --group-name constructify-sg \
  --protocol tcp \
  --port 8000 \
  --cidr 0.0.0.0/0
```

### Step 2: Create Key Pair

```bash
aws ec2 create-key-pair \
  --key-name constructify-key \
  --query 'KeyMaterial' \
  --output text > constructify-key.pem

# Set correct permissions
chmod 400 constructify-key.pem
```

### Step 3: Launch EC2 Instance

```bash
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t2.medium \
  --key-name constructify-key \
  --security-groups constructify-sg \
  --block-device-mappings '[{"DeviceName":"/dev/sda1","Ebs":{"VolumeSize":30,"VolumeType":"gp3"}}]' \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=Constructify-App}]'
```

**Note**: 
- `t2.medium` (2 vCPU, 4GB RAM) recommended for this application
- Adjust `--image-id` based on your region (this is Ubuntu 20.04 LTS in us-east-1)
- Volume size is 30GB, adjust as needed

### Step 4: Get Instance Public IP

```bash
aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=Constructify-App" \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text
```

Save this IP address - you'll need it!

## Part 3: Configuring the EC2 Instance

### Step 1: Connect to EC2 Instance

```bash
ssh -i constructify-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

### Step 2: Run Initial Setup Script

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Download and run the setup script
# (Transfer setup-ec2.sh to the instance first)
```

Or manually install Docker:

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo apt-get install -y docker-compose-plugin

# Log out and back in for group changes
exit
```

Reconnect:
```bash
ssh -i constructify-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

### Step 3: Verify Docker Installation

```bash
docker --version
docker compose version
```

## Part 4: Deploying the Application

### Step 1: Transfer Application Files

**Option A: Using Git (Recommended)**

```bash
# On EC2 instance
cd /home/ubuntu
git clone YOUR_REPOSITORY_URL constructify
cd constructify
```

**Option B: Using SCP from local machine**

```bash
# From your local machine
scp -i constructify-key.pem -r /Applications/MAMP/htdocs/constructify ubuntu@YOUR_EC2_PUBLIC_IP:/home/ubuntu/
```

### Step 2: Configure Environment

```bash
# On EC2 instance
cd /home/ubuntu/constructify

# Copy and edit environment file
cp env.docker.example .env
nano .env
```

Update these values in `.env`:
```bash
APP_URL=http://YOUR_EC2_PUBLIC_IP
DB_PASSWORD=YOUR_SECURE_PASSWORD_HERE
```

### Step 3: Configure Backend Environment

```bash
cd backend
cp .env.production .env
nano .env
```

Update:
```bash
APP_URL=http://YOUR_EC2_PUBLIC_IP
DB_PASSWORD=YOUR_SECURE_PASSWORD_HERE
```

Generate application key:
```bash
# We'll do this after containers are running
```

### Step 4: Make Scripts Executable

```bash
cd /home/ubuntu/constructify
chmod +x deploy-ec2.sh setup-ec2.sh
```

### Step 5: Deploy Application

```bash
./deploy-ec2.sh
```

This script will:
1. Stop any existing containers
2. Build Docker images
3. Start all containers
4. Run database migrations
5. Optimize Laravel cache

### Step 6: Generate Laravel Application Key

```bash
docker-compose exec backend php artisan key:generate
```

### Step 7: Update Backend .env

```bash
# Copy the generated key
docker-compose exec backend cat .env | grep APP_KEY

# Update .env file
nano backend/.env
# Paste the APP_KEY value
```

### Step 8: Restart Containers

```bash
docker-compose restart backend
```

## Part 5: Verify Deployment

### Check Running Containers

```bash
docker-compose ps
```

All services should show as "Up".

### Check Logs

```bash
# All logs
docker-compose logs

# Specific service
docker-compose logs backend
docker-compose logs frontend

# Follow logs in real-time
docker-compose logs -f
```

### Test the Application

Open in your browser:
- **Frontend**: `http://YOUR_EC2_PUBLIC_IP`
- **Backend API**: `http://YOUR_EC2_PUBLIC_IP:8000/api`

## Part 6: Post-Deployment Configuration

### Configure Domain (Optional but Recommended)

1. **Register a domain** (e.g., from Route 53, Namecheap, etc.)
2. **Create an A record** pointing to your EC2 Public IP
3. **Update .env files** with your domain name
4. **Install SSL Certificate** (see SSL Setup section below)

### SSL Setup with Let's Encrypt (Production)

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal is configured automatically
# Test renewal
sudo certbot renew --dry-run
```

### Setup Automatic Backups

```bash
# Create backup script
cat > /home/ubuntu/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
docker-compose exec -T database mysqldump -u constructify_user -p$DB_PASSWORD constructify > $BACKUP_DIR/db_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "db_*.sql" -mtime +7 -delete
EOF

chmod +x /home/ubuntu/backup.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /home/ubuntu/backup.sh") | crontab -
```

## Part 7: Monitoring and Maintenance

### View Application Logs

```bash
# Real-time logs
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100

# Specific service
docker-compose logs -f backend
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
docker-compose restart frontend
```

### Update Application

```bash
# Pull latest code
cd /home/ubuntu/constructify
git pull

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Run migrations if needed
docker-compose exec backend php artisan migrate --force
```

### Scale Resources (If Needed)

```bash
# Stop instance
aws ec2 stop-instances --instance-ids YOUR_INSTANCE_ID

# Change instance type
aws ec2 modify-instance-attribute \
  --instance-id YOUR_INSTANCE_ID \
  --instance-type t2.large

# Start instance
aws ec2 start-instances --instance-ids YOUR_INSTANCE_ID
```

## Common Issues and Solutions

### Issue 1: Cannot connect to EC2

**Solution**: Check security group allows SSH (port 22) from your IP:
```bash
aws ec2 describe-security-groups --group-names constructify-sg
```

### Issue 2: Docker containers won't start

**Solution**: Check logs and ensure enough memory:
```bash
docker-compose logs
free -h
```

### Issue 3: Database connection errors

**Solution**: Verify database credentials in .env match docker-compose.yml:
```bash
docker-compose exec backend php artisan config:clear
docker-compose restart backend
```

### Issue 4: Permission errors

**Solution**: Fix storage permissions:
```bash
docker-compose exec backend chown -R www-data:www-data /var/www/html/storage
docker-compose exec backend chmod -R 775 /var/www/html/storage
```

## Security Best Practices

### 1. Restrict SSH Access

```bash
# Allow SSH only from your IP
aws ec2 revoke-security-group-ingress \
  --group-name constructify-sg \
  --protocol tcp \
  --port 22 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-name constructify-sg \
  --protocol tcp \
  --port 22 \
  --cidr YOUR_IP_ADDRESS/32
```

### 2. Enable AWS CloudWatch

Monitor your instance and set up alarms for:
- High CPU usage
- High memory usage
- Disk space

### 3. Regular Updates

```bash
# On EC2 instance
sudo apt-get update && sudo apt-get upgrade -y

# Update Docker images
docker-compose pull
docker-compose up -d
```

### 4. Use AWS Secrets Manager (Production)

For production deployments, store sensitive data in AWS Secrets Manager instead of .env files.

## Cost Optimization

- **Use Reserved Instances** for long-term deployments (up to 75% savings)
- **Schedule instance stop/start** for development environments
- **Monitor billing** with AWS Budgets and alerts
- **Use spot instances** for non-critical workloads

## Monitoring Costs

```bash
# Check current month estimated charges
aws cloudwatch get-metric-statistics \
  --namespace AWS/Billing \
  --metric-name EstimatedCharges \
  --dimensions Name=Currency,Value=USD \
  --start-time $(date -u -d '1 month ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 86400 \
  --statistics Maximum
```

## Cleanup (When no longer needed)

```bash
# Stop and remove containers
docker-compose down -v

# Terminate EC2 instance
aws ec2 terminate-instances --instance-ids YOUR_INSTANCE_ID

# Delete security group
aws ec2 delete-security-group --group-name constructify-sg

# Delete key pair
aws ec2 delete-key-pair --key-name constructify-key
rm constructify-key.pem
```

## Additional Resources

- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)
- [Docker Documentation](https://docs.docker.com/)
- [Laravel Deployment](https://laravel.com/docs/deployment)
- [React Deployment](https://create-react-app.dev/docs/deployment/)

## Support

For issues specific to:
- **AWS**: Check AWS Support or AWS Forums
- **Docker**: Check Docker Documentation
- **Application**: Review application logs and documentation

---

## Quick Reference Commands

```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs -f

# Restart application
docker-compose restart

# Stop application
docker-compose down

# Start application
docker-compose up -d

# Access backend shell
docker-compose exec backend bash

# Run Laravel commands
docker-compose exec backend php artisan [command]

# Database backup
docker-compose exec database mysqldump -u root -p constructify > backup.sql

# Database restore
docker-compose exec -T database mysql -u root -p constructify < backup.sql
```

---

**Remember**: Always follow security best practices and never commit sensitive credentials to version control!

