import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <svg className="w-8 h-8 animate-spin text-clinic-green" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );
}

export function PatientRoute({ children }) {
  const { user, authLoading } = useAuth();
  if (authLoading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export function StaffRoute({ children }) {
  const { isStaffAuthed } = useAuth();
  if (!isStaffAuthed()) return <Navigate to="/staff-login" replace />;
  return children;
}

export function AdminRoute({ children }) {
  const { isAdminAuthed } = useAuth();
  if (!isAdminAuthed()) return <Navigate to="/admin-login" replace />;
  return children;
}
