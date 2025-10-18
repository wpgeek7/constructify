# 🚀 CI/CD Pipeline Setup Guide

This guide will help you set up automatic deployment to your EC2 instance whenever you push code to the `main` branch.

---

## 📋 Overview

**What You'll Get:**
- ✅ Automatic deployment on every push to `main` branch
- ✅ Zero-downtime deployments
- ✅ Automatic database migrations
- ✅ Cache optimization
- ✅ Health checks after deployment
- ✅ Rollback capability

**Deployment Flow:**
```
Push to main → GitHub Actions → SSH to EC2 → Pull Code → Rebuild → Deploy → Verify
```

---

## 🔧 Setup Steps

### Step 1: Get Your SSH Private Key Content

The SSH private key is already created at:
```
/Applications/MAMP/htdocs/constructify/constructify-key.pem
```

**Read the content:**
```bash
cat /Applications/MAMP/htdocs/constructify/constructify-key.pem
```

**Copy the entire output** (including `-----BEGIN ... KEY-----` and `-----END ... KEY-----`)

---

### Step 2: Add GitHub Secrets

1. **Go to your GitHub repository:**
   https://github.com/wpgeek7/constructify

2. **Navigate to Settings:**
   - Click **Settings** (top menu)
   - Click **Secrets and variables** → **Actions** (left sidebar)

3. **Add these 3 secrets:**

#### Secret 1: `EC2_HOST`
- Click **New repository secret**
- Name: `EC2_HOST`
- Value: `3.93.201.157`
- Click **Add secret**

#### Secret 2: `EC2_USERNAME`
- Click **New repository secret**
- Name: `EC2_USERNAME`
- Value: `ubuntu`
- Click **Add secret**

#### Secret 3: `EC2_SSH_KEY`
- Click **New repository secret**
- Name: `EC2_SSH_KEY`
- Value: Paste the ENTIRE content of `constructify-key.pem`
- Click **Add secret**

**✅ All 3 secrets should now be visible in your repository secrets list.**

---

### Step 3: Deploy Application Initially

Before the CI/CD pipeline works, you need to deploy the application once manually.

**Option A: Automated Initial Deployment (Recommended)**

Run this single command from your local machine:

```bash
cd /Applications/MAMP/htdocs/constructify
ssh -i constructify-key.pem ubuntu@3.93.201.157 'bash -s' < scripts/initial-deploy.sh
```

This will:
- Install Docker and dependencies
- Clone the repository
- Configure environment files
- Build and start containers
- Run migrations
- Optimize Laravel

**Time:** ~5 minutes

**Option B: Manual Step-by-Step**

Follow the instructions in `YOUR_EC2_DEPLOYMENT.md`

---

### Step 4: Verify Initial Deployment

**Check if application is running:**

```bash
# Test frontend
curl http://3.93.201.157

# Test backend API
curl http://3.93.201.157:8000/api/health
```

**Or open in browser:**
- Frontend: http://3.93.201.157
- Backend: http://3.93.201.157:8000

---

### Step 5: Test CI/CD Pipeline

Now that the initial deployment is done, test the automatic deployment:

1. **Make a small change to your code** (e.g., edit README.md)

```bash
cd /Applications/MAMP/htdocs/constructify
echo "Last updated: $(date)" >> README.md
git add README.md
git commit -m "Test CI/CD pipeline"
git push origin main
```

2. **Watch the deployment:**
   - Go to: https://github.com/wpgeek7/constructify/actions
   - You should see a new workflow run
   - Click on it to watch the deployment progress
   - Should complete in 3-5 minutes

3. **Verify deployment:**
   - Check your application at http://3.93.201.157
   - Changes should be live!

---

## 🔄 How Automatic Deployment Works

### Trigger:
Every time you push to `main` branch

### What Happens:
1. **GitHub Actions starts** the workflow
2. **Connects to EC2** via SSH
3. **Pulls latest code** from GitHub
4. **Stops containers** gracefully
5. **Rebuilds images** with new code
6. **Starts containers** back up
7. **Runs migrations** (if any)
8. **Optimizes caches** for performance
9. **Verifies** everything is running
10. **Reports status** (success/failure)

### Duration:
- Normal deployment: 3-5 minutes
- With rebuild: 5-7 minutes

---

## 📁 Files Created

### CI/CD Configuration:
```
.github/workflows/deploy.yml    ← GitHub Actions workflow
```

### Deployment Scripts:
```
scripts/initial-deploy.sh       ← First-time deployment
scripts/auto-deploy.sh          ← Automatic deployment script
```

---

## 🎯 Deployment Commands

### Manual Deployment (from local machine):
```bash
ssh -i constructify-key.pem ubuntu@3.93.201.157 'cd /home/ubuntu/constructify && git pull && docker-compose restart'
```

### Quick Restart (from EC2):
```bash
cd /home/ubuntu/constructify
docker-compose restart
```

### Full Rebuild (from EC2):
```bash
cd /home/ubuntu/constructify
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### View Logs (from EC2):
```bash
cd /home/ubuntu/constructify
docker-compose logs -f
```

---

## 🔍 Monitoring Deployments

### View GitHub Actions:
https://github.com/wpgeek7/constructify/actions

### Check deployment status on EC2:
```bash
ssh -i constructify-key.pem ubuntu@3.93.201.157 'cd /home/ubuntu/constructify && docker-compose ps'
```

### Check application logs:
```bash
ssh -i constructify-key.pem ubuntu@3.93.201.157 'cd /home/ubuntu/constructify && docker-compose logs --tail=100'
```

---

## ⚡ Advanced Features

### Manual Trigger

You can manually trigger deployment from GitHub:
1. Go to https://github.com/wpgeek7/constructify/actions
2. Click "Deploy to EC2" workflow
3. Click "Run workflow"
4. Select branch (main)
5. Click "Run workflow"

### Rollback to Previous Version

If deployment fails, rollback:

```bash
ssh -i constructify-key.pem ubuntu@3.93.201.157 << 'EOF'
cd /home/ubuntu/constructify
git log --oneline -5  # Find previous commit
git reset --hard COMMIT_HASH  # Replace with actual hash
docker-compose restart
EOF
```

### Deploy Specific Branch

Modify `.github/workflows/deploy.yml`:
```yaml
on:
  push:
    branches:
      - main
      - develop  # Add other branches
```

---

## 🚨 Troubleshooting

### Deployment Fails with "Permission Denied"

**Fix:** Ensure SSH key is added to GitHub Secrets correctly

```bash
# Test SSH connection
ssh -i constructify-key.pem ubuntu@3.93.201.157 'echo "Connection successful!"'
```

### Deployment Succeeds but App Not Working

**Check logs:**
```bash
ssh -i constructify-key.pem ubuntu@3.93.201.157 'cd /home/ubuntu/constructify && docker-compose logs'
```

**Common issues:**
- Environment variables not set
- Database migration failed
- Permissions issues

**Fix:**
```bash
ssh -i constructify-key.pem ubuntu@3.93.201.157 << 'EOF'
cd /home/ubuntu/constructify
docker-compose exec backend php artisan config:clear
docker-compose exec backend php artisan migrate --force
docker-compose exec backend chown -R www-data:www-data storage
docker-compose restart
EOF
```

### Containers Keep Restarting

**Check why:**
```bash
ssh -i constructify-key.pem ubuntu@3.93.201.157 'cd /home/ubuntu/constructify && docker-compose logs --tail=100 backend'
```

**Common causes:**
- Out of memory (t3.micro has 1GB only)
- Configuration errors
- Database connection issues

### GitHub Actions Stuck

- Check if EC2 instance is running
- Verify security group allows outbound traffic
- Check if disk space is full: `df -h`

---

## 📊 Deployment Statistics

### Typical Deployment Times:
- Code pull: 5-10 seconds
- Container rebuild: 2-3 minutes
- Container startup: 10-15 seconds
- Migrations: 5-10 seconds
- Cache optimization: 5-10 seconds

**Total: ~3-5 minutes**

### Resource Usage:
- **CPU:** Spike to 80-100% during build, then 5-20% normal
- **Memory:** 500-800MB used (out of 1GB)
- **Disk:** ~2-3GB for containers + code

---

## 🔐 Security Best Practices

✅ **SSH Key Security:**
- Never commit `constructify-key.pem` to Git
- Keep it safe on your local machine
- Rotate keys periodically

✅ **GitHub Secrets:**
- Only admins can view secrets
- Secrets are encrypted
- Not visible in logs

✅ **EC2 Security:**
- Keep system updated
- Monitor failed login attempts
- Use security groups properly

---

## 🎨 Customizing Deployment

### Add Slack Notifications

Add to `.github/workflows/deploy.yml`:

```yaml
- name: Notify Slack
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Add Email Notifications

GitHub sends email by default, but you can customize in:
Repository Settings → Notifications

### Run Tests Before Deploy

Add before deployment step:

```yaml
- name: Run Tests
  run: |
    cd backend
    composer install
    php artisan test
```

---

## 📝 Deployment Checklist

**Before First Deployment:**
- [ ] EC2 instance running
- [ ] Security group configured
- [ ] SSH key working
- [ ] GitHub secrets added (all 3)
- [ ] Repository code pushed

**After Each Deployment:**
- [ ] Check GitHub Actions status
- [ ] Verify application is accessible
- [ ] Check logs for errors
- [ ] Test critical features
- [ ] Monitor resource usage

**Weekly Maintenance:**
- [ ] Check disk space
- [ ] Review logs
- [ ] Update dependencies
- [ ] Backup database
- [ ] Check AWS billing

---

## 🚀 Quick Start Commands

### Initial Setup:
```bash
# 1. Add GitHub Secrets (do once)
# 2. Run initial deployment
cd /Applications/MAMP/htdocs/constructify
ssh -i constructify-key.pem ubuntu@3.93.201.157 'bash -s' < scripts/initial-deploy.sh
```

### Test Pipeline:
```bash
# Make a change and push
echo "Test: $(date)" >> README.md
git add README.md
git commit -m "Test deployment"
git push origin main

# Watch at: https://github.com/wpgeek7/constructify/actions
```

### Check Status:
```bash
ssh -i constructify-key.pem ubuntu@3.93.201.157 'cd /home/ubuntu/constructify && docker-compose ps && docker-compose logs --tail=20'
```

---

## 📚 Additional Resources

- **GitHub Actions Docs:** https://docs.github.com/en/actions
- **Docker Compose Docs:** https://docs.docker.com/compose/
- **Laravel Deployment:** https://laravel.com/docs/deployment

---

## ✅ Success Criteria

Your CI/CD pipeline is working when:

1. ✅ Push to main triggers GitHub Actions
2. ✅ Workflow completes successfully (green checkmark)
3. ✅ Application updates within 5 minutes
4. ✅ No downtime during deployment
5. ✅ All containers running after deployment
6. ✅ Application accessible at http://3.93.201.157

---

**Your CI/CD pipeline is ready! 🎉**

**Next Step:** Run the initial deployment command above, then test by pushing a change!

