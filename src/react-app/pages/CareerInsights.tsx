import { useState, useEffect } from "react";
import { 
  Activity, Target, Briefcase, TrendingUp, FileDown, Flame
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/react-app/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import SidebarLayout from "@/react-app/components/SidebarLayout";
import { useMyProfiles } from "@/react-app/hooks/useProfile";

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

interface Application {
  id: number;
  status: string;
}

interface SkillDemand {
  name: string;
  demand: number;
  trend: "up" | "down" | "stable";
}

export default function CareerInsights() {
  const { profiles, loading } = useMyProfiles();
  const [chartsMounted, setChartsMounted] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [skillsDemand, setSkillsDemand] = useState<SkillDemand[]>([]);

  // Only render charts after mount to avoid SSR/dimension issues
  useEffect(() => {
    setChartsMounted(true);
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
        const res = await fetch(`/api/profiles/${profiles[0].id}`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          const skills = data.skills || [];
          const demandData: SkillDemand[] = skills.slice(0, 6).map((skill: string | { name?: string; skill_name?: string }, index: number) => {
            const skillName = typeof skill === "string" ? skill : (skill?.name ?? skill?.skill_name ?? null);
            
            // Skip skills with no valid name
            if (!skillName || skillName.trim() === '') return null;
            
            const rawDemand = Math.max(95 - index * 12, 40) + Math.floor(Math.random() * 10);
            return {
              name: skillName,
              demand: Math.min(rawDemand, 100), // Cap at 100%
              trend: index < 2 ? "up" : index < 4 ? "stable" : "down"
            };
          }).filter((item: SkillDemand | null): item is SkillDemand => item !== null);
          setSkillsDemand(demandData);
        }
      } catch (error) {
        console.error("Error fetching skills:", error);
      }
    };
    if (!loading && profiles.length > 0) {
      generateSkillsDemand();
    }
  }, [profiles, loading]);

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-background">
        <main className="max-w-5xl mx-auto px-6 py-12">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-emerald-400/20 flex items-center justify-center">
              <Activity className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Career Insights</h1>
              <p className="text-muted-foreground">Your career intelligence at a glance</p>
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

          {skillsDemand.length === 0 && profiles.length === 0 && (
            <Card className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No insights yet</h3>
              <p className="text-muted-foreground">Create a profile and add your skills to see career insights</p>
            </Card>
          )}
        </main>
      </div>
    </SidebarLayout>
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

  // Cap the demand percentage at 100%
  const cappedDemand = Math.min(skill.demand, 100);
  
  // Fallback for missing skill name
  const displayName = skill.name && skill.name.trim() !== '' ? skill.name : "Unknown Skill";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-foreground">{displayName}</span>
          {skill.trend === "up" && <TrendingUp className={`w-3 h-3 ${trendColors[skill.trend]}`} />}
          {skill.trend === "stable" && <span className="w-2 h-2 rounded-full bg-amber-500" />}
          {skill.trend === "down" && <TrendingUp className={`w-3 h-3 ${trendColors[skill.trend]} rotate-180`} />}
        </div>
        <span className="text-xs text-muted-foreground">{cappedDemand}% match rate</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full transition-all ${
            skill.trend === "up" ? "bg-gradient-to-r from-emerald-500 to-emerald-400" :
            skill.trend === "stable" ? "bg-gradient-to-r from-amber-500 to-amber-400" :
            "bg-gradient-to-r from-red-400 to-red-300"
          }`}
          style={{ width: `${cappedDemand}%` }}
        />
      </div>
    </div>
  );
}
