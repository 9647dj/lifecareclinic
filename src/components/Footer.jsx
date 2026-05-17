import logo from '../assets/logo.jpeg';

const PHONES = [
  { label: '01924-467500', href: 'tel:01924467500', primary: true },
  { label: '9906107887',   href: 'tel:9906107887' },
  { label: '7780924767',   href: 'tel:7780924767' },
  { label: '9070507887',   href: 'tel:9070507887' },
];

const SERVICES = [
  'Specialist Consultation',
  'Fully Diagnostic Laboratory',
  'Pharmacy',
  'ECG Services',
  'Home Blood Collection',
  'Immunization & Vaccines',
];

const SPECIALTIES = [
  'Paediatrics', 'Orthopaedics', 'Dermatology',
  'Cardiology', 'General Medicine', 'ENT',
  'Gynaecology', 'Dental', 'Eye Camp',
];

export default function Footer() {
  return (
    <footer className="text-green-100" style={{ backgroundColor: '#1B5E20' }}>

      {/* Main columns */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* About */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <img src={logo} alt="Life Care Clinic"
                className="h-12 w-12 rounded-xl object-cover ring-2 ring-white/20 flex-shrink-0" />
              <div>
                <h3 className="text-white font-bold text-base leading-tight">Life Care Clinic</h3>
                <p className="text-green-300 text-xs mt-0.5">Jourian, Jammu Kashmir</p>
              </div>
            </div>
            <p className="text-sm text-green-200 leading-relaxed mb-5">
              Quality specialist healthcare serving Jourian since 2020. Expert care, close to home.
            </p>
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2 mb-5">
              <span className="text-yellow-400 text-sm">⭐⭐⭐⭐⭐</span>
              <div>
                <p className="text-white text-xs font-semibold leading-tight">5 Star Rated</p>
                <p className="text-green-300 text-xs">Google Reviews</p>
              </div>
            </div>
            <div>
              <a href="https://instagram.com/lifecarejourian" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-green-200 hover:text-white transition-colors group">
                <svg className="w-5 h-5 text-pink-400 group-hover:text-pink-300 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
                @lifecarejourian
              </a>
            </div>
          </div>

          {/* Our Services */}
          <div>
            <h4 className="text-white font-semibold mb-5 text-sm uppercase tracking-wider">Our Services</h4>
            <ul className="space-y-2.5">
              {SERVICES.map((s) => (
                <li key={s} className="flex items-center gap-2.5 text-sm text-green-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>

          {/* Specialties */}
          <div>
            <h4 className="text-white font-semibold mb-5 text-sm uppercase tracking-wider">Specialties</h4>
            <div className="flex flex-wrap gap-2">
              {SPECIALTIES.map((s) => (
                <span key={s}
                  className="bg-white/10 hover:bg-white/20 text-green-100 text-xs px-3 py-1.5 rounded-full transition-colors cursor-default">
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-5 text-sm uppercase tracking-wider">Contact Us</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-2.5 text-sm">
                <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-green-200 leading-snug">
                  Main Road W No 7 Jourian<br />Near SBI, J&K 181202
                </span>
              </div>
              {PHONES.map((p) => (
                <a key={p.href} href={p.href}
                  className="flex items-center gap-2.5 text-sm text-green-200 hover:text-white transition-colors">
                  <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className={p.primary ? 'font-semibold text-white' : ''}>{p.label}</span>
                </a>
              ))}
              <div className="flex items-start gap-2.5 text-sm">
                <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-green-200 leading-snug">
                  <p>Mon – Sat: 9 AM – 8 PM</p>
                  <p>Sunday: 10 AM – 4 PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-green-400">
          <span>&copy; 2025 Life Care Clinic, Jourian, Jammu Kashmir. All rights reserved.</span>
          <span className="flex items-center gap-1">
            Made with
            <svg className="w-3.5 h-3.5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
            for Jourian
          </span>
        </div>
      </div>
    </footer>
  );
}
