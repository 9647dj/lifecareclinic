import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const CLINIC_EMAIL = 'lifecarejourian@gmail.com';
const FROM_EMAIL   = 'Life Care Clinic <lifecarejourian@gmail.com>';

// searchTerm is matched with ILIKE against the doctor_name column in appointments.
// ENT doctor is stored as "ENT Specialist" so we search for "ENT".
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

function generatePatientCode(name, mobile) {
  if (!name || !mobile) return null;
  const namePart  = name.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 4).padEnd(4, 'X');
  const mobilePart = String(mobile).replace(/\D/g, '').slice(-4);
  if (mobilePart.length < 4) return null;
  return `LC-${namePart}-${mobilePart}`;
}

// Returns today's date in IST (UTC+5:30) as "YYYY-MM-DD".
function getTodayIST() {
  const istNow = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  return istNow.toISOString().split('T')[0];
}

function formatDateLabel(isoDate) {
  // "2026-05-22" → "Friday, 22 May 2026"
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d))
    .toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
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

  const { data: appointments, error } = await supabase
    .from('appointments')
    .select('patient_name, mobile, email, appointment_time, appointment_date')
    .ilike('doctor_name', `%${meta.searchTerm}%`)
    .eq('appointment_date', today)
    .neq('status', 'cancelled')
    .order('appointment_time', { ascending: true });

  if (error) {
    console.error('[doctor-summary] Supabase error:', error.message);
    return res.status(500).json({ error: error.message });
  }

  if (!appointments || appointments.length === 0) {
    console.log(`[doctor-summary] No patients for ${meta.name} on ${today} — skipping email`);
    return res.status(200).json({ sent: false, reason: 'no_patients' });
  }

  const visitTime = appointments[0].appointment_time;

  const rows = appointments.map((a, i) => {
    const code = generatePatientCode(a.patient_name, a.mobile) || '—';
    const bg   = i % 2 === 0 ? '#f9fafb' : '#ffffff';
    return `
      <tr style="background:${bg};">
        <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;">${i + 1}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;font-weight:600;">${a.patient_name}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;font-family:monospace;color:#1a7a4a;font-weight:700;">${code}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;">${a.mobile}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;color:#6b7280;">${a.appointment_time}</td>
      </tr>`;
  }).join('');

  const html = `
<div style="font-family:Arial,sans-serif;max-width:660px;margin:0 auto;">
  <div style="background:#1a7a4a;padding:20px 28px;border-radius:12px 12px 0 0;">
    <h1 style="color:#fff;margin:0;font-size:20px;">Life Care Clinic</h1>
    <p style="color:#a7f3d0;margin:4px 0 0;font-size:13px;">Doctor Visit Summary</p>
  </div>
  <div style="padding:24px 28px;background:#fff;border:1px solid #e5e7eb;border-top:none;">
    <h2 style="color:#1a7a4a;margin:0 0 2px;">${meta.name}</h2>
    <p style="color:#6b7280;margin:0 0 4px;font-size:14px;">${meta.specialty}</p>
    <p style="margin:0 0 20px;font-size:13px;color:#374151;">
      <strong>Visit time:</strong> ${visitTime} &nbsp;·&nbsp;
      <strong>Date:</strong> ${formatDateLabel(today)}
    </p>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <thead>
        <tr style="background:#1a7a4a;color:#fff;">
          <th style="padding:10px 14px;text-align:left;">#</th>
          <th style="padding:10px 14px;text-align:left;">Patient Name</th>
          <th style="padding:10px 14px;text-align:left;">Patient ID</th>
          <th style="padding:10px 14px;text-align:left;">Mobile</th>
          <th style="padding:10px 14px;text-align:left;">Appt. Time</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="margin-top:20px;background:#f0fdf4;border:1px solid #bbf7d0;padding:12px 16px;border-radius:8px;">
      <strong style="color:#1a7a4a;">Total patients today: ${appointments.length}</strong>
    </div>
  </div>
  <div style="padding:14px 28px;background:#f9fafb;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;font-size:12px;color:#9ca3af;text-align:center;">
    Life Care Clinic · Main Road W No 7, Jourian, Near SBI, J&amp;K 181202 · 01924-467500
  </div>
</div>`;

  const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: { user: process.env.BREVO_SMTP_LOGIN, pass: process.env.BREVO_SMTP_PASSWORD },
  });

  try {
    await transporter.sendMail({
      from: FROM_EMAIL,
      to: CLINIC_EMAIL,
      subject: `${meta.name} visiting in 2 hours — ${appointments.length} patient${appointments.length === 1 ? '' : 's'} booked`,
      html,
    });
    console.log(`[doctor-summary] Sent for ${meta.name}: ${appointments.length} patient(s)`);
    return res.status(200).json({ sent: true, count: appointments.length });
  } catch (e) {
    console.error('[doctor-summary] Email error:', e.message);
    return res.status(500).json({ error: e.message });
  }
}
