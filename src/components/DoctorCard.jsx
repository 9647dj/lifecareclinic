export default function DoctorCard({ doctor, onBook }) {
  const scheduleSummary = doctor.schedule.map((s) => s.day).join(' / ');

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col overflow-hidden">
      {/* Card header */}
      <div className={`${doctor.lightColor} px-6 pt-6 pb-4`}>
        <div className="flex items-start gap-4">
          <div className={`${doctor.color} w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-sm`}>
            {doctor.initials}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-lg leading-tight">{doctor.name}</h3>
            <p className={`text-sm font-medium mt-0.5 ${doctor.textColor}`}>{doctor.category}</p>
          </div>
        </div>
        <p className="mt-3 text-sm text-gray-600 leading-relaxed">{doctor.specialty}</p>
      </div>

      {/* Schedule */}
      <div className="px-6 py-4 flex-1">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Available Days</p>
        <div className="flex flex-wrap gap-2">
          {doctor.schedule.map((slot, idx) => (
            <span key={idx} className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${doctor.badgeColor}`}>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {slot.day}
            </span>
          ))}
        </div>

        <div className="mt-3 space-y-1">
          {doctor.schedule.map((slot, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                <span className="font-medium text-gray-700">{slot.day}:</span>{' '}
                {slot.startTime === 'TBD'
                  ? 'Time to be confirmed'
                  : slot.endTime
                  ? `${slot.startTime} – ${slot.endTime}`
                  : `${slot.startTime} onwards`}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Book button */}
      <div className="px-6 pb-5">
        <button
          onClick={() => onBook(doctor)}
          className="w-full bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors duration-150 text-sm flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Book Appointment
        </button>
      </div>
    </div>
  );
}
