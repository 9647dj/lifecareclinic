import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import logo from '../assets/logo.jpeg';
import DatePicker from '../components/DatePicker';

const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-clinic-green focus:border-clinic-green bg-white';

function fmtDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const STATUS_STYLE = {
  upcoming:  'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function Profile() {
  const { user, profile, signOut, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [editing, setEditing]   = useState(false);
  const [form, setForm]         = useState({ full_name: '', mobile: '', dob: '', address: '' });
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError]     = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [bookings, setBookings]             = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [cancellingId, setCancellingId]     = useState(null);

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        mobile:    profile.mobile    || '',
        dob:       profile.dob       || '',
        address:   profile.address   || '',
      });
    }
  }, [profile]);

  useEffect(() => {
    if (user) fetchBookings();
  }, [user]);

  async function fetchBookings() {
    setBookingsLoading(true);
    const { data } = await supabase
      .from('appointments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setBookings(data || []);
    setBookingsLoading(false);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaveLoading(true);
    setSaveError('');
    try {
      await updateProfile(form);
      setEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err.message || 'Failed to save changes');
    }
    setSaveLoading(false);
  }

  async function handleCancel(bookingId) {
    setCancellingId(bookingId);
    await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', bookingId)
      .eq('user_id', user.id);
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled' } : b))
    );
    setCancellingId(null);
  }

  async function handleLogout() {
    await signOut();
    navigate('/');
  }

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Patient';
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/">
              <img src={logo} alt="Life Care Clinic" className="h-10 w-10 rounded-xl object-cover ring-2 ring-green-100" />
            </Link>
            <div>
              <h1 className="font-bold text-gray-900">My Profile</h1>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-sm text-gray-500 hover:text-clinic-green transition-colors font-medium">
              ← Home
            </Link>
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
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* ── Profile Card ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 bg-clinic-green-lite border-b border-green-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-clinic-green flex items-center justify-center text-white font-bold text-2xl shadow-sm flex-shrink-0">
                {initials}
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-lg">{displayName}</h2>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
            </div>
            {!editing && (
              <button onClick={() => setEditing(true)}
                className="flex items-center gap-2 text-sm font-semibold text-clinic-green hover:text-clinic-green-dark transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
            )}
          </div>

          <div className="px-6 py-6">
            {saveSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-5 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Profile updated successfully!
              </div>
            )}
            {saveError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">
                {saveError}
              </div>
            )}

            {editing ? (
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input type="text" value={form.full_name}
                      onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                      className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                    <input type="tel" value={form.mobile} maxLength={10}
                      onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))}
                      className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <DatePicker value={form.dob}
                    onChange={(val) => setForm((f) => ({ ...f, dob: val }))}
                    max={new Date().toISOString().split('T')[0]}
                    placeholder="Select date of birth" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea value={form.address} rows={2}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                    className={`${inputCls} resize-none`} />
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setEditing(false)}
                    className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition text-sm">
                    Cancel
                  </button>
                  <button type="submit" disabled={saveLoading}
                    className="flex-1 bg-clinic-green hover:bg-clinic-green-dark disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition text-sm">
                    {saveLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="Full Name"   value={profile?.full_name} />
                <Field label="Mobile"      value={profile?.mobile} />
                <Field label="Date of Birth" value={profile?.dob} />
                <Field label="Email"       value={user?.email} />
                <div className="sm:col-span-2">
                  <Field label="Address"   value={profile?.address} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Booking History ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900">My Appointments</h3>
              <p className="text-xs text-gray-500 mt-0.5">{bookings.length} total</p>
            </div>
            <a href="/#doctors"
              className="text-sm font-semibold text-clinic-green hover:text-clinic-green-dark transition-colors">
              Book New →
            </a>
          </div>

          {bookingsLoading ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <svg className="w-5 h-5 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Loading...
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="font-medium text-gray-500 mb-2">No appointments yet</p>
              <a href="/#doctors" className="text-clinic-green text-sm font-semibold hover:underline">
                Book your first appointment →
              </a>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Doctor', 'Date', 'Time', 'Status', 'Action'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {bookings.map((b) => {
                    const status = b.status || 'upcoming';
                    const isUpcoming = status === 'upcoming' && b.appointment_date && new Date(b.appointment_date) >= new Date();
                    return (
                      <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-800 whitespace-nowrap">{b.doctor_name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{b.specialty}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-sm">{fmtDate(b.appointment_date)}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{b.appointment_time}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_STYLE[status] || STATUS_STYLE.upcoming}`}>
                            {status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {isUpcoming ? (
                            <button
                              onClick={() => handleCancel(b.id)}
                              disabled={cancellingId === b.id}
                              className="text-xs text-red-500 hover:text-red-600 font-semibold disabled:opacity-50 whitespace-nowrap">
                              {cancellingId === b.id ? 'Cancelling...' : 'Cancel'}
                            </button>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm text-gray-800 font-medium">{value || <span className="text-gray-400 font-normal">Not set</span>}</p>
    </div>
  );
}
