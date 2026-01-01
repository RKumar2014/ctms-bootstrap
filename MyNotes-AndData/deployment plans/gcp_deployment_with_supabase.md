# Google Cloud Deployment - Your CTMS App (Already has Supabase!)

## ✅ Great News!

Since you're **already using Supabase for your database**, deploying to Google Cloud is **FREE and simple**:

- ✅ **Supabase database**: Already set up (FREE)
- ✅ **Backend**: Deploy to Cloud Run (FREE tier)
- ✅ **Frontend**: Deploy to Cloud Storage or Cloud Run (FREE tier)
- ✅ **Total cost**: $0/month (within free tier limits)

---

## 🚀 Step-by-Step Deployment

### Prerequisites

1. **Install Google Cloud SDK**
   ```bash
   # Mac/Linux
   curl https://sdk.cloud.google.com | bash
   exec -l $SHELL
   
   # Windows: Download installer from
   # https://cloud.google.com/sdk/docs/install
   ```

2. **Your Supabase credentials ready**
   - Supabase URL: `https://xxxxx.supabase.co`
   - Supabase Anon Key
   - Database connection string

---

## Step 1: Initialize Google Cloud

```bash
# Login
gcloud auth login

# Create new project (choose unique ID)
gcloud projects create ctms-app-2025

# Set as active project
gcloud config set project ctms-app-2025

# Set region (choose closest to your users)
gcloud config set run/region us-central1

# Enable required services
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  storage.googleapis.com
```

**Note**: This doesn't require a credit card initially, but Google may ask for one for identity verification. You can stay within the free tier.

---

## Step 2: Prepare Your Backend for Deployment

### 2.1 Create `backend/Dockerfile`

```dockerfile
# Use Node.js 18 Alpine for smaller image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy application code
COPY . .

# Cloud Run requires port 8080
EXPOSE 8080

# Start the server
CMD ["node", "server.js"]
```

### 2.2 Update `backend/server.js` (or main file)

Ensure your server uses the PORT environment variable:

```javascript
// Make sure your server uses process.env.PORT
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
```

### 2.3 Create `.dockerignore` in backend folder

```
node_modules
npm-debug.log
.env
.env.local
.git
.gitignore
```

---

## Step 3: Deploy Backend to Cloud Run

```bash
# Navigate to backend directory
cd backend

# Deploy to Cloud Run (this builds and deploys in one command)
gcloud run deploy ctms-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="SUPABASE_URL=YOUR_SUPABASE_URL" \
  --set-env-vars="SUPABASE_KEY=YOUR_SUPABASE_ANON_KEY" \
  --set-env-vars="JWT_SECRET=your-production-jwt-secret" \
  --set-env-vars="NODE_ENV=production"

# Note: Replace YOUR_SUPABASE_URL and YOUR_SUPABASE_ANON_KEY with actual values
```

**What happens**:
1. Google builds a Docker image from your code
2. Pushes to Container Registry
3. Deploys to Cloud Run
4. Gives you a URL like: `https://ctms-backend-xxxxx-uc.a.run.app`

**Save this backend URL!** You'll need it for the frontend.

---

## Step 4: Deploy Frontend

### Option A: Cloud Run (Recommended - Easier)

#### 4.1 Create `frontend/Dockerfile`

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Build with production API URL (will be set via env var)
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Production stage with nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html

# Configure nginx for SPA routing
RUN echo 'server { \
  listen 8080; \
  location / { \
    root /usr/share/nginx/html; \
    try_files $uri $uri/ /index.html; \
  } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
```

#### 4.2 Update Frontend API URL

Update `frontend/src/lib/api.ts`:

```typescript
const API_URL = import.meta.env.VITE_API_URL || 
                'http://localhost:3000';

export const api = axios.create({
    baseURL: `${API_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
});
```

#### 4.3 Deploy Frontend

```bash
# Navigate to frontend directory
cd ../frontend

# Deploy to Cloud Run
gcloud run deploy ctms-frontend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --build-env-vars="VITE_API_URL=https://ctms-backend-xxxxx-uc.a.run.app"

# Replace the URL above with your actual backend URL from Step 3
```

**Your app is now live!** 🎉

You'll get a URL like: `https://ctms-frontend-xxxxx-uc.a.run.app`

---

### Option B: Cloud Storage (Static Hosting - Cheaper)

If you prefer static hosting:

```bash
# Build frontend with backend URL
cd frontend
VITE_API_URL=https://ctms-backend-xxxxx-uc.a.run.app npm run build

# Create storage bucket (must be globally unique)
gsutil mb -l us gs://ctms-app-frontend-$(date +%s)

# Set bucket to host website
gsutil web set -m index.html -e index.html gs://ctms-app-frontend-*

# Upload built files
gsutil -m cp -r dist/* gs://ctms-app-frontend-*/

# Make files publicly readable
gsutil iam ch allUsers:objectViewer gs://ctms-app-frontend-*/

# Get the URL
echo "Your app: https://storage.googleapis.com/ctms-app-frontend-XXXXX/index.html"
```

---

## Step 5: Update CORS in Backend

Your backend needs to allow requests from your frontend domain.

Update `backend/server.js`:

```javascript
const cors = require('cors');

const corsOptions = {
  origin: [
    'http://localhost:5173', // Local development
    'https://ctms-frontend-xxxxx-uc.a.run.app', // Your Cloud Run URL
    // or 'https://storage.googleapis.com' if using Cloud Storage
  ],
  credentials: true
};

app.use(cors(corsOptions));
```

Then redeploy backend:
```bash
cd backend
gcloud run deploy ctms-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

---

## 💰 Cost Breakdown (FREE Tier)

### Cloud Run (Backend + Frontend)
- **Free tier**: 
  - 2 million requests/month
  - 360,000 GB-seconds compute time
  - 180,000 vCPU-seconds
- **Your app**: Will easily stay within free tier for low-medium traffic

### Cloud Storage (if using Option B)
- **Free tier**: 5GB storage + 1GB network egress
- **Your app**: Frontend bundle is ~5-10MB, well within limits

### Supabase (Database)
- **Your existing setup**: Already FREE tier
- 500MB database, 2GB bandwidth/month

**Total Monthly Cost: $0** ✅

---

## 📊 Monitoring Usage (Stay Free)

### Check Your Usage
```bash
# View Cloud Run usage
gcloud run services describe ctms-backend --region us-central1

# Check billing (if credit card added)
# Go to: https://console.cloud.google.com/billing
```

### Set Budget Alerts (Optional but Recommended)
```bash
# If you added a credit card, set up alerts
# Go to: https://console.cloud.google.com/billing/budgets
# Create budget: $5/month with 50%, 90%, 100% alerts
```

---

## 🔧 Continuous Deployment (Optional)

Connect GitHub for auto-deploy on push:

```bash
# Enable Cloud Build GitHub integration
gcloud builds submit --config cloudbuild.yaml

# Or use Cloud Build triggers
# https://console.cloud.google.com/cloud-build/triggers
```

Create `cloudbuild.yaml` in project root:
```yaml
steps:
  # Deploy backend
  - name: 'gcr.io/cloud-builders/gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'ctms-backend'
      - '--source=./backend'
      - '--region=us-central1'
  
  # Deploy frontend
  - name: 'gcr.io/cloud-builders/gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'ctms-frontend'
      - '--source=./frontend'
      - '--region=us-central1'
```

---

## 🚨 Common Issues & Solutions

### Issue: "Permission denied" when deploying
**Solution**: 
```bash
gcloud auth application-default login
```

### Issue: Backend can't connect to Supabase
**Solution**: Check environment variables are set correctly:
```bash
gcloud run services describe ctms-backend \
  --region us-central1 \
  --format='value(spec.template.spec.containers[0].env)'
```

### Issue: Frontend shows "Network Error"
**Solution**: 
1. Check VITE_API_URL is correct
2. Verify CORS is configured in backend
3. Check backend logs:
```bash
gcloud run logs read ctms-backend --region us-central1
```

### Issue: "Port already in use"
**Solution**: Make sure your server listens on `process.env.PORT` (Cloud Run assigns this dynamically)

---

## 🎯 Quick Commands Cheat Sheet

```bash
# View backend logs
gcloud run logs read ctms-backend --region us-central1 --limit 50

# Update backend environment variables
gcloud run services update ctms-backend \
  --region us-central1 \
  --set-env-vars="NEW_VAR=value"

# Get service URLs
gcloud run services list

# Delete services (cleanup)
gcloud run services delete ctms-backend --region us-central1
gcloud run services delete ctms-frontend --region us-central1

# Delete project (complete cleanup)
gcloud projects delete ctms-app-2025
```

---

## ✅ Final Checklist

- [ ] Google Cloud SDK installed
- [ ] Project created and configured
- [ ] Supabase credentials ready
- [ ] Backend Dockerfile created
- [ ] Frontend Dockerfile created (if using Cloud Run)
- [ ] Backend deployed to Cloud Run
- [ ] Frontend deployed (Cloud Run or Storage)
- [ ] CORS configured in backend
- [ ] Both URLs working
- [ ] Database connection working

---

## 🎉 Your App is Live!

**Backend API**: `https://ctms-backend-xxxxx-uc.a.run.app`
**Frontend**: `https://ctms-frontend-xxxxx-uc.a.run.app`
**Database**: Your existing Supabase instance

**Total Setup Time**: ~30 minutes
**Monthly Cost**: $0 (within free tier)

---

## 🚀 Next Steps

1. **Add custom domain** (optional):
   - Buy domain on Namecheap ($8-12/year)
   - Map to Cloud Run in console

2. **Set up CI/CD**:
   - Connect GitHub
   - Auto-deploy on push

3. **Add monitoring**:
   - Enable Cloud Monitoring (free tier)
   - Set up uptime checks

4. **SSL Certificate**: 
   - Automatic with Cloud Run ✅
   - Automatic with Cloud Storage + Load Balancer

**Questions?** Let me know which step you're on!