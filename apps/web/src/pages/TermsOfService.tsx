import { Link } from "react-router";
import { ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TermsOfService() {
  const lastUpdated = "January 15, 2025";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-gray-500 mb-8">Last Updated: {lastUpdated}</p>

          <div className="prose prose-gray max-w-none">
            {/* Section 1 */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Agreement to Terms</h2>
              <p className="text-gray-600 leading-relaxed">
                By accessing or using Ascend ("Ascend," "Service," "Platform"), you agree to 
                be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may 
                not access or use the Service. These Terms constitute a legally binding agreement between 
                you ("User," "you," "your") and Coheron Tech Private Limited ("Coheron," "we," "us," "our"), 
                a company incorporated under the laws of India.
              </p>
              <p className="text-gray-600 leading-relaxed mt-3">
                We reserve the right to modify these Terms at any time. We will notify you of material 
                changes by posting the updated Terms on this page and updating the "Last Updated" date. 
                Your continued use of Ascend after such changes constitutes acceptance of the modified Terms.
              </p>
            </section>

            {/* Section 2 */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Description of Ascend</h2>
              <p className="text-gray-600 leading-relaxed">
                Ascend is an AI-powered career acceleration platform that provides the following services:
              </p>
              <ul className="list-disc pl-6 text-gray-600 mt-3 space-y-2">
                <li><strong>Profile Optimization:</strong> AI-generated optimized profiles for LinkedIn, Naukri, Indeed, Foundit, and Glassdoor</li>
                <li><strong>Resume Parsing & Building:</strong> Automated resume parsing and professional resume generation</li>
                <li><strong>Job Search:</strong> Aggregated job listings with AI-powered match scoring</li>
                <li><strong>Application Tracking:</strong> Kanban-style application management</li>
                <li><strong>Interview Preparation:</strong> AI-generated interview questions and practice feedback</li>
                <li><strong>Salary Intelligence:</strong> Market salary benchmarks and negotiation guidance</li>
                <li><strong>Career Insights:</strong> Personalized career analytics and recommendations</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Eligibility</h2>
              <p className="text-gray-600 leading-relaxed">
                To use Ascend, you must:
              </p>
              <ul className="list-disc pl-6 text-gray-600 mt-3 space-y-2">
                <li>Be at least 18 years of age or older</li>
                <li>Have a valid Google account for authentication</li>
                <li>Have the legal capacity to enter into a binding agreement</li>
                <li>Not be prohibited from using the Service under applicable laws</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-3">
                By using Ascend, you represent and warrant that you meet all eligibility requirements. 
                We reserve the right to terminate accounts that violate these eligibility criteria.
              </p>
            </section>

            {/* Section 4 */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. User Accounts and Responsibilities</h2>
              
              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">4.1 Account Creation</h3>
              <p className="text-gray-600 leading-relaxed">
                You create an account by authenticating with your Google account. You are responsible 
                for maintaining the security of your Google account credentials and for all activities 
                that occur under your Ascend account.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">4.2 Accurate Information</h3>
              <p className="text-gray-600 leading-relaxed">
                You agree to provide accurate, current, and complete information when creating your 
                career profile and throughout your use of Ascend. You are responsible for ensuring 
                that the information in your profile is truthful and up-to-date.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">4.3 Account Security</h3>
              <p className="text-gray-600 leading-relaxed">
                You must immediately notify us of any unauthorized access to or use of your account. 
                We are not liable for any loss or damage arising from your failure to maintain account security.
              </p>
            </section>

            {/* Section 5 */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Acceptable Use Policy</h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                You agree not to use Ascend for any of the following prohibited activities:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Submitting false, misleading, or fraudulent information</li>
                <li>Impersonating another person or misrepresenting your qualifications</li>
                <li>Using automated scripts, bots, or scraping tools to access the Service</li>
                <li>Attempting to gain unauthorized access to our systems or other users' accounts</li>
                <li>Uploading malware, viruses, or malicious code</li>
                <li>Using the Service for any illegal purpose or in violation of applicable laws</li>
                <li>Harassing, threatening, or abusing other users or our staff</li>
                <li>Reselling or redistributing Ascend services without authorization</li>
                <li>Interfering with the proper functioning of the platform</li>
                <li>Circumventing subscription restrictions or usage limits</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-3">
                Violation of this Acceptable Use Policy may result in immediate account termination 
                without refund.
              </p>
            </section>

            {/* Section 6 */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Subscription and Payments</h2>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">6.1 Subscription Tiers</h3>
              <p className="text-gray-600 leading-relaxed">
                Ascend offers the following subscription tiers:
              </p>
              <ul className="list-disc pl-6 text-gray-600 mt-2 space-y-1">
                <li><strong>Free Tier:</strong> Limited access to core features at no cost</li>
                <li><strong>Pro Tier:</strong> Full access to all features, enhanced privacy, priority support</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">6.2 Billing</h3>
              <p className="text-gray-600 leading-relaxed">
                Pro subscriptions are billed monthly (₹499/month) or annually (₹3,999/year). Payments 
                are processed through our payment gateway [payment gateway TBD]. All fees are exclusive 
                of applicable taxes unless stated otherwise.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">6.3 Refund Policy</h3>
              <p className="text-gray-600 leading-relaxed">
                Pro subscribers may request a pro-rated refund within 7 days of payment if they are 
                unsatisfied with the Service. Refund requests should be sent to legal@coheron.tech. 
                After 7 days, subscriptions are non-refundable but will remain active until the end 
                of the billing period.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">6.4 Cancellation</h3>
              <p className="text-gray-600 leading-relaxed">
                You may cancel your Pro subscription at any time through the Settings page. Upon 
                cancellation, you will retain Pro access until the end of your current billing period, 
                after which your account will revert to the Free tier.
              </p>
            </section>

            {/* Section 7 */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Intellectual Property</h2>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">7.1 User Content</h3>
              <p className="text-gray-600 leading-relaxed">
                You retain ownership of all content you submit to Ascend, including your profile 
                information, uploaded resumes, and other materials ("User Content"). By submitting 
                User Content, you grant us a limited, non-exclusive license to use, process, and 
                store it as necessary to provide the Service.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">7.2 Platform Ownership</h3>
              <p className="text-gray-600 leading-relaxed">
                Ascend, including its design, code, AI models, algorithms, features, and branding, 
                is owned by Coheron Tech Private Limited and protected by intellectual property laws. 
                You may not copy, modify, distribute, or reverse engineer any part of the platform 
                without our written consent.
              </p>
            </section>

            {/* Section 8 */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. AI Generated Content</h2>
              <p className="text-gray-600 leading-relaxed">
                Ascend uses artificial intelligence to generate profile optimizations, resume content, 
                interview questions, salary insights, and other recommendations ("AI Outputs"). You 
                acknowledge and agree that:
              </p>
              <ul className="list-disc pl-6 text-gray-600 mt-3 space-y-2">
                <li>AI Outputs are provided for guidance and informational purposes only</li>
                <li>AI Outputs may contain errors, inaccuracies, or omissions</li>
                <li>You are solely responsible for reviewing and verifying all AI Outputs before use</li>
                <li>You are responsible for the final content you publish, submit, or share with employers</li>
                <li>Coheron does not guarantee employment outcomes or accuracy of AI recommendations</li>
              </ul>
            </section>

            {/* Section 9 */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Salary Intelligence Disclaimer</h2>
              <p className="text-gray-600 leading-relaxed">
                The Salary Intelligence feature provides market salary benchmarks, compensation analysis, 
                and negotiation guidance for reference purposes only. This information:
              </p>
              <ul className="list-disc pl-6 text-gray-600 mt-3 space-y-2">
                <li>Is derived from publicly available data and aggregated user inputs</li>
                <li>May not reflect current market conditions or specific employer compensation practices</li>
                <li>Should not be relied upon as the sole basis for salary negotiations</li>
                <li>Does not constitute professional financial or legal advice</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-3">
                Please refer to the full Salary Intelligence disclaimer displayed within the application 
                for additional terms.
              </p>
            </section>

            {/* Section 10 */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Limitation of Liability</h2>
              <p className="text-gray-600 leading-relaxed">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, COHERON TECH PRIVATE LIMITED AND ITS DIRECTORS, 
                OFFICERS, EMPLOYEES, AND AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, 
                SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF ASCEND.
              </p>
              <p className="text-gray-600 leading-relaxed mt-3">
                IN NO EVENT SHALL OUR TOTAL LIABILITY TO YOU EXCEED THE AMOUNT YOU HAVE PAID TO US 
                IN THE THREE (3) MONTHS IMMEDIATELY PRECEDING THE EVENT GIVING RISE TO THE CLAIM, 
                OR ONE HUNDRED INDIAN RUPEES (₹100), WHICHEVER IS GREATER.
              </p>
              <p className="text-gray-600 leading-relaxed mt-3">
                This limitation applies regardless of the theory of liability (contract, tort, strict 
                liability, or otherwise) and even if we have been advised of the possibility of such damages.
              </p>
            </section>

            {/* Section 11 */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Indemnification</h2>
              <p className="text-gray-600 leading-relaxed">
                You agree to indemnify, defend, and hold harmless Coheron Tech Private Limited and its 
                officers, directors, employees, agents, and affiliates from any claims, damages, losses, 
                liabilities, costs, and expenses (including reasonable legal fees) arising from:
              </p>
              <ul className="list-disc pl-6 text-gray-600 mt-3 space-y-2">
                <li>Your use of Ascend or violation of these Terms</li>
                <li>Your User Content or the accuracy of information you provide</li>
                <li>Your violation of any third-party rights</li>
                <li>Your violation of any applicable laws or regulations</li>
              </ul>
            </section>

            {/* Section 12 */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Termination</h2>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">12.1 Termination by You</h3>
              <p className="text-gray-600 leading-relaxed">
                You may terminate your account at any time by initiating account deletion through the 
                Settings page. Upon termination, your data will be deleted in accordance with our 
                Privacy Policy.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">12.2 Termination by Ascend</h3>
              <p className="text-gray-600 leading-relaxed">
                We may suspend or terminate your account immediately, without prior notice, if you:
              </p>
              <ul className="list-disc pl-6 text-gray-600 mt-2 space-y-1">
                <li>Violate these Terms or the Acceptable Use Policy</li>
                <li>Engage in fraudulent or illegal activity</li>
                <li>Fail to pay subscription fees when due</li>
                <li>Pose a security risk to the platform or other users</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-3">
                We reserve the right to discontinue the Service at any time with reasonable notice to users.
              </p>
            </section>

            {/* Section 13 */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">13. Dispute Resolution</h2>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">13.1 Informal Resolution</h3>
              <p className="text-gray-600 leading-relaxed">
                Before initiating formal proceedings, you agree to contact us at legal@coheron.tech 
                to attempt informal resolution of any dispute. We will respond within 14 days and 
                make good faith efforts to resolve the matter.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">13.2 Arbitration</h3>
              <p className="text-gray-600 leading-relaxed">
                If informal resolution fails, any dispute arising from these Terms or your use of 
                Ascend shall be resolved through binding arbitration in accordance with the Arbitration 
                and Conciliation Act, 1996 of India. The arbitration shall be conducted by a single 
                arbitrator mutually agreed upon by both parties, and the seat of arbitration shall 
                be Bangalore, Karnataka, India.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">13.3 Jurisdiction</h3>
              <p className="text-gray-600 leading-relaxed">
                For matters not subject to arbitration, the courts of Bangalore, Karnataka, India 
                shall have exclusive jurisdiction over any disputes arising from these Terms.
              </p>
            </section>

            {/* Section 14 */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">14. Governing Law</h2>
              <p className="text-gray-600 leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of India, 
                without regard to conflict of law principles. The Information Technology Act, 2000, 
                the Digital Personal Data Protection Act, 2023, and other applicable Indian laws 
                shall apply to your use of Ascend.
              </p>
            </section>

            {/* Section 15 */}
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">15. Contact</h2>
              <p className="text-gray-600 leading-relaxed">
                For any questions, concerns, or notices regarding these Terms of Service, please contact us:
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
