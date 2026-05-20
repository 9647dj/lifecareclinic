// Single shared Supabase client for the whole app.
// The anon key is intentionally public — Row Level Security (RLS) policies in
// Supabase enforce what each user can read or write; the key alone grants nothing.
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
