# 🌐 Domain Setup: constructefy.ai → AWS EC2

This guide will help you connect your GoDaddy domain **constructefy.ai** to your EC2 server at **3.93.201.157**

---

## Part 1: GoDaddy DNS Configuration (5 minutes)

### Step 1: Log into GoDaddy

1. Go to https://www.godaddy.com
2. Sign in to your account
3. Go to **My Products** → **Domain** → Click on **constructefy.ai**

### Step 2: Manage DNS Records

1. Click **DNS** or **Manage DNS**
2. You'll see a list of DNS records

### Step 3: Add/Update A Records

You need to add these DNS records:

#### Record 1: Root Domain (constructefy.ai)
- **Type:** A
- **Name:** @ (or leave blank)
- **Value/Points to:** `3.93.201.157`
- **TTL:** 600 seconds (or default)

#### Record 2: WWW Subdomain (www.constructefy.ai)
- **Type:** A
- **Name:** www
- **Value/Points to:** `3.93.201.157`
- **TTL:** 600 seconds (or default)

### Step 4: Delete Conflicting Records (If Any)

If you see existing A records for @ or www that point elsewhere, **delete them** first.

Also check for:
- **CNAME records** for @ or www (delete if present)
- **Parked domain** settings (disable if present)

### Step 5: Save Changes

Click **Save** or **Save Changes**

### Step 6: Wait for DNS Propagation

- **Minimum wait:** 10-30 minutes
- **Maximum wait:** 24-48 hours (usually much faster)
- **Check propagation:** https://dnschecker.org

---

## Part 2: Verify DNS is Working

### From Your Local Machine:

```bash
# Check if domain points to your IP
nslookup constructefy.ai

# Should show: 3.93.201.157

# Also check www
nslookup www.constructefy.ai

# Should also show: 3.93.201.157
```

Or use online tools:
- https://dnschecker.org
- https://www.whatsmydns.net

**Wait until DNS shows your IP (3.93.201.157) before proceeding!**

---

## Part 3: Server Configuration (Automated)

Once DNS is pointing to your server, I'll help you:

1. ✅ Update application to use constructefy.ai
2. ✅ Install SSL certificate (HTTPS)
3. ✅ Configure nginx for the domain
4. ✅ Set up automatic HTTPS redirect

This will be done via scripts after DNS propagates.

---

## Quick DNS Configuration Summary

| Record Type | Name | Value | TTL |
|-------------|------|-------|-----|
| A | @ | 3.93.201.157 | 600 |
| A | www | 3.93.201.157 | 600 |

---

## Troubleshooting

### DNS Not Updating?

1. **Clear old records:** Delete any existing A, CNAME records for @ and www
2. **Check nameservers:** Ensure domain is using GoDaddy nameservers
3. **Wait longer:** DNS can take up to 48 hours
4. **Flush DNS cache locally:**
   ```bash
   # macOS
   sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
   
   # Windows
   ipconfig /flushdns
   ```

### Still Showing Old Site?

- Check if domain is parked (GoDaddy parking page)
- Disable forwarding in GoDaddy
- Disable "Domain Forwarding" feature

---

## After DNS Propagates

Let me know when DNS is working (shows 3.93.201.157), and I'll:
1. Update server configuration
2. Install SSL certificate
3. Enable HTTPS
4. Test everything

---

**Next:** Follow Part 1 above in GoDaddy, then let me know when DNS is propagating!

