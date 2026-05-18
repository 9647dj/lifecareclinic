# 🏥 Life Care Clinic — Doctor Appointment Booking System

![Live Demo](https://img.shields.io/badge/Live-lifecareclinic.vercel.app-green)
![React](https://img.shields.io/badge/React-19-blue)
![Supabase](https://img.shields.io/badge/Supabase-Database-green)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-black)

## 🌐 Live Demo
**[https://lifecareclinic.vercel.app](https://lifecareclinic.vercel.app)**

## 📋 Overview
A full-stack doctor appointment booking system for Life Care Clinic, Jourian, Jammu Kashmir. Built with React.js and Supabase, featuring patient booking, staff dashboard, admin panel, and email notifications.

## ✨ Features
- 🩺 9 Specialist Doctors + Eye Camp booking
- 📅 Smart date picker showing next available slots
- 👤 Patient login and profile management
- 📋 Booking history for patients
- 👨‍💼 Staff dashboard with KPIs and filters
- 🔐 Admin panel with full control
- 📧 Email notifications via EmailJS
- 📞 Callback request system
- 🗺️ Google Maps integration
- 📱 Fully mobile responsive
- 📊 Analytics and reporting

## 🛠️ Tech Stack
| Technology | Purpose |
|---|---|
| React.js 19 | Frontend framework |
| Tailwind CSS | Styling |
| Supabase | Database & Authentication |
| EmailJS | Email notifications |
| Vercel | Hosting & Deployment |
| GitHub | Version control |

## 📁 Project Structure

```
lifecareclinic/
├── public/
├── src/
│   ├── assets/              # Logo, hero image
│   ├── components/
│   │   ├── BookingModal.jsx  # Appointment booking form
│   │   ├── CallbackButton.jsx# Floating callback request
│   │   ├── DatePicker.jsx    # Custom date picker
│   │   ├── DoctorCard.jsx    # Doctor profile card
│   │   ├── Footer.jsx        # Site footer
│   │   ├── HeroSection.jsx   # Landing hero
│   │   ├── Navbar.jsx        # Navigation bar
│   │   ├── ProtectedRoute.jsx# Auth route guards
│   │   └── WhatsAppButton.jsx# Floating WhatsApp CTA
│   ├── context/
│   │   └── AuthContext.jsx   # Patient + staff auth state
│   ├── data/
│   │   └── doctors.js        # Doctor profiles & schedules
│   ├── lib/
│   │   └── supabase.js       # Supabase client
│   ├── pages/
│   │   ├── Admin.jsx         # Admin dashboard
│   │   ├── AdminLogin.jsx    # Admin login
│   │   ├── Home.jsx          # Landing page
│   │   ├── Login.jsx         # Patient login / register
│   │   ├── Profile.jsx       # Patient profile & history
│   │   ├── StaffDashboard.jsx# Staff management dashboard
│   │   └── StaffLogin.jsx    # Staff login
│   ├── App.jsx               # Router setup
│   └── main.jsx              # Entry point
├── .env.example              # Environment variable template
├── vercel.json               # Vercel SPA routing config
└── package.json
```

## 🗄️ Database Schema

| Table | Description |
|---|---|
| `profiles` | Patient profiles linked to Supabase Auth |
| `appointments` | Booked appointments with doctor, date, status |
| `callbacks` | Callback requests with preferred time |
| `staff_accounts` | Staff & admin login credentials |

## 🔐 Authentication

| Role | Method | Access |
|---|---|---|
| Patient | Supabase Auth (email + password) | Book appointments, view history |
| Staff | `staff_accounts` table (name + password) | View/manage appointments & callbacks |
| Admin | `staff_accounts` table (role = admin) | Full control + manage staff |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project
- An [EmailJS](https://emailjs.com) account

### Installation

```bash
# Clone the repository
git clone https://github.com/9647dj/lifecareclinic.git
cd lifecareclinic

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in your values in .env

# Start development server
npm run dev
```

### Environment Variables

```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_EMAILJS_SERVICE_ID=your-emailjs-service-id
VITE_EMAILJS_TEMPLATE_ID=your-emailjs-booking-template-id
VITE_EMAILJS_CALLBACK_TEMPLATE_ID=your-emailjs-callback-template-id
VITE_EMAILJS_PUBLIC_KEY=your-emailjs-public-key
```

### Database Setup

Run the following SQL in your Supabase project:

```sql
-- Patient profiles
create table profiles (
  id uuid references auth.users primary key,
  full_name text,
  mobile text,
  dob text,
  address text,
  updated_at timestamp
);

-- Appointments
create table appointments (
  id uuid default gen_random_uuid() primary key,
  doctor_name text,
  specialty text,
  patient_name text,
  dob text,
  mobile text,
  address text,
  appointment_date date,
  appointment_time text,
  status text default 'upcoming',
  created_at timestamp default now()
);

-- Callback requests
create table callbacks (
  id uuid default gen_random_uuid() primary key,
  patient_name text,
  mobile text,
  preferred_time text,
  status text default 'pending',
  created_at timestamp default now()
);

-- Staff accounts
create table staff_accounts (
  id uuid default gen_random_uuid() primary key,
  full_name text not null,
  password text not null,
  role text default 'staff',
  is_active boolean default true,
  created_at timestamp default now()
);
alter table staff_accounts disable row level security;

-- Seed admin account
insert into staff_accounts (full_name, password, role)
values ('Admin', 'your-admin-password', 'admin');
```

## 📦 Build & Deploy

```bash
# Production build
npm run build

# Deploy to Vercel
vercel --prod
```

## 📞 Contact

**Life Care Clinic**
Main Road W No 7, Jourian, Near SBI, Jammu Kashmir 181202

- 📞 01924-467500
- 📸 [@lifecarejourian](https://instagram.com/lifecarejourian)
- 🕐 Mon–Sat: 9 AM – 8 PM | Sunday: 10 AM – 4 PM

---

*Built with ❤️ for Jourian*
