import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const COLS = [
  { key: 'appointment_date', label: 'Date' },
  { key: 'appointment_time', label: 'Time' },
  { key: 'doctor_name', label: 'Doctor' },
  { key: 'specialty', label: 'Specialty' },
  { key: 'patient_name', label: 'Patient' },
  { key: 'mobile', label: 'Mobile' },
  { key: 'address', label: 'Address' },
  { key: 'created_at', label: 'Booked On' },
];

export default function Admin() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('appointment_date');
  const [sortAsc, setSortAsc] = useState(true);
  const [filterDoctor, setFilterDoctor] = useState('All');

  async function fetchAppointments() {
    setLoading(true);
    setError('');
    const { data, error: err } = await supabase
      .from('appointments')
      .select('*')
      .order('appointment_date', { ascending: true });
    if (err) {
      setError('Failed to load appointments: ' + err.message);
    } else {
      setAppointments(data || []);
    }
    setLoading(false);
  }

  useEffect(() => { fetchAppointments(); }, []);

  const doctorOptions = ['All', ...new Set(appointments.map((a) => a.doctor_name))];

  const filtered = appointments
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
      return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
    });

  function toggleSort(key) {
    if (sortKey === key) setSortAsc((p) => !p);
    else { setSortKey(key); setSortAsc(true); }
  }

  function formatDate(str) {
    if (!str) return '—';
    return new Date(str).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  function formatDateTime(str) {
    if (!str) return '—';
    return new Date(str).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  const SortIcon = ({ col }) => (
    <span className="ml-1 inline-flex flex-col">
      <svg className={`w-2.5 h-2.5 ${sortKey === col && sortAsc ? 'text-blue-600' : 'text-gray-300'}`} viewBox="0 0 10 6" fill="currentColor">
        <path d="M0 6l5-6 5 6z" />
      </svg>
      <svg className={`w-2.5 h-2.5 ${sortKey === col && !sortAsc ? 'text-blue-600' : 'text-gray-300'}`} viewBox="0 0 10 6" fill="currentColor">
        <path d="M0 0l5 6 5-6z" />
      </svg>
    </span>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-500">Life Care Clinic — Appointment Bookings</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{filtered.length} appointment{filtered.length !== 1 ? 's' : ''}</span>
            <button
              onClick={fetchAppointments}
              disabled={loading}
              className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-60"
            >
              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Bookings" value={appointments.length} color="blue" />
          <StatCard label="Today" value={appointments.filter((a) => a.appointment_date === new Date().toISOString().split('T')[0]).length} color="green" />
          <StatCard label="Unique Patients" value={new Set(appointments.map((a) => a.mobile)).size} color="purple" />
          <StatCard label="Doctors" value={new Set(appointments.map((a) => a.doctor_name)).size} color="orange" />
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
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
          <select
            value={filterDoctor}
            onChange={(e) => setFilterDoctor(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
          >
            {doctorOptions.map((d) => <option key={d}>{d}</option>)}
          </select>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-400">
              <svg className="w-6 h-6 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Loading appointments...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="font-medium text-gray-500">No appointments found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {[
                      { key: 'appointment_date', label: 'Date' },
                      { key: 'appointment_time', label: 'Time' },
                      { key: 'doctor_name', label: 'Doctor' },
                      { key: 'specialty', label: 'Specialty' },
                      { key: 'patient_name', label: 'Patient' },
                      { key: 'mobile', label: 'Mobile' },
                      { key: 'address', label: 'Address' },
                      { key: 'created_at', label: 'Booked On' },
                    ].map((col) => (
                      <th
                        key={col.key}
                        onClick={() => toggleSort(col.key)}
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-blue-700 select-none whitespace-nowrap"
                      >
                        {col.label}
                        <SortIcon col={col.key} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((apt, idx) => (
                    <tr key={apt.id || idx} className="hover:bg-blue-50/40 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{formatDate(apt.appointment_date)}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{apt.appointment_time}</td>
                      <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{apt.doctor_name}</td>
                      <td className="px-4 py-3 text-gray-500 max-w-[160px]">
                        <span className="line-clamp-2">{apt.specialty}</span>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{apt.patient_name}</td>
                      <td className="px-4 py-3">
                        <a href={`tel:${apt.mobile}`} className="text-blue-600 hover:underline whitespace-nowrap">{apt.mobile}</a>
                      </td>
                      <td className="px-4 py-3 text-gray-500 max-w-[180px]">
                        <span className="line-clamp-2">{apt.address}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-xs">{formatDateTime(apt.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    green: 'bg-green-50 text-green-700 border-green-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
    orange: 'bg-orange-50 text-orange-700 border-orange-100',
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-medium mt-0.5 opacity-75">{label}</p>
    </div>
  );
}
