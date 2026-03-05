import { BrowserRouter as Router, Routes, Route } from "react-router";
import { AuthProvider } from "@/react-app/contexts/AuthContext";
import HomePage from "@/react-app/pages/Home";
import AuthCallback from "@/react-app/pages/AuthCallback";
import Dashboard from "@/react-app/pages/Dashboard";
import Profiles from "@/react-app/pages/Profiles";

import AIOptimize from "@/react-app/pages/AIOptimize";
import ResumeTailor from "@/react-app/pages/ResumeTailor";
import JobSearch from "@/react-app/pages/JobSearch";
import ApplicationTracker from "@/react-app/pages/ApplicationTracker";
import ResumeGenerator from "@/react-app/pages/ResumeGenerator";
import ResumeBuilder from "@/react-app/pages/ResumeBuilder";
import Applications from "@/react-app/pages/Applications";
import Settings from "@/react-app/pages/Settings";
import Pricing from "@/react-app/pages/Pricing";
import InterviewPrep from "@/react-app/pages/InterviewPrep";
import InterviewPrepLanding from "@/react-app/pages/InterviewPrepLanding";
import Referrals from "@/react-app/pages/Referrals";
import CareerInsights from "@/react-app/pages/CareerInsights";
import EulaAcceptance from "@/react-app/pages/EulaAcceptance";
import PrivacyPolicy from "@/react-app/pages/PrivacyPolicy";
import TermsOfService from "@/react-app/pages/TermsOfService";

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
