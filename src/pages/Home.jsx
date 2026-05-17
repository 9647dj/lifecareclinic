import { useState, useMemo } from 'react';
import HeroSection from '../components/HeroSection';
import DoctorCard from '../components/DoctorCard';
import BookingModal from '../components/BookingModal';
import { doctors, categories } from '../data/doctors';

const SERVICES = [
  {
    title: 'Specialist Consultation',
    desc: '9+ expert doctors across multiple specialties',
    bg: 'bg-emerald-50',
    ring: 'ring-emerald-100',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    title: 'Diagnostic Laboratory',
    desc: 'Fully equipped lab for accurate results',
    bg: 'bg-blue-50',
    ring: 'ring-blue-100',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
  },
  {
    title: 'Pharmacy',
    desc: 'In-house pharmacy with all medicines',
    bg: 'bg-purple-50',
    ring: 'ring-purple-100',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    title: 'ECG Services',
    desc: 'Electrocardiography for heart monitoring',
    bg: 'bg-red-50',
    ring: 'ring-red-100',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
  {
    title: 'Home Blood Collection',
    desc: 'Sample collection at your doorstep',
    bg: 'bg-orange-50',
    ring: 'ring-orange-100',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    title: 'Immunization & Vaccines',
    desc: 'Complete vaccination programmes for all ages',
    bg: 'bg-teal-50',
    ring: 'ring-teal-100',
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-600',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
];

const STATS = [
  { value: '9+',    label: 'Specialist Doctors' },
  { value: '6',     label: 'Days a Week' },
  { value: '5★',   label: 'Google Rated' },
  { value: '2020',  label: 'Established' },
];

export default function Home() {
  const [searchQuery, setSearchQuery]       = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const filtered = useMemo(() => {
    return doctors.filter((d) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        d.name.toLowerCase().includes(q) ||
        d.specialty.toLowerCase().includes(q) ||
        (d.role || '').toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q);
      const matchesCategory = selectedCategory === 'All' || d.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  function clearFilter() {
    setSelectedCategory('All');
    setSearchQuery('');
  }

  return (
    <>
      <HeroSection onSearch={setSearchQuery} />

      {/* ── Services Section ── */}
      <section id="services" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-clinic-green bg-clinic-green-lite px-4 py-1.5 rounded-full mb-4">
              What We Offer
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">Our Services</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Comprehensive healthcare under one roof — from specialist consultations to diagnostics and pharmacy.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((s) => (
              <div key={s.title}
                className={`${s.bg} ring-1 ${s.ring} rounded-2xl p-6 hover:shadow-md transition-shadow duration-200 group`}>
                <div className={`${s.iconBg} w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${s.iconColor}`}>
                  {s.icon}
                </div>
                <h3 className="font-bold text-gray-900 text-base mb-1.5">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats Banner ── */}
      <section id="about" style={{ backgroundColor: '#1B5E20' }} className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-white/15">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center py-6 sm:py-0 px-6">
                <p className="text-4xl sm:text-5xl font-extrabold text-white mb-2">{stat.value}</p>
                <p className="text-green-200 text-sm font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Doctors Section ── */}
      <section id="doctors" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="text-center mb-10">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-clinic-green bg-clinic-green-lite px-4 py-1.5 rounded-full mb-4">
              Meet Our Team
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
              {selectedCategory === 'All' ? 'Our Specialist Doctors' : `${selectedCategory} Specialists`}
            </h2>
            <p className="text-gray-500">Book an appointment with any of our specialists</p>
          </div>

          {/* Search */}
          <div className="relative mb-5 max-w-lg mx-auto">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by doctor name, specialty or role..."
              className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-clinic-green focus:border-clinic-green bg-white shadow-sm transition"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Category filter chips */}
          <div className="flex flex-wrap gap-2 items-center justify-center mb-8">
            {selectedCategory === 'All' ? (
              categories.map((cat) => (
                <button key={cat} onClick={() => setSelectedCategory(cat)}
                  className="px-4 py-1.5 rounded-full text-sm font-medium bg-white text-gray-600 border border-gray-200 hover:border-clinic-green hover:text-clinic-green hover:bg-clinic-green-lite transition-all duration-200">
                  {cat}
                </button>
              ))
            ) : (
              <div className="flex items-center gap-3 animate-fade-in">
                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold bg-clinic-green text-white shadow-sm">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  {selectedCategory}
                </span>
                <button onClick={clearFilter}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold text-clinic-green border-2 border-clinic-green hover:bg-clinic-green hover:text-white transition-all duration-200">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  All Doctors
                </button>
              </div>
            )}
          </div>

          {/* Count badge */}
          <div className="flex justify-end mb-5">
            <span className="text-sm text-gray-400 font-medium bg-white border border-gray-100 px-3 py-1 rounded-full shadow-sm">
              {filtered.length} doctor{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Cards grid */}
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((doctor) => (
                <DoctorCard key={doctor.id} doctor={doctor} onBook={setSelectedDoctor} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-gray-400">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-semibold text-gray-500 text-lg mb-1">No doctors found</p>
              <p className="text-sm">Try a different search term or category</p>
              <button onClick={clearFilter}
                className="mt-4 text-clinic-green text-sm font-semibold hover:underline">
                Clear filters
              </button>
            </div>
          )}

          {/* Call us banner */}
          <div className="mt-14 bg-white border border-gray-100 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-sm">
            <div className="w-12 h-12 bg-clinic-green-lite rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-clinic-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 mb-1">Need help booking?</h3>
              <p className="text-sm text-gray-600">
                Call us at{' '}
                {['01924-467500', '9906107887', '7780924767', '9070507887'].map((num, i, arr) => (
                  <span key={num}>
                    <a href={`tel:${num.replace(/-/g, '')}`}
                      className="font-bold text-clinic-green hover:underline">{num}</a>
                    {i < arr.length - 1 ? ', ' : ' during clinic hours.'}
                  </span>
                ))}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Find Us Section ── */}
      <section id="contact" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-clinic-green bg-clinic-green-lite px-4 py-1.5 rounded-full mb-4">
              Location
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">Find Us</h2>
            <p className="text-gray-500">We're easy to find — right on Main Road, Jourian</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            {/* Left — contact details */}
            <div className="space-y-8">
              {/* Address */}
              <div className="flex gap-4">
                <div className="w-11 h-11 bg-clinic-green-lite rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-clinic-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-0.5">Address</p>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Main Road W No 7 Jourian<br />Near SBI, Jammu Kashmir 181202
                  </p>
                  <a href="https://maps.app.goo.gl/PUiS39YiwmXtdwp66" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-clinic-green text-sm font-semibold mt-2 hover:underline">
                    Get Directions
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>

              {/* Phone */}
              <div className="flex gap-4">
                <div className="w-11 h-11 bg-clinic-green-lite rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-clinic-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-2">Phone Numbers</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    {['01924-467500', '9906107887', '7780924767', '9070507887'].map((num) => (
                      <a key={num} href={`tel:${num.replace(/-/g, '')}`}
                        className="text-sm font-medium text-clinic-green hover:underline">
                        {num}
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              {/* Hours */}
              <div className="flex gap-4">
                <div className="w-11 h-11 bg-clinic-green-lite rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-clinic-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-2">Clinic Hours</p>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex gap-8">
                      <span className="text-gray-500 w-24">Mon – Sat</span>
                      <span className="font-medium text-gray-800">9:00 AM – 8:00 PM</span>
                    </div>
                    <div className="flex gap-8">
                      <span className="text-gray-500 w-24">Sunday</span>
                      <span className="font-medium text-gray-800">10:00 AM – 4:00 PM</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* WhatsApp CTA */}
              <a href="https://wa.me/919906107887" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-5 py-3 rounded-xl text-white font-semibold text-sm transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#25D366' }}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Chat on WhatsApp
              </a>
            </div>

            {/* Right — map */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100">
              {/* Map address bar */}
              <div className="flex items-center gap-3 px-5 py-3.5 bg-clinic-green-lite border-b border-green-100">
                <svg className="w-4 h-4 text-clinic-green flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm font-medium text-clinic-green flex-1 truncate">
                  Main Road W No 7 Jourian, Near SBI, Jammu Kashmir 181202
                </span>
                <a href="https://maps.app.goo.gl/PUiS39YiwmXtdwp66" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-semibold text-clinic-green hover:text-clinic-green-dark transition-colors whitespace-nowrap flex-shrink-0">
                  Open in Maps
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
              <div className="w-full h-80 sm:h-96">
                <iframe
                  title="Life Care Clinic Location"
                  src="https://maps.google.com/maps?q=32.8335247,74.5806594&z=17&output=embed"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Booking modal */}
      {selectedDoctor && (
        <BookingModal doctor={selectedDoctor} onClose={() => setSelectedDoctor(null)} />
      )}
    </>
  );
}
