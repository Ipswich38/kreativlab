-- Seed data for KreativLab CRM

-- Insert sample users with proper UUIDs
INSERT INTO users (id, email, name, role) VALUES
  (gen_random_uuid(), 'admin@kreativlab.com', 'Admin User', 'ADMIN'),
  (gen_random_uuid(), 'manager@kreativlab.com', 'Manager User', 'MANAGER'),
  (gen_random_uuid(), 'agent1@kreativlab.com', 'Agent One', 'AGENT'),
  (gen_random_uuid(), 'agent2@kreativlab.com', 'Agent Two', 'AGENT');

-- Insert sample dental practices with proper UUIDs
INSERT INTO practices (id, name, practice_type, address, phone, email, website, service_level) VALUES
  (gen_random_uuid(), 'Smile Dental Care', 'General Dentistry', '123 Main St, Anytown, ST 12345', '(555) 123-4567', 'info@smiledentalcare.com', 'https://smiledentalcare.com', 'PREMIUM'),
  (gen_random_uuid(), 'Family Dentistry Plus', 'Family Practice', '456 Oak Ave, Somewhere, ST 67890', '(555) 987-6543', 'contact@familydentistryplus.com', 'https://familydentistryplus.com', 'STANDARD'),
  (gen_random_uuid(), 'Advanced Oral Surgery', 'Oral Surgery', '789 Pine Rd, Elsewhere, ST 54321', '(555) 555-0123', 'scheduling@advancedoralsurgery.com', 'https://advancedoralsurgery.com', 'ENTERPRISE'),
  (gen_random_uuid(), 'Bright Smiles Orthodontics', 'Orthodontics', '321 Elm St, Nowhere, ST 98765', '(555) 444-5678', 'info@brightsmiles.com', 'https://brightsmiles.com', 'BASIC');

-- Insert contacts for practices (using first practice)
INSERT INTO contacts (practice_id, name, role, email, phone, is_primary)
SELECT p.id, 'Dr. Sarah Johnson', 'Lead Dentist', 'dr.johnson@smiledentalcare.com', '(555) 123-4567', true
FROM practices p WHERE p.name = 'Smile Dental Care'
UNION ALL
SELECT p.id, 'Maria Rodriguez', 'Office Manager', 'maria@smiledentalcare.com', '(555) 123-4568', false
FROM practices p WHERE p.name = 'Smile Dental Care'
UNION ALL
SELECT p.id, 'Dr. Michael Chen', 'Owner/Dentist', 'dr.chen@familydentistryplus.com', '(555) 987-6543', true
FROM practices p WHERE p.name = 'Family Dentistry Plus'
UNION ALL
SELECT p.id, 'Jennifer Kim', 'Dental Hygienist', 'jenny@familydentistryplus.com', '(555) 987-6544', false
FROM practices p WHERE p.name = 'Family Dentistry Plus'
UNION ALL
SELECT p.id, 'Dr. Robert Williams', 'Oral Surgeon', 'dr.williams@advancedoralsurgery.com', '(555) 555-0123', true
FROM practices p WHERE p.name = 'Advanced Oral Surgery'
UNION ALL
SELECT p.id, 'Lisa Thompson', 'Surgery Coordinator', 'lisa@advancedoralsurgery.com', '(555) 555-0124', false
FROM practices p WHERE p.name = 'Advanced Oral Surgery'
UNION ALL
SELECT p.id, 'Dr. Emily Davis', 'Orthodontist', 'dr.davis@brightsmiles.com', '(555) 444-5678', true
FROM practices p WHERE p.name = 'Bright Smiles Orthodontics';

-- Insert sample calls
INSERT INTO calls (practice_id, caller_name, caller_phone, call_type, purpose, notes, duration_minutes, handled_by)
SELECT p.id, 'John Smith', '(555) 111-2222', 'INBOUND', 'Appointment Scheduling', 'Patient wants to schedule cleaning for next week', 5, u.id
FROM practices p, users u
WHERE p.name = 'Smile Dental Care' AND u.email = 'agent1@kreativlab.com'
UNION ALL
SELECT p.id, 'Mary Wilson', '(555) 333-4444', 'INBOUND', 'Insurance Verification', 'Verified Delta Dental coverage', 8, u.id
FROM practices p, users u
WHERE p.name = 'Smile Dental Care' AND u.email = 'agent2@kreativlab.com'
UNION ALL
SELECT p.id, 'David Brown', '(555) 555-6666', 'INBOUND', 'Emergency Appointment', 'Patient has severe toothache, scheduled same day', 12, u.id
FROM practices p, users u
WHERE p.name = 'Family Dentistry Plus' AND u.email = 'agent1@kreativlab.com'
UNION ALL
SELECT p.id, 'Susan Garcia', '(555) 777-8888', 'OUTBOUND', 'Post-Surgery Follow-up', 'Checking on patient recovery after wisdom tooth extraction', 6, u.id
FROM practices p, users u
WHERE p.name = 'Advanced Oral Surgery' AND u.email = 'agent2@kreativlab.com';

-- Insert sample tickets
INSERT INTO tickets (practice_id, title, description, category, priority, status, assigned_to, created_by)
SELECT p.id, 'Insurance claim submission delay', 'Need help submitting claims to Delta Dental - system showing errors', 'INSURANCE', 'HIGH', 'OPEN', a.id, m.id
FROM practices p, users a, users m
WHERE p.name = 'Smile Dental Care' AND a.email = 'agent1@kreativlab.com' AND m.email = 'manager@kreativlab.com'
UNION ALL
SELECT p.id, 'Patient scheduling conflict', 'Double-booked appointment for Thursday 2 PM slot', 'SCHEDULING', 'MEDIUM', 'IN_PROGRESS', a.id, ag.id
FROM practices p, users a, users ag
WHERE p.name = 'Family Dentistry Plus' AND a.email = 'agent2@kreativlab.com' AND ag.email = 'agent1@kreativlab.com'
UNION ALL
SELECT p.id, 'Billing system integration', 'Need help connecting practice management software to billing system', 'TECHNICAL', 'HIGH', 'OPEN', null, m.id
FROM practices p, users m
WHERE p.name = 'Advanced Oral Surgery' AND m.email = 'manager@kreativlab.com'
UNION ALL
SELECT p.id, 'Monthly service review', 'Schedule review meeting for service performance', 'GENERAL', 'LOW', 'RESOLVED', m.id, ad.id
FROM practices p, users m, users ad
WHERE p.name = 'Bright Smiles Orthodontics' AND m.email = 'manager@kreativlab.com' AND ad.email = 'admin@kreativlab.com';

-- Insert sample billing records with proper date casting
INSERT INTO billing (practice_id, amount, description, due_date, status)
SELECT p.id, 2500.00, 'Monthly administrative support - Premium package', '2024-02-01'::date, 'PAID'
FROM practices p WHERE p.name = 'Smile Dental Care'
UNION ALL
SELECT p.id, 1500.00, 'Monthly administrative support - Standard package', '2024-02-01'::date, 'PENDING'
FROM practices p WHERE p.name = 'Family Dentistry Plus'
UNION ALL
SELECT p.id, 3500.00, 'Monthly administrative support - Enterprise package', '2024-02-01'::date, 'PAID'
FROM practices p WHERE p.name = 'Advanced Oral Surgery'
UNION ALL
SELECT p.id, 750.00, 'Monthly administrative support - Basic package', '2024-02-01'::date, 'OVERDUE'
FROM practices p WHERE p.name = 'Bright Smiles Orthodontics';

-- Insert sample insurance claims with proper date casting
INSERT INTO insurance_claims (practice_id, claim_number, patient_name, insurance_company, claim_amount, status, submission_date)
SELECT p.id, 'CLM-2024-001', 'John Smith', 'Delta Dental', 250.00, 'APPROVED', '2024-01-15'::date
FROM practices p WHERE p.name = 'Smile Dental Care'
UNION ALL
SELECT p.id, 'CLM-2024-002', 'Mary Wilson', 'Blue Cross Blue Shield', 180.00, 'PENDING', '2024-01-20'::date
FROM practices p WHERE p.name = 'Smile Dental Care'
UNION ALL
SELECT p.id, 'CLM-2024-003', 'David Brown', 'Aetna', 320.00, 'SUBMITTED', '2024-01-22'::date
FROM practices p WHERE p.name = 'Family Dentistry Plus'
UNION ALL
SELECT p.id, 'CLM-2024-004', 'Susan Garcia', 'MetLife', 850.00, 'PAID', '2024-01-10'::date
FROM practices p WHERE p.name = 'Advanced Oral Surgery';

-- Insert sample activities
INSERT INTO activities (practice_id, user_id, type, description, metadata)
SELECT p.id, u.id, 'CALL_LOGGED', 'Logged inbound call from John Smith', '{"duration": 5, "purpose": "Appointment Scheduling"}'::jsonb
FROM practices p, users u
WHERE p.name = 'Smile Dental Care' AND u.email = 'agent1@kreativlab.com'
UNION ALL
SELECT p.id, u.id, 'TICKET_CREATED', 'Created ticket for scheduling conflict', '{"priority": "MEDIUM"}'::jsonb
FROM practices p, users u
WHERE p.name = 'Family Dentistry Plus' AND u.email = 'agent2@kreativlab.com'
UNION ALL
SELECT p.id, u.id, 'PRACTICE_ADDED', 'Added new practice: Advanced Oral Surgery', '{"service_level": "ENTERPRISE"}'::jsonb
FROM practices p, users u
WHERE p.name = 'Advanced Oral Surgery' AND u.email = 'manager@kreativlab.com'
UNION ALL
SELECT null, u.id, 'USER_LOGIN', 'Admin user logged into system', '{"login_time": "2024-01-25T10:30:00Z"}'::jsonb
FROM users u WHERE u.email = 'admin@kreativlab.com';