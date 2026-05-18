import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.jpeg';

export default function StaffLogin() {
  const [name, setName]         = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const { staffLogin } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) { setError('Please enter your full name'); return; }
    if (!password)    { setError('Password is required'); return; }
    setLoading(true);
    setError('');
    const ok = await staffLogin(name.trim(), password);
    if (ok) {
      navigate('/staff-dashboard', { replace: true });
    } else {
      setError('Incorrect name or password. Please try again.');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 justify-center">
            <img src={logo} alt="Life Care Clinic" className="h-12 w-12 rounded-xl object-cover shadow-sm ring-2 ring-green-100" />
            <div className="text-left">
              <p className="font-extrabold text-clinic-green-dark text-lg leading-tight">Life Care Clinic</p>
              <p className="text-gray-500 text-xs">Jourian, Jammu Kashmir</p>
            </div>
          </Link>
          <p className="text-gray-600 text-sm mt-3">Staff Portal</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-bold text-gray-900 text-lg mb-1">Staff Login</h2>
          <p className="text-sm text-gray-500 mb-5">Sign in with your staff credentials</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(''); }}
                placeholder="Enter your full name"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-clinic-green focus:border-clinic-green bg-white"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder="Enter password"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-clinic-green focus:border-clinic-green bg-white"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-clinic-green hover:bg-clinic-green-dark disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition text-sm">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-500 mt-5">
          <Link to="/" className="text-clinic-green hover:underline font-medium">← Back to Home</Link>
        </p>
      </div>
    </div>
  );
}
