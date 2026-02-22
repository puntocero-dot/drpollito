-- My_Dr - Sistema de Gestión Médica Pediátrica
-- PostgreSQL Database Schema

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum Types
CREATE TYPE user_role AS ENUM ('admin', 'doctor', 'secretary', 'insurer', 'parent');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE gender AS ENUM ('male', 'female', 'other');
CREATE TYPE blood_type AS ENUM ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown');
CREATE TYPE appointment_status AS ENUM ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');
CREATE TYPE appointment_type AS ENUM ('first_visit', 'follow_up', 'emergency', 'vaccination', 'teleconsultation');
CREATE TYPE document_type AS ENUM ('prescription', 'medical_certificate', 'disability', 'referral', 'lab_order', 'health_certificate', 'vaccination_card');
CREATE TYPE consultation_status AS ENUM ('in_progress', 'completed', 'cancelled');

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Clinics
CREATE TABLE clinics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    logo_url TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users (all roles)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    status user_status DEFAULT 'active',
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    dui VARCHAR(20) UNIQUE,
    profile_image_url TEXT,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Doctors (extends users)
CREATE TABLE doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES clinics(id),
    medical_license VARCHAR(100) NOT NULL,
    specialty VARCHAR(100) DEFAULT 'Pediatría',
    consultation_duration_minutes INTEGER DEFAULT 30,
    signature_url TEXT,
    stamp_url TEXT,
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Secretaries (extends users)
CREATE TABLE secretaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Secretary-Clinic assignments (many-to-many)
CREATE TABLE secretary_clinics (
    secretary_id UUID REFERENCES secretaries(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    PRIMARY KEY (secretary_id, clinic_id)
);

-- Insurers (extends users)
CREATE TABLE insurers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    company_code VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Parents/Tutors (extends users)
CREATE TABLE parents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    address TEXT,
    occupation VARCHAR(100),
    relationship VARCHAR(50) DEFAULT 'parent',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- PATIENT MANAGEMENT
-- =====================================================

-- Patients (children)
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id),
    medical_record_number VARCHAR(50) UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender gender NOT NULL,
    blood_type blood_type DEFAULT 'unknown',
    
    -- Birth data
    birth_weight_grams INTEGER,
    birth_height_cm DECIMAL(5,2),
    apgar_1min INTEGER,
    apgar_5min INTEGER,
    gestational_weeks INTEGER,
    birth_notes TEXT,
    
    -- Critical info
    allergies TEXT[],
    chronic_conditions TEXT[],
    
    -- Insurance
    insurance_provider VARCHAR(255),
    insurance_policy_number VARCHAR(100),
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    profile_image_url TEXT,
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Patient-Parent relationship (many-to-many)
CREATE TABLE patient_parents (
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES parents(id) ON DELETE CASCADE,
    relationship VARCHAR(50) DEFAULT 'parent',
    is_primary_contact BOOLEAN DEFAULT FALSE,
    can_authorize_treatment BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (patient_id, parent_id)
);

-- Emergency contacts
CREATE TABLE emergency_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    relationship VARCHAR(50),
    phone VARCHAR(50) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- APPOINTMENTS
-- =====================================================

CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id),
    doctor_id UUID REFERENCES doctors(id),
    patient_id UUID REFERENCES patients(id),
    parent_id UUID REFERENCES parents(id),
    
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    
    type appointment_type DEFAULT 'follow_up',
    status appointment_status DEFAULT 'scheduled',
    
    reason TEXT,
    pre_visit_instructions TEXT,
    notes TEXT,
    
    -- Reminders tracking
    reminder_24h_sent BOOLEAN DEFAULT FALSE,
    reminder_2h_sent BOOLEAN DEFAULT FALSE,
    confirmed_at TIMESTAMP,
    checked_in_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Waiting list
CREATE TABLE waiting_list (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id),
    doctor_id UUID REFERENCES doctors(id),
    patient_id UUID REFERENCES patients(id),
    preferred_dates DATE[],
    preferred_times TEXT,
    urgency INTEGER DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Doctor schedule blocks
CREATE TABLE schedule_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
    day_of_week INTEGER, -- 0=Sunday, 6=Saturday
    start_time TIME,
    end_time TIME,
    is_available BOOLEAN DEFAULT TRUE,
    block_reason TEXT,
    specific_date DATE, -- For one-time blocks
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- MEDICAL HISTORY
-- =====================================================

-- Consultations (visits)
CREATE TABLE consultations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID REFERENCES appointments(id),
    patient_id UUID NOT NULL REFERENCES patients(id),
    doctor_id UUID NOT NULL REFERENCES doctors(id),
    clinic_id UUID REFERENCES clinics(id),
    
    consultation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status consultation_status DEFAULT 'in_progress',
    
    -- Chief complaint
    reason_for_visit TEXT,
    symptoms TEXT,
    symptom_duration TEXT,
    
    -- Vitals
    weight_kg DECIMAL(5,2),
    height_cm DECIMAL(5,2),
    head_circumference_cm DECIMAL(5,2),
    temperature_celsius DECIMAL(4,2),
    heart_rate_bpm INTEGER,
    respiratory_rate INTEGER,
    blood_pressure_systolic INTEGER,
    blood_pressure_diastolic INTEGER,
    oxygen_saturation INTEGER,
    
    -- Calculated
    bmi DECIMAL(5,2),
    
    -- Physical exam
    physical_exam JSONB DEFAULT '{}',
    -- Structure: { "general": "", "head": "", "eyes": "", "ears": "", "nose": "", "throat": "", "neck": "", "chest": "", "heart": "", "abdomen": "", "extremities": "", "skin": "", "neurological": "" }
    
    -- Assessment
    diagnosis_codes TEXT[], -- CIE-10 codes
    diagnosis_descriptions TEXT[],
    differential_diagnoses TEXT[],
    
    -- Plan
    treatment_plan TEXT,
    follow_up_instructions TEXT,
    next_appointment_suggested DATE,
    
    -- AI assistance
    ai_suggestions JSONB DEFAULT '{}',
    -- Structure: { "differential_diagnoses": [], "recommended_questions": [], "recommended_tests": [], "alerts": [], "red_flags": [] }
    
    -- Notes
    private_notes TEXT, -- Only visible to doctor
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Prescriptions
CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultation_id UUID REFERENCES consultations(id),
    patient_id UUID NOT NULL REFERENCES patients(id),
    doctor_id UUID NOT NULL REFERENCES doctors(id),
    
    prescription_date DATE DEFAULT CURRENT_DATE,
    valid_until DATE,
    
    notes TEXT,
    document_url TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Prescription items (medications)
CREATE TABLE prescription_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_id UUID REFERENCES prescriptions(id) ON DELETE CASCADE,
    
    medication_name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    
    dose VARCHAR(100) NOT NULL,
    dose_unit VARCHAR(50),
    calculated_dose_mg DECIMAL(10,2),
    
    route VARCHAR(50), -- oral, IV, IM, topical, etc.
    frequency VARCHAR(100), -- every 8 hours, twice daily, etc.
    duration VARCHAR(100), -- 7 days, 2 weeks, etc.
    
    quantity INTEGER,
    instructions TEXT,
    
    -- Safety
    interaction_warnings TEXT[],
    allergy_warnings TEXT[],
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lab orders
CREATE TABLE lab_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultation_id UUID REFERENCES consultations(id),
    patient_id UUID NOT NULL REFERENCES patients(id),
    doctor_id UUID NOT NULL REFERENCES doctors(id),
    
    order_date DATE DEFAULT CURRENT_DATE,
    tests_requested TEXT[],
    clinical_indication TEXT,
    urgency VARCHAR(50) DEFAULT 'routine',
    fasting_required BOOLEAN DEFAULT FALSE,
    special_instructions TEXT,
    
    document_url TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lab results
CREATE TABLE lab_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lab_order_id UUID REFERENCES lab_orders(id),
    patient_id UUID NOT NULL REFERENCES patients(id),
    
    result_date DATE,
    lab_name VARCHAR(255),
    
    results JSONB DEFAULT '{}',
    -- Structure: { "test_name": { "value": "", "unit": "", "reference_range": "", "is_abnormal": false } }
    
    result_file_url TEXT,
    notes TEXT,
    reviewed_by UUID REFERENCES doctors(id),
    reviewed_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- VACCINATIONS
-- =====================================================

-- Vaccine catalog
CREATE TABLE vaccines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    abbreviation VARCHAR(50),
    disease_prevented TEXT[],
    recommended_ages_months INTEGER[],
    dose_number INTEGER,
    route VARCHAR(50),
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Patient vaccinations
CREATE TABLE patient_vaccinations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    vaccine_id UUID REFERENCES vaccines(id),
    
    dose_number INTEGER DEFAULT 1,
    administration_date DATE NOT NULL,
    
    lot_number VARCHAR(100),
    manufacturer VARCHAR(255),
    expiration_date DATE,
    
    site VARCHAR(100), -- left arm, right thigh, etc.
    administered_by UUID REFERENCES users(id),
    
    reaction_notes TEXT,
    next_dose_due DATE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- DOCUMENTS
-- =====================================================

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id),
    consultation_id UUID REFERENCES consultations(id),
    doctor_id UUID REFERENCES doctors(id),
    
    type document_type NOT NULL,
    title VARCHAR(255),
    content JSONB DEFAULT '{}',
    
    file_url TEXT,
    qr_verification_code VARCHAR(100) UNIQUE,
    
    sent_to_email VARCHAR(255),
    sent_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Document templates
CREATE TABLE document_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id),
    type document_type NOT NULL,
    name VARCHAR(255) NOT NULL,
    content_template TEXT NOT NULL,
    variables TEXT[], -- placeholders like {{patient_name}}, {{date}}
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- BILLING
-- =====================================================

-- Services catalog
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    duration_minutes INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoices
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id),
    patient_id UUID REFERENCES patients(id),
    consultation_id UUID REFERENCES consultations(id),
    
    invoice_number VARCHAR(50) UNIQUE,
    invoice_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    
    subtotal DECIMAL(10,2),
    tax DECIMAL(10,2) DEFAULT 0,
    discount DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2),
    
    status VARCHAR(50) DEFAULT 'pending', -- pending, paid, cancelled
    payment_method VARCHAR(50),
    paid_at TIMESTAMP,
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoice items
CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id),
    description VARCHAR(255),
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2),
    total DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insurance claims
CREATE TABLE insurance_claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id),
    insurer_id UUID REFERENCES insurers(id),
    
    claim_number VARCHAR(100),
    claim_date DATE DEFAULT CURRENT_DATE,
    
    amount_claimed DECIMAL(10,2),
    amount_approved DECIMAL(10,2),
    
    status VARCHAR(50) DEFAULT 'submitted', -- submitted, approved, rejected, paid
    rejection_reason TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- AUDIT & LOGS
-- =====================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    type VARCHAR(100),
    title VARCHAR(255),
    message TEXT,
    data JSONB DEFAULT '{}',
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- GROWTH CHARTS DATA
-- =====================================================

CREATE TABLE growth_measurements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    consultation_id UUID REFERENCES consultations(id),
    measurement_date DATE NOT NULL,
    age_months DECIMAL(5,2),
    weight_kg DECIMAL(5,2),
    height_cm DECIMAL(5,2),
    head_circumference_cm DECIMAL(5,2),
    bmi DECIMAL(5,2),
    weight_percentile DECIMAL(5,2),
    height_percentile DECIMAL(5,2),
    bmi_percentile DECIMAL(5,2),
    head_percentile DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_dui ON users(dui);

CREATE INDEX idx_patients_clinic ON patients(clinic_id);
CREATE INDEX idx_patients_dob ON patients(date_of_birth);
CREATE INDEX idx_patients_name ON patients(last_name, first_name);

CREATE INDEX idx_appointments_date ON appointments(scheduled_date);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_status ON appointments(status);

CREATE INDEX idx_consultations_patient ON consultations(patient_id);
CREATE INDEX idx_consultations_doctor ON consultations(doctor_id);
CREATE INDEX idx_consultations_date ON consultations(consultation_date);

CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX idx_vaccinations_patient ON patient_vaccinations(patient_id);
CREATE INDEX idx_documents_patient ON documents(patient_id);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- =====================================================
-- SEED DATA
-- =====================================================

-- Default clinic
INSERT INTO clinics (id, name, address, phone, email) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Clínica Pediátrica Central', 'Col. Escalón, San Salvador', '2222-3333', 'contacto@clinicapediatrica.com');

-- Admin user (password: 123456)
INSERT INTO users (id, email, password_hash, role, first_name, last_name, phone) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'admin@mydr.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.Q7cfxe0SZGQB8dG9Km', 'admin', 'Admin', 'Sistema', '7777-0001');

-- Doctor user (password: 123456)
INSERT INTO users (id, email, password_hash, role, first_name, last_name, phone) VALUES
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'doctor@mydr.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.Q7cfxe0SZGQB8dG9Km', 'doctor', 'María', 'González', '7777-0002');

INSERT INTO doctors (id, user_id, clinic_id, medical_license, specialty) VALUES
    ('d1111111-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111', 'JVPM-12345', 'Pediatría General');

-- Secretary user (password: 123456)
INSERT INTO users (id, email, password_hash, role, first_name, last_name, phone) VALUES
    ('ssssssss-ssss-ssss-ssss-ssssssssssss', 'secretaria@mydr.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.Q7cfxe0SZGQB8dG9Km', 'secretary', 'Ana', 'Martínez', '7777-0003');

INSERT INTO secretaries (id, user_id) VALUES
    ('s1111111-1111-1111-1111-111111111111', 'ssssssss-ssss-ssss-ssss-ssssssssssss');

INSERT INTO secretary_clinics (secretary_id, clinic_id) VALUES
    ('s1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111');

-- National vaccination schedule (El Salvador)
INSERT INTO vaccines (name, abbreviation, disease_prevented, recommended_ages_months, dose_number) VALUES
    ('BCG', 'BCG', ARRAY['Tuberculosis'], ARRAY[0], 1),
    ('Hepatitis B', 'HepB', ARRAY['Hepatitis B'], ARRAY[0, 2, 6], 1),
    ('Pentavalente', 'DPT-HepB-Hib', ARRAY['Difteria', 'Tétanos', 'Tos ferina', 'Hepatitis B', 'Haemophilus influenzae'], ARRAY[2, 4, 6], 1),
    ('Polio Oral', 'OPV', ARRAY['Poliomielitis'], ARRAY[2, 4, 6, 18], 1),
    ('Rotavirus', 'RV', ARRAY['Gastroenteritis por rotavirus'], ARRAY[2, 4], 1),
    ('Neumococo', 'PCV13', ARRAY['Neumonía', 'Meningitis'], ARRAY[2, 4, 12], 1),
    ('Influenza', 'Flu', ARRAY['Influenza'], ARRAY[6, 12, 24, 36, 48, 60], 1),
    ('SRP', 'MMR', ARRAY['Sarampión', 'Rubéola', 'Parotiditis'], ARRAY[12, 48], 1),
    ('Varicela', 'VAR', ARRAY['Varicela'], ARRAY[12], 1),
    ('DPT Refuerzo', 'DPT', ARRAY['Difteria', 'Tétanos', 'Tos ferina'], ARRAY[18, 48], 1);

-- Default services
INSERT INTO services (clinic_id, name, description, price, duration_minutes) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Consulta Primera Vez', 'Consulta pediátrica inicial', 35.00, 45),
    ('11111111-1111-1111-1111-111111111111', 'Consulta de Control', 'Consulta de seguimiento', 25.00, 30),
    ('11111111-1111-1111-1111-111111111111', 'Consulta de Urgencia', 'Atención de urgencia pediátrica', 45.00, 30),
    ('11111111-1111-1111-1111-111111111111', 'Vacunación', 'Aplicación de vacuna (no incluye vacuna)', 10.00, 15),
    ('11111111-1111-1111-1111-111111111111', 'Teleconsulta', 'Consulta virtual', 20.00, 20);
