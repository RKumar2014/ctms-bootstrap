-- Seed Data for CTMS

-- Insert Visit Definitions (Study Protocol)
INSERT INTO visits (visit_name, visit_sequence, expected_offset_days, expected_range_days) VALUES
('Rollover', 0, 0, 0),
('Enrollment (Visit 1)', 1, 0, 0),
('Visit 2', 2, 35, 7),
('Visit 3', 3, 90, 7),
('Visit 4', 4, 150, 7),
('Visit 5', 5, 210, 7),
('Early Termination', 99, 0, 0)
ON CONFLICT DO NOTHING;

-- Insert Sites (if not already exists)
INSERT INTO sites (site_number, site_name, pi_name, country, status, activated_date) VALUES
('1384', 'Memorial Hospital', 'Dr. Smith', 'USA', 'Active', '2024-01-01')
ON CONFLICT (site_number) DO NOTHING;

-- Insert Subjects with different statuses
INSERT INTO subjects (subject_number, site_id, dob, sex, status, consent_date, enrollment_date, termination_date) VALUES
-- Active Subjects
('1384-001', (SELECT site_id FROM sites WHERE site_number = '1384'), '1985-03-15', 'Male', 'Active', '2024-10-01 09:00:00', '2024-10-01 10:00:00', NULL),
('1384-002', (SELECT site_id FROM sites WHERE site_number = '1384'), '1992-07-22', 'Female', 'Active', '2024-10-05 14:30:00', '2024-10-05 15:00:00', NULL),
('1384-005', (SELECT site_id FROM sites WHERE site_number = '1384'), '1978-11-30', 'Male', 'Active', '2024-10-15 11:00:00', '2024-10-15 11:30:00', NULL),

-- Completed Subjects
('1384-006', (SELECT site_id FROM sites WHERE site_number = '1384'), '1988-05-12', 'Female', 'Completed', '2024-06-01 10:00:00', '2024-06-01 11:00:00', NULL),
('1384-007', (SELECT site_id FROM sites WHERE site_number = '1384'), '1995-09-08', 'Male', 'Completed', '2024-07-10 13:00:00', '2024-07-10 14:00:00', NULL),

-- Early Terminated Subjects  
('1384-003', (SELECT site_id FROM sites WHERE site_number = '1384'), '1950-05-01', 'Male', 'Terminated', '2024-10-10 14:29:00', '2024-10-10 15:00:00', '2025-10-31'),
('1384-009', (SELECT site_id FROM sites WHERE site_number = '1384'), '1965-04-20', 'Male', 'Terminated', '2024-08-15 09:00:00', '2024-08-15 10:00:00', '2024-11-20'),
('1384-015', (SELECT site_id FROM sites WHERE site_number = '1384'), '1963-09-10', 'Male', 'Terminated', '2024-09-01 11:00:00', '2024-09-01 12:00:00', '2024-12-15'),
('1384-019', (SELECT site_id FROM sites WHERE site_number = '1384'), '1974-06-25', 'Male', 'Terminated', '2024-09-20 10:30:00', '2024-09-20 11:00:00', '2025-01-10'),
('1384-022', (SELECT site_id FROM sites WHERE site_number = '1384'), '1982-03-14', 'Male', 'Terminated', '2024-10-12 13:00:00', '2024-10-12 14:00:00', '2025-02-05'),
('1384-023', (SELECT site_id FROM sites WHERE site_number = '1384'), '1970-09-18', 'Female', 'Terminated', '2024-10-18 15:00:00', '2024-10-18 16:00:00', '2025-03-01')
ON CONFLICT (subject_number) DO NOTHING;

-- Insert Subject Visits for subject 1384-001 (Active)
INSERT INTO subject_visits (subject_id, visit_id, expected_date, actual_date, status) 
SELECT s.subject_id, v.visit_id,
  CASE 
    WHEN v.visit_sequence = 0 THEN s.enrollment_date::date
    WHEN v.visit_sequence = 1 THEN s.enrollment_date::date
    WHEN v.visit_sequence = 2 THEN (s.enrollment_date + INTERVAL '35 days')::date
    WHEN v.visit_sequence = 3 THEN (s.enrollment_date + INTERVAL '90 days')::date
    WHEN v.visit_sequence = 4 THEN (s.enrollment_date + INTERVAL '150 days')::date
    WHEN v.visit_sequence = 5 THEN (s.enrollment_date + INTERVAL '210 days')::date
  END,
  CASE 
    WHEN v.visit_sequence <= 2 THEN s.enrollment_date + INTERVAL '1 hour' * v.visit_sequence
    ELSE NULL
  END,
  CASE 
    WHEN v.visit_sequence <= 2 THEN 'Completed'
    ELSE 'Scheduled'
  END
FROM subjects s
CROSS JOIN visits v
WHERE s.subject_number = '1384-001' AND v.visit_sequence IN (0, 1, 2, 3, 4, 5)
ON CONFLICT (subject_id, visit_id) DO NOTHING;

-- Insert Subject Visits for subject 1384-002 (Active)
INSERT INTO subject_visits (subject_id, visit_id, expected_date, actual_date, status)
SELECT s.subject_id, v.visit_id,
  CASE 
    WHEN v.visit_sequence = 0 THEN s.enrollment_date::date
    WHEN v.visit_sequence = 1 THEN s.enrollment_date::date
    WHEN v.visit_sequence = 2 THEN (s.enrollment_date + INTERVAL '35 days')::date
    WHEN v.visit_sequence = 3 THEN (s.enrollment_date + INTERVAL '90 days')::date
    WHEN v.visit_sequence = 4 THEN (s.enrollment_date + INTERVAL '150 days')::date
    WHEN v.visit_sequence = 5 THEN (s.enrollment_date + INTERVAL '210 days')::date
  END,
  CASE 
    WHEN v.visit_sequence = 1 THEN s.enrollment_date + INTERVAL '1 hour'
    ELSE NULL
  END,
  CASE 
    WHEN v.visit_sequence = 1 THEN 'Completed'
    ELSE 'Scheduled'
  END
FROM subjects s
CROSS JOIN visits v
WHERE s.subject_number = '1384-002' AND v.visit_sequence IN (0, 1, 2, 3, 4, 5)
ON CONFLICT (subject_id, visit_id) DO NOTHING;

-- Insert Subject Visits for subject 1384-003 (Early Terminated)
INSERT INTO subject_visits (subject_id, visit_id, expected_date, actual_date, status)
SELECT s.subject_id, v.visit_id,
  CASE 
    WHEN v.visit_name = 'Rollover' THEN s.enrollment_date::date
    WHEN v.visit_name = 'Enrollment (Visit 1)' THEN s.enrollment_date::date
    WHEN v.visit_name = 'Visit 2' THEN (s.enrollment_date + INTERVAL '35 days')::date
    WHEN v.visit_name = 'Visit 3' THEN (s.enrollment_date + INTERVAL '90 days')::date
    WHEN v.visit_name = 'Early Termination' THEN s.termination_date::date
  END,
  CASE 
    WHEN v.visit_name IN ('Rollover', 'Enrollment (Visit 1)', 'Visit 2', 'Visit 3') 
      THEN s.enrollment_date + INTERVAL '1 hour' *(v.visit_sequence)
    WHEN v.visit_name = 'Early Termination' THEN s.termination_date
    ELSE NULL
  END,
  'Completed'
FROM subjects s
CROSS JOIN visits v
WHERE s.subject_number = '1384-003' 
  AND v.visit_name IN ('Rollover', 'Enrollment (Visit 1)', 'Visit 2', 'Visit 3', 'Early Termination')
ON CONFLICT (subject_id, visit_id) DO NOTHING;
