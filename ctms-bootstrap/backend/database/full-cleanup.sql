-- =============================================
-- FULL CLEANUP - Clear ALL transactional data
-- Keeps: Sites, Subjects, Visits, Drug Unit definitions
-- Clears: Accountability records, Drug assignments, Visit completions
-- =============================================

-- 1. Delete ALL accountability records
DELETE FROM accountability;

-- 2. Reset ALL drug units to Available
UPDATE drug_units 
SET 
    status = 'Available',
    subject_id = NULL,
    assigned_date = NULL,
    updated_at = NOW();

-- 3. Reset ALL subject_visits (clear actual dates, reset to Scheduled)
UPDATE subject_visits 
SET 
    actual_date = NULL,
    status = 'Scheduled',
    updated_at = NOW();

-- 4. Mark Enrollment visits as the only ones with actual dates for Active subjects
-- (Optional: uncomment if you want enrollment to show as completed)
-- UPDATE subject_visits sv
-- SET 
--     actual_date = s.enrollment_date,
--     status = 'Completed'
-- FROM subjects s, visits v
-- WHERE sv.subject_id = s.subject_id 
--   AND sv.visit_id = v.visit_id
--   AND v.visit_sequence = 1
--   AND s.status = 'Active';

-- =============================================
-- VERIFY CLEANUP
-- =============================================

-- Check accountability is empty
SELECT 'Accountability Records:' as check_type, COUNT(*) as count FROM accountability;

-- Check all drug units are Available
SELECT 'Drug Units by Status:' as check_type, status, COUNT(*) as count 
FROM drug_units 
GROUP BY status;

-- Check subject_visits are reset
SELECT 'Subject Visits by Status:' as check_type, status, COUNT(*) as count 
FROM subject_visits 
GROUP BY status;

-- Show available drug units
SELECT 'Available Drug Units:' as info, drug_unit_id, drug_code, lot_number, quantity_per_unit 
FROM drug_units 
WHERE status = 'Available'
ORDER BY drug_unit_id
LIMIT 10;

