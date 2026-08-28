-- ============================================================
-- Mandi Queue: Complete & Safe Supabase PostgreSQL Migration
-- ============================================================

-- ------------------------------------------------------------
-- STEP 1: Add Missing Columns to existing 'tokens' table
-- ------------------------------------------------------------
ALTER TABLE tokens ADD COLUMN IF NOT EXISTS estimated_time VARCHAR(100) DEFAULT '~20 mins';
ALTER TABLE tokens ADD COLUMN IF NOT EXISTS estimated_minutes INT DEFAULT 20;
ALTER TABLE tokens ADD COLUMN IF NOT EXISTS payment_method VARCHAR(100);

-- ------------------------------------------------------------
-- STEP 2: Create Missing Tables
-- ------------------------------------------------------------

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

-- 2. Farmers Table (L-4: Stores only last-4 digits of Aadhaar & Bank Account)
CREATE TABLE IF NOT EXISTS farmers (
    farmer_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    village VARCHAR(255) NOT NULL,
    district VARCHAR(100),
    aadhaar_last4 VARCHAR(4),
    bank_account_last4 VARCHAR(4),
    is_aadhaar_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE farmers DROP COLUMN IF EXISTS aadhaar_number;
ALTER TABLE farmers DROP COLUMN IF EXISTS bank_account_number;

-- 3. SMS Logs Table
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

-- ------------------------------------------------------------
-- STEP 3: Grant Schema & Table Privileges to anon & authenticated
-- (Required in PostgreSQL so PostgREST allows RLS evaluation)
-- ------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON public.centers TO anon, authenticated;
GRANT SELECT, INSERT ON public.farmers TO anon, authenticated;
GRANT SELECT, INSERT ON public.tokens TO anon, authenticated;
GRANT SELECT, INSERT ON public.sms_logs TO anon, authenticated;

-- ------------------------------------------------------------
-- STEP 4: Enable Row Level Security (RLS) on All 4 Tables
-- ------------------------------------------------------------
ALTER TABLE centers    ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmers    ENABLE ROW LEVEL SECURITY;
ALTER TABLE tokens     ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs   ENABLE ROW LEVEL SECURITY;

-- Drop all old / legacy policies on tokens
DROP POLICY IF EXISTS "allow_all_anon" ON tokens;
DROP POLICY IF EXISTS "anon_insert_tokens" ON tokens;
DROP POLICY IF EXISTS "anon_update_tokens" ON tokens;
DROP POLICY IF EXISTS "anon_select_tokens" ON tokens;

-- ------------------------------------------------------------
-- STEP 5: Centers RLS Policies (Read-Only for Anon)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "centers_select_anon" ON centers;
CREATE POLICY "centers_select_anon" ON centers 
    FOR SELECT TO anon USING (true);

-- ------------------------------------------------------------
-- STEP 6: Farmers RLS Policies & Column Grants
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "farmers_select_anon" ON farmers;
CREATE POLICY "farmers_select_anon" ON farmers 
    FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "farmers_insert_anon" ON farmers;
CREATE POLICY "farmers_insert_anon" ON farmers 
    FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "farmers_update_anon" ON farmers;
CREATE POLICY "farmers_update_anon" ON farmers 
    FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Restrict anon from modifying identity anchors
REVOKE UPDATE ON farmers FROM anon, authenticated;
GRANT UPDATE (name, village, district, aadhaar_last4, bank_account_last4, is_aadhaar_verified) 
    ON farmers TO anon, authenticated;

-- ------------------------------------------------------------
-- STEP 7: Tokens RLS Policies & Column Grants
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "tokens_select_anon" ON tokens;
CREATE POLICY "tokens_select_anon" ON tokens 
    FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "tokens_insert_anon" ON tokens;
CREATE POLICY "tokens_insert_anon" ON tokens 
    FOR INSERT TO anon WITH CHECK (
        status = 'Registered'
        AND payment_reference IS NULL
        AND payment_confirmed_at IS NULL
        AND (payment_method IS NULL OR payment_method = '')
        AND queue_position >= 1
    );

DROP POLICY IF EXISTS "tokens_update_anon" ON tokens;
CREATE POLICY "tokens_update_anon" ON tokens 
    FOR UPDATE TO anon USING (true) WITH CHECK (
        status IN ('Registered', 'In Queue', 'Quality Check', 'Procured', 'Rejected', 'Cancelled')
    );

-- Restrict anon from modifying immutable identity columns
REVOKE UPDATE ON tokens FROM anon, authenticated;
GRANT UPDATE (
    status, queue_position, estimated_time, estimated_minutes, quality_check_result,
    payment_amount, payment_method, payment_reference, payment_confirmed_at,
    status_history, updated_at
) ON tokens TO anon, authenticated;

-- ------------------------------------------------------------
-- STEP 8: SMS Logs RLS Policies
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "sms_logs_select_anon" ON sms_logs;
CREATE POLICY "sms_logs_select_anon" ON sms_logs 
    FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "sms_logs_insert_anon" ON sms_logs;
CREATE POLICY "sms_logs_insert_anon" ON sms_logs 
    FOR INSERT TO anon WITH CHECK (true);

-- ------------------------------------------------------------
-- STEP 9: Seed Initial Procurement Centers & Demo Farmers
-- ------------------------------------------------------------
INSERT INTO centers (center_id, name, location, district, state, slots, daily_capacity, current_load_quintals, active_tokens_count, avg_service_time_min, operational_status)
VALUES 
('c-rau', 'Rau Mandi Procurement Center', 'Rau Bypass, AB Road, Indore', 'Indore', 'Madhya Pradesh', '["07:00 AM - 09:00 AM", "09:00 AM - 11:00 AM", "11:00 AM - 01:00 PM", "02:00 PM - 04:00 PM", "04:00 PM - 06:00 PM"]'::jsonb, 500, 215, 6, 10, 'Active'),
('c-indore', 'Indore Main APMC Mandi (Chhawani)', 'APMC Yard, Chhawani, Indore', 'Indore', 'Madhya Pradesh', '["07:00 AM - 09:00 AM", "09:00 AM - 11:00 AM", "11:00 AM - 01:00 PM", "02:00 PM - 04:00 PM", "04:00 PM - 06:00 PM"]'::jsonb, 1200, 680, 14, 8, 'High Traffic'),
('c-ujjain', 'Ujjain Krishi Upaj Mandi', 'Agar Road, Industrial Area, Ujjain', 'Ujjain', 'Madhya Pradesh', '["07:00 AM - 09:00 AM", "09:00 AM - 11:00 AM", "11:00 AM - 01:00 PM", "02:00 PM - 04:00 PM"]'::jsonb, 750, 340, 8, 12, 'Active')
ON CONFLICT (center_id) DO NOTHING;

INSERT INTO farmers (farmer_id, name, phone, village, district, aadhaar_last4, bank_account_last4)
VALUES
('f-ramesh', 'Ramesh Kumar',     '9876543210', 'Rau Village', 'Indore', '7821', '4509'),
('f-suresh', 'Suresh Patel',     '9826012345', 'Rangwasa',    'Indore', '9912', '6612'),
('f-rajesh', 'Rajesh Verma',     '9425098765', 'Sanwer',      'Indore', '3487', '1190'),
('f-sunita', 'Sunita Bai',       '9893011223', 'Depalpur',    'Indore', '6541', '8823'),
('f-mohan',  'Mohan Lal Yadav',  '9755566778', 'Pithampur',   'Dhar',   '1234', '5432'),
('f-vikram', 'Vikram Singh',     '9111223344', 'Betma',       'Indore', '8765', '9081')
ON CONFLICT (farmer_id) DO NOTHING;
