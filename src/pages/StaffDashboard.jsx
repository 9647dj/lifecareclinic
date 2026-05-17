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

export default function StaffDashboard() {
  const { staffLogout, isAdminAuthed } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('appointments');

  // Appointments
  const [appointments, setAppointments] = useState([]);
  const [apptLoading, setApptLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDoctor, setFilterDoctor] = useState('All');
  const [filterDate, setFilterDate] = useState('');
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

  const todayStr = new Date().toISOString().split('T')[0];
  const doctorOptions = ['All', ...new Set(appointments.map((a) => a.doctor_name).filter(Boolean))];

  const filteredAppts = appointments.filter((a) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      a.patient_name?.toLowerCase().includes(q) ||
      a.mobile?.includes(q) ||
      a.doctor_name?.toLowerCase().includes(q) ||
      a.dob?.includes(q);
    const matchDoctor = filterDoctor === 'All' || a.doctor_name === filterDoctor;
    const matchDate = !filterDate || a.appointment_date === filterDate;
    const matchStatus = filterStatus === 'All' || (a.status || 'upcoming') === filterStatus;
    return matchSearch && matchDoctor && matchDate && matchStatus;
  });

  const pendingCb = callbacks.filter((c) => c.status === 'pending').length;

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
              <p className="text-xs text-gray-500">Life Care Clinic</p>
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

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Bookings" value={appointments.length} color="green" />
          <StatCard label="Today" value={appointments.filter((a) => a.appointment_date === todayStr).length} color="blue" />
          <StatCard label="Upcoming" value={appointments.filter((a) => (a.status || 'upcoming') === 'upcoming').length} color="purple" />
          <StatCard label="Callback Pending" value={pendingCb} color="orange" />
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
              <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-clinic-green bg-white text-gray-700" />
              {(search || filterDoctor !== 'All' || filterDate || filterStatus !== 'All') && (
                <button onClick={() => { setSearch(''); setFilterDoctor('All'); setFilterDate(''); setFilterStatus('All'); }}
                  className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2.5 border border-gray-200 rounded-xl bg-white">
                  Clear
                </button>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {apptLoading ? <Loading text="Loading appointments..." /> : filteredAppts.length === 0 ? (
                <Empty text="No appointments found" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        {['Doctor', 'Patient', 'DOB', 'Mobile', 'Date', 'Time', 'Status', 'Actions'].map((h) => (
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
                            <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{apt.patient_name}</td>
                            <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{fmtDate(apt.dob)}</td>
                            <td className="px-4 py-3">
                              <a href={`tel:${apt.mobile}`} className="text-clinic-green hover:underline font-medium whitespace-nowrap">{apt.mobile}</a>
                            </td>
                            <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmtDate(apt.appointment_date)}</td>
                            <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{apt.appointment_time}</td>
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
              <StatCard label="Total Requests" value={callbacks.length} color="green" />
              <StatCard label="Pending" value={pendingCb} color="orange" />
              <StatCard label="Completed" value={callbacks.filter((c) => c.status === 'done').length} color="blue" />
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
