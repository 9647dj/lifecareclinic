/**
 * Admin — privileged management panel (separate from the Staff dashboard)
 *
 * Tabs:
 *   Overview     — live KPI cards and 30-day trend charts via Recharts
 *   Appointments — full appointment table with status changes and date blocking
 *   Doctors      — CRUD for the doctors table (name, specialty, schedule JSONB)
 *   Staff        — create/disable staff accounts stored in staff_accounts table
 *   Patients     — searchable patient registry with visit history
 *   Callbacks    — callback request management
 *   Analytics    — advanced charts and bulk email notification tool
 *
 * Access: requires adminLogin() to set the admin session flag in AuthContext.
 * Staff can view the Staff dashboard but are redirected away from this page.
 */
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import resend from '../lib/resend';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { mapDoctorRow } from '../hooks/useDoctors';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import logo from '../assets/logo.jpeg';

const STATUS_STYLE = {
  upcoming:  'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  no_show:   'bg-gray-200 text-gray-600',
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const CATEGORIES = [
  'Orthopaedics', 'Paediatrics', 'Dermatology', 'Cardiology',
  'General Medicine', 'ENT', 'Gynaecology', 'Dental', 'Eye Camp', 'Other',
];

const EMPTY_DOC_FORM = { name: '', qualification: '', specialty: '', category: '', days: [], is_eye_camp: false, is_active: true, order_index: 0 };

function to24h(t) {
  if (!t) return '';
  if (/^\d{2}:\d{2}$/.test(t)) return t;
  const cleaned = t.replace(/\s*onwards\s*/i, '').trim();
  const m = cleaned.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return '';
  let h = parseInt(m[1]);
  const ampm = m[3].toUpperCase();
  if (ampm === 'PM' && h !== 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${m[2]}`;
}

function to12h(t) {
  if (!t) return '';
  if (/AM|PM/i.test(t)) return t;
  const [hStr, min] = t.split(':');
  let h = parseInt(hStr);
  const ampm = h >= 12 ? 'PM' : 'AM';
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return `${h}:${min} ${ampm}`;
}

function fmtDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtDateTime(str) {
  if (!str) return '—';
  return new Date(str).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function Admin() {
  const { staffLogout, getStaffName } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('appointments');

  // ── Appointments ──
  const [appointments, setAppointments] = useState([]);
  const [apptLoading, setApptLoading] = useState(true);
  const [apptError, setApptError] = useState('');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('appointment_date');
  const [sortAsc, setSortAsc] = useState(true);
  const [filterDoctor, setFilterDoctor] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  // ── Callbacks ──
  const [callbacks, setCallbacks] = useState([]);
  const [cbLoading, setCbLoading] = useState(true);
  const [cbError, setCbError] = useState('');
  const [markingId, setMarkingId] = useState(null);

  // ── Doctors ──
  const [dbDoctors, setDbDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [showDoctorForm, setShowDoctorForm] = useState(false);
  const [editingDoctorId, setEditingDoctorId] = useState(null);
  const [doctorForm, setDoctorForm] = useState(EMPTY_DOC_FORM);
  const [daySchedule, setDaySchedule] = useState({});
  const [doctorSaving, setDoctorSaving] = useState(false);
  const [doctorMsg, setDoctorMsg] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // ── Blocked Dates ──
  const [blockedDates, setBlockedDates] = useState([]);
  const [newBlockDate, setNewBlockDate] = useState('');
  const [newBlockReason, setNewBlockReason] = useState('');
  const [blockSaving, setBlockSaving] = useState(false);

  // ── Notify Patients ──
  const [notifyDoctor, setNotifyDoctor] = useState('');
  const [notifyDate, setNotifyDate] = useState('');
  const [notifyMessage, setNotifyMessage] = useState('');
  const [notifyPatients, setNotifyPatients] = useState([]);
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [notifySending, setNotifySending] = useState(false);
  const [notifyResult, setNotifyResult] = useState('');

  // ── Manage Staff ──
  const [staffAccounts, setStaffAccounts] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffPw, setNewStaffPw] = useState('');
  const [staffSaving, setStaffSaving] = useState(false);
  const [staffMsg, setStaffMsg] = useState('');
  const [changingPwFor, setChangingPwFor] = useState(null);
  const [inlinePw, setInlinePw] = useState('');

  useEffect(() => {
    fetchAppointments();
    fetchCallbacks();
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (activeTab === 'staff') fetchStaffAccounts();
    if (activeTab === 'blocked') fetchBlockedDates();
  }, [activeTab]);

  // ── Fetch functions ──
  async function fetchAppointments() {
    setApptLoading(true); setApptError('');
    const { data, error } = await supabase.from('appointments').select('*').order('created_at', { ascending: false });
    if (error) setApptError('Failed to load: ' + error.message);
    else setAppointments(data || []);
    setApptLoading(false);
  }

  async function fetchCallbacks() {
    setCbLoading(true); setCbError('');
    const { data, error } = await supabase.from('callbacks').select('*').order('created_at', { ascending: false });
    if (error) setCbError('Failed to load: ' + error.message);
    else setCallbacks(data || []);
    setCbLoading(false);
  }

  async function fetchDoctors() {
    setDoctorsLoading(true);
    const { data } = await supabase.from('doctors').select('*').order('order_index');
    setDbDoctors((data || []).map(mapDoctorRow));
    setDoctorsLoading(false);
  }

  async function fetchBlockedDates() {
    const { data } = await supabase.from('blocked_dates').select('*').order('blocked_date');
    setBlockedDates(data || []);
  }

  async function fetchStaffAccounts() {
    setStaffLoading(true);
    const { data } = await supabase.from('staff_accounts').select('*').order('created_at');
    setStaffAccounts(data || []);
    setStaffLoading(false);
  }

  // ── Appointment actions ──
  async function updateAppointmentStatus(id, status) {
    setUpdatingId(id);
    await supabase.from('appointments').update({ status }).eq('id', id);
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    setUpdatingId(null);
  }

  async function markCallbackDone(id) {
    setMarkingId(id);
    await supabase.from('callbacks').update({ status: 'done' }).eq('id', id);
    setCallbacks((prev) => prev.map((c) => (c.id === id ? { ...c, status: 'done' } : c)));
    setMarkingId(null);
  }

  // ── Doctor CRUD ──
  function startAddDoctor() {
    setDoctorForm(EMPTY_DOC_FORM);
    setDaySchedule({});
    setEditingDoctorId(null);
    setDoctorMsg('');
    setShowDoctorForm(true);
  }

  function startEditDoctor(doc) {
    const days = Array.isArray(doc.days) ? doc.days : [];
    const timings = (doc.timings && typeof doc.timings === 'object') ? doc.timings : {};
    const schedule = {};
    days.forEach((day) => {
      const timeRange = timings[day] || '';
      const parts = timeRange.split(' - ');
      schedule[day] = {
        startTime: to24h((parts[0] || '').trim()),
        endTime: to24h((parts[1] || '').trim()),
      };
    });
    setDaySchedule(schedule);
    setDoctorForm({
      name: doc.name || '',
      qualification: doc.qualification || '',
      specialty: doc.specialty || '',
      category: doc.category || '',
      days,
      is_eye_camp: !!doc.isEyeCamp,
      is_active: doc.is_active !== false,
      order_index: doc.order_index || 0,
    });
    setEditingDoctorId(doc.id);
    setDoctorMsg('');
    setShowDoctorForm(true);
  }

  async function saveDoctor() {
    if (!doctorForm.name.trim()) { setDoctorMsg('Doctor name is required'); return; }
    setDoctorSaving(true); setDoctorMsg('');
    const selectedDays = doctorForm.is_eye_camp ? [] : doctorForm.days;
    const timings = selectedDays.reduce((obj, day) => {
      const s = daySchedule[day] || {};
      if (s.startTime) {
        obj[day] = s.endTime
          ? `${to12h(s.startTime)} - ${to12h(s.endTime)}`
          : `${to12h(s.startTime)} onwards`;
      } else {
        obj[day] = '';
      }
      return obj;
    }, {});
    const payload = {
      name: doctorForm.name.trim(),
      qualification: doctorForm.qualification.trim(),
      specialty: doctorForm.specialty.trim(),
      category: doctorForm.category.trim(),
      days: selectedDays,
      timings,
      is_eye_camp: doctorForm.is_eye_camp,
      is_active: doctorForm.is_active,
      order_index: parseInt(doctorForm.order_index) || 0,
    };
    let saveError = null;
    if (editingDoctorId) {
      const { data: affected, error } = await supabase
        .from('doctors').update(payload).eq('id', editingDoctorId).select('id');
      if (error) saveError = error.message;
      else if (!affected || affected.length === 0)
        saveError = 'Permission denied — update was blocked by database policy. Enable write access on the doctors table in Supabase.';
    } else {
      const { error } = await supabase.from('doctors').insert(payload);
      if (error) saveError = error.message;
    }
    if (saveError) {
      setDoctorMsg('Error: ' + saveError);
    } else {
      setShowDoctorForm(false);
      fetchDoctors();
    }
    setDoctorSaving(false);
  }

  async function deleteDoctor(id) {
    await supabase.from('doctors').delete().eq('id', id);
    setDeleteConfirmId(null);
    fetchDoctors();
  }

  async function toggleDoctorActive(doc) {
    await supabase.from('doctors').update({ is_active: !doc.is_active }).eq('id', doc.id);
    fetchDoctors();
  }

  // ── Blocked dates ──
  async function addBlockedDate() {
    if (!newBlockDate) return;
    setBlockSaving(true);
    await supabase.from('blocked_dates').insert({
      blocked_date: newBlockDate,
      reason: newBlockReason.trim() || null,
      created_by: getStaffName(),
    });
    setNewBlockDate(''); setNewBlockReason('');
    setBlockSaving(false);
    fetchBlockedDates();
  }

  async function removeBlockedDate(id) {
    await supabase.from('blocked_dates').delete().eq('id', id);
    setBlockedDates((prev) => prev.filter((d) => d.id !== id));
  }

  // ── Notify Patients ──
  async function loadPatientsForNotification() {
    if (!notifyDoctor || !notifyDate) return;
    setNotifyLoading(true); setNotifyResult('');
    const { data } = await supabase.from('appointments')
      .select('patient_name, mobile, email, appointment_time')
      .eq('doctor_name', notifyDoctor)
      .eq('appointment_date', notifyDate)
      .neq('status', 'cancelled');
    setNotifyPatients(data || []);
    setNotifyLoading(false);
  }

  async function sendNotifications() {
    const patientsWithEmail = notifyPatients.filter((p) => p.email);
    if (patientsWithEmail.length === 0) {
      setNotifyResult('No patients with email addresses found for this slot.');
      return;
    }
    setNotifySending(true); setNotifyResult('');
    for (const p of patientsWithEmail) {
      await resend.emails.send({
        from: 'Life Care Clinic <lifecarejourian@gmail.com>',
        to: p.email,
        subject: `Appointment Reminder — ${notifyDoctor} on ${notifyDate}`,
        html: `
          <h2>Appointment Reminder from Life Care Clinic</h2>
          <p>Dear <b>${p.patient_name}</b>,</p>
          <p><b>Doctor:</b> ${notifyDoctor}</p>
          <p><b>Date:</b> ${notifyDate}</p>
          <p><b>Time:</b> ${p.appointment_time}</p>
          <p>${notifyMessage.replace(/\n/g, '<br/>')}</p>
          <hr/>
          <p style="color:#666;font-size:12px;">Life Care Clinic, Main Road W No 7, Jourian, Near SBI, Jammu Kashmir 181202. For queries call 01924-467500.</p>
        `,
      }).catch((err) => console.error('[Admin] notify email error:', err));
    }
    await supabase.from('notification_logs').insert({
      doctor_name: notifyDoctor,
      appointment_date: notifyDate,
      recipients_count: patientsWithEmail.length,
      template_message: notifyMessage,
      sent_by: getStaffName(),
    });
    setNotifyResult(`Sent to ${patientsWithEmail.length} patient${patientsWithEmail.length !== 1 ? 's' : ''} with email (${notifyPatients.length} total booked).`);
    setNotifySending(false);
  }

  // ── Staff management ──
  async function createStaffAccount(e) {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffPw.trim()) return;
    setStaffSaving(true); setStaffMsg('');
    const { error } = await supabase.from('staff_accounts').insert({
      full_name: newStaffName.trim(), password: newStaffPw.trim(), role: 'staff', is_active: true,
    });
    if (error) setStaffMsg('Error: ' + error.message);
    else { setStaffMsg('Staff account created!'); setNewStaffName(''); setNewStaffPw(''); fetchStaffAccounts(); }
    setStaffSaving(false);
  }

  async function toggleStaffActive(id, current) {
    await supabase.from('staff_accounts').update({ is_active: !current }).eq('id', id);
    setStaffAccounts((prev) => prev.map((s) => (s.id === id ? { ...s, is_active: !current } : s)));
  }

  async function saveInlinePassword(id) {
    if (!inlinePw.trim()) return;
    await supabase.from('staff_accounts').update({ password: inlinePw.trim() }).eq('id', id);
    setChangingPwFor(null); setInlinePw('');
  }

  function handleLogout() { staffLogout(); navigate('/'); }

  function clearApptFilters() {
    setSearch(''); setFilterDoctor('All'); setFilterStatus('All'); setFilterDateFrom(''); setFilterDateTo('');
  }

  function exportCSV() {
    const headers = ['Doctor', 'Category', 'Specialty', 'Patient Name', 'DOB', 'Mobile', 'Email', 'Address', 'Appointment Date', 'Appointment Time', 'Channel', 'Status', 'Booked On'];
    const rows = appointments.map((a) => [
      a.doctor_name, a.category, a.specialty, a.patient_name, a.dob, a.mobile, a.email, a.address,
      a.appointment_date, a.appointment_time, a.booking_channel || 'website', a.status || 'upcoming',
      a.created_at ? new Date(a.created_at).toLocaleString('en-IN') : '',
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${(v || '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lifecare_appointments_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Computed values ──
  const todayStr     = new Date().toISOString().split('T')[0];
  const todayDayName = DAY_NAMES[new Date().getDay()];
  const doctorOptions = ['All', ...new Set(appointments.map((a) => a.doctor_name).filter(Boolean))];
  const pendingCount  = callbacks.filter((c) => c.status === 'pending').length;

  const visitingToday = dbDoctors.filter(
    (d) => d.is_active && d.schedule && d.schedule.some((s) => s.day === todayDayName)
  );
  const todayAppts = appointments.filter((a) => a.appointment_date === todayStr);
  const patientsPerDoctorToday = todayAppts.reduce((acc, a) => {
    if (a.doctor_name) acc[a.doctor_name] = (acc[a.doctor_name] || 0) + 1;
    return acc;
  }, {});

  const hasApptFilters = search || filterDoctor !== 'All' || filterStatus !== 'All' || filterDateFrom || filterDateTo;

  const filteredAppts = appointments
    .filter((a) => {
      const q = search.toLowerCase();
      const matchSearch = !q || a.patient_name?.toLowerCase().includes(q) || a.mobile?.includes(q) || a.doctor_name?.toLowerCase().includes(q) || a.address?.toLowerCase().includes(q);
      const matchDoctor = filterDoctor === 'All' || a.doctor_name === filterDoctor;
      const matchStatus = filterStatus === 'All' || (a.status || 'upcoming') === filterStatus;
      const matchFrom = !filterDateFrom || a.appointment_date >= filterDateFrom;
      const matchTo   = !filterDateTo   || a.appointment_date <= filterDateTo;
      return matchSearch && matchDoctor && matchStatus && matchFrom && matchTo;
    })
    .sort((a, b) => {
      const va = a[sortKey] ?? ''; const vb = b[sortKey] ?? '';
      return sortAsc ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });

  function toggleSort(key) {
    if (sortKey === key) setSortAsc((p) => !p); else { setSortKey(key); setSortAsc(true); }
  }

  // Analytics data
  const bookingsByDay = appointments.reduce((acc, a) => {
    if (a.appointment_date) acc[a.appointment_date] = (acc[a.appointment_date] || 0) + 1;
    return acc;
  }, {});
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (29 - i));
    const key = d.toISOString().split('T')[0];
    return { date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), count: bookingsByDay[key] || 0 };
  });
  const bookingsByDoctor = Object.entries(
    appointments.reduce((acc, a) => { if (a.doctor_name) { acc[a.doctor_name] = (acc[a.doctor_name] || 0) + 1; } return acc; }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, count]) => ({ name: name.replace('Dr. ', ''), count }));

  const SortIcon = ({ col }) => (
    <span className="ml-1 inline-flex flex-col">
      <svg className={`w-2.5 h-2.5 ${sortKey === col && sortAsc ? 'text-clinic-green' : 'text-gray-300'}`} viewBox="0 0 10 6" fill="currentColor"><path d="M0 6l5-6 5 6z" /></svg>
      <svg className={`w-2.5 h-2.5 ${sortKey === col && !sortAsc ? 'text-clinic-green' : 'text-gray-300'}`} viewBox="0 0 10 6" fill="currentColor"><path d="M0 0l5 6 5-6z" /></svg>
    </span>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/"><img src={logo} alt="Life Care Clinic" className="h-10 w-10 rounded-xl object-cover ring-2 ring-green-100" /></Link>
            <div>
              <h1 className="font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-xs text-gray-500">
                Life Care Clinic — Jourian
                {getStaffName() && <span className="ml-1 text-clinic-green">· {getStaffName()}</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => { fetchAppointments(); fetchCallbacks(); fetchDoctors(); }}
              disabled={apptLoading || cbLoading}
              className="flex items-center gap-1.5 text-sm text-clinic-green hover:text-clinic-green-dark font-semibold disabled:opacity-50">
              <svg className={`w-4 h-4 ${(apptLoading || cbLoading) ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <Link to="/" className="text-sm text-gray-500 hover:text-clinic-green font-medium">Home</Link>
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
            <TabBtn label="Appointments" count={appointments.length} active={activeTab === 'appointments'} onClick={() => setActiveTab('appointments')} />
            <TabBtn label="Callbacks" count={pendingCount} badge active={activeTab === 'callbacks'} onClick={() => setActiveTab('callbacks')} />
            <TabBtn label="Analytics" active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />
            <TabBtn label="Doctors" count={dbDoctors.length} active={activeTab === 'doctors'} onClick={() => setActiveTab('doctors')} />
            <TabBtn label="Blocked Dates" active={activeTab === 'blocked'} onClick={() => setActiveTab('blocked')} />
            <TabBtn label="Notify Patients" active={activeTab === 'notify'} onClick={() => setActiveTab('notify')} />
            <TabBtn label="Manage Staff" active={activeTab === 'staff'} onClick={() => setActiveTab('staff')} />
            <TabBtn label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* ── KPI Cards (Appointments + Analytics) ── */}
        {(activeTab === 'appointments' || activeTab === 'analytics') && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-1">Visiting Today</p>
              <p className="text-3xl font-bold text-blue-700">{visitingToday.length}</p>
              <div className="mt-2 space-y-1 max-h-28 overflow-y-auto">
                {visitingToday.length === 0 ? <p className="text-xs text-blue-400">No scheduled visits</p>
                  : visitingToday.map((d) => {
                    const slot = d.schedule.find((s) => s.day === todayDayName);
                    return (
                      <div key={d.id} className="flex items-center justify-between gap-1">
                        <span className="text-xs font-medium text-blue-800 truncate">{d.name}</span>
                        {slot && <span className="text-xs text-blue-500 whitespace-nowrap flex-shrink-0">{slot.startTime}</span>}
                      </div>
                    );
                  })}
              </div>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-green-500 uppercase tracking-wide mb-1">Patients Today</p>
              <p className="text-3xl font-bold text-green-700">{todayAppts.length}</p>
              <p className="text-xs text-green-500 mt-1 opacity-75">of {appointments.length} total</p>
            </div>
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-purple-500 uppercase tracking-wide mb-1">By Doctor Today</p>
              <p className="text-3xl font-bold text-purple-700">{todayAppts.length}</p>
              <div className="mt-2 space-y-1 max-h-28 overflow-y-auto">
                {Object.keys(patientsPerDoctorToday).length === 0 ? <p className="text-xs text-purple-400">No appointments today</p>
                  : Object.entries(patientsPerDoctorToday).map(([doc, cnt]) => (
                    <div key={doc} className="flex items-center justify-between gap-1">
                      <span className="text-xs font-medium text-purple-800 truncate">{doc}</span>
                      <span className="text-xs font-bold text-purple-600 flex-shrink-0">{cnt}p</span>
                    </div>
                  ))}
              </div>
            </div>
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-orange-500 uppercase tracking-wide mb-1">Pending Callbacks</p>
              <p className="text-3xl font-bold text-orange-700">{pendingCount}</p>
              <p className="text-xs text-orange-500 mt-1 opacity-75">awaiting response</p>
            </div>
          </div>
        )}

        {/* ── APPOINTMENTS ── */}
        {activeTab === 'appointments' && (
          <>
            <div className="flex flex-wrap gap-3 mb-5">
              <div className="relative flex-1 min-w-[200px]">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search patient, mobile, doctor..."
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-clinic-green bg-white" />
              </div>
              <select value={filterDoctor} onChange={(e) => setFilterDoctor(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-clinic-green bg-white text-gray-700">
                {doctorOptions.map((d) => <option key={d}>{d}</option>)}
              </select>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-clinic-green bg-white text-gray-700">
                {['All', 'upcoming', 'completed', 'cancelled'].map((s) => <option key={s}>{s}</option>)}
              </select>
              <div className="flex items-center gap-2">
                <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} title="From"
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-clinic-green bg-white text-gray-700" />
                <span className="text-gray-400 text-sm">–</span>
                <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} title="To"
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-clinic-green bg-white text-gray-700" />
              </div>
              {hasApptFilters && (
                <button onClick={clearApptFilters} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2.5 border border-gray-200 rounded-xl bg-white">Clear</button>
              )}
              <button onClick={exportCSV}
                className="flex items-center gap-2 bg-clinic-green hover:bg-clinic-green-dark text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition whitespace-nowrap">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export CSV
              </button>
            </div>

            <p className="text-xs text-gray-400 mb-3">Showing {filteredAppts.length} of {appointments.length} appointments</p>
            {apptError && <ErrorBox msg={apptError} />}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {apptLoading ? <Loading text="Loading appointments..." /> : filteredAppts.length === 0 ? <Empty text="No appointments found" /> : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        {[
                          { key: 'appointment_date', label: 'Date' },
                          { key: 'appointment_time', label: 'Time' },
                          { key: 'doctor_name', label: 'Doctor' },
                          { key: 'patient_name', label: 'Patient' },
                          { key: 'mobile', label: 'Mobile' },
                          { key: 'address', label: 'Address' },
                          { key: 'status', label: 'Status' },
                          { key: 'created_at', label: 'Booked On' },
                        ].map((col) => (
                          <th key={col.key} onClick={() => toggleSort(col.key)}
                            className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-clinic-green select-none whitespace-nowrap">
                            {col.label}<SortIcon col={col.key} />
                          </th>
                        ))}
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredAppts.map((apt) => {
                        const status = apt.status || 'upcoming';
                        return (
                          <tr key={apt.id} className="hover:bg-green-50/40 transition-colors">
                            <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{fmtDate(apt.appointment_date)}</td>
                            <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">{apt.appointment_time}</td>
                            <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{apt.doctor_name}</td>
                            <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{apt.patient_name}</td>
                            <td className="px-4 py-3">
                              <a href={`tel:${apt.mobile}`} className="text-clinic-green hover:underline whitespace-nowrap font-medium">{apt.mobile}</a>
                            </td>
                            <td className="px-4 py-3 text-gray-500 max-w-[160px]">
                              <span className="line-clamp-2 text-xs">{apt.address}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_STYLE[status] || STATUS_STYLE.upcoming}`}>
                                {status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-xs">{fmtDateTime(apt.created_at)}</td>
                            <td className="px-4 py-3">
                              {status === 'upcoming' && (
                                <div className="flex flex-wrap gap-1.5">
                                  <button onClick={() => updateAppointmentStatus(apt.id, 'completed')} disabled={updatingId === apt.id}
                                    className="text-xs bg-green-100 hover:bg-green-200 text-green-700 font-semibold px-2.5 py-1 rounded-lg disabled:opacity-50 whitespace-nowrap transition">✓ Done</button>
                                  <button onClick={() => updateAppointmentStatus(apt.id, 'no_show')} disabled={updatingId === apt.id}
                                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-2.5 py-1 rounded-lg disabled:opacity-50 whitespace-nowrap transition">No Show</button>
                                  <button onClick={() => updateAppointmentStatus(apt.id, 'cancelled')} disabled={updatingId === apt.id}
                                    className="text-xs bg-red-100 hover:bg-red-200 text-red-700 font-semibold px-2.5 py-1 rounded-lg disabled:opacity-50 whitespace-nowrap transition">✕ Cancel</button>
                                </div>
                              )}
                              {status !== 'upcoming' && <span className="text-xs text-gray-300">—</span>}
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

        {/* ── CALLBACKS ── */}
        {activeTab === 'callbacks' && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-green-500 uppercase tracking-wide mb-1">Total Requests</p>
                <p className="text-3xl font-bold text-green-700">{callbacks.length}</p>
              </div>
              <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-orange-500 uppercase tracking-wide mb-1">Pending</p>
                <p className="text-3xl font-bold text-orange-700">{pendingCount}</p>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-1">Completed</p>
                <p className="text-3xl font-bold text-blue-700">{callbacks.filter((c) => c.status === 'done').length}</p>
              </div>
            </div>
            {cbError && <ErrorBox msg={cbError} />}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {cbLoading ? <Loading text="Loading callback requests..." /> : callbacks.length === 0 ? <Empty text="No callback requests yet" /> : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        {['Name', 'Mobile', 'Preferred Time', 'Status', 'Received On', 'Action'].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {callbacks.map((cb) => (
                        <tr key={cb.id} className={`transition-colors ${cb.status === 'pending' ? 'hover:bg-amber-50/30' : 'hover:bg-gray-50'}`}>
                          <td className="px-4 py-3 font-semibold text-gray-800 whitespace-nowrap">{cb.patient_name}</td>
                          <td className="px-4 py-3"><a href={`tel:${cb.mobile}`} className="text-clinic-green hover:underline font-medium whitespace-nowrap">{cb.mobile}</a></td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">{cb.preferred_time}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${cb.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                              {cb.status === 'pending' ? 'Pending' : 'Done'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-xs">{fmtDateTime(cb.created_at)}</td>
                          <td className="px-4 py-3">
                            {cb.status === 'pending' ? (
                              <button onClick={() => markCallbackDone(cb.id)} disabled={markingId === cb.id}
                                className="flex items-center gap-1.5 bg-clinic-green hover:bg-clinic-green-dark disabled:opacity-60 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition whitespace-nowrap">
                                {markingId === cb.id ? '...' : '✓ Mark Done'}
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

        {/* ── ANALYTICS ── */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4">Appointments — Last 30 Days</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={last30Days} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="count" name="Appointments" stroke="#2d7a4e" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Bookings by Doctor</h3>
                <button onClick={exportCSV} className="flex items-center gap-2 text-sm font-semibold text-clinic-green hover:text-clinic-green-dark">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export CSV
                </button>
              </div>
              {bookingsByDoctor.length === 0 ? <p className="text-sm text-gray-400">No data yet</p> : (
                <ResponsiveContainer width="100%" height={Math.max(160, bookingsByDoctor.length * 36)}>
                  <BarChart data={bookingsByDoctor} layout="vertical" margin={{ top: 0, right: 24, bottom: 0, left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
                    <Tooltip contentStyle={{ fontSize: 12 }} />
                    <Bar dataKey="count" name="Bookings" fill="#2d7a4e" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}

        {/* ── DOCTORS ── */}
        {activeTab === 'doctors' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-gray-900">Manage Doctors</h2>
                <p className="text-sm text-gray-500">{dbDoctors.length} doctor{dbDoctors.length !== 1 ? 's' : ''} total</p>
              </div>
              <button onClick={startAddDoctor}
                className="flex items-center gap-2 bg-clinic-green hover:bg-clinic-green-dark text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition">
                + Add Doctor
              </button>
            </div>

            {doctorsLoading ? <Loading text="Loading doctors..." /> : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        {['#', 'Doctor', 'Category', 'Schedule', 'Status', 'Actions'].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {dbDoctors.map((doc) => (
                        <tr key={doc.id} className={`transition-colors ${doc.is_active ? 'hover:bg-gray-50' : 'bg-gray-50/60 opacity-60'}`}>
                          <td className="px-4 py-3 text-gray-400 text-xs">{doc.order_index}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className={`${doc.color} w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                                {doc.initials}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-800 whitespace-nowrap">{doc.name}</p>
                                <p className="text-xs text-gray-400 truncate max-w-[200px]">{doc.specialty}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${doc.badgeColor}`}>
                              {doc.category}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">
                            {doc.isEyeCamp ? 'Eye Camp (on request)' :
                              doc.days?.length
                                ? doc.days.map((d) => d.substring(0, 3)).join(', ')
                                : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${doc.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {doc.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button onClick={() => startEditDoctor(doc)}
                                className="text-xs text-blue-600 hover:text-blue-700 font-medium">Edit</button>
                              <button onClick={() => toggleDoctorActive(doc)}
                                className={`text-xs font-medium ${doc.is_active ? 'text-amber-600 hover:text-amber-700' : 'text-green-600 hover:text-green-700'}`}>
                                {doc.is_active ? 'Disable' : 'Enable'}
                              </button>
                              {deleteConfirmId === doc.id ? (
                                <div className="flex items-center gap-1">
                                  <button onClick={() => deleteDoctor(doc.id)} className="text-xs text-red-600 font-semibold">Confirm</button>
                                  <button onClick={() => setDeleteConfirmId(null)} className="text-xs text-gray-400">Cancel</button>
                                </div>
                              ) : (
                                <button onClick={() => setDeleteConfirmId(doc.id)} className="text-xs text-red-500 hover:text-red-600 font-medium">Delete</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Doctor Add/Edit Modal */}
            {showDoctorForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowDoctorForm(false)}>
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                  <div className="px-6 py-5 border-b border-gray-100">
                    <h2 className="font-bold text-gray-900">{editingDoctorId ? 'Edit Doctor' : 'Add New Doctor'}</h2>
                  </div>
                  <div className="px-6 py-5 space-y-4">
                    {doctorMsg && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{doctorMsg}</div>}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                      <input value={doctorForm.name} onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })}
                        placeholder="Dr. Full Name" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-clinic-green" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
                      <input value={doctorForm.qualification} onChange={(e) => setDoctorForm({ ...doctorForm, qualification: e.target.value })}
                        placeholder="e.g. M.B.B.S., M.D." className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-clinic-green" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Specialty</label>
                      <input value={doctorForm.specialty} onChange={(e) => setDoctorForm({ ...doctorForm, specialty: e.target.value })}
                        placeholder="e.g. Orthopaedic Surgeon" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-clinic-green" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select value={doctorForm.category} onChange={(e) => setDoctorForm({ ...doctorForm, category: e.target.value })}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-clinic-green bg-white">
                        <option value="">Select category...</option>
                        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={doctorForm.is_eye_camp} onChange={(e) => setDoctorForm({ ...doctorForm, is_eye_camp: e.target.checked })}
                          className="w-4 h-4 accent-clinic-green" />
                        <span className="text-sm font-medium text-gray-700">Eye Camp (no fixed schedule)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={doctorForm.is_active} onChange={(e) => setDoctorForm({ ...doctorForm, is_active: e.target.checked })}
                          className="w-4 h-4 accent-clinic-green" />
                        <span className="text-sm font-medium text-gray-700">Active</span>
                      </label>
                    </div>

                    {!doctorForm.is_eye_camp && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Schedule</label>
                        <div className="space-y-2.5">
                          {WEEKDAYS.map((day) => {
                            const checked = doctorForm.days.includes(day);
                            const ds = daySchedule[day] || { startTime: '', endTime: '' };
                            return (
                              <div key={day} className="flex items-center gap-3">
                                <label className="flex items-center gap-2 w-14 cursor-pointer select-none flex-shrink-0">
                                  <input type="checkbox"
                                    checked={checked}
                                    onChange={(e) => {
                                      const updated = e.target.checked
                                        ? [...doctorForm.days, day]
                                        : doctorForm.days.filter((d) => d !== day);
                                      setDoctorForm({ ...doctorForm, days: updated });
                                      if (e.target.checked) {
                                        setDaySchedule((prev) => ({ ...prev, [day]: { startTime: '', endTime: '' } }));
                                      } else {
                                        setDaySchedule((prev) => { const n = { ...prev }; delete n[day]; return n; });
                                      }
                                    }}
                                    className="w-4 h-4 accent-clinic-green" />
                                  <span className="text-sm font-medium text-gray-700">{day}</span>
                                </label>
                                {checked && (
                                  <>
                                    <div className="flex-1">
                                      <input type="time" value={ds.startTime}
                                        onChange={(e) => setDaySchedule((prev) => ({ ...prev, [day]: { ...prev[day], startTime: e.target.value } }))}
                                        className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-1 focus:ring-clinic-green" />
                                      {ds.startTime && <p className="text-xs text-gray-400 mt-0.5 text-center">{to12h(ds.startTime)}</p>}
                                    </div>
                                    <span className="text-gray-400 text-sm flex-shrink-0">–</span>
                                    <div className="flex-1">
                                      <input type="time" value={ds.endTime}
                                        onChange={(e) => setDaySchedule((prev) => ({ ...prev, [day]: { ...prev[day], endTime: e.target.value } }))}
                                        className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-1 focus:ring-clinic-green" />
                                      {ds.endTime
                                        ? <p className="text-xs text-gray-400 mt-0.5 text-center">{to12h(ds.endTime)}</p>
                                        : ds.startTime && <p className="text-xs text-gray-400 mt-0.5 text-center">onwards</p>}
                                    </div>
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <p className="text-xs text-gray-400 mt-2">Leave end time empty to save as "onwards"</p>
                      </div>
                    )}
                  </div>
                  <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
                    <button onClick={() => setShowDoctorForm(false)}
                      className="px-5 py-2.5 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition">
                      Cancel
                    </button>
                    <button onClick={saveDoctor} disabled={doctorSaving}
                      className="px-5 py-2.5 text-sm font-semibold text-white bg-clinic-green hover:bg-clinic-green-dark disabled:opacity-60 rounded-xl transition">
                      {doctorSaving ? 'Saving...' : editingDoctorId ? 'Save Changes' : 'Add Doctor'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── BLOCKED DATES ── */}
        {activeTab === 'blocked' && (
          <div className="space-y-6 max-w-xl">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-1">Block a Date</h3>
              <p className="text-sm text-gray-500 mb-4">Blocked dates won't appear in the online booking calendar</p>
              <div className="space-y-3">
                <input type="date" value={newBlockDate} onChange={(e) => setNewBlockDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-clinic-green" />
                <input type="text" value={newBlockReason} onChange={(e) => setNewBlockReason(e.target.value)}
                  placeholder="Reason (optional) — e.g. Public holiday"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-clinic-green" />
                <button onClick={addBlockedDate} disabled={!newBlockDate || blockSaving}
                  className="w-full bg-clinic-green hover:bg-clinic-green-dark disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition text-sm">
                  {blockSaving ? 'Blocking...' : 'Block Date'}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900">Blocked Dates ({blockedDates.length})</h3>
              </div>
              {blockedDates.length === 0 ? <Empty text="No dates blocked" /> : (
                <div className="divide-y divide-gray-50">
                  {blockedDates.map((bd) => (
                    <div key={bd.id} className="flex items-center justify-between px-6 py-3">
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{fmtDate(bd.blocked_date)}</p>
                        {bd.reason && <p className="text-xs text-gray-400">{bd.reason}</p>}
                      </div>
                      <button onClick={() => removeBlockedDate(bd.id)}
                        className="text-xs text-red-500 hover:text-red-600 font-medium">Unblock</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── NOTIFY PATIENTS ── */}
        {activeTab === 'notify' && (
          <div className="space-y-6 max-w-2xl">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-1">Notify Patients by Appointment</h3>
              <p className="text-sm text-gray-500 mb-5">Send an email to all patients booked for a specific doctor on a given date</p>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
                  <select value={notifyDoctor} onChange={(e) => { setNotifyDoctor(e.target.value); setNotifyPatients([]); setNotifyResult(''); }}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-clinic-green bg-white">
                    <option value="">Select doctor...</option>
                    {doctorOptions.slice(1).map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Appointment Date</label>
                  <input type="date" value={notifyDate} onChange={(e) => { setNotifyDate(e.target.value); setNotifyPatients([]); setNotifyResult(''); }}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-clinic-green" />
                </div>
              </div>

              <button onClick={loadPatientsForNotification} disabled={!notifyDoctor || !notifyDate || notifyLoading}
                className="mb-5 text-sm font-semibold text-clinic-green hover:text-clinic-green-dark disabled:opacity-50">
                {notifyLoading ? 'Loading...' : 'Load Patients →'}
              </button>

              {notifyPatients.length > 0 && (
                <>
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">{notifyPatients.length} patient{notifyPatients.length !== 1 ? 's' : ''} found — {notifyPatients.filter((p) => p.email).length} with email</p>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {notifyPatients.map((p, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="text-gray-700 font-medium">{p.patient_name}</span>
                          <span className={p.email ? 'text-green-600' : 'text-gray-400'}>{p.email || 'No email'}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                    <textarea value={notifyMessage} onChange={(e) => setNotifyMessage(e.target.value)}
                      rows={4} placeholder="Enter your message to patients..."
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-clinic-green resize-none" />
                  </div>

                  <button onClick={sendNotifications} disabled={notifySending || !notifyMessage.trim()}
                    className="w-full bg-clinic-green hover:bg-clinic-green-dark disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition text-sm">
                    {notifySending ? 'Sending...' : `Send Notification to ${notifyPatients.filter((p) => p.email).length} Patient(s)`}
                  </button>

                  {notifyResult && (
                    <div className="mt-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                      {notifyResult}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* ── MANAGE STAFF ── */}
        {activeTab === 'staff' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-1">Create Staff Account</h3>
              <p className="text-sm text-gray-500 mb-5">Add a new staff login with name and password</p>
              {staffMsg && (
                <div className={`text-sm rounded-xl px-4 py-3 mb-4 ${staffMsg.startsWith('Error') ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'}`}>
                  {staffMsg}
                </div>
              )}
              <form onSubmit={createStaffAccount} className="flex flex-wrap gap-3 items-end">
                <div className="flex-1 min-w-[180px]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input type="text" value={newStaffName} onChange={(e) => { setNewStaffName(e.target.value); setStaffMsg(''); }}
                    placeholder="e.g. Priya Sharma"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-clinic-green" />
                </div>
                <div className="flex-1 min-w-[180px]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input type="text" value={newStaffPw} onChange={(e) => { setNewStaffPw(e.target.value); setStaffMsg(''); }}
                    placeholder="Set a password"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-clinic-green" />
                </div>
                <button type="submit" disabled={staffSaving || !newStaffName.trim() || !newStaffPw.trim()}
                  className="bg-clinic-green hover:bg-clinic-green-dark disabled:opacity-60 text-white font-semibold py-2.5 px-6 rounded-xl transition text-sm whitespace-nowrap">
                  {staffSaving ? 'Creating...' : '+ Create Account'}
                </button>
              </form>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900">Staff Accounts</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{staffAccounts.length} account{staffAccounts.length !== 1 ? 's' : ''} total</p>
                </div>
                <button onClick={fetchStaffAccounts} disabled={staffLoading} className="text-sm text-clinic-green hover:text-clinic-green-dark font-semibold disabled:opacity-50">Refresh</button>
              </div>
              {staffLoading ? <Loading text="Loading staff accounts..." /> : staffAccounts.length === 0 ? <Empty text="No staff accounts found" /> : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        {['Name', 'Role', 'Status', 'Actions'].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {staffAccounts.map((staff) => (
                        <tr key={staff.id} className={`transition-colors ${staff.is_active ? 'hover:bg-gray-50' : 'bg-gray-50/50 opacity-60'}`}>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-gray-800">{staff.full_name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">Added {fmtDate(staff.created_at)}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${staff.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                              {staff.role}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${staff.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {staff.is_active ? 'Active' : 'Disabled'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap items-center gap-2">
                              {changingPwFor === staff.id ? (
                                <div className="flex items-center gap-1.5">
                                  <input type="text" value={inlinePw} onChange={(e) => setInlinePw(e.target.value)}
                                    placeholder="New password"
                                    className="border border-gray-200 rounded-lg px-2.5 py-1 text-xs w-28 outline-none focus:ring-1 focus:ring-clinic-green"
                                    autoFocus />
                                  <button onClick={() => saveInlinePassword(staff.id)} disabled={!inlinePw.trim()}
                                    className="text-xs bg-clinic-green disabled:opacity-50 text-white px-2.5 py-1 rounded-lg font-semibold transition">Save</button>
                                  <button onClick={() => { setChangingPwFor(null); setInlinePw(''); }} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                                </div>
                              ) : (
                                <button onClick={() => { setChangingPwFor(staff.id); setInlinePw(''); }}
                                  className="text-xs text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap">Change Password</button>
                              )}
                              {staff.role !== 'admin' && (
                                <button onClick={() => toggleStaffActive(staff.id, staff.is_active)}
                                  className={`text-xs font-medium whitespace-nowrap ${staff.is_active ? 'text-red-500 hover:text-red-600' : 'text-green-600 hover:text-green-700'}`}>
                                  {staff.is_active ? 'Disable' : 'Enable'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── SETTINGS ── */}
        {activeTab === 'settings' && (
          <div className="max-w-lg space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-1">Staff Accounts</h3>
              <p className="text-sm text-gray-500 mb-5">
                Manage staff logins from the{' '}
                <button onClick={() => setActiveTab('staff')} className="text-clinic-green font-semibold hover:underline">Manage Staff</button>{' '}
                tab. Create, enable/disable, and change passwords there.
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-1">Export Data</h3>
              <p className="text-sm text-gray-500 mb-5">Download all appointment records as a CSV file</p>
              <button onClick={exportCSV} className="flex items-center gap-2 bg-clinic-green hover:bg-clinic-green-dark text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export Appointments CSV
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TabBtn({ label, count, active, onClick, badge }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${active ? 'border-clinic-green text-clinic-green' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
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

function ErrorBox({ msg }) {
  return <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">{msg}</div>;
}
