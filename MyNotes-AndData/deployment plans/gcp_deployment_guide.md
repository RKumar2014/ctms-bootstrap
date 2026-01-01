# 🆓 Free Deployment Guide - CTMS Application

## Best FREE Options for React + Node.js + PostgreSQL

For your CTMS application (Clinical Trial Management System), here are the **completely free** deployment options:

---

## ✅ RECOMMENDED OPTION: Render.com (Best Free Tier)

### Why Render?
- ✅ **FREE tier** for web services and PostgreSQL
- ✅ Simple deployment from GitHub
- ✅ Automatic SSL/HTTPS
- ✅ No credit card required initially
- ✅ Easy environment variable management
- ⚠️ **Limitation**: Services sleep after 15 minutes of inactivity (wakes up in ~30 seconds on request)

---

## 🚀 Step-by-Step: Deploy on Render (FREE)

### Prerequisites
1. GitHub account
2. Push your code to GitHub repository
3. Render account (sign up at https://render.com - FREE)

---

### Step 1: Prepare Your Code

#### 1.1 Update Backend Environment Variables

Create `backend/.env.example`:
```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Server
PORT=3000
NODE_ENV=production

# JWT
JWT_SECRET=your-production-secret-key-change-this

# Frontend URL (for CORS)
FRONTEND_URL=https://your-app.onrender.com
```

#### 1.2 Update `backend/server.js` or your main file

Add this to handle Render's PORT assignment:
```javascript
const PORT = process.env.PORT || 3000;

// Update CORS to allow your frontend
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
};

app.use(cors(corsOptions));
```

#### 1.3 Add `backend/package.json` scripts
```json
{
  "scripts": {
    "start": "node server.js",
    "build": "echo 'No build required'"
  }
}
```

#### 1.4 Update Frontend API URL

In `frontend/src/lib/api.ts`, update:
```typescript
const API_URL = import.meta.env.VITE_API_URL || 
                'https://your-backend-app.onrender.com';
```

Create `frontend/.env.production`:
```bash
VITE_API_URL=https://your-backend-app.onrender.com/api
```

#### 1.5 Add Frontend Build Config

Update `frontend/package.json`:
```json
{
  "scripts": {
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

---

### Step 2: Push to GitHub

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Prepare for Render deployment"

# Add remote (replace with your repo URL)
git remote add origin https://github.com/RKumar2014/ctms-bootstrap.git

# Push
git push -u origin main
```

---

### Step 3: Deploy PostgreSQL Database on Render

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Click "New +"** → Select **"PostgreSQL"**
3. **Configure**:
   - **Name**: `ctms-database`
   - **Database**: `ctms`
   - **User**: `ctms_user` (auto-generated)
   - **Region**: Choose closest to your users
   - **Instance Type**: **Free** (100 MB storage, good for testing)
4. **Click "Create Database"**
5. **Save Connection Details**:
   - Copy the **Internal Database URL** (starts with `postgresql://`)
   - Copy the **External Database URL** (for local testing)

Example connection string:
```
postgresql://ctms_user:xxxxx@dpg-xxxxx.oregon-postgres.render.com/ctms
```

---

### Step 4: Deploy Backend API on Render

1. **Click "New +"** → **"Web Service"**
2. **Connect Repository**:
   - Select your GitHub repository
   - Grant Render access if needed
3. **Configure Web Service**:
   - **Name**: `ctms-backend-api`
   - **Region**: Same as database
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: **Free**
4. **Add Environment Variables**:
   - Click "Advanced" → "Add Environment Variable"
   - Add these:
     ```
     DATABASE_URL = [Paste your Render PostgreSQL Internal URL]
     NODE_ENV = production
     JWT_SECRET = [Generate a strong secret key]
     FRONTEND_URL = [Leave empty for now, will add after frontend deploy]
     PORT = 3000
     ```
5. **Click "Create Web Service"**
6. **Wait for deployment** (takes 2-5 minutes)
7. **Save the URL**: Will be like `https://ctms-backend-api.onrender.com`

---

### Step 5: Run Database Migrations

**Option A: Using Render Shell (Recommended)**
1. Go to your backend service
2. Click **"Shell"** tab
3. Run your migration commands:
```bash
# If using Sequelize
npm run migrate

# If using raw SQL, connect to DB
psql $DATABASE_URL < migrations/init.sql
```

**Option B: From Local Machine**
```bash
# Export the External Database URL from Render
export DATABASE_URL="postgresql://..."

# Run migrations locally (they'll apply to Render DB)
npm run migrate
```

---

### Step 6: Deploy Frontend on Render

1. **Click "New +"** → **"Static Site"**
2. **Connect Repository**: Same GitHub repo
3. **Configure Static Site**:
   - **Name**: `ctms-frontend`
   - **Branch**: `main`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. **Add Environment Variable**:
   ```
   VITE_API_URL = https://ctms-backend-api.onrender.com/api
   ```
5. **Click "Create Static Site"**
6. **Wait for build** (takes 2-5 minutes)
7. **Your app is live!** URL: `https://ctms-frontend.onrender.com`

---

### Step 7: Update Backend CORS

1. Go back to **backend service** on Render
2. Click **"Environment"** tab
3. Update `FRONTEND_URL`:
   ```
   FRONTEND_URL = https://ctms-frontend.onrender.com
   ```
4. Save and wait for auto-redeploy

---

## 🎉 Your App is Live!

- **Frontend**: https://ctms-frontend.onrender.com
- **Backend API**: https://ctms-backend-api.onrender.com
- **Database**: Managed PostgreSQL on Render

---

## ⚠️ Important FREE Tier Limitations

### Render Free Tier
- ✅ **Pros**:
  - Truly free (no credit card)
  - Automatic SSL
  - Good uptime
  - 750 hours/month (enough for one app)
  
- ⚠️ **Cons**:
  - Services **sleep after 15 min** of inactivity
  - First request after sleep takes ~30-50 seconds
  - 100 MB database storage limit
  - 512 MB RAM per service

### Solutions for "Cold Start" Issue:
1. **Use a ping service** (FREE):
   - https://uptimerobot.com (free plan)
   - Ping your app every 14 minutes to keep it awake
   
2. **Accept the delay**: For testing/development, this is fine

---

## Alternative FREE Options

### Option 2: Railway.app
- **FREE $5/month credit** (enough for small apps)
- Better performance than Render
- Easier database management
- Sign up: https://railway.app

**Deployment Steps**:
1. Sign up with GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repo
4. Railway auto-detects and deploys both frontend & backend
5. Add PostgreSQL: Click "New" → "Database" → "PostgreSQL"
6. Railway automatically injects `DATABASE_URL`

### Option 3: Fly.io
- **FREE tier**: 3 shared VMs + 3GB storage
- Better for complex apps
- More technical setup
- Sign up: https://fly.io

### Option 4: Vercel (Frontend) + Supabase (Backend + DB)
- **Vercel**: FREE static site hosting (perfect for React)
- **Supabase**: FREE PostgreSQL + Auth + APIs
- Sign up: 
  - Vercel: https://vercel.com
  - Supabase: https://supabase.com

**Pros**: No sleep issues, fast global CDN
**Cons**: Need to adapt backend to use Supabase APIs

---

## 📊 Quick Comparison

| Platform | FREE Tier | Sleep Issue | DB Included | Best For |
|----------|-----------|-------------|-------------|----------|
| **Render** | ✅ Yes | ⚠️ Yes (15min) | ✅ Yes (100MB) | **Simple apps** |
| **Railway** | ⚠️ $5 credit | ❌ No | ✅ Yes (1GB) | Small projects |
| **Fly.io** | ✅ Yes | ❌ No | ✅ Yes (3GB) | Production-ready |
| **Vercel + Supabase** | ✅ Yes | ❌ No | ✅ Yes (500MB) | Modern stack |

---

## 🔧 Troubleshooting

### Issue: "Cannot connect to database"
**Solution**: Check that:
- Backend has `DATABASE_URL` environment variable
- Database is in same region as backend
- Using **Internal URL** (not External)

### Issue: "CORS error"
**Solution**: 
- Update backend `FRONTEND_URL` to match your frontend domain
- Restart backend service

### Issue: "Frontend shows 'Network Error'"
**Solution**:
- Check `VITE_API_URL` is set correctly in frontend
- Rebuild frontend after changing env vars

### Issue: "App is very slow"
**Solution**: This is the free tier "cold start"
- Use UptimeRobot to keep services awake
- Or upgrade to paid tier ($7/month on Render)

---

## 🚀 Next Steps After Deployment

1. **Set up monitoring**: Use UptimeRobot to track uptime
2. **Add custom domain** (optional): 
   - Buy domain on Namecheap ($8/year)
   - Connect to Render in settings
3. **Enable auto-deploy**: Already enabled - just push to GitHub
4. **Add staging environment**: Deploy `develop` branch separately

---

## 💰 When You Need to Upgrade

FREE tier is perfect for:
- ✅ Development/testing
- ✅ Demo apps
- ✅ Personal projects
- ✅ Low-traffic apps (<100 users/day)

Consider paid tier when:
- ❌ Need <1s response times
- ❌ 24/7 uptime required
- ❌ Production healthcare data (compliance)
- ❌ >100 concurrent users

**Paid options start at $7-10/month on Render**

---

## 📝 Summary

For **completely FREE** deployment with zero cost:

1. **Use Render.com** (recommended)
2. Deploy database (100MB free)
3. Deploy backend (sleeps after 15min)
4. Deploy frontend (no sleep)
5. Use UptimeRobot to keep backend awake
6. Total cost: **$0/month** 🎉

This setup is perfect for testing, demos, and learning. When ready for production, upgrade to paid tier for better performance!