# CTMS Date Validation Testing Guide

## � Test Data (Simplified)

| Table | Count |
|-------|-------|
| Sites | 2 (1384, 1385) |
| Subjects | 2 (1384-001, 1385-001) |
| Drug Units | 4 (2 per site) |
| Users | 2 (admin login preserved) |

### Subject Details
| Subject | Site | Consent | Enrollment | Sex |
|---------|------|---------|------------|-----|
| 1384-001 | 1384 | 12/01/2024 | 12/01/2024 | Male |
| 1385-001 | 1385 | 12/05/2024 | 12/05/2024 | Female |

---

## ⭐ Complete Test Flow (10 min)

### STEP 1: Dispense Visit 1

1. Go to **Subjects → 1384-001 → Visit Schedule**
2. Click **Dispense Drug** on Enrollment (Visit 1)
3. Enter:
   - **Drug Unit:** DRUG-A or DRUG-B
   - **Quantity:** 30
   - **First Dose Date:** `12/05/2024`
   - **Pills Per Day:** 1
4. Click **Dispense**

✅ **Expected:**
- Success message
- Subject Accountability shows First Dose = 12/05/2024

---

### STEP 2: Verify Subject Accountability

1. Go to **Drug → Subject Accountability**
2. Select Site: 1384, Subject: 1384-001

✅ **Expected columns:**
- First Dose: **12/5/2024** (matches what you entered)
- Status: Dispensed

---

### STEP 3: Record Return

1. Click **Record Return** on Visit 1 row
2. Enter:
   - **Return Date:** `12/15/2024`
   - **Pills Remaining:** 20
   - **Last Dose:** `12/14/2024`
3. Submit

✅ **Expected:**
- Pills Used: 10 (30 - 20)
- Days Used: 10 (12/5 to 12/14)
- Compliance: 100%

---

### STEP 4: Verify Master Log

1. Go to **Drug → Master Accountability Log**
2. Find your drug unit

✅ **Expected:** Same dates as Subject Accountability

---

### STEP 5: Test Overlap Block

1. Go to **Subjects → 1384-001 → Visit Schedule**
2. Click **Dispense Drug** on Visit 2
3. Enter First Dose: `12/10/2024` (BEFORE last dose 12/14)

❌ **Expected: BLOCKED** - "First Dose must be after 12/14/2024"

---

### STEP 6: Valid Visit 2 Dispense

1. Change First Dose to `12/15/2024` (day after last dose)
2. Submit

✅ **Expected:** Success

---

## 📋 Test Checklist

- [ ] First Dose date displays correctly (no -1 day shift)
- [ ] Subject Accountability matches entered dates
- [ ] Master Log matches Subject Accountability
- [ ] Overlap blocking works
- [ ] Compliance calculates correctly

---

## 🔧 Reset Data

```sql
-- Clear accountability and re-enable drug units
DELETE FROM accountability;
UPDATE drug_units SET status = 'Available', subject_id = NULL;
```