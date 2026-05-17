export const doctors = [
  {
    id: 1,
    name: 'Dr. Navdeep Singh',
    specialty: 'M.B.B.S D.A., M.S. (Ortho), F.S.I.S. (Sancheti, Pune)',
    role: 'Orthopaedic Spine Surgeon & Pain Specialist',
    category: 'Orthopaedics',
    initials: 'NS',
    color: 'bg-green-600',
    lightColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-700',
    badgeColor: 'bg-green-100 text-green-700',
    schedule: [
      { day: 'Tuesday', startTime: '6:15 PM', endTime: '8:00 PM' },
      { day: 'Saturday', startTime: '6:15 PM', endTime: '8:00 PM' },
    ],
  },
  {
    id: 2,
    name: 'Dr. Nikhil Gupta',
    specialty: 'M.B.B.S., M.D., M.I.A.P., SMGS Shalamar',
    role: 'Child Specialist',
    category: 'Paediatrics',
    initials: 'NG',
    color: 'bg-blue-500',
    lightColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    badgeColor: 'bg-blue-100 text-blue-700',
    schedule: [
      { day: 'Thursday', startTime: '3:30 PM', endTime: null },
      { day: 'Sunday', startTime: '1:00 PM', endTime: null },
    ],
  },
  {
    id: 3,
    name: 'Dr. Gurbir Singh',
    specialty: 'M.B.B.S., M.S, F.M.A.S.',
    role: 'General & Laparoscopic Surgeon',
    category: 'General Medicine',
    initials: 'GS',
    color: 'bg-orange-500',
    lightColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-700',
    badgeColor: 'bg-orange-100 text-orange-700',
    schedule: [
      { day: 'Sunday', startTime: '12:00 PM', endTime: '1:00 PM' },
    ],
  },
  {
    id: 4,
    name: 'Dr. Abhirut Thakur',
    specialty: 'M.B.B.S M.D. (Dermatology)',
    role: 'Skin Specialist',
    category: 'Dermatology',
    initials: 'AT',
    color: 'bg-purple-500',
    lightColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-700',
    badgeColor: 'bg-purple-100 text-purple-700',
    schedule: [
      { day: 'Saturday', startTime: '4:00 PM', endTime: '5:00 PM' },
    ],
  },
  {
    id: 5,
    name: 'Dr. Dhaneshwar Kapoor',
    specialty: 'M.B.B.S Physician, Former Resident Super Specialist Hospital',
    role: 'Cardiology Consultant',
    category: 'Cardiology',
    initials: 'DK',
    color: 'bg-red-600',
    lightColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-700',
    badgeColor: 'bg-red-100 text-red-700',
    schedule: [
      { day: 'Saturday', startTime: '2:30 PM', endTime: '3:30 PM' },
    ],
  },
  {
    id: 6,
    name: 'Dr. Manoj Kumar Pandita',
    specialty: 'M.B.B.S DCP, Ex Resident ONB Medicine Pune',
    role: 'General Physician & Consultant Pathologist',
    category: 'General Medicine',
    initials: 'MP',
    color: 'bg-teal-600',
    lightColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
    textColor: 'text-teal-700',
    badgeColor: 'bg-teal-100 text-teal-700',
    schedule: [
      { day: 'Monday', startTime: '4:30 PM', endTime: '5:30 PM' },
      { day: 'Wednesday', startTime: '4:30 PM', endTime: '5:30 PM' },
      { day: 'Friday', startTime: '4:30 PM', endTime: '5:30 PM' },
    ],
  },
  {
    id: 7,
    name: 'ENT Specialist',
    specialty: 'ENT Specialist & Head Neck Surgeon',
    role: 'ENT Specialist & Head Neck Surgeon',
    category: 'ENT',
    initials: 'ES',
    color: 'bg-red-500',
    lightColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-700',
    badgeColor: 'bg-red-100 text-red-700',
    schedule: [
      { day: 'Sunday', startTime: '4:00 PM', endTime: '5:00 PM' },
    ],
  },
  {
    id: 8,
    name: 'Lady Specialist',
    specialty: 'Gynaecologist MBBS MD',
    role: 'Gynaecologist',
    category: 'Gynaecology',
    initials: 'LS',
    color: 'bg-pink-500',
    lightColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
    textColor: 'text-pink-700',
    badgeColor: 'bg-pink-100 text-pink-700',
    schedule: [
      { day: 'Monday', startTime: '10:00 AM', endTime: '11:00 AM' },
      { day: 'Friday', startTime: '10:00 AM', endTime: '11:00 AM' },
    ],
  },
  {
    id: 9,
    name: 'Dr. Naveen Sharma',
    specialty: 'B.D.S. M.I.D.A',
    role: 'Dental Specialist',
    category: 'Dental',
    initials: 'NvS',
    everyDay: true,
    color: 'bg-cyan-600',
    lightColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    textColor: 'text-cyan-700',
    badgeColor: 'bg-cyan-100 text-cyan-700',
    schedule: [
      { day: 'Monday', startTime: '4:30 PM', endTime: '5:00 PM' },
      { day: 'Tuesday', startTime: '4:30 PM', endTime: '5:00 PM' },
      { day: 'Wednesday', startTime: '4:30 PM', endTime: '5:00 PM' },
      { day: 'Thursday', startTime: '4:30 PM', endTime: '5:00 PM' },
      { day: 'Friday', startTime: '4:30 PM', endTime: '5:00 PM' },
      { day: 'Saturday', startTime: '4:30 PM', endTime: '5:00 PM' },
      { day: 'Sunday', startTime: '4:30 PM', endTime: '5:00 PM' },
    ],
  },
  {
    id: 10,
    name: 'Sood Eye Camp',
    specialty: 'Free Eye Checkup & Surgery',
    role: 'Free Eye Camp — ECHS & Ayushman Card Accepted',
    category: 'Eye Camp',
    isEyeCamp: true,
    initials: 'EC',
    color: 'bg-indigo-600',
    lightColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    textColor: 'text-indigo-700',
    badgeColor: 'bg-indigo-100 text-indigo-700',
    schedule: [],
  },
];

export const categories = [
  'All',
  'Paediatrics',
  'Orthopaedics',
  'Dermatology',
  'Cardiology',
  'General Medicine',
  'ENT',
  'Gynaecology',
  'Dental',
  'Eye Camp',
];

export function getAvailableDates(schedule) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dates = [];

  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    const slot = schedule.find((s) => s.day === dayName);

    if (slot) {
      dates.push({
        date,
        dayName,
        startTime: slot.startTime,
        endTime: slot.endTime,
        timeDisplay:
          slot.startTime === 'TBD'
            ? 'Time to be confirmed'
            : slot.endTime
            ? `${slot.startTime} – ${slot.endTime}`
            : `${slot.startTime} onwards`,
      });
    }
  }

  return dates;
}
