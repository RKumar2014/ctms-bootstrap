-- User Role Migration
-- Run this in Supabase SQL Editor to add new roles

-- Drop the old constraint and add new one with all roles
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('admin', 'coordinator', 'monitor', 'auditor', 'doctor'));

-- Verify current users have valid roles
SELECT username, role, site_id FROM users;
