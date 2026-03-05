import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import { Textarea } from "@/react-app/components/ui/textarea";
import { Label } from "@/react-app/components/ui/label";
import { Badge } from "@/react-app/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/react-app/components/ui/card";
import { Progress } from "@/react-app/components/ui/progress";
import { 
  ArrowLeft, ArrowRight, User, Briefcase, GraduationCap, Target, 
  Plus, X, Rocket, CheckCircle, Sparkles, Loader2, Linkedin, Upload, FileText, Search, ClipboardList
} from "lucide-react";
import { useProfileSave, useProfile } from "@/react-app/hooks/useProfile";
import type { ProfileData, Experience, Education } from "@/shared/types";
import { ProfileCompleteness } from "@/react-app/components/ProfileCompleteness";

type Step = "personal" | "experience" | "education" | "skills" | "aspirations" | "complete";

const STEPS: Step[] = ["personal", "experience", "education", "skills", "aspirations", "complete"];

const STEP_INFO: Record<Step, { icon: typeof User; title: string; description: string }> = {
  personal: { icon: User, title: "Personal Info", description: "Let's start with your basic details" },
  experience: { icon: Briefcase, title: "Work Experience", description: "Tell us about your professional journey" },
  education: { icon: GraduationCap, title: "Education", description: "Your academic background" },
  skills: { icon: Sparkles, title: "Skills", description: "What are you great at?" },
  aspirations: { icon: Target, title: "Career Goals", description: "Where do you want to go?" },
  complete: { icon: CheckCircle, title: "Profile Complete", description: "Your profile has been saved" },
};

interface ProfileBuilderProps {
  onBack?: () => void;
  onComplete?: (profileId: number) => void;
  profileId?: number;
}

export default function ProfileBuilder({ onBack, onComplete, profileId }: ProfileBuilderProps) {
  const [currentStep, setCurrentStep] = useState<Step>("personal");
  const { saveProfile, saving, error } = useProfileSave();
  const { profile: existingProfile } = useProfile(profileId);
  const [profile, setProfile] = useState<ProfileData>({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    headline: "",
    summary: "",
    linkedinUrl: "",
    resumeKey: "",
    experiences: [],
    education: [],
    skills: [],
    targetRole: "",
    targetIndustry: "",
    careerGoals: "",
  });
  const [resumeFilename, setResumeFilename] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [savedProfileId, setSavedProfileId] = useState<number | null>(profileId ?? null);

  // Load existing profile data when editing
  useEffect(() => {
    if (existingProfile) {
      setProfile({
        fullName: existingProfile.fullName,
        email: existingProfile.email,
        phone: existingProfile.phone || "",
        location: existingProfile.location || "",
        headline: existingProfile.headline || "",
        summary: existingProfile.summary || "",
        linkedinUrl: existingProfile.linkedinUrl || "",
        resumeKey: existingProfile.resumeKey || "",
        experiences: existingProfile.experiences.map(exp => ({
          id: exp.id || crypto.randomUUID(),
          title: exp.title,
          company: exp.company,
          startDate: exp.startDate,
          endDate: exp.endDate,
          current: exp.current,
          description: exp.description,
        })),
        education: existingProfile.education.map(edu => ({
          id: edu.id || crypto.randomUUID(),
          degree: edu.degree,
          institution: edu.institution,
          year: edu.year,
        })),
        skills: existingProfile.skills,
        targetRole: existingProfile.targetRole || "",
        targetIndustry: existingProfile.targetIndustry || "",
        careerGoals: existingProfile.careerGoals || "",
      });
    }
  }, [existingProfile]);

  const parseResume = async () => {
    if (!profile.resumeKey) return;
    
    setParsing(true);
    try {
      const response = await fetch("/api/resumes/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeKey: profile.resumeKey }),
      });
      
      const result = await response.json();
      if (result.success && result.data) {
        const parsed = result.data;
        setProfile({
          ...profile,
          fullName: parsed.fullName || profile.fullName,
          email: parsed.email || profile.email,
          phone: parsed.phone || profile.phone,
          location: parsed.location || profile.location,
          headline: parsed.headline || profile.headline,
          summary: parsed.summary || profile.summary,
          experiences: parsed.experiences?.map((exp: Record<string, unknown>) => ({
            id: String(exp.id ?? crypto.randomUUID()),
            title: String(exp.title ?? ""),
            company: String(exp.company ?? ""),
            startDate: String(exp.startDate ?? ""),
            endDate: String(exp.endDate ?? ""),
            current: Boolean(exp.current),
            description: String(exp.description ?? ""),
          })) || profile.experiences,
          education: parsed.education?.map((edu: Record<string, unknown>) => ({
            id: String(edu.id ?? crypto.randomUUID()),
            degree: String(edu.degree ?? ""),
            institution: String(edu.institution ?? ""),
            year: String(edu.year ?? ""),
          })) || profile.education,
          skills: parsed.skills || profile.skills,
        });
      } else {
        alert(result.error || "Failed to parse resume");
      }
    } catch (error) {
      console.error("Parse error:", error);
      alert("Failed to parse resume");
    } finally {
      setParsing(false);
    }
  };

  const currentStepIndex = STEPS.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  const goNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length - 1) { // Don't go to "complete" step directly
      setCurrentStep(STEPS[nextIndex]);
    }
  };

  const handleComplete = async () => {
    const profileId = await saveProfile(profile);
    if (profileId) {
      setSavedProfileId(profileId);
      setCurrentStep("complete");
      onComplete?.(profileId);
    }
  };

  const goPrev = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex]);
    }
  };

  const addExperience = () => {
    setProfile({
      ...profile,
      experiences: [
        ...profile.experiences,
        { id: crypto.randomUUID(), title: "", company: "", startDate: "", endDate: "", current: false, description: "" }
      ]
    });
  };

  const updateExperience = (id: string, field: keyof Experience, value: string | boolean) => {
    setProfile({
      ...profile,
      experiences: profile.experiences.map(exp => 
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    });
  };

  const removeExperience = (id: string) => {
    setProfile({
      ...profile,
      experiences: profile.experiences.filter(exp => exp.id !== id)
    });
  };

  const addEducation = () => {
    setProfile({
      ...profile,
      education: [
        ...profile.education,
        { id: crypto.randomUUID(), degree: "", institution: "", year: "" }
      ]
    });
  };

  const updateEducation = (id: string, field: keyof Education, value: string) => {
    setProfile({
      ...profile,
      education: profile.education.map(edu => 
        edu.id === id ? { ...edu, [field]: value } : edu
      )
    });
  };

  const removeEducation = (id: string) => {
    setProfile({
      ...profile,
      education: profile.education.filter(edu => edu.id !== id)
    });
  };

  const addSkill = () => {
    if (newSkill.trim() && !profile.skills.includes(newSkill.trim())) {
      setProfile({ ...profile, skills: [...profile.skills, newSkill.trim()] });
      setNewSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setProfile({ ...profile, skills: profile.skills.filter(s => s !== skill) });
  };

  const StepIcon = STEP_INFO[currentStep].icon;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={onBack}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center">
                <Rocket className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold">Ascend</span>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex items-center gap-2 mt-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <StepIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold">{STEP_INFO[currentStep].title}</p>
              <p className="text-sm text-muted-foreground">{STEP_INFO[currentStep].description}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Profile Completeness - shown when editing existing profile */}
        {profileId && currentStep !== "complete" && (
          <div className="mb-8">
            <ProfileCompleteness 
              profileId={profileId} 
              variant="full" 
              onNavigateToField={(field) => setCurrentStep(field as Step)}
            />
          </div>
        )}

        {currentStep === "personal" && (
          <PersonalStep 
            profile={profile} 
            setProfile={setProfile}
            resumeFilename={resumeFilename}
            setResumeFilename={setResumeFilename}
            uploading={uploading}
            setUploading={setUploading}
            parsing={parsing}
            onParseResume={parseResume}
          />
        )}
        {currentStep === "experience" && (
          <ExperienceStep 
            experiences={profile.experiences}
            onAdd={addExperience}
            onUpdate={updateExperience}
            onRemove={removeExperience}
          />
        )}
        {currentStep === "education" && (
          <EducationStep 
            education={profile.education}
            onAdd={addEducation}
            onUpdate={updateEducation}
            onRemove={removeEducation}
          />
        )}
        {currentStep === "skills" && (
          <SkillsStep 
            skills={profile.skills}
            newSkill={newSkill}
            setNewSkill={setNewSkill}
            onAdd={addSkill}
            onRemove={removeSkill}
          />
        )}
        {currentStep === "aspirations" && (
          <AspirationsStep profile={profile} setProfile={setProfile} />
        )}
        {currentStep === "complete" && (
          <CompleteStep profile={profile} profileId={savedProfileId} onBack={onBack} />
        )}

        {error && (
          <div className="p-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
            {error}
          </div>
        )}

        {/* Navigation */}
        {currentStep !== "complete" && (
          <div className="flex justify-between mt-8 pt-6 border-t border-border">
            <Button 
              variant="outline" 
              onClick={goPrev}
              disabled={currentStepIndex === 0}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Previous
            </Button>
            {currentStep !== "aspirations" ? (
              <Button onClick={goNext} className="gap-2">
                Next <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button 
                onClick={handleComplete} 
                disabled={saving || !profile.fullName || !profile.email}
                className="gap-2 bg-gradient-to-r from-primary to-emerald-500"
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                ) : (
                  <><CheckCircle className="w-4 h-4" /> Complete Profile</>
                )}
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function PersonalStep({ 
  profile, 
  setProfile,
  resumeFilename,
  setResumeFilename,
  uploading,
  setUploading,
  parsing,
  onParseResume
}: { 
  profile: ProfileData; 
  setProfile: (p: ProfileData) => void;
  resumeFilename: string;
  setResumeFilename: (name: string) => void;
  uploading: boolean;
  setUploading: (uploading: boolean) => void;
  parsing: boolean;
  onParseResume: () => void;
}) {
  const [importingLinkedIn, setImportingLinkedIn] = useState(false);

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Support multiple file types
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "text/plain",
      "application/rtf",
      "text/rtf"
    ];
    const allowedExtensions = ['pdf', 'docx', 'doc', 'txt', 'rtf'];
    const ext = file.name.toLowerCase().split('.').pop();
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(ext || '')) {
      alert("Please upload a PDF, DOCX, DOC, TXT, or RTF file");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch("/api/resumes/upload", {
        method: "POST",
        body: formData,
      });
      
      const result = await response.json();
      if (result.success) {
        setProfile({ ...profile, resumeKey: result.key });
        setResumeFilename(result.filename);
      } else {
        alert(result.error || "Failed to upload resume");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload resume");
    } finally {
      setUploading(false);
    }
  };

  const handleLinkedInImport = async () => {
    if (!profile.linkedinUrl) {
      alert("Please enter your LinkedIn profile URL first");
      return;
    }

    setImportingLinkedIn(true);
    try {
      const response = await fetch("/api/linkedin/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkedinUrl: profile.linkedinUrl }),
      });
      
      const result = await response.json();
      if (result.success && result.data) {
        const data = result.data;
        setProfile({
          ...profile,
          fullName: data.fullName || profile.fullName,
          headline: data.headline || profile.headline,
          location: data.location || profile.location,
          summary: data.summary || profile.summary,
          experiences: data.experiences?.length > 0 ? data.experiences.map((exp: Record<string, unknown>) => ({
            id: String(exp.id ?? crypto.randomUUID()),
            title: String(exp.title ?? ""),
            company: String(exp.company ?? ""),
            startDate: String(exp.startDate ?? ""),
            endDate: String(exp.endDate ?? ""),
            current: Boolean(exp.current),
            description: String(exp.description ?? "")
          })) : profile.experiences,
          education: data.education?.length > 0 ? data.education.map((edu: Record<string, unknown>) => ({
            id: String(edu.id ?? crypto.randomUUID()),
            degree: String(edu.degree ?? ""),
            institution: String(edu.institution ?? ""),
            year: String(edu.year ?? "")
          })) : profile.education,
          skills: data.skills?.length > 0 ? data.skills : profile.skills
        });
        alert("LinkedIn profile imported successfully!");
      } else {
        // Show error with suggestion if available
        let message = result.error || "Failed to import LinkedIn profile";
        if (result.suggestion) {
          message += "\n\n" + result.suggestion;
        }
        alert(message);
      }
    } catch (error) {
      console.error("LinkedIn import error:", error);
      alert("Failed to import LinkedIn profile. Please upload your resume instead.");
    } finally {
      setImportingLinkedIn(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Import Section */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Quick Import
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="linkedin" className="flex items-center gap-2">
                <Linkedin className="w-4 h-4 text-blue-600" />
                LinkedIn Profile URL
              </Label>
              <div className="flex gap-2">
                <Input 
                  id="linkedin" 
                  placeholder="https://linkedin.com/in/yourprofile"
                  value={profile.linkedinUrl}
                  onChange={(e) => setProfile({ ...profile, linkedinUrl: e.target.value })}
                  className="flex-1"
                />
                <Button 
                  size="sm" 
                  onClick={handleLinkedInImport}
                  disabled={importingLinkedIn || !profile.linkedinUrl}
                  className="gap-1 whitespace-nowrap"
                >
                  {importingLinkedIn ? (
                    <><Loader2 className="w-3 h-3 animate-spin" /> Importing...</>
                  ) : (
                    <><Sparkles className="w-3 h-3" /> Import</>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Enter URL and click Import to auto-fill your profile</p>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-red-600" />
                Upload Resume
              </Label>
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept=".pdf,.docx,.doc,.txt,.rtf"
                  onChange={handleResumeUpload}
                  disabled={uploading}
                  className="file:mr-2 file:px-3 file:py-1 file:rounded-md file:border-0 file:text-xs file:bg-primary file:text-primary-foreground file:cursor-pointer"
                />
              </div>
              <p className="text-xs text-muted-foreground">Supports PDF, DOCX, DOC, TXT, RTF</p>
              {uploading && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Uploading...
                </p>
              )}
              {resumeFilename && !uploading && (
                <div className="space-y-2">
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> {resumeFilename} uploaded
                  </p>
                  <Button 
                    size="sm" 
                    onClick={onParseResume}
                    disabled={parsing}
                    className="gap-2"
                  >
                    {parsing ? (
                      <><Loader2 className="w-3 h-3 animate-spin" /> Parsing with AI...</>
                    ) : (
                      <><Sparkles className="w-3 h-3" /> Auto-fill from Resume</>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name *</Label>
          <Input 
            id="fullName" 
            placeholder="John Doe"
            value={profile.fullName}
            onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input 
            id="email" 
            type="email"
            placeholder="john@example.com"
            value={profile.email}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input 
            id="phone" 
            placeholder="+1 (555) 123-4567"
            value={profile.phone}
            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input 
            id="location" 
            placeholder="San Francisco, CA"
            value={profile.location}
            onChange={(e) => setProfile({ ...profile, location: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="headline">Professional Headline</Label>
        <Input 
          id="headline" 
          placeholder="Senior Software Engineer | AI & Machine Learning"
          value={profile.headline}
          onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">A short tagline that appears below your name on profiles</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="summary">Professional Summary</Label>
        <Textarea 
          id="summary" 
          placeholder="Write a brief summary of your professional background, key achievements, and what makes you unique..."
          rows={5}
          value={profile.summary}
          onChange={(e) => setProfile({ ...profile, summary: e.target.value })}
        />
      </div>
    </div>
  );
}

function ExperienceStep({ experiences, onAdd, onUpdate, onRemove }: {
  experiences: Experience[];
  onAdd: () => void;
  onUpdate: (id: string, field: keyof Experience, value: string | boolean) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="space-y-6">
      {experiences.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No work experience added yet</p>
            <Button onClick={onAdd} className="gap-2">
              <Plus className="w-4 h-4" /> Add Experience
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {experiences.map((exp, index) => (
            <Card key={exp.id}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Position {index + 1}</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => onRemove(exp.id)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Job Title *</Label>
                    <Input 
                      placeholder="Software Engineer"
                      value={exp.title}
                      onChange={(e) => onUpdate(exp.id, "title", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Company *</Label>
                    <Input 
                      placeholder="Google"
                      value={exp.company}
                      onChange={(e) => onUpdate(exp.id, "company", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input 
                      type="month"
                      value={exp.startDate}
                      onChange={(e) => onUpdate(exp.id, "startDate", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input 
                      type="month"
                      value={exp.endDate}
                      onChange={(e) => onUpdate(exp.id, "endDate", e.target.value)}
                      disabled={exp.current}
                      placeholder={exp.current ? "Present" : ""}
                    />
                    <label className="flex items-center gap-2 text-sm">
                      <input 
                        type="checkbox" 
                        checked={exp.current}
                        onChange={(e) => onUpdate(exp.id, "current", e.target.checked)}
                        className="rounded"
                      />
                      I currently work here
                    </label>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea 
                    placeholder="Describe your responsibilities, achievements, and impact..."
                    rows={4}
                    value={exp.description}
                    onChange={(e) => onUpdate(exp.id, "description", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
          <Button variant="outline" onClick={onAdd} className="w-full gap-2">
            <Plus className="w-4 h-4" /> Add Another Position
          </Button>
        </>
      )}
    </div>
  );
}

function EducationStep({ education, onAdd, onUpdate, onRemove }: {
  education: Education[];
  onAdd: () => void;
  onUpdate: (id: string, field: keyof Education, value: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="space-y-6">
      {education.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No education added yet</p>
            <Button onClick={onAdd} className="gap-2">
              <Plus className="w-4 h-4" /> Add Education
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {education.map((edu, index) => (
            <Card key={edu.id}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Education {index + 1}</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => onRemove(edu.id)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Degree / Certification</Label>
                    <Input 
                      placeholder="Bachelor of Science in Computer Science"
                      value={edu.degree}
                      onChange={(e) => onUpdate(edu.id, "degree", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Institution</Label>
                    <Input 
                      placeholder="Stanford University"
                      value={edu.institution}
                      onChange={(e) => onUpdate(edu.id, "institution", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Graduation Year</Label>
                    <Input 
                      placeholder="2020"
                      value={edu.year}
                      onChange={(e) => onUpdate(edu.id, "year", e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          <Button variant="outline" onClick={onAdd} className="w-full gap-2">
            <Plus className="w-4 h-4" /> Add Another Education
          </Button>
        </>
      )}
    </div>
  );
}

function SkillsStep({ skills, newSkill, setNewSkill, onAdd, onRemove }: {
  skills: string[];
  newSkill: string;
  setNewSkill: (s: string) => void;
  onAdd: () => void;
  onRemove: (s: string) => void;
}) {
  const suggestedSkills = [
    "JavaScript", "Python", "React", "Node.js", "AWS", "Docker",
    "Project Management", "Agile", "Data Analysis", "Machine Learning",
    "Communication", "Leadership", "Problem Solving", "Team Collaboration"
  ].filter(s => !skills.includes(s));

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Add Skills</Label>
        <div className="flex gap-2">
          <Input 
            placeholder="Type a skill and press Enter"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onAdd();
              }
            }}
          />
          <Button onClick={onAdd}>Add</Button>
        </div>
      </div>

      {skills.length > 0 && (
        <div className="space-y-2">
          <Label>Your Skills</Label>
          <div className="flex flex-wrap gap-2">
            {skills.map(skill => (
              <Badge key={skill} variant="secondary" className="gap-1 py-1.5 px-3">
                {skill}
                <button onClick={() => onRemove(skill)} className="ml-1 hover:text-destructive">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-muted-foreground">Suggested Skills</Label>
        <div className="flex flex-wrap gap-2">
          {suggestedSkills.slice(0, 10).map(skill => (
            <Badge 
              key={skill} 
              variant="outline" 
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={() => {
                setNewSkill(skill);
                onAdd();
              }}
            >
              <Plus className="w-3 h-3 mr-1" /> {skill}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}



function CompleteStep({ profile, profileId, onBack }: { profile: ProfileData; profileId: number | null; onBack?: () => void }) {
  const navigate = useNavigate();
  
  return (
    <div className="text-center py-12">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-10 h-10 text-primary" />
      </div>
      <h2 className="text-3xl font-bold mb-4">Profile Saved!</h2>
      <p className="text-muted-foreground mb-8 max-w-md mx-auto">
        Your profile has been saved successfully. You can now generate optimized versions 
        for different job boards and start searching for jobs.
      </p>
      
      <div className="bg-card border border-border rounded-xl p-6 max-w-md mx-auto mb-8 text-left">
        <h3 className="font-semibold mb-3">Profile Summary</h3>
        <div className="space-y-2 text-sm">
          <p><span className="text-muted-foreground">Name:</span> {profile.fullName}</p>
          <p><span className="text-muted-foreground">Email:</span> {profile.email}</p>
          {profile.headline && <p><span className="text-muted-foreground">Headline:</span> {profile.headline}</p>}
          {profile.targetRole && <p><span className="text-muted-foreground">Target Role:</span> {profile.targetRole}</p>}
          <p><span className="text-muted-foreground">Experience:</span> {profile.experiences.length} position(s)</p>
          <p><span className="text-muted-foreground">Skills:</span> {profile.skills.length} skill(s)</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button onClick={onBack} variant="outline">
          Back to Home
        </Button>
        <Button 
          onClick={() => profileId && navigate(`/resume/generate`)}
          disabled={!profileId}
          className="gap-2"
        >
          <FileText className="w-4 h-4" /> Generate Base Resume
        </Button>
        <Button 
          onClick={() => navigate('/optimize')}
          variant="outline"
          className="gap-2"
        >
          <Sparkles className="w-4 h-4" /> Optimize for Job Boards
        </Button>
        <Button 
          onClick={() => profileId && navigate(`/tailor`)}
          disabled={!profileId}
          variant="outline"
          className="gap-2"
        >
          <FileText className="w-4 h-4" /> Tailor Resume
        </Button>
        <Button 
          onClick={() => navigate(profileId ? `/jobs/${profileId}` : "/jobs")}
          variant="outline"
          className="gap-2"
        >
          <Search className="w-4 h-4" /> Search Jobs
        </Button>
        <Button 
          onClick={() => profileId && navigate(`/tracker`)}
          disabled={!profileId}
          variant="outline"
          className="gap-2"
        >
          <ClipboardList className="w-4 h-4" /> Track Applications
        </Button>
      </div>
    </div>
  );
}

function AspirationsStep({ profile, setProfile }: { profile: ProfileData; setProfile: (p: ProfileData) => void }) {
  const roleOptions = [
    "Software Engineer", "Product Manager", "Data Scientist", "UX Designer",
    "Marketing Manager", "Sales Manager", "Business Analyst", "Project Manager",
    "DevOps Engineer", "Full Stack Developer", "Frontend Developer", "Backend Developer"
  ];

  const industryOptions = [
    "Technology", "Finance", "Healthcare", "E-commerce", "Education",
    "Manufacturing", "Consulting", "Media & Entertainment", "Real Estate", "Energy"
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="targetRole">Target Role</Label>
        <Input 
          id="targetRole"
          placeholder="Senior Software Engineer"
          value={profile.targetRole}
          onChange={(e) => setProfile({ ...profile, targetRole: e.target.value })}
          list="role-suggestions"
        />
        <datalist id="role-suggestions">
          {roleOptions.map(role => <option key={role} value={role} />)}
        </datalist>
        <p className="text-xs text-muted-foreground">What position are you aiming for?</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="targetIndustry">Target Industry</Label>
        <Input 
          id="targetIndustry"
          placeholder="Technology"
          value={profile.targetIndustry}
          onChange={(e) => setProfile({ ...profile, targetIndustry: e.target.value })}
          list="industry-suggestions"
        />
        <datalist id="industry-suggestions">
          {industryOptions.map(industry => <option key={industry} value={industry} />)}
        </datalist>
      </div>

      <div className="space-y-2">
        <Label htmlFor="careerGoals">Career Goals & Aspirations</Label>
        <Textarea 
          id="careerGoals"
          placeholder="Describe where you see yourself in 2-5 years. What kind of impact do you want to make? What challenges excite you?"
          rows={5}
          value={profile.careerGoals}
          onChange={(e) => setProfile({ ...profile, careerGoals: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          This helps us match you with the right opportunities and tailor your profiles
        </p>
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Target className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">What happens next?</p>
              <p className="text-sm text-muted-foreground">
                After completing your profile, we'll generate optimized versions for LinkedIn, Naukri, Indeed, Foundit, and Glassdoor. You'll also be able to search for jobs and create tailored resumes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
