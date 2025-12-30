-- Update seed data dates from 2024 to December 2025
-- This makes the data consistent with the current date

-- =============================================
-- 1. Update Subject dates (shift forward ~14 months)
-- =============================================

-- Active Subjects - set enrollment to early December 2025
UPDATE subjects 
SET 
    consent_date = '2025-12-01 09:00:00',
    enrollment_date = '2025-12-01 10:00:00',
    updated_at = NOW()
WHERE subject_number = '1384-001';

UPDATE subjects 
SET 
    consent_date = '2025-12-05 14:30:00',
    enrollment_date = '2025-12-05 15:00:00',
    updated_at = NOW()
WHERE subject_number = '1384-002';

UPDATE subjects 
SET 
    consent_date = '2025-12-10 11:00:00',
    enrollment_date = '2025-12-10 11:30:00',
    updated_at = NOW()
WHERE subject_number = '1384-005';

-- Completed Subjects - earlier in 2025
UPDATE subjects 
SET 
    consent_date = '2025-06-01 10:00:00',
    enrollment_date = '2025-06-01 11:00:00',
    updated_at = NOW()
WHERE subject_number = '1384-006';

UPDATE subjects 
SET 
    consent_date = '2025-07-10 13:00:00',
    enrollment_date = '2025-07-10 14:00:00',
    updated_at = NOW()
WHERE subject_number = '1384-007';

-- Terminated Subjects - update to 2025 dates
UPDATE subjects 
SET 
    consent_date = '2025-10-10 14:29:00',
    enrollment_date = '2025-10-10 15:00:00',
    termination_date = '2025-12-15',
    updated_at = NOW()
WHERE subject_number = '1384-003';

UPDATE subjects 
SET 
    consent_date = '2025-08-15 09:00:00',
    enrollment_date = '2025-08-15 10:00:00',
    termination_date = '2025-11-20',
    updated_at = NOW()
WHERE subject_number = '1384-009';

UPDATE subjects 
SET 
    consent_date = '2025-09-01 11:00:00',
    enrollment_date = '2025-09-01 12:00:00',
    termination_date = '2025-12-15',
    updated_at = NOW()
WHERE subject_number = '1384-015';

UPDATE subjects 
SET 
    consent_date = '2025-09-20 10:30:00',
    enrollment_date = '2025-09-20 11:00:00',
    termination_date = '2026-01-10',
    updated_at = NOW()
WHERE subject_number = '1384-019';

UPDATE subjects 
SET 
    consent_date = '2025-10-12 13:00:00',
    enrollment_date = '2025-10-12 14:00:00',
    termination_date = '2026-02-05',
    updated_at = NOW()
WHERE subject_number = '1384-022';

UPDATE subjects 
SET 
    consent_date = '2025-10-18 15:00:00',
    enrollment_date = '2025-10-18 16:00:00',
    termination_date = '2026-03-01',
    updated_at = NOW()
WHERE subject_number = '1384-023';

-- Also update 1384-008 if it exists
UPDATE subjects 
SET 
    consent_date = '2025-12-08 10:00:00',
    enrollment_date = '2025-12-08 11:00:00',
    updated_at = NOW()
WHERE subject_number = '1384-008';

-- =============================================
-- 2. Update Subject Visits expected_date based on new enrollment dates
-- =============================================

-- Update expected dates for all subject_visits
UPDATE subject_visits sv
SET 
    expected_date = CASE 
        WHEN v.visit_sequence = 0 THEN s.enrollment_date::date
        WHEN v.visit_sequence = 1 THEN s.enrollment_date::date
        WHEN v.visit_sequence = 2 THEN (s.enrollment_date + INTERVAL '35 days')::date
        WHEN v.visit_sequence = 3 THEN (s.enrollment_date + INTERVAL '90 days')::date
        WHEN v.visit_sequence = 4 THEN (s.enrollment_date + INTERVAL '150 days')::date
        WHEN v.visit_sequence = 5 THEN (s.enrollment_date + INTERVAL '210 days')::date
        WHEN v.visit_sequence = 99 THEN s.termination_date::date
        ELSE sv.expected_date
    END,
    updated_at = NOW()
FROM subjects s, visits v
WHERE sv.subject_id = s.subject_id 
  AND sv.visit_id = v.visit_id;

-- Reset actual_date for visits that haven't happened yet
-- Only keep actual_date for Enrollment visits of Active subjects
UPDATE subject_visits sv
SET 
    actual_date = NULL,
    status = 'Scheduled',
    updated_at = NOW()
FROM visits v
WHERE sv.visit_id = v.visit_id 
  AND v.visit_sequence > 1;

-- Set Enrollment actual_date to enrollment_date for active subjects
UPDATE subject_visits sv
SET 
    actual_date = s.enrollment_date,
    status = 'Completed',
    updated_at = NOW()
FROM subjects s, visits v
WHERE sv.subject_id = s.subject_id 
  AND sv.visit_id = v.visit_id
  AND v.visit_sequence = 1
  AND s.status = 'Active';

-- =============================================
-- 3. Verify the updates
-- =============================================

SELECT 
    s.subject_number,
    s.status,
    s.consent_date::date as consent,
    s.enrollment_date::date as enrolled
FROM subjects s
WHERE s.site_id = (SELECT site_id FROM sites WHERE site_number = '1384')
ORDER BY s.subject_number;

SELECT 
    s.subject_number,
    v.visit_name,
    sv.expected_date,
    sv.actual_date,
    sv.status
FROM subject_visits sv
JOIN subjects s ON sv.subject_id = s.subject_id
JOIN visits v ON sv.visit_id = v.visit_id
WHERE s.subject_number = '1384-001'
ORDER BY v.visit_sequence;

