import { Link } from "react-router";
import { ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/react-app/components/ui/button";

export default function PrivacyPolicy() {
  const lastUpdated = "January 15, 2025";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-gray-900 text-lg">Ascend</span>
              <span className="text-xs text-gray-500 block -mt-1">A Coheron Tech Product</span>
            </div>
          </div>
          <Link to="/">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Ascend
            </Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-gray-500 mb-8">Last Updated: {lastUpdated}</p>

          <div className="prose prose-gray max-w-none">
            {/* Section 1 */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Introduction</h2>
              <p className="text-gray-600 leading-relaxed">
                Welcome to Ascend by Coheron ("Ascend," "we," "us," or "our"). Ascend is an AI-powered 
                career acceleration platform designed to help professionals build optimized profiles, 
                search for jobs, and advance their careers. Ascend is a product of Coheron Tech Private 
                Limited, a company registered under the laws of India, with its principal office in 
                Bangalore, Karnataka.
              </p>
              <p className="text-gray-600 leading-relaxed mt-3">
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
                when you use our platform. Please read this policy carefully. By using Ascend, you consent 
                to the practices described in this Privacy Policy.
              </p>
            </section>

            {/* Section 2 */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Information We Collect</h2>
              <p className="text-gray-600 leading-relaxed mb-3">We collect the following categories of information:</p>
              
              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">2.1 Profile Data</h3>
              <p className="text-gray-600 leading-relaxed">
                Information you provide when creating your career profile, including your name, email address, 
                phone number, location, professional headline, summary, work experience, education history, 
                skills, career goals, target roles, target industries, LinkedIn profile URL, and uploaded 
                resume documents.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">2.2 Usage Data</h3>
              <p className="text-gray-600 leading-relaxed">
                Information about how you interact with Ascend, including pages visited, features used, 
                job searches performed, applications tracked, AI optimizations generated, and time spent 
                on various sections of the platform.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">2.3 Device and Browser Data</h3>
              <p className="text-gray-600 leading-relaxed">
                Technical information such as your IP address, browser type and version, operating system, 
                device type, screen resolution, and referring URLs.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">2.4 Google OAuth Data</h3>
              <p className="text-gray-600 leading-relaxed">
                When you sign in using Google, we receive your Google account email address, display name, 
                profile picture URL, and a unique identifier. We do not receive or store your Google password.
              </p>
            </section>

            {/* Section 3 */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. How We Use Your Information</h2>
              <p className="text-gray-600 leading-relaxed mb-3">We use collected information for the following purposes:</p>
              
              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">3.1 Service Delivery</h3>
              <p className="text-gray-600 leading-relaxed">
                To provide, maintain, and improve Ascend's features, including profile optimization, 
                job search, resume tailoring, application tracking, interview preparation, and salary insights.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">3.2 AI Model Improvement</h3>
              <p className="text-gray-600 leading-relaxed">
                To train and improve our AI models that power profile optimization, job matching, and 
                career recommendations. For Free tier users, anonymized data may be used for AI training 
                as described in Section 5.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">3.3 Market Intelligence</h3>
              <p className="text-gray-600 leading-relaxed">
                To generate aggregated, anonymized insights about job market trends, salary benchmarks, 
                and skill demand patterns. Individual users are never identifiable in these reports.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">3.4 Communications</h3>
              <p className="text-gray-600 leading-relaxed">
                To send you service-related notifications, respond to your inquiries, and (with your consent) 
                send marketing communications about new features, career tips, and promotional offers.
              </p>
            </section>

            {/* Section 4 */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Data Sharing</h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                <strong>We do not sell your personal data.</strong> We may share your information only in 
                the following limited circumstances:
              </p>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">4.1 Service Providers</h3>
              <p className="text-gray-600 leading-relaxed">
                We work with third-party service providers (cloud hosting, payment processing, analytics) 
                who process data on our behalf. All service providers are bound by non-disclosure agreements 
                (NDAs) and data processing agreements that require them to protect your information and use 
                it only for the specific services they provide to us.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">4.2 Employer Visibility</h3>
              <p className="text-gray-600 leading-relaxed">
                Your profile information will only be visible to potential employers or recruiters if you 
                explicitly opt-in to such visibility. You have complete control over whether and to whom 
                your profile is discoverable.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">4.3 Legal Requirements</h3>
              <p className="text-gray-600 leading-relaxed">
                We may disclose your information if required by law, court order, or government regulation, 
                or if we believe such disclosure is necessary to protect our rights, protect your safety or 
                the safety of others, investigate fraud, or respond to a government request.
              </p>
            </section>

            {/* Section 5 */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Free vs Pro Data Usage</h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                Ascend operates a tiered data consent model that provides different data usage rights 
                based on your subscription tier:
              </p>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">5.1 Free Tier</h3>
              <p className="text-gray-600 leading-relaxed">
                By using Ascend's Free tier, you agree that your anonymized data may be used for:
              </p>
              <ul className="list-disc pl-6 text-gray-600 mt-2 space-y-1">
                <li>Training and improving our AI models</li>
                <li>Generating aggregated market intelligence reports</li>
                <li>Analyzing usage patterns to improve the platform</li>
                <li>Creating anonymized industry benchmark reports</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-3">
                Your individual data is never shared without your explicit consent. All AI training and 
                market intelligence uses strictly anonymized data where no individual can be identified.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">5.2 Pro Tier</h3>
              <p className="text-gray-600 leading-relaxed">
                Pro subscribers have enhanced data privacy. Your data will not be used for AI training 
                or market intelligence purposes unless you explicitly opt-in through the "Help Improve Ascend" 
                toggle in your settings.
              </p>
            </section>

            {/* Section 6 */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Data Retention</h2>
              
              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">6.1 Active Accounts</h3>
              <p className="text-gray-600 leading-relaxed">
                We retain your personal data for as long as your account remains active and you continue 
                to use Ascend. Your profile data, job applications, and platform activity will be maintained 
                to provide you with continuous service.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">6.2 Account Deletion</h3>
              <p className="text-gray-600 leading-relaxed">
                Upon receiving an account deletion request through the Settings page, we will schedule 
                your data for permanent deletion. All personal data will be deleted within 30 calendar days 
                of the request, except where retention is required for legal compliance, fraud prevention, 
                or legitimate business purposes (such as backup archives, which are purged on a rolling basis).
              </p>
            </section>

            {/* Section 7 */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Your Rights under DPDP Act 2023</h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                Under the Digital Personal Data Protection Act, 2023 of India, you have the following rights:
              </p>
              
              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">7.1 Right to Access</h3>
              <p className="text-gray-600 leading-relaxed">
                You have the right to request a copy of the personal data we hold about you. You can 
                request a data export through the Settings page, and we will provide your data within 
                24 hours via email.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">7.2 Right to Correction</h3>
              <p className="text-gray-600 leading-relaxed">
                You have the right to correct inaccurate or incomplete personal data. You can update 
                your profile information directly through the Ascend platform at any time.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">7.3 Right to Erasure</h3>
              <p className="text-gray-600 leading-relaxed">
                You have the right to request deletion of your personal data. You can initiate account 
                deletion through the Settings page. Data will be permanently deleted within 30 days.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">7.4 Grievance Redressal</h3>
              <p className="text-gray-600 leading-relaxed">
                If you have concerns about how we handle your data, you may contact our Grievance Officer 
                (see Section 12). We will acknowledge your grievance within 48 hours and resolve it within 
                30 days in compliance with the DPDP Act.
              </p>
            </section>

            {/* Section 8 */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Cookies and Tracking</h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                We use cookies and similar tracking technologies to enhance your experience:
              </p>
              
              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">8.1 Essential Cookies</h3>
              <p className="text-gray-600 leading-relaxed">
                Required for authentication, session management, and security. These cannot be disabled 
                as they are necessary for the platform to function.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">8.2 Analytics Cookies</h3>
              <p className="text-gray-600 leading-relaxed">
                Used to understand how visitors interact with Ascend, which pages are most popular, 
                and how users navigate the platform. This helps us improve the user experience.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">8.3 Preference Cookies</h3>
              <p className="text-gray-600 leading-relaxed">
                Remember your preferences, such as theme settings and language preferences, to provide 
                a personalized experience.
              </p>
            </section>

            {/* Section 9 */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Data Security</h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                We implement robust security measures to protect your information:
              </p>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">9.1 Encryption</h3>
              <p className="text-gray-600 leading-relaxed">
                All data is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption. 
                Your uploaded documents and sensitive profile data are stored in encrypted storage.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">9.2 Access Controls</h3>
              <p className="text-gray-600 leading-relaxed">
                Access to personal data is restricted to authorized personnel only, on a need-to-know basis. 
                All access is logged and audited regularly.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">9.3 Incident Response</h3>
              <p className="text-gray-600 leading-relaxed">
                We maintain an incident response plan to detect, respond to, and recover from security 
                incidents. In the event of a data breach affecting your personal information, we will 
                notify you and relevant authorities as required by law.
              </p>
            </section>

            {/* Section 10 */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Children's Privacy</h2>
              <p className="text-gray-600 leading-relaxed">
                Ascend is intended for users who are 18 years of age or older. We do not knowingly 
                collect personal data from individuals under 18. Users must confirm they are 18+ 
                during the account setup process. If we discover that we have inadvertently collected 
                data from a minor, we will delete such data immediately upon discovery.
              </p>
            </section>

            {/* Section 11 */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Changes to This Policy</h2>
              <p className="text-gray-600 leading-relaxed">
                We may update this Privacy Policy from time to time to reflect changes in our practices, 
                legal requirements, or platform features. When we make material changes, we will notify 
                you by:
              </p>
              <ul className="list-disc pl-6 text-gray-600 mt-2 space-y-1">
                <li>Posting the updated policy on this page with a new "Last Updated" date</li>
                <li>Displaying a prominent notice within the Ascend platform</li>
                <li>Sending an email notification to your registered email address (for material changes)</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-3">
                Your continued use of Ascend after such modifications constitutes your acceptance of 
                the updated Privacy Policy.
              </p>
            </section>

            {/* Section 12 */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Grievance Officer</h2>
              <p className="text-gray-600 leading-relaxed">
                In accordance with the Information Technology Act, 2000 and the Digital Personal Data 
                Protection Act, 2023, we have appointed a Grievance Officer to address your concerns:
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mt-4">
                <p className="text-gray-700"><strong>Name:</strong> [To be updated]</p>
                <p className="text-gray-700 mt-1"><strong>Email:</strong> privacy@coheron.tech</p>
                <p className="text-gray-700 mt-1"><strong>Response Time:</strong> Acknowledgment within 48 hours; 
                  resolution within 30 days</p>
              </div>
            </section>

            {/* Section 13 */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">13. Contact Us</h2>
              <p className="text-gray-600 leading-relaxed">
                For any questions, concerns, or requests regarding this Privacy Policy or your personal 
                data, please contact us:
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mt-4">
                <p className="text-gray-700"><strong>Email:</strong> legal@coheron.tech</p>
                <p className="text-gray-700 mt-2"><strong>Mailing Address:</strong></p>
                <p className="text-gray-700">Coheron Tech Private Limited</p>
                <p className="text-gray-700">Bangalore, Karnataka</p>
                <p className="text-gray-700">India</p>
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>© 2025 Coheron Tech Private Limited. All rights reserved.</p>
          <div className="flex items-center justify-center gap-4 mt-2">
            <Link to="/privacy-policy" className="hover:text-emerald-600 transition-colors">Privacy Policy</Link>
            <span>•</span>
            <Link to="/terms-of-service" className="hover:text-emerald-600 transition-colors">Terms of Service</Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
