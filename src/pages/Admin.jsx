import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('appointments');

  // ── Appointments state ────────────────────────────────────────
  const [appointments, setAppointments] = useState([]);
  const [apptLoading, setApptLoading] = useState(true);
  const [apptError, setApptError] = useState('');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('appointment_date');
  const [sortAsc, setSortAsc] = useState(true);
  const [filterDoctor, setFilterDoctor] = useState('All');

  // ── Callbacks state ───────────────────────────────────────────
  const [callbacks, setCallbacks] = useState([]);
  const [cbLoading, setCbLoading] = useState(true);
  const [cbError, setCbError] = useState('');
  const [markingId, setMarkingId] = useState(null);

  async function fetchAppointments() {
    setApptLoading(true);
    setApptError('');
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) setApptError('Failed to load: ' + error.message);
    else setAppointments(data || []);
    setApptLoading(false);
  }

  async function fetchCallbacks() {
    setCbLoading(true);
    setCbError('');
    const { data, error } = await supabase
      .from('callbacks')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) setCbError('Failed to load: ' + error.message);
    else setCallbacks(data || []);
    setCbLoading(false);
  }

  useEffect(() => { fetchAppointments(); fetchCallbacks(); }, []);

  async function markCallbackDone(id) {
    setMarkingId(id);
    await supabase.from('callbacks').update({ status: 'done' }).eq('id', id);
    setCallbacks((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'done' } : c))
    );
    setMarkingId(null);
  }

  // ── Appointment filters + sort ────────────────────────────────
  const doctorOptions = ['All', ...new Set(appointments.map((a) => a.doctor_name))];

  const filteredAppts = appointments
    .filter((a) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        a.patient_name?.toLowerCase().includes(q) ||
        a.mobile?.includes(q) ||
        a.doctor_name?.toLowerCase().includes(q) ||
        a.address?.toLowerCase().includes(q);
      const matchDoctor = filterDoctor === 'All' || a.doctor_name === filterDoctor;
      return matchSearch && matchDoctor;
    })
    .sort((a, b) => {
      const va = a[sortKey] ?? '';
      const vb = b[sortKey] ?? '';
      return sortAsc ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });

  function toggleSort(key) {
    if (sortKey === key) setSortAsc((p) => !p);
    else { setSortKey(key); setSortAsc(true); }
  }

  // ── Helpers ───────────────────────────────────────────────────
  function fmtDate(str) {
    if (!str) return '—';
    return new Date(str).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function fmtDateTime(str) {
    if (!str) return '—';
    return new Date(str).toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  const pendingCount = callbacks.filter((c) => c.status === 'pending').length;
  const todayStr = new Date().toISOString().split('T')[0];

  const SortIcon = ({ col }) => (
    <span className="ml-1 inline-flex flex-col">
      <svg className={`w-2.5 h-2.5 ${sortKey === col && sortAsc ? 'text-clinic-green' : 'text-gray-300'}`} viewBox="0 0 10 6" fill="currentColor">
        <path d="M0 6l5-6 5 6z" />
      </svg>
      <svg className={`w-2.5 h-2.5 ${sortKey === col && !sortAsc ? 'text-clinic-green' : 'text-gray-300'}`} viewBox="0 0 10 6" fill="currentColor">
        <path d="M0 0l5 6 5-6z" />
      </svg>
    </span>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-500">Life Care Clinic — Jourian, Jammu Kashmir</p>
            </div>
            <button
              onClick={() => { fetchAppointments(); fetchCallbacks(); }}
              disabled={apptLoading || cbLoading}
              className="flex items-center gap-2 bg-clinic-green hover:bg-clinic-green-dark text-white px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-60 self-start sm:self-auto"
            >
              <svg className={`w-4 h-4 ${(apptLoading || cbLoading) ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-5 border-b border-gray-100 -mb-px">
            <TabBtn
              label="Appointments"
              count={appointments.length}
              active={activeTab === 'appointments'}
              onClick={() => setActiveTab('appointments')}
            />
            <TabBtn
              label="Callback Requests"
              count={pendingCount}
              countLabel="pending"
              active={activeTab === 'callbacks'}
              onClick={() => setActiveTab('callbacks')}
              badge
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* ── APPOINTMENTS TAB ───────────────────────────────── */}
        {activeTab === 'appointments' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <StatCard label="Total Bookings" value={appointments.length} color="green" />
              <StatCard label="Today's Appointments" value={appointments.filter((a) => a.appointment_date === todayStr).length} color="blue" />
              <StatCard label="Unique Patients" value={new Set(appointments.map((a) => a.mobile)).size} color="purple" />
              <StatCard label="Doctors on Record" value={new Set(appointments.map((a) => a.doctor_name)).size} color="orange" />
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search patient, mobile, doctor..."
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-clinic-green bg-white"
                />
              </div>
              <select
                value={filterDoctor}
                onChange={(e) => setFilterDoctor(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-clinic-green bg-white text-gray-700"
              >
                {doctorOptions.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>

            {apptError && <ErrorBox msg={apptError} />}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {apptLoading ? (
                <Loading text="Loading appointments..." />
              ) : filteredAppts.length === 0 ? (
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
                          { key: 'created_at', label: 'Booked On' },
                        ].map((col) => (
                          <th
                            key={col.key}
                            onClick={() => toggleSort(col.key)}
                            className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-clinic-green select-none whitespace-nowrap"
                          >
                            {col.label}
                            <SortIcon col={col.key} />
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredAppts.map((apt, idx) => (
                        <tr key={apt.id || idx} className="hover:bg-green-50/40 transition-colors">
                          <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{fmtDate(apt.appointment_date)}</td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">{apt.appointment_time}</td>
                          <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{apt.doctor_name}</td>
                          <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{apt.patient_name}</td>
                          <td className="px-4 py-3">
                            <a href={`tel:${apt.mobile}`} className="text-clinic-green hover:underline whitespace-nowrap font-medium">{apt.mobile}</a>
                          </td>
                          <td className="px-4 py-3 text-gray-500 max-w-[180px]">
                            <span className="line-clamp-2 text-xs">{apt.address}</span>
                          </td>
                          <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-xs">{fmtDateTime(apt.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── CALLBACKS TAB ──────────────────────────────────── */}
        {activeTab === 'callbacks' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
              <StatCard label="Total Requests" value={callbacks.length} color="green" />
              <StatCard label="Pending" value={pendingCount} color="orange" />
              <StatCard label="Completed" value={callbacks.filter((c) => c.status === 'done').length} color="blue" />
            </div>

            {cbError && <ErrorBox msg={cbError} />}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {cbLoading ? (
                <Loading text="Loading callback requests..." />
              ) : callbacks.length === 0 ? (
                <Empty text="No callback requests yet" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        {['Name', 'Mobile', 'Preferred Time', 'Status', 'Received On', 'Action'].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                            {h}
                          </th>
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
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                              cb.status === 'pending'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {cb.status === 'pending' ? 'Pending' : 'Done'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-xs">{fmtDateTime(cb.created_at)}</td>
                          <td className="px-4 py-3">
                            {cb.status === 'pending' ? (
                              <button
                                onClick={() => markCallbackDone(cb.id)}
                                disabled={markingId === cb.id}
                                className="flex items-center gap-1.5 bg-clinic-green hover:bg-clinic-green-dark disabled:opacity-60 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition whitespace-nowrap"
                              >
                                {markingId === cb.id ? (
                                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                  </svg>
                                ) : (
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                                Mark Done
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

function TabBtn({ label, count, countLabel, active, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
        active
          ? 'border-clinic-green text-clinic-green'
          : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      {label}
      {count > 0 && (
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
          active
            ? badge ? 'bg-amber-100 text-amber-700' : 'bg-clinic-green-lite text-clinic-green'
            : 'bg-gray-100 text-gray-500'
        }`}>
          {count}{countLabel ? ` ${countLabel}` : ''}
        </span>
      )}
    </button>
  );
}

function StatCard({ label, value, color }) {
  const palette = {
    green:  'bg-green-50  text-green-700  border-green-100',
    blue:   'bg-blue-50   text-blue-700   border-blue-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
    orange: 'bg-orange-50 text-orange-700 border-orange-100',
  };
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
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">{msg}</div>
  );
}
