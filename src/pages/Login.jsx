import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.jpeg';
import DatePicker from '../components/DatePicker';

const inputCls = (err) =>
  `w-full border rounded-xl px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-clinic-green focus:border-clinic-green ${err ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white'}`;

export default function Login() {
  const [tab, setTab] = useState('signin');
  const [form, setForm] = useState({
    email: '', password: '', confirmPassword: '',
    full_name: '', mobile: '', dob: '', address: '',
  });
  const [errors, setErrors]     = useState({});
  const [loading, setLoading]   = useState(false);
  const [apiError, setApiError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/profile', { replace: true });
  }, [user, navigate]);

  function setField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: '' }));
    setApiError('');
  }

  function switchTab(t) {
    setTab(t);
    setErrors({});
    setApiError('');
    setSuccessMsg('');
  }

  function validateSignIn() {
    const e = {};
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    return e;
  }

  function validateSignUp() {
    const e = {};
    if (!form.full_name.trim()) e.full_name = 'Full name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Minimum 6 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (!form.mobile.trim()) e.mobile = 'Mobile is required';
    else if (!/^[6-9]\d{9}$/.test(form.mobile.trim())) e.mobile = 'Enter valid 10-digit number';
    if (!form.address.trim()) e.address = 'Address is required';
    return e;
  }

  async function handleSignIn(e) {
    e.preventDefault();
    const errs = validateSignIn();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await signIn(form.email, form.password);
      navigate('/profile');
    } catch (err) {
      setApiError(err.message || 'Login failed. Check your credentials.');
    }
    setLoading(false);
  }

  async function handleSignUp(e) {
    e.preventDefault();
    const errs = validateSignUp();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const data = await signUp(form.email, form.password, {
        full_name: form.full_name.trim(),
        mobile:    form.mobile.trim(),
        dob:       form.dob || '',
        address:   form.address.trim(),
      });
      if (data.user && !data.session) {
        setSuccessMsg('Account created! Check your email to confirm, then sign in.');
      } else {
        navigate('/profile');
      }
    } catch (err) {
      setApiError(err.message || 'Sign-up failed. Please try again.');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 justify-center">
            <img src={logo} alt="Life Care Clinic" className="h-12 w-12 rounded-xl object-cover shadow-sm ring-2 ring-green-100" />
            <div className="text-left">
              <p className="font-extrabold text-clinic-green-dark text-lg leading-tight">Life Care Clinic</p>
              <p className="text-gray-500 text-xs">Jourian, Jammu Kashmir</p>
            </div>
          </Link>
          <p className="text-gray-600 text-sm mt-3">Patient Portal</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            {[
              { key: 'signin', label: 'Sign In' },
              { key: 'signup', label: 'Create Account' },
            ].map((t) => (
              <button key={t.key} onClick={() => switchTab(t.key)}
                className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
                  tab === t.key
                    ? 'text-clinic-green border-b-2 border-clinic-green bg-clinic-green-lite/30'
                    : 'text-gray-500 hover:text-gray-700'
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="px-6 py-6">
            {successMsg && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-5 flex items-start gap-2">
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {successMsg}
              </div>
            )}
            {apiError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">
                {apiError}
              </div>
            )}

            {/* ── Sign In ── */}
            {tab === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input type="email" value={form.email} onChange={(e) => setField('email', e.target.value)}
                    placeholder="your@email.com" className={inputCls(errors.email)} />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input type="password" value={form.password} onChange={(e) => setField('password', e.target.value)}
                    placeholder="Enter your password" className={inputCls(errors.password)} />
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-clinic-green hover:bg-clinic-green-dark disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition text-sm">
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
                <p className="text-center text-xs text-gray-500">
                  Don't have an account?{' '}
                  <button type="button" onClick={() => switchTab('signup')}
                    className="text-clinic-green font-semibold hover:underline">
                    Create one
                  </button>
                </p>
              </form>
            )}

            {/* ── Sign Up ── */}
            {tab === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input type="text" value={form.full_name} onChange={(e) => setField('full_name', e.target.value)}
                    placeholder="Your full name" className={inputCls(errors.full_name)} />
                  {errors.full_name && <p className="text-red-500 text-xs mt-1">{errors.full_name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                  <input type="email" value={form.email} onChange={(e) => setField('email', e.target.value)}
                    placeholder="your@email.com" className={inputCls(errors.email)} />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                    <input type="password" value={form.password} onChange={(e) => setField('password', e.target.value)}
                      placeholder="Min 6 chars" className={inputCls(errors.password)} />
                    {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm *</label>
                    <input type="password" value={form.confirmPassword} onChange={(e) => setField('confirmPassword', e.target.value)}
                      placeholder="Repeat" className={inputCls(errors.confirmPassword)} />
                    {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number *</label>
                  <input type="tel" value={form.mobile} onChange={(e) => setField('mobile', e.target.value)}
                    placeholder="10-digit mobile" maxLength={10} className={inputCls(errors.mobile)} />
                  {errors.mobile && <p className="text-red-500 text-xs mt-1">{errors.mobile}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <DatePicker value={form.dob} onChange={(val) => setField('dob', val)}
                    max={new Date().toISOString().split('T')[0]} placeholder="Select date of birth" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                  <textarea value={form.address} onChange={(e) => setField('address', e.target.value)}
                    placeholder="Village / Town, District" rows={2}
                    className={`${inputCls(errors.address)} resize-none`} />
                  {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-clinic-green hover:bg-clinic-green-dark disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition text-sm">
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 mt-5">
          <Link to="/" className="text-clinic-green hover:underline font-medium">← Back to Home</Link>
        </p>
      </div>
    </div>
  );
}
