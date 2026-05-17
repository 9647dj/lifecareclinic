-- ============================================================
-- Life Care Clinic — Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- ── Appointments table ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_name      TEXT NOT NULL,
  specialty        TEXT NOT NULL,
  patient_name     TEXT NOT NULL,
  dob              TEXT,
  mobile           TEXT NOT NULL,
  address          TEXT NOT NULL,
  appointment_date DATE,
  appointment_time TEXT NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public inserts on appointments"
  ON appointments FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public reads on appointments"
  ON appointments FOR SELECT USING (true);

-- ── Callbacks table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS callbacks (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_name   TEXT NOT NULL,
  mobile         TEXT NOT NULL,
  preferred_time TEXT NOT NULL,
  status         TEXT DEFAULT 'pending',
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE callbacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public inserts on callbacks"
  ON callbacks FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public reads on callbacks"
  ON callbacks FOR SELECT USING (true);

-- Allows admin to mark callbacks as done
CREATE POLICY "Allow public updates on callbacks"
  ON callbacks FOR UPDATE USING (true);

-- ── Migration: add columns to existing appointments table ────
-- Run only if the table already existed:
-- ALTER TABLE appointments ADD COLUMN IF NOT EXISTS dob TEXT;
-- ALTER TABLE appointments ALTER COLUMN appointment_date DROP NOT NULL;
