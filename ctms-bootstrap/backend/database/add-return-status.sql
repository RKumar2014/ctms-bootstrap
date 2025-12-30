-- Add return_status column to accountability table
-- Run this in Supabase SQL Editor

ALTER TABLE accountability 
ADD COLUMN IF NOT EXISTS return_status VARCHAR(20) DEFAULT NULL;

-- Valid values: 'RETURNED', 'NOT_RETURNED', 'WASTED', 'LOST', 'DESTROYED'

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'accountability' 
ORDER BY ordinal_position;

