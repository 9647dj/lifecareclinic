import { useState, useMemo } from 'react';
import HeroSection from '../components/HeroSection';
import DoctorCard from '../components/DoctorCard';
import BookingModal from '../components/BookingModal';
import { doctors, categories } from '../data/doctors';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const filtered = useMemo(() => {
    return doctors.filter((d) => {
      const matchesSearch =
        !searchQuery ||
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.role || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.category.toLowerCase().includes(searchQuery.toLowerCase());
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
      <HeroSection />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Search bar */}
        <div className="relative mb-5">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by doctor name, specialty or role..."
            className="w-full pl-10 pr-10 py-3 border border-green-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-clinic-green focus:border-clinic-green bg-white shadow-sm transition"
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
        <div className="flex flex-wrap gap-2 items-center mb-8 min-h-[36px]">
          {selectedCategory === 'All' ? (
            categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className="px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 bg-white text-gray-600 border border-green-200 hover:border-clinic-green hover:text-clinic-green hover:bg-clinic-green-lite"
              >
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
              <button
                onClick={clearFilter}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-semibold text-clinic-green border-2 border-clinic-green hover:bg-clinic-green hover:text-white transition-all duration-200"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
                All Doctors
              </button>
            </div>
          )}
        </div>

        {/* Section heading */}
        <div id="doctors" className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {selectedCategory === 'All' ? 'Our Specialist Doctors' : `${selectedCategory} Specialists`}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">Book an appointment with any of our specialists</p>
          </div>
          <span className="text-sm text-gray-400 font-medium bg-white border border-green-100 px-3 py-1 rounded-full">
            {filtered.length} doctor{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Doctor cards grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((doctor) => (
              <DoctorCard key={doctor.id} doctor={doctor} onBook={setSelectedDoctor} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400">
            <svg className="w-16 h-16 mx-auto mb-4 text-green-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        <div className="mt-14 bg-white border border-green-100 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-sm">
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

        {/* Find Us section */}
        <div className="mt-14">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-clinic-green-lite rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-clinic-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Find Us</h2>
              <p className="text-sm text-gray-500">Main Road W No 7 Jourian, Near SBI, Jammu Kashmir 181202</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-green-100">
            {/* Address bar */}
            <div className="flex items-center gap-3 px-5 py-3.5 bg-clinic-green-lite border-b border-green-100">
              <svg className="w-4 h-4 text-clinic-green flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm font-medium text-clinic-green flex-1">
                Main Road W No 7 Jourian, Near SBI, Jammu Kashmir 181202
              </span>
              <a
                href="https://maps.app.goo.gl/PUiS39YiwmXtdwp66"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-semibold text-clinic-green hover:text-clinic-green-dark transition-colors whitespace-nowrap"
              >
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
      </main>

      {selectedDoctor && (
        <BookingModal doctor={selectedDoctor} onClose={() => setSelectedDoctor(null)} />
      )}
    </>
  );
}
