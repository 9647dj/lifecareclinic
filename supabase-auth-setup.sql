-- ============================================================
-- Life Care Clinic — Auth & Profile Schema
-- Run this ONCE in your Supabase SQL Editor
-- ============================================================

-- ── Profiles table linked to auth.users ──────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id         UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name  TEXT,
  mobile     TEXT,
  dob        TEXT,
  address    TEXT,
  role       TEXT DEFAULT 'patient',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own profile"   ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
-- Staff/admin can read all profiles via anon key (public RLS bypass not needed since appointments are linked)

-- ── Auto-create profile row on signup (trigger) ───────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, mobile, dob, address, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'mobile',
    NEW.raw_user_meta_data->>'dob',
    NEW.raw_user_meta_data->>'address',
    'patient'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Add user_id + status columns to appointments ──────────────
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS status  TEXT DEFAULT 'upcoming';

-- Let patients view and cancel their own appointments
CREATE POLICY "Users view own appointments"
  ON appointments FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users update own appointments"
  ON appointments FOR UPDATE USING (auth.uid() = user_id);

-- Staff/admin update any appointment status (no Supabase auth on staff side)
CREATE POLICY "Allow public updates on appointments"
  ON appointments FOR UPDATE USING (true);

-- ── Clinic settings (staff password etc.) ─────────────────────
CREATE TABLE IF NOT EXISTS clinic_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE clinic_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read settings"   ON clinic_settings FOR SELECT USING (true);
CREATE POLICY "Public update settings" ON clinic_settings FOR UPDATE USING (true);

INSERT INTO clinic_settings (key, value)
VALUES ('staff_password', 'lifecare2024')
ON CONFLICT (key) DO NOTHING;

-- ── IMPORTANT ────────────────────────────────────────────────
-- In Supabase Dashboard → Authentication → Settings → Email Auth
-- Turn OFF "Confirm email" so patients can sign in immediately
-- ─────────────────────────────────────────────────────────────
