export default function HeroSection() {
  return (
    <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white py-16 px-4">
      <div className="max-w-6xl mx-auto text-center">
        {/* Medical cross icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-full mb-6 ring-4 ring-white/20">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight">
          Life Care Clinic
        </h1>
        <p className="text-blue-200 text-lg mb-2 font-medium">
          Main Road W No 7 Jourian &mdash; Near SBI, J&amp;K 181202
        </p>
        <p className="text-blue-100 text-sm mb-8 max-w-lg mx-auto">
          Quality healthcare with specialist doctors. Book your appointment easily online.
        </p>

        {/* Contact cards */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8 flex-wrap">
          <a
            href="tel:01924467500"
            className="flex items-center gap-2 bg-white/15 hover:bg-white/25 transition px-5 py-3 rounded-xl backdrop-blur-sm"
          >
            <svg className="w-5 h-5 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span className="font-semibold text-white">01924-467500</span>
          </a>
          {['9906107887', '7780924767', '9070507887'].map((tel) => (
            <a
              key={tel}
              href={`tel:${tel}`}
              className="flex items-center gap-2 bg-white/15 hover:bg-white/25 transition px-5 py-3 rounded-xl backdrop-blur-sm"
            >
              <svg className="w-5 h-5 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span className="font-semibold text-white">{tel}</span>
            </a>
          ))}
        </div>

        {/* Stats row */}
        <div className="flex flex-col sm:flex-row justify-center gap-8 text-center">
          <div>
            <p className="text-3xl font-bold text-white">10+</p>
            <p className="text-blue-200 text-sm">Specialist Doctors</p>
          </div>
          <div className="hidden sm:block w-px bg-white/20"></div>
          <div>
            <p className="text-3xl font-bold text-white">9</p>
            <p className="text-blue-200 text-sm">Specialties</p>
          </div>
          <div className="hidden sm:block w-px bg-white/20"></div>
          <div>
            <p className="text-3xl font-bold text-white">Easy</p>
            <p className="text-blue-200 text-sm">Online Booking</p>
          </div>
        </div>
      </div>
    </section>
  );
}
