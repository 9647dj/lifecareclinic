import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-8">
        <Link to="/" className="text-clinic-green text-sm hover:underline font-medium">← Back to Home</Link>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-10">
        Effective: May 2026 &nbsp;·&nbsp; Compliant with the Digital Personal Data Protection Act, 2023 (DPDPA 2023)
      </p>

      <div className="space-y-10 text-gray-700">

        <Section title="1. Who We Are">
          <p>
            Life Care Clinic is a multi-specialty clinic located at Main Road W No 7, Jourian, Near SBI, Jammu &amp; Kashmir 181202.
            We are committed to protecting your personal data and respecting your privacy rights under the Digital Personal Data Protection Act, 2023 (DPDPA 2023).
          </p>
          <p className="mt-3">
            For any privacy-related questions, contact us at{' '}
            <a href="mailto:lifecarejourian@gmail.com" className="text-clinic-green hover:underline">lifecarejourian@gmail.com</a>.
          </p>
        </Section>

        <Section title="2. Data We Collect">
          <p>When you book an appointment through our website, we collect the following personal data:</p>
          <ul className="mt-3 space-y-1.5 list-disc list-inside">
            <li>Full name</li>
            <li>Date of birth</li>
            <li>Mobile number</li>
            <li>Email address (optional)</li>
            <li>Home address</li>
            <li>Gender</li>
            <li>Appointment preferences (doctor, date, time, or preferred month for eye camps)</li>
          </ul>
          <p className="mt-3">We do not collect payment information, aadhaar numbers, or any government-issued identity numbers through this website.</p>
        </Section>

        <Section title="3. Purpose of Data Collection">
          <p>We collect and process your personal data solely for the following purpose:</p>
          <ul className="mt-3 space-y-1.5 list-disc list-inside">
            <li>Registering and confirming your appointment at Life Care Clinic</li>
            <li>Sending appointment confirmation and reminder notifications (if you provide an email)</li>
            <li>Maintaining your patient visit history for continuity of care</li>
            <li>Contacting you regarding eye camp schedules or appointment changes</li>
          </ul>
          <p className="mt-3 font-medium text-gray-800">We do not use your data for marketing, advertising, or any purpose beyond direct patient care.</p>
        </Section>

        <Section title="4. We Never Sell Your Data">
          <p>
            Life Care Clinic will <strong>never sell, rent, or trade</strong> your personal data to any third party, advertiser, or data broker.
            Your information is used exclusively for managing your healthcare appointments at our clinic.
          </p>
        </Section>

        <Section title="5. Data Storage & Security">
          <p>
            Your data is stored securely on Supabase, a cloud database platform with industry-standard encryption at rest and in transit.
            Access is restricted to authorised clinic staff only. We retain your data for as long as necessary to provide healthcare services
            and comply with applicable medical record-keeping requirements.
          </p>
        </Section>

        <Section title="6. Your Rights Under DPDPA 2023">
          <p>As a data principal under the Digital Personal Data Protection Act, 2023, you have the right to:</p>
          <ul className="mt-3 space-y-2.5">
            <PrivacyRight title="Right to Access">
              Request a summary of the personal data we hold about you and how it is being processed.
            </PrivacyRight>
            <PrivacyRight title="Right to Correction">
              Request correction of any inaccurate or incomplete personal data we hold about you.
            </PrivacyRight>
            <PrivacyRight title="Right to Erasure">
              Request deletion of your personal data, subject to any legal obligations to retain medical records.
            </PrivacyRight>
            <PrivacyRight title="Right to Grievance Redressal">
              Lodge a complaint with our Grievance Officer if you believe your data rights have been violated.
            </PrivacyRight>
            <PrivacyRight title="Right to Withdraw Consent">
              Withdraw your consent for data processing at any time. Withdrawal will not affect bookings already completed.
            </PrivacyRight>
          </ul>
          <p className="mt-4 text-sm text-gray-600">
            To exercise any of these rights, email us at{' '}
            <a href="mailto:lifecarejourian@gmail.com" className="text-clinic-green hover:underline">lifecarejourian@gmail.com</a>.
            We will respond within 30 days.
          </p>
        </Section>

        <Section title="7. Grievance Officer">
          <div className="bg-green-50 border border-green-100 rounded-xl px-5 py-4">
            <p className="font-semibold text-gray-800 mb-1">Dharminder Singh</p>
            <p className="text-sm text-gray-600">Grievance Officer, Life Care Clinic</p>
            <p className="text-sm text-gray-600 mt-2">
              Email:{' '}
              <a href="mailto:lifecarejourian@gmail.com" className="text-clinic-green hover:underline">lifecarejourian@gmail.com</a>
            </p>
            <p className="text-sm text-gray-600">Phone: 01924-467500</p>
            <p className="text-sm text-gray-600">
              Address: Main Road W No 7, Jourian, Near SBI, Jammu &amp; Kashmir 181202
            </p>
            <p className="text-xs text-gray-500 mt-3">
              Complaints will be acknowledged within 48 hours and resolved within 30 days as required by DPDPA 2023.
            </p>
          </div>
        </Section>

        <Section title="8. Cookies">
          <p>
            Our website uses only essential cookies required for authentication and session management.
            We do not use tracking cookies, advertising cookies, or third-party analytics cookies.
          </p>
        </Section>

        <Section title="9. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. Any changes will be reflected on this page with an updated effective date.
            We encourage you to review this page periodically.
          </p>
        </Section>

        <div className="border-t border-gray-100 pt-8 text-sm text-gray-500">
          <p>Last updated: May 2026 &nbsp;·&nbsp; Life Care Clinic, Jourian, Jammu &amp; Kashmir</p>
          <p className="mt-1">
            Questions?{' '}
            <a href="mailto:lifecarejourian@gmail.com" className="text-clinic-green hover:underline">lifecarejourian@gmail.com</a>
            {' '}or call <a href="tel:01924467500" className="text-clinic-green hover:underline">01924-467500</a>
          </p>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-3">{title}</h2>
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  );
}

function PrivacyRight({ title, children }) {
  return (
    <li className="flex gap-3">
      <span className="w-2 h-2 rounded-full bg-clinic-green flex-shrink-0 mt-1.5" />
      <span><strong className="text-gray-800">{title}:</strong> {children}</span>
    </li>
  );
}
