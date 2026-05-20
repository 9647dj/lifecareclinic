import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_LOGIN,
    pass: process.env.BREVO_SMTP_PASSWORD,
  },
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { from, to, subject, html } = req.body;

  if (!to || !subject || !html) {
    return res.status(400).json({ error: 'Missing required fields: to, subject, html' });
  }

  try {
    const info = await transporter.sendMail({
      from: from || 'Life Care Clinic <lifecarejourian@gmail.com>',
      to,
      subject,
      html,
    });

    console.log('[send-email] Sent OK, messageId:', info.messageId);
    return res.status(200).json({ id: info.messageId });
  } catch (e) {
    console.error('[send-email] Exception:', e.message);
    return res.status(500).json({ error: e.message });
  }
}
