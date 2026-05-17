import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import logo from '../assets/logo.jpeg';

const STATUS_STYLE = {
  upcoming:  'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

function fmtDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtDateTime(str) {
  if (!str) return '—';
  return new Date(str).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function Admin() {
  const { staffLogout } = useAuth();
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
  const [updatingId, setUpdatingId] = useState(null);

  // Callbacks
  const [callbacks, setCallbacks] = useState([]);
  const [cbLoading, setCbLoading] = useState(true);
  const [cbError, setCbError] = useState('');
  const [markingId, setMarkingId] = useState(null);

  // Settings
  const [newStaffPw, setNewStaffPw] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState('');

  useEffect(() => { fetchAppointments(); fetchCallbacks(); }, []);

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

  async function saveStaffPassword(e) {
    e.preventDefault();
    if (!newStaffPw.trim()) return;
    setPwSaving(true);
    setPwMsg('');
    const { error } = await supabase.from('clinic_settings').update({ value: newStaffPw.trim() }).eq('key', 'staff_password');
    setPwMsg(error ? 'Failed to update: ' + error.message : 'Staff password updated successfully!');
    setPwSaving(false);
    if (!error) setNewStaffPw('');
  }

  function handleLogout() {
    staffLogout();
    navigate('/');
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

  const doctorOptions = ['All', ...new Set(appointments.map((a) => a.doctor_name).filter(Boolean))];
  const todayStr = new Date().toISOString().split('T')[0];
  const pendingCount = callbacks.filter((c) => c.status === 'pending').length;

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

  const filteredAppts = appointments
    .filter((a) => {
      const q = search.toLowerCase();
      const matchSearch = !q || a.patient_name?.toLowerCase().includes(q) || a.mobile?.includes(q) || a.doctor_name?.toLowerCase().includes(q) || a.address?.toLowerCase().includes(q);
      const matchDoctor = filterDoctor === 'All' || a.doctor_name === filterDoctor;
      const matchStatus = filterStatus === 'All' || (a.status || 'upcoming') === filterStatus;
      return matchSearch && matchDoctor && matchStatus;
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
              <p className="text-xs text-gray-500">Life Care Clinic — Jourian, Jammu Kashmir</p>
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
            <TabBtn label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* ── APPOINTMENTS ── */}
        {activeTab === 'appointments' && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <StatCard label="Total Bookings" value={appointments.length} color="green" />
              <StatCard label="Today" value={appointments.filter((a) => a.appointment_date === todayStr).length} color="blue" />
              <StatCard label="Unique Patients" value={new Set(appointments.map((a) => a.mobile)).size} color="purple" />
              <StatCard label="Doctors" value={new Set(appointments.map((a) => a.doctor_name)).size} color="orange" />
            </div>

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
              <button onClick={exportCSV}
                className="flex items-center gap-2 bg-clinic-green hover:bg-clinic-green-dark text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition whitespace-nowrap">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export CSV
              </button>
            </div>

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
              <StatCard label="Total Requests" value={callbacks.length} color="green" />
              <StatCard label="Pending" value={pendingCount} color="orange" />
              <StatCard label="Completed" value={callbacks.filter((c) => c.status === 'done').length} color="blue" />
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
            {/* KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard label="Total Bookings" value={appointments.length} color="green" />
              <StatCard label="Completed" value={appointments.filter((a) => a.status === 'completed').length} color="blue" />
              <StatCard label="Cancelled" value={appointments.filter((a) => a.status === 'cancelled').length} color="orange" />
              <StatCard label="Pending Callbacks" value={pendingCount} color="purple" />
            </div>

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
              <h3 className="font-bold text-gray-900 mb-4">Bookings by Doctor</h3>
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

        {/* ── SETTINGS ── */}
        {activeTab === 'settings' && (
          <div className="max-w-lg space-y-6">
            {/* Change staff password */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-1">Staff Password</h3>
              <p className="text-sm text-gray-500 mb-5">Change the password used by staff to log in</p>

              {pwMsg && (
                <div className={`text-sm rounded-xl px-4 py-3 mb-4 ${pwMsg.startsWith('Failed') ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'}`}>
                  {pwMsg}
                </div>
              )}

              <form onSubmit={saveStaffPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Staff Password</label>
                  <input
                    type="text"
                    value={newStaffPw}
                    onChange={(e) => { setNewStaffPw(e.target.value); setPwMsg(''); }}
                    placeholder="Enter new password"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-clinic-green focus:border-clinic-green"
                  />
                </div>
                <button type="submit" disabled={pwSaving || !newStaffPw.trim()}
                  className="bg-clinic-green hover:bg-clinic-green-dark disabled:opacity-60 text-white font-semibold py-2.5 px-6 rounded-xl transition text-sm">
                  {pwSaving ? 'Saving...' : 'Update Password'}
                </button>
              </form>
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

function StatCard({ label, value, color }) {
  const palette = { green: 'bg-green-50 text-green-700 border-green-100', blue: 'bg-blue-50 text-blue-700 border-blue-100', purple: 'bg-purple-50 text-purple-700 border-purple-100', orange: 'bg-orange-50 text-orange-700 border-orange-100' };
  return (
    <div className={`rounded-xl border p-4 ${palette[color]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-medium mt-0.5 opacity-75">{label}</p>
    </div>
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
