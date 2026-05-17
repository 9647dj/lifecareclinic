import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PatientRoute, StaffRoute, AdminRoute } from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Profile from './pages/Profile';
import StaffLogin from './pages/StaffLogin';
import StaffDashboard from './pages/StaffDashboard';
import AdminLogin from './pages/AdminLogin';
import CallbackButton from './components/CallbackButton';
import WhatsAppButton from './components/WhatsAppButton';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-white">
          <Navbar />
          <div className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/profile" element={<PatientRoute><Profile /></PatientRoute>} />
              <Route path="/staff-login" element={<StaffLogin />} />
              <Route path="/staff-dashboard" element={<StaffRoute><StaffDashboard /></StaffRoute>} />
              <Route path="/admin-login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
            </Routes>
          </div>
          <Footer />
          <CallbackButton />
          <WhatsAppButton />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
