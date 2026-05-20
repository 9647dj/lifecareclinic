/**
 * StaffDashboard — internal operations panel for clinic staff
 *
 * Tabs:
 *   Appointments — today's queue with status management (Done / No-show / Cancel)
 *                  and inline appointment notes saved to Supabase
 *   Walk-in      — mobile-first registration form; auto-looks up returning
 *                  patients by mobile and pre-fills their details
 *   Patients     — full-text + mobile search across the patients table with
 *                  complete appointment history
 *   Callbacks    — inbound callback requests with mark-done workflow
 *   Analytics    — 30-day KPIs, per-doctor bar chart, day-of-week heatmap,
 *                  and bulk email notifications to a doctor's patients
 *
 * Auth: session-stored staff/admin role from AuthContext; staff cannot access
 * the Admin panel unless isAdminAuthed() returns true.
 */
import { useState, useEffect, useRef, Fragment } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useDoctors } from '../hooks/useDoctors';
import resend from '../lib/resend';
import { generatePatientCode } from '../lib/utils';
import logo from '../assets/logo.jpeg';

const FROM_EMAIL = 'Life Care Clinic <lifecarejourian@gmail.com>';

const STATUS_STYLE = {
  upcoming:  'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  no_show:   'bg-gray-200 text-gray-600',
};
const STATUS_LABEL = {
  upcoming:  'Upcoming',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show:   'No Show',
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function fmtDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtDateTime(str) {
  if (!str) return '—';
  return new Date(str).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function StaffDashboard() {
  const { staffLogout, isAdminAuthed, getStaffName } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('appointments');
  const { doctors } = useDoctors();

  // ── Appointments ──────────────────────────────────────────────
  const [appointments, setAppointments] = useState([]);
  const [apptLoading, setApptLoading] = useState(true);
  const [showToday, setShowToday] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDoctor, setFilterDoctor] = useState('All');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [updatingId, setUpdatingId] = useState(null);
  const [notesModal, setNotesModal] = useState(null); // { aptId, text }
  const [savingNotes, setSavingNotes] = useState(false);

  // ── Walk-in ───────────────────────────────────────────────────
  const mobileRef = useRef(null);
  const [wfMobile, setWfMobile] = useState('');
  const [wf, setWf] = useState({ name: '', dob: '', gender: '', doctorId: '' });
  const [wfLookup, setWfLookup] = useState(null); // null | 'searching' | 'returning' | 'new'
  const [wfPatient, setWfPatient] = useState(null);
  const [wfTodayCount, setWfTodayCount] = useState(0);
  const [wfErrors, setWfErrors] = useState({});
  const [wfLoading, setWfLoading] = useState(false);
  const [wfSuccess, setWfSuccess] = useState(false);

  // ── Patient search ────────────────────────────────────────────
  const [ptSearch, setPtSearch] = useState('');
  const [ptResults, setPtResults] = useState([]);
  const [ptLoading, setPtLoading] = useState(false);
  const [ptSelected, setPtSelected] = useState(null);
  const [ptAppts, setPtAppts] = useState([]);
  const [ptApptLoading, setPtApptLoading] = useState(false);
  const [ptSearched, setPtSearched] = useState(false);

  // ── Callbacks ─────────────────────────────────────────────────
  const [callbacks, setCallbacks] = useState([]);
  const [cbLoading, setCbLoading] = useState(true);
  const [markingId, setMarkingId] = useState(null);

  // ── Notifications ─────────────────────────────────────────────
  const [notifyDoctor, setNotifyDoctor] = useState('');
  const [notifyMsg, setNotifyMsg] = useState('');
  const [notifySending, setNotifySending] = useState(false);
  const [notifyResult, setNotifyResult] = useState('');

  useEffect(() => { fetchAppointments(); fetchCallbacks(); fetchTodayWalkinCount(); }, []);
  useEffect(() => {
    if (activeTab === 'walkin') setTimeout(() => mobileRef.current?.focus(), 100);
  }, [activeTab]);

  async function fetchAppointments() {
    setApptLoading(true);
    const { data } = await supabase.from('appointments').select('*').order('created_at', { ascending: false });
    setAppointments(data || []);
    setApptLoading(false);
  }

  async function fetchCallbacks() {
    setCbLoading(true);
    const { data } = await supabase.from('callbacks').select('*').order('created_at', { ascending: false });
    setCallbacks(data || []);
    setCbLoading(false);
  }

  async function fetchTodayWalkinCount() {
    const today = new Date().toISOString().split('T')[0];
    const { count } = await supabase.from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('appointment_date', today)
      .eq('booking_channel', 'walk-in');
    setWfTodayCount(count || 0);
  }

  async function updateStatus(id, status) {
    setUpdatingId(id);
    await supabase.from('appointments').update({ status }).eq('id', id);
    setAppointments((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
    setUpdatingId(null);
  }

  async function saveNotes() {
    if (!notesModal) return;
    setSavingNotes(true);
    const { error } = await supabase.from('appointments').update({ notes: notesModal.text }).eq('id', notesModal.aptId);
    if (!error) {
      setAppointments((prev) => prev.map((a) => a.id === notesModal.aptId ? { ...a, notes: notesModal.text } : a));
      setNotesModal(null);
    } else {
      alert('Could not save note. Please ensure the "notes" column exists in the appointments table in Supabase.');
    }
    setSavingNotes(false);
  }

  async function markCallbackDone(id) {
    setMarkingId(id);
    await supabase.from('callbacks').update({ status: 'done' }).eq('id', id);
    setCallbacks((prev) => prev.map((c) => c.id === id ? { ...c, status: 'done' } : c));
    setMarkingId(null);
  }

  // ── Walk-in helpers ───────────────────────────────────────────
  async function lookupPatient(mobile) {
    setWfLookup('searching');
    const { data: pt } = await supabase.from('patients').select('*').eq('mobile', mobile).maybeSingle();
    if (pt) {
      setWfPatient(pt);
      setWf((f) => ({ ...f, name: pt.full_name || '', dob: pt.dob || '', gender: pt.gender || '' }));
      setWfLookup('returning');
    } else {
      setWfPatient(null);
      setWf((f) => ({ ...f, name: '', dob: '', gender: '' }));
      setWfLookup('new');
    }
  }

  function handleMobileChange(e) {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setWfMobile(val);
    setWfErrors((e2) => ({ ...e2, mobile: '' }));
    if (wfLookup !== null) { setWfLookup(null); setWfPatient(null); setWf((f) => ({ ...f, name: '', dob: '', gender: '' })); }
    if (/^[6-9]\d{9}$/.test(val)) lookupPatient(val);
  }

  function handleMobileKeyDown(e) {
    if ((e.key === 'Tab' || e.key === 'Enter') && /^[6-9]\d{9}$/.test(wfMobile) && wfLookup === null) {
      e.preventDefault();
      lookupPatient(wfMobile);
    }
  }

  function resetWalkin() {
    setWfMobile('');
    setWf({ name: '', dob: '', gender: '', doctorId: '' });
    setWfLookup(null);
    setWfPatient(null);
    setWfErrors({});
    setTimeout(() => mobileRef.current?.focus(), 50);
  }

  // ── Walk-in submit ────────────────────────────────────────────
  function validateWf() {
    const e = {};
    if (!/^[6-9]\d{9}$/.test(wfMobile)) e.mobile = 'Enter a valid 10-digit number';
    if (!wf.name.trim()) e.name = 'Name is required';
    if (!wf.doctorId) e.doctorId = 'Please select a doctor';
    return e;
  }

  async function submitWalkin(e) {
    e.preventDefault();
    const errs = validateWf();
    if (Object.keys(errs).length) { setWfErrors(errs); return; }
    setWfLoading(true);
    const doc = doctors.find((d) => d.id === wf.doctorId);
    const payload = {
      patient_name:     wf.name.trim(),
      mobile:           wfMobile,
      dob:              wf.dob || null,
      address:          '',
      doctor_name:      doc?.name || '',
      doctor_id:        wf.doctorId || null,
      specialty:        doc?.specialty || '',
      category:         doc?.category || null,
      appointment_date: new Date().toISOString().split('T')[0],
      appointment_time: 'Walk-in',
      status:           'upcoming',
      booking_channel:  'walk-in',
    };
    const { error } = await supabase.from('appointments').insert([payload]);
    if (!error) {
      const { data: pt } = await supabase.from('patients').select('id, total_visits').eq('mobile', wfMobile).maybeSingle().catch(() => ({ data: null }));
      if (pt) {
        await supabase.from('patients').update({
          total_visits: (pt.total_visits || 0) + 1,
          full_name: wf.name.trim(),
          ...(wf.gender && { gender: wf.gender }),
          ...(wf.dob && { dob: wf.dob }),
        }).eq('id', pt.id).catch(() => {});
      } else {
        await supabase.from('patients').insert({
          full_name:    wf.name.trim(),
          mobile:       wfMobile,
          dob:          wf.dob || null,
          gender:       wf.gender || null,
          total_visits: 1,
        }).catch(() => {});
      }
      setWfTodayCount((c) => c + 1);
      setWfSuccess(true);
      setTimeout(() => { setWfSuccess(false); resetWalkin(); }, 2500);
      fetchAppointments();
    } else {
      setWfErrors({ submit: error?.message || 'Failed to register walk-in' });
    }
    setWfLoading(false);
  }

  // ── Patient search ────────────────────────────────────────────
  async function searchPatients() {
    if (!ptSearch.trim()) return;
    setPtLoading(true);
    setPtSelected(null);
    setPtAppts([]);
    setPtSearched(true);
    const q = ptSearch.trim();
    const isMobile = /^\d+$/.test(q);
    let query = supabase.from('patients').select('*').limit(20);
    if (isMobile) query = query.eq('mobile', q);
    else query = query.ilike('full_name', `%${q}%`);
    const { data } = await query;
    setPtResults(data || []);
    setPtLoading(false);
  }

  async function selectPatient(pt) {
    setPtSelected(pt);
    setPtResults([]);
    setPtApptLoading(true);
    const { data } = await supabase.from('appointments').select('*').eq('mobile', pt.mobile).order('created_at', { ascending: false });
    setPtAppts(data || []);
    setPtApptLoading(false);
  }

  // ── Notify patients ───────────────────────────────────────────
  async function sendNotifications() {
    if (!notifyDoctor) { setNotifyResult('Please select a doctor.'); return; }
    if (!notifyMsg.trim()) { setNotifyResult('Please enter a message.'); return; }
    setNotifySending(true);
    setNotifyResult('');
    const { data: appts } = await supabase
      .from('appointments')
      .select('email, patient_name')
      .eq('doctor_name', notifyDoctor)
      .not('email', 'is', null);
    const emails = [...new Set((appts || []).map((a) => a.email).filter(Boolean))];
    if (emails.length === 0) {
      setNotifyResult('No patients with email found for this doctor.');
      setNotifySending(false);
      return;
    }
    let sent = 0;
    for (const email of emails) {
      try {
        await resend.emails.send({
          from: FROM_EMAIL,
          to: email,
          subject: 'Notice from Life Care Clinic',
          html: `<p>${notifyMsg.replace(/\n/g, '<br>')}</p><p style="color:#888;font-size:12px;margin-top:16px;">Life Care Clinic — 01924-467500</p>`,
        });
        sent++;
      } catch (_) {}
    }
    setNotifyResult(`Sent to ${sent} of ${emails.length} patients.`);
    setNotifySending(false);
  }

  function handleLogout() { staffLogout(); navigate('/'); }

  function resetFilters() {
    setSearch(''); setFilterDoctor('All'); setFilterStatus('All');
    setFilterDateFrom(''); setFilterDateTo(''); setShowToday(true);
  }

  // ── Computed ──────────────────────────────────────────────────
  const todayStr     = new Date().toISOString().split('T')[0];
  const todayDayName = DAY_NAMES[new Date().getDay()];
  const visitingToday = doctors.filter((d) => d.schedule?.some((s) => s.day === todayDayName));
  const todayAppts    = appointments.filter((a) => a.appointment_date === todayStr);
  const pendingCb     = callbacks.filter((c) => c.status === 'pending').length;

  const oneWeekAgo = new Date(); oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const newThisWeek = new Set(
    appointments.filter((a) => a.created_at && new Date(a.created_at) >= oneWeekAgo).map((a) => a.mobile).filter(Boolean)
  ).size;

  const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recent30      = appointments.filter((a) => a.created_at && new Date(a.created_at) >= thirtyDaysAgo);
  const noShowCount   = recent30.filter((a) => a.status === 'no_show').length;
  const noShowRate    = recent30.length ? Math.round(noShowCount / recent30.length * 100) : 0;

  const byDoctor = recent30.reduce((acc, a) => {
    if (a.doctor_name) acc[a.doctor_name] = (acc[a.doctor_name] || 0) + 1;
    return acc;
  }, {});
  const byStatus = recent30.reduce((acc, a) => {
    const s = a.status || 'upcoming'; acc[s] = (acc[s] || 0) + 1; return acc;
  }, {});

  const doctorOptions = ['All', ...new Set(appointments.map((a) => a.doctor_name).filter(Boolean))];
  const walkinDoctors = visitingToday.length > 0 ? visitingToday : doctors.filter((d) => d.is_active !== false);

  const usingFilters = search || filterDoctor !== 'All' || filterDateFrom || filterDateTo || filterStatus !== 'All' || !showToday;

  const filteredAppts = (() => {
    if (showToday && !search && filterDoctor === 'All' && filterStatus === 'All' && !filterDateFrom && !filterDateTo) {
      return appointments.filter((a) => a.appointment_date === todayStr);
    }
    return appointments.filter((a) => {
      const q = search.toLowerCase();
      const m = !q || a.patient_name?.toLowerCase().includes(q) || a.mobile?.includes(q) || a.doctor_name?.toLowerCase().includes(q);
      return (
        m &&
        (filterDoctor === 'All' || a.doctor_name === filterDoctor) &&
        (filterStatus === 'All' || (a.status || 'upcoming') === filterStatus) &&
        (!filterDateFrom || a.appointment_date >= filterDateFrom) &&
        (!filterDateTo   || a.appointment_date <= filterDateTo) &&
        (!showToday      || a.appointment_date === todayStr)
      );
    });
  })();

  const inputCls = 'border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-clinic-green bg-white text-gray-700';
  const wfInputCls = (f) => `w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-clinic-green ${wfErrors[f] ? 'border-red-400 bg-red-50' : 'border-gray-200'}`;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/"><img src={logo} alt="Life Care Clinic" className="h-10 w-10 rounded-xl object-cover ring-2 ring-green-100" /></Link>
            <div>
              <h1 className="font-bold text-gray-900">Staff Dashboard</h1>
              <p className="text-xs text-gray-500">
                Life Care Clinic
                {getStaffName() && <span className="ml-1 text-clinic-green">· {getStaffName()}</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isAdminAuthed() && (
              <Link to="/admin" className="text-sm font-semibold text-clinic-green hover:text-clinic-green-dark transition-colors">Admin Panel →</Link>
            )}
            <Link to="/" className="text-sm text-gray-500 hover:text-clinic-green transition-colors font-medium">Home</Link>
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 font-medium">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 border-b border-gray-100 -mb-px overflow-x-auto">
            <TabBtn label="Appointments" count={todayAppts.length} active={activeTab === 'appointments'} onClick={() => setActiveTab('appointments')} />
            <TabBtn label="Walk-in" active={activeTab === 'walkin'} onClick={() => setActiveTab('walkin')} />
            <TabBtn label="Patients" active={activeTab === 'patients'} onClick={() => setActiveTab('patients')} />
            <TabBtn label="Callbacks" count={pendingCb} badge active={activeTab === 'callbacks'} onClick={() => setActiveTab('callbacks')} />
            <TabBtn label="Analytics" active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-1">Visiting Today</p>
            <p className="text-3xl font-bold text-blue-700">{visitingToday.length}</p>
            <div className="mt-2 space-y-1 max-h-28 overflow-y-auto">
              {visitingToday.length === 0
                ? <p className="text-xs text-blue-400">No visits today</p>
                : visitingToday.map((d) => {
                    const slot = d.schedule?.find((s) => s.day === todayDayName);
                    return (
                      <div key={d.id} className="flex justify-between gap-1">
                        <span className="text-xs font-medium text-blue-800 truncate">{d.name}</span>
                        {slot && <span className="text-xs text-blue-500 flex-shrink-0">{slot.startTime}</span>}
                      </div>
                    );
                  })}
            </div>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-green-500 uppercase tracking-wide mb-1">Patients Today</p>
            <p className="text-3xl font-bold text-green-700">{todayAppts.length}</p>
            <p className="text-xs text-green-500 mt-1 opacity-75">appointments booked</p>
          </div>
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-orange-500 uppercase tracking-wide mb-1">Pending Callbacks</p>
            <p className="text-3xl font-bold text-orange-700">{pendingCb}</p>
            <p className="text-xs text-orange-500 mt-1 opacity-75">awaiting response</p>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-1">No-shows (30d)</p>
            <p className="text-3xl font-bold text-red-700">{noShowCount}</p>
            <p className="text-xs text-red-500 mt-1 opacity-75">{noShowRate}% rate</p>
          </div>
          <div className="bg-teal-50 border border-teal-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-teal-500 uppercase tracking-wide mb-1">New This Week</p>
            <p className="text-3xl font-bold text-teal-700">{newThisWeek}</p>
            <p className="text-xs text-teal-500 mt-1 opacity-75">unique patients (7d)</p>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════ */}
        {/* ── Appointments tab ── */}
        {/* ══════════════════════════════════════════════════════ */}
        {activeTab === 'appointments' && (
          <>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <button
                onClick={() => { setShowToday(true); setSearch(''); setFilterDoctor('All'); setFilterStatus('All'); setFilterDateFrom(''); setFilterDateTo(''); }}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${showToday ? 'bg-clinic-green text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                Today
              </button>
              <div className="relative flex-1 min-w-[180px]">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input type="text" value={search}
                  onChange={(e) => { setSearch(e.target.value); setShowToday(false); }}
                  placeholder="Search name or mobile..."
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-clinic-green bg-white" />
              </div>
              <select value={filterDoctor} onChange={(e) => { setFilterDoctor(e.target.value); setShowToday(false); }} className={inputCls}>
                {doctorOptions.map((d) => <option key={d}>{d}</option>)}
              </select>
              <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setShowToday(false); }} className={inputCls}>
                {['All', 'upcoming', 'completed', 'cancelled', 'no_show'].map((s) => (
                  <option key={s} value={s}>{STATUS_LABEL[s] || s}</option>
                ))}
              </select>
              <input type="date" value={filterDateFrom} onChange={(e) => { setFilterDateFrom(e.target.value); setShowToday(false); }} className={inputCls} title="From date" />
              <span className="text-gray-400 text-sm">–</span>
              <input type="date" value={filterDateTo} onChange={(e) => { setFilterDateTo(e.target.value); setShowToday(false); }} className={inputCls} title="To date" />
              {usingFilters && (
                <button onClick={resetFilters} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 border border-gray-200 rounded-xl bg-white">Clear</button>
              )}
            </div>

            <p className="text-xs text-gray-400 mb-3">
              {showToday ? "Today's appointments — " : ''}{filteredAppts.length} records
            </p>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {apptLoading ? <Loading text="Loading appointments..." /> : filteredAppts.length === 0 ? (
                <Empty text={showToday ? 'No appointments today' : 'No appointments found'} />
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        {['Doctor', 'Patient', 'Mobile', 'DOB', 'Date', 'Time', 'Channel', 'Status', 'Actions'].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredAppts.map((apt) => {
                        const status = apt.status || 'upcoming';
                        return (
                          <tr key={apt.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-semibold text-gray-800 whitespace-nowrap">{apt.doctor_name}</p>
                              <p className="text-xs text-gray-400">{apt.specialty}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-medium text-gray-800 whitespace-nowrap">{apt.patient_name}</p>
                              {apt.notes && (
                                <p className="text-xs text-amber-600 truncate max-w-[140px] mt-0.5" title={apt.notes}>📝 {apt.notes}</p>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <a href={`tel:${apt.mobile}`} className="text-clinic-green hover:underline font-medium whitespace-nowrap">{apt.mobile}</a>
                            </td>
                            <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{fmtDate(apt.dob)}</td>
                            <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmtDate(apt.appointment_date)}</td>
                            <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{apt.appointment_time}</td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 capitalize">
                                {apt.booking_channel || 'website'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLE[status] || STATUS_STYLE.upcoming}`}>
                                {STATUS_LABEL[status] || status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1">
                                {status === 'upcoming' && (
                                  <>
                                    <button onClick={() => updateStatus(apt.id, 'completed')} disabled={updatingId === apt.id}
                                      className="text-xs bg-green-100 hover:bg-green-200 text-green-700 font-semibold px-2 py-1 rounded-lg disabled:opacity-50 transition whitespace-nowrap">
                                      ✓ Done
                                    </button>
                                    <button onClick={() => updateStatus(apt.id, 'no_show')} disabled={updatingId === apt.id}
                                      className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-2 py-1 rounded-lg disabled:opacity-50 transition whitespace-nowrap">
                                      No Show
                                    </button>
                                    <button onClick={() => updateStatus(apt.id, 'cancelled')} disabled={updatingId === apt.id}
                                      className="text-xs bg-red-100 hover:bg-red-200 text-red-700 font-semibold px-2 py-1 rounded-lg disabled:opacity-50 transition">
                                      ✕
                                    </button>
                                  </>
                                )}
                                <button onClick={() => setNotesModal({ aptId: apt.id, text: apt.notes || '' })}
                                  className="text-xs bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold px-2 py-1 rounded-lg transition">
                                  📝
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════════ */}
        {/* ── Walk-in tab ── */}
        {/* ══════════════════════════════════════════════════════ */}
        {activeTab === 'walkin' && (
          <div className="max-w-lg mx-auto">
            {/* Today's walk-in counter */}
            <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-4 mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">Walk-ins Registered Today</p>
                <p className="text-4xl font-bold text-green-700 mt-0.5">{wfTodayCount}</p>
              </div>
              <svg className="w-12 h-12 text-green-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>

            {wfSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Registered! Ready for next patient…
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 bg-clinic-green-lite border-b border-green-100">
                <h2 className="font-bold text-gray-900">Register Walk-in Patient</h2>
                <p className="text-xs text-gray-500 mt-0.5">Enter mobile number — returning patients auto-fill</p>
              </div>
              <div className="px-6 py-5">
                <form onSubmit={submitWalkin} className="space-y-4">
                  {/* Mobile — first & most important field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number *</label>
                    <input
                      ref={mobileRef}
                      type="tel"
                      value={wfMobile}
                      onChange={handleMobileChange}
                      onKeyDown={handleMobileKeyDown}
                      maxLength={10}
                      placeholder="10-digit mobile number"
                      className={`w-full border rounded-xl px-4 py-3 text-base outline-none focus:ring-2 transition-colors ${
                        wfErrors.mobile        ? 'border-red-400 bg-red-50 focus:ring-red-200' :
                        wfLookup === 'searching' ? 'border-yellow-300 bg-yellow-50 focus:ring-yellow-200' :
                        wfLookup === 'returning' ? 'border-green-400 bg-green-50 focus:ring-green-200' :
                        wfLookup === 'new'       ? 'border-blue-400 bg-blue-50 focus:ring-blue-200' :
                        'border-gray-200 focus:ring-clinic-green'
                      }`}
                    />
                    {wfLookup === 'searching' && (
                      <p className="text-yellow-600 text-xs mt-1 flex items-center gap-1">
                        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                        Looking up patient…
                      </p>
                    )}
                    {wfErrors.mobile && <p className="text-red-500 text-xs mt-1">{wfErrors.mobile}</p>}
                  </div>

                  {/* Returning patient banner */}
                  {wfLookup === 'returning' && wfPatient && (
                    <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                      <p className="text-green-700 font-semibold text-sm flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        Returning Patient
                      </p>
                      <p className="text-green-600 text-xs mt-0.5 font-medium">
                        {generatePatientCode(wfPatient.full_name, wfPatient.mobile)} · {wfPatient.total_visits || 0} previous visit{wfPatient.total_visits !== 1 ? 's' : ''}
                      </p>
                      <p className="text-green-500 text-xs mt-0.5">Details auto-filled — verify and select doctor to submit</p>
                    </div>
                  )}

                  {/* New patient banner */}
                  {wfLookup === 'new' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                      <p className="text-blue-700 font-semibold text-sm flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        New Patient
                      </p>
                      <p className="text-blue-500 text-xs mt-0.5">Fill in the details below</p>
                    </div>
                  )}

                  {/* Fields revealed after lookup */}
                  {(wfLookup === 'returning' || wfLookup === 'new') && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                        <input
                          type="text"
                          value={wf.name}
                          onChange={(e) => { setWf((f) => ({ ...f, name: e.target.value })); setWfErrors((e2) => ({ ...e2, name: '' })); }}
                          placeholder="Patient's full name"
                          autoFocus={wfLookup === 'new'}
                          className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-clinic-green ${wfErrors.name ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                        />
                        {wfErrors.name && <p className="text-red-500 text-xs mt-1">{wfErrors.name}</p>}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                          <input
                            type="date"
                            value={wf.dob}
                            max={new Date().toISOString().split('T')[0]}
                            onChange={(e) => setWf((f) => ({ ...f, dob: e.target.value }))}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-clinic-green"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                          <div className="flex gap-1.5">
                            {['Male', 'Female', 'Other'].map((g) => (
                              <button key={g} type="button"
                                onClick={() => setWf((f) => ({ ...f, gender: f.gender === g ? '' : g }))}
                                className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                                  wf.gender === g ? 'bg-clinic-green text-white border-clinic-green' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}>
                                {g[0]}
                              </button>
                            ))}
                          </div>
                          {wf.gender && <p className="text-xs text-gray-400 mt-1 text-center">{wf.gender}</p>}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Doctor *
                          {visitingToday.length > 0 && (
                            <span className="ml-2 text-xs text-green-600 font-normal">Today's schedule</span>
                          )}
                        </label>
                        <select
                          value={wf.doctorId}
                          onChange={(e) => { setWf((f) => ({ ...f, doctorId: e.target.value })); setWfErrors((e2) => ({ ...e2, doctorId: '' })); }}
                          className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-clinic-green bg-white ${wfErrors.doctorId ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                        >
                          <option value="">Select doctor…</option>
                          {walkinDoctors.map((d) => (
                            <option key={d.id} value={d.id}>{d.name} — {d.specialty}</option>
                          ))}
                        </select>
                        {visitingToday.length === 0 && (
                          <p className="text-xs text-gray-400 mt-1">No scheduled doctors today — showing all active doctors</p>
                        )}
                        {wfErrors.doctorId && <p className="text-red-500 text-xs mt-1">{wfErrors.doctorId}</p>}
                      </div>

                      {wfErrors.submit && (
                        <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">{wfErrors.submit}</p>
                      )}

                      <button type="submit" disabled={wfLoading}
                        className="w-full bg-clinic-green hover:bg-clinic-green-dark disabled:opacity-60 text-white font-bold py-4 rounded-xl transition text-base flex items-center justify-center gap-2">
                        {wfLoading ? (
                          <><svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Registering…</>
                        ) : 'Register Walk-in'}
                      </button>
                    </>
                  )}
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════ */}
        {/* ── Patients tab ── */}
        {/* ══════════════════════════════════════════════════════ */}
        {activeTab === 'patients' && (
          <>
            <div className="flex gap-3 mb-5">
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input type="text" value={ptSearch}
                  onChange={(e) => { setPtSearch(e.target.value); setPtSearched(false); }}
                  onKeyDown={(e) => e.key === 'Enter' && searchPatients()}
                  placeholder="Search by name or exact mobile number..."
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-clinic-green bg-white" />
              </div>
              <button onClick={searchPatients}
                className="bg-clinic-green hover:bg-clinic-green-dark text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition">
                Search
              </button>
              {ptSelected && (
                <button onClick={() => { setPtSelected(null); setPtAppts([]); setPtSearched(false); }}
                  className="border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold px-4 py-2.5 rounded-xl text-sm transition">
                  ← Back
                </button>
              )}
            </div>

            {ptLoading && <Loading text="Searching patients..." />}

            {!ptLoading && !ptSelected && ptResults.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="divide-y divide-gray-50">
                  {ptResults.map((pt) => (
                    <button key={pt.id} onClick={() => selectPatient(pt)}
                      className="w-full text-left px-5 py-4 hover:bg-gray-50 transition flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-800">{pt.full_name}</p>
                        <p className="text-sm text-gray-500 mt-0.5">{pt.mobile} · {pt.gender || 'Gender N/A'} · DOB: {fmtDate(pt.dob)}</p>
                        {pt.address && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-md">{pt.address}</p>}
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-clinic-green-lite text-clinic-green">
                          {pt.total_visits || 0} visits
                        </span>
                        {generatePatientCode(pt.full_name, pt.mobile) && (
                          <p className="text-xs font-bold text-gray-500 mt-1">{generatePatientCode(pt.full_name, pt.mobile)}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!ptLoading && ptSearched && !ptSelected && ptResults.length === 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center text-gray-400">
                <p className="font-medium text-gray-500">No patients found</p>
                <p className="text-sm mt-1">Try searching with the exact mobile number for a precise match</p>
              </div>
            )}

            {ptSelected && (
              <div className="space-y-5">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 bg-clinic-green-lite border-b border-green-100">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{ptSelected.full_name}</h3>
                        <p className="text-sm text-gray-600 mt-0.5">
                          {ptSelected.mobile} · {ptSelected.gender || 'Gender N/A'} · DOB: {fmtDate(ptSelected.dob)}
                        </p>
                        {ptSelected.address && <p className="text-xs text-gray-500 mt-1">{ptSelected.address}</p>}
                      </div>
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold bg-clinic-green text-white">
                        {ptSelected.total_visits || 0} visits
                      </span>
                    </div>
                  </div>
                  <div className="px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide">Patient ID</p>
                      <p className="text-sm font-bold text-clinic-green mt-0.5">{generatePatientCode(ptSelected.full_name, ptSelected.mobile) || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide">Email</p>
                      <p className="text-sm text-gray-700 mt-0.5">{ptSelected.email || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide">Total Visits</p>
                      <p className="text-sm text-gray-700 mt-0.5">{ptSelected.total_visits || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide">Registered</p>
                      <p className="text-sm text-gray-700 mt-0.5">{fmtDate(ptSelected.created_at)}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h4 className="font-bold text-gray-800">Appointment History</h4>
                    <p className="text-xs text-gray-500 mt-0.5">{ptAppts.length} records</p>
                  </div>
                  {ptApptLoading ? <Loading text="Loading history..." /> : ptAppts.length === 0 ? (
                    <Empty text="No appointments on record" />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100">
                            {['Doctor', 'Date', 'Time', 'Channel', 'Status', 'Notes'].map((h) => (
                              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {ptAppts.map((a) => {
                            const s = a.status || 'upcoming';
                            return (
                              <tr key={a.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3">
                                  <p className="font-semibold text-gray-800 whitespace-nowrap">{a.doctor_name}</p>
                                  <p className="text-xs text-gray-400">{a.specialty}</p>
                                </td>
                                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmtDate(a.appointment_date)}</td>
                                <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{a.appointment_time}</td>
                                <td className="px-4 py-3">
                                  <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600 capitalize">{a.booking_channel || 'website'}</span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLE[s] || STATUS_STYLE.upcoming}`}>
                                    {STATUS_LABEL[s] || s}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px] truncate">{a.notes || '—'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════════ */}
        {/* ── Callbacks tab ── */}
        {/* ══════════════════════════════════════════════════════ */}
        {activeTab === 'callbacks' && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-green-500 uppercase tracking-wide mb-1">Total Requests</p>
                <p className="text-3xl font-bold text-green-700">{callbacks.length}</p>
              </div>
              <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-orange-500 uppercase tracking-wide mb-1">Pending</p>
                <p className="text-3xl font-bold text-orange-700">{pendingCb}</p>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-1">Completed</p>
                <p className="text-3xl font-bold text-blue-700">{callbacks.filter((c) => c.status === 'done').length}</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {cbLoading ? <Loading text="Loading callbacks..." /> : callbacks.length === 0 ? (
                <Empty text="No callback requests yet" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        {['Name', 'Mobile', 'Preferred Time', 'Status', 'Received', 'Action'].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {callbacks.map((cb) => (
                        <tr key={cb.id} className={`transition-colors ${cb.status === 'pending' ? 'hover:bg-amber-50/30' : 'hover:bg-gray-50'}`}>
                          <td className="px-4 py-3 font-semibold text-gray-800 whitespace-nowrap">{cb.patient_name}</td>
                          <td className="px-4 py-3">
                            <a href={`tel:${cb.mobile}`} className="text-clinic-green hover:underline font-medium">{cb.mobile}</a>
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">{cb.preferred_time}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${cb.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                              {cb.status === 'pending' ? 'Pending' : 'Done'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{fmtDateTime(cb.created_at)}</td>
                          <td className="px-4 py-3">
                            {cb.status === 'pending' ? (
                              <button onClick={() => markCallbackDone(cb.id)} disabled={markingId === cb.id}
                                className="bg-clinic-green hover:bg-clinic-green-dark disabled:opacity-60 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition">
                                {markingId === cb.id ? '...' : '✓ Done'}
                              </button>
                            ) : <span className="text-xs text-gray-400">Completed</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════════ */}
        {/* ── Analytics tab ── */}
        {/* ══════════════════════════════════════════════════════ */}
        {activeTab === 'analytics' && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-1">Total (30d)</p>
                <p className="text-3xl font-bold text-blue-700">{recent30.length}</p>
              </div>
              <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-green-500 uppercase tracking-wide mb-1">Completed (30d)</p>
                <p className="text-3xl font-bold text-green-700">{byStatus.completed || 0}</p>
              </div>
              <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-1">No-shows (30d)</p>
                <p className="text-3xl font-bold text-red-700">{byStatus.no_show || 0}</p>
                <p className="text-xs text-red-500 mt-1">{noShowRate}% rate</p>
              </div>
              <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-orange-500 uppercase tracking-wide mb-1">Cancelled (30d)</p>
                <p className="text-3xl font-bold text-orange-700">{byStatus.cancelled || 0}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* By Doctor */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h3 className="font-bold text-gray-800 mb-4">Appointments by Doctor (30d)</h3>
                {Object.keys(byDoctor).length === 0 ? (
                  <p className="text-sm text-gray-400">No data for this period</p>
                ) : Object.entries(byDoctor).sort((a, b) => b[1] - a[1]).map(([doc, cnt]) => {
                  const max = Math.max(...Object.values(byDoctor));
                  return (
                    <div key={doc} className="mb-3 last:mb-0">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700 truncate mr-2">{doc}</span>
                        <span className="font-bold text-gray-800 flex-shrink-0">{cnt}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-clinic-green h-2 rounded-full" style={{ width: `${Math.round(cnt / max * 100)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Day of week */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h3 className="font-bold text-gray-800 mb-4">Appointments by Day (30d)</h3>
                <div className="flex items-end gap-2 h-28">
                  {DAY_NAMES.map((day) => {
                    const cnt = recent30.filter((a) => {
                      if (!a.appointment_date) return false;
                      return DAY_NAMES[new Date(a.appointment_date + 'T00:00:00').getDay()] === day;
                    }).length;
                    const maxCnt = Math.max(...DAY_NAMES.map((d) =>
                      recent30.filter((a) => a.appointment_date && DAY_NAMES[new Date(a.appointment_date + 'T00:00:00').getDay()] === d).length
                    ), 1);
                    const h = Math.max(Math.round(cnt / maxCnt * 80), cnt > 0 ? 4 : 0);
                    return (
                      <div key={day} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-xs font-bold text-gray-600">{cnt > 0 ? cnt : ''}</span>
                        <div className="w-full flex justify-center">
                          <div className="w-6 bg-clinic-green rounded-t-sm" style={{ height: `${h}px` }} />
                        </div>
                        <span className="text-xs text-gray-400">{day}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Notify Patients */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-bold text-gray-800 mb-1">Notify Patients</h3>
              <p className="text-xs text-gray-500 mb-4">Send an email notification to all patients of a specific doctor who have provided their email address.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <select value={notifyDoctor} onChange={(e) => { setNotifyDoctor(e.target.value); setNotifyResult(''); }}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-clinic-green bg-white text-gray-700">
                    <option value="">Select doctor...</option>
                    {doctors.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
                  </select>
                  <textarea value={notifyMsg} onChange={(e) => { setNotifyMsg(e.target.value); setNotifyResult(''); }}
                    placeholder="Type your message to patients..."
                    rows={5}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-clinic-green resize-none" />
                </div>
                <div className="flex flex-col justify-between gap-3">
                  <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-700">
                    <p className="font-semibold mb-1">Before sending:</p>
                    <ul className="list-disc pl-4 space-y-0.5">
                      <li>Only patients with email addresses will receive this</li>
                      <li>Email will be sent from the clinic address</li>
                      <li>This action cannot be undone</li>
                    </ul>
                  </div>
                  {notifyResult && (
                    <p className={`text-sm font-semibold px-4 py-3 rounded-xl border ${notifyResult.startsWith('Sent') ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-600'}`}>
                      {notifyResult}
                    </p>
                  )}
                  <button onClick={sendNotifications} disabled={notifySending || !notifyDoctor || !notifyMsg.trim()}
                    className="w-full bg-clinic-green hover:bg-clinic-green-dark disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition text-sm flex items-center justify-center gap-2">
                    {notifySending ? (
                      <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Sending...</>
                    ) : 'Send Notifications'}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Notes Modal ── */}
      {notesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setNotesModal(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-gray-900 mb-1">Appointment Note</h3>
            <p className="text-xs text-gray-500 mb-4">Add or edit a note for this appointment. Notes are visible to staff only.</p>
            <textarea
              value={notesModal.text}
              onChange={(e) => setNotesModal((m) => ({ ...m, text: e.target.value }))}
              placeholder="Enter note here..."
              rows={4}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-clinic-green resize-none mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button onClick={() => setNotesModal(null)}
                className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition text-sm">
                Cancel
              </button>
              <button onClick={saveNotes} disabled={savingNotes}
                className="flex-1 bg-clinic-green hover:bg-clinic-green-dark disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition text-sm">
                {savingNotes ? 'Saving...' : 'Save Note'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TabBtn({ label, count, active, onClick, badge }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${active ? 'border-clinic-green text-clinic-green' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
      {label}
      {count > 0 && (
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${active ? (badge ? 'bg-amber-100 text-amber-700' : 'bg-clinic-green-lite text-clinic-green') : 'bg-gray-100 text-gray-500'}`}>
          {count}
        </span>
      )}
    </button>
  );
}

function Loading({ text }) {
  return (
    <div className="flex items-center justify-center py-20 text-gray-400">
      <svg className="w-5 h-5 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      {text}
    </div>
  );
}

function Empty({ text }) {
  return (
    <div className="text-center py-16 text-gray-400">
      <svg className="w-12 h-12 mx-auto mb-3 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      <p className="font-medium text-gray-500">{text}</p>
    </div>
  );
}
