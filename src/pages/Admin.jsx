import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { doctors } from '../data/doctors';
import logo from '../assets/logo.jpeg';

const STATUS_STYLE = {
  upcoming:  'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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

  // Appointments
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

  // Callbacks
  const [callbacks, setCallbacks] = useState([]);
  const [cbLoading, setCbLoading] = useState(true);
  const [cbError, setCbError] = useState('');
  const [markingId, setMarkingId] = useState(null);

  // Manage Staff
  const [staffAccounts, setStaffAccounts] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffPw, setNewStaffPw] = useState('');
  const [staffSaving, setStaffSaving] = useState(false);
  const [staffMsg, setStaffMsg] = useState('');
  const [changingPwFor, setChangingPwFor] = useState(null);
  const [inlinePw, setInlinePw] = useState('');

  useEffect(() => { fetchAppointments(); fetchCallbacks(); }, []);

  useEffect(() => {
    if (activeTab === 'staff') fetchStaffAccounts();
  }, [activeTab]);

  async function fetchAppointments() {
    setApptLoading(true);
    setApptError('');
    const { data, error } = await supabase.from('appointments').select('*').order('created_at', { ascending: false });
    if (error) setApptError('Failed to load: ' + error.message);
    else setAppointments(data || []);
    setApptLoading(false);
  }

  async function fetchCallbacks() {
    setCbLoading(true);
    setCbError('');
    const { data, error } = await supabase.from('callbacks').select('*').order('created_at', { ascending: false });
    if (error) setCbError('Failed to load: ' + error.message);
    else setCallbacks(data || []);
    setCbLoading(false);
  }

  async function fetchStaffAccounts() {
    setStaffLoading(true);
    const { data } = await supabase.from('staff_accounts').select('*').order('created_at', { ascending: true });
    setStaffAccounts(data || []);
    setStaffLoading(false);
  }

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

  async function createStaffAccount(e) {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffPw.trim()) return;
    setStaffSaving(true);
    setStaffMsg('');
    const { error } = await supabase.from('staff_accounts').insert({
      full_name: newStaffName.trim(),
      password: newStaffPw.trim(),
      role: 'staff',
      is_active: true,
    });
    if (error) {
      setStaffMsg('Error: ' + error.message);
    } else {
      setStaffMsg('Staff account created successfully!');
      setNewStaffName('');
      setNewStaffPw('');
      fetchStaffAccounts();
    }
    setStaffSaving(false);
  }

  async function toggleStaffActive(id, current) {
    await supabase.from('staff_accounts').update({ is_active: !current }).eq('id', id);
    setStaffAccounts((prev) => prev.map((s) => (s.id === id ? { ...s, is_active: !current } : s)));
  }

  async function saveInlinePassword(id) {
    if (!inlinePw.trim()) return;
    await supabase.from('staff_accounts').update({ password: inlinePw.trim() }).eq('id', id);
    setStaffAccounts((prev) => prev.map((s) => (s.id === id ? { ...s, password: inlinePw.trim() } : s)));
    setChangingPwFor(null);
    setInlinePw('');
  }

  function handleLogout() {
    staffLogout();
    navigate('/');
  }

  function clearApptFilters() {
    setSearch('');
    setFilterDoctor('All');
    setFilterStatus('All');
    setFilterDateFrom('');
    setFilterDateTo('');
  }

  function exportCSV() {
    const headers = ['Doctor', 'Specialty', 'Patient Name', 'DOB', 'Mobile', 'Address', 'Appointment Date', 'Appointment Time', 'Status', 'Booked On'];
    const rows = appointments.map((a) => [
      a.doctor_name, a.specialty, a.patient_name, a.dob, a.mobile, a.address,
      a.appointment_date, a.appointment_time, a.status || 'upcoming',
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

  const todayStr = new Date().toISOString().split('T')[0];
  const todayDayName = DAY_NAMES[new Date().getDay()];
  const doctorOptions = ['All', ...new Set(appointments.map((a) => a.doctor_name).filter(Boolean))];
  const pendingCount = callbacks.filter((c) => c.status === 'pending').length;

  // KPI computations
  const visitingToday = doctors.filter(
    (d) => d.schedule && d.schedule.some((s) => s.day === todayDayName)
  );
  const todayAppts = appointments.filter((a) => a.appointment_date === todayStr);
  const patientsPerDoctorToday = todayAppts.reduce((acc, a) => {
    if (a.doctor_name) acc[a.doctor_name] = (acc[a.doctor_name] || 0) + 1;
    return acc;
  }, {});

  // Analytics
  const bookingsByDoctor = Object.entries(
    appointments.reduce((acc, a) => { acc[a.doctor_name] = (acc[a.doctor_name] || 0) + 1; return acc; }, {})
  ).sort((a, b) => b[1] - a[1]);

  const bookingsByDay = appointments.reduce((acc, a) => {
    if (a.appointment_date) acc[a.appointment_date] = (acc[a.appointment_date] || 0) + 1;
    return acc;
  }, {});
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().split('T')[0];
    return { label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), count: bookingsByDay[key] || 0 };
  });

  const hasApptFilters = search || filterDoctor !== 'All' || filterStatus !== 'All' || filterDateFrom || filterDateTo;

  const filteredAppts = appointments
    .filter((a) => {
      const q = search.toLowerCase();
      const matchSearch = !q || a.patient_name?.toLowerCase().includes(q) || a.mobile?.includes(q) || a.doctor_name?.toLowerCase().includes(q) || a.address?.toLowerCase().includes(q);
      const matchDoctor = filterDoctor === 'All' || a.doctor_name === filterDoctor;
      const matchStatus = filterStatus === 'All' || (a.status || 'upcoming') === filterStatus;
      const matchFrom = !filterDateFrom || a.appointment_date >= filterDateFrom;
      const matchTo = !filterDateTo || a.appointment_date <= filterDateTo;
      return matchSearch && matchDoctor && matchStatus && matchFrom && matchTo;
    })
    .sort((a, b) => {
      const va = a[sortKey] ?? ''; const vb = b[sortKey] ?? '';
      return sortAsc ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });

  function toggleSort(key) {
    if (sortKey === key) setSortAsc((p) => !p);
    else { setSortKey(key); setSortAsc(true); }
  }

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
            <Link to="/">
              <img src={logo} alt="Life Care Clinic" className="h-10 w-10 rounded-xl object-cover ring-2 ring-green-100" />
            </Link>
            <div>
              <h1 className="font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-xs text-gray-500">
                Life Care Clinic — Jourian, Jammu Kashmir
                {getStaffName() && <span className="ml-1 text-clinic-green">· {getStaffName()}</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => { fetchAppointments(); fetchCallbacks(); }}
              disabled={apptLoading || cbLoading}
              className="flex items-center gap-1.5 text-sm text-clinic-green hover:text-clinic-green-dark font-semibold disabled:opacity-50">
              <svg className={`w-4 h-4 ${(apptLoading || cbLoading) ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <Link to="/" className="text-sm text-gray-500 hover:text-clinic-green transition-colors font-medium">Home</Link>
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 transition-colors font-medium">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
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
            <TabBtn label="Manage Staff" active={activeTab === 'staff'} onClick={() => setActiveTab('staff')} />
            <TabBtn label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* ── KPI Cards (shown on Appointments + Analytics tabs) ── */}
        {(activeTab === 'appointments' || activeTab === 'analytics') && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Visiting Doctors Today */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide mb-1">Visiting Today</p>
              <p className="text-3xl font-bold text-blue-700">{visitingToday.length}</p>
              <div className="mt-2 space-y-1 max-h-28 overflow-y-auto">
                {visitingToday.length === 0 ? (
                  <p className="text-xs text-blue-400">No scheduled visits</p>
                ) : visitingToday.map((d) => {
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

            {/* Total Patients Today */}
            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-green-500 uppercase tracking-wide mb-1">Patients Today</p>
              <p className="text-3xl font-bold text-green-700">{todayAppts.length}</p>
              <p className="text-xs text-green-500 mt-1 opacity-75">of {appointments.length} total</p>
            </div>

            {/* Patients per Doctor Today */}
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-purple-500 uppercase tracking-wide mb-1">By Doctor Today</p>
              <p className="text-3xl font-bold text-purple-700">{todayAppts.length}</p>
              <div className="mt-2 space-y-1 max-h-28 overflow-y-auto">
                {Object.keys(patientsPerDoctorToday).length === 0 ? (
                  <p className="text-xs text-purple-400">No appointments today</p>
                ) : Object.entries(patientsPerDoctorToday).map(([doc, cnt]) => (
                  <div key={doc} className="flex items-center justify-between gap-1">
                    <span className="text-xs font-medium text-purple-800 truncate">{doc}</span>
                    <span className="text-xs font-bold text-purple-600 flex-shrink-0">{cnt}p</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pending Callbacks */}
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
                <input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)}
                  title="From date"
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-clinic-green bg-white text-gray-700" />
                <span className="text-gray-400 text-sm">–</span>
                <input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)}
                  title="To date"
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-clinic-green bg-white text-gray-700" />
              </div>
              {hasApptFilters && (
                <button onClick={clearApptFilters}
                  className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2.5 border border-gray-200 rounded-xl bg-white">
                  Clear
                </button>
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
              {apptLoading ? <Loading text="Loading appointments..." /> : filteredAppts.length === 0 ? (
                <Empty text="No appointments found" />
              ) : (
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
                                <div className="flex gap-1.5">
                                  <button onClick={() => updateAppointmentStatus(apt.id, 'completed')} disabled={updatingId === apt.id}
                                    className="text-xs bg-green-100 hover:bg-green-200 text-green-700 font-semibold px-2.5 py-1 rounded-lg disabled:opacity-50 whitespace-nowrap transition">
                                    ✓ Done
                                  </button>
                                  <button onClick={() => updateAppointmentStatus(apt.id, 'cancelled')} disabled={updatingId === apt.id}
                                    className="text-xs bg-red-100 hover:bg-red-200 text-red-700 font-semibold px-2.5 py-1 rounded-lg disabled:opacity-50 whitespace-nowrap transition">
                                    ✕ Cancel
                                  </button>
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
              {cbLoading ? <Loading text="Loading callback requests..." /> : callbacks.length === 0 ? (
                <Empty text="No callback requests yet" />
              ) : (
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
                          <td className="px-4 py-3">
                            <a href={`tel:${cb.mobile}`} className="text-clinic-green hover:underline font-medium whitespace-nowrap">{cb.mobile}</a>
                          </td>
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
                            ) : (
                              <span className="text-xs text-gray-400">Completed</span>
                            )}
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
            {/* Last 7 days bar */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4">Appointments — Last 7 Days</h3>
              <div className="flex items-end gap-3 h-36">
                {last7Days.map((day, i) => {
                  const max = Math.max(...last7Days.map((d) => d.count), 1);
                  const pct = (day.count / max) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs font-semibold text-gray-700">{day.count || ''}</span>
                      <div className="w-full bg-gray-100 rounded-t-lg" style={{ height: '96px' }}>
                        <div className="w-full bg-clinic-green rounded-t-lg transition-all duration-500" style={{ height: `${pct}%`, marginTop: `${100 - pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 text-center leading-tight">{day.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Popular doctors */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Bookings by Doctor</h3>
                <button onClick={exportCSV}
                  className="flex items-center gap-2 text-sm font-semibold text-clinic-green hover:text-clinic-green-dark">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export CSV
                </button>
              </div>
              {bookingsByDoctor.length === 0 ? (
                <p className="text-sm text-gray-400">No data yet</p>
              ) : (
                <div className="space-y-3">
                  {bookingsByDoctor.map(([doctor, count]) => {
                    const max = bookingsByDoctor[0][1];
                    const pct = (count / max) * 100;
                    return (
                      <div key={doctor} className="flex items-center gap-3">
                        <p className="text-sm font-medium text-gray-700 w-40 flex-shrink-0 truncate">{doctor}</p>
                        <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                          <div className="bg-clinic-green h-2.5 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-sm font-bold text-gray-700 w-8 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── MANAGE STAFF ── */}
        {activeTab === 'staff' && (
          <div className="space-y-6">
            {/* Create new staff account */}
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
                  <input
                    type="text"
                    value={newStaffName}
                    onChange={(e) => { setNewStaffName(e.target.value); setStaffMsg(''); }}
                    placeholder="e.g. Priya Sharma"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-clinic-green"
                  />
                </div>
                <div className="flex-1 min-w-[180px]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="text"
                    value={newStaffPw}
                    onChange={(e) => { setNewStaffPw(e.target.value); setStaffMsg(''); }}
                    placeholder="Set a password"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-clinic-green"
                  />
                </div>
                <button type="submit" disabled={staffSaving || !newStaffName.trim() || !newStaffPw.trim()}
                  className="bg-clinic-green hover:bg-clinic-green-dark disabled:opacity-60 text-white font-semibold py-2.5 px-6 rounded-xl transition text-sm whitespace-nowrap">
                  {staffSaving ? 'Creating...' : '+ Create Account'}
                </button>
              </form>
            </div>

            {/* Staff accounts list */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900">Staff Accounts</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{staffAccounts.length} account{staffAccounts.length !== 1 ? 's' : ''} total</p>
                </div>
                <button onClick={fetchStaffAccounts} disabled={staffLoading}
                  className="text-sm text-clinic-green hover:text-clinic-green-dark font-semibold disabled:opacity-50">
                  Refresh
                </button>
              </div>

              {staffLoading ? <Loading text="Loading staff accounts..." /> : staffAccounts.length === 0 ? (
                <Empty text="No staff accounts found" />
              ) : (
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
                              {/* Change password inline */}
                              {changingPwFor === staff.id ? (
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="text"
                                    value={inlinePw}
                                    onChange={(e) => setInlinePw(e.target.value)}
                                    placeholder="New password"
                                    className="border border-gray-200 rounded-lg px-2.5 py-1 text-xs w-28 outline-none focus:ring-1 focus:ring-clinic-green"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => saveInlinePassword(staff.id)}
                                    disabled={!inlinePw.trim()}
                                    className="text-xs bg-clinic-green disabled:opacity-50 text-white px-2.5 py-1 rounded-lg font-semibold transition">
                                    Save
                                  </button>
                                  <button onClick={() => { setChangingPwFor(null); setInlinePw(''); }}
                                    className="text-xs text-gray-400 hover:text-gray-600">
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => { setChangingPwFor(staff.id); setInlinePw(''); }}
                                  className="text-xs text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap">
                                  Change Password
                                </button>
                              )}

                              {/* Enable / Disable */}
                              {staff.role !== 'admin' && (
                                <button
                                  onClick={() => toggleStaffActive(staff.id, staff.is_active)}
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
                <button onClick={() => setActiveTab('staff')} className="text-clinic-green font-semibold hover:underline">
                  Manage Staff
                </button>{' '}
                tab. Create, enable/disable, and change passwords there.
              </p>
            </div>

            {/* Export */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-1">Export Data</h3>
              <p className="text-sm text-gray-500 mb-5">Download all appointment records as a CSV file</p>
              <button onClick={exportCSV}
                className="flex items-center gap-2 bg-clinic-green hover:bg-clinic-green-dark text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition">
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

function ErrorBox({ msg }) {
  return <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">{msg}</div>;
}
