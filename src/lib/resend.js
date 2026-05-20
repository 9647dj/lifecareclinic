// Browser-side email helper — proxies all sends through /api/send-email (Vercel
// serverless function) because SMTP credentials must never be exposed client-side.
// Keeps the resend.emails.send() call shape used across the codebase.

async function sendEmail({ from, to, subject, html }) {
  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, subject, html }),
    });

    const data = await res.json();
    if (!res.ok) console.error('[email] API error:', res.status, data);
    return data;
  } catch (err) {
    console.error('[email] fetch error:', err.message);
    throw err;
  }
}

// Matches the resend.emails.send() call shape used throughout the codebase
const resend = {
  emails: {
    send: sendEmail,
  },
};

export default resend;
