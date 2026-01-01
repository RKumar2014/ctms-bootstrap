// COMPLETE FIX FOR SubjectAccountabilityPage.tsx
// Apply these changes to fix ALL date validation issues

// ============================================================================
// FIX #1: Update the parseDateValue function in useEffect (Line ~78)
// ============================================================================
// REPLACE the parseDateValue function inside the useEffect hook with this:

const parseDateValue = (dateStr: string): Date | null => {
    if (!dateStr) return null;

    // Extract just the date part (YYYY-MM-DD)
    let cleanDate = dateStr;
    if (dateStr.includes('T')) {
        cleanDate = dateStr.split('T')[0];
    }

    // CRITICAL FIX: Parse string components directly to avoid timezone conversion
    const parts = cleanDate.split('-');
    if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
        const day = parseInt(parts[2], 10);
        
        // Create date at noon UTC to avoid timezone edge cases
        return new Date(Date.UTC(year, month, day, 12, 0, 0));
    }

    return null;
};


// ============================================================================
// FIX #2: Update the parseDate function (Line ~225)
// ============================================================================
// REPLACE the parseDate helper function with this:

const parseDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;

    // Extract just the date part (YYYY-MM-DD)
    let cleanDate = dateStr;
    if (dateStr.includes('T')) {
        cleanDate = dateStr.split('T')[0];
    }

    // CRITICAL FIX: Parse string components directly to avoid timezone conversion
    const parts = cleanDate.split('-');
    if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
        const day = parseInt(parts[2], 10);
        
        // Create date at noon UTC to avoid timezone edge cases
        return new Date(Date.UTC(year, month, day, 12, 0, 0));
    }

    return null;
};


// ============================================================================
// FIX #3: Update VALIDATION 1 in useEffect (Line ~107)
// ============================================================================
// The validation message is incorrect. Change it from:
// "Return date cannot be before dispense date"
// TO:
// "Return date cannot be before first dose date"

// REPLACE this section:
// VALIDATION 1: Return Date >= First Dose Date (not created_at)
// Use first dose date because that's when patient started taking medication
if (returnDateObj && firstDoseObj && returnDateObj.getTime() < firstDoseObj.getTime()) {
    warnings.push('⚠️ Return date cannot be before first dose date');
}


// ============================================================================
// FIX #4: Update the validateReturnDates function (Line ~250)
// ============================================================================
// REMOVE or COMMENT OUT the "Return Date >= Dispense Date" validation
// This is causing the false positive warning in the screenshot

// DELETE OR COMMENT OUT these lines (around line 262-265):
/*
// NEW VALIDATION 1: Return Date >= Dispense Date
if (returnDateObj && dispenseDateObj && returnDateObj.getTime() < dispenseDateObj.getTime()) {
    warnings.push('Return date cannot be before dispense date');
}
*/

// The validation should start with checking return date vs first dose instead


// ============================================================================
// FIX #5: Fix the calculateCompliancePreview function (Line ~550)
// ============================================================================
// This function also uses new Date() incorrectly

// REPLACE this section:
const firstDose = new Date(dateOfFirstDose);
const lastDose = new Date(dateOfLastDose);
const timeDiff = lastDose.getTime() - firstDose.getTime();
const daysUsed = Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1;

// WITH:
const parseDateSafe = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        return new Date(Date.UTC(year, month, day, 12, 0, 0));
    }
    return null;
};

const firstDose = parseDateSafe(dateOfFirstDose);
const lastDose = parseDateSafe(dateOfLastDose);

if (!firstDose || !lastDose) return null;

const timeDiff = lastDose.getTime() - firstDose.getTime();
const daysUsed = Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1;


// ============================================================================
// FIX #6: Fix openReturnModal date initialization (Line ~510)
// ============================================================================
// These lines also use new Date() incorrectly

// REPLACE:
setDateOfFirstDose(record.date_of_first_dose
    ? new Date(record.date_of_first_dose).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0]);

// WITH:
setDateOfFirstDose(record.date_of_first_dose
    ? record.date_of_first_dose.split('T')[0]  // Just extract the date part
    : new Date().toISOString().split('T')[0]);


// ============================================================================
// FIX #7: Fix openEditModal date initialization (Line ~395)
// ============================================================================

// REPLACE:
setEditFirstDose(record.date_of_first_dose
    ? new Date(record.date_of_first_dose).toISOString().split('T')[0]
    : '');
setEditLastDose(record.date_of_last_dose
    ? new Date(record.date_of_last_dose).toISOString().split('T')[0]
    : '');

// WITH:
setEditFirstDose(record.date_of_first_dose
    ? record.date_of_first_dose.split('T')[0]  // Just extract the date part
    : '');
setEditLastDose(record.date_of_last_dose
    ? record.date_of_last_dose.split('T')[0]  // Just extract the date part
    : '');


// ============================================================================
// FIX #8: Fix getDaysUsed function (Line ~585)
// ============================================================================

// REPLACE:
if (record.date_of_first_dose && record.date_of_last_dose) {
    const firstDose = new Date(record.date_of_first_dose);
    const lastDose = new Date(record.date_of_last_dose);
    const timeDiff = lastDose.getTime() - firstDose.getTime();
    return Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1;
}

// WITH:
if (record.date_of_first_dose && record.date_of_last_dose) {
    // Parse dates correctly to avoid timezone issues
    const parseDateSafe = (dateStr: string): Date | null => {
        const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
        const parts = cleanDate.split('-');
        if (parts.length === 3) {
            return new Date(Date.UTC(
                parseInt(parts[0], 10),
                parseInt(parts[1], 10) - 1,
                parseInt(parts[2], 10),
                12, 0, 0
            ));
        }
        return null;
    };
    
    const firstDose = parseDateSafe(record.date_of_first_dose);
    const lastDose = parseDateSafe(record.date_of_last_dose);
    
    if (firstDose && lastDose) {
        const timeDiff = lastDose.getTime() - firstDose.getTime();
        return Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1;
    }
}


// ============================================================================
// FIX #9: Fix getComplianceData function (Line ~615)
// ============================================================================

// REPLACE:
const firstDose = new Date(record.date_of_first_dose);
const lastDose = new Date(record.date_of_last_dose);
const timeDiff = lastDose.getTime() - firstDose.getTime();
const daysUsed = Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1;

// WITH:
// Parse dates correctly to avoid timezone issues
const parseDateSafe = (dateStr: string): Date | null => {
    const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const parts = cleanDate.split('-');
    if (parts.length === 3) {
        return new Date(Date.UTC(
            parseInt(parts[0], 10),
            parseInt(parts[1], 10) - 1,
            parseInt(parts[2], 10),
            12, 0, 0
        ));
    }
    return null;
};

const firstDose = parseDateSafe(record.date_of_first_dose);
const lastDose = parseDateSafe(record.date_of_last_dose);

if (!firstDose || !lastDose) {
    return { value: null, status: 'no_dates' };
}

const timeDiff = lastDose.getTime() - firstDose.getTime();
const daysUsed = Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1;


// ============================================================================
// FIX #10: Fix handleReturn validation (Line ~530)
// ============================================================================

// REPLACE:
const firstDoseDate = new Date(effectiveFirstDose);
const lastDoseDate = new Date(dateOfLastDose);
if (lastDoseDate < firstDoseDate) {
    setErrorMessage('Last Dose Date cannot be before First Dose Date');
    return;
}

// WITH:
// Parse dates correctly
const parseDateSafe = (dateStr: string): Date | null => {
    const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const parts = cleanDate.split('-');
    if (parts.length === 3) {
        return new Date(Date.UTC(
            parseInt(parts[0], 10),
            parseInt(parts[1], 10) - 1,
            parseInt(parts[2], 10),
            12, 0, 0
        ));
    }
    return null;
};

const firstDoseDate = parseDateSafe(effectiveFirstDose);
const lastDoseDate = parseDateSafe(dateOfLastDose);

if (firstDoseDate && lastDoseDate && lastDoseDate.getTime() < firstDoseDate.getTime()) {
    setErrorMessage('Last Dose Date cannot be before First Dose Date');
    return;
}


// ============================================================================
// SUMMARY OF THE PROBLEM
// ============================================================================
/*
The root cause is using `new Date(dateString)` with date-only strings like "2024-12-14".

When you do:
  new Date("2024-12-14")

JavaScript interprets this as UTC midnight (2024-12-14T00:00:00Z), then when you
call .getMonth() or .getDate(), it converts to YOUR LOCAL TIMEZONE first.

In PST (UTC-8):
  "2024-12-14" → 2024-12-14T00:00:00Z → converts to 2024-12-13T16:00:00 PST
  So .getDate() returns 13, not 14!

The fix is to ALWAYS parse the date string components directly:
  const [year, month, day] = "2024-12-14".split('-');
  new Date(Date.UTC(parseInt(year), parseInt(month)-1, parseInt(day), 12, 0, 0));

This creates the date directly in UTC noon without any timezone conversion.
*/
