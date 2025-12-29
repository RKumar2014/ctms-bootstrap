# Backend API - CTMS Bootstrap

Node.js + Express + TypeScript backend for the CTMS application.

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT + bcrypt
- **Validation**: Zod

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Supabase credentials:
   - Get them from https://supabase.com/dashboard/project/clinical-trial-site/settings/api

  
3. **Set up database**:
   - Go to your Supabase project
   - Navigate to SQL Editor
   - Run `database/schema.sql`
   - (Optional) Run `database/seed.sql` for test data

4. **Start development server**:
   ```bash
   npm run dev
   ```
   
   Server will run on http://localhost:3000

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with username/password
- `POST /api/auth/logout` - Logout

### Subjects
- `GET /api/subjects` - List all subjects
- `GET /api/subjects/:id` - Get subject details
- `POST /api/subjects` - Create new subject
- `PUT /api/subjects/:id` - Update subject

### Drug Units
- `GET /api/drug-units` - List drug units
- `POST /api/drug-units` - Add drug unit

### Reports
- `GET /api/reports/subject-summary` - Subject summary report
- `GET /api/reports/site-enrollment` - Site enrollment report
- `GET /api/reports/drug-accountability` - Drug accountability report

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── supabase.ts       # Supabase client
│   ├── middleware/
│   │   └── auth.middleware.ts # JWT authentication
│   ├── routes/
│   │   ├── auth.routes.ts     # Auth endpoints
│   │   ├── subject.routes.ts  # Subject endpoints
│   │   ├── drug.routes.ts     # Drug endpoints
│   │   └── report.routes.ts   # Report endpoints
│   └── server.ts              # Main Express server
├── database/
│   ├── schema.sql             # Database schema
│   └── seed.sql               # Seed data
├── package.json
└── tsconfig.json
```

## Deployment

### Render.com (Free Tier)

1. Create account at https://render.com
2. New Web Service → Connect your Git repository
3. Configure:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment Variables**: Add all from `.env`
4. Deploy!

Free tier includes 750 hours/month (sleeps after 15min inactivity).

## Development Notes

- All protected routes require `Authorization: Bearer <token>` header
- Passwords are hashed with bcrypt (10 rounds)
- JWT tokens expire after 8 hours
- All timestamps are stored in UTC
