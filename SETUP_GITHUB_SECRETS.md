# 🔐 GitHub Secrets Setup for CI/CD

Your application is deployed! Now set up GitHub Actions for automatic deployment whenever you push to `main`.

---

## ✅ What's Already Done

- ✅ EC2 instance running (3.93.201.157)
- ✅ Application deployed and working
- ✅ GitHub Actions workflow created
- ✅ Deployment scripts ready

---

## 🔑 Setup GitHub Secrets (5 minutes)

### Step 1: Get Your SSH Key

The SSH private key is at:
```
/Applications/MAMP/htdocs/constructify/constructify-key.pem
```

**Read it:**
```bash
cat /Applications/MAMP/htdocs/constructify/constructify-key.pem
```

**Copy the ENTIRE output** (including `-----BEGIN ... KEY-----` and `-----END ... KEY-----`)

---

### Step 2: Add Secrets to GitHub

1. **Go to your repository:**
   https://github.com/wpgeek7/constructify

2. **Navigate to Settings:**
   - Click **Settings** (top right)
   - Click **Secrets and variables** → **Actions** (left sidebar)
   - Click **New repository secret**

---

### Step 3: Add These 3 Secrets

#### Secret 1: EC2_HOST
- Name: `EC2_HOST`
- Value: `3.93.201.157`
- Click **Add secret**

#### Secret 2: EC2_USERNAME
- Name: `EC2_USERNAME`
- Value: `ubuntu`
- Click **Add secret**

#### Secret 3: EC2_SSH_KEY
- Name: `EC2_SSH_KEY`
- Value: **Paste the ENTIRE content of constructify-key.pem**
- Click **Add secret**

---

## ✅ Verify Secrets

You should now see 3 secrets:
- `EC2_HOST`
- `EC2_USERNAME`
- `EC2_SSH_KEY`

---

## 🧪 Test the CI/CD Pipeline

### Method 1: Make a Simple Change

```bash
cd /Applications/MAMP/htdocs/constructify

# Make a small change
echo "# Deployment Test $(date)" >> README.md

# Commit and push
git add README.md
git commit -m "Test: CI/CD pipeline"
git push origin main
```

### Method 2: Watch GitHub Actions

1. **Go to Actions tab:**
   https://github.com/wpgeek7/constructify/actions

2. **You should see:**
   - New workflow run starting
   - "Deploy to EC2" workflow
   - Real-time deployment logs

3. **Wait 5-7 minutes** for deployment to complete

4. **Check your app:**
   - Frontend: http://3.93.201.157
   - Backend: http://3.93.201.157:8000

---

## 🎯 How It Works

```
┌─────────────────┐
│  You push code  │
│   to GitHub     │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ GitHub Actions  │
│   triggers      │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  SSH to EC2     │
│  3.93.201.157   │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Pull latest    │
│  code from Git  │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Rebuild Docker │
│  containers     │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Run migrations │
│  & optimize     │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  ✅ Deployed!   │
│  App updated    │
└─────────────────┘
```

---

## 📊 What Gets Auto-Deployed

Every push to `main` branch will:

1. ✅ Pull latest code
2. ✅ Rebuild Docker images
3. ✅ Restart containers
4. ✅ Run database migrations
5. ✅ Clear caches
6. ✅ Optimize Laravel
7. ✅ Verify deployment
8. ✅ Report status

**Time:** 5-7 minutes per deployment

---

## 🔍 Monitor Deployments

### View in GitHub
https://github.com/wpgeek7/constructify/actions

### View on Server
```bash
ssh -i constructify-key.pem ubuntu@3.93.201.157 'cd /home/ubuntu/constructify && docker compose -f docker-compose.prod.yml logs -f'
```

---

## ⚠️ Troubleshooting

### "Permission denied" Error
- Make sure you copied the ENTIRE SSH key including headers
- Check that secrets are named exactly: `EC2_HOST`, `EC2_USERNAME`, `EC2_SSH_KEY`

### Deployment Fails
```bash
# Check container logs
ssh -i constructify-key.pem ubuntu@3.93.201.157 'cd /home/ubuntu/constructify && docker compose -f docker-compose.prod.yml logs'

# Check container status
ssh -i constructify-key.pem ubuntu@3.93.201.157 'cd /home/ubuntu/constructify && docker compose -f docker-compose.prod.yml ps'
```

### Manual Deployment
```bash
ssh -i constructify-key.pem ubuntu@3.93.201.157 'bash -s' < scripts/auto-deploy.sh
```

---

## 🎨 Customize Workflow

Edit `.github/workflows/deploy.yml` to:
- Add tests before deployment
- Add Slack/email notifications
- Deploy to multiple environments
- Run only on specific file changes

---

## 🚀 You're All Set!

Once secrets are added:
1. ✅ Any push to `main` = automatic deployment
2. ✅ View progress in GitHub Actions
3. ✅ App updates in 5-7 minutes
4. ✅ Zero manual work needed

---

**Next:** Push a change and watch it deploy automatically! 🎉

