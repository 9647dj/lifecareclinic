export default function HeroSection() {
  return (
    <section
      className="relative overflow-hidden text-white"
      style={{ background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 50%, #388E3C 100%)' }}
    >
      {/* Decorative background circles */}
      <div className="absolute top-[-100px] right-[-100px] w-96 h-96 rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #A5D6A7, transparent)' }} />
      <div className="absolute bottom-[-80px] left-[-80px] w-72 h-72 rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #C8E6C9, transparent)' }} />
      <div className="absolute top-1/3 right-1/4 w-52 h-52 rounded-full opacity-5"
        style={{ background: 'radial-gradient(circle, white, transparent)' }} />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-36 text-center">

        {/* Top badge */}
        <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/25 rounded-full px-5 py-2 mb-8">
          <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
          <span className="text-sm font-semibold text-green-100 tracking-wide">Jourian, Jammu Kashmir</span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-bold mb-5 tracking-tight leading-tight">
          Life Care Clinic
        </h1>
        <p className="text-2xl md:text-3xl text-green-100 font-semibold mb-4">
          Quality Healthcare with Specialist Doctors
        </p>
        <p className="text-green-200 text-base md:text-lg mb-12 max-w-2xl mx-auto leading-relaxed">
          Your trusted medical partner in Jourian. Expert care, modern facilities,
          and dedicated specialists — all under one roof.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <a
            href="#doctors"
            className="inline-flex items-center gap-2.5 bg-white text-clinic-green font-bold px-8 py-4 rounded-xl shadow-xl hover:bg-green-50 hover:shadow-2xl transition-all duration-200 text-base"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Book Appointment
          </a>
          <a
            href="tel:01924467500"
            className="inline-flex items-center gap-2.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/30 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-200 text-base"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Call Us Now
          </a>
        </div>

        {/* Stats row */}
        <div className="inline-flex flex-col sm:flex-row items-stretch bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl overflow-hidden">
          {[
            { value: '9+', label: 'Specialist Doctors' },
            { value: '6', label: 'Days a Week' },
            { value: 'Est. 2020', label: 'Serving Jourian' },
          ].map((stat, i, arr) => (
            <div key={stat.label} className="flex items-center">
              <div className="px-10 py-5 text-center">
                <p className="text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-green-200 text-sm font-medium mt-1">{stat.label}</p>
              </div>
              {i < arr.length - 1 && (
                <div className="hidden sm:block w-px self-stretch bg-white/20 my-4" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0 leading-none">
        <svg viewBox="0 0 1440 48" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <path d="M0 48 C480 0 960 0 1440 48 L1440 48 L0 48 Z" fill="#F1F8E9" />
        </svg>
      </div>
    </section>
  );
}
