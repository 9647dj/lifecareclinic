-- Run this SQL in your Supabase SQL Editor to create the appointments table

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

-- Enable Row Level Security
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (booking)
CREATE POLICY "Allow public inserts"
  ON appointments FOR INSERT
  WITH CHECK (true);

-- Allow anyone to read (for admin page)
-- NOTE: For production, restrict this to authenticated admin users only
CREATE POLICY "Allow public reads"
  ON appointments FOR SELECT
  USING (true);

-- If the table already exists, run these to add the new columns:
-- ALTER TABLE appointments ADD COLUMN IF NOT EXISTS dob TEXT;
-- ALTER TABLE appointments ALTER COLUMN appointment_date DROP NOT NULL;
