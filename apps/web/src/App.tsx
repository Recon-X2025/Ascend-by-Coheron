import { BrowserRouter as Router, Routes, Route } from "react-router";
import { AuthProvider } from "@/contexts/AuthContext";
import HomePage from "@/pages/Home";
import AuthCallback from "@/pages/AuthCallback";
import Dashboard from "@/pages/Dashboard";
import Profiles from "@/pages/Profiles";

import AIOptimize from "@/pages/AIOptimize";
import ResumeTailor from "@/pages/ResumeTailor";
import JobSearch from "@/pages/JobSearch";
import ApplicationTracker from "@/pages/ApplicationTracker";
import ResumeGenerator from "@/pages/ResumeGenerator";
import ResumeBuilder from "@/pages/ResumeBuilder";
import Applications from "@/pages/Applications";
import Settings from "@/pages/Settings";
import Pricing from "@/pages/Pricing";
import InterviewPrep from "@/pages/InterviewPrep";
import InterviewPrepLanding from "@/pages/InterviewPrepLanding";
import Referrals from "@/pages/Referrals";
import CareerInsights from "@/pages/CareerInsights";
import EulaAcceptance from "@/pages/EulaAcceptance";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/eula" element={<EulaAcceptance />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profiles" element={<Profiles />} />
          <Route path="/optimize" element={<AIOptimize />} />
          <Route path="/tailor" element={<ResumeTailor />} />
          <Route path="/jobs" element={<JobSearch />} />
          <Route path="/tracker" element={<ApplicationTracker />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/resume" element={<ResumeBuilder />} />
          <Route path="/resume/generate" element={<ResumeGenerator />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/insights" element={<CareerInsights />} />
          <Route path="/interview-prep" element={<InterviewPrepLanding />} />
          <Route path="/interview-prep/:applicationId" element={<InterviewPrep />} />
          <Route path="/referrals" element={<Referrals />} />
          <Route path="/referral" element={<Referrals />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
