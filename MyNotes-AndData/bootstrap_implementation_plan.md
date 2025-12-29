# Clinical Trial Management System - Bootstrap Implementation Plan

## Goal Description

Build an MVP clinical trial management system (CTMS) with **zero upfront software costs**, using free-tier services and open-source tools. Start solo or with a small team, scale infrastructure spending only when you have paying customers.

**Target Timeline**: 4-6 months for MVP  
**Budget**: $0/month software + development time  
**Team Size**: 1-3 developers

---

## User Review Required

> [!IMPORTANT]
> **Bootstrap Philosophy**
> 
> This plan prioritizes:
> - **$0 software costs** until you have revenue
> - **Free-tier hosting** that scales with usage
> - **Open-source everything** (no vendor lock-in)
> - **Ship fast, iterate based on real users**
> 
> You'll upgrade to paid services only when:
> - Free tiers are exceeded (you have users!)
> - Customer requirements demand it
> - Revenue justifies the expense

> [!WARNING]
> **Free Tier Limits to Monitor**
> 
> - **Vercel**: 100 GB bandwidth/month (plenty for MVP)
> - **Render/Fly.io**: 750 hours/month free compute (one always-on app)
> - **Neon/Supabase**: 500 MB database (upgrade at ~$10/month when needed)
> - **SendGrid**: 100 emails/day (upgrade at $15/month if needed)
> 
> You'll know when to upgrade because your app will be getting real usage.

---

## Proposed Changes

### Phase 1: Foundation & Infrastructure (Month 1)

#### [NEW] Zero-Cost Technology Stack

**Purpose**: Set up development environment using only free tools.

**Core Stack**:
- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL (Neon or Supabase free tier)
- **Hosting**:
  - Frontend: Vercel (free tier)
  - Backend: Render (free tier) or Fly.io (free tier)
  - Database: Neon (500 MB free) or Supabase (500 MB free)
- **State Management**: React Query + Context API (free)
- **Data Grid**: TanStack Table (open-source, free)
- **UI Library**: Material-UI or shadcn/ui (free)
- **Version Control**: GitHub (free for public/private repos)
- **CI/CD**: GitHub Actions (free tier: 2,000 minutes/month)

**Development Tools (Free)**:
- VS Code
- Postman (free tier)
- DBeaver (database GUI)
- Git

**No Docker/Kubernetes** → Use platform-native deployment (Vercel, Render)

**Deliverables**:
- Local development setup (Node.js + PostgreSQL)
- GitHub repository with CI/CD
- Deployed staging environment on free tiers

---

#### [NEW] Database Schema Design

**Purpose**: Design minimal viable schema for core workflows.

**MVP Tables** (8 core tables):

1. **users** (user_id, username, password_hash, email, role, site_id)
2. **sites** (site_id, site_number, site_name, pi_name, country, status)
3. **subjects** (subject_id, subject_number, site_id, dob, sex, status, consent_date, enrollment_date)
4. **visits** (visit_id, visit_name, visit_sequence, expected_offset_days)
5. **subject_visits** (subject_visit_id, subject_id, visit_id, expected_date, actual_date, status)
6. **drug_units** (drug_unit_id, drug_code, lot_number, expiration_date, status, site_id, subject_id)
7. **accountability** (accountability_id, subject_id, visit_id, drug_unit_id, qty_dispensed, qty_returned)
8. **audit_log** (audit_id, user_id, action, table_name, record_id, changes_json, timestamp)

**Skip for MVP**:
- Complex shipment tracking
- Multiple drug modules
- Electronic signatures (add later for compliance)
- Notification templates table

**Migration Tool**: Knex.js (free, JavaScript-based migrations)

**Deliverables**:
- `schema.sql` with 8 core tables
- Knex migration scripts
- Seed data for testing

---

#### [NEW] Backend API Foundation

**Purpose**: Build minimal API with authentication.

**Free Deployment**: Render.com free tier or Fly.io free tier

**Core Endpoints**:
- `POST /api/auth/login` - JWT authentication
- `GET /api/subjects` - List subjects
- `POST /api/subjects` - Create subject
- `GET /api/subjects/:id` - Subject details
- `POST /api/subjects/:id/visits/:visitId/dispense` - Dispense drugs
- `GET /api/reports/subject-summary` - Simple report

**Security (Free)**:
- bcrypt for password hashing
- JWT tokens (no paid service needed)
- Helmet.js for security headers
- express-rate-limit for rate limiting

**Monitoring (Free for MVP)**:
- `console.log()` → View in Render/Fly.io logs
- Uptime monitoring: UptimeRobot free tier (50 monitors)
- No APM needed until you have scale

**Deliverables**:
- Express server with authentication
- 6-8 core API endpoints
- Deployed to Render/Fly.io free tier
- Basic logging

---

#### [NEW] Frontend Foundation

**Purpose**: React app with routing and basic UI.

**Free Deployment**: Vercel (automatic GitHub integration)

**Setup**:
```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install @tanstack/react-table @tanstack/react-query
npm install react-router-dom axios
npm install @mui/material @emotion/react @emotion/styled  # or shadcn/ui
```

**Core Pages**:
- `LoginPage` - Username/password auth
- `SubjectListPage` - TanStack Table with filtering
- `SubjectDetailPage` - Subject info + visit schedule
- `ReportsPage` - Basic report viewer

**No AG-Grid** → Use TanStack Table (free, fully featured):
```jsx
import { useReactTable, getCoreRowModel, getFilteredRowModel } from '@tanstack/react-table';

const SubjectListTable = ({ data }) => {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });
  
  return <table>...</table>; // Full control, no license
};
```

**Deliverables**:
- Vite + React + TypeScript setup
- Login flow
- Subject list with TanStack Table
- Deployed to Vercel (free)

---

### Phase 2: Core Clinical Module - Subjects (Months 2-3)

#### [MODIFY] Backend - Subject Management

**Purpose**: Complete subject lifecycle with minimal features.

**MVP Features**:
- Subject enrollment (manual number or auto-generated)
- Visit schedule (pre-configured in `visits` table)
- Subject status: Active / Completed / Terminated
- Basic audit trail (log to `audit_log` table)

**Endpoints**:
- `GET /api/subjects?site=&status=` - List with filters
- `POST /api/subjects` - Enroll subject
- `GET /api/subjects/:id` - Details + visits
- `PUT /api/subjects/:id` - Update demographics
- `POST /api/subjects/:id/visits/:visitId/complete` - Complete visit

**Deliverables**:
- Subject CRUD API
- Visit schedule calculation
- Basic validation

---

#### [NEW] Frontend - Subjects Module

**Purpose**: Subject management UI with free tools.

**Components**:

1. **Subject List** (`SubjectListPage.jsx`)
   - TanStack Table with client-side filtering/sorting
   - Columns: Subject Number, DOB, Sex, Status, Next Visit
   - "Enroll Subject" button

2. **Subject Detail** (`SubjectDetailPage.jsx`)
   - Subject info card
   - Visit schedule table (TanStack Table)
   - "Complete Visit" action

3. **Enrollment Form** (`EnrollSubjectForm.jsx`)
   - Date pickers (MUI DatePicker or React DatePicker - free)
   - Form validation (React Hook Form + Zod - free)

**TanStack Table Features** (all free):
- Column filtering
- Sorting
- Pagination
- Row selection
- Grouping
- CSV export (via simple JavaScript)

**Deliverables**:
- Subject list with TanStack Table
- Subject detail page
- Enrollment form

---

### Phase 3: Drug Management - Simplified (Month 4)

#### [NEW] Minimal Drug Tracking

**Purpose**: Track drug units and dispensing without complex shipment workflows.

**MVP Features**:
- Drug units in `drug_units` table
- Simple status: Available / Dispensed / Destroyed
- Dispense at visit
- Basic accountability (qty dispensed vs returned)

**Skip for MVP**:
- Shipment tracking (manually add drugs to sites)
- Electronic signatures (add when you need FDA compliance)
- Complex accountability reconciliation
- Destruction workflows

**Backend**:
- `GET /api/drug-units?site=&status=` - List drugs
- `POST /api/drug-units` - Add drug units (manual entry)
- `PUT /api/drug-units/:id/dispense` - Dispense to subject

**Frontend**:
- Drug unit list (TanStack Table)
- Add drug units form (manual entry)
- Dispense drugs at visit (dropdown selector)

**Deliverables**:
- Drug unit CRUD API
- Drug dispensing workflow
- Simple accountability view

---

### Phase 4: Reporting - Essential Only (Month 5)

#### [NEW] 3 Core Reports

**Purpose**: Provide essential reporting with free tools.

**Reports**:
1. **Subject Summary** - All subjects with key info
2. **Site Enrollment Summary** - Enrollment by site/month
3. **Drug Accountability** - Dispensed drugs by subject

**Backend**:
- `GET /api/reports/subject-summary`
- `GET /api/reports/site-enrollment`
- `GET /api/reports/drug-accountability`
- Simple SQL queries, return JSON

**Frontend**:
- TanStack Table for each report
- **Excel Export** (free):
  ```bash
  npm install xlsx
  ```
  ```jsx
  import * as XLSX from 'xlsx';
  
  const exportToExcel = (data) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, "report.xlsx");
  };
  ```

**No PDF generation** → Use browser print to PDF (free)

**Deliverables**:
- 3 report APIs
- 3 report pages with TanStack Table
- Excel export for all reports

---

### Phase 5: Polish & Deploy (Month 6)

#### [NEW] User Acceptance Testing

**Purpose**: Get real users testing on free staging environment.

**UAT Plan**:
1. Deploy to Vercel (frontend) + Render (backend) free tiers
2. Share staging URL with 2-3 clinical coordinators
3. Test core workflows:
   - Enroll 10 subjects
   - Dispense drugs at 5 visits
   - Generate 3 reports
4. Fix critical bugs

**Deliverables**:
- Staging environment (free)
- UAT feedback
- Bug fixes

---

#### [NEW] Production Deployment (Still Free!)

**Purpose**: Deploy to production using same free tiers.

**Infrastructure**:
- **Frontend**: Vercel production deployment (free, custom domain supported)
- **Backend**: Render production (free tier, goes to sleep after inactivity)
  - *Alternative*: Upgrade to $7/month for always-on if needed
- **Database**: Neon or Supabase (free 500 MB)
  - *Upgrade path*: $10-20/month when you exceed 500 MB
- **Domain**: Namecheap (~$10/year for .com)
- **SSL**: Free via Vercel/Render (Let's Encrypt)

**Monitoring (Free)**:
- UptimeRobot (uptime checks)
- Render/Vercel built-in logs
- Google Analytics (user tracking - free)

**Backups**:
- Neon/Supabase automatic backups (included in free tier)
- Manual pg_dump weekly → GitHub repo

**Total Monthly Cost**: **$0** (or ~$7 if you upgrade backend to always-on)

---

## Verification Plan

### Automated Tests

**Free Testing**:
```bash
# Unit tests - Jest (free)
npm test -- --coverage

# E2E tests - Playwright (free)
npx playwright test
```

**CI/CD**: GitHub Actions (2,000 free minutes/month)

---

### Manual Verification

**Checklist**:
- [ ] Login works
- [ ] Subject enrollment creates record
- [ ] Visit completion updates status
- [ ] Drug dispensing updates drug unit
- [ ] Reports display correct data
- [ ] Excel export works
- [ ] Free tier limits not exceeded

---

## Timeline Summary

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Phase 1: Foundation | Month 1 | Database, Auth API, Frontend shell, deployed to free tiers |
| Phase 2: Subjects | Months 2-3 | Subject enrollment, visits, TanStack Table UI |
| Phase 3: Drug Mgmt | Month 4 | Drug units, dispensing, basic accountability |
| Phase 4: Reporting | Month 5 | 3 core reports with Excel export |
| Phase 5: Polish | Month 6 | UAT, bug fixes, production deployment |

**Total**: 6 months (solo developer) or 4 months (small team)

**MVP Launch**: Month 6 - Deployed on 100% free infrastructure

---

## Budget Breakdown

### Software & Infrastructure (Monthly)

| Item | Free Tier Limit | Cost If Exceeded |
|------|----------------|------------------|
| Vercel (Frontend) | 100 GB bandwidth | $20/month Pro plan |
| Render (Backend) | 750 hours (sleeps when inactive) | $7/month for always-on |
| Neon/Supabase (Database) | 500 MB storage | $10-20/month when exceeded |
| SendGrid (Email) | 100 emails/day | $15/month for 40k emails |
| GitHub | Unlimited repos | Free |
| TanStack Table | Unlimited | Free (open-source) |
| MUI / shadcn/ui | Unlimited | Free (open-source) |

**Total Month 1-6**: **$0**  
**Total when you have users and need upgrades**: **$50-100/month**

### Personnel Costs

**Solo Developer** (you):
- Your time: 20-40 hours/week for 6 months
- Cost: $0 if you're the founder

**Small Team** (if hiring):
- 1 Full-Stack Developer: $8k-12k/month × 4 months = $32k-48k
- 1 Part-time QA: $3k/month × 2 months = $6k
- **Total**: ~$40k-55k for 4-month team build

**Comparison**:
- **Original Plan**: $2.7M (14-person team, 16 months, enterprise tools)
- **Bootstrap Plan**: $0-55k (1-3 person team, 4-6 months, free tools)

---

## Upgrade Path (When You Have Revenue)

### When Free Tiers Are Exceeded:

**Stage 1**: First 10 customers (still cheap)
- Upgrade Render to $7/month (always-on)
- Upgrade Neon to $20/month (3 GB storage)
- **Total**: ~$30/month

**Stage 2**: 50+ customers (growing)
- Upgrade Vercel to Pro $20/month
- Add Datadog Lite $30/month (monitoring)
- Upgrade database to $50/month
- **Total**: ~$100/month

**Stage 3**: 500+ customers (profitable)
- AWS/GCP infrastructure ~$500/month
- Consider AG-Grid Enterprise $999 (if customers demand it)
- Add compliance tools as needed
- **Total**: ~$1,000-2,000/month

**Key**: You're profitable before these costs hit.

---

## What's Different from Original Plan

| Aspect | Original Plan | Bootstrap Plan |
|--------|--------------|----------------|
| **Timeline** | 16 months | 4-6 months |
| **Team** | 14 people | 1-3 people |
| **Data Grid** | AG-Grid ($10k) | TanStack Table (free) |
| **Hosting** | Kubernetes ($3k/month) | Vercel + Render (free) |
| **Monitoring** | Datadog ($1k/month) | Logs + UptimeRobot (free) |
| **Database** | Self-managed PostgreSQL | Neon/Supabase (free) |
| **Email** | SendGrid Pro | SendGrid free tier |
| **Total Cost** | $2.7M | $0-55k |
| **MVP Features** | All 6 drug modules, 8 reports | Core subjects + drug dispensing, 3 reports |

---

## Risk Mitigation (Bootstrap Edition)

| Risk | Mitigation |
|------|------------|
| Free tier limits exceeded | Monitor usage, upgrade when needed (~$30-50/month) |
| Render backend sleeps (free tier) | Acceptable for MVP; upgrade to $7/month if annoying |
| Database 500 MB limit | Upgrade to $10/month when exceeded (sign of traction!) |
| TanStack Table too complex | Well-documented, large community, easier than AG-Grid |
| Missing enterprise features | Add only when customers request + pay for them |

---

## Success Criteria

**MVP Success**:
- ✅ 2-3 pilot sites using the system
- ✅ 20+ subjects enrolled
- ✅ 50+ drug units tracked
- ✅ 3 reports generating correct data
- ✅ Zero crashes for 1 week
- ✅ Still on free tiers (or <$50/month)

**Ready to Scale**:
- ✅ 10+ paying customers
- ✅ $5k+ MRR
- ✅ Free tiers exceeded → upgrade justified by revenue
- ✅ Customer requests justify paid features (e.g., AG-Grid)

---

## Next Steps

1. ✅ **Approve this bootstrap plan**
2. Set up local development environment:
   ```bash
   # Backend
   npm init -y
   npm install express typescript pg knex bcrypt jsonwebtoken
   
   # Frontend
   npm create vite@latest frontend -- --template react-ts
   cd frontend
   npm install @tanstack/react-table react-router-dom axios
   ```
3. Create Neon/Supabase free database
4. Build Phase 1 (Month 1)
5. Deploy to Vercel + Render free tiers
6. Get first pilot user!

---

**Remember**: You're not building the full Suvoda competitor yet. You're building an MVP to validate demand. Upgrade features and infrastructure only when customers are paying for them.
