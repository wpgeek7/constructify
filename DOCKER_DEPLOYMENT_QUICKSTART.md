# Docker Deployment Quick Start Guide

This is a condensed guide for quick deployment. For detailed instructions, see `AWS_DEPLOYMENT_GUIDE.md`.

## 🚨 IMPORTANT SECURITY NOTICE

**NEVER share your AWS credentials in chat, code, or documentation!**

The credentials you shared earlier are for AWS Console login, NOT for AWS CLI.
Please change your AWS Console password immediately as a security precaution.

## What You Need

### For AWS CLI (Not Console Credentials!)

AWS CLI requires **Access Keys**, which are different from console login credentials:

1. Sign in to AWS Console at: https://834458830409.signin.aws.amazon.com/console
2. Go to **IAM** → **Users** → Your user (vikas_admin) → **Security credentials**
3. Click **Create access key** → Choose **CLI** → Download the keys
4. You'll get:
   - Access Key ID (like: AKIAIOSFODNN7EXAMPLE)
   - Secret Access Key (like: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY)

## Quick Setup Steps

### 1. Install and Configure AWS CLI (Local Machine)

```bash
# Install AWS CLI (macOS)
brew install awscli

# Configure with your ACCESS KEYS (not console password!)
aws configure
# Enter your Access Key ID
# Enter your Secret Access Key
# Region: us-east-1
# Format: json

# Verify
aws sts get-caller-identity
```

### 2. Create Security Group

```bash
aws ec2 create-security-group \
  --group-name constructify-sg \
  --description "Constructify app security group"

# Allow ports
aws ec2 authorize-security-group-ingress --group-name constructify-sg --protocol tcp --port 22 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-name constructify-sg --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-name constructify-sg --protocol tcp --port 443 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-name constructify-sg --protocol tcp --port 8000 --cidr 0.0.0.0/0
```

### 3. Create Key Pair

```bash
aws ec2 create-key-pair \
  --key-name constructify-key \
  --query 'KeyMaterial' \
  --output text > constructify-key.pem

chmod 400 constructify-key.pem
```

### 4. Launch EC2 Instance

```bash
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t2.medium \
  --key-name constructify-key \
  --security-groups constructify-sg \
  --block-device-mappings '[{"DeviceName":"/dev/sda1","Ebs":{"VolumeSize":30}}]' \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=Constructify-App}]'
```

### 5. Get Instance IP

```bash
aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=Constructify-App" \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text
```

Save this IP address!

### 6. Connect to Instance

```bash
ssh -i constructify-key.pem ubuntu@YOUR_EC2_IP
```

### 7. Install Docker on EC2

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo apt-get update
sudo apt-get install -y docker-compose-plugin

# Log out and back in
exit
```

Reconnect:
```bash
ssh -i constructify-key.pem ubuntu@YOUR_EC2_IP
```

### 8. Transfer Application

**Option A: Using SCP**
```bash
# From local machine
cd /Applications/MAMP/htdocs
scp -i constructify-key.pem -r constructify ubuntu@YOUR_EC2_IP:/home/ubuntu/
```

**Option B: Using Git (if you have a repository)**
```bash
# On EC2
git clone YOUR_REPO_URL constructify
cd constructify
```

### 9. Configure Environment

```bash
cd /home/ubuntu/constructify

# Configure main environment
cp env.docker.example .env
nano .env
```

Update in `.env`:
```
APP_URL=http://YOUR_EC2_IP
DB_PASSWORD=YourSecurePassword123!
```

```bash
# Configure backend
cd backend
cp .env.production .env
nano .env
```

Update same values in `backend/.env`

### 10. Deploy!

```bash
cd /home/ubuntu/constructify
chmod +x deploy-ec2.sh
./deploy-ec2.sh
```

### 11. Generate Laravel Key

```bash
docker-compose exec backend php artisan key:generate
```

Copy the generated key and add it to `backend/.env`, then:

```bash
docker-compose restart backend
```

### 12. Access Your Application

- **Frontend**: http://YOUR_EC2_IP
- **Backend API**: http://YOUR_EC2_IP:8000/api

## Useful Commands

```bash
# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Stop application
docker-compose down

# Start application
docker-compose up -d

# Check status
docker-compose ps

# Access backend shell
docker-compose exec backend bash

# Run Laravel commands
docker-compose exec backend php artisan [command]
```

## Troubleshooting

### Can't connect to EC2
- Check security group allows SSH from your IP
- Verify instance is running: `aws ec2 describe-instances`

### Docker errors
- Check if Docker is installed: `docker --version`
- Verify you're in docker group: `groups`
- Check logs: `docker-compose logs`

### Permission errors
```bash
docker-compose exec backend chown -R www-data:www-data /var/www/html/storage
docker-compose exec backend chmod -R 775 /var/www/html/storage
```

### Database errors
```bash
docker-compose exec backend php artisan config:clear
docker-compose restart
```

## Next Steps

1. **Set up a domain name** and point it to your EC2 IP
2. **Install SSL certificate** using Let's Encrypt
3. **Configure backups** (see full guide)
4. **Set up monitoring** with CloudWatch
5. **Review security settings** in AWS Console

## Important Files Created

- `Dockerfile` (backend & frontend) - Container definitions
- `docker-compose.yml` - Multi-container orchestration
- `nginx/backend.conf` - Nginx configuration for Laravel
- `frontend/nginx.conf` - Nginx configuration for React
- `deploy-ec2.sh` - Deployment automation script
- `setup-ec2.sh` - EC2 initial setup script
- `.dockerignore` - Files to exclude from Docker builds

## Cost Estimate

**t2.medium instance (2 vCPU, 4GB RAM)**:
- On-demand: ~$35/month
- 1-year Reserved Instance: ~$20/month (save 40%)
- 30GB EBS storage: ~$3/month
- Data transfer: Variable

**Total**: ~$38-40/month for on-demand, ~$23-25/month with reserved instance

## Security Reminders

✅ Change AWS Console password immediately
✅ Use Access Keys (not console credentials) for CLI
✅ Enable MFA on AWS account
✅ Store credentials in password manager
✅ Never commit .env files to Git
✅ Use strong database passwords
✅ Restrict security group access
✅ Keep system and Docker updated

---

For detailed explanations, SSL setup, monitoring, and advanced configuration, see the full **AWS_DEPLOYMENT_GUIDE.md**.

