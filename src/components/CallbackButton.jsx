import { useState, useEffect } from 'react';
import emailjs from '@emailjs/browser';
import { supabase } from '../lib/supabase';

const TIME_SLOTS = [
  'Morning (9AM – 12PM)',
  'Afternoon (12PM – 3PM)',
  'Evening (3PM – 6PM)',
  'Night (6PM – 9PM)',
];

export default function CallbackButton() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState('form');
  const [form, setForm] = useState({ name: '', mobile: '', preferredTime: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    function handleOpenEvent() { setOpen(true); }
    document.addEventListener('open-callback', handleOpenEvent);
    return () => document.removeEventListener('open-callback', handleOpenEvent);
  }, []);

  function handleClose() {
    setOpen(false);
    setTimeout(() => {
      setStep('form');
      setForm({ name: '', mobile: '', preferredTime: '' });
      setErrors({});
      setApiError('');
    }, 250);
  }

  function setField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: '' }));
  }

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!form.mobile.trim()) e.mobile = 'Mobile number is required';
    else if (!/^[6-9]\d{9}$/.test(form.mobile.trim())) e.mobile = 'Enter a valid 10-digit mobile number';
    if (!form.preferredTime) e.preferredTime = 'Please select a preferred time';
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setApiError('');

    const { error } = await supabase.from('callbacks').insert([{
      patient_name: form.name.trim(),
      mobile: form.mobile.trim(),
      preferred_time: form.preferredTime,
      status: 'pending',
    }]);

    if (error) {
      setLoading(false);
      setApiError('Failed to submit. Please call us directly at 01924-467500.');
      return;
    }

    emailjs.send(
      'lifecare_service',
      'template_5x2r40x',
      {
        patient_name: form.name.trim(),
        mobile: form.mobile.trim(),
        preferred_time: form.preferredTime,
        submitted_at: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
      },
      'NpOFXkRESy0E3-8GA'
    ).catch(() => {});

    setLoading(false);
    setStep('success');
  }

  const inputCls = (field) =>
    `w-full border rounded-xl px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-clinic-green focus:border-clinic-green bg-white ${errors[field] ? 'border-red-400 bg-red-50' : 'border-gray-200'}`;

  return (
    <>
      {/* Floating button */}
      <div className="fixed bottom-6 right-5 z-40">
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2.5 bg-clinic-green hover:bg-clinic-green-dark text-white pl-4 pr-5 py-3 rounded-full shadow-2xl hover:shadow-green-200 transition-all duration-200 font-semibold text-sm ring-4 ring-white/30"
        >
          <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <span>Request Callback</span>
        </button>
      </div>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={handleClose}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-clinic-green-lite px-6 py-4 border-b border-green-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-clinic-green rounded-xl flex items-center justify-center shadow-sm">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-900 text-base">Request a Callback</h2>
                    <p className="text-xs text-gray-500 mt-0.5">We'll call you back shortly</p>
                  </div>
                </div>
                <button onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-white/60 transition">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="px-6 py-5">
              {step === 'form' ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setField('name', e.target.value)}
                      placeholder="Your full name"
                      className={inputCls('name')}
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number *</label>
                    <input
                      type="tel"
                      value={form.mobile}
                      onChange={(e) => setField('mobile', e.target.value)}
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      className={inputCls('mobile')}
                    />
                    {errors.mobile && <p className="text-red-500 text-xs mt-1">{errors.mobile}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Time *</label>
                    <select
                      value={form.preferredTime}
                      onChange={(e) => setField('preferredTime', e.target.value)}
                      className={inputCls('preferredTime')}
                    >
                      <option value="">Select preferred time...</option>
                      {TIME_SLOTS.map((slot) => (
                        <option key={slot} value={slot}>{slot}</option>
                      ))}
                    </select>
                    {errors.preferredTime && <p className="text-red-500 text-xs mt-1">{errors.preferredTime}</p>}
                  </div>

                  {apiError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                      {apiError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-clinic-green hover:bg-clinic-green-dark disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition text-sm flex items-center justify-center gap-2 mt-1"
                  >
                    {loading ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Submitting...
                      </>
                    ) : 'Request Callback'}
                  </button>
                </form>
              ) : (
                <div className="text-center py-3">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-clinic-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Request Submitted!</h3>
                  <p className="text-sm text-gray-600 mb-1">
                    We'll call you at <strong className="text-clinic-green">{form.mobile}</strong>
                  </p>
                  <p className="text-sm text-gray-500 mb-6">
                    Preferred time: <strong>{form.preferredTime}</strong>
                  </p>
                  <button
                    onClick={handleClose}
                    className="w-full bg-clinic-green hover:bg-clinic-green-dark text-white font-semibold py-2.5 rounded-xl transition text-sm"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
