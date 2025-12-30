-- Clean up warning text from comments
-- Run this in Supabase SQL Editor

UPDATE accountability 
SET comments = 'returned'
WHERE comments LIKE '%Warnings:%';

-- Verify the cleanup
SELECT accountability_id, comments FROM accountability WHERE comments IS NOT NULL;

