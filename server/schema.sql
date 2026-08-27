-- Mandi Queue Database Schema for Supabase PostgreSQL

-- 1. Centers Table
CREATE TABLE IF NOT EXISTS centers (
    center_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    slots JSONB NOT NULL,
    daily_capacity INT NOT NULL DEFAULT 500,
    current_load_quintals INT NOT NULL DEFAULT 0,
    active_tokens_count INT NOT NULL DEFAULT 0,
    avg_service_time_min INT NOT NULL DEFAULT 10,
    operational_status VARCHAR(50) NOT NULL DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Farmers Table
CREATE TABLE IF NOT EXISTS farmers (
    farmer_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    village VARCHAR(255) NOT NULL,
    district VARCHAR(100),
    aadhaar_last4 VARCHAR(4),
    aadhaar_number VARCHAR(20),
    bank_account_last4 VARCHAR(4),
    bank_account_number VARCHAR(50),
    is_aadhaar_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tokens Table
CREATE TABLE IF NOT EXISTS tokens (
    token_id VARCHAR(50) PRIMARY KEY,
    farmer_id VARCHAR(50) REFERENCES farmers(farmer_id) ON DELETE SET NULL,
    farmer_name VARCHAR(255) NOT NULL,
    farmer_phone VARCHAR(20) NOT NULL,
    farmer_village VARCHAR(255) NOT NULL,
    center_id VARCHAR(50) REFERENCES centers(center_id) ON DELETE CASCADE,
    center_name VARCHAR(255) NOT NULL,
    crop VARCHAR(100) NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL,
    msp_rate NUMERIC(10, 2) NOT NULL,
    preferred_slot VARCHAR(100) NOT NULL,
    token_number VARCHAR(50) NOT NULL,
    queue_position INT NOT NULL DEFAULT 1,
    estimated_time VARCHAR(100) NOT NULL DEFAULT '~20 mins',
    estimated_minutes INT NOT NULL DEFAULT 20,
    status VARCHAR(50) NOT NULL DEFAULT 'Registered',
    quality_check_result JSONB,
    payment_amount NUMERIC(12, 2) NOT NULL,
    payment_method VARCHAR(100),
    payment_reference VARCHAR(100),
    payment_confirmed_at TIMESTAMPTZ,
    status_history JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SMS Logs Table
CREATE TABLE IF NOT EXISTS sms_logs (
    id VARCHAR(100) PRIMARY KEY,
    token_id VARCHAR(50),
    phone VARCHAR(20) NOT NULL,
    farmer_name VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    message_hi TEXT,
    trigger_event VARCHAR(100) NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(50) NOT NULL DEFAULT 'Delivered'
);

-- Disable Row Level Security (RLS) for public access via server backend API, or enable permissive policies
ALTER TABLE centers DISABLE ROW LEVEL SECURITY;
ALTER TABLE farmers DISABLE ROW LEVEL SECURITY;
ALTER TABLE tokens DISABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs DISABLE ROW LEVEL SECURITY;

-- Initial Seed Data
INSERT INTO centers (center_id, name, location, district, state, slots, daily_capacity, current_load_quintals, active_tokens_count, avg_service_time_min, operational_status)
VALUES 
('c-rau', 'Rau Mandi Procurement Center', 'Rau Bypass, AB Road, Indore', 'Indore', 'Madhya Pradesh', '["07:00 AM - 09:00 AM", "09:00 AM - 11:00 AM", "11:00 AM - 01:00 PM", "02:00 PM - 04:00 PM", "04:00 PM - 06:00 PM"]'::jsonb, 500, 215, 6, 10, 'Active'),
('c-indore', 'Indore Main APMC Mandi (Chhawani)', 'APMC Yard, Chhawani, Indore', 'Indore', 'Madhya Pradesh', '["07:00 AM - 09:00 AM", "09:00 AM - 11:00 AM", "11:00 AM - 01:00 PM", "02:00 PM - 04:00 PM", "04:00 PM - 06:00 PM"]'::jsonb, 1200, 680, 14, 8, 'High Traffic'),
('c-ujjain', 'Ujjain Krishi Upaj Mandi', 'Agar Road, Industrial Area, Ujjain', 'Ujjain', 'Madhya Pradesh', '["07:00 AM - 09:00 AM", "09:00 AM - 11:00 AM", "11:00 AM - 01:00 PM", "02:00 PM - 04:00 PM"]'::jsonb, 750, 340, 8, 12, 'Active')
ON CONFLICT (center_id) DO NOTHING;

INSERT INTO farmers (farmer_id, name, phone, village, district, aadhaar_last4, bank_account_last4)
VALUES
('f-ramesh', 'Ramesh Kumar', '9876543210', 'Rau Village', 'Indore', '7821', '4509'),
('f-suresh', 'Suresh Patel', '9826012345', 'Rangwasa', 'Indore', '9912', '6612'),
('f-rajesh', 'Rajesh Verma', '9425098765', 'Sanwer', 'Indore', '3487', '1190'),
('f-sunita', 'Sunita Bai', '9893011223', 'Depalpur', 'Indore', '6541', '8823'),
('f-mohan', 'Mohan Lal Yadav', '9755566778', 'Pithampur', 'Dhar', '1234', '5432'),
('f-vikram', 'Vikram Singh', '9111223344', 'Betma', 'Indore', '8765', '9081')
ON CONFLICT (farmer_id) DO NOTHING;
