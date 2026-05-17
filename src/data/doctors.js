export const doctors = [
  {
    id: 1,
    name: 'Dr. Nikhil Gupta',
    specialty: 'MD Pediatrics, Fellow in Newborn Care',
    category: 'Pediatrics',
    initials: 'NG',
    color: 'bg-blue-500',
    lightColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    badgeColor: 'bg-blue-100 text-blue-700',
    schedule: [
      { day: 'Sunday', startTime: '1:00 PM', endTime: '3:00 PM' },
      { day: 'Thursday', startTime: '4:00 PM', endTime: '5:00 PM' },
    ],
  },
  {
    id: 2,
    name: 'Dr. Abhiruth Thakur',
    specialty: 'Skin Specialist, Dermatology',
    category: 'Dermatology',
    initials: 'AT',
    color: 'bg-purple-500',
    lightColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-700',
    badgeColor: 'bg-purple-100 text-purple-700',
    schedule: [
      { day: 'Saturday', startTime: '3:30 PM', endTime: '4:30 PM' },
    ],
  },
  {
    id: 3,
    name: 'Dr. Navdeep Singh',
    specialty: 'Orthopaedic Spine Surgeon',
    category: 'Orthopaedics',
    initials: 'NS',
    color: 'bg-green-600',
    lightColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-700',
    badgeColor: 'bg-green-100 text-green-700',
    schedule: [
      { day: 'Tuesday', startTime: '6:00 PM', endTime: '8:00 PM' },
      { day: 'Saturday', startTime: '6:30 PM', endTime: '8:00 PM' },
    ],
  },
  {
    id: 4,
    name: 'Dr. Anju Sharma',
    specialty: 'ENT Specialist & Head Neck Surgeon',
    category: 'ENT',
    initials: 'AS',
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
    id: 5,
    name: 'Dr. Natasha Sharma',
    specialty: 'Gynaecologist',
    category: 'Gynaecology',
    initials: 'NS',
    color: 'bg-pink-500',
    lightColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
    textColor: 'text-pink-700',
    badgeColor: 'bg-pink-100 text-pink-700',
    schedule: [
      { day: 'Tuesday', startTime: 'TBD', endTime: 'TBD' },
    ],
  },
  {
    id: 6,
    name: 'Dr. Gurbir Singh',
    specialty: 'Laparoscopic & General Surgeon',
    category: 'Surgery',
    initials: 'GS',
    color: 'bg-orange-500',
    lightColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-700',
    badgeColor: 'bg-orange-100 text-orange-700',
    schedule: [
      { day: 'Monday', startTime: '3:00 PM', endTime: null },
    ],
  },
];

export const categories = ['All', ...new Set(doctors.map((d) => d.category))];

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
