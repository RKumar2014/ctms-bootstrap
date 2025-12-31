# CTMS Comprehensive Testing Scenarios

## 📊 Test Data Overview

| Item | Count | Details |
|------|-------|---------|
| Sites | 2 | 1384, 1385 |
| Subjects | 2 | 1384-001, 1385-001 |
| Drug Units | 24 | 5-6 units per drug per site |
| Visits | 5 per subject | Enrollment, V2, V3, V4, V5 |

---

## 🎯 Test Suite 1: Happy Path (Basic Flow)

### Test 1.1: Complete Visit Cycle
**Objective:** Verify normal dispense → return flow

1. **Dispense Visit 1**
   - Subject: 1384-001
   - Drug: Aspirin 100mg (800001)
   - Qty: 30
   - First Dose: 12/05/2024
   - Pills/Day: 1
   
2. **Record Return Visit 1**
   - Return Date: 12/15/2024
   - Pills Remaining: 20
   - Last Dose: 12/14/2024
   
3. **Verify Calculations**
   - ✅ Pills Used: 10 (30-20)
   - ✅ Days Used: 10 (12/5 to 12/14)
   - ✅ Expected: 10 (10 days × 1 pill/day)
   - ✅ Compliance: 100%

---

## 🚫 Test Suite 2: Date Validation Blocking

### Test 2.1: Block Overlap - First Dose Before Last Dose
**Objective:** System must prevent medication overlap

1. Complete Visit 1 (as in Test 1.1)
   - Last Dose: 12/14/2024
   
2. **Attempt Visit 2 Dispense**
   - First Dose: **12/10/2024** (BEFORE 12/14)
   
3. **Expected Result:**
   - ❌ **BLOCKED** with error:
   - "Medication overlap detected! First Dose must be AFTER 12/14/2024"

### Test 2.2: Block Overlap - First Dose Same as Last Dose
**Objective:** First dose must be AFTER (not equal to) last dose

1. Visit 1 Last Dose: 12/14/2024
2. **Attempt Visit 2 First Dose: 12/14/2024** (same day)
3. **Expected:** ❌ BLOCKED

### Test 2.3: Valid Next-Day Dispense
**Objective:** Allow dispense when first dose is day after last dose

1. Visit 1 Last Dose: 12/14/2024
2. Visit 2 First Dose: **12/15/2024** (next day)
3. **Expected:** ✅ SUCCESS

---

## ⚠️ Test Suite 3: Return Date Validations

### Test 3.1: Return Date Before First Dose
**Objective:** Cannot return before patient started medication

1. Dispense Visit 1
   - First Dose: 12/05/2024
   
2. **Attempt Return**
   - Return Date: **12/01/2024** (before first dose)
   
3. **Expected:** ⚠️ Warning: "Return date cannot be before first dose date"

### Test 3.2: Return Date in Future
**Objective:** Cannot return medication from the future

1. **Attempt Return**
   - Return Date: **01/15/2025** (future date)
   
2. **Expected:** ⚠️ Warning: "Return date cannot be in the future"

### Test 3.3: Last Dose After Return Date
**Objective:** Patient can't take pills after returning them

1. **Attempt Return**
   - Return Date: 12/15/2024
   - Last Dose: **12/20/2024** (after return)
   
2. **Expected:** ⚠️ Warning: "Last dose date should not be after return date"

### Test 3.4: Last Dose Before First Dose
**Objective:** Logical date order validation

1. **Attempt Return**
   - First Dose: 12/10/2024
   - Last Dose: **12/05/2024** (before first)
   
2. **Expected:** ⚠️ Warning: "First dose date cannot be after last dose date"

---

## 🔄 Test Suite 4: Visit Sequence Blocking

### Test 4.1: Block Dispense When Previous Visit Not Returned
**Objective:** Must return previous visit's drug before dispensing next

1. **Dispense Visit 1** (but DON'T return)
   - Drug: 800001
   - Status: Dispensed
   
2. **Attempt Visit 2 Dispense**
   
3. **Expected:** ❌ BLOCKED
   - "Cannot dispense for this visit. Enrollment (Visit 1) drugs have not been returned yet."

### Test 4.2: Allow Dispense After Return
**Objective:** Can dispense next visit after returning previous

1. Dispense Visit 1
2. **Return Visit 1** (status → Returned)
3. **Attempt Visit 2 Dispense**
4. **Expected:** ✅ SUCCESS

---

## 📊 Test Suite 5: Compliance Calculations

### Test 5.1: Perfect Compliance (100%)
1. Dispense: 30 pills, First Dose: 12/01, Pills/Day: 1
2. Return: 20 pills, Last Dose: 12/10
3. **Expected:**
   - Days Used: 10
   - Pills Used: 10
   - Expected: 10
   - **Compliance: 100%**

### Test 5.2: Under-Compliance (50%)
**Scenario:** Patient took fewer pills than expected

1. Dispense: 30 pills, First Dose: 12/01, Pills/Day: 1
2. Return: **25 pills**, Last Dose: 12/10
3. **Expected:**
   - Days Used: 10
   - Pills Used: 5
   - Expected: 10
   - **Compliance: 50%** (red flag)

### Test 5.3: Over-Compliance (150%)
**Scenario:** Patient took more pills than prescribed

1. Dispense: 30 pills, First Dose: 12/01, Pills/Day: 1
2. Return: **15 pills**, Last Dose: 12/10
3. **Expected:**
   - Days Used: 10
   - Pills Used: 15
   - Expected: 10
   - **Compliance: 150%** ⚠️ Warning

### Test 5.4: Zero Compliance (0%)
**Scenario:** Patient returned all pills (didn't take any)

1. Dispense: 30 pills
2. Return: **30 pills** (all returned)
3. **Expected:**
   - Pills Used: 0
   - **Compliance: 0%** (gray, not red)
   - Status: "None Used"

### Test 5.5: Cannot Calculate Compliance (Missing Dates)
**Scenario:** Legacy record without first/last dose dates

1. Dispense: 30 pills (old record, no dates captured)
2. Return: 20 pills (but no first/last dose entered)
3. **Expected:**
   - **Compliance: N/A**
   - Tooltip: "Cannot calculate - missing dates"

---

## 🔢 Test Suite 6: Quantity Validations

### Test 6.1: Return More Than Dispensed
**Objective:** Cannot return more pills than dispensed

1. Dispense: 30 pills
2. **Attempt Return: 35 pills**
3. **Expected:** ❌ Error or warning

### Test 6.2: Negative Pills Remaining
**Objective:** Validate non-negative quantities

1. **Attempt Return: -5 pills**
2. **Expected:** ❌ Validation error

### Test 6.3: Dispense More Than Bottle Contains
**Objective:** Cannot dispense more than bottle's quantity_per_unit

1. Select Drug Unit (quantity_per_unit = 30)
2. **Attempt Dispense: 40 pills**
3. **Expected:** ❌ Error: "Cannot dispense more than 30 pills"

---

## 🗓️ Test Suite 7: Multi-Visit Complete Flow

### Test 7.1: Complete 5-Visit Subject Journey
**Objective:** Full lifecycle testing for one subject

**Subject 1384-001 (Aspirin 100mg, 1 pill/day)**

| Visit | Dispense Date | Drug ID | First Dose | Last Dose | Return Date | Qty Disp | Qty Ret | Compliance |
|-------|---------------|---------|------------|-----------|-------------|----------|---------|------------|
| V1 | 12/01/2024 | 800001 | 12/01 | 12/30 | 12/31 | 30 | 1 | 97% |
| V2 | 01/01/2025 | 800002 | 01/01 | 01/30 | 01/31 | 30 | 0 | 100% |
| V3 | 02/01/2025 | 800003 | 02/01 | 02/28 | 03/01 | 30 | 2 | 100% |
| V4 | 03/02/2025 | 800004 | 03/02 | 03/31 | 04/01 | 30 | 0 | 100% |
| V5 | 04/02/2025 | 800005 | 04/02 | 05/01 | 05/02 | 30 | 0 | 100% |

**Validation Points:**
- ✅ Each visit uses different drug unit
- ✅ All same drug (Aspirin)
- ✅ No overlaps (first dose always after previous last dose)
- ✅ All returns recorded
- ✅ Compliance calculated for all

---

## 🧪 Test Suite 8: Edge Cases

### Test 8.1: Same-Day First and Last Dose
**Scenario:** Patient took only one dose

1. Dispense: 30 pills, First Dose: 12/15/2024
2. Return: 29 pills, Last Dose: **12/15/2024** (same day)
3. **Expected:**
   - Days Used: 1 (same day counts as 1)
   - Pills Used: 1
   - Compliance: 100%

### Test 8.2: High Pills Per Day (3 pills/day)
**Scenario:** Different dosing regimen

1. Dispense: 30 pills, First Dose: 12/01, **Pills/Day: 3**
2. Return: 0 pills, Last Dose: 12/10
3. **Expected:**
   - Days Used: 10
   - Expected: 30 (10 days × 3 pills/day)
   - Pills Used: 30
   - Compliance: 100%

### Test 8.3: Partial Month Return
**Scenario:** Return mid-month

1. Dispense: 30 pills, First Dose: 12/01, Pills/Day: 1
2. Return: 15 pills, Last Dose: **12/15** (15 days)
3. **Expected:**
   - Days Used: 15
   - Expected: 15
   - Pills Used: 15
   - Compliance: 100%

### Test 8.4: Weekend Gap in Dosing
**Scenario:** Patient skipped weekend (realistic)

1. Dispense: 30 pills, First Dose: 12/01 (Mon), Pills/Day: 1
2. Return: 8 pills, Last Dose: 12/22 (Sun)
3. **Expected:**
   - Days Used: 22
   - Pills Used: 22
   - Compliance: 100%
   - (System doesn't enforce daily dosing, just calculates)

---

## 📋 Test Suite 9: Master Accountability Log

### Test 9.1: Verify All Records Appear
**Objective:** Master log shows complete history

1. Complete 2 visits for Subject 1384-001
2. Complete 1 visit for Subject 1385-001
3. **Navigate to Master Accountability Log**
4. **Expected:**
   - Shows all 3 drug units
   - Correct dispense/return dates
   - Correct compliance %
   - Filterable by site

### Test 9.2: Export CSV Validation
**Objective:** CSV export contains all data

1. Complete several visits
2. **Click "Export CSV"**
3. **Verify CSV contains:**
   - All drug unit IDs
   - All dates (formatted correctly)
   - Compliance percentages
   - Subject numbers
   - Visit names

---

## 🔐 Test Suite 10: Data Integrity

### Test 10.1: Drug Unit Status Transitions
**Objective:** Verify status changes correctly

1. Initial: **Available**
2. After Dispense: **Dispensed**
3. After Return: **Returned**
4. **Verify:** Cannot dispense a "Returned" drug again

### Test 10.2: Audit Trail
**Objective:** All actions are logged

1. Dispense drug
2. Return drug
3. Edit accountability record
4. **Check audit_log table:**
   - All actions recorded
   - Timestamps correct
   - User IDs captured

---

## ✅ Test Execution Checklist

### Critical Path Tests (Must Pass)
- [ ] Test 1.1: Complete Visit Cycle
- [ ] Test 2.1: Block Overlap
- [ ] Test 4.1: Block Dispense When Not Returned
- [ ] Test 5.1: Perfect Compliance (100%)
- [ ] Test 7.1: Complete 5-Visit Journey

### Date Validation Tests
- [ ] Test 2.1: Block Overlap - Before Last Dose
- [ ] Test 2.2: Block Overlap - Same Day
- [ ] Test 2.3: Valid Next-Day Dispense
- [ ] Test 3.1: Return Before First Dose
- [ ] Test 3.2: Return in Future
- [ ] Test 3.3: Last Dose After Return
- [ ] Test 3.4: Last Dose Before First Dose

### Compliance Tests
- [ ] Test 5.1: 100% Compliance
- [ ] Test 5.2: 50% Under-Compliance
- [ ] Test 5.3: 150% Over-Compliance
- [ ] Test 5.4: 0% Compliance (None Used)
- [ ] Test 5.5: N/A (Missing Dates)

### Edge Cases
- [ ] Test 8.1: Same-Day First/Last Dose
- [ ] Test 8.2: High Pills Per Day (3)
- [ ] Test 8.3: Partial Month Return
- [ ] Test 8.4: Weekend Gap

### System Tests
- [ ] Test 9.1: Master Log Shows All Records
- [ ] Test 9.2: CSV Export Works
- [ ] Test 10.1: Drug Status Transitions
- [ ] Test 10.2: Audit Trail Logging

---

## 🐛 Bug Reporting Template

When you find a bug, document it like this:

```
**Bug ID:** BUG-001
**Test Case:** Test 2.1 - Block Overlap
**Severity:** High
**Steps to Reproduce:**
1. Dispense Visit 1, Last Dose = 12/14/2024
2. Attempt Visit 2, First Dose = 12/10/2024
3. Click Dispense

**Expected:** Error message blocking dispense
**Actual:** Dispense succeeded (overlap allowed)
**Screenshot:** [attach]
**Database State:** [SQL query showing bad data]
```

---

## 📊 Test Coverage Summary

| Category | Tests | Priority |
|----------|-------|----------|
| Happy Path | 1 | P0 |
| Date Blocking | 7 | P0 |
| Sequence Blocking | 2 | P0 |
| Compliance | 5 | P1 |
| Quantity Validation | 3 | P1 |
| Multi-Visit Flow | 1 | P0 |
| Edge Cases | 4 | P2 |
| Master Log | 2 | P1 |
| Data Integrity | 2 | P1 |
| **TOTAL** | **27** | - |

**Priority Legend:**
- **P0:** Must pass before release
- **P1:** Should pass before release
- **P2:** Nice to have, can be fixed post-release
