# Life Care Clinic — Doctor Appointment Booking System

[![Live Demo](https://img.shields.io/badge/Live%20Demo-lifecareclinic.vercel.app-22c55e?style=for-the-badge&logo=vercel&logoColor=white)](https://lifecareclinic.vercel.app)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)

A **production-grade, full-stack** appointment booking system built for a real medical clinic. Patients discover doctors, book appointments, and receive email confirmations — while clinic staff manage the daily queue from a real-time operations dashboard.

---

## Live Demo

**[https://lifecareclinic.vercel.app](https://lifecareclinic.vercel.app)**

| Role | Path | Credentials |
|------|------|-------------|
| Patient | `/` | Register or guest browse |
| Staff | `/staff` | Staff login (ask clinic) |
| Admin | `/admin` | Admin login (ask clinic) |

---

## Key Features

### Patient Side
- **Multi-step booking** — date picker showing only the doctor's available slots, patient details form, confirmation step, success screen with patient ID
- **Smart availability** — next 14 days computed from doctor schedules; admin-blocked dates are hidden automatically
- **Patient accounts** — Supabase Auth (email + password); profile auto-fills booking forms on return visits
- **Deterministic patient code** — `LC-[NAME]-[MOBILE]` generated client-side from name + mobile, no extra DB column
- **Email confirmations** — booking and callback confirmations sent via Brevo SMTP through a Vercel serverless function
- **Eye Camp flow** — separate booking path for free eye check-up camps (ECHS & Ayushman Card accepted)
- **Callback requests** — patients request a call-back; staff see and action these in the dashboard

### Staff Dashboard
- **Today's queue** — all appointments with one-click Done / No-Show / Cancel status updates; inline notes saved to Supabase
- **Mobile-first walk-in** — type mobile → returning patient auto-fills from DB → select doctor → submit; form resets in ~2 s ready for next patient; live today-count counter
- **Patient search** — fuzzy name or exact mobile search; shows full appointment history and patient code
- **Callbacks panel** — incoming callback requests with mark-done workflow
- **Analytics** — 30-day KPIs, per-doctor bar chart, day-of-week heatmap, bulk email to a doctor's patients

### Admin Panel
- **Appointment control** — status changes, date blocking per doctor
- **Doctor management** — full CRUD; schedules stored as `text[]` days + JSONB timings in Supabase
- **Staff accounts** — create/disable login accounts, role-based access (staff vs admin)
- **Recharts dashboards** — trend lines, completion rates, no-show tracking
- **Bulk notifications** — email all patients of a specific doctor

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 19 + Vite 8 | Fast SPA with hot module replacement |
| Routing | React Router v7 | Declarative client-side routing |
| Styling | Tailwind CSS 3 | Utility-first CSS; custom `clinic-green` theme |
| Database | Supabase (PostgreSQL) | Real-time capable DB with Row Level Security |
| Auth | Supabase Auth | JWT-based patient authentication |
| Email | Brevo SMTP + nodemailer | Delivers to any inbox; credentials server-side only |
| Serverless | Vercel Functions | Node.js `/api` route keeps SMTP secrets off the browser |
| Charts | Recharts | Composable analytics visualisations |
| Hosting | Vercel | Automatic CI/CD, edge CDN, preview URLs per branch |

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                   Browser (React SPA)                │
│                                                      │
│  Pages: Home · Login · Profile                       │
│          StaffDashboard · Admin                      │
│                                                      │
│  Context: AuthContext  — Supabase Auth + staff roles │
│  Hook:    useDoctors   — maps DB rows to typed objs  │
│  Lib:     supabase.js  — shared anon client          │
│           resend.js    — fetch wrapper → /api        │
│           utils.js     — generatePatientCode()       │
└────────────────────┬─────────────────────────────────┘
                     │ HTTPS
            ┌────────┴────────┐
            │  Vercel (CDN)   │
            └────────┬────────┘
                     │
         ┌───────────┴───────────────────┐
         │  Vercel Serverless Function   │
         │  /api/send-email.js           │
         │  nodemailer → Brevo SMTP:587  │
         └───────────────────────────────┘
                     │
            ┌────────┴────────┐
            │   Supabase      │
            │  PostgreSQL     │
            │  + Auth + RLS   │
            └─────────────────┘
```

**Tables:** `appointments` · `patients` · `doctors` · `callbacks` · `staff_accounts` · `blocked_dates`

**Security model:** The Supabase anon key is intentionally public — Row Level Security policies enforce data access. SMTP credentials live exclusively in Vercel environment variables; they are never shipped to the browser.

---

## Screenshots

> Add screenshots of the home page, booking flow, staff dashboard, and admin panel here.

---

## What I Built & Learned

### Engineering decisions
- **Serverless email routing** — SMTP credentials can't go client-side. Routing all email through a Vercel serverless function (`/api/send-email.js`) keeps secrets server-only while the browser just does a `fetch()`.
- **Multi-role auth without a separate backend** — Combined Supabase Auth (JWTs) for patients with a `staff_accounts` DB table + `sessionStorage` for staff/admin session flags. No custom auth server needed.
- **Deterministic patient IDs** — Generating `LC-[NAME]-[MOBILE]` on the fly means the patient code appears everywhere (booking confirmation, profile, staff search) without a DB column or migration.
- **JSONB schedule storage** — Doctor schedules live in Supabase as `text[]` (days) + JSONB (timings). `useDoctors.js` reconstructs typed schedule objects, so the rest of the app never touches raw JSONB.
- **Walk-in speed UX** — The biggest bottleneck for clinic staff is re-typing returning patient details. Auto-lookup on mobile number cuts a 6-field form to 1-field for ~80% of walk-ins.

### Technical skills practiced
- React 19 custom hooks, `useRef` for imperative focus control, optimistic UI updates
- Supabase Row Level Security policies (`auth.uid()`, role checks)
- Vercel serverless functions with ES module syntax
- Responsive mobile-first layouts with Tailwind CSS
- Recharts for data visualisation (line charts, bar charts, custom tooltips)
- Environment variable management across local dev and Vercel production

---

## Local Setup

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)
- A [Brevo](https://brevo.com) account for SMTP (free tier works)

### Steps

```bash
# 1. Clone
git clone https://github.com/YOUR_USERNAME/lifecareclinic.git
cd lifecareclinic

# 2. Install
npm install

# 3. Environment
cp .env.example .env
# Fill in your Supabase URL, anon key, and Brevo SMTP credentials

# 4. Database
# Run supabase_rls_fix.sql in the Supabase SQL editor to set up tables and RLS

# 5. Dev server
npm run dev
# → http://localhost:5173
```

### Environment Variables

| Variable | Where to get it |
|----------|----------------|
| `VITE_SUPABASE_URL` | Supabase dashboard → Project Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Supabase dashboard → Project Settings → API |
| `VITE_RESEND_API_KEY` | resend.com (legacy — not used for sending) |
| `BREVO_SMTP_LOGIN` | brevo.com → SMTP & API → SMTP settings |
| `BREVO_SMTP_PASSWORD` | brevo.com → SMTP & API → SMTP settings |

Only `BREVO_*` variables are secret. They are used exclusively in `/api/send-email.js` and never reach the browser.

---

## Project Structure

```
lifecareclinic/
├── api/
│   └── send-email.js         # Vercel serverless — Brevo SMTP email
├── src/
│   ├── components/
│   │   ├── BookingModal.jsx   # Multi-step booking flow
│   │   ├── DatePicker.jsx     # Available-slot date grid
│   │   ├── DoctorCard.jsx     # Doctor profile card + booking trigger
│   │   ├── CallbackButton.jsx # Floating callback request button
│   │   └── ...
│   ├── context/
│   │   └── AuthContext.jsx    # Auth state + staff role management
│   ├── data/
│   │   └── doctors.js         # Static fallback + schedule date helpers
│   ├── hooks/
│   │   └── useDoctors.js      # Fetches and maps doctors from Supabase
│   ├── lib/
│   │   ├── supabase.js        # Shared Supabase client (anon key)
│   │   ├── resend.js          # Fetch proxy to /api/send-email
│   │   └── utils.js           # generatePatientCode(name, mobile)
│   └── pages/
│       ├── Home.jsx            # Landing page — doctor listing + maps
│       ├── StaffDashboard.jsx  # Staff operations (5 tabs)
│       ├── Admin.jsx           # Admin management panel (7 tabs)
│       ├── Profile.jsx         # Patient profile + appointment history
│       └── ...
├── .env.example               # Safe template — copy to .env
├── supabase_rls_fix.sql       # DB schema + RLS setup script
└── package.json
```

---

## Deployment

Continuous deployment via Vercel — every push to `main` triggers a production build.

```bash
npm run build   # local build check
vercel --prod   # manual production deploy
```

All environment variables are set in the Vercel dashboard. The `/api` folder is automatically detected as Vercel serverless functions — no configuration needed.

---

## License

MIT — free to use as a reference or starting point for your own clinic / booking system projects.
