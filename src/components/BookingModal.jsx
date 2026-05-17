import { useState, useEffect } from 'react';
import emailjs from '@emailjs/browser';
import { supabase } from '../lib/supabase';
import { getAvailableDates } from '../data/doctors';
import DatePicker from './DatePicker';

const EMAILJS_SERVICE_ID = 'lifecare_service';
const EMAILJS_TEMPLATE_ID = 'template_hwkyqoo';
const EMAILJS_PUBLIC_KEY = 'NpOFXkRESy0E3-8GA';

export default function BookingModal({ doctor, onClose }) {
  const isEyeCamp = !!doctor.isEyeCamp;
  const [step, setStep] = useState(isEyeCamp ? 'form' : 'dates');
  const [selectedDate, setSelectedDate] = useState(null);
  const [form, setForm] = useState({ name: '', dob: '', mobile: '', address: '', preferredMonth: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const availableDates = isEyeCamp ? [] : getAvailableDates(doctor.schedule);

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
    if (isEyeCamp && !form.preferredMonth.trim()) e.preferredMonth = 'Preferred month is required';
    return e;
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
          doctor_name: doctor.name,
          specialty: doctor.specialty,
          patient_name: form.name.trim(),
          dob: null,
          mobile: form.mobile.trim(),
          address: form.address.trim(),
          appointment_date: null,
          appointment_time: `Preferred Month: ${form.preferredMonth.trim()}`,
        }
      : {
          doctor_name: doctor.name,
          specialty: doctor.specialty,
          patient_name: form.name.trim(),
          dob: form.dob.trim(),
          mobile: form.mobile.trim(),
          address: form.address.trim(),
          appointment_date: selectedDate.date.toISOString().split('T')[0],
          appointment_time: selectedDate.timeDisplay,
        };

    const { error } = await supabase.from('appointments').insert([payload]);

    if (error) {
      setLoading(false);
      setApiError('Failed to book. Please try again or call us directly.');
      return;
    }

    // Send email notification — fire and forget, don't block success on email
    emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      {
        patient_name: form.name.trim(),
        dob: isEyeCamp ? 'N/A' : form.dob.trim(),
        mobile: form.mobile.trim(),
        address: form.address.trim(),
        doctor_name: doctor.name,
        specialty: doctor.specialty,
        appointment_date: isEyeCamp
          ? `Preferred Month: ${form.preferredMonth.trim()}`
          : selectedDate.date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
        appointment_time: isEyeCamp ? 'Eye Camp — Awaiting Confirmation' : selectedDate.timeDisplay,
        booked_at: bookedAt,
      },
      EMAILJS_PUBLIC_KEY
    ).catch(() => {});

    setLoading(false);
    setStep('success');
  }

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: '' }));
  }

  const formatDate = (date) =>
    date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

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
                <p className={`text-sm font-medium ${doctor.textColor}`}>{doctor.role || doctor.specialty}</p>
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
          {/* STEP 1: Date selection (regular bookings only) */}
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
                      className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-gray-100 hover:border-blue-400 hover:bg-blue-50 transition-all text-left group"
                    >
                      <div>
                        <p className="font-semibold text-gray-800 group-hover:text-blue-800">
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
                      <svg className="w-5 h-5 text-gray-300 group-hover:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
              {/* Selected date chip (regular only) */}
              {!isEyeCamp && selectedDate && (
                <div className="flex items-center justify-between mb-5">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p className="text-xs font-semibold text-blue-700">{formatDate(selectedDate.date)}</p>
                      <p className="text-xs text-blue-600">{selectedDate.timeDisplay}</p>
                    </div>
                  </div>
                  <button onClick={() => setStep('dates')} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                    Change
                  </button>
                </div>
              )}

              {/* Eye camp info banner */}
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
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Enter patient's full name"
                    className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.name ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>

                {/* Date of Birth (regular bookings only) */}
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

                {/* Mobile */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    value={form.mobile}
                    onChange={(e) => handleChange('mobile', e.target.value)}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.mobile ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                  />
                  {errors.mobile && <p className="text-red-500 text-xs mt-1">{errors.mobile}</p>}
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                  <textarea
                    value={form.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    placeholder="Village / Town, District"
                    rows={2}
                    className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${errors.address ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                  />
                  {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                </div>

                {/* Preferred Month (Eye Camp only) */}
                {isEyeCamp && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Month *</label>
                    <input
                      type="text"
                      value={form.preferredMonth}
                      onChange={(e) => handleChange('preferredMonth', e.target.value)}
                      placeholder="e.g. June 2026"
                      className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.preferredMonth ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                    />
                    {errors.preferredMonth && <p className="text-red-500 text-xs mt-1">{errors.preferredMonth}</p>}
                  </div>
                )}

                {apiError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                    {apiError}
                  </div>
                )}

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
                    className={`flex-1 ${isEyeCamp ? 'bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400' : 'bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400'} text-white font-semibold py-2.5 rounded-xl transition text-sm flex items-center justify-center gap-2`}
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
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-left space-y-2 mb-6">
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
                className={`w-full ${isEyeCamp ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-blue-700 hover:bg-blue-800'} text-white font-semibold py-2.5 rounded-xl transition text-sm`}
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
      <span className="text-xs font-semibold text-blue-600 w-20 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-gray-800">{value}</span>
    </div>
  );
}
