import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Sparkles, 
  Download, 
  Save, 
  Briefcase, 
  GraduationCap, 
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  Copy,
  Check,
  FileText,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Target
} from "lucide-react";
import SidebarLayout from "@/components/SidebarLayout";
import { useMyProfiles, useProfile } from "@/hooks/useProfile";

interface MissingKeyword {
  keyword: string;
  importance: "critical" | "important" | "nice-to-have";
  suggestion: string;
}

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
  matchedSkills: string[];
  additionalSkills?: string[];
  missingKeywords: MissingKeyword[];
  matchScore: number;
  strengthAreas?: string[];
  improvementAreas?: string[];
}

interface SavedVersion {
  id: number;
  job_title: string;
  company: string | null;
  match_score: number | null;
  created_at: string;
}

export default function ResumeBuilder() {
  const { user, isPending: authPending } = useAuth();
  const { profiles, loading: profilesLoading } = useMyProfiles();
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
  const { profile } = useProfile(selectedProfileId || undefined);
  
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  
  const [tailoredResume, setTailoredResume] = useState<TailoredResume | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  
  const [savedVersions, setSavedVersions] = useState<SavedVersion[]>([]);
  const [showVersions, setShowVersions] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [showMissingKeywords, setShowMissingKeywords] = useState(true);

  const loadSavedVersions = useCallback(async () => {
    if (!selectedProfileId) return;
    try {
      const res = await fetch(`/api/resume-versions/${selectedProfileId}`, {
        credentials: "include",
      });
      // Check for server errors that return HTML instead of JSON
      if (!res.ok || res.status >= 500) {
        console.error("Failed to load saved versions: server error", res.status);
        return;
      }
      const contentType = res.headers.get("Content-Type") || "";
      if (!contentType.includes("application/json")) {
        console.error("Failed to load saved versions: unexpected content type", contentType);
        return;
      }
      const data = await res.json();
      setSavedVersions(data.versions || []);
    } catch (err) {
      console.error("Failed to load saved versions:", err);
    }
  }, [selectedProfileId]);

  // Load saved versions when profile changes
  useEffect(() => {
    if (selectedProfileId) {
      loadSavedVersions();
    }
  }, [selectedProfileId, loadSavedVersions]);

  const handleTailor = async () => {
    if (!selectedProfileId) {
      setError("Please select a profile");
      return;
    }
    if (!jobDescription.trim()) {
      setError("Please paste the job description");
      return;
    }

    setLoading(true);
    setError(null);
    setTailoredResume(null);

    try {
      const response = await fetch(`/api/profiles/${selectedProfileId}/tailor-enhanced`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ jobDescription, jobTitle, company }),
      });

      if (!response.ok) {
        // Handle server errors (502, 503, etc.) which return HTML, not JSON
        if (response.status >= 500) {
          throw new Error("The AI service is temporarily unavailable. Please try again in a moment.");
        }
        try {
          const data = await response.json();
          throw new Error(data.error || "Failed to tailor resume");
        } catch {
          throw new Error("Failed to tailor resume. Please try again.");
        }
      }

      const data = await response.json();
      setTailoredResume(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to generate tailored resume. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVersion = async () => {
    if (!tailoredResume || !selectedProfileId || !jobTitle.trim()) {
      setError("Please enter a job title to save this version");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/resume-versions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          profileId: selectedProfileId,
          jobTitle,
          company,
          jobDescription,
          tailoredContent: tailoredResume,
          matchScore: tailoredResume.matchScore,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save version");
      }

      setSavedMessage("Version saved successfully!");
      loadSavedVersions();
      setTimeout(() => setSavedMessage(null), 3000);
    } catch {
      setError("Failed to save version. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = () => {
    localStorage.setItem('ascend_has_downloaded', 'true');
    window.print();
  };

  const copyToClipboard = async (text: string, section: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-amber-500";
    return "text-red-500";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 60) return "bg-amber-500";
    return "bg-red-500";
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case "critical": return "bg-red-100 text-red-800 border-red-200";
      case "important": return "bg-amber-100 text-amber-800 border-amber-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  if (authPending || profilesLoading) {
    return (
      <SidebarLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </SidebarLayout>
    );
  }

  if (!user) {
    return (
      <SidebarLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="pt-6 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Sign in Required</h2>
              <p className="text-muted-foreground">Please sign in to use the Resume Builder.</p>
            </CardContent>
          </Card>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-background print:bg-white">
        <div className="max-w-7xl mx-auto px-6 py-8 print:p-0">
          {/* Header */}
          <div className="mb-8 print:hidden">
            <h1 className="text-3xl font-bold text-foreground mb-2">Resume Builder & Tailor</h1>
            <p className="text-muted-foreground">
              Select a profile, paste a job description, and get an AI-tailored resume optimized for ATS systems
            </p>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:hidden">
            {/* Left Column - Profile Data */}
            <div className="space-y-4">
              {/* Profile Selector */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="w-5 h-5 text-emerald-600" />
                    Select Profile
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select
                    value={selectedProfileId?.toString() || ""}
                    onValueChange={(val) => setSelectedProfileId(parseInt(val))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a profile..." />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles.map((p) => (
                        <SelectItem key={p.id} value={p.id.toString()}>
                          {p.full_name} {p.headline ? `— ${p.headline}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {profiles.length === 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      No profiles found. Create one in the Profiles section first.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Profile Preview */}
              {profile && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Your Profile Data</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 max-h-[500px] overflow-y-auto">
                    {/* Basic Info */}
                    <div>
                      <h3 className="font-semibold text-foreground">{profile.fullName}</h3>
                      {profile.headline && (
                        <p className="text-sm text-muted-foreground">{profile.headline}</p>
                      )}
                      <div className="text-xs text-muted-foreground mt-1 space-x-2">
                        {profile.email && <span>{profile.email}</span>}
                        {profile.location && <span>• {profile.location}</span>}
                      </div>
                    </div>

                    {/* Experience */}
                    {profile.experiences && profile.experiences.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold flex items-center gap-1 mb-2 text-foreground">
                          <Briefcase className="w-4 h-4" /> Experience
                        </h4>
                        <div className="space-y-2">
                          {profile.experiences.map((exp, i) => (
                            <div key={i} className="text-sm border-l-2 border-emerald-200 pl-3">
                              <p className="font-medium text-foreground">{exp.title}</p>
                              <p className="text-muted-foreground text-xs">
                                {exp.company} • {exp.startDate} - {exp.current ? "Present" : exp.endDate}
                              </p>
                              {exp.description && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{exp.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Education */}
                    {profile.education && profile.education.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold flex items-center gap-1 mb-2 text-foreground">
                          <GraduationCap className="w-4 h-4" /> Education
                        </h4>
                        <div className="space-y-1">
                          {profile.education.map((edu, i) => (
                            <div key={i} className="text-sm">
                              <p className="font-medium text-foreground">{edu.degree}</p>
                              <p className="text-muted-foreground text-xs">{edu.institution} • {edu.year}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Skills */}
                    {profile.skills && profile.skills.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold flex items-center gap-1 mb-2 text-foreground">
                          <Zap className="w-4 h-4" /> Skills
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {profile.skills.map((skill, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Saved Versions */}
              {selectedProfileId && savedVersions.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <button 
                      onClick={() => setShowVersions(!showVersions)}
                      className="flex items-center justify-between w-full"
                    >
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Clock className="w-5 h-5 text-muted-foreground" />
                        Saved Versions ({savedVersions.length})
                      </CardTitle>
                      {showVersions ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </CardHeader>
                  {showVersions && (
                    <CardContent className="space-y-2 max-h-[200px] overflow-y-auto">
                      {savedVersions.map((version) => (
                        <div 
                          key={version.id} 
                          className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                        >
                          <div>
                            <p className="font-medium text-foreground">{version.job_title}</p>
                            <p className="text-xs text-muted-foreground">
                              {version.company && `${version.company} • `}
                              {new Date(version.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          {version.match_score && (
                            <span className={`text-sm font-semibold ${getScoreColor(version.match_score)}`}>
                              {version.match_score}%
                            </span>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  )}
                </Card>
              )}
            </div>

            {/* Right Column - Job Description Input */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-600" />
                    Job Description
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">
                        Job Title *
                      </label>
                      <Input
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        placeholder="e.g., Senior Product Manager"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">
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
                    <label className="text-sm font-medium text-foreground mb-1 block">
                      Paste Job Description *
                    </label>
                    <Textarea
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Paste the full job description here. The more detail, the better the tailoring..."
                      className="min-h-[300px]"
                    />
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  {savedMessage && (
                    <div className="flex items-center gap-2 text-emerald-600 text-sm bg-emerald-50 p-3 rounded">
                      <CheckCircle className="w-4 h-4 flex-shrink-0" />
                      {savedMessage}
                    </div>
                  )}

                  <Button
                    onClick={handleTailor}
                    disabled={loading || !selectedProfileId}
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Tailoring Your Resume...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Tailor My Resume
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Tailored Result */}
          {tailoredResume && (
            <div className="mt-8 space-y-6">
              {/* Match Score Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
                <div className="flex items-center gap-6">
                  {/* Circular Score */}
                  <div className="relative w-24 h-24">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        className="text-muted"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${(tailoredResume.matchScore / 100) * 251} 251`}
                        strokeLinecap="round"
                        className={getScoreBgColor(tailoredResume.matchScore)}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-2xl font-bold ${getScoreColor(tailoredResume.matchScore)}`}>
                        {tailoredResume.matchScore}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-foreground">Match Score</p>
                    <p className="text-sm text-muted-foreground">
                      {tailoredResume.matchScore >= 80 
                        ? "Excellent match! You're a strong candidate." 
                        : tailoredResume.matchScore >= 60 
                          ? "Good match. Address the gaps below to improve."
                          : "Needs improvement. Focus on the missing keywords."}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleSaveVersion} disabled={saving}>
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? "Saving..." : "Save Version"}
                  </Button>
                  <Button onClick={handleDownloadPDF}>
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </div>

              {/* Missing Keywords Alert */}
              {tailoredResume.missingKeywords && tailoredResume.missingKeywords.length > 0 && (
                <Card className="border-red-200 bg-red-50 print:hidden">
                  <CardHeader className="pb-2">
                    <button 
                      onClick={() => setShowMissingKeywords(!showMissingKeywords)}
                      className="flex items-center justify-between w-full"
                    >
                      <CardTitle className="text-lg flex items-center gap-2 text-red-800">
                        <AlertTriangle className="w-5 h-5" />
                        Missing Keywords ({tailoredResume.missingKeywords.length})
                      </CardTitle>
                      {showMissingKeywords ? <ChevronUp className="w-5 h-5 text-red-600" /> : <ChevronDown className="w-5 h-5 text-red-600" />}
                    </button>
                  </CardHeader>
                  {showMissingKeywords && (
                    <CardContent className="space-y-3">
                      {tailoredResume.missingKeywords.map((item, i) => (
                        <div 
                          key={i} 
                          className={`p-3 rounded border ${getImportanceColor(item.importance)}`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">{item.keyword}</span>
                            <span className={`text-xs px-2 py-0.5 rounded uppercase ${
                              item.importance === "critical" ? "bg-red-200 text-red-800" :
                              item.importance === "important" ? "bg-amber-200 text-amber-800" :
                              "bg-slate-200 text-slate-700"
                            }`}>
                              {item.importance}
                            </span>
                          </div>
                          <p className="text-sm flex items-start gap-1">
                            <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            {item.suggestion}
                          </p>
                        </div>
                      ))}
                    </CardContent>
                  )}
                </Card>
              )}

              {/* Strength Areas */}
              {tailoredResume.strengthAreas && tailoredResume.strengthAreas.length > 0 && (
                <Card className="border-emerald-200 bg-emerald-50 print:hidden">
                  <CardContent className="pt-4">
                    <h3 className="font-semibold text-emerald-800 mb-2 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" /> Your Strengths for This Role
                    </h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {tailoredResume.strengthAreas.map((strength, i) => (
                        <li key={i} className="text-sm text-emerald-700 flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Resume Document */}
              <Card className="print:shadow-none print:border-0">
                <CardContent className="p-8 print:p-0">
                  {/* Header */}
                  <div className="border-b pb-4 mb-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h1 className="text-2xl font-bold text-slate-900">{tailoredResume.fullName}</h1>
                        <p className="text-emerald-700 font-medium mt-1">{tailoredResume.headline}</p>
                      </div>
                      <button 
                        onClick={() => copyToClipboard(`${tailoredResume.fullName}\n${tailoredResume.headline}`, 'header')}
                        className="print:hidden p-2 hover:bg-muted rounded transition-colors"
                        title="Copy"
                      >
                        {copiedSection === 'header' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                      </button>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                      {tailoredResume.email && <span>{tailoredResume.email}</span>}
                      {tailoredResume.phone && <span>• {tailoredResume.phone}</span>}
                      {tailoredResume.location && <span>• {tailoredResume.location}</span>}
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="mb-6 group">
                    <div className="flex items-start justify-between">
                      <h2 className="text-lg font-bold text-slate-900 border-b pb-1 mb-2 flex-1">
                        Professional Summary
                      </h2>
                      <button 
                        onClick={() => copyToClipboard(tailoredResume.summary, 'summary')}
                        className="print:hidden p-2 hover:bg-muted rounded transition-colors opacity-0 group-hover:opacity-100"
                        title="Copy"
                      >
                        {copiedSection === 'summary' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                      </button>
                    </div>
                    <p className="text-slate-700 leading-relaxed">{tailoredResume.summary}</p>
                  </div>

                  {/* Skills - Matched First */}
                  <div className="mb-6 group">
                    <div className="flex items-start justify-between">
                      <h2 className="text-lg font-bold text-slate-900 border-b pb-1 mb-3">
                        Key Skills
                      </h2>
                      <button 
                        onClick={() => copyToClipboard([...tailoredResume.matchedSkills, ...(tailoredResume.additionalSkills || [])].join(", "), 'skills')}
                        className="print:hidden p-2 hover:bg-muted rounded transition-colors opacity-0 group-hover:opacity-100"
                        title="Copy"
                      >
                        {copiedSection === 'skills' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {tailoredResume.matchedSkills.map((skill, i) => (
                        <span
                          key={`matched-${i}`}
                          className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium"
                        >
                          ✓ {skill}
                        </span>
                      ))}
                      {tailoredResume.additionalSkills?.map((skill, i) => (
                        <span
                          key={`additional-${i}`}
                          className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Experience */}
                  {tailoredResume.experiences && tailoredResume.experiences.length > 0 && (
                    <div className="mb-6">
                      <h2 className="text-lg font-bold text-slate-900 border-b pb-1 mb-3 flex items-center gap-2">
                        <Briefcase className="w-4 h-4" /> Professional Experience
                      </h2>
                      <div className="space-y-4">
                        {tailoredResume.experiences.map((exp, i) => (
                          <div key={i} className="group">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h3 className="font-semibold text-slate-900">{exp.title}</h3>
                                    <p className="text-slate-600">{exp.company}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-slate-500">{exp.dates}</span>
                                    <button 
                                      onClick={() => copyToClipboard(`${exp.title}\n${exp.company}\n${exp.dates}\n\n${exp.bullets.map(b => `• ${b}`).join('\n')}`, `exp-${i}`)}
                                      className="print:hidden p-2 hover:bg-muted rounded transition-colors opacity-0 group-hover:opacity-100"
                                      title="Copy"
                                    >
                                      {copiedSection === `exp-${i}` ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                                    </button>
                                  </div>
                                </div>
                              </div>
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
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 border-b pb-1 mb-3 flex items-center gap-2">
                        <GraduationCap className="w-4 h-4" /> Education
                      </h2>
                      <div className="space-y-2">
                        {tailoredResume.education.map((edu, i) => (
                          <div key={i} className="flex justify-between group">
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
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}