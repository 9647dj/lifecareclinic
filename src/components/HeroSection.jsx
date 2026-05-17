import { useState } from 'react';

export default function HeroSection({ onSearch }) {
  const [query, setQuery] = useState('');

  function handleSearch(e) {
    e.preventDefault();
    if (onSearch) onSearch(query);
    document.getElementById('doctors')?.scrollIntoView({ behavior: 'smooth' });
  }

  function openCallback() {
    document.dispatchEvent(new CustomEvent('open-callback'));
  }

  return (
    <section
      className="relative overflow-hidden text-white"
      style={{ background: 'linear-gradient(135deg, #0a2e0d 0%, #1B5E20 45%, #2E7D32 100%)' }}
    >
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

      {/* Radial glow blobs */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle at center, #4CAF50, transparent 70%)' }} />
      <div className="absolute bottom-0 left-0 w-80 h-80 opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle at center, #A5D6A7, transparent 70%)' }} />

      {/* Decorative medical cross — top right */}
      <div className="absolute top-12 right-16 opacity-10 hidden xl:block pointer-events-none">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="white">
          <rect x="30" y="0" width="20" height="80" rx="6" />
          <rect x="0" y="30" width="80" height="20" rx="6" />
        </svg>
      </div>
      {/* Small cross — bottom left */}
      <div className="absolute bottom-24 left-16 opacity-[0.07] hidden xl:block pointer-events-none">
        <svg width="50" height="50" viewBox="0 0 50 50" fill="white">
          <rect x="19" y="0" width="12" height="50" rx="4" />
          <rect x="0" y="19" width="50" height="12" rx="4" />
        </svg>
      </div>

      {/* ── Content ── */}
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-10 text-center">

        {/* Location badge */}
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-5 py-2 mb-8 text-sm text-green-100">
          <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse flex-shrink-0" />
          <svg className="w-3.5 h-3.5 text-green-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Jourian, Jammu Kashmir
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-[72px] font-extrabold mb-5 leading-tight tracking-tight">
          Expert Care,{' '}
          <span className="text-green-300">Close to Home</span>
        </h1>
        <p className="text-lg sm:text-xl text-green-100 mb-10 max-w-2xl mx-auto leading-relaxed">
          Your trusted healthcare partner in Jourian, Jammu Kashmir.<br className="hidden sm:block" />
          Specialist doctors available 6 days a week — all under one roof.
        </p>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto mb-12">
          <div className="flex items-center bg-white rounded-2xl shadow-2xl ring-4 ring-white/20 overflow-hidden">
            <div className="pl-5 pr-2 flex-shrink-0">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for Doctors, Specialities..."
              className="flex-1 py-4 pr-3 text-gray-700 text-sm outline-none placeholder-gray-400 bg-transparent"
            />
            <button type="submit"
              className="m-1.5 bg-clinic-green hover:bg-clinic-green-dark text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors flex-shrink-0">
              Search
            </button>
          </div>
        </form>

        {/* 3 Quick-action cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
          {/* Book Appointment */}
          <a href="#doctors"
            className="flex items-center gap-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-2xl p-5 transition-all duration-200 group text-left">
            <div className="w-12 h-12 bg-green-500/30 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-green-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm leading-tight">Book</p>
              <p className="text-green-200 text-xs">Appointment</p>
            </div>
            <svg className="w-4 h-4 text-green-300 group-hover:translate-x-1 transition-transform flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>

          {/* Request Callback */}
          <button onClick={openCallback}
            className="flex items-center gap-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-2xl p-5 transition-all duration-200 group text-left w-full">
            <div className="w-12 h-12 bg-blue-500/30 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-white font-semibold text-sm leading-tight">Request</p>
              <p className="text-green-200 text-xs">Callback</p>
            </div>
            <svg className="w-4 h-4 text-green-300 group-hover:translate-x-1 transition-transform flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Find a Doctor */}
          <a href="#doctors"
            className="flex items-center gap-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-2xl p-5 transition-all duration-200 group text-left">
            <div className="w-12 h-12 bg-orange-500/30 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-orange-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm leading-tight">Find a</p>
              <p className="text-green-200 text-xs">Doctor</p>
            </div>
            <svg className="w-4 h-4 text-green-300 group-hover:translate-x-1 transition-transform flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>

      {/* Bottom wave into white */}
      <div className="relative leading-none mt-8">
        <svg viewBox="0 0 1440 64" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full block">
          <path d="M0 64 C360 0 1080 0 1440 64 L1440 64 L0 64 Z" fill="white" />
        </svg>
      </div>
    </section>
  );
}
