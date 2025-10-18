# 🚀 Your EC2 Instance is Ready!

## ✅ AWS Infrastructure Created Successfully

Your EC2 instance has been provisioned and is ready for deployment!

---

## 📋 Instance Details

| Item | Value |
|------|-------|
| **Instance ID** | `i-030b259cda6f320f0` |
| **Public IP** | `3.93.201.157` |
| **Instance Type** | t3.micro (1 vCPU, 1GB RAM) |
| **Cost** | **FREE** (Free Tier eligible) |
| **Status** | ✅ RUNNING |
| **Region** | us-east-1 (N. Virginia) |
| **OS** | Ubuntu 24.04 LTS |
| **Security Group** | constructify-sg |
| **SSH Key** | constructify-key.pem |

---

## 🔑 SSH Key Location

Your SSH key is saved at:
```
/Applications/MAMP/htdocs/constructify/constructify-key.pem
```

**⚠️ IMPORTANT:** Keep this file safe! It's your only way to access the server.

---

## 🚀 Deploy Your Application (15 minutes)

### Step 1: Connect to Your EC2 Instance

Open your terminal and run:

```bash
cd /Applications/MAMP/htdocs/constructify
ssh -i constructify-key.pem ubuntu@3.93.201.157
```

**If prompted about host authenticity, type `yes` and press Enter.**

You should see:
```
ubuntu@ip-172-31-29-182:~$
```

---

### Step 2: Install Docker (5 minutes)

Run these commands on your EC2 instance:

```bash
# Update system
sudo apt-get update

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo apt-get install -y docker-compose-plugin

# Verify installation
docker --version
docker compose version
```

**Log out and back in:**
```bash
exit
```

Then reconnect:
```bash
ssh -i constructify-key.pem ubuntu@3.93.201.157
```

---

### Step 3: Transfer Your Application (2 minutes)

**Option A: Using Git (Recommended)**

On your EC2 instance:
```bash
git clone https://github.com/wpgeek7/constructify.git
cd constructify
```

**Option B: Using SCP**

On your **local machine** (new terminal window):
```bash
cd /Applications/MAMP/htdocs
scp -i constructify-key.pem -r constructify ubuntu@3.93.201.157:/home/ubuntu/
```

Then on EC2:
```bash
cd /home/ubuntu/constructify
```

---

### Step 4: Configure Environment (2 minutes)

```bash
# Copy environment file
cp env.docker.example .env

# Edit with your settings
nano .env
```

Update these values:
```bash
APP_URL=http://3.93.201.157
DB_DATABASE=constructify
DB_USERNAME=constructify_user
DB_PASSWORD=YourSecurePassword123!
```

**Press:** `Ctrl+O` (save), `Enter`, `Ctrl+X` (exit)

**Configure backend:**
```bash
cd backend
cp .env.example .env
nano .env
```

Update same values:
```bash
APP_URL=http://3.93.201.157
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

### Step 5: Deploy! (5 minutes)

```bash
# Make script executable
chmod +x deploy-ec2.sh

# Run deployment
./deploy-ec2.sh
```

This will:
- Build Docker images (3-4 minutes)
- Start all containers
- Run database migrations
- Optimize Laravel

---

### Step 6: Generate Laravel Key (1 minute)

```bash
# Generate app key
docker-compose exec backend php artisan key:generate

# View the generated key
docker-compose exec backend cat .env | grep APP_KEY
```

**Copy the APP_KEY value** (including `base64:...`)

**Update backend/.env:**
```bash
nano backend/.env
```

Find `APP_KEY=` and paste the value.

**Press:** `Ctrl+O`, `Enter`, `Ctrl+X`

**Restart backend:**
```bash
docker-compose restart backend
```

---

### Step 7: Verify Deployment

```bash
# Check all containers are running
docker-compose ps
```

All services should show "Up"!

```bash
# Check logs
docker-compose logs --tail=50
```

---

## 🎉 Access Your Application!

### Your Application URLs:

**🌐 Frontend (React App):**
```
http://3.93.201.157
```

**🔌 Backend API:**
```
http://3.93.201.157:8000/api
```

### Test the API:

On your local machine:
```bash
curl http://3.93.201.157:8000/api/health
```

Or open in your browser:
- http://3.93.201.157

---

## 📊 What's Running

Your EC2 instance now has:

1. ✅ **Frontend** (React + Nginx) - Port 80
2. ✅ **Backend** (Laravel + PHP-FPM) - Port 9000
3. ✅ **Webserver** (Nginx for API) - Port 8000
4. ✅ **Database** (MySQL 8.0) - Port 3306 (internal)

---

## 🛠️ Useful Commands

### View Logs
```bash
docker-compose logs -f
docker-compose logs backend
docker-compose logs frontend
```

### Restart Services
```bash
docker-compose restart
docker-compose restart backend
```

### Stop Application
```bash
docker-compose down
```

### Start Application
```bash
docker-compose up -d
```

### Check Status
```bash
docker-compose ps
```

### Access Backend Shell
```bash
docker-compose exec backend bash
```

### Run Laravel Commands
```bash
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

### Database connection errors
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

## 💰 Cost Information

**t3.micro instance** (what you have):
- ✅ **FREE** for 750 hours/month (first 12 months)
- After free tier: ~$7.50/month

**Storage:**
- 8GB default: **FREE** (30GB free tier)

**Data Transfer:**
- 100GB outbound: **FREE** (15GB free tier + normal usage)

### Estimated Total Cost:
- **First 12 months:** $0/month (FREE TIER)
- **After 12 months:** ~$7.50/month

---

## ⚠️ CRITICAL SECURITY REMINDERS

### 1. Rotate AWS Credentials (DO THIS TODAY!)

The AWS credentials you shared are now compromised. You MUST:

1. Go to AWS Console: https://834458830409.signin.aws.amazon.com/console
2. Navigate to **IAM** → **Users** → **vikas_admin**
3. Go to **Security credentials**
4. **Deactivate** the current access key: `AKIA4ESM7IZEQRBINUOB`
5. **Create new** access key
6. Store it securely in a password manager
7. Never share credentials again!

### 2. Delete Downloaded Credentials

```bash
# Delete the CSV file
rm ~/Downloads/vikas_admin_accessKeys.csv
```

### 3. Secure Your SSH Key

```bash
# Verify permissions
ls -l constructify-key.pem

# Should show: -r--------
```

### 4. Enable MFA

1. Go to AWS Console
2. IAM → Users → vikas_admin
3. Security credentials
4. Enable Multi-Factor Authentication

---

## 🔒 Security Best Practices

✅ Keep .env files secret  
✅ Use strong database passwords  
✅ Rotate credentials regularly  
✅ Keep SSH key secure  
✅ Enable AWS MFA  
✅ Monitor AWS billing  
✅ Regular backups  
✅ Keep system updated  

---

## 📈 Next Steps (Optional)

### 1. Setup Domain Name
- Register a domain (Namecheap, GoDaddy, Route 53)
- Point A record to: `3.93.201.157`
- Update .env files with domain

### 2. Install SSL Certificate
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### 3. Setup Automated Backups
```bash
# Create backup script
nano /home/ubuntu/backup.sh
```

Add:
```bash
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup database
docker-compose exec -T database mysqldump -u root -p$DB_PASSWORD constructify > $BACKUP_DIR/db_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "db_*.sql" -mtime +7 -delete
```

Make executable and schedule:
```bash
chmod +x /home/ubuntu/backup.sh
crontab -e
# Add: 0 2 * * * /home/ubuntu/backup.sh
```

### 4. Monitor with CloudWatch
- Enable detailed monitoring in EC2 console
- Set up billing alerts
- Configure log shipping

### 5. Upgrade Instance (if needed)
If t3.micro is too slow:
```bash
# Stop instance
aws ec2 stop-instances --instance-ids i-030b259cda6f320f0

# Change to t3.small (~$15/month)
aws ec2 modify-instance-attribute --instance-id i-030b259cda6f320f0 --instance-type t3.small

# Start instance
aws ec2 start-instances --instance-ids i-030b259cda6f320f0
```

---

## 📞 Need Help?

If you encounter issues:

1. Check logs: `docker-compose logs -f`
2. Review error messages
3. Check the comprehensive guides:
   - `AWS_DEPLOYMENT_GUIDE.md`
   - `DOCKER_README.md`
   - `DEPLOYMENT_SUMMARY.md`

---

## ✅ Deployment Checklist

- [ ] Connect to EC2: `ssh -i constructify-key.pem ubuntu@3.93.201.157`
- [ ] Install Docker
- [ ] Clone/transfer application
- [ ] Configure .env files
- [ ] Run `./deploy-ec2.sh`
- [ ] Generate Laravel app key
- [ ] Verify deployment: http://3.93.201.157
- [ ] Rotate AWS credentials ⚠️
- [ ] Delete credential CSV file ⚠️
- [ ] Enable AWS MFA
- [ ] Setup domain (optional)
- [ ] Install SSL (optional)
- [ ] Configure backups (optional)

---

**Status:** ✅ Ready to deploy!  
**Time Required:** 15-20 minutes  
**Cost:** FREE (first 12 months)

**Good luck with your deployment! 🚀**

---

## Quick Connect Command

```bash
ssh -i /Applications/MAMP/htdocs/constructify/constructify-key.pem ubuntu@3.93.201.157
```

Save this for easy access!

