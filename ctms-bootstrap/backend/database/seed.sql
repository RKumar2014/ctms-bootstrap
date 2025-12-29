-- Seed Data for Development/Testing
-- Run this AFTER schema.sql

-- Seed Sites
INSERT INTO sites (site_number, site_name, pi_name, country, status, activated_date) VALUES
('1384', 'Memorial Hospital', 'Dr. Smith', 'USA', 'Active', '2024-01-15'),
('1385', 'City Medical Center', 'Dr. Johnson', 'USA', 'Active', '2024-02-01'),
('1386', 'Research Clinic Toronto', 'Dr. Brown', 'Canada', 'Active', '2024-03-10');

-- Seed Admin User (password: Admin123!)
-- Note: You'll need to hash this password properly using bcrypt
INSERT INTO users (username, password_hash, email, role, site_id, is_active) VALUES
('admin', '$2b$10$XqjK8vCnJZ7Hn6Z5iWFT7.4MZL4qW/8BRGNz3yK5TfJ9kZzF8XqQG', 'admin@ctms.com', 'admin', NULL, true),
('coordinator1', '$2b$10$XqjK8vCnJZ7Hn6Z5iWFT7.4MZL4qW/8BRGNz3yK5TfJ9kZzF8XqQG', 'coord@site1384.com', 'coordinator', 1, true);

-- Seed Visit Definitions
INSERT INTO visits (visit_name, visit_sequence, expected_offset_days, expected_range_days) VALUES
('Screening', 1, 0, 0),
('Baseline', 2, 7, 3),
('Week 4', 3, 28, 7),
('Week 8', 4, 56, 7),
('Week 12', 5, 84, 7),
('Final Visit', 6, 112, 7);

-- Seed Test Subjects
INSERT INTO subjects (subject_number, site_id, dob, sex, status, consent_date, enrollment_date) VALUES
('1384-001', 1, '1985-06-15', 'Male', 'Active', '2024-11-01 10:00:00+00', '2024-11-01 10:30:00+00'),
('1384-002', 1, '1992-03-22', 'Female', 'Active', '2024-11-05 14:00:00+00', '2024-11-05 14:30:00+00'),
('1385-001', 2, '1978-09-10', 'Male', 'Active', '2024-11-10 09:00:00+00', '2024-11-10 09:30:00+00');

-- Seed Drug Units
INSERT INTO drug_units (drug_code, lot_number, expiration_date, status, site_id) VALUES
('DRUG-A', 'LOT001', '2026-12-31', 'Available', 1),
('DRUG-A', 'LOT001', '2026-12-31', 'Available', 1),
('DRUG-A', 'LOT002', '2027-06-30', 'Available', 2),
('DRUG-B', 'LOT003', '2026-09-15', 'Available', 1);

-- Note: Subject visits will be automatically created when subjects are enrolled
-- Accountability records will be created during drug dispensing workflows
