-- FIX: Update admin user with correct password hash
-- Run this in Supabase SQL Editor

-- First, delete any existing admin user (to avoid duplicates)
DELETE FROM users WHERE username = 'admin';

-- Insert admin user with CORRECT bcrypt hash for "Admin123!"
INSERT INTO users (username, password_hash, email, role, site_id, is_active) 
VALUES (
  'admin', 
  '$2b$10$SsnFXOo6F1nd7Y48VElokuIDlN2yeSSavXdZI2LM/gQrIAtN5t2vK',
  'admin@ctms.com', 
  'admin', 
  NULL, 
  true
);

-- Verify the user was created
SELECT username, email, role, is_active FROM users WHERE username = 'admin';
