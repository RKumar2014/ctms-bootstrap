# Google Cloud FREE Deployment Guide

## ⚠️ Important: What's "Free" on Google Cloud?

### 1. **$300 Free Trial Credit** (90 days)
- ✅ **New accounts only**
- ✅ Good for 90 days
- ✅ Can use ANY Google Cloud service
- ❌ **Requires credit card** (for identity verification)
- ❌ **Automatically charges** after trial ends if you don't monitor

### 2. **Always Free Tier** (Forever)
This is the truly free option, but it's **VERY LIMITED**:

#### What's Actually Free Forever:
- **Cloud Run**: 2 million requests/month + 360,000 GB-seconds compute
- **Compute Engine**: 1 f1-micro VM (0.6GB RAM) in US regions only
- **Cloud Storage**: 5GB in US regions only
- **Cloud Functions**: 2 million invocations/month
- **Cloud SQL**: ❌ **NOT included in free tier** - cheapest is ~$7/month
- **PostgreSQL**: ❌ **Must use external DB or pay**

---

## 🚨 THE REAL ISSUE: Database Costs

**Your app needs PostgreSQL, which is NOT free on Google Cloud.**

### Cloud SQL Pricing:
- **Cheapest option**: db-f1-micro = **$7.67/month**
- Cannot be avoided if using Cloud SQL
- No free PostgreSQL database on GCP

---

## ✅ SOLUTION 1: Use Google Cloud with External Free Database

Deploy your app on Google Cloud + use a FREE external database:

### Step 1: Use Supabase for FREE PostgreSQL
1. Sign up at https://supabase.com (FREE forever)
2. Create new project
3. Get connection string: `postgresql://...`
4. Free tier: 500MB database, 2GB bandwidth

### Step 2: Deploy Backend on Cloud Run (FREE)
```bash
# Login to Google Cloud
gcloud auth login

# Create project (choose unique ID)
gcloud projects create ctms-app-free
gcloud config set project ctms-app-free

# Enable Cloud Run
gcloud services enable run.googleapis.com

# Deploy backend (from your backend folder)
gcloud run deploy ctms-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="DATABASE_URL=postgresql://...[YOUR SUPABASE URL]"
```

**Cost**: $0/month (stays within free tier for low traffic)

### Step 3: Deploy Frontend on Cloud Storage (FREE)
```bash
# Build frontend
cd frontend
npm run build

# Create storage bucket
gsutil mb -l us gs://ctms-frontend-bucket

# Upload files
gsutil -m cp -r dist/* gs://ctms-frontend-bucket/

# Make bucket public
gsutil iam ch allUsers:objectViewer gs://ctms-frontend-bucket

# Enable website hosting
gsutil web set -m index.html gs://ctms-frontend-bucket
```

**Your app URL**: `https://storage.googleapis.com/ctms-frontend-bucket/index.html`

**Total Cost**: **$0/month** ✅

---

## ✅ SOLUTION 2: Use FREE Cloud Run + FREE Neon Database

### Alternative: Neon PostgreSQL (Better than Supabase for this use case)
- Free tier: 3GB storage, 10GB bandwidth
- No sleep (unlike Supabase)
- Better for production

**Sign up**: https://neon.tech

Then follow same Cloud Run deployment steps above.

---

## ✅ SOLUTION 3: Truly FREE on Render.com (EASIEST)

**Reality check**: For a completely free, zero-hassle deployment:

### Why Render is Better for FREE:
| Feature | Google Cloud | Render.com |
|---------|--------------|------------|
| **Credit Card Required?** | ✅ Yes | ❌ No |
| **Auto-charges after trial?** | ✅ Yes | ❌ No |
| **FREE PostgreSQL?** | ❌ No ($7.67/mo) | ✅ Yes (100MB) |
| **Setup Complexity** | 🔴 High | 🟢 Low |
| **Monitoring Required?** | 🔴 Yes (avoid charges) | 🟢 No |
| **Sleep after inactivity?** | ❌ No | ✅ Yes (15 min) |

---

## 💰 Google Cloud TRUE Costs (After Free Trial)

### Minimum Monthly Cost for Your App:
```
Cloud SQL (PostgreSQL): $7.67/month
Cloud Run (backend): $0 (if low traffic)
Cloud Storage (frontend): $0 (if low traffic)
Network egress: ~$1-3/month

TOTAL: ~$8-11/month minimum
```

### Hidden Costs to Watch:
- ⚠️ **Network egress** (data leaving GCP) - $0.12/GB after 1GB free
- ⚠️ **Cloud SQL backup storage** - charges apply
- ⚠️ **Accidentally leaving services running**
- ⚠️ **Trial ending without notice** - auto-charges your card

---

## 🎯 MY RECOMMENDATION

### For TRULY FREE (no credit card, no surprise charges):
**Option A: Render.com** (from previous guide)
- Zero cost
- No credit card required
- Includes PostgreSQL
- Simple setup
- Main downside: Apps sleep after 15 min

### For Learning Google Cloud (with $300 free):
**Option B: Google Cloud with trial**
- Use $300 credit to learn GCP
- Set up **billing alerts** at $50, $100, $200
- **Cancel before 90 days** to avoid charges
- Great for resume/portfolio

### For Production (paid but cheap):
**Option C: Google Cloud Run + Neon DB**
- Cloud Run: $0-5/month
- Neon PostgreSQL: FREE tier (3GB)
- Total: ~$0-5/month
- Professional, scalable

---

## 📋 Step-by-Step: Deploy on Google Cloud (Using Trial)

### Prerequisites
```bash
# Install Google Cloud SDK
curl https://sdk.cloud.google.com | bash

# Restart terminal and login
gcloud auth login
```

### Step 1: Enable Free Trial
1. Go to https://console.cloud.google.com
2. **Accept $300 credit** (requires credit card)
3. ⚠️ **Set billing alert immediately**:
   - Go to Billing → Budgets & alerts
   - Set budget: $50 (you'll get email before charges)

### Step 2: Create Project
```bash
gcloud projects create ctms-prod-12345
gcloud config set project ctms-prod-12345
gcloud config set compute/region us-central1
```

### Step 3: Enable APIs
```bash
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  storage.googleapis.com
```

### Step 4: Create Database (Uses ~$8/month of your $300 credit)
```bash
# Create PostgreSQL instance
gcloud sql instances create ctms-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --root-password=YOUR_SECURE_PASSWORD

# Create database
gcloud sql databases create ctms --instance=ctms-db

# Get connection string
gcloud sql instances describe ctms-db \
  --format='value(connectionName)'
```

### Step 5: Prepare Backend Dockerfile

Create `backend/Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 8080
CMD ["npm", "start"]
```

### Step 6: Deploy Backend to Cloud Run
```bash
cd backend

# Build and deploy
gcloud run deploy ctms-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="DATABASE_URL=postgresql://..." \
  --set-env-vars="NODE_ENV=production" \
  --set-env-vars="JWT_SECRET=your-secret-key"

# Save the URL shown in output
```

### Step 7: Deploy Frontend
```bash
cd ../frontend

# Update API URL
echo "VITE_API_URL=https://your-backend-url.run.app/api" > .env.production

# Build
npm run build

# Deploy to Cloud Storage
gsutil mb -l us gs://ctms-frontend-$(date +%s)
gsutil -m cp -r dist/* gs://ctms-frontend-*/
gsutil iam ch allUsers:objectViewer gs://ctms-frontend-*/
gsutil web set -m index.html gs://ctms-frontend-*/
```

**Cost during trial**: Uses ~$8-10/month of your $300 credit

---

## 🛡️ CRITICAL: Protect Yourself from Charges

### Set Up Billing Alerts
```bash
# Create budget alert
gcloud billing budgets create \
  --billing-account=YOUR_BILLING_ACCOUNT_ID \
  --display-name="Monthly Budget" \
  --budget-amount=50 \
  --threshold-rule=percent=50 \
  --threshold-rule=percent=90 \
  --threshold-rule=percent=100
```

### Monitor Usage Daily
- Visit: https://console.cloud.google.com/billing
- Check: "Cost table" and "Reports"
- Watch: Database costs (biggest expense)

### Before Trial Ends (Day 85):
```bash
# Delete everything if you don't want to pay
gcloud sql instances delete ctms-db
gcloud run services delete ctms-backend
gsutil rm -r gs://ctms-frontend-*
gcloud projects delete ctms-prod-12345
```

---

## 📊 Final Comparison

| Platform | Setup Time | Monthly Cost | Credit Card | Complexity |
|----------|-----------|--------------|-------------|------------|
| **Render** | 20 min | $0 | ❌ No | 🟢 Easy |
| **Railway** | 15 min | $0* | ✅ Yes | 🟢 Easy |
| **GCP (Free DB)** | 45 min | $0 | ✅ Yes | 🟡 Medium |
| **GCP (Cloud SQL)** | 30 min | ~$8-10 | ✅ Yes | 🟡 Medium |

*Railway: $5 monthly credit = effectively free for small apps

---

## 🎯 What Should YOU Do?

### If you want ZERO COST and ZERO RISK:
→ **Use Render.com** (my original guide)

### If you want to learn Google Cloud:
→ **Use GCP with $300 trial + external free DB (Supabase/Neon)**
→ Set billing alerts immediately
→ Delete everything before day 90

### If you have $8-10/month to spend:
→ **Use GCP with Cloud SQL** (most professional solution)

---

## ⚡ Quick Answer to Your Question

**"Can I deploy FREE on Google Cloud?"**

✅ **YES**, but with caveats:
1. Need credit card for $300 trial
2. PostgreSQL is NOT free ($7.67/month minimum)
3. Must monitor spending carefully
4. Auto-charges after 90 days

**TRULY FREE option**: Use Google Cloud Run (free) + Supabase/Neon database (free) = $0/month

**EASIEST FREE option**: Just use Render.com instead