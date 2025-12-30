-- =============================================
-- FIX VISITS SCHEDULE v2 (Fixed foreign key order)
-- Run this in Supabase SQL Editor
-- =============================================

-- First, let's see current visits configuration
SELECT visit_id, visit_name, visit_sequence, expected_offset_days 
FROM visits 
ORDER BY visit_sequence;

-- =============================================
-- STEP 1: Delete accountability records linked to Rollover FIRST
-- (Must delete before subject_visits due to foreign key)
-- =============================================
DELETE FROM accountability 
WHERE visit_id IN (
    SELECT sv.subject_visit_id 
    FROM subject_visits sv
    JOIN visits v ON sv.visit_id = v.visit_id
    WHERE v.visit_name ILIKE '%rollover%'
);

-- =============================================
-- STEP 2: Delete subject_visits linked to Rollover
-- =============================================
DELETE FROM subject_visits 
WHERE visit_id IN (
    SELECT visit_id FROM visits WHERE visit_name ILIKE '%rollover%'
);

-- =============================================
-- STEP 3: Delete Rollover from visits template
-- =============================================
DELETE FROM visits WHERE visit_name ILIKE '%rollover%';

-- =============================================
-- STEP 4: Fix Early Termination
-- (Should have no date, only used if subject drops out)
-- =============================================

-- Make Early Termination the last visit in sequence
UPDATE visits 
SET 
    visit_sequence = 999,
    expected_offset_days = 9999
WHERE visit_name ILIKE '%early termination%' OR visit_name ILIKE '%early term%';

-- Clear any Early Termination dates from subject_visits
UPDATE subject_visits 
SET 
    expected_date = NULL,
    actual_date = NULL,
    status = 'Scheduled'
WHERE visit_id IN (
    SELECT visit_id FROM visits 
    WHERE visit_name ILIKE '%early termination%' OR visit_name ILIKE '%early term%'
);

-- =============================================
-- STEP 5: Ensure correct visit sequence order
-- =============================================
UPDATE visits SET visit_sequence = 1 WHERE visit_name ILIKE '%enrollment%' OR visit_name ILIKE '%visit 1%';
UPDATE visits SET visit_sequence = 2 WHERE visit_name = 'Visit 2';
UPDATE visits SET visit_sequence = 3 WHERE visit_name = 'Visit 3';
UPDATE visits SET visit_sequence = 4 WHERE visit_name = 'Visit 4';
UPDATE visits SET visit_sequence = 5 WHERE visit_name = 'Visit 5';
UPDATE visits SET visit_sequence = 999 WHERE visit_name ILIKE '%early termination%';

-- =============================================
-- VERIFICATION
-- =============================================

-- Should show correct order without Rollover
SELECT visit_id, visit_name, visit_sequence, expected_offset_days 
FROM visits 
ORDER BY visit_sequence;

-- Should show subject visits for 1384-001 in correct order
SELECT 
    sv.subject_visit_id,
    v.visit_name,
    v.visit_sequence,
    sv.expected_date,
    sv.actual_date,
    sv.status
FROM subject_visits sv
JOIN visits v ON sv.visit_id = v.visit_id
WHERE sv.subject_id IN (
    SELECT subject_id FROM subjects WHERE subject_number = '1384-001'
)
ORDER BY v.visit_sequence;

