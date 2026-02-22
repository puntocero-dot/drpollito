-- Lab Exams table for storing laboratory test results
CREATE TABLE IF NOT EXISTS lab_exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    consultation_id UUID REFERENCES consultations(id) ON DELETE SET NULL,
    exam_type VARCHAR(100) NOT NULL,
    exam_name VARCHAR(255) NOT NULL,
    exam_date DATE NOT NULL DEFAULT CURRENT_DATE,
    lab_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending', -- pending, completed, reviewed
    results JSONB,
    ai_interpretation TEXT,
    notes TEXT,
    file_url TEXT,
    file_type VARCHAR(50), -- image/jpeg, image/png, application/pdf
    file_name VARCHAR(255),
    created_by UUID REFERENCES users(id),
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_lab_exams_patient ON lab_exams(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_exams_consultation ON lab_exams(consultation_id);
CREATE INDEX IF NOT EXISTS idx_lab_exams_date ON lab_exams(exam_date DESC);

-- Common exam types for reference
COMMENT ON TABLE lab_exams IS 'Stores laboratory exam results with optional file attachments and AI interpretation';
