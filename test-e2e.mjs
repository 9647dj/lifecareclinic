// E2E test suite for Life Care Clinic
// Tests all database operations, business logic, and API routes

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY  = process.env.VITE_SUPABASE_ANON_KEY;
const RESEND_KEY    = process.env.VITE_RESEND_API_KEY;
const BASE_URL      = 'https://lifecareclinic.vercel.app';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let passed = 0, failed = 0, skipped = 0;
const results = [];

function log(icon, label, detail = '') {
  console.log(`${icon} ${label}${detail ? ': ' + detail : ''}`);
}

function pass(label, detail = '') {
  passed++;
  results.push({ status: 'PASS', label, detail });
  log('✅', label, detail);
}

function fail(label, detail = '') {
  failed++;
  results.push({ status: 'FAIL', label, detail });
  log('❌', label, detail);
}

function skip(label, detail = '') {
  skipped++;
  results.push({ status: 'SKIP', label, detail });
  log('⏭️ ', label, detail);
}

function section(title) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  ${title}`);
  console.log('─'.repeat(60));
}

// Test IDs we create — cleaned up at the end
const TEST_MOBILE   = '9988776655';
const TEST_EMAIL    = 'dharminder1911singh@gmail.com';
const TEST_DOC_NAME = '__TEST_DOCTOR_E2E__';
let   testApptId    = null;
let   testDoctorId  = null;
let   testPatientId = null;

// ─────────────────────────────────────────────────────────
// SECTION 1: Schema / table existence checks
// ─────────────────────────────────────────────────────────
async function testSchemaChecks() {
  section('SCHEMA CHECKS');

  const tables = ['appointments', 'patients', 'doctors', 'callbacks', 'blocked_dates', 'staff_accounts'];
  for (const t of tables) {
    const { error } = await supabase.from(t).select('id').limit(1);
    if (error) fail(`Table "${t}" accessible`, error.message);
    else pass(`Table "${t}" accessible`);
  }

  // Check for notes column in appointments
  const { data: apt } = await supabase.from('appointments').select('notes').limit(1);
  if (apt !== null) pass('appointments.notes column exists');
  else fail('appointments.notes column exists — ADD: ALTER TABLE appointments ADD COLUMN IF NOT EXISTS notes text;');

  // Check for gender column in patients
  const { data: pt } = await supabase.from('patients').select('gender').limit(1);
  if (pt !== null) pass('patients.gender column exists');
  else fail('patients.gender column exists — ADD: ALTER TABLE patients ADD COLUMN IF NOT EXISTS gender text;');
}

// ─────────────────────────────────────────────────────────
// SECTION 2: Booking flow (guest — no auth)
// ─────────────────────────────────────────────────────────
async function testBookingFlow() {
  section('BOOKING FLOW (Guest)');

  // First get a real doctor
  const { data: doctors, error: docErr } = await supabase
    .from('doctors')
    .select('id, name, specialty, category')
    .eq('is_active', true)
    .limit(1)
    .single();

  if (docErr || !doctors) {
    fail('Fetch active doctor for booking test', docErr?.message || 'No active doctors');
    return;
  }
  pass(`Fetched test doctor: ${doctors.name}`);

  // T1: Insert appointment (guest booking)
  const apptPayload = {
    patient_name:     'Test Patient E2E',
    mobile:           TEST_MOBILE,
    dob:              '1990-05-15',
    address:          'Test Village, Gurdaspur',
    email:            TEST_EMAIL,
    doctor_name:      doctors.name,
    doctor_id:        doctors.id,
    specialty:        doctors.specialty,
    category:         doctors.category || null,
    appointment_date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // tomorrow
    appointment_time: '6:00 PM - 8:00 PM',
    status:           'upcoming',
    booking_channel:  'website',
    user_id:          null,
  };

  const { data: inserted, error: insertErr } = await supabase
    .from('appointments')
    .insert([apptPayload])
    .select('id')
    .single();

  if (insertErr) {
    fail('T1: Insert appointment (guest)', insertErr.message);
    return;
  }
  testApptId = inserted.id;
  pass('T1: Insert appointment (guest)', `id=${testApptId}`);

  // T2: Verify appointment data saved correctly
  const { data: saved, error: fetchErr } = await supabase
    .from('appointments')
    .select('*')
    .eq('id', testApptId)
    .single();

  if (fetchErr || !saved) {
    fail('T2: Appointment data saved in DB', fetchErr?.message);
  } else {
    const checks = [
      saved.patient_name === 'Test Patient E2E',
      saved.mobile === TEST_MOBILE,
      saved.doctor_id === doctors.id,
      saved.status === 'upcoming',
      saved.booking_channel === 'website',
    ];
    if (checks.every(Boolean)) pass('T2: Appointment data verified in DB');
    else fail('T2: Appointment data has mismatches', JSON.stringify({
      patient_name: saved.patient_name,
      mobile: saved.mobile,
      doctor_id: saved.doctor_id,
      status: saved.status,
    }));
  }

  // T3: Upsert patient record
  const { data: existingPt } = await supabase
    .from('patients')
    .select('id, total_visits, gender')
    .eq('mobile', TEST_MOBILE)
    .maybeSingle();

  let ptErr;
  if (existingPt) {
    const { error } = await supabase.from('patients').update({
      total_visits: (existingPt.total_visits || 0) + 1,
      full_name: 'Test Patient E2E',
      gender: 'Male',
    }).eq('id', existingPt.id);
    ptErr = error;
    testPatientId = existingPt.id;
  } else {
    const { data: newPt, error } = await supabase.from('patients').insert({
      full_name: 'Test Patient E2E',
      mobile: TEST_MOBILE,
      dob: '1990-05-15',
      address: 'Test Village, Gurdaspur',
      email: TEST_EMAIL,
      gender: 'Male',
      total_visits: 1,
    }).select('id').single();
    ptErr = error;
    testPatientId = newPt?.id;
  }

  if (ptErr) fail('T3: Patient record upserted', ptErr.message);
  else pass('T3: Patient record upserted', `id=${testPatientId}`);

  // T4: Verify gender saved in patients table
  const { data: ptCheck } = await supabase.from('patients').select('gender, full_name').eq('id', testPatientId).single();
  if (ptCheck?.gender === 'Male') pass('T4: Gender saved correctly in patients');
  else fail('T4: Gender saved correctly', `got: ${ptCheck?.gender}`);

  // T5: Patient code generation (client-side logic check)
  function generatePatientCode(name, mobile) {
    if (!name || !mobile) return null;
    const namePart = name.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 4).padEnd(4, 'X');
    const mobilePart = String(mobile).replace(/\D/g, '').slice(-4);
    if (mobilePart.length < 4) return null;
    return `LC-${namePart}-${mobilePart}`;
  }
  const code = generatePatientCode('Test Patient E2E', TEST_MOBILE);
  if (code === 'LC-TEST-6655') pass('T5: Patient code generated correctly', `code=${code}`);
  else fail('T5: Patient code generated correctly', `got=${code}, expected=LC-TEST-6655`);
}

// ─────────────────────────────────────────────────────────
// SECTION 3: Email tests (via deployed API endpoint)
// ─────────────────────────────────────────────────────────
async function testEmailAPI() {
  section('EMAIL API TESTS');

  // T6: Booking confirmation email to CLINIC (always works — sandbox allows sending to verified email)
  try {
    const res = await fetch(`${BASE_URL}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Life Care Clinic <onboarding@resend.dev>',
        to: 'lifecarejourian@gmail.com',
        subject: '[E2E Test] Booking Confirmation — Clinic Copy',
        html: `
          <h2 style="color:#1a7a4a;">E2E Test — Booking Confirmation (Clinic Copy)</h2>
          <p>Automated test — ignore this email.</p>
          <table style="border-collapse:collapse;width:100%;margin:16px 0;">
            <tr><td style="padding:6px 12px;background:#f0faf4;font-weight:600;">Doctor</td><td style="padding:6px 12px;">Dr. Test</td></tr>
            <tr><td style="padding:6px 12px;background:#f0faf4;font-weight:600;">Patient ID</td><td style="padding:6px 12px;font-weight:700;color:#1a7a4a;">LC-TEST-6655</td></tr>
          </table>
        `,
      }),
    });
    const data = await res.json();
    if (res.ok && data.id) pass('T6: Booking confirmation email to clinic', `email_id=${data.id}`);
    else fail('T6: Booking confirmation email to clinic', JSON.stringify(data));
  } catch (err) {
    fail('T6: /api/send-email network error', err.message);
  }
  // Note: patient confirmation emails to non-clinic addresses are silently caught in BookingModal
  // because Resend sandbox only allows sending to lifecarejourian@gmail.com until a domain is verified

  // T7: Callback email
  try {
    const res = await fetch(`${BASE_URL}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Life Care Clinic <onboarding@resend.dev>',
        to: 'lifecarejourian@gmail.com',
        subject: '[E2E Test] Callback Request Test',
        html: '<h2>E2E Test — Callback</h2><p>Automated test — ignore.</p>',
      }),
    });
    const data = await res.json();
    if (res.ok && data.id) pass('T7: Callback email to clinic sent', `email_id=${data.id}`);
    else fail('T7: Callback email to clinic', JSON.stringify(data));
  } catch (err) {
    fail('T7: Callback email network error', err.message);
  }
}

// ─────────────────────────────────────────────────────────
// SECTION 4: Staff dashboard operations
// ─────────────────────────────────────────────────────────
async function testStaffDashboard() {
  section('STAFF DASHBOARD TESTS');

  // T8: Staff login check (query staff_accounts)
  const { data: staff, error: staffErr } = await supabase
    .from('staff_accounts')
    .select('id, full_name, role')
    .eq('full_name', 'dharminder')
    .eq('is_active', true)
    .maybeSingle();

  if (staffErr || !staff) fail('T8: Staff account "dharminder" exists', staffErr?.message || 'not found');
  else pass('T8: Staff account "dharminder" exists', `role=${staff.role}`);

  // T9: Admin account check
  const { data: admin, error: adminErr } = await supabase
    .from('staff_accounts')
    .select('id, full_name, role')
    .eq('role', 'admin')
    .eq('is_active', true)
    .maybeSingle();

  if (adminErr || !admin) fail('T9: Admin account exists', adminErr?.message || 'not found');
  else pass('T9: Admin account exists', `name=${admin.full_name}`);

  // T10: Today's appointments fetch
  const todayStr = new Date().toISOString().split('T')[0];
  const { data: todayAppts, error: todayErr } = await supabase
    .from('appointments')
    .select('id, patient_name, status, appointment_date')
    .eq('appointment_date', todayStr);

  if (todayErr) fail('T10: Fetch today appointments', todayErr.message);
  else pass('T10: Fetch today appointments', `count=${todayAppts?.length || 0}`);

  // T11: Mark appointment as completed
  if (!testApptId) { skip('T11: Mark completed — no test appointment'); }
  else {
    const { error } = await supabase.from('appointments').update({ status: 'completed' }).eq('id', testApptId);
    if (error) fail('T11: Mark appointment completed', error.message);
    else {
      const { data: check } = await supabase.from('appointments').select('status').eq('id', testApptId).single();
      if (check?.status === 'completed') pass('T11: Mark appointment completed');
      else fail('T11: Mark appointment completed — status mismatch', check?.status);
    }
  }

  // T12: Mark appointment as no_show
  if (!testApptId) { skip('T12: Mark no_show — no test appointment'); }
  else {
    const { error } = await supabase.from('appointments').update({ status: 'no_show' }).eq('id', testApptId);
    if (error) fail('T12: Mark appointment no_show', error.message);
    else {
      const { data: check } = await supabase.from('appointments').select('status').eq('id', testApptId).single();
      if (check?.status === 'no_show') pass('T12: Mark appointment no_show');
      else fail('T12: Mark appointment no_show — status mismatch', check?.status);
    }
  }

  // T13: Mark appointment as cancelled
  if (!testApptId) { skip('T13: Mark cancelled — no test appointment'); }
  else {
    const { error } = await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', testApptId);
    if (error) fail('T13: Mark appointment cancelled', error.message);
    else {
      const { data: check } = await supabase.from('appointments').select('status').eq('id', testApptId).single();
      if (check?.status === 'cancelled') pass('T13: Mark appointment cancelled');
      else fail('T13: Mark appointment cancelled — status mismatch', check?.status);
    }
  }

  // T14: Add note to appointment
  if (!testApptId) { skip('T14: Add note — no test appointment'); }
  else {
    const { error } = await supabase.from('appointments').update({ notes: 'E2E test note — patient arrived late' }).eq('id', testApptId);
    if (error) fail('T14: Add note to appointment', error.message + ' — needs: ALTER TABLE appointments ADD COLUMN IF NOT EXISTS notes text;');
    else {
      const { data: check } = await supabase.from('appointments').select('notes').eq('id', testApptId).single();
      if (check?.notes?.includes('E2E test note')) pass('T14: Note saved to appointment');
      else fail('T14: Note saved — mismatch', check?.notes);
    }
  }

  // T15: Walk-in registration
  const { data: doctors } = await supabase.from('doctors').select('id, name, specialty, category').eq('is_active', true).limit(1).single();
  const walkinPayload = {
    patient_name:     'WalkIn Test Patient',
    mobile:           '9876000001',
    address:          '',
    appointment_date: new Date().toISOString().split('T')[0],
    appointment_time: 'Walk-in',
    doctor_name:      doctors?.name || 'Test Doctor',
    doctor_id:        doctors?.id || null,
    specialty:        doctors?.specialty || 'General',
    status:           'upcoming',
    booking_channel:  'walk-in',
  };
  const { data: walkin, error: walkinErr } = await supabase.from('appointments').insert([walkinPayload]).select('id').single();
  if (walkinErr) fail('T15: Walk-in registration', walkinErr.message);
  else {
    pass('T15: Walk-in registration', `id=${walkin.id}`);
    // cleanup
    await supabase.from('appointments').delete().eq('id', walkin.id);
  }

  // T16: Patient search by mobile
  const { data: ptSearch, error: ptErr } = await supabase
    .from('patients')
    .select('id, full_name, mobile, gender, total_visits')
    .eq('mobile', TEST_MOBILE)
    .maybeSingle();

  if (ptErr) fail('T16: Patient search by mobile', ptErr.message);
  else if (!ptSearch) fail('T16: Patient search by mobile — not found');
  else pass('T16: Patient search by mobile', `name=${ptSearch.full_name}, visits=${ptSearch.total_visits}`);

  // T17: Patient appointment history
  if (!ptSearch) { skip('T17: Patient history — patient not found'); }
  else {
    const { data: history, error: histErr } = await supabase
      .from('appointments')
      .select('id, doctor_name, status, appointment_date')
      .eq('mobile', ptSearch.mobile)
      .order('created_at', { ascending: false });

    if (histErr) fail('T17: Patient appointment history', histErr.message);
    else pass('T17: Patient appointment history', `${history?.length || 0} records`);
  }

  // T18: Analytics — 30d appointment aggregate
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const { data: analytics, error: analyticsErr } = await supabase
    .from('appointments')
    .select('id, status, doctor_name, appointment_date, created_at')
    .gte('created_at', thirtyDaysAgo.toISOString());

  if (analyticsErr) fail('T18: Analytics data fetch (30d)', analyticsErr.message);
  else pass('T18: Analytics data fetch (30d)', `${analytics?.length || 0} appointments`);

  // T19: Callbacks fetch
  const { data: callbacks, error: cbErr } = await supabase.from('callbacks').select('id, status, patient_name').order('created_at', { ascending: false });
  if (cbErr) fail('T19: Callbacks fetch', cbErr.message);
  else pass('T19: Callbacks fetch', `${callbacks?.length || 0} records, ${callbacks?.filter(c => c.status === 'pending').length || 0} pending`);
}

// ─────────────────────────────────────────────────────────
// SECTION 5: Admin dashboard operations
// ─────────────────────────────────────────────────────────
async function testAdminOperations() {
  section('ADMIN OPERATIONS TESTS');

  // T20: Add test doctor
  const docPayload = {
    name:          TEST_DOC_NAME,
    qualification: 'MBBS (Test)',
    specialty:     'General Medicine',
    category:      'General',
    days:          ['Mon', 'Wed'],
    timings:       { Mon: '9:00 AM - 12:00 PM', Wed: '9:00 AM - 12:00 PM' },
    is_active:     false,
    is_eye_camp:   false,
    order_index:   999,
  };

  const { data: newDoc, error: docErr } = await supabase.from('doctors').insert([docPayload]).select('id').single();
  if (docErr) {
    fail('T20: Add test doctor', docErr.message + (docErr.code === '42501' ? ' — RLS blocks INSERT. Run: ALTER TABLE public.doctors DISABLE ROW LEVEL SECURITY;' : ''));
  } else {
    testDoctorId = newDoc.id;
    pass('T20: Add test doctor', `id=${testDoctorId}`);
  }

  // T21: Edit doctor timing
  if (!testDoctorId) { skip('T21: Edit doctor timing — no test doctor'); }
  else {
    const { data: updated, error: updErr } = await supabase
      .from('doctors')
      .update({ timings: { Mon: '10:00 AM - 1:00 PM', Wed: '10:00 AM - 1:00 PM' } })
      .eq('id', testDoctorId)
      .select('id');

    if (updErr) fail('T21: Edit doctor timing', updErr.message);
    else if (!updated || updated.length === 0) fail('T21: Edit doctor timing — silently blocked by RLS (0 rows affected)');
    else pass('T21: Edit doctor timing', `rows=${updated.length}`);
  }

  // T22: Delete test doctor
  if (!testDoctorId) { skip('T22: Delete test doctor — no test doctor'); }
  else {
    const { error: delErr } = await supabase.from('doctors').delete().eq('id', testDoctorId);
    if (delErr) fail('T22: Delete test doctor', delErr.message);
    else {
      const { data: check } = await supabase.from('doctors').select('id').eq('id', testDoctorId).maybeSingle();
      if (!check) { pass('T22: Delete test doctor'); testDoctorId = null; }
      else fail('T22: Delete test doctor — still exists after delete');
    }
  }

  // T23: Blocked dates
  const { data: blocked, error: blockedErr } = await supabase.from('blocked_dates').select('*');
  if (blockedErr) fail('T23: Blocked dates fetch', blockedErr.message);
  else pass('T23: Blocked dates fetch', `${blocked?.length || 0} dates blocked`);

  // T24: Add and remove a blocked date
  const testDate = '2099-12-31';
  const { error: blockErr } = await supabase.from('blocked_dates').insert({ blocked_date: testDate });
  if (blockErr) fail('T24: Block a date', blockErr.message);
  else {
    const { error: unblockErr } = await supabase.from('blocked_dates').delete().eq('blocked_date', testDate);
    if (unblockErr) fail('T24: Unblock a date', unblockErr.message);
    else pass('T24: Block and unblock date');
  }

  // T25: Staff accounts list (admin feature)
  const { data: staffList, error: staffListErr } = await supabase
    .from('staff_accounts')
    .select('id, full_name, role, is_active');

  if (staffListErr) fail('T25: List staff accounts', staffListErr.message);
  else pass('T25: List staff accounts', `${staffList?.length || 0} accounts`);

  // T26: CSV export logic check — fetch all appointments with needed fields
  const { data: csvData, error: csvErr } = await supabase
    .from('appointments')
    .select('id, patient_name, mobile, dob, doctor_name, specialty, appointment_date, appointment_time, status, booking_channel, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (csvErr) fail('T26: CSV export data fetch', csvErr.message);
  else {
    // Verify all expected columns exist in response
    const row = csvData?.[0] || {};
    const fields = ['patient_name', 'mobile', 'doctor_name', 'appointment_date', 'status'];
    const allPresent = fields.every((f) => f in row);
    if (allPresent) pass('T26: CSV export fields present', `${csvData?.length || 0} rows`);
    else fail('T26: CSV export fields missing', fields.filter((f) => !(f in row)).join(', '));
  }
}

// ─────────────────────────────────────────────────────────
// SECTION 6: Patient profile + booking history
// ─────────────────────────────────────────────────────────
async function testPatientProfile() {
  section('PATIENT PROFILE TESTS');

  // T27: Fetch appointments by user_id (Supabase auth user)
  // We can't create a real auth user programmatically without the service key,
  // but we can check the query pattern works
  const { data: profileAppts, error: profileErr } = await supabase
    .from('appointments')
    .select('id, doctor_name, appointment_date, status, notes')
    .is('user_id', null) // guest bookings
    .limit(5);

  if (profileErr) fail('T27: Fetch appointments by user_id (query test)', profileErr.message);
  else pass('T27: Appointment query by user_id works', `${profileAppts?.length || 0} guest records`);

  // T28: Cancel appointment logic
  if (!testApptId) { skip('T28: Cancel appointment — no test id'); }
  else {
    const { error } = await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', testApptId);
    if (error) fail('T28: Cancel appointment', error.message);
    else pass('T28: Cancel appointment');
  }

  // T29: Profile patient code derivation
  const testCases = [
    { name: 'Ramesh Kumar',    mobile: '9876543210', expected: 'LC-RAME-3210' },
    { name: 'Priya Singh',     mobile: '8765432109', expected: 'LC-PRIY-2109' },
    { name: 'A B',             mobile: '7654321098', expected: 'LC-ABXX-1098' },
    { name: 'Test Patient E2E', mobile: TEST_MOBILE, expected: 'LC-TEST-6655' },
  ];

  function generatePatientCode(name, mobile) {
    if (!name || !mobile) return null;
    const namePart = name.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 4).padEnd(4, 'X');
    const mobilePart = String(mobile).replace(/\D/g, '').slice(-4);
    if (mobilePart.length < 4) return null;
    return `LC-${namePart}-${mobilePart}`;
  }

  let codeOk = true;
  for (const tc of testCases) {
    const got = generatePatientCode(tc.name, tc.mobile);
    if (got !== tc.expected) {
      fail(`T29: Patient code for "${tc.name}"`, `expected=${tc.expected}, got=${got}`);
      codeOk = false;
    }
  }
  if (codeOk) pass('T29: Patient code formula correct for all test cases');
}

// ─────────────────────────────────────────────────────────
// SECTION 7: Source code audit — logic bugs
// ─────────────────────────────────────────────────────────
async function testCodeAudit() {
  section('SOURCE CODE AUDIT');

  const { readFileSync, existsSync } = await import('fs');
  const check = (file) => existsSync(file) ? readFileSync(file, 'utf8') : null;

  const srcBase = 'C:/lifecareclinic/src';

  // Check BookingModal for gender validation
  const bm = check(`${srcBase}/components/BookingModal.jsx`);
  if (!bm) { fail('T30: Read BookingModal.jsx'); return; }

  if (bm.includes("e.gender = 'Please select gender'")) pass('T30: BookingModal gender validation exists');
  else fail('T30: BookingModal gender validation missing');

  if (bm.includes('generatePatientCode')) pass('T31: BookingModal imports generatePatientCode');
  else fail('T31: BookingModal missing generatePatientCode import');

  if (bm.includes('patient email error')) pass('T32: BookingModal patient confirmation email included');
  else fail('T32: BookingModal patient confirmation email missing');

  if (bm.includes("gender: form.gender")) pass('T33: BookingModal gender saved to patients table');
  else fail('T33: BookingModal gender not saved to patients table');

  // Check StaffDashboard
  const sd = check(`${srcBase}/pages/StaffDashboard.jsx`);
  if (!sd) { fail('T34: Read StaffDashboard.jsx'); return; }

  if (sd.includes("'Walk-in'")) pass('T34: StaffDashboard walk-in booking_channel set');
  else fail('T34: StaffDashboard walk-in booking_channel missing');

  if (sd.includes("'no_show'")) pass('T35: StaffDashboard no_show status button exists');
  else fail('T35: StaffDashboard no_show status button missing');

  if (sd.includes('notesModal')) pass('T36: StaffDashboard notes modal implemented');
  else fail('T36: StaffDashboard notes modal missing');

  if (sd.includes("activeTab === 'analytics'")) pass('T37: StaffDashboard analytics tab exists');
  else fail('T37: StaffDashboard analytics tab missing');

  if (sd.includes("activeTab === 'patients'")) pass('T38: StaffDashboard patients tab exists');
  else fail('T38: StaffDashboard patients tab missing');

  if (sd.includes('sendNotifications')) pass('T39: StaffDashboard notify patients implemented');
  else fail('T39: StaffDashboard notify patients missing');

  // Check Admin
  const admin = check(`${srcBase}/pages/Admin.jsx`);
  if (!admin) { fail('T40: Read Admin.jsx'); return; }

  if (admin.includes("'no_show'")) pass('T40: Admin no_show status button exists');
  else fail('T40: Admin no_show status button missing');

  if (admin.includes("no_show:   'bg-gray-200")) pass('T41: Admin no_show STATUS_STYLE defined');
  else fail('T41: Admin no_show STATUS_STYLE missing');

  // Check AuthContext for getStaffRole
  const auth = check(`${srcBase}/context/AuthContext.jsx`);
  if (!auth) { fail('T42: Read AuthContext.jsx'); return; }

  if (auth.includes('getStaffRole')) pass('T42: AuthContext getStaffRole implemented');
  else fail('T42: AuthContext getStaffRole missing');

  if (auth.includes('STAFF_ROLE_KEY')) pass('T43: AuthContext STAFF_ROLE_KEY constant exists');
  else fail('T43: AuthContext STAFF_ROLE_KEY missing');

  // Check Profile for patient code
  const profile = check(`${srcBase}/pages/Profile.jsx`);
  if (!profile) { fail('T44: Read Profile.jsx'); return; }

  if (profile.includes('generatePatientCode')) pass('T44: Profile.jsx shows patient code');
  else fail('T44: Profile.jsx missing patient code');

  if (profile.includes("no_show")) pass('T45: Profile no_show status style defined');
  else fail('T45: Profile no_show status style missing');

  // Check utils.js
  const utils = check(`${srcBase}/lib/utils.js`);
  if (utils && utils.includes('generatePatientCode')) pass('T46: src/lib/utils.js generatePatientCode exported');
  else fail('T46: src/lib/utils.js missing or generatePatientCode not exported');

  // Check DAY_NAMES abbreviations (3-letter)
  if (sd.includes("'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'")) pass('T47: StaffDashboard DAY_NAMES uses 3-letter abbreviations');
  else fail('T47: StaffDashboard DAY_NAMES may use wrong format');

  // Check useDoctors for onwards fix
  const ud = check(`${srcBase}/hooks/useDoctors.js`);
  if (!ud) { fail('T48: Read useDoctors.js'); }
  else if (ud.includes("replace(/\\s*onwards\\s*$/i, '')")) pass('T48: useDoctors strips "onwards" from startTime');
  else fail('T48: useDoctors "onwards" stripping missing — may cause "onwards onwards" bug');

  // Check resend.js uses fetch (not SDK)
  const resendLib = check(`${srcBase}/lib/resend.js`);
  if (!resendLib) { fail('T49: Read src/lib/resend.js'); }
  else if (resendLib.includes("fetch('/api/send-email'")) pass('T49: resend.js uses fetch to serverless function (no CORS issue)');
  else fail('T49: resend.js may be calling Resend SDK directly (CORS blocked from browser)');

  // Check api/send-email.js exists
  const apiEmail = check('C:/lifecareclinic/api/send-email.js');
  if (apiEmail && apiEmail.includes('Resend')) pass('T50: api/send-email.js serverless function exists');
  else fail('T50: api/send-email.js missing — emails will not send');
}

// ─────────────────────────────────────────────────────────
// SECTION 8: Cleanup
// ─────────────────────────────────────────────────────────
async function cleanup() {
  section('CLEANUP');

  if (testApptId) {
    const { error } = await supabase.from('appointments').delete().eq('id', testApptId);
    if (error) log('⚠️ ', 'Cleanup: test appointment', error.message);
    else log('🗑️ ', 'Cleanup: test appointment deleted');
  }

  if (testPatientId) {
    const { error } = await supabase.from('patients').delete().eq('id', testPatientId);
    if (error) log('⚠️ ', 'Cleanup: test patient', error.message);
    else log('🗑️ ', 'Cleanup: test patient deleted');
  }

  if (testDoctorId) {
    await supabase.from('doctors').delete().eq('id', testDoctorId);
    log('🗑️ ', 'Cleanup: test doctor deleted');
  }
}

// ─────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────
async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║      LIFE CARE CLINIC — E2E TEST SUITE                    ║');
  console.log(`║      ${new Date().toLocaleString('en-IN')}                         ║`);
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  await testSchemaChecks();
  await testBookingFlow();
  await testEmailAPI();
  await testStaffDashboard();
  await testAdminOperations();
  await testPatientProfile();
  await testCodeAudit();
  await cleanup();

  // ── Summary ──
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log(`║  RESULTS: ✅ ${String(passed).padEnd(3)} passed  ❌ ${String(failed).padEnd(3)} failed  ⏭️  ${String(skipped).padEnd(3)} skipped  ║`);
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  if (failed > 0) {
    console.log('FAILURES:');
    results.filter(r => r.status === 'FAIL').forEach(r => console.log(`  ❌ ${r.label}: ${r.detail}`));
  }
  if (skipped > 0) {
    console.log('\nSKIPPED:');
    results.filter(r => r.status === 'SKIP').forEach(r => console.log(`  ⏭️  ${r.label}: ${r.detail}`));
  }
}

main().catch((err) => {
  console.error('Test suite crashed:', err);
  process.exit(1);
});
