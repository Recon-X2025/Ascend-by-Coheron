import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { 
  Loader2, ArrowLeft, Building2, Calendar, MessageSquare, Target,
  ChevronDown, ChevronUp, Lightbulb, Check, X, Send, Sparkles,
  Brain, Briefcase, HelpCircle, Star
} from "lucide-react";
import SidebarLayout from "@/components/SidebarLayout";

interface StarAnswer {
  situation: string;
  task: string;
  action: string;
  result: string;
}

interface Question {
  id: number;
  question: string;
  category: string;
  difficulty: string;
  starAnswer: StarAnswer;
  tips: string;
}

interface Experience {
  id: string;
  title: string;
  company: string;
  start_date: string;
  end_date: string | null;
  is_current: number;
  description: string | null;
}

interface Education {
  id: string;
  degree: string;
  institution: string;
  graduation_year: string;
}

interface Skill {
  id: string;
  name: string;
}

interface Profile {
  id: number;
  full_name: string;
  headline: string | null;
  summary: string | null;
  experiences: Experience[];
  education: Education[];
  skills: Skill[];
}

interface Application {
  id: number;
  job_title: string;
  company: string;
  job_description: string | null;
  interview_date: string | null;
}

interface Feedback {
  overallScore: number;
  strengths: string[];
  improvements: string[];
  starAnalysis: {
    situation: { present: boolean; feedback: string };
    task: { present: boolean; feedback: string };
    action: { present: boolean; feedback: string };
    result: { present: boolean; feedback: string };
  };
  revisedAnswer: string;
}

const categoryConfig: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  behavioral: { icon: <Brain className="w-4 h-4" />, color: "text-purple-600", bg: "bg-purple-100" },
  technical: { icon: <Briefcase className="w-4 h-4" />, color: "text-blue-600", bg: "bg-blue-100" },
  situational: { icon: <Lightbulb className="w-4 h-4" />, color: "text-amber-600", bg: "bg-amber-100" },
  "role-specific": { icon: <Target className="w-4 h-4" />, color: "text-green-600", bg: "bg-green-100" },
};

const difficultyConfig: Record<string, { label: string; color: string }> = {
  easy: { label: "Easy", color: "text-green-600 bg-green-100" },
  medium: { label: "Medium", color: "text-amber-600 bg-amber-100" },
  hard: { label: "Hard", color: "text-red-600 bg-red-100" },
};

export default function InterviewPrep() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [noJobDescription, setNoJobDescription] = useState(false);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  const [practiceMode, setPracticeMode] = useState<number | null>(null);
  const [practiceAnswer, setPracticeAnswer] = useState("");
  const [feedback, setFeedback] = useState<Record<number, Feedback>>({});
  const [gettingFeedback, setGettingFeedback] = useState(false);
  const [showProfile, setShowProfile] = useState(true);

  useEffect(() => {
    const abortController = new AbortController();

    const fetchPrepData = async () => {
      if (!applicationId) {
        setLoading(false);
        navigate("/applications", { replace: true });
        return;
      }

      setLoading(true);
      setError(null);
      setNoJobDescription(false);

      try {
        const response = await fetch(`/api/interview-prep/${applicationId}`, {
          method: "POST",
          credentials: "include",
          signal: abortController.signal,
        });

        const contentType = response.headers.get("Content-Type") || "";
        if (!contentType.includes("application/json")) {
          const text = await response.text().catch(() => "");
          console.error("[interview-prep] Non-JSON response. Status:", response.status, "Body (first 500):", text.substring(0, 500));
          navigate("/applications", { replace: true, state: { error: "Failed to load interview prep. Please try again." } });
          return;
        }

        const data = await response.json().catch((parseErr) => {
          console.error("[interview-prep] JSON parse error:", parseErr);
          return null;
        });

        if (!response.ok) {
          const message = (data?.error) || "Failed to load interview prep";
          console.error("[interview-prep] API error. Status:", response.status, "message:", message);
          if (response.status === 404 || response.status === 403) {
            navigate("/applications", { replace: true, state: { error: message } });
            return;
          }
          if (response.status >= 500) {
            navigate("/applications", { replace: true, state: { error: "Server is temporarily unavailable. Please try again in a moment." } });
            return;
          }
          setError(message);
          return;
        }

        if (!data || !data.application || !data.profile) {
          console.error("[interview-prep] Invalid response shape:", data != null ? Object.keys(data) : "null");
          navigate("/applications", { replace: true, state: { error: "Failed to load interview prep. Please try again." } });
          return;
        }

        setApplication(data.application);
        setProfile(data.profile);
        setQuestions(data.questions || []);
        setNoJobDescription(Boolean(data.noJobDescription));
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        const msg = err instanceof Error ? err.message : String(err);
        const stack = err instanceof Error ? err.stack : undefined;
        console.error("[interview-prep] Failed to load interview prep. Error:", msg, "stack:", stack, "full:", err);
        setError(msg);
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchPrepData();

    return () => {
      abortController.abort();
    };
  }, [applicationId, navigate]);

  const getFeedback = async (questionId: number, question: string, starAnswer: StarAnswer) => {
    if (!practiceAnswer.trim()) return;
    
    setGettingFeedback(true);
    try {
      const response = await fetch("/api/interview-prep/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          question,
          userAnswer: practiceAnswer,
          starAnswer,
        }),
      });
      
      if (response.status >= 500) {
        console.error("Server error getting feedback");
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        setFeedback(prev => ({ ...prev, [questionId]: data }));
      }
    } catch (err) {
      console.error("Error getting feedback:", err);
    } finally {
      setGettingFeedback(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <SidebarLayout>
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <div className="text-center">
            <p className="font-medium">Preparing your interview session...</p>
            <p className="text-sm text-muted-foreground">Analyzing the role and your experience</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (error || !application || !profile) {
    return (
      <SidebarLayout>
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <p className="text-lg font-medium">{error || "Failed to load interview prep"}</p>
          <Button variant="outline" onClick={() => navigate("/applications")}>
            Back to Applications
          </Button>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-border bg-card">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center gap-4 mb-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/applications")}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex-1">
                <h1 className="text-2xl font-bold">Interview Prep Session</h1>
                <p className="text-muted-foreground">AI-powered preparation for your upcoming interview</p>
              </div>
            </div>

            {/* Job Info Banner */}
            <div className="flex flex-wrap items-center gap-6 p-4 bg-gradient-to-r from-primary/5 to-emerald-400/5 rounded-xl border border-primary/20">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-lg">{application.job_title}</h2>
                  <p className="text-muted-foreground">{application.company}</p>
                </div>
              </div>
              {application.interview_date && (
                <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-800 rounded-lg">
                  <Calendar className="w-4 h-4" />
                  <span className="font-medium">{formatDate(application.interview_date)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* No job description: prompt to add one before generating questions */}
        {noJobDescription && application && (
          <div className="max-w-7xl mx-auto px-6 py-8">
            <Card className="max-w-xl mx-auto border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                  <HelpCircle className="w-5 h-5" />
                  Add a job description to generate questions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-amber-800/90 dark:text-amber-200/90 mb-4">
                  This application doesn&apos;t have a job description yet. Interview prep needs the role details to generate relevant questions and STAR answers. Add the job description in your application, then return here to generate questions.
                </p>
                <Button onClick={() => navigate("/applications")} className="gap-2">
                  Go to Applications
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content - questions and profile (when we have questions or are not in no-job-description state) */}
        {!noJobDescription && (
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Profile & Job */}
            <div className="lg:col-span-1 space-y-6">
              {/* Toggle Profile View */}
              <Button 
                variant="outline" 
                className="w-full justify-between"
                onClick={() => setShowProfile(!showProfile)}
              >
                <span className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Your Profile Summary
                </span>
                {showProfile ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>

              {showProfile && (
                <>
                  {/* Profile Card */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Star className="w-4 h-4 text-primary" />
                        Your Profile
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="font-semibold">{profile.full_name}</p>
                        {profile.headline && (
                          <p className="text-sm text-muted-foreground">{profile.headline}</p>
                        )}
                      </div>

                      {profile.experiences.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2">EXPERIENCE</p>
                          <div className="space-y-2">
                            {profile.experiences.slice(0, 3).map((exp) => (
                              <div key={exp.id} className="text-sm">
                                <p className="font-medium">{exp.title}</p>
                                <p className="text-muted-foreground text-xs">{exp.company}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {profile.skills.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2">KEY SKILLS</p>
                          <div className="flex flex-wrap gap-1">
                            {profile.skills.slice(0, 8).map((skill) => (
                              <span 
                                key={skill.id} 
                                className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full"
                              >
                                {skill.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Job Description Card */}
                  {application.job_description && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-primary" />
                          Job Description
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-[12]">
                          {application.job_description}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}

              {/* Question Categories Legend */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Question Types</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Object.entries(categoryConfig).map(([key, config]) => (
                    <div key={key} className="flex items-center gap-2 text-sm">
                      <div className={`w-6 h-6 rounded flex items-center justify-center ${config.bg}`}>
                        <span className={config.color}>{config.icon}</span>
                      </div>
                      <span className="capitalize">{key.replace("-", " ")}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Questions */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  Interview Questions ({questions.length})
                </h2>
              </div>

              {questions.map((q, index) => {
                const category = categoryConfig[q.category] || categoryConfig.behavioral;
                const difficulty = difficultyConfig[q.difficulty] || difficultyConfig.medium;
                const isExpanded = expandedQuestion === q.id;
                const isPracticing = practiceMode === q.id;
                const hasFeedback = feedback[q.id];

                return (
                  <Card 
                    key={q.id} 
                    className={`transition-all ${isExpanded ? 'ring-2 ring-primary/30' : ''}`}
                  >
                    <CardContent className="p-0">
                      {/* Question Header */}
                      <button
                        className="w-full p-4 flex items-start gap-4 text-left hover:bg-muted/30 transition-colors"
                        onClick={() => {
                          setExpandedQuestion(isExpanded ? null : q.id);
                          if (isPracticing) {
                            setPracticeMode(null);
                            setPracticeAnswer("");
                          }
                        }}
                      >
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 font-semibold text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${category.bg} ${category.color}`}>
                              {category.icon}
                              <span className="capitalize">{q.category.replace("-", " ")}</span>
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${difficulty.color}`}>
                              {difficulty.label}
                            </span>
                          </div>
                          <p className="font-medium">{q.question}</p>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        )}
                      </button>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="px-4 pb-4 border-t border-border">
                          {/* STAR Answer Framework */}
                          <div className="mt-4 space-y-3">
                            <h4 className="font-semibold flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-primary" />
                              Suggested STAR Answer
                            </h4>
                            <div className="grid sm:grid-cols-2 gap-3">
                              <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                                <p className="text-xs font-semibold text-purple-600 mb-1">SITUATION</p>
                                <p className="text-sm">{q.starAnswer.situation}</p>
                              </div>
                              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                <p className="text-xs font-semibold text-blue-600 mb-1">TASK</p>
                                <p className="text-sm">{q.starAnswer.task}</p>
                              </div>
                              <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                                <p className="text-xs font-semibold text-amber-600 mb-1">ACTION</p>
                                <p className="text-sm">{q.starAnswer.action}</p>
                              </div>
                              <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                                <p className="text-xs font-semibold text-green-600 mb-1">RESULT</p>
                                <p className="text-sm">{q.starAnswer.result}</p>
                              </div>
                            </div>

                            {/* Tip */}
                            <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                              <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                              <p className="text-sm text-muted-foreground">{q.tips}</p>
                            </div>
                          </div>

                          {/* Practice Mode */}
                          <div className="mt-4 pt-4 border-t border-border">
                            {!isPracticing && !hasFeedback ? (
                              <Button 
                                variant="outline" 
                                className="w-full gap-2"
                                onClick={() => {
                                  setPracticeMode(q.id);
                                  setPracticeAnswer("");
                                }}
                              >
                                <HelpCircle className="w-4 h-4" />
                                Practice This Question
                              </Button>
                            ) : isPracticing && !hasFeedback ? (
                              <div className="space-y-3">
                                <label className="text-sm font-medium">Type your answer:</label>
                                <Textarea
                                  placeholder="Practice your answer here using the STAR method..."
                                  value={practiceAnswer}
                                  onChange={(e) => setPracticeAnswer(e.target.value)}
                                  rows={6}
                                  className="resize-none"
                                />
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => getFeedback(q.id, q.question, q.starAnswer)}
                                    disabled={!practiceAnswer.trim() || gettingFeedback}
                                    className="flex-1 gap-2"
                                  >
                                    {gettingFeedback ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Send className="w-4 h-4" />
                                    )}
                                    Get AI Feedback
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    onClick={() => {
                                      setPracticeMode(null);
                                      setPracticeAnswer("");
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : hasFeedback ? (
                              <div className="space-y-4">
                                {/* Score */}
                                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/5 to-emerald-400/5 rounded-xl">
                                  <span className="font-medium">Your Score</span>
                                  <div className={`text-3xl font-bold ${
                                    hasFeedback.overallScore >= 80 ? 'text-green-600' :
                                    hasFeedback.overallScore >= 60 ? 'text-amber-600' : 'text-red-600'
                                  }`}>
                                    {hasFeedback.overallScore}/100
                                  </div>
                                </div>

                                {/* STAR Analysis */}
                                <div>
                                  <h5 className="text-sm font-semibold mb-2">STAR Method Analysis</h5>
                                  <div className="grid grid-cols-4 gap-2">
                                    {(['situation', 'task', 'action', 'result'] as const).map((part) => {
                                      const analysis = hasFeedback.starAnalysis[part];
                                      return (
                                        <div 
                                          key={part}
                                          className={`p-2 rounded-lg text-center ${
                                            analysis.present ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                                          }`}
                                        >
                                          <div className="flex justify-center mb-1">
                                            {analysis.present ? (
                                              <Check className="w-4 h-4 text-green-600" />
                                            ) : (
                                              <X className="w-4 h-4 text-red-600" />
                                            )}
                                          </div>
                                          <p className="text-xs font-semibold capitalize">{part}</p>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Strengths */}
                                {hasFeedback.strengths.length > 0 && (
                                  <div>
                                    <h5 className="text-sm font-semibold mb-2 text-green-600">Strengths</h5>
                                    <ul className="space-y-1">
                                      {hasFeedback.strengths.map((s, i) => (
                                        <li key={i} className="text-sm flex items-start gap-2">
                                          <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                          {s}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* Improvements */}
                                {hasFeedback.improvements.length > 0 && (
                                  <div>
                                    <h5 className="text-sm font-semibold mb-2 text-amber-600">Areas to Improve</h5>
                                    <ul className="space-y-1">
                                      {hasFeedback.improvements.map((s, i) => (
                                        <li key={i} className="text-sm flex items-start gap-2">
                                          <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                          {s}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* Revised Answer */}
                                {hasFeedback.revisedAnswer && (
                                  <div>
                                    <h5 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                      <Sparkles className="w-4 h-4 text-primary" />
                                      Polished Answer
                                    </h5>
                                    <p className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                                      {hasFeedback.revisedAnswer}
                                    </p>
                                  </div>
                                )}

                                {/* Try Again */}
                                <Button
                                  variant="outline"
                                  className="w-full"
                                  onClick={() => {
                                    setFeedback(prev => {
                                      const newFeedback = { ...prev };
                                      delete newFeedback[q.id];
                                      return newFeedback;
                                    });
                                    setPracticeMode(q.id);
                                    setPracticeAnswer("");
                                  }}
                                >
                                  Try Again
                                </Button>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

              {questions.length === 0 && (
                <Card className="p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-lg font-medium mb-2">No questions generated</p>
                  <p className="text-muted-foreground">Try refreshing the page</p>
                </Card>
              )}
            </div>
          </div>
        </div>
        )}
      </div>
    </SidebarLayout>
  );
}
