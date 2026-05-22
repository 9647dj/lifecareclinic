import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const FROM_EMAIL = 'Life Care Clinic <lifecarejourian@gmail.com>';

const DOCTOR_META = {
  navdeep:    { name: 'Dr. Navdeep Singh',       specialty: 'Orthopaedic Spine Surgeon',      searchTerm: 'navdeep'    },
  nikhil_thu: { name: 'Dr. Nikhil Gupta',         specialty: 'Child Specialist (Paediatrics)',  searchTerm: 'nikhil'     },
  nikhil_sun: { name: 'Dr. Nikhil Gupta',         specialty: 'Child Specialist (Paediatrics)',  searchTerm: 'nikhil'     },
  gurbir:     { name: 'Dr. Gurbir Singh',          specialty: 'General & Laparoscopic Surgeon', searchTerm: 'gurbir'     },
  abhirut:    { name: 'Dr. Abhirut Thakur',        specialty: 'Skin Specialist (Dermatology)',  searchTerm: 'abhirut'    },
  dhaneshwar: { name: 'Dr. Dhaneshwar Kapoor',     specialty: 'Cardiology Consultant',          searchTerm: 'dhaneshwar' },
  manoj:      { name: 'Dr. Manoj Kumar Pandita',   specialty: 'General Physician & Pathologist',searchTerm: 'manoj'      },
  anju:       { name: 'Dr. Anju Sharma',           specialty: 'ENT Specialist',                 searchTerm: 'ENT'        },
  naveen:     { name: 'Dr. Naveen Sharma',         specialty: 'Dental Specialist',              searchTerm: 'naveen'     },
};

function getTodayIST() {
  const istNow = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  return istNow.toISOString().split('T')[0];
}

function formatDateLabel(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d))
    .toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

// Generates an ICS calendar event string.
// appointment_time examples: "6:15 PM – 8:00 PM", "3:30 PM onwards", "TBD - Will be confirmed"
// Returns null if time cannot be parsed.
function buildICS(doctorName, specialty, appointmentDate, appointmentTime, patientName) {
  const match = appointmentTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return null;

  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const ampm = match[3].toUpperCase();
  if (ampm === 'PM' && h !== 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;

  // Convert IST (UTC+5:30) start time to UTC
  const totalMinutesIST = h * 60 + m;
  const totalMinutesUTC = totalMinutesIST - 330;
  const utcH = Math.floor(totalMinutesUTC / 60);
  const utcM = totalMinutesUTC % 60;

  const [year, month, day] = appointmentDate.split('-').map(Number);
  const start = new Date(Date.UTC(year, month - 1, day, utcH, utcM));
  const end   = new Date(start.getTime() + 60 * 60 * 1000); // +1 hour

  const fmt = (d) => d.toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';
  const uid = `${appointmentDate}-${patientName.replace(/\s+/g, '')}-${doctorName.replace(/\s+/g, '')}@lifecareclinic`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Life Care Clinic//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:Appointment with ${doctorName}`,
    `DESCRIPTION:${specialty} consultation at Life Care Clinic\\, Jourian`,
    'LOCATION:Main Road W No 7 Jourian Near SBI J&K 181202',
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Arrive 15 minutes before your appointment',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

function buildReminderHTML(meta, appointment) {
  const dateLabel = formatDateLabel(appointment.appointment_date);
  return `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
  <div style="background:#1a7a4a;padding:20px 28px;border-radius:12px 12px 0 0;">
    <h1 style="color:#fff;margin:0;font-size:20px;">Life Care Clinic</h1>
    <p style="color:#a7f3d0;margin:4px 0 0;font-size:13px;">Appointment Reminder</p>
  </div>
  <div style="padding:24px 28px;background:#fff;border:1px solid #e5e7eb;border-top:none;">
    <h2 style="color:#1a7a4a;margin:0 0 6px;">Your appointment is in 1 hour</h2>
    <p style="color:#374151;font-size:14px;margin:0 0 20px;">
      Dear <strong>${appointment.patient_name}</strong>, this is a reminder for your upcoming appointment.
    </p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px;">
      <tr><td style="padding:8px 12px;background:#f0fdf4;font-weight:600;width:130px;border-radius:4px 0 0 0;">Doctor</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${meta.name}</td></tr>
      <tr><td style="padding:8px 12px;background:#f0fdf4;font-weight:600;">Specialty</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${meta.specialty}</td></tr>
      <tr><td style="padding:8px 12px;background:#f0fdf4;font-weight:600;">Date</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${dateLabel}</td></tr>
      <tr><td style="padding:8px 12px;background:#f0fdf4;font-weight:600;">Time</td><td style="padding:8px 12px;">${appointment.appointment_time}</td></tr>
    </table>
    <div style="background:#fffbeb;border:1px solid #fde68a;padding:12px 16px;border-radius:8px;font-size:13px;color:#92400e;margin-bottom:20px;">
      Please arrive <strong>15 minutes early</strong> with this confirmation. Bring any previous prescriptions or reports.
    </div>
    <p style="font-size:13px;color:#6b7280;margin:0;">
      <strong>Address:</strong> Main Road W No 7, Jourian, Near SBI, J&amp;K 181202<br>
      <strong>Phone:</strong> 01924-467500
    </p>
  </div>
  <div style="padding:14px 28px;background:#f9fafb;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;font-size:12px;color:#9ca3af;text-align:center;">
    Life Care Clinic · Jourian, Jammu Kashmir · lifecarejourian@gmail.com
  </div>
</div>`;
}

export default async function handler(req, res) {
  const doctorKey = (req.query.doctor || '').toLowerCase();

  if (!doctorKey) return res.status(400).json({ error: 'Missing ?doctor= parameter' });
  const meta = DOCTOR_META[doctorKey];
  if (!meta) return res.status(400).json({ error: `Unknown doctor key: ${doctorKey}` });

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY,
  );

  const today = getTodayIST();

  // reminder_sent column must exist in the appointments table (boolean, default false).
  const { data: appointments, error } = await supabase
    .from('appointments')
    .select('id, patient_name, mobile, email, appointment_time, appointment_date')
    .ilike('doctor_name', `%${meta.searchTerm}%`)
    .eq('appointment_date', today)
    .eq('reminder_sent', false)
    .neq('status', 'cancelled')
    .not('email', 'is', null);

  if (error) {
    console.error('[patient-reminder] Supabase error:', error.message);
    return res.status(500).json({ error: error.message });
  }

  if (!appointments || appointments.length === 0) {
    console.log(`[patient-reminder] No eligible patients for ${meta.name} on ${today}`);
    return res.status(200).json({ sent: 0, reason: 'no_eligible_patients' });
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: { user: process.env.BREVO_SMTP_LOGIN, pass: process.env.BREVO_SMTP_PASSWORD },
  });

  let sent = 0;
  const failed = [];

  for (const appt of appointments) {
    const html = buildReminderHTML(meta, appt);
    const icsContent = buildICS(meta.name, meta.specialty, appt.appointment_date, appt.appointment_time, appt.patient_name);

    const mailOptions = {
      from: FROM_EMAIL,
      to: appt.email,
      subject: `Reminder: Your appointment with ${meta.name} is in 1 hour`,
      html,
      attachments: icsContent
        ? [{ filename: 'appointment.ics', content: icsContent, contentType: 'text/calendar' }]
        : [],
    };

    try {
      await transporter.sendMail(mailOptions);

      // Mark reminder as sent so re-runs don't duplicate emails.
      await supabase
        .from('appointments')
        .update({ reminder_sent: true })
        .eq('id', appt.id);

      sent++;
      console.log(`[patient-reminder] Sent to ${appt.email} for appt ${appt.id}`);
    } catch (e) {
      console.error(`[patient-reminder] Failed for ${appt.email}:`, e.message);
      failed.push(appt.email);
    }
  }

  return res.status(200).json({ sent, failed });
}
