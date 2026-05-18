import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useDoctors } from '../hooks/useDoctors';
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

export default function StaffDashboard() {
  const { staffLogout, isAdminAuthed, getStaffName } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('appointments');
  const { doctors } = useDoctors();

  // Appointments
  const [appointments, setAppointments] = useState([]);
  const [apptLoading, setApptLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDoctor, setFilterDoctor] = useState('All');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [updatingId, setUpdatingId] = useState(null);

  // Callbacks
  const [callbacks, setCallbacks] = useState([]);
  const [cbLoading, setCbLoading] = useState(true);
  const [markingId, setMarkingId] = useState(null);

  useEffect(() => { fetchAppointments(); fetchCallbacks(); }, []);

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

  function handleLogout() {
    staffLogout();
    navigate('/');
  }

  function clearFilters() {
    setSearch('');
    setFilterDoctor('All');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterStatus('All');
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const todayDayName = DAY_NAMES[new Date().getDay()];
  const doctorOptions = ['All', ...new Set(appointments.map((a) => a.doctor_name).filter(Boolean))];

  // KPI computations
  const visitingToday = doctors.filter(
    (d) => d.schedule && d.schedule.some((s) => s.day === todayDayName)
  );
  const todayAppts = appointments.filter((a) => a.appointment_date === todayStr);
  const pendingCb = callbacks.filter((c) => c.status === 'pending').length;
  const patientsPerDoctorToday = todayAppts.reduce((acc, a) => {
    if (a.doctor_name) acc[a.doctor_name] = (acc[a.doctor_name] || 0) + 1;
    return acc;
  }, {});

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const newThisWeek = new Set(
    appointments
      .filter((a) => a.created_at && new Date(a.created_at) >= oneWeekAgo)
      .map((a) => a.mobile)
      .filter(Boolean)
  ).size;

  const hasFilters = search || filterDoctor !== 'All' || filterDateFrom || filterDateTo || filterStatus !== 'All';

  const filteredAppts = appointments.filter((a) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      a.patient_name?.toLowerCase().includes(q) ||
      a.mobile?.includes(q) ||
      a.doctor_name?.toLowerCase().includes(q) ||
      a.dob?.includes(q);
    const matchDoctor = filterDoctor === 'All' || a.doctor_name === filterDoctor;
    const matchStatus = filterStatus === 'All' || (a.status || 'upcoming') === filterStatus;
    const matchFrom = !filterDateFrom || a.appointment_date >= filterDateFrom;
    const matchTo = !filterDateTo || a.appointment_date <= filterDateTo;
    return matchSearch && matchDoctor && matchStatus && matchFrom && matchTo;
  });

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
              <h1 className="font-bold text-gray-900">Staff Dashboard</h1>
              <p className="text-xs text-gray-500">
                Life Care Clinic
                {getStaffName() && <span className="ml-1 text-clinic-green">· {getStaffName()}</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isAdminAuthed() && (
              <Link to="/admin"
                className="text-sm font-semibold text-clinic-green hover:text-clinic-green-dark transition-colors">
                Admin Panel →
              </Link>
            )}
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
          <div className="flex gap-1 border-b border-gray-100 -mb-px">
            <TabBtn label="Appointments" count={appointments.length} active={activeTab === 'appointments'} onClick={() => setActiveTab('appointments')} />
            <TabBtn label="Callbacks" count={pendingCb} badge active={activeTab === 'callbacks'} onClick={() => setActiveTab('callbacks')} />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">

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
                    {slot && (
                      <span className="text-xs text-blue-500 whitespace-nowrap flex-shrink-0">
                        {slot.startTime}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Total Patients Today */}
          <div className="bg-green-50 border border-green-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-green-500 uppercase tracking-wide mb-1">Patients Today</p>
            <p className="text-3xl font-bold text-green-700">{todayAppts.length}</p>
            <p className="text-xs text-green-500 mt-1 opacity-75">appointments booked</p>
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
            <p className="text-3xl font-bold text-orange-700">{pendingCb}</p>
            <p className="text-xs text-orange-500 mt-1 opacity-75">awaiting response</p>
          </div>

          {/* New Patients This Week */}
          <div className="bg-teal-50 border border-teal-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-teal-500 uppercase tracking-wide mb-1">New This Week</p>
            <p className="text-3xl font-bold text-teal-700">{newThisWeek}</p>
            <p className="text-xs text-teal-500 mt-1 opacity-75">unique patients (7d)</p>
          </div>
        </div>

        {/* ── Appointments tab ── */}
        {activeTab === 'appointments' && (
          <>
            <div className="flex flex-wrap gap-3 mb-5">
              <div className="relative flex-1 min-w-[200px]">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name, mobile, DOB, doctor..."
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
              {hasFilters && (
                <button onClick={clearFilters}
                  className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2.5 border border-gray-200 rounded-xl bg-white">
                  Clear
                </button>
              )}
            </div>

            <p className="text-xs text-gray-400 mb-3">
              Showing {filteredAppts.length} of {appointments.length} appointments
            </p>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {apptLoading ? <Loading text="Loading appointments..." /> : filteredAppts.length === 0 ? (
                <Empty text="No appointments found" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        {['Doctor', 'Category', 'Patient', 'DOB', 'Mobile', 'Date', 'Time', 'Channel', 'Status', 'Actions'].map((h) => (
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
                            <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{apt.category || '—'}</td>
                            <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{apt.patient_name}</td>
                            <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{fmtDate(apt.dob)}</td>
                            <td className="px-4 py-3">
                              <a href={`tel:${apt.mobile}`} className="text-clinic-green hover:underline font-medium whitespace-nowrap">{apt.mobile}</a>
                            </td>
                            <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmtDate(apt.appointment_date)}</td>
                            <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{apt.appointment_time}</td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 capitalize">
                                {apt.booking_channel || 'website'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_STYLE[status] || STATUS_STYLE.upcoming}`}>
                                {status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {status === 'upcoming' && (
                                <div className="flex gap-1.5">
                                  <button
                                    onClick={() => updateAppointmentStatus(apt.id, 'completed')}
                                    disabled={updatingId === apt.id}
                                    className="text-xs bg-green-100 hover:bg-green-200 text-green-700 font-semibold px-2.5 py-1 rounded-lg disabled:opacity-50 whitespace-nowrap transition">
                                    ✓ Done
                                  </button>
                                  <button
                                    onClick={() => updateAppointmentStatus(apt.id, 'cancelled')}
                                    disabled={updatingId === apt.id}
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

        {/* ── Callbacks tab ── */}
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
                              <button
                                onClick={() => markCallbackDone(cb.id)}
                                disabled={markingId === cb.id}
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
      </div>
    </div>
  );
}

function TabBtn({ label, count, active, onClick, badge }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${active ? 'border-clinic-green text-clinic-green' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
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
