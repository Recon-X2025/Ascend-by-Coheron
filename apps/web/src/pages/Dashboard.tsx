import { useState, useEffect } from "react";
import { formatDate } from "@/lib/dateUtils";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, Search, Sparkles, Briefcase, 
  Loader2, ChevronRight, User, Clock, CheckCircle2, Circle, Rocket,
  TrendingUp, Target, FileDown, Activity, Flame, Mic
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useMyProfiles } from "@/hooks/useProfile";
import ProfileBuilder from "@/components/ProfileBuilder";
import SidebarLayout from "@/components/SidebarLayout";
import { ProfileCompleteness } from "@/components/ProfileCompleteness";

// Mock data for profile views chart
const profileViewsData = [
  { day: "Mon", views: 12 },
  { day: "Tue", views: 19 },
  { day: "Wed", views: 15 },
  { day: "Thu", views: 28 },
  { day: "Fri", views: 32 },
  { day: "Sat", views: 18 },
  { day: "Sun", views: 24 },
];

// Keys for tracking onboarding progress
const ONBOARDING_KEYS = {
  optimized: 'ascend_has_optimized',
  practiced: 'ascend_has_practiced',
  tracked: 'ascend_has_tracked',
  downloaded: 'ascend_has_downloaded',
  dismissed: 'ascend_onboarding_dismissed'
};

interface Application {
  id: number;
  status: string;
}

interface SkillDemand {
  name: string;
  demand: number;
  trend: "up" | "down" | "stable";
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isPending } = useAuth();
  const { profiles, loading, refresh } = useMyProfiles();
  const [showProfileBuilder, setShowProfileBuilder] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<number | undefined>(undefined);
  const [hasOptimized, setHasOptimized] = useState(false);
  const [hasPracticed, setHasPracticed] = useState(false);
  const [hasTracked, setHasTracked] = useState(false);
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [skillsDemand, setSkillsDemand] = useState<SkillDemand[]>([]);
  const [chartsMounted, setChartsMounted] = useState(false);
  const [eulaChecked, setEulaChecked] = useState(false);

  // Check EULA acceptance status
  useEffect(() => {
    const checkEulaStatus = async () => {
      if (!user) return;
      try {
        const res = await fetch("/api/eula/status", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (!data.accepted) {
            // First-time user or EULA version changed - redirect to EULA page
            navigate("/eula");
            return;
          }
        }
      } catch (error) {
        console.error("Error checking EULA status:", error);
      }
      setEulaChecked(true);
    };
    if (user && !isPending) {
      checkEulaStatus();
    }
  }, [user, isPending, navigate]);

  // Only render charts after mount to avoid SSR/dimension issues
  useEffect(() => {
    setChartsMounted(true);
  }, []);

  // Load onboarding progress from localStorage
  useEffect(() => {
    setHasOptimized(localStorage.getItem(ONBOARDING_KEYS.optimized) === 'true');
    setHasPracticed(localStorage.getItem(ONBOARDING_KEYS.practiced) === 'true');
    setHasTracked(localStorage.getItem(ONBOARDING_KEYS.tracked) === 'true');
    setHasDownloaded(localStorage.getItem(ONBOARDING_KEYS.downloaded) === 'true');
    setOnboardingDismissed(localStorage.getItem(ONBOARDING_KEYS.dismissed) === 'true');
  }, []);

  // Fetch applications for metrics
  useEffect(() => {
    const fetchApplications = async () => {
      if (profiles.length === 0) return;
      try {
        const allApps: Application[] = [];
        for (const profile of profiles) {
          const res = await fetch(`/api/applications/${profile.id}`, { credentials: "include" });
          if (res.ok) {
            const data = await res.json();
            allApps.push(...(data.applications || []));
          }
        }
        setApplications(allApps);
      } catch (error) {
        console.error("Error fetching applications:", error);
      }
    };
    if (!loading && profiles.length > 0) {
      fetchApplications();
    }
  }, [profiles, loading]);

  // Generate skills demand data based on user's skills
  useEffect(() => {
    const generateSkillsDemand = async () => {
      if (profiles.length === 0) return;
      try {
        // Fetch skills from first profile
        const res = await fetch(`/api/profiles/${profiles[0].id}`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          const skills = data.skills || [];
          
          // Skills are returned as an array of strings, not objects
          let demandData: SkillDemand[];
          if (skills.length > 0) {
            demandData = skills.slice(0, 6).map((skill: string, index: number) => ({
              name: skill,
              demand: Math.max(95 - index * 12, 40) + Math.floor(Math.random() * 10),
              trend: (index < 2 ? "up" : index < 4 ? "stable" : "down") as "up" | "down" | "stable"
            }));
          } else {
            // Fallback data when no skills exist
            demandData = [
              { name: "JavaScript", demand: 95, trend: "up" },
              { name: "React", demand: 88, trend: "up" },
              { name: "TypeScript", demand: 82, trend: "stable" },
              { name: "Node.js", demand: 76, trend: "stable" },
              { name: "Python", demand: 70, trend: "down" },
              { name: "AWS", demand: 65, trend: "down" }
            ];
          }
          setSkillsDemand(demandData);
        }
      } catch (error) {
        console.error("Error fetching skills:", error);
        // Set fallback data on error
        setSkillsDemand([
          { name: "JavaScript", demand: 95, trend: "up" },
          { name: "React", demand: 88, trend: "up" },
          { name: "TypeScript", demand: 82, trend: "stable" },
          { name: "Node.js", demand: 76, trend: "stable" },
          { name: "Python", demand: 70, trend: "down" },
          { name: "AWS", demand: 65, trend: "down" }
        ]);
      }
    };
    if (!loading && profiles.length > 0) {
      generateSkillsDemand();
    }
  }, [profiles, loading]);

  // Calculate onboarding progress
  const hasProfile = profiles.length > 0;
  const totalSteps = 5;
  const completedSteps = [hasProfile, hasOptimized, hasPracticed, hasTracked, hasDownloaded].filter(Boolean).length;
  const allStepsComplete = completedSteps === totalSteps;
  const showOnboarding = !onboardingDismissed && !allStepsComplete;

  if (isPending || loading || !eulaChecked) {
    return (
      <SidebarLayout>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </SidebarLayout>
    );
  }

  if (showProfileBuilder) {
    return (
      <ProfileBuilder
        profileId={editingProfileId}
        onBack={() => {
          setShowProfileBuilder(false);
          setEditingProfileId(undefined);
          refresh();
        }}
        onComplete={() => {
          setShowProfileBuilder(false);
          setEditingProfileId(undefined);
          refresh();
          navigate('/optimize');
        }}
      />
    );
  }

  const handleEditProfile = (profileId: number) => {
    setEditingProfileId(profileId);
    setShowProfileBuilder(true);
  };

  const handleNewProfile = () => {
    setEditingProfileId(undefined);
    setShowProfileBuilder(true);
  };


  return (
    <SidebarLayout>
      <div className="min-h-screen bg-background">
        {/* Main Content */}
        <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back{user?.google_user_data?.given_name ? `, ${user.google_user_data.given_name}` : ''}! 👋
          </h1>
          <p className="text-muted-foreground">
            {profiles.length === 0 
              ? "You have 0 profiles. Create one to get started."
              : profiles.length === 1
                ? "You have 1 profile. Ready to search for jobs?"
                : `You have ${profiles.length} profiles. Ready to search for jobs?`
            }
          </p>
        </div>

        {/* Getting Started Checklist */}
        {showOnboarding && (
          <Card className="mb-8 border-primary/20 bg-gradient-to-r from-primary/5 via-emerald-500/5 to-transparent">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center">
                    <Rocket className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Getting Started</CardTitle>
                    <CardDescription>{completedSteps} of {totalSteps} complete</CardDescription>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    localStorage.setItem(ONBOARDING_KEYS.dismissed, 'true');
                    setOnboardingDismissed(true);
                  }}
                >
                  Dismiss
                </Button>
              </div>
              <Progress value={(completedSteps / totalSteps) * 100} className="h-2 mt-4" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <OnboardingStep
                  completed={hasProfile}
                  title="Create your career profile"
                  description="Add your experience, skills, and career goals"
                  action={hasProfile ? undefined : handleNewProfile}
                  actionLabel="Create Profile"
                />
                <OnboardingStep
                  completed={hasOptimized}
                  title="Run AI optimization"
                  description="Generate platform-specific profiles for LinkedIn, Indeed & more"
                  action={hasProfile && !hasOptimized ? () => navigate('/optimize') : undefined}
                  actionLabel="Optimize Now"
                  disabled={!hasProfile}
                />
                <OnboardingStep
                  completed={hasPracticed}
                  title="Start your first application"
                  description="Paste a job description and let Ascend create your application package"
                  action={!hasPracticed ? () => navigate('/jobs') : undefined}
                  actionLabel="Find & Apply"
                  disabled={false}
                />
                <OnboardingStep
                  completed={hasTracked}
                  title="Track your first application"
                  description="Use the Kanban board to organize and track your job applications"
                  action={hasProfile && !hasTracked ? () => navigate('/applications') : undefined}
                  actionLabel="Track Applications"
                  disabled={!hasProfile}
                />
                <OnboardingStep
                  completed={hasDownloaded}
                  title="Download your tailored resume"
                  description="Generate and download a resume customized for a specific job"
                  action={hasProfile && !hasDownloaded ? () => navigate(`/tailor`) : undefined}
                  actionLabel="Tailor Resume"
                  disabled={!hasProfile}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4 mb-12">
          <QuickAction
            icon={<Plus className="w-5 h-5" />}
            title="New Profile"
            description="Create a new career profile"
            onClick={handleNewProfile}
            primary
          />
          <QuickAction
            icon={<Sparkles className="w-5 h-5" />}
            title="Optimize"
            description="AI-powered profile optimization"
            onClick={() => navigate('/optimize')}
            disabled={profiles.length === 0}
          />
          <QuickAction
            icon={<Mic className="w-5 h-5" />}
            title="Interview Prep"
            description="AI-powered practice for your next interview"
            onClick={() => navigate('/interview-prep')}
          />
          <QuickAction
            icon={<Briefcase className="w-5 h-5" />}
            title="Applications"
            description="Track your job applications"
            onClick={() => navigate('/applications')}
          />
          <QuickAction
            icon={<Target className="w-5 h-5" />}
            title="Find & Apply"
            description="Search jobs or paste a JD to start"
            onClick={() => navigate('/jobs')}
          />
        </div>

        {/* Profiles Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Your Profiles</h2>
            <Button onClick={handleNewProfile} size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              New Profile
            </Button>
          </div>

          {profiles.length === 0 ? (
            <Card className="border-2 border-dashed border-primary/20 bg-gradient-to-br from-primary/5 to-emerald-500/5">
              <CardContent className="flex flex-col items-center justify-center py-20">
                <div className="relative mb-6">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-emerald-400/20 flex items-center justify-center">
                    <Sparkles className="w-12 h-12 text-primary" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                    <Plus className="w-5 h-5 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-3 text-center">Your career transformation starts here</h3>
                <p className="text-muted-foreground text-center mb-8 max-w-lg leading-relaxed">
                  Build a powerful career profile that AI optimizes for LinkedIn, Indeed, Naukri, and more — 
                  helping you stand out and land your dream role.
                </p>
                <Button onClick={handleNewProfile} size="lg" className="gap-2 px-8">
                  <Plus className="w-5 h-5" />
                  Create Your Career Profile
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {profiles.map((profile) => (
                <Card 
                  key={profile.id} 
                  className="group hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer"
                  onClick={() => handleEditProfile(profile.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-emerald-400/20 flex items-center justify-center">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                    <CardTitle className="mt-3">{profile.full_name}</CardTitle>
                    <CardDescription>
                      {profile.headline || "No headline set"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>Updated {formatDate(profile.updated_at)}</span>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/optimize');
                        }}
                      >
                        <Sparkles className="w-3 h-3 mr-1" />
                        Optimize
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/jobs/${profile.id}`);
                        }}
                      >
                        <Search className="w-3 h-3 mr-1" />
                        Jobs
                      </Button>
                    </div>
                    <ProfileCompleteness profileId={profile.id} variant="card" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Career Insights Section */}
        {profiles.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-emerald-400/20 flex items-center justify-center">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Career Insights</h2>
                <p className="text-sm text-muted-foreground">Your career intelligence at a glance</p>
              </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <InsightCard
                icon={<Target className="w-5 h-5" />}
                label="Profile Strength"
                value="78%"
                subtext="Avg across platforms"
                color="emerald"
                trend="+5% this week"
              />
              <InsightCard
                icon={<Briefcase className="w-5 h-5" />}
                label="Jobs Matched"
                value="24"
                subtext="This week"
                color="blue"
                trend="+8 new"
              />
              <InsightCard
                icon={<TrendingUp className="w-5 h-5" />}
                label="In Progress"
                value={String(applications.filter(a => ["applied", "interviewing"].includes(a.status)).length)}
                subtext="Applications"
                color="amber"
              />
              <InsightCard
                icon={<FileDown className="w-5 h-5" />}
                label="Resume Downloads"
                value="12"
                subtext="All time"
                color="purple"
              />
            </div>

            {/* Profile Views Chart */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-base">Profile Views Over Time</CardTitle>
                <CardDescription>How often your profiles are being viewed</CardDescription>
              </CardHeader>
              <CardContent>
                <div style={{ minHeight: 300, width: '100%' }}>
                  {chartsMounted && (
                    <ResponsiveContainer width="100%" height={300} aspect={16 / 9}>
                      <LineChart data={profileViewsData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="day" 
                          className="text-xs"
                          tick={{ fill: 'hsl(var(--muted-foreground))' }}
                          axisLine={{ stroke: 'hsl(var(--border))' }}
                        />
                        <YAxis 
                          className="text-xs"
                          tick={{ fill: 'hsl(var(--muted-foreground))' }}
                          axisLine={{ stroke: 'hsl(var(--border))' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                          labelStyle={{ color: 'hsl(var(--foreground))' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="views" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={3}
                          dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Skills in Demand */}
            {skillsDemand.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Your Top Skills in Demand</CardTitle>
                      <CardDescription>Based on job listings you've searched</CardDescription>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3 text-emerald-500" /> Trending up</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Stable</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {skillsDemand.map((skill, index) => (
                      <SkillDemandBar key={index} skill={skill} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
      </div>
    </SidebarLayout>
  );
}

function QuickAction({ 
  icon, 
  title, 
  description, 
  onClick, 
  primary,
  disabled
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        group p-6 rounded-2xl text-left transition-all
        ${primary 
          ? 'bg-gradient-to-br from-primary to-emerald-500 text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5' 
          : 'bg-card border border-border hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-0.5'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed hover:translate-y-0 hover:shadow-none' : 'cursor-pointer'}
      `}
    >
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          primary ? 'bg-white/20' : 'bg-primary/10 text-primary'
        }`}>
          {icon}
        </div>
        <ChevronRight className={`w-5 h-5 transition-all ${
          primary 
            ? 'text-white/60 group-hover:text-white group-hover:translate-x-1' 
            : 'text-muted-foreground group-hover:text-primary group-hover:translate-x-1'
        } ${disabled ? 'opacity-0' : ''}`} />
      </div>
      <h3 className="font-semibold mb-1 mt-4">{title}</h3>
      <p className={`text-sm ${primary ? 'text-white/70' : 'text-muted-foreground'}`}>
        {description}
      </p>
    </button>
  );
}

function OnboardingStep({
  completed,
  title,
  description,
  action,
  actionLabel,
  disabled
}: {
  completed: boolean;
  title: string;
  description: string;
  action?: () => void;
  actionLabel?: string;
  disabled?: boolean;
}) {
  return (
    <div className={`flex items-center gap-4 p-3 rounded-xl transition-colors ${
      completed ? 'bg-emerald-500/10' : disabled ? 'opacity-50' : 'bg-muted/50 hover:bg-muted'
    }`}>
      {completed ? (
        <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
      ) : (
        <Circle className="w-6 h-6 text-muted-foreground flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className={`font-medium ${completed ? 'text-emerald-700 line-through' : ''}`}>
          {title}
        </p>
        <p className="text-sm text-muted-foreground truncate">{description}</p>
      </div>
      {action && actionLabel && !completed && (
        <Button 
          size="sm" 
          variant="outline"
          onClick={action}
          disabled={disabled}
          className="flex-shrink-0"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

function InsightCard({
  icon,
  label,
  value,
  subtext,
  color,
  trend
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext: string;
  color: "emerald" | "blue" | "amber" | "purple";
  trend?: string;
}) {
  const colorClasses = {
    emerald: "from-emerald-500/20 to-emerald-400/10 text-emerald-600",
    blue: "from-blue-500/20 to-blue-400/10 text-blue-600",
    amber: "from-amber-500/20 to-amber-400/10 text-amber-600",
    purple: "from-purple-500/20 to-purple-400/10 text-purple-600"
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center`}>
            {icon}
          </div>
          {trend && (
            <span className="text-xs text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Flame className="w-3 h-3" />
              {trend}
            </span>
          )}
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-xs text-muted-foreground/70 mt-0.5">{subtext}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function SkillDemandBar({ skill }: { skill: SkillDemand }) {
  const trendColors = {
    up: "text-emerald-500",
    stable: "text-amber-500",
    down: "text-red-500"
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{skill.name}</span>
          {skill.trend === "up" && <TrendingUp className={`w-3 h-3 ${trendColors[skill.trend]}`} />}
          {skill.trend === "stable" && <span className={`w-2 h-2 rounded-full bg-amber-500`} />}
          {skill.trend === "down" && <TrendingUp className={`w-3 h-3 ${trendColors[skill.trend]} rotate-180`} />}
        </div>
        <span className="text-sm text-muted-foreground">{skill.demand}% match rate</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all ${
            skill.trend === "up" ? "bg-gradient-to-r from-emerald-500 to-emerald-400" :
            skill.trend === "stable" ? "bg-gradient-to-r from-amber-500 to-amber-400" :
            "bg-gradient-to-r from-red-400 to-red-300"
          }`}
          style={{ width: `${skill.demand}%` }}
        />
      </div>
    </div>
  );
}
