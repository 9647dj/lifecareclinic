export default function Footer() {
  return (
    <footer className="bg-blue-900 text-blue-100 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Clinic Info */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="text-white font-bold text-lg">Life Care Clinic</h3>
            </div>
            <p className="text-sm text-blue-200 leading-relaxed">
              Providing quality healthcare services with specialist doctors across multiple medical fields.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-3">Contact Us</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-blue-300 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-blue-200">Main Road W No 7 Jourian<br />Near SBI, Jammu Kashmir 181202</span>
              </div>
              <a href="tel:01924467500" className="flex items-center gap-2 text-blue-200 hover:text-white transition">
                <svg className="w-4 h-4 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                01924-467500
              </a>
              {[
                { tel: '9906107887', display: '9906107887' },
                { tel: '7780924767', display: '7780924767' },
                { tel: '9070507887', display: '9070507887' },
              ].map(({ tel, display }) => (
                <a key={tel} href={`tel:${tel}`} className="flex items-center gap-2 text-blue-200 hover:text-white transition">
                  <svg className="w-4 h-4 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  {display}
                </a>
              ))}
            </div>
          </div>

          {/* Specialties */}
          <div>
            <h4 className="text-white font-semibold mb-3">Specialties</h4>
            <div className="flex flex-wrap gap-2">
              {['Paediatrics', 'Orthopaedics', 'Dermatology', 'Cardiology', 'General Medicine', 'ENT', 'Gynaecology', 'Dental', 'Eye Camp'].map((s) => (
                <span key={s} className="bg-white/10 text-blue-100 text-xs px-2.5 py-1 rounded-full">{s}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-blue-800 mt-8 pt-6 text-center text-xs text-blue-400">
          &copy; {new Date().getFullYear()} Life Care Clinic, Jourian, Jammu Kashmir. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
