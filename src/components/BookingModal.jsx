/**
 * BookingModal — multi-step appointment booking flow
 *
 * Steps:  dates → form → confirm → success
 * Eye camps skip the date-picker step (no fixed schedule).
 *
 * Key behaviours:
 * - Auto-fills form from logged-in patient profile (AuthContext)
 * - Upserts the patients table on every booking so the profile stays current
 * - Sends a confirmation email to the patient (if they provide one) via the
 *   /api/send-email serverless function; failure is caught silently so a broken
 *   email config never blocks the actual booking
 * - Generates a deterministic patient code (LC-XXXX-NNNN) from name + mobile —
 *   no extra DB column needed
 */
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import resend from '../lib/resend';
import { getAvailableDates } from '../data/doctors';
import DatePicker from './DatePicker';
import { useAuth } from '../context/AuthContext';
import { generatePatientCode } from '../lib/utils';

const CLINIC_EMAIL = 'lifecarejourian@gmail.com';
const FROM_EMAIL   = 'Life Care Clinic <lifecarejourian@gmail.com>';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
function getNextSixMonths() {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
  });
}
function preferredMonthToDate(monthStr) {
  const [monthName, year] = monthStr.trim().split(' ');
  const idx = MONTH_NAMES.indexOf(monthName);
  if (idx === -1 || !year) return null;
  return `${year}-${String(idx + 1).padStart(2, '0')}-01`;
}

export default function BookingModal({ doctor, onClose }) {
  const isEyeCamp = !!doctor.isEyeCamp;
  const [step, setStep] = useState(isEyeCamp ? 'form' : 'dates');
  const [selectedDate, setSelectedDate] = useState(null);
  const [form, setForm] = useState({ name: '', dob: '', mobile: '', address: '', email: '', gender: '', preferredMonth: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [blockedDates, setBlockedDates] = useState(new Set());
  const [consent, setConsent] = useState(false);
  const { user, profile } = useAuth();

  useEffect(() => {
    if (profile) {
      setForm((f) => ({
        ...f,
        name:    f.name    || profile.full_name || '',
        mobile:  f.mobile  || profile.mobile    || '',
        dob:     f.dob     || profile.dob       || '',
        address: f.address || profile.address   || '',
      }));
    }
  }, [profile]);

  useEffect(() => {
    supabase.from('blocked_dates').select('blocked_date').then(({ data }) => {
      if (data) setBlockedDates(new Set(data.map((r) => r.blocked_date)));
    });
  }, []);

  const allDates = isEyeCamp ? [] : getAvailableDates(doctor.schedule);
  const availableDates = allDates.filter(
    (slot) => !blockedDates.has(slot.date.toISOString().split('T')[0])
  );

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!isEyeCamp && !form.dob.trim()) e.dob = 'Date of birth is required';
    if (!form.mobile.trim()) e.mobile = 'Mobile number is required';
    else if (!/^[6-9]\d{9}$/.test(form.mobile.trim())) e.mobile = 'Enter a valid 10-digit mobile number';
    if (!form.address.trim()) e.address = 'Address is required';
    if (!form.gender) e.gender = 'Please select gender';
    if (isEyeCamp && !form.preferredMonth.trim()) e.preferredMonth = 'Preferred month is required';
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Enter a valid email address';
    if (!consent) e.consent = 'You must agree to the privacy policy to continue';
    return e;
  }

  async function upsertPatient() {
    try {
      const { data: existing } = await supabase
        .from('patients')
        .select('id, total_visits')
        .eq('mobile', form.mobile.trim())
        .maybeSingle();

      if (existing) {
        await supabase.from('patients').update({
          total_visits: (existing.total_visits || 0) + 1,
          full_name: form.name.trim(),
          address: form.address.trim(),
          ...(form.email.trim() && { email: form.email.trim() }),
          ...(form.gender && { gender: form.gender }),
        }).eq('id', existing.id);
      } else {
        await supabase.from('patients').insert({
          full_name: form.name.trim(),
          mobile: form.mobile.trim(),
          dob: form.dob.trim() || null,
          address: form.address.trim(),
          email: form.email.trim() || null,
          gender: form.gender || null,
          total_visits: 1,
        });
      }
    } catch (_) {
      // patient upsert is best-effort; don't block booking flow
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setApiError('');

    const bookedAt = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

    const payload = isEyeCamp
      ? {
          patient_name: form.name.trim(),
          mobile: form.mobile.trim(),
          address: form.address.trim(),
          email: form.email.trim() || null,
          doctor_name: doctor.name,
          doctor_id: doctor.id || null,
          specialty: doctor.specialty,
          category: doctor.category || null,
          appointment_date: preferredMonthToDate(form.preferredMonth),
          appointment_time: 'TBD - Will be confirmed',
          dob: null,
          user_id: user?.id ?? null,
          status: 'pending_confirmation',
          booking_channel: 'website',
        }
      : {
          patient_name: form.name.trim(),
          mobile: form.mobile.trim(),
          address: form.address.trim(),
          email: form.email.trim() || null,
          doctor_name: doctor.name,
          doctor_id: doctor.id || null,
          specialty: doctor.specialty,
          category: doctor.category || null,
          appointment_date: selectedDate.date.toISOString().split('T')[0],
          appointment_time: selectedDate.timeDisplay,
          dob: form.dob.trim(),
          user_id: user?.id ?? null,
          status: 'upcoming',
          booking_channel: 'website',
        };

    const { error } = await supabase.from('appointments').insert([payload]);

    if (error) {
      setLoading(false);
      console.error('Supabase insert error:', error);
      setApiError(`Booking failed: ${error.message}`);
      return;
    }

    // Best-effort patient record upsert
    await upsertPatient();

    const patientCode = generatePatientCode(form.name.trim(), form.mobile.trim());
    const dateLabel = isEyeCamp
      ? `Preferred Month: ${form.preferredMonth.trim()}`
      : selectedDate.date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const timeLabel = isEyeCamp ? 'Eye Camp — Awaiting Confirmation' : selectedDate.timeDisplay;

    resend.emails.send({
      from: FROM_EMAIL,
      to: CLINIC_EMAIL,
      subject: `New Appointment Booked - ${doctor.name}`,
      html: `
        <h2>New Appointment Booked!</h2>
        <p><b>Patient:</b> ${form.name.trim()}</p>
        <p><b>Gender:</b> ${form.gender || '—'}</p>
        <p><b>DOB:</b> ${isEyeCamp ? 'N/A' : form.dob.trim()}</p>
        <p><b>Mobile:</b> ${form.mobile.trim()}</p>
        <p><b>Email:</b> ${form.email.trim() || '—'}</p>
        <p><b>Address:</b> ${form.address.trim()}</p>
        <p><b>Patient ID:</b> ${patientCode || '—'}</p>
        <p><b>Doctor:</b> ${doctor.name}</p>
        <p><b>Specialty:</b> ${doctor.specialty}</p>
        <p><b>Date:</b> ${dateLabel}</p>
        <p><b>Time:</b> ${timeLabel}</p>
        <p><b>Booked at:</b> ${bookedAt}</p>
      `,
    }).catch((err) => console.error('[BookingModal] clinic email error:', err));

    if (form.email.trim()) {
      resend.emails.send({
        from: FROM_EMAIL,
        to: form.email.trim(),
        subject: `Appointment Confirmed — Life Care Clinic`,
        html: `
          <h2 style="color:#1a7a4a;">Appointment Confirmed!</h2>
          <p>Dear ${form.name.trim()},</p>
          <p>Your appointment has been successfully booked at <strong>Life Care Clinic, Jourian, Jammu Kashmir</strong>.</p>
          <table style="border-collapse:collapse;width:100%;margin:16px 0;">
            <tr><td style="padding:6px 12px;background:#f0faf4;font-weight:600;width:140px;">Doctor</td><td style="padding:6px 12px;">${doctor.name}</td></tr>
            <tr><td style="padding:6px 12px;background:#f0faf4;font-weight:600;">Specialty</td><td style="padding:6px 12px;">${doctor.specialty}</td></tr>
            <tr><td style="padding:6px 12px;background:#f0faf4;font-weight:600;">Date</td><td style="padding:6px 12px;">${dateLabel}</td></tr>
            <tr><td style="padding:6px 12px;background:#f0faf4;font-weight:600;">Time</td><td style="padding:6px 12px;">${timeLabel}</td></tr>
            ${patientCode ? `<tr><td style="padding:6px 12px;background:#f0faf4;font-weight:600;">Patient ID</td><td style="padding:6px 12px;font-weight:700;color:#1a7a4a;">${patientCode}</td></tr>` : ''}
          </table>
          ${!isEyeCamp ? '<p style="background:#fffbeb;border:1px solid #fde68a;padding:10px 14px;border-radius:8px;font-size:14px;">Please arrive <strong>15 minutes early</strong> with this confirmation.</p>' : ''}
          <p style="color:#888;font-size:13px;margin-top:20px;">For queries, call <strong>01924-467500</strong>. Life Care Clinic, Main Road W No 7, Jourian, Near SBI, Jammu Kashmir 181202.</p>
        `,
      }).catch((err) => console.error('[BookingModal] patient email error:', err));
    }

    setLoading(false);
    setStep('success');
  }

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: '' }));
  }

  const formatDate = (date) =>
    date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const inputCls = (field) =>
    `w-full border rounded-xl px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-clinic-green focus:border-clinic-green ${errors[field] ? 'border-red-400 bg-red-50' : 'border-gray-200'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`${doctor.lightColor} px-6 py-5 rounded-t-2xl border-b border-gray-100`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`${doctor.color} w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm`}>
                {doctor.initials}
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-lg leading-tight">{doctor.name}</h2>
                <p className={`text-sm font-medium ${doctor.textColor}`}>{doctor.specialty}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-white/60 transition">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-6 py-5">
          {/* STEP 1: Date selection */}
          {step === 'dates' && (
            <>
              <h3 className="font-semibold text-gray-800 mb-1">Select Appointment Date</h3>
              <p className="text-sm text-gray-500 mb-4">Available slots for the next 2 weeks</p>

              {availableDates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="font-medium">No slots in the next 2 weeks</p>
                  <p className="text-sm mt-1">Please call 01924-467500 to schedule</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableDates.map((slot, idx) => (
                    <button
                      key={idx}
                      onClick={() => { setSelectedDate(slot); setStep('form'); }}
                      className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-gray-100 hover:border-clinic-green hover:bg-clinic-green-lite transition-all text-left group"
                    >
                      <div>
                        <p className="font-semibold text-gray-800 group-hover:text-clinic-green-dark">
                          {formatDate(slot.date)}
                        </p>
                        <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {slot.timeDisplay}
                        </p>
                      </div>
                      <svg className="w-5 h-5 text-gray-300 group-hover:text-clinic-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* STEP 2: Patient form */}
          {step === 'form' && (
            <>
              {!isEyeCamp && selectedDate && (
                <div className="flex items-center justify-between mb-5">
                  <div className="bg-clinic-green-lite border border-clinic-green-soft rounded-lg px-3 py-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-clinic-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p className="text-xs font-semibold text-clinic-green-dark">{formatDate(selectedDate.date)}</p>
                      <p className="text-xs text-clinic-green">{selectedDate.timeDisplay}</p>
                    </div>
                  </div>
                  <button onClick={() => setStep('dates')} className="text-sm text-clinic-green hover:text-clinic-green-dark font-semibold">
                    Change
                  </button>
                </div>
              )}

              {isEyeCamp && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 mb-5 flex items-start gap-2">
                  <svg className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-indigo-700">
                    Free Eye Checkup &amp; Surgery camp held every 1st &amp; 3rd Friday. Register your interest and we'll confirm the date.
                    <span className="font-semibold"> ECHS &amp; Ayushman Card accepted.</span>
                  </p>
                </div>
              )}

              <h3 className="font-semibold text-gray-800 mb-4">
                {isEyeCamp ? 'Register Your Interest' : 'Patient Details'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Enter patient's full name"
                    className={inputCls('name')}
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>

                {!isEyeCamp && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                    <DatePicker
                      value={form.dob}
                      onChange={(val) => handleChange('dob', val)}
                      max={new Date().toISOString().split('T')[0]}
                      placeholder="Select date of birth"
                      error={errors.dob}
                    />
                    {errors.dob && <p className="text-red-500 text-xs mt-1">{errors.dob}</p>}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gender *</label>
                  <div className="flex gap-4">
                    {['Male', 'Female', 'Other'].map((g) => (
                      <label key={g} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="gender"
                          value={g}
                          checked={form.gender === g}
                          onChange={() => handleChange('gender', g)}
                          className="w-4 h-4 accent-clinic-green"
                        />
                        <span className="text-sm text-gray-700">{g}</span>
                      </label>
                    ))}
                  </div>
                  {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    value={form.mobile}
                    onChange={(e) => handleChange('mobile', e.target.value)}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    className={inputCls('mobile')}
                  />
                  {errors.mobile && <p className="text-red-500 text-xs mt-1">{errors.mobile}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                  <textarea
                    value={form.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    placeholder="Village / Town, District"
                    rows={2}
                    className={`${inputCls('address')} resize-none`}
                  />
                  {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-gray-400 font-normal">(optional — for appointment reminders)</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="patient@example.com"
                    className={inputCls('email')}
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>

                {isEyeCamp && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Month *</label>
                    <select
                      value={form.preferredMonth}
                      onChange={(e) => handleChange('preferredMonth', e.target.value)}
                      className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.preferredMonth ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                    >
                      <option value="">Select preferred month</option>
                      {getNextSixMonths().map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    {errors.preferredMonth && <p className="text-red-500 text-xs mt-1">{errors.preferredMonth}</p>}
                  </div>
                )}

                {apiError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                    {apiError}
                  </div>
                )}

                <div className={`flex items-start gap-3 rounded-xl px-4 py-3 border ${errors.consent ? 'bg-red-50 border-red-300' : 'bg-gray-50 border-gray-200'}`}>
                  <input
                    type="checkbox"
                    id="consent"
                    checked={consent}
                    onChange={(e) => {
                      setConsent(e.target.checked);
                      if (errors.consent) setErrors((er) => ({ ...er, consent: '' }));
                    }}
                    className="mt-0.5 w-4 h-4 flex-shrink-0 cursor-pointer"
                  />
                  <label htmlFor="consent" className="text-sm text-gray-600 cursor-pointer leading-snug">
                    I agree that Life Care Clinic may collect and store my personal data for appointment booking purposes.{' '}
                    <a href="/privacy-policy" target="_blank" rel="noopener noreferrer"
                      className="text-clinic-green hover:underline font-medium">
                      View Privacy Policy
                    </a>
                  </label>
                </div>
                {errors.consent && <p className="text-red-500 text-xs -mt-2">{errors.consent}</p>}

                <div className="flex gap-3 pt-1">
                  {!isEyeCamp && (
                    <button
                      type="button"
                      onClick={() => setStep('dates')}
                      className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition text-sm"
                    >
                      Back
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className={`flex-1 ${isEyeCamp
                      ? 'bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400'
                      : 'bg-clinic-green hover:bg-clinic-green-dark disabled:opacity-60'
                    } text-white font-semibold py-2.5 rounded-xl transition text-sm flex items-center justify-center gap-2`}
                  >
                    {loading ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Submitting...
                      </>
                    ) : isEyeCamp ? 'Register Interest' : 'Confirm Appointment'}
                  </button>
                </div>
              </form>
            </>
          )}

          {/* STEP 3: Success */}
          {step === 'success' && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-clinic-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">
                {isEyeCamp ? 'Interest Registered!' : 'Appointment Confirmed!'}
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                {isEyeCamp
                  ? 'We will contact you with the confirmed camp date.'
                  : 'Your booking has been successfully registered.'}
              </p>

              {generatePatientCode(form.name, form.mobile) && (
                <div className="bg-clinic-green text-white rounded-xl px-4 py-3 mb-4 text-center">
                  <p className="text-xs font-semibold opacity-80 uppercase tracking-wide mb-0.5">Your Patient ID</p>
                  <p className="text-xl font-bold tracking-wider">{generatePatientCode(form.name, form.mobile)}</p>
                  <p className="text-xs opacity-70 mt-0.5">Keep this ID for future visits</p>
                </div>
              )}

              <div className="bg-clinic-green-lite border border-clinic-green-soft rounded-xl p-4 text-left space-y-2 mb-6">
                <Detail label="Doctor" value={doctor.name} />
                <Detail label="Specialty" value={doctor.specialty} />
                {isEyeCamp ? (
                  <Detail label="Month" value={form.preferredMonth} />
                ) : (
                  <>
                    <Detail label="Date" value={formatDate(selectedDate.date)} />
                    <Detail label="Time" value={selectedDate.timeDisplay} />
                    <Detail label="DOB" value={form.dob} />
                  </>
                )}
                <Detail label="Patient" value={form.name} />
                <Detail label="Gender" value={form.gender} />
                <Detail label="Mobile" value={form.mobile} />
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-700 mb-5 flex items-start gap-2">
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {isEyeCamp
                  ? <>Our team will call you at <strong>{form.mobile}</strong> to confirm the camp date. For queries, call <strong>&nbsp;01924-467500</strong>.</>
                  : <>Please arrive 15 minutes before your scheduled time. For queries, call <strong>&nbsp;01924-467500</strong>.</>
                }
              </div>

              <button
                onClick={onClose}
                className={`w-full ${isEyeCamp ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-clinic-green hover:bg-clinic-green-dark'} text-white font-semibold py-2.5 rounded-xl transition text-sm`}
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="flex gap-2">
      <span className="text-xs font-semibold text-clinic-green w-20 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-gray-800">{value}</span>
    </div>
  );
}
