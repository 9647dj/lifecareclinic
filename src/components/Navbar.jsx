import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import logo from '../assets/logo.jpeg';

const NAV_LINKS = [
  { label: 'Find a Doctor', href: '#doctors' },
  { label: 'Our Services',  href: '#services' },
  { label: 'About Us',      href: '#about' },
  { label: 'Contact Us',    href: '#contact' },
];

const PHONES = [
  { label: '01924-467500', href: 'tel:01924467500' },
  { label: '9906107887',   href: 'tel:9906107887' },
  { label: '7780924767',   href: 'tel:7780924767' },
  { label: '9070507887',   href: 'tel:9070507887' },
];

function PhoneIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/';

  function openCallback() {
    document.dispatchEvent(new CustomEvent('open-callback'));
  }

  return (
    <header className="sticky top-0 z-50">

      {/* ── Top bar (desktop only) ── */}
      <div className="bg-clinic-green-dark text-green-100 text-xs py-1.5 hidden sm:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-green-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Main Road W No 7, Jourian, Near SBI, Jammu Kashmir 181202</span>
          </div>
          <div className="flex items-center gap-5">
            <a href="https://instagram.com/lifecarejourian" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-white transition-colors">
              <svg className="w-3.5 h-3.5 text-pink-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
              @lifecarejourian
            </a>
            <a href="tel:01924467500" className="flex items-center gap-1.5 hover:text-white transition-colors">
              <PhoneIcon className="w-3.5 h-3.5 text-green-300" />
              01924-467500
            </a>
          </div>
        </div>
      </div>

      {/* ── Main nav ── */}
      <nav className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">

            {/* Logo + name */}
            <Link to="/" className="flex items-center gap-3 group flex-shrink-0">
              <img src={logo} alt="Life Care Clinic"
                className="h-14 w-14 rounded-2xl object-cover shadow-md ring-2 ring-green-100 group-hover:ring-clinic-green transition-all duration-200" />
              <div className="leading-tight">
                <span className="block text-clinic-green-dark font-extrabold text-xl">Life Care Clinic</span>
                <span className="block text-gray-500 text-xs font-medium mt-0.5">Jourian, Jammu Kashmir</span>
              </div>
            </Link>

            {/* Center nav links — desktop */}
            <div className="hidden lg:flex items-center gap-0.5">
              {NAV_LINKS.map((link) => (
                <a key={link.label} href={link.href}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-clinic-green-dark hover:bg-clinic-green-lite rounded-lg transition-all duration-200 whitespace-nowrap">
                  {link.label}
                </a>
              ))}
              {isHome ? (
                <Link to="/admin"
                  className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all duration-200">
                  Admin
                </Link>
              ) : (
                <Link to="/"
                  className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all duration-200">
                  Home
                </Link>
              )}
            </div>

            {/* Right CTA buttons — desktop */}
            <div className="hidden lg:flex items-center gap-2.5">
              <a href="#doctors"
                className="inline-flex items-center gap-2 bg-clinic-green hover:bg-clinic-green-dark text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Book Appointment
              </a>
              <button onClick={openCallback}
                className="inline-flex items-center gap-2 border-2 border-clinic-green text-clinic-green hover:bg-clinic-green hover:text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-200">
                <PhoneIcon className="w-4 h-4" />
                Request Callback
              </button>
            </div>

            {/* Hamburger — mobile */}
            <button
              className="lg:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {menuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>

        {/* ── Mobile menu ── */}
        {menuOpen && (
          <div className="lg:hidden border-t border-gray-100 bg-white px-4 pb-5 pt-3 animate-slide-down">
            <div className="space-y-0.5 mb-4">
              {NAV_LINKS.map((link) => (
                <a key={link.label} href={link.href} onClick={() => setMenuOpen(false)}
                  className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:text-clinic-green hover:bg-clinic-green-lite rounded-xl transition-colors">
                  {link.label}
                </a>
              ))}
            </div>
            <div className="space-y-2 pt-3 border-t border-gray-100">
              <a href="#doctors" onClick={() => setMenuOpen(false)}
                className="block text-center bg-clinic-green hover:bg-clinic-green-dark text-white font-semibold py-3 rounded-xl text-sm transition-colors">
                Book Appointment
              </a>
              <button onClick={() => { openCallback(); setMenuOpen(false); }}
                className="w-full text-center border-2 border-clinic-green text-clinic-green font-semibold py-3 rounded-xl text-sm hover:bg-clinic-green-lite transition-colors">
                Request Callback
              </button>
              <div className="grid grid-cols-2 gap-2 pt-1">
                {PHONES.map((p) => (
                  <a key={p.href} href={p.href}
                    className="flex items-center gap-1.5 text-xs text-clinic-green font-medium py-2 px-3 bg-clinic-green-lite rounded-lg">
                    <PhoneIcon className="w-3.5 h-3.5 flex-shrink-0" />
                    {p.label}
                  </a>
                ))}
              </div>
              {isHome ? (
                <Link to="/admin" onClick={() => setMenuOpen(false)}
                  className="block text-center border border-gray-200 text-gray-500 font-medium py-2.5 rounded-xl text-sm mt-1 hover:bg-gray-50 transition-colors">
                  Admin Dashboard
                </Link>
              ) : (
                <Link to="/" onClick={() => setMenuOpen(false)}
                  className="block text-center border border-gray-200 text-gray-500 font-medium py-2.5 rounded-xl text-sm mt-1 hover:bg-gray-50 transition-colors">
                  ← Back to Home
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
