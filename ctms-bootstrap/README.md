# Phase 1 Foundation - Setup Guide

## ✅ What's Been Built

**Backend** (`ctms-bootstrap/backend/`):
- Express + TypeScript API server
- JWT authentication with bcrypt
- Supabase PostgreSQL client
- Complete API routes: auth, subjects, drug units, reports
- Database schema for 8 core tables

**Frontend** (`ctms-bootstrap/frontend/`):
- React +  TypeScript + Vite
- Tailwind CSS configured
- React Router with protected routes
- React Query for server state
- TanStack Table ready to use
- Authentication context & login page

## 🚀 Next Steps (What YOU Need to Do)

### 1. Create Free Supabase Account

1. Go to https://supabase.com
2. Sign up (free tier - no credit card)
3. Create new project:
   - Name: `ctms-bootstrap`
   - Database Password: (save this!)
   - Region: Choose closest to you
4. Wait 2-3 minutes for setup

### 2. Set Up Database

1. In Supabase dashboard → SQL Editor
2. Open `backend/database/schema.sql`
3. Copy all SQL code
4. Paste into Supabase SQL Editor → Run
5. Open `backend/database/seed.sql`
6. Copy all SQL code
7. Paste into Supabase SQL Editor → Run

### 3. Get API Credentials

1. In Supabase → Settings → API
2. Copy:
   - `Project URL`
   - `anon public` key
   - `service_role` key (click "Reveal")

### 4. Configure Backend

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```
SUPABASE_URL=your_project_url_here
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_role_key_here
JWT_SECRET=any_random_string_here
```

### 5. Configure Frontend

```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env`:
```
VITE_API_URL=http://localhost:3000
```

### 6. Install & Run

**Terminal 1 - Backend**:
```bash
cd backend
npm install
npm run dev
```

Should see: `🚀 Server running on port 3000`

**Terminal 2 - Frontend**:
```bash
cd frontend
npm install
npm run dev
```

Should see: `Local: http://localhost:5173/`

### 7. Test Login

1. Open http://localhost:5173
2. Login with:
   - Username: `admin`
   - Password: `Admin123!`
3. You should be redirected to dashboard!

## ⚠️ Troubleshooting

**Backend won't start**:
- Check if port 3000 is available
- Verify Supabase credentials in `.env`
- Run `npm install` again

**Frontend won't start**:
- Check if port 5173 is available
- Run `npm install` again
- Clear browser cache

**Can't login**:
- Check backend is running
- Check `VITE_API_URL` in frontend `.env`
- Open Network tab in browser DevTools to see errors

## 📁 Project Structure

```
ctms-bootstrap/
├── backend/
│   ├── src/
│   │   ├── server.ts          # Main server
│   │   ├── routes/            # API endpoints
│   │   ├── middleware/        # Auth middleware
│   │   └── config/            # Supabase client
│   ├── database/
│   │   ├── schema.sql         # 8 tables
│   │   └── seed.sql           # Test data
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/             # LoginPage, etc.
│   │   ├── context/           # AuthContext
│   │   ├── lib/               # API client
│   │   └── App.tsx            # Main app
│   └── package.json
│
└── README.md                  # This overview
```

## 🎯 Phase 2 Preview

Once Phase 1 is running, we'll build:
- Subject enrollment UI with TanStack Table
- Subject detail page with visit schedule
- Subject list with filtering/sorting
- Rollover (enrollment) form

All still $0/month!
