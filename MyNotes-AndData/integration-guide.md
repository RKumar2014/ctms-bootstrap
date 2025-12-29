# CTMS Dashboard Integration Guide

## Step 1: Fix Supabase URL (CRITICAL)

1. Open `backend/.env`
2. Change this line:
   ```
   SUPABASE_URL=https://nricbzemdynlzfyqimbz.supabase.co
   ```
   To:
   ```
   SUPABASE_URL=https://nricbzemdylnzfyqimbz.supabase.co
   ```
   (Fix the typo: `dynlz` → `dylnz`)

## Step 2: Install Required Dependencies

### Frontend:
```bash
cd frontend
npm install react-router-dom lucide-react
```

### Backend (if not already installed):
```bash
cd backend
npm install express cors dotenv bcryptjs jsonwebtoken @supabase/supabase-js
```

## Step 3: Create New Files

### Backend Files:

1. **Create `backend/routes/user.js`**
   - Copy the code from the "user.js - User Profile Routes" artifact

2. **Update `backend/server.js`**
   - Replace with the code from the "server.js - Updated Backend" artifact

### Frontend Files:

1. **Create `frontend/src/components/Dashboard.jsx`**
   - Copy the code from the "Dashboard.jsx - Integrated CTMS Dashboard" artifact

2. **Update `frontend/src/App.jsx`**
   - Replace with the code from the "App.jsx - Updated with Routing" artifact

## Step 4: Verify File Structure

Your project should look like this:

```
ctms-project/
├── backend/
│   ├── routes/
│   │   ├── auth.js
│   │   └── user.js         ← NEW FILE
│   ├── middleware/
│   │   └── auth.js
│   ├── .env                ← FIX SUPABASE_URL
│   ├── server.js           ← UPDATED
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── Dashboard.jsx    ← NEW FILE
│   │   └── App.jsx              ← UPDATED
│   └── package.json
```

## Step 5: Start the Application

1. **Start Backend** (in one terminal):
   ```bash
   cd backend
   npm run dev
   ```
   
   You should see:
   ```
   ✓ Server running on http://localhost:3000
   ✓ Frontend URL: http://localhost:5173
   ```

2. **Start Frontend** (in another terminal):
   ```bash
   cd frontend
   npm run dev
   ```

## Step 6: Test the Application

1. **Open** http://localhost:5173
2. **Register** a new account
3. **Login** with your credentials
4. You should be **automatically redirected** to the Dashboard
5. **Test the tabs** - click through My Studies, Subjects, Drug, Reports, Changes, Admin
6. **Test logout** - click the Logout button in the top right

## Features Implemented

### Dashboard Features:
- ✅ Professional CTMS-style UI matching Suvoda
- ✅ Authentication-protected routes
- ✅ Automatic redirect to login if not authenticated
- ✅ User profile display (shows logged-in email)
- ✅ 6 interactive tabs with unique content
- ✅ Logout functionality
- ✅ Loading states
- ✅ Error handling

### Security Features:
- ✅ JWT token authentication
- ✅ Protected routes
- ✅ Token stored in localStorage
- ✅ Automatic logout on token expiration
- ✅ Password hashing with bcrypt

## Troubleshooting

### If login returns 500 error:
1. Verify Supabase URL is correct in `.env`
2. Test DNS: `nslookup nricbzemdylnzfyqimbz.supabase.co`
3. Check backend logs for error messages
4. Verify users table exists in Supabase

### If dashboard doesn't load:
1. Check browser console for errors
2. Verify token exists: `localStorage.getItem('token')`
3. Check that backend is running on port 3000
4. Verify CORS is configured correctly

### If tabs don't work:
1. Check browser console for React errors
2. Verify all dependencies are installed
3. Clear browser cache and reload

## Next Steps

1. **Add Real Data**: Connect each tab to actual Supabase tables
2. **Create Study Management**: Build forms to create/edit studies
3. **Subject Management**: Implement CRUD operations for subjects
4. **Drug Inventory**: Track drug dispensation
5. **Reports**: Generate PDF reports
6. **Admin Panel**: User role management

## API Endpoints Available

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/user/profile` - Get current user profile (protected)
- `PUT /api/user/profile` - Update user profile (protected)

## Need Help?

If you encounter any issues:
1. Check the console logs (both frontend and backend)
2. Verify all environment variables are set correctly
3. Make sure Supabase URL is correct
4. Ensure all dependencies are installed