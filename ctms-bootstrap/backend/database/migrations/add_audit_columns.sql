-- Audit Trail Schema Migration
-- Run this in Supabase SQL Editor to add missing columns

-- Add new columns to audit_log table
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS ip_address VARCHAR(50);
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS reason_for_change TEXT;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_table ON audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_record ON audit_log(record_id);

-- Verify the structure
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'audit_log';
