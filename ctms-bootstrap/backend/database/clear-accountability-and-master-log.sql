-- Clear Accountability Table and Master Log Records
-- This script will delete all records from the accountability table
-- and optionally clear drug_units (which forms the master log)

-- Step 1: Clear the accountability table
-- This table tracks dispensing, returns, and compliance data
TRUNCATE TABLE accountability RESTART IDENTITY CASCADE;

-- Step 2: Optional - Clear drug_units table (Master Log)
-- Uncomment the line below if you want to clear all drug units as well
-- TRUNCATE TABLE drug_units RESTART IDENTITY CASCADE;

-- Step 3: Optional - Reset drug_units to Available status only (keeps the units but clears assignments)
-- Uncomment the lines below if you want to keep drug units but reset their status
-- UPDATE drug_units 
-- SET status = 'Available', 
--     subject_id = NULL, 
--     assigned_date = NULL,
--     updated_at = NOW();

-- Step 4: Clear audit log entries related to accountability and drug_units
-- Uncomment if you want to clear audit trail as well
-- DELETE FROM audit_log WHERE table_name IN ('accountability', 'drug_units');

-- Verify the cleanup
SELECT 'Accountability records cleared' AS status, COUNT(*) AS remaining_count FROM accountability
UNION ALL
SELECT 'Drug units count' AS status, COUNT(*) AS remaining_count FROM drug_units;
