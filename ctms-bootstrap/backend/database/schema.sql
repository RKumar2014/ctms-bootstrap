-- CTMS Bootstrap Database Schema
-- PostgreSQL / Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table 1: Users
CREATE TABLE users (
  user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'coordinator', 'monitor')),
  site_id INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 2: Sites
CREATE TABLE sites (
  site_id SERIAL PRIMARY KEY,
  site_number VARCHAR(50) UNIQUE NOT NULL,
  site_name VARCHAR(255) NOT NULL,
  pi_name VARCHAR(255),
  country VARCHAR(100),
  status VARCHAR(50) DEFAULT 'Active',
  activated_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 3: Subjects
CREATE TABLE subjects (
  subject_id SERIAL PRIMARY KEY,
  subject_number VARCHAR(100) UNIQUE NOT NULL,
  site_id INTEGER REFERENCES sites(site_id),
  dob DATE NOT NULL,
  sex VARCHAR(20) CHECK (sex IN ('Male', 'Female', 'Other')),
  status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Completed', 'Terminated')),
  consent_date TIMESTAMP WITH TIME ZONE NOT NULL,
  enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  termination_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 4: Visits (Study Visit Definitions)
CREATE TABLE visits (
  visit_id SERIAL PRIMARY KEY,
  visit_name VARCHAR(255) NOT NULL,
  visit_sequence INTEGER NOT NULL,
  expected_offset_days INTEGER NOT NULL,
  expected_range_days INTEGER DEFAULT 7,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 5: Subject Visits (Actual Subject Visits)
CREATE TABLE subject_visits (
  subject_visit_id SERIAL PRIMARY KEY,
  subject_id INTEGER REFERENCES subjects(subject_id),
  visit_id INTEGER REFERENCES visits(visit_id),
  expected_date DATE,
  actual_date TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Completed', 'Missed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(subject_id, visit_id)
);

-- Table 6: Drug Units
CREATE TABLE drug_units (
  drug_unit_id SERIAL PRIMARY KEY,
  drug_code VARCHAR(100) NOT NULL,
  lot_number VARCHAR(100),
  expiration_date DATE,
  status VARCHAR(50) DEFAULT 'Available' CHECK (status IN ('Available', 'Dispensed', 'Returned', 'Destroyed', 'Missing')),
  site_id INTEGER REFERENCES sites(site_id),
  subject_id INTEGER REFERENCES subjects(subject_id),
  assigned_date TIMESTAMP WITH TIME ZONE,
  quantity_per_unit INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migration: Add 'Returned' status and quantity_per_unit for existing installations:
-- ALTER TABLE drug_units DROP CONSTRAINT IF EXISTS drug_units_status_check;
-- ALTER TABLE drug_units ADD CONSTRAINT drug_units_status_check CHECK (status IN ('Available', 'Dispensed', 'Returned', 'Destroyed', 'Missing'));
-- ALTER TABLE drug_units ADD COLUMN IF NOT EXISTS quantity_per_unit INTEGER DEFAULT 30;

-- Table 7: Accountability
CREATE TABLE accountability (
  accountability_id SERIAL PRIMARY KEY,
  subject_id INTEGER REFERENCES subjects(subject_id),
  visit_id INTEGER REFERENCES subject_visits(subject_visit_id),
  drug_unit_id INTEGER REFERENCES drug_units(drug_unit_id),
  qty_dispensed INTEGER DEFAULT 0,
  qty_returned INTEGER DEFAULT 0,
  return_date TIMESTAMP WITH TIME ZONE,
  reconciliation_date TIMESTAMP WITH TIME ZONE,
  -- Enhanced compliance tracking fields
  date_of_first_dose DATE,
  date_of_last_dose DATE,
  pills_per_day INTEGER DEFAULT 1,
  days_used INTEGER,
  expected_pills INTEGER,
  pills_used INTEGER,
  compliance_percentage DECIMAL(5,2),
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migration: Add compliance tracking columns for existing installations
-- Run this in Supabase SQL Editor:
-- ALTER TABLE accountability ADD COLUMN IF NOT EXISTS return_date TIMESTAMP WITH TIME ZONE;
-- ALTER TABLE accountability ADD COLUMN IF NOT EXISTS date_of_first_dose DATE;
-- ALTER TABLE accountability ADD COLUMN IF NOT EXISTS date_of_last_dose DATE;
-- ALTER TABLE accountability ADD COLUMN IF NOT EXISTS pills_per_day INTEGER DEFAULT 1;
-- ALTER TABLE accountability ADD COLUMN IF NOT EXISTS days_used INTEGER;
-- ALTER TABLE accountability ADD COLUMN IF NOT EXISTS expected_pills INTEGER;
-- ALTER TABLE accountability ADD COLUMN IF NOT EXISTS pills_used INTEGER;
-- ALTER TABLE accountability ADD COLUMN IF NOT EXISTS compliance_percentage DECIMAL(5,2);

-- Table 8: Audit Log
CREATE TABLE audit_log (
  audit_id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(user_id),
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(100) NOT NULL,
  record_id VARCHAR(100),
  changes_json JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key to users table
ALTER TABLE users 
  ADD CONSTRAINT fk_users_site 
  FOREIGN KEY (site_id) REFERENCES sites(site_id);

-- Create indexes for performance
CREATE INDEX idx_subjects_site ON subjects(site_id);
CREATE INDEX idx_subjects_status ON subjects(status);
CREATE INDEX idx_drug_units_site ON drug_units(site_id);
CREATE INDEX idx_drug_units_status ON drug_units(status);
CREATE INDEX idx_subject_visits_subject ON subject_visits(subject_id);
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sites_updated_at BEFORE UPDATE ON sites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON subjects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subject_visits_updated_at BEFORE UPDATE ON subject_visits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drug_units_updated_at BEFORE UPDATE ON drug_units
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accountability_updated_at BEFORE UPDATE ON accountability
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
