-- User Preferences Table
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    preferences JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Doctor Schedule Blocks (for blocking time slots)
CREATE TABLE IF NOT EXISTS doctor_schedule_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    block_type VARCHAR(50) NOT NULL DEFAULT 'unavailable', -- unavailable, vacation, personal, meeting
    reason TEXT,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern JSONB, -- { type: 'weekly', days: [1,3,5], until: '2026-12-31' }
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_datetime_range CHECK (end_datetime > start_datetime)
);

CREATE INDEX IF NOT EXISTS idx_schedule_blocks_doctor ON doctor_schedule_blocks(doctor_id);
CREATE INDEX IF NOT EXISTS idx_schedule_blocks_datetime ON doctor_schedule_blocks(start_datetime, end_datetime);

-- Doctor Working Hours (regular schedule)
CREATE TABLE IF NOT EXISTS doctor_working_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    clinic_id UUID REFERENCES clinics(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_time_range CHECK (end_time > start_time),
    CONSTRAINT unique_doctor_day UNIQUE (doctor_id, day_of_week, clinic_id)
);

CREATE INDEX IF NOT EXISTS idx_working_hours_doctor ON doctor_working_hours(doctor_id);

-- Appointment Confirmations
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS confirmation_token UUID DEFAULT gen_random_uuid();
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS confirmation_sent_at TIMESTAMP WITH TIME ZONE;

-- Email Notifications Log
CREATE TABLE IF NOT EXISTS email_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255),
    notification_type VARCHAR(50) NOT NULL, -- appointment_created, appointment_reminder, appointment_confirmed, appointment_cancelled
    related_entity_type VARCHAR(50), -- appointment, consultation, etc.
    related_entity_id UUID,
    subject VARCHAR(500),
    status VARCHAR(20) DEFAULT 'pending', -- pending, sent, failed
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    resend_message_id VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_notifications_status ON email_notifications(status);
CREATE INDEX IF NOT EXISTS idx_email_notifications_type ON email_notifications(notification_type);
