import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

const STAFF_KEY      = 'lcc_staff_authed';
const ADMIN_KEY      = 'lcc_admin_authed';
const STAFF_NAME_KEY = 'lcc_staff_name';
const STAFF_ROLE_KEY = 'lcc_staff_role';

export function AuthProvider({ children }) {
  const [user, setUser]           = useState(null);
  const [profile, setProfile]     = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setAuthLoading(false));
      } else {
        setAuthLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) await fetchProfile(session.user.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    setProfile(data ?? null);
  }

  async function signUp(email, password, profileData) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: profileData.full_name,
          mobile:    profileData.mobile,
          dob:       profileData.dob,
          address:   profileData.address,
        },
      },
    });
    if (error) throw error;
    return data;
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }

  async function updateProfile(updates) {
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id);
    if (error) throw error;
    setProfile((p) => ({ ...p, ...updates }));
  }

  // ── Staff / Admin (session-only, no Supabase auth) ──────────

  async function staffLogin(name, password) {
    const { data } = await supabase
      .from('staff_accounts')
      .select('id, full_name, role')
      .eq('full_name', name)
      .eq('password', password)
      .eq('is_active', true)
      .eq('role', 'staff')
      .maybeSingle();
    if (data) {
      sessionStorage.setItem(STAFF_KEY, '1');
      sessionStorage.setItem(STAFF_NAME_KEY, data.full_name);
      sessionStorage.setItem(STAFF_ROLE_KEY, 'staff');
      return true;
    }
    return false;
  }

  async function adminLogin(password) {
    const { data } = await supabase
      .from('staff_accounts')
      .select('id, full_name')
      .eq('password', password)
      .eq('role', 'admin')
      .eq('is_active', true)
      .maybeSingle();
    if (data) {
      sessionStorage.setItem(ADMIN_KEY, '1');
      sessionStorage.setItem(STAFF_NAME_KEY, data.full_name);
      sessionStorage.setItem(STAFF_ROLE_KEY, 'admin');
      return true;
    }
    return false;
  }

  function staffLogout() {
    sessionStorage.removeItem(STAFF_KEY);
    sessionStorage.removeItem(ADMIN_KEY);
    sessionStorage.removeItem(STAFF_NAME_KEY);
    sessionStorage.removeItem(STAFF_ROLE_KEY);
  }

  function getStaffRole() {
    return sessionStorage.getItem(STAFF_ROLE_KEY) || null;
  }

  function isStaffAuthed() {
    return (
      sessionStorage.getItem(STAFF_KEY) === '1' ||
      sessionStorage.getItem(ADMIN_KEY) === '1'
    );
  }

  function isAdminAuthed() {
    return sessionStorage.getItem(ADMIN_KEY) === '1';
  }

  function getStaffName() {
    return sessionStorage.getItem(STAFF_NAME_KEY) || '';
  }

  return (
    <AuthContext.Provider value={{
      user, profile, authLoading,
      signUp, signIn, signOut, updateProfile, fetchProfile,
      staffLogin, adminLogin, staffLogout,
      isStaffAuthed, isAdminAuthed, getStaffName, getStaffRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
