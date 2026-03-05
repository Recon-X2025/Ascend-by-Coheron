import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Sparkles, Printer, CheckCircle, AlertCircle, Briefcase, GraduationCap, Zap, AlertTriangle } from "lucide-react";
import { Link } from "react-router";
import SidebarLayout from "@/components/SidebarLayout";
import { getRoleFitScoreBgClass, getRoleFitScorePanelClass } from "@/utils/roleFit";


interface TailoredExperience {
  title: string;
  company: string;
  dates: string;
  bullets: string[];
}

interface TailoredEducation {
  degree: string;
  institution: string;
  year: string;
}

interface TailoredResume {
  fullName: string;
  email?: string;
  phone?: string;
  location?: string;
  headline: string;
  summary: string;
  experiences: TailoredExperience[];
  education?: TailoredEducation[];
  skills: string[];
  matchScore: number;
  suggestions?: string[];
  gapsIdentified?: string[];
  tailoringNotes?: string;
}

interface GapItem {
  gap: string;
  severity: "minor" | "moderate" | "significant";
}

interface RoleFitAssessment {
  requiredYearsExperience: number;
  candidateYearsExperience: number;
  strongMatches: string[];
  gapsIdentified: GapItem[];
  overallFitScore: number;
  fitSummary: string;
}

interface LocationState {
  jobTitle?: string;
  company?: string;
  jobDescription?: string;
  jobUrl?: string;
  publisher?: string;
  location?: string;
  generateInterviewPrep?: boolean;
  returnTo?: string;
  returnSearch?: {
    query: string;
    location: string;
  };
}

export default function ResumeTailor() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefilled = (location.state as LocationState) || {};
  
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [_jobUrl, setJobUrl] = useState(""); // setter used for prefilled; reserved for "View Original" link
  const [tailoredResume, setTailoredResume] = useState<TailoredResume | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Tailoring Your Resume...");
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [incompleteProfile, setIncompleteProfile] = useState(false);
  const [assessment, setAssessment] = useState<RoleFitAssessment | null>(null);
  const [assessingFit, setAssessingFit] = useState(false);

  // Pre-fill form fields from router state (when coming from job search). Deps use primitives to avoid re-running when state object reference changes.
  useEffect(() => {
    if (prefilled.jobTitle) setJobTitle(prefilled.jobTitle);
    if (prefilled.company) setCompany(prefilled.company);
    if (prefilled.jobDescription) setJobDescription(prefilled.jobDescription);
    if (prefilled.jobUrl) setJobUrl(prefilled.jobUrl);
  }, [prefilled.jobTitle, prefilled.company, prefilled.jobDescription, prefilled.jobUrl]);

  const handleAssessFit = async () => {
    if (!jobDescription.trim()) {
      setError("Please paste the job description");
      return;
    }

    setAssessingFit(true);
    setError(null);
    setErrorCode(null);
    setIncompleteProfile(false);
    setAssessment(null);

    try {
      const response = await fetch(`/api/profiles/me/assess-fit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription, jobTitle, company }),
        credentials: "include",
      });

      if (!response.ok) {
        // Handle server errors (502, 503, etc.) which return HTML, not JSON
        if (response.status >= 500) {
          setError("The AI service is temporarily unavailable. Please try again in a moment.");
          return;
        }
        try {
          const data = await response.json();
          setError(data.error || "Failed to assess fit");
        } catch {
          setError("Failed to assess fit. Please try again.");
        }
        return;
      }

      const data = await response.json();
      setAssessment(data);
    } catch {
      setError("Connection error. Please check your internet and try again.");
    } finally {
      setAssessingFit(false);
    }
  };

  const handleTailor = async () => {
    if (!jobDescription.trim()) {
      setError("Please paste the job description");
      return;
    }

    setLoading(true);
    setError(null);
    setErrorCode(null);
    setIncompleteProfile(false);
    setLoadingMessage("Tailoring Your Resume...");

    // Show extended loading message after 15 seconds
    const slowTimer = setTimeout(() => {
      setLoadingMessage("This is taking longer than usual, please wait...");
    }, 15000);

    // Timeout after 60 seconds
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      // Use streaming to prevent 502 gateway timeouts
      const response = await fetch(`/api/profiles/me/tailor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription, jobTitle, company, stream: true }),
        credentials: "include",
        signal: controller.signal,
      });

      clearTimeout(slowTimer);

      // Handle server errors (502, 503, etc.) which return HTML, not JSON
      if (response.status >= 500) {
        clearTimeout(timeoutId);
        setError("The AI service is temporarily unavailable. Please try again in a moment.");
        setLoading(false);
        return;
      }

      // Check if we got a streaming response
      const contentType = response.headers.get("Content-Type") || "";
      if (contentType.includes("text/event-stream")) {
        // Process streaming response
        const reader = response.body?.getReader();
        if (!reader) {
          clearTimeout(timeoutId);
          setError("Failed to establish connection. Please try again.");
          setLoading(false);
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";
          
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.substring(6));
                if (data.done) {
                  clearTimeout(timeoutId);
                  if (data.error) {
                    setErrorCode(data.code || null);
                    setError(data.error);
                  } else if (data.success && data.data) {
                    setTailoredResume(data.data);
                  }
                }
              } catch {
                // Ignore parse errors for partial chunks
              }
            }
          }
        }
        return;
      }

      // Non-streaming fallback response
      clearTimeout(timeoutId);
      let data;
      try {
        data = await response.json();
      } catch {
        setError("Failed to tailor resume. Please try again.");
        setLoading(false);
        return;
      }

      if (!response.ok) {
        setErrorCode(data.code || null);
        if (data.code === "PROFILE_INCOMPLETE") {
          setIncompleteProfile(true);
          setError(data.error);
        } else if (data.code === "TIMEOUT") {
          setError("The AI service is taking too long. Please try again in a few moments.");
        } else if (data.code === "RATE_LIMITED") {
          setError("AI service is temporarily busy. Please wait a minute and try again.");
        } else if (data.code === "AUTH_ERROR") {
          setError("AI service configuration error. Please contact support.");
        } else if (data.code === "PARSE_ERROR") {
          setError("Failed to process the AI response. Please try again.");
        } else {
          setError(data.error || "Failed to tailor resume. Please try again.");
        }
        return;
      }

      setTailoredResume(data);
    } catch (err: unknown) {
      clearTimeout(slowTimer);
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === "AbortError") {
        setError("Request timed out after 60 seconds. The AI service may be overloaded. Please try again.");
        setErrorCode("CLIENT_TIMEOUT");
      } else {
        setError("Connection error. Please check your internet and try again.");
        setErrorCode("NETWORK_ERROR");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    // Track onboarding completion
    localStorage.setItem('ascend_has_downloaded', 'true');
    window.print();
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-amber-600";
    return "text-red-600";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent Match";
    if (score >= 60) return "Good Match";
    if (score >= 40) return "Moderate Match";
    return "Needs Work";
  };

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-background print:bg-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => {
              if (prefilled.returnTo && prefilled.returnSearch) {
                const params = new URLSearchParams();
                if (prefilled.returnSearch.query) params.set("q", prefilled.returnSearch.query);
                if (prefilled.returnSearch.location) params.set("l", prefilled.returnSearch.location);
                navigate(`${prefilled.returnTo}?${params.toString()}`);
              } else if (prefilled.returnTo) {
                navigate(prefilled.returnTo);
              } else {
                navigate(-1);
              }
            }}
            className="mb-6 gap-2 print:hidden"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>

        <div className="text-center mb-8 print:hidden">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Resume Tailor</h1>
          <p className="text-slate-600">
            Paste a job description to generate a tailored resume that highlights your most relevant qualifications
          </p>
        </div>

        {!tailoredResume ? (
          <>
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                Enter Job Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">
                    Job Title
                  </label>
                  <Input
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g., Senior Software Engineer"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1 block">
                    Company
                  </label>
                  <Input
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g., Google"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1 block">
                  Job Description *
                </label>
                <Textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the full job description here..."
                  className="min-h-[200px]"
                />
              </div>

              {error && incompleteProfile ? (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-amber-800 mb-1">Profile Incomplete</h4>
                      <p className="text-sm text-amber-700 mb-3">{error}</p>
                      <Link to="/profiles">
                        <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
                          Complete Your Profile
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ) : error && (
                <div className="rounded-lg border border-red-300 bg-red-50 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-red-800 mb-1">
                        {errorCode === "TIMEOUT" || errorCode === "CLIENT_TIMEOUT" 
                          ? "Request Timed Out" 
                          : errorCode === "RATE_LIMITED" 
                          ? "Service Busy" 
                          : errorCode === "NETWORK_ERROR" 
                          ? "Connection Error" 
                          : "Resume Tailoring Failed"}
                      </h4>
                      <p className="text-sm text-red-700 mb-3">{error}</p>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="border-red-300 text-red-700 hover:bg-red-100"
                        onClick={() => {
                          setError(null);
                          setErrorCode(null);
                        }}
                      >
                        Try Again
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={handleAssessFit}
                disabled={assessingFit || loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                {assessingFit ? (
                  <>
                    <span className="animate-spin mr-2">⚙️</span>
                    Analyzing Role Fit...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Tailored Resume
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Role Fit Assessment — same stored score as job cards; uses shared display helpers */}
          {assessment && !tailoredResume && (
            <Card className={`max-w-2xl mx-auto mt-6 ${getRoleFitScorePanelClass(assessment.overallFitScore)}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-foreground">
                  <AlertTriangle className="w-5 h-5" />
                  <CardTitle className="text-lg flex items-center gap-2">
                    Role Fit Assessment:{" "}
                    <span className={`px-2 py-0.5 rounded font-bold text-white ${getRoleFitScoreBgClass(assessment.overallFitScore)}`}>
                      {assessment.overallFitScore}%
                    </span>
                    match
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Threshold Warning Messages */}
                {assessment.overallFitScore < 30 && (
                  <div className="bg-red-100 border border-red-300 rounded-lg p-4">
                    <p className="text-sm text-red-800 leading-relaxed font-medium">
                      ⚠️ This role may be a <strong>significant stretch</strong> based on your current profile. 
                      We recommend reviewing the requirements carefully before applying. Ascend will do its 
                      best with what you have — but we'll always be honest about the fit.
                    </p>
                  </div>
                )}
                {assessment.overallFitScore >= 30 && assessment.overallFitScore < 50 && (
                  <div className="bg-amber-100 border border-amber-300 rounded-lg p-4">
                    <p className="text-sm text-amber-800 leading-relaxed">
                      This role has some gaps compared to your profile. Ascend will highlight your genuine 
                      strengths and note areas where you may want to upskill.
                    </p>
                  </div>
                )}

                {/* Experience Comparison */}
                {assessment.requiredYearsExperience > 0 && (
                  <div className="bg-white/60 rounded-lg p-4 border border-amber-200">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500">This role requires:</span>
                        <p className="font-semibold text-slate-900">
                          {assessment.requiredYearsExperience}+ years experience
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500">Your profile shows:</span>
                        <p className={`font-semibold ${
                          assessment.candidateYearsExperience >= assessment.requiredYearsExperience 
                            ? "text-emerald-700" 
                            : "text-amber-700"
                        }`}>
                          {assessment.candidateYearsExperience} years
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Strong Matches */}
                {assessment.strongMatches.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-emerald-700 mb-2 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4" /> Strong matches:
                    </h4>
                    <p className="text-sm text-slate-700">
                      {assessment.strongMatches.join(", ")}
                    </p>
                  </div>
                )}

                {/* Gaps Identified */}
                {assessment.gapsIdentified.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-amber-700 mb-2 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" /> Gaps identified:
                    </h4>
                    <ul className="space-y-1">
                      {assessment.gapsIdentified.map((item, i) => (
                        <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                          <span className={`inline-block w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                            item.severity === "significant" ? "bg-red-500" :
                            item.severity === "moderate" ? "bg-amber-500" : "bg-yellow-400"
                          }`} />
                          {item.gap}
                          {item.severity === "significant" && (
                            <span className="text-xs text-red-600 font-medium">
                              ({Math.abs(assessment.candidateYearsExperience - assessment.requiredYearsExperience)} year gap)
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Ethical Disclaimer */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mt-4">
                  <p className="text-sm text-emerald-800 leading-relaxed">
                    <strong>Ascend</strong> will tailor your resume to maximise your genuine strengths for this role. 
                    We will <strong>not</strong> add experience, qualifications, or skills you don't hold.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={handleTailor}
                    disabled={loading}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    {loading ? (
                      <>
                        <span className="animate-spin mr-2">⚙️</span>
                        {loadingMessage}
                      </>
                    ) : (
                      "Proceed with honest tailoring"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/profiles")}
                    className="flex-1 border-amber-300 text-amber-700 hover:bg-amber-50"
                  >
                    Review your profile first
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
        ) : (
          <div className="space-y-6">
            {/* Match Score & Actions */}
            <div className="flex items-center justify-between print:hidden">
              <div className="flex items-center gap-4">
                <div className={`text-4xl font-bold ${getScoreColor(tailoredResume.matchScore)}`}>
                  {tailoredResume.matchScore}%
                </div>
                <div>
                  <div className={`font-semibold ${getScoreColor(tailoredResume.matchScore)}`}>
                    {getScoreLabel(tailoredResume.matchScore)}
                  </div>
                  <div className="text-sm text-slate-500">Match Score</div>
                </div>
              </div>
              <div className="flex gap-2">
                {prefilled.returnTo && (
                  <Button 
                    variant="default"
                    className="bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => {
                      if (prefilled.returnSearch) {
                        const params = new URLSearchParams();
                        if (prefilled.returnSearch.query) params.set("q", prefilled.returnSearch.query);
                        if (prefilled.returnSearch.location) params.set("l", prefilled.returnSearch.location);
                        navigate(`${prefilled.returnTo}?${params.toString()}`);
                      } else if (prefilled.returnTo) {
                        navigate(prefilled.returnTo);
                      }
                    }}
                  >
                    ← Back to Search Results
                  </Button>
                )}
                <Button variant="outline" onClick={() => setTailoredResume(null)}>
                  Tailor Another
                </Button>
                <Button variant="outline" onClick={handlePrint} className="gap-2">
                  <Printer className="w-4 h-4" /> Print
                </Button>
              </div>
            </div>

            {/* Tailoring Notes */}
            {tailoredResume.tailoringNotes && (
              <Card className="border-slate-200 bg-slate-50 print:hidden">
                <CardContent className="pt-4">
                  <h3 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> What Ascend Did
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {tailoredResume.tailoringNotes}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Suggestions */}
            {tailoredResume.suggestions && tailoredResume.suggestions.length > 0 && (
              <Card className="border-amber-200 bg-amber-50 print:hidden">
                <CardContent className="pt-4">
                  <h3 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                    <Zap className="w-4 h-4" /> Tips to Improve Your Candidacy
                  </h3>
                  <ul className="space-y-1">
                    {tailoredResume.suggestions.map((suggestion, i) => (
                      <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Resume Preview */}
            <Card className="print:shadow-none print:border-0">
              <CardContent className="p-8 print:p-0">
                {/* Header */}
                <div className="text-center border-b pb-4 mb-6">
                  <h1 className="text-2xl font-bold text-slate-900">{tailoredResume.fullName}</h1>
                  <p className="text-emerald-700 font-medium mt-1">{tailoredResume.headline}</p>
                  <div className="flex items-center justify-center gap-4 mt-2 text-sm text-slate-600">
                    {tailoredResume.email && <span>{tailoredResume.email}</span>}
                    {tailoredResume.phone && <span>• {tailoredResume.phone}</span>}
                    {tailoredResume.location && <span>• {tailoredResume.location}</span>}
                  </div>
                </div>

                {/* Summary */}
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-slate-900 border-b pb-1 mb-2">
                    Professional Summary
                  </h2>
                  <p className="text-slate-700 leading-relaxed">{tailoredResume.summary}</p>
                </div>

                {/* Experience */}
                {tailoredResume.experiences.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-lg font-bold text-slate-900 border-b pb-1 mb-3 flex items-center gap-2">
                      <Briefcase className="w-4 h-4" /> Experience
                    </h2>
                    <div className="space-y-4">
                      {tailoredResume.experiences.map((exp, i) => (
                        <div key={i}>
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-slate-900">{exp.title}</h3>
                              <p className="text-slate-600">{exp.company}</p>
                            </div>
                            <span className="text-sm text-slate-500">{exp.dates}</span>
                          </div>
                          <ul className="mt-2 space-y-1">
                            {exp.bullets.map((bullet, j) => (
                              <li key={j} className="text-sm text-slate-700 flex items-start gap-2">
                                <span className="text-emerald-600 mt-1">•</span>
                                {bullet}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education */}
                {tailoredResume.education && tailoredResume.education.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-lg font-bold text-slate-900 border-b pb-1 mb-3 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" /> Education
                    </h2>
                    <div className="space-y-2">
                      {tailoredResume.education.map((edu, i) => (
                        <div key={i} className="flex justify-between">
                          <div>
                            <h3 className="font-semibold text-slate-900">{edu.degree}</h3>
                            <p className="text-slate-600">{edu.institution}</p>
                          </div>
                          <span className="text-sm text-slate-500">{edu.year}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills */}
                <div>
                  <h2 className="text-lg font-bold text-slate-900 border-b pb-1 mb-3">
                    Key Skills
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {tailoredResume.skills.map((skill, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Gaps Identified */}
                {tailoredResume.gapsIdentified && tailoredResume.gapsIdentified.length > 0 && (
                  <div className="mt-6 print:hidden">
                    <h2 className="text-lg font-bold text-amber-800 border-b border-amber-200 pb-1 mb-3 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" /> Gaps Not Covered
                    </h2>
                    <p className="text-sm text-slate-600 mb-2">
                      These requirements from the job description are not in your profile:
                    </p>
                    <ul className="space-y-1">
                      {tailoredResume.gapsIdentified.map((gap: string, i: number) => (
                        <li key={i} className="text-sm text-amber-700 flex items-start gap-2">
                          <span className="text-amber-500 mt-0.5">○</span>
                          {gap}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}


              </CardContent>
            </Card>

            {/* Interview Prep CTA */}
            <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 print:hidden">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 mb-1">Ready for the Interview?</h3>
                    <p className="text-sm text-slate-600 mb-3">
                      Practice with AI-generated questions tailored to this role. Get feedback on your answers using the STAR method.
                    </p>
                    <Button
                      onClick={() => navigate("/interview-prep")}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                    >
                      <GraduationCap className="w-4 h-4" />
                      Start Interview Prep
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        </div>
      </div>
    </SidebarLayout>
  );
}
