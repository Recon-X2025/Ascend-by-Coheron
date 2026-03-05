import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { CheckCircle2, Database, UserCheck, Lock, ChevronRight, Loader2, AlertTriangle, Shield } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import AscendLogo from "@/components/ui/AscendLogo";

export default function EulaAcceptance() {
  const navigate = useNavigate();
  const { user, isPending, redirectToLogin } = useAuth();
  const [ageVerified, setAgeVerified] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [dataUsageAccepted, setDataUsageAccepted] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canContinue = ageVerified && termsAccepted && dataUsageAccepted;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isPending && !user) {
      redirectToLogin();
    }
  }, [isPending, user, redirectToLogin]);

  // Show loading while checking auth
  if (isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect if not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-slate-600">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  const handleAccept = async () => {
    if (!canContinue) return;
    
    setSubmitting(true);
    setError(null);
    
    try {
      const res = await fetch("/api/eula/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ageVerified, termsAccepted, dataUsageAccepted, marketingConsent })
      });
      
      if (res.ok) {
        await res.json();
        navigate("/dashboard");
      } else {
        const errorData = await res.json().catch(() => ({}));
        const errorMsg = errorData.error || `Failed to save acceptance (${res.status})`;
        console.error("Failed to accept EULA:", errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      console.error("Error accepting EULA:", err);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div style={{
          background: '#1A7A4A',
          borderRadius: '12px',
          padding: '28px 32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          margin: '16px 16px 0 16px'
        }}>
          {/* Logo lockup — top of card */}
          <div>
            <AscendLogo variant="light" />
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }} />

          {/* Heading + subtext */}
          <div>
            <h2 style={{ color: '#ffffff', fontSize: '18px', fontWeight: 600, marginBottom: '6px' }}>
              Before we get started
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '14px' }}>
              Please review and accept our terms to continue.
            </p>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* Plain English Summary */}
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
            <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Here's what you need to know
            </h2>
            <div className="space-y-3">
              <SummaryItem
                icon={<Database className="w-4 h-4" />}
                title="What we collect"
                description="Your profile information, career data, and usage patterns to power AI recommendations"
              />
              <SummaryItem
                icon={<UserCheck className="w-4 h-4" />}
                title="How we use it"
                description="To optimize your profiles, match you with jobs, and improve our platform"
              />
              <SummaryItem
                icon={<Shield className="w-4 h-4" />}
                title="Your rights"
                description="You can download or delete your data at any time from Settings"
              />
              <SummaryItem
                icon={<Lock className="w-4 h-4" />}
                title="Data safety"
                description="Your individual data is never sold or shared without your explicit consent"
              />
            </div>
          </div>

          {/* Full EULA Text */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200">
              <h3 className="text-sm font-medium text-slate-700">End User License Agreement (EULA) v1.0</h3>
            </div>
            <div className="max-h-[300px] overflow-y-auto p-4 text-sm text-slate-600 leading-relaxed space-y-4 bg-white">
              <EulaSection title="1. Acceptance of Terms">
                By accessing or using Ascend ("the Service"), you agree to be bound by these Terms 
                of Service and End User License Agreement. If you do not agree to these terms, you may not 
                access or use the Service. Your continued use of the Service constitutes acceptance of any 
                updates or modifications to these terms.
              </EulaSection>

              <EulaSection title="2. Description of Service">
                Ascend is a career acceleration platform that provides AI-powered profile optimization, 
                job matching, resume tailoring, interview preparation, and salary intelligence services. The 
                Service is provided "as is" and we reserve the right to modify, suspend, or discontinue any 
                aspect of the Service at any time.
              </EulaSection>

              <EulaSection title="3. Data Collection and Usage">
                <strong>For Free Tier Users:</strong> By using the Free tier, you grant Ascend the 
                right to use your anonymized and aggregated data to:
                <br />• Improve AI optimization models and job match scoring
                <br />• Generate anonymized market intelligence and salary benchmarks
                <br />• Improve platform features based on usage patterns
                <br />• Create aggregated industry insights reports
                <br /><br />
                <strong>Important:</strong> Individual profile data is NEVER shared with employers or any third 
                party without your explicit opt-in, regardless of tier.
                <br /><br />
                <strong>For Pro Tier Users:</strong> In addition to the above, we may store extended career 
                history, application tracking data, and personalized preferences. Pro users have an additional 
                toggle in Settings to control data usage for AI improvement, which can be opted out at any time 
                without affecting Pro features. Pro users receive enhanced data portability and priority data 
                deletion processing (7 days vs 30 days for Free tier).
                <br /><br />
                We do not sell your personal data to third parties.
              </EulaSection>

              <EulaSection title="4. Intellectual Property">
                All AI-generated content created using Ascend—including optimized profiles, tailored resumes, 
                interview responses, and career recommendations—belongs entirely to you, the user. Coheron 
                Tech Private Limited retains no ownership rights over content generated for your personal use. 
                The underlying platform, algorithms, and service infrastructure remain the intellectual property 
                of Coheron Tech Private Limited.
              </EulaSection>

              <EulaSection title="5. Limitation of Liability">
                To the maximum extent permitted by law, Coheron Tech Private Limited shall not be liable for 
                any indirect, incidental, special, consequential, or punitive damages, including but not limited 
                to loss of profits, data, use, or goodwill, arising out of or related to your use of the Service. 
                Our total liability shall not exceed the amount you paid for the Service in the twelve months 
                preceding the claim.
              </EulaSection>

              <EulaSection title="6. Salary Intelligence Disclaimer">
                Salary benchmarks, compensation insights, and market data provided by Ascend are for informational 
                purposes only and do not constitute professional financial or career advice. These figures are 
                based on aggregated market intelligence and publicly available data. Actual compensation is 
                subject to individual qualifications, company policies, market conditions, and negotiation outcomes. 
                Coheron Tech Private Limited is not responsible for any decisions made based on this information.
              </EulaSection>

              <EulaSection title="7. Termination and Data Deletion Rights">
                You may terminate your account at any time through the Settings page. Upon termination, you may 
                request deletion of all your personal data. We will process data deletion requests within 30 days 
                for Free tier users and 7 days for Pro tier users. Certain data may be retained for legal compliance 
                purposes as required by applicable law.
              </EulaSection>

              <EulaSection title="8. Governing Law">
                These Terms shall be governed by and construed in accordance with the laws of India. Any disputes 
                arising from or relating to these Terms or your use of the Service shall be subject to the 
                exclusive jurisdiction of the courts located in Karnataka, India.
              </EulaSection>

              <EulaSection title="9. Contact">
                For questions, concerns, or legal inquiries regarding these Terms or the Service, please contact 
                us at: <a href="mailto:legal@coheron.tech" className="text-emerald-600 hover:underline">legal@coheron.tech</a>
              </EulaSection>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Unable to save acceptance</p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Checkboxes */}
          <div className="space-y-4 pt-2">
            {/* Age Verification - Required for DPDP Act 2023 compliance */}
            <div className="flex items-start gap-3 p-3 rounded-lg border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 transition-colors">
              <Checkbox 
                id="ageVerification" 
                checked={ageVerified} 
                onCheckedChange={(checked) => setAgeVerified(checked === true)}
                className="mt-0.5"
              />
              <Label htmlFor="ageVerification" className="text-sm text-slate-700 cursor-pointer leading-relaxed">
                I confirm that I am <span className="font-medium">18 years of age or older</span>
                <span className="text-red-500 ml-1">*</span>
              </Label>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
              <Checkbox 
                id="terms" 
                checked={termsAccepted} 
                onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                className="mt-0.5"
              />
              <Label htmlFor="terms" className="text-sm text-slate-700 cursor-pointer leading-relaxed">
                I have read and agree to the <span className="font-medium">Terms of Service and EULA</span>
                <span className="text-red-500 ml-1">*</span>
              </Label>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
              <Checkbox 
                id="dataUsage" 
                checked={dataUsageAccepted} 
                onCheckedChange={(checked) => setDataUsageAccepted(checked === true)}
                className="mt-0.5"
              />
              <Label htmlFor="dataUsage" className="text-sm text-slate-700 cursor-pointer leading-relaxed">
                I understand how my data may be used as described above
                <span className="text-red-500 ml-1">*</span>
              </Label>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
              <Checkbox 
                id="marketing" 
                checked={marketingConsent} 
                onCheckedChange={(checked) => setMarketingConsent(checked === true)}
                className="mt-0.5"
              />
              <Label htmlFor="marketing" className="text-sm text-slate-600 cursor-pointer leading-relaxed">
                I'd like to receive career tips, product updates, and offers from Ascend
                <span className="text-slate-400 ml-1">(optional)</span>
              </Label>
            </div>
          </div>

          {/* Continue Button */}
          <div className="pt-4">
            <Button
              onClick={handleAccept}
              disabled={!canContinue || submitting}
              className={`w-full h-12 text-base font-medium transition-all ${
                canContinue 
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200" 
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Continue to Ascend
                  <ChevronRight className="w-4 h-4" />
                </span>
              )}
            </Button>
            {!canContinue && (
              <p className="text-xs text-slate-400 text-center mt-2">
                Please accept all three required checkboxes to continue
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryItem({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
        {icon}
      </div>
      <div>
        <p className="font-medium text-slate-800 text-sm">{title}</p>
        <p className="text-slate-600 text-sm">{description}</p>
      </div>
    </div>
  );
}

function EulaSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="font-semibold text-slate-800 mb-1">{title}</h4>
      <p>{children}</p>
    </div>
  );
}
