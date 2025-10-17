-- Seed data for KreativLab CRM

-- Insert sample users
INSERT INTO users (id, email, name, role) VALUES
  ('user-admin-1', 'admin@kreativlab.com', 'Admin User', 'ADMIN'),
  ('user-manager-1', 'manager@kreativlab.com', 'Manager User', 'MANAGER'),
  ('user-agent-1', 'agent1@kreativlab.com', 'Agent One', 'AGENT'),
  ('user-agent-2', 'agent2@kreativlab.com', 'Agent Two', 'AGENT');

-- Insert sample dental practices
INSERT INTO practices (id, name, practice_type, address, phone, email, website, service_level) VALUES
  ('practice-1', 'Smile Dental Care', 'General Dentistry', '123 Main St, Anytown, ST 12345', '(555) 123-4567', 'info@smiledentalcare.com', 'https://smiledentalcare.com', 'PREMIUM'),
  ('practice-2', 'Family Dentistry Plus', 'Family Practice', '456 Oak Ave, Somewhere, ST 67890', '(555) 987-6543', 'contact@familydentistryplus.com', 'https://familydentistryplus.com', 'STANDARD'),
  ('practice-3', 'Advanced Oral Surgery', 'Oral Surgery', '789 Pine Rd, Elsewhere, ST 54321', '(555) 555-0123', 'scheduling@advancedoralsurgery.com', 'https://advancedoralsurgery.com', 'ENTERPRISE'),
  ('practice-4', 'Bright Smiles Orthodontics', 'Orthodontics', '321 Elm St, Nowhere, ST 98765', '(555) 444-5678', 'info@brightsmiles.com', 'https://brightsmiles.com', 'BASIC');

-- Insert contacts for practices
INSERT INTO contacts (practice_id, name, role, email, phone, is_primary) VALUES
  ('practice-1', 'Dr. Sarah Johnson', 'Lead Dentist', 'dr.johnson@smiledentalcare.com', '(555) 123-4567', true),
  ('practice-1', 'Maria Rodriguez', 'Office Manager', 'maria@smiledentalcare.com', '(555) 123-4568', false),
  ('practice-2', 'Dr. Michael Chen', 'Owner/Dentist', 'dr.chen@familydentistryplus.com', '(555) 987-6543', true),
  ('practice-2', 'Jennifer Kim', 'Dental Hygienist', 'jenny@familydentistryplus.com', '(555) 987-6544', false),
  ('practice-3', 'Dr. Robert Williams', 'Oral Surgeon', 'dr.williams@advancedoralsurgery.com', '(555) 555-0123', true),
  ('practice-3', 'Lisa Thompson', 'Surgery Coordinator', 'lisa@advancedoralsurgery.com', '(555) 555-0124', false),
  ('practice-4', 'Dr. Emily Davis', 'Orthodontist', 'dr.davis@brightsmiles.com', '(555) 444-5678', true);

-- Insert sample calls
INSERT INTO calls (practice_id, caller_name, caller_phone, call_type, purpose, notes, duration_minutes, handled_by) VALUES
  ('practice-1', 'John Smith', '(555) 111-2222', 'INBOUND', 'Appointment Scheduling', 'Patient wants to schedule cleaning for next week', 5, 'user-agent-1'),
  ('practice-1', 'Mary Wilson', '(555) 333-4444', 'INBOUND', 'Insurance Verification', 'Verified Delta Dental coverage', 8, 'user-agent-2'),
  ('practice-2', 'David Brown', '(555) 555-6666', 'INBOUND', 'Emergency Appointment', 'Patient has severe toothache, scheduled same day', 12, 'user-agent-1'),
  ('practice-3', 'Susan Garcia', '(555) 777-8888', 'OUTBOUND', 'Post-Surgery Follow-up', 'Checking on patient recovery after wisdom tooth extraction', 6, 'user-agent-2');

-- Insert sample tickets
INSERT INTO tickets (practice_id, title, description, category, priority, status, assigned_to, created_by) VALUES
  ('practice-1', 'Insurance claim submission delay', 'Need help submitting claims to Delta Dental - system showing errors', 'INSURANCE', 'HIGH', 'OPEN', 'user-agent-1', 'user-manager-1'),
  ('practice-2', 'Patient scheduling conflict', 'Double-booked appointment for Thursday 2 PM slot', 'SCHEDULING', 'MEDIUM', 'IN_PROGRESS', 'user-agent-2', 'user-agent-1'),
  ('practice-3', 'Billing system integration', 'Need help connecting practice management software to billing system', 'TECHNICAL', 'HIGH', 'OPEN', null, 'user-manager-1'),
  ('practice-4', 'Monthly service review', 'Schedule review meeting for service performance', 'GENERAL', 'LOW', 'RESOLVED', 'user-manager-1', 'user-admin-1');

-- Insert sample billing records
INSERT INTO billing (practice_id, amount, description, due_date, status) VALUES
  ('practice-1', 2500.00, 'Monthly administrative support - Premium package', '2024-02-01', 'PAID'),
  ('practice-2', 1500.00, 'Monthly administrative support - Standard package', '2024-02-01', 'PENDING'),
  ('practice-3', 3500.00, 'Monthly administrative support - Enterprise package', '2024-02-01', 'PAID'),
  ('practice-4', 750.00, 'Monthly administrative support - Basic package', '2024-02-01', 'OVERDUE');

-- Insert sample insurance claims
INSERT INTO insurance_claims (practice_id, claim_number, patient_name, insurance_company, claim_amount, status, submission_date) VALUES
  ('practice-1', 'CLM-2024-001', 'John Smith', 'Delta Dental', 250.00, 'APPROVED', '2024-01-15'),
  ('practice-1', 'CLM-2024-002', 'Mary Wilson', 'Blue Cross Blue Shield', 180.00, 'PENDING', '2024-01-20'),
  ('practice-2', 'CLM-2024-003', 'David Brown', 'Aetna', 320.00, 'SUBMITTED', '2024-01-22'),
  ('practice-3', 'CLM-2024-004', 'Susan Garcia', 'MetLife', 850.00, 'PAID', '2024-01-10');

-- Insert sample activities
INSERT INTO activities (practice_id, user_id, type, description, metadata) VALUES
  ('practice-1', 'user-agent-1', 'CALL_LOGGED', 'Logged inbound call from John Smith', '{"call_id": "call-1", "duration": 5, "purpose": "Appointment Scheduling"}'),
  ('practice-2', 'user-agent-2', 'TICKET_CREATED', 'Created ticket for scheduling conflict', '{"ticket_id": "ticket-2", "priority": "MEDIUM"}'),
  ('practice-3', 'user-manager-1', 'PRACTICE_ADDED', 'Added new practice: Advanced Oral Surgery', '{"practice_id": "practice-3", "service_level": "ENTERPRISE"}'),
  (null, 'user-admin-1', 'USER_LOGIN', 'Admin user logged into system', '{"login_time": "2024-01-25T10:30:00Z"}');