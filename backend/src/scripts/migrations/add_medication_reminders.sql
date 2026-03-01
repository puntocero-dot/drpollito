-- Medication Administration Logs
CREATE TABLE IF NOT EXISTS medication_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_item_id UUID NOT NULL REFERENCES prescription_items(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    administered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'taken', -- taken, missed, delayed
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_medication_logs_item ON medication_logs(prescription_item_id);
CREATE INDEX IF NOT EXISTS idx_medication_logs_patient ON medication_logs(patient_id);

-- Notification Settings for Parents/Users
CREATE TABLE IF NOT EXISTS notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    whatsapp_enabled BOOLEAN DEFAULT FALSE,
    email_enabled BOOLEAN DEFAULT TRUE,
    push_enabled BOOLEAN DEFAULT FALSE,
    reminder_lead_time_minutes INTEGER DEFAULT 15,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add tracking columns to prescription_items
ALTER TABLE prescription_items ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE prescription_items ADD COLUMN IF NOT EXISTS next_dose_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE prescription_items ADD COLUMN IF NOT EXISTS last_dose_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE prescription_items ADD COLUMN IF NOT EXISTS notification_enabled BOOLEAN DEFAULT TRUE;

-- Add doctorId tracking if missing in prescriptions (safety)
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS doctor_id UUID REFERENCES doctors(id);
