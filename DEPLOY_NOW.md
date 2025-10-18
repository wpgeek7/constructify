# 🚀 Deploy Constructify to AWS EC2 - Step by Step

Follow these commands **in order**. Copy and paste each one into your terminal.

## Prerequisites Checklist

Before starting, ensure you have:
- [ ] Changed AWS Console password (URGENT!)
- [ ] Created AWS CLI Access Keys from IAM
- [ ] Run `aws configure` and entered your access keys
- [ ] Verified with: `aws sts get-caller-identity`

---

## Step 1: Create Security Group (1 minute)

```bash
# Create security group
aws ec2 create-security-group \
  --group-name constructify-sg \
  --description "Constructify app security group"

# Allow SSH (port 22)
aws ec2 authorize-security-group-ingress \
  --group-name constructify-sg \
  --protocol tcp \
  --port 22 \
  --cidr 0.0.0.0/0

# Allow HTTP (port 80)
aws ec2 authorize-security-group-ingress \
  --group-name constructify-sg \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

# Allow HTTPS (port 443)
aws ec2 authorize-security-group-ingress \
  --group-name constructify-sg \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0

# Allow Backend API (port 8000)
aws ec2 authorize-security-group-ingress \
  --group-name constructify-sg \
  --protocol tcp \
  --port 8000 \
  --cidr 0.0.0.0/0
```

**Expected output:** JSON confirmation for each command

---

## Step 2: Create SSH Key Pair (1 minute)

```bash
# Create key pair and save to file
aws ec2 create-key-pair \
  --key-name constructify-key \
  --query 'KeyMaterial' \
  --output text > constructify-key.pem

# Set correct permissions
chmod 400 constructify-key.pem
```

**Expected output:** Key saved to `constructify-key.pem`

---

## Step 3: Launch EC2 Instance (2 minutes)

**Note:** Update the AMI ID based on your region. This is for us-east-1.

```bash
# Launch EC2 instance (t2.medium - ~$35/month)
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t2.medium \
  --key-name constructify-key \
  --security-groups constructify-sg \
  --block-device-mappings '[{"DeviceName":"/dev/sda1","Ebs":{"VolumeSize":30,"VolumeType":"gp3"}}]' \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=Constructify-App}]'
```

**Expected output:** JSON with instance details

**Wait 2-3 minutes for instance to start**

---

## Step 4: Get Instance Public IP (30 seconds)

```bash
# Get your instance public IP
aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=Constructify-App" \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text
```

**Copy this IP address!** You'll need it multiple times.

**Save it as a variable:**
```bash
export EC2_IP=YOUR_IP_HERE  # Replace with actual IP
echo $EC2_IP  # Verify it's saved
```

---

## Step 5: Connect to EC2 Instance (1 minute)

```bash
# Connect via SSH
ssh -i constructify-key.pem ubuntu@$EC2_IP
```

**If you get a warning about host authenticity, type `yes` and press Enter.**

You should now be inside your EC2 instance! The prompt will change to `ubuntu@ip-xxx-xxx-xxx-xxx:~$`

---

## Step 6: Install Docker on EC2 (5 minutes)

**Run these commands on your EC2 instance:**

```bash
# Update system packages
sudo apt-get update

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add ubuntu user to docker group
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo apt-get update
sudo apt-get install -y docker-compose-plugin

# Verify installation
docker --version
docker compose version
```

**Log out and back in for group changes to take effect:**
```bash
exit
```

Then reconnect:
```bash
ssh -i constructify-key.pem ubuntu@$EC2_IP
```

---

## Step 7: Transfer Application Code (3 minutes)

**Option A: Using Git (Recommended)**

On your EC2 instance:
```bash
# Clone your repository
git clone https://github.com/wpgeek7/constructify.git
cd constructify
```

**Option B: Using SCP (if Git doesn't work)**

On your **local machine** (open new terminal, don't close EC2 connection):
```bash
cd /Applications/MAMP/htdocs
scp -i constructify-key.pem -r constructify ubuntu@$EC2_IP:/home/ubuntu/
```

Then on EC2:
```bash
cd /home/ubuntu/constructify
```

---

## Step 8: Configure Environment (3 minutes)

**On your EC2 instance:**

```bash
# Copy main environment file
cp env.docker.example .env

# Edit with your IP and secure password
nano .env
```

**Update these lines in .env:**
```bash
APP_URL=http://YOUR_EC2_IP_HERE
DB_DATABASE=constructify
DB_USERNAME=constructify_user
DB_PASSWORD=YourSecurePassword123!  # Change this!
```

**Press:** `Ctrl+O` (save), `Enter`, `Ctrl+X` (exit)

**Configure backend:**
```bash
cd backend
cp .env.example .env
nano .env
```

**Update same values:**
```bash
APP_URL=http://YOUR_EC2_IP_HERE
DB_HOST=database
DB_DATABASE=constructify
DB_USERNAME=constructify_user
DB_PASSWORD=YourSecurePassword123!  # Same as above!
```

**Press:** `Ctrl+O`, `Enter`, `Ctrl+X`

Go back to root:
```bash
cd ..
```

---

## Step 9: Deploy Application! (5 minutes)

```bash
# Make deployment script executable
chmod +x deploy-ec2.sh

# Run deployment
./deploy-ec2.sh
```

**This will:**
- Build Docker images (3-4 minutes)
- Start all containers
- Run database migrations
- Optimize Laravel

**Expected output:** Green success messages

---

## Step 10: Generate Laravel Application Key (1 minute)

```bash
# Generate app key
docker-compose exec backend php artisan key:generate

# View the generated key
docker-compose exec backend cat .env | grep APP_KEY
```

**Copy the APP_KEY value (including `base64:...`)**

**Update backend/.env with the key:**
```bash
nano backend/.env
```

Find `APP_KEY=` and paste the value you copied.

**Press:** `Ctrl+O`, `Enter`, `Ctrl+X`

**Restart backend:**
```bash
docker-compose restart backend
```

---

## Step 11: Verify Deployment (2 minutes)

```bash
# Check all containers are running
docker-compose ps
```

**All services should show "Up"**

```bash
# Check logs
docker-compose logs --tail=50
```

**Should see no critical errors**

---

## Step 12: Access Your Application! 🎉

Open in your browser:

**Frontend:** `http://YOUR_EC2_IP`
**Backend API:** `http://YOUR_EC2_IP:8000/api`

**Test the API:**
```bash
curl http://$EC2_IP:8000/api/health
```

---

## ✅ Deployment Complete!

Your Constructify application is now live on AWS EC2!

### What's Running:
- ✅ React Frontend (Port 80)
- ✅ Laravel Backend API (Port 8000)
- ✅ MySQL Database (Internal)
- ✅ Nginx Web Servers

### Useful Commands:

```bash
# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Stop application
docker-compose down

# Start application
docker-compose up -d

# Check container status
docker-compose ps

# Access backend shell
docker-compose exec backend bash

# Run Laravel commands
docker-compose exec backend php artisan [command]
```

---

## 🔧 Troubleshooting

### Containers won't start
```bash
docker-compose logs
free -h  # Check memory
df -h    # Check disk space
```

### Can't connect to database
```bash
docker-compose exec backend php artisan config:clear
docker-compose restart backend
```

### Permission errors
```bash
docker-compose exec backend chown -R www-data:www-data /var/www/html/storage
docker-compose exec backend chmod -R 775 /var/www/html/storage
```

### Need to rebuild
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

## 📊 Monitoring Costs

Your estimated monthly cost:
- **t2.medium instance:** ~$35/month (on-demand)
- **30GB storage:** ~$3/month
- **Data transfer:** Variable

**Save money:** Buy 1-year Reserved Instance for ~$20/month (40% savings)

---

## 🔐 Security Checklist

- [ ] Changed AWS Console password
- [ ] Using Access Keys (not console password)
- [ ] Enabled MFA on AWS account
- [ ] Changed default database password
- [ ] Keeping .env files secure
- [ ] Regular backups configured

---

## 📞 Need Help?

Check these guides:
1. `AWS_DEPLOYMENT_GUIDE.md` - Detailed explanations
2. `DOCKER_README.md` - Docker commands
3. `DEPLOYMENT_SUMMARY.md` - Overview

---

**Estimated Total Time:** 20-25 minutes

**Good luck with your deployment!** 🚀

