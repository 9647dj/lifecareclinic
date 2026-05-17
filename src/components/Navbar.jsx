import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import logo from '../assets/logo.jpeg';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="bg-white shadow-md sticky top-0 z-40 border-b border-green-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-2">

          {/* Logo + Clinic Name */}
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src={logo}
              alt="Life Care Clinic"
              className="h-14 w-14 rounded-2xl object-cover shadow-md ring-2 ring-green-200 group-hover:ring-clinic-green transition-all duration-200"
            />
            <div className="leading-tight">
              <span className="block text-clinic-green font-extrabold text-xl leading-tight">Life Care Clinic</span>
              <span className="block text-green-600 text-xs font-medium mt-0.5">Jourian, Jammu Kashmir</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-5">
            <a href="tel:01924467500"
              className="flex items-center gap-1.5 text-clinic-green font-semibold text-sm hover:text-clinic-green-dark transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              01924-467500
            </a>
            <a href="tel:9906107887"
              className="flex items-center gap-1.5 text-green-600 font-medium text-sm hover:text-clinic-green transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              9906107887
            </a>
            {location.pathname !== '/admin' ? (
              <Link to="/admin"
                className="bg-clinic-green hover:bg-clinic-green-dark text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm">
                Admin
              </Link>
            ) : (
              <Link to="/"
                className="bg-clinic-green hover:bg-clinic-green-dark text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm">
                Home
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-clinic-green hover:bg-clinic-green-lite transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-green-100 px-4 py-4 space-y-3">
          <a href="tel:01924467500" className="flex items-center gap-2 text-clinic-green font-semibold text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            01924-467500
          </a>
          <a href="tel:9906107887" className="flex items-center gap-2 text-green-600 font-medium text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            9906107887
          </a>
          {location.pathname !== '/admin' ? (
            <Link to="/admin" onClick={() => setMenuOpen(false)}
              className="block bg-clinic-green text-white px-4 py-2.5 rounded-lg text-sm font-semibold text-center">
              Admin Dashboard
            </Link>
          ) : (
            <Link to="/" onClick={() => setMenuOpen(false)}
              className="block bg-clinic-green text-white px-4 py-2.5 rounded-lg text-sm font-semibold text-center">
              Home
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
