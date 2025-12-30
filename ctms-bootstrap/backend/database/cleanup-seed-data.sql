-- =============================================
-- CLEANUP SCRIPT: Reset Seeded Drug Accountability Data
-- Run this in Supabase SQL Editor
-- =============================================

-- First, let's see what we're working with
-- Uncomment these SELECT statements to preview before deleting

-- Preview: Current accountability records
-- SELECT a.*, s.subject_number 
-- FROM accountability a 
-- JOIN subjects s ON a.subject_id = s.subject_id;

-- Preview: Current drug unit statuses
-- SELECT drug_unit_id, drug_code, status, subject_id 
-- FROM drug_units 
-- WHERE drug_unit_id IN (9, 11, 12, 13, 14);

-- =============================================
-- STEP 1: Delete all accountability records for subject 1384-001
-- =============================================
DELETE FROM accountability 
WHERE subject_id IN (
    SELECT subject_id FROM subjects WHERE subject_number = '1384-001'
);

-- =============================================
-- STEP 2: Reset drug units back to Available
-- =============================================
UPDATE drug_units 
SET 
    status = 'Available',
    subject_id = NULL,
    assigned_date = NULL,
    updated_at = NOW()
WHERE drug_unit_id IN (9, 11, 12, 13, 14);

-- =============================================
-- STEP 3: Reset subject_visits actual dates (optional)
-- Keeps the visit schedule but clears actual visit dates
-- =============================================
UPDATE subject_visits 
SET 
    actual_date = NULL,
    status = 'Scheduled',
    updated_at = NOW()
WHERE subject_id IN (
    SELECT subject_id FROM subjects WHERE subject_number = '1384-001'
);

-- =============================================
-- VERIFICATION QUERIES
-- Run these to confirm cleanup was successful
-- =============================================

-- Should return 0 rows (no accountability records for 1384-001)
SELECT COUNT(*) as accountability_count 
FROM accountability 
WHERE subject_id IN (
    SELECT subject_id FROM subjects WHERE subject_number = '1384-001'
);

-- Should show all drug units as 'Available' with null subject_id
SELECT drug_unit_id, drug_code, status, subject_id 
FROM drug_units 
WHERE drug_unit_id IN (9, 11, 12, 13, 14)
ORDER BY drug_unit_id;

-- Should show subject 1384-001 still exists (demographics preserved)
SELECT subject_id, subject_number, status, sex, dob, consent_date 
FROM subjects 
WHERE subject_number = '1384-001';

-- Should show visit schedule preserved with null actual dates
SELECT sv.subject_visit_id, v.visit_name, sv.expected_date, sv.actual_date, sv.status
FROM subject_visits sv
JOIN visits v ON sv.visit_id = v.visit_id
WHERE sv.subject_id IN (
    SELECT subject_id FROM subjects WHERE subject_number = '1384-001'
)
ORDER BY v.visit_sequence;

-- =============================================
-- SUMMARY OF WHAT WAS PRESERVED
-- =============================================
-- ✅ Sites table - untouched
-- ✅ Subjects table - demographics preserved
-- ✅ Visits table (template) - untouched
-- ✅ Subject_visits - schedule preserved, actual dates cleared
-- ✅ Drug_units - reset to Available status
-- ✅ Users table - untouched
-- 
-- ❌ Accountability - all records for 1384-001 deleted
-- =============================================

