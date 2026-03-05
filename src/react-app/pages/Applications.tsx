import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { useAuth } from "@/react-app/hooks/useAuth";
import { GraduationCap, Linkedin, PartyPopper, Share2 } from "lucide-react";
import confetti from "canvas-confetti";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/react-app/components/ui/button";
import { Card, CardContent } from "@/react-app/components/ui/card";
import { Input } from "@/react-app/components/ui/input";
import { Textarea } from "@/react-app/components/ui/textarea";
import { Switch } from "@/react-app/components/ui/switch";
import { 
  Briefcase, Search, Loader2, ExternalLink, Clock, GripVertical,
  Plus, Building2, Star, Send, Calendar, Award, XCircle, X,
  TrendingUp, Users, Target, Percent, Bell, User, FileText
} from "lucide-react";
import { useMyProfiles } from "@/react-app/hooks/useProfile";
import SidebarLayout from "@/react-app/components/SidebarLayout";

interface Application {
  id: number;
  profile_id: number;
  job_title: string;
  company: string;
  job_url: string | null;
  source: string | null;
  location: string | null;
  salary_range: string | null;
  status: string;
  notes: string | null;
  match_score: number | null;
  priority: string | null;
  interview_date: string | null;
  contact_name: string | null;
  follow_up_reminder: number | null;
  job_description: string | null;
  applied_at: string;
  last_activity_at: string;
  created_at: string;
  updated_at: string;
}

type KanbanStatus = "wishlist" | "applied" | "interviewing" | "offered" | "rejected";

const columns: { key: KanbanStatus; label: string; icon: React.ReactNode; color: string; bgColor: string }[] = [
  { key: "wishlist", label: "Wishlist", icon: <Star className="w-4 h-4" />, color: "text-purple-600", bgColor: "bg-purple-50 border-purple-200" },
  { key: "applied", label: "Applied", icon: <Send className="w-4 h-4" />, color: "text-blue-600", bgColor: "bg-blue-50 border-blue-200" },
  { key: "interviewing", label: "Interview", icon: <Calendar className="w-4 h-4" />, color: "text-amber-600", bgColor: "bg-amber-50 border-amber-200" },
  { key: "offered", label: "Offer", icon: <Award className="w-4 h-4" />, color: "text-green-600", bgColor: "bg-green-50 border-green-200" },
  { key: "rejected", label: "Rejected", icon: <XCircle className="w-4 h-4" />, color: "text-red-600", bgColor: "bg-red-50 border-red-200" },
];

const priorityConfig = {
  hot: { label: "Hot", color: "bg-red-100 text-red-700 border-red-200" },
  warm: { label: "Warm", color: "bg-amber-100 text-amber-700 border-amber-200" },
  cold: { label: "Cold", color: "bg-blue-100 text-blue-700 border-blue-200" },
};

function isFollowUpDue(app: Application): boolean {
  if (app.status !== "applied") return false;
  const lastActivity = new Date(app.last_activity_at || app.created_at);
  const now = new Date();
  const daysSinceActivity = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
  return daysSinceActivity >= 7;
}

// Sortable Application Card
function SortableApplicationCard({ 
  app, 
  onClick,
  formatDate,
  onPrepInterview
}: { 
  app: Application;
  onClick: () => void;
  formatDate: (date: string) => string;
  onPrepInterview?: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: app.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const followUpDue = isFollowUpDue(app);
  const priority = (app.priority || "warm") as keyof typeof priorityConfig;

  return (
    <div ref={setNodeRef} style={style}>
      <Card 
        className={`group hover:border-primary/30 hover:shadow-md transition-all cursor-pointer relative ${isDragging ? 'shadow-lg ring-2 ring-primary' : ''}`}
        onClick={onClick}
      >
        <CardContent className="p-3">
          {/* Follow-up indicator */}
          {followUpDue && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-pulse" title="Follow-up due" />
          )}
          
          {/* Drag handle & Priority */}
          <div className="flex items-center justify-between mb-2">
            <div 
              {...attributes} 
              {...listeners}
              className="p-1 -ml-1 cursor-grab active:cursor-grabbing hover:bg-muted rounded"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="w-4 h-4 text-muted-foreground" />
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${priorityConfig[priority].color}`}>
              {priorityConfig[priority].label}
            </span>
          </div>

          {/* Job Title */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="font-medium text-sm leading-tight line-clamp-2">{app.job_title}</h4>
            {app.job_url && (
              <a
                href={app.job_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 p-1 hover:bg-muted rounded transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
              </a>
            )}
          </div>

          {/* Company */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
            <Building2 className="w-3 h-3" />
            <span className="truncate">{app.company}</span>
          </div>

          {/* Match Score & Date */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{formatDate(app.applied_at || app.created_at)}</span>
            </div>
            {app.match_score && (
              <div className={`flex items-center gap-1 font-medium ${
                app.match_score >= 85 ? 'text-green-600' :
                app.match_score >= 70 ? 'text-amber-600' : 'text-gray-500'
              }`}>
                <Target className="w-3 h-3" />
                <span>{app.match_score}%</span>
              </div>
            )}
          </div>

          {/* Source tag */}
          {app.source && (
            <div className="mt-2 pt-2 border-t border-border">
              <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                {app.source}
              </span>
            </div>
          )}

          {/* Prep for Interview button - show for applied, interviewing, offered */}
          {onPrepInterview && ['applied', 'interviewing', 'offered'].includes(app.status) && (
            <Button
              size="sm"
              variant="outline"
              className="w-full mt-2 h-7 text-xs gap-1.5"
              onClick={(e) => {
                e.stopPropagation();
                onPrepInterview();
              }}
            >
              <GraduationCap className="w-3 h-3" />
              Prep for Interview
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Static card for drag overlay
function ApplicationCardOverlay({ app, formatDate }: { app: Application; formatDate: (date: string) => string }) {
  const priority = (app.priority || "warm") as keyof typeof priorityConfig;
  
  return (
    <Card className="shadow-2xl ring-2 ring-primary w-72">
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <GripVertical className="w-4 h-4 text-muted-foreground" />
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${priorityConfig[priority].color}`}>
            {priorityConfig[priority].label}
          </span>
        </div>
        <h4 className="font-medium text-sm leading-tight line-clamp-2 mb-1">{app.job_title}</h4>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
          <Building2 className="w-3 h-3" />
          <span className="truncate">{app.company}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>{formatDate(app.applied_at || app.created_at)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// Detail Drawer Component
function DetailDrawer({ 
  app, 
  isOpen, 
  onClose, 
  onUpdate,
  onPrepareInterview,
}: { 
  app: Application | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: number, updates: Partial<Application>) => void;
  onPrepareInterview: (appId: number) => void;
}) {
  const [notes, setNotes] = useState("");
  const [contactName, setContactName] = useState("");
  const [interviewDate, setInterviewDate] = useState("");
  const [followUpReminder, setFollowUpReminder] = useState(false);
  const [priority, setPriority] = useState<"hot" | "warm" | "cold">("warm");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (app) {
      setNotes(app.notes || "");
      setContactName(app.contact_name || "");
      setInterviewDate(app.interview_date ? app.interview_date.split("T")[0] : "");
      setFollowUpReminder(!!app.follow_up_reminder);
      setPriority((app.priority as "hot" | "warm" | "cold") || "warm");
    }
  }, [app]);

  const handleSave = async () => {
    if (!app) return;
    setSaving(true);
    await onUpdate(app.id, {
      notes,
      contact_name: contactName,
      interview_date: interviewDate || null,
      follow_up_reminder: followUpReminder ? 1 : 0,
      priority,
    });
    setSaving(false);
  };

  if (!isOpen || !app) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-card border-l border-border shadow-xl z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Application Details</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Job Info */}
          <div>
            <h3 className="text-xl font-bold">{app.job_title}</h3>
            <div className="flex items-center gap-2 text-muted-foreground mt-1">
              <Building2 className="w-4 h-4" />
              <span>{app.company}</span>
            </div>
            {app.location && (
              <p className="text-sm text-muted-foreground mt-1">{app.location}</p>
            )}
            {app.salary_range && (
              <p className="text-sm font-medium text-primary mt-1">{app.salary_range}</p>
            )}
            {app.job_url && (
              <a
                href={app.job_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View Job Posting
              </a>
            )}
          </div>

          {/* Match Score */}
          {app.match_score && (
            <div className={`p-4 rounded-lg border ${
              app.match_score >= 85 ? 'bg-green-50 border-green-200' :
              app.match_score >= 70 ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Match Score</span>
                <span className={`text-2xl font-bold ${
                  app.match_score >= 85 ? 'text-green-600' :
                  app.match_score >= 70 ? 'text-amber-600' : 'text-gray-600'
                }`}>
                  {app.match_score}%
                </span>
              </div>
            </div>
          )}

          {/* Job Description */}
          {app.job_description && (
            <div>
              <label className="text-sm font-medium flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4" />
                Job Description
              </label>
              <div className="p-3 bg-muted/50 rounded-lg text-sm max-h-40 overflow-y-auto">
                {app.job_description}
              </div>
            </div>
          )}

          {/* Priority */}
          <div>
            <label className="text-sm font-medium mb-2 block">Priority</label>
            <div className="flex gap-2">
              {(["hot", "warm", "cold"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                    priority === p 
                      ? priorityConfig[p].color + " ring-2 ring-offset-1 ring-current"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {priorityConfig[p].label}
                </button>
              ))}
            </div>
          </div>

          {/* Interview Date */}
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4" />
              Interview Date
            </label>
            <Input
              type="date"
              value={interviewDate}
              onChange={(e) => setInterviewDate(e.target.value)}
            />
          </div>

          {/* Prepare for Interview Button */}
          {interviewDate && (
            <Button
              variant="outline"
              className="w-full gap-2 bg-gradient-to-r from-primary/5 to-emerald-400/5 border-primary/30 hover:border-primary/50"
              onClick={() => app && onPrepareInterview(app.id)}
            >
              <GraduationCap className="w-4 h-4 text-primary" />
              Prepare for Interview
            </Button>
          )}

          {/* Contact Name */}
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-2">
              <User className="w-4 h-4" />
              Contact Name
            </label>
            <Input
              placeholder="Recruiter or hiring manager name"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
            />
          </div>

          {/* Follow-up Reminder */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Follow-up Reminder</p>
                <p className="text-xs text-muted-foreground">Get notified to follow up</p>
              </div>
            </div>
            <Switch
              checked={followUpReminder}
              onCheckedChange={setFollowUpReminder}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium mb-2 block">Notes</label>
            <Textarea
              placeholder="Add notes about this application..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>

          {/* Timeline */}
          <div className="pt-4 border-t border-border">
            <h4 className="text-sm font-medium mb-3">Timeline</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Applied: {new Date(app.applied_at || app.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Last activity: {new Date(app.last_activity_at || app.updated_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <Button onClick={handleSave} className="w-full" disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Save Changes
          </Button>
        </div>
      </div>
    </>
  );
}

export default function Applications() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isPending: authPending } = useAuth();
  const redirectError = (location.state as { error?: string } | null)?.error;
  const [dismissedRedirectError, setDismissedRedirectError] = useState(false);
  const showRedirectError = Boolean(redirectError) && !dismissedRedirectError;
  const { profiles, loading: profilesLoading } = useMyProfiles();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingToColumn, setAddingToColumn] = useState<KanbanStatus | null>(null);
  const [newJobTitle, setNewJobTitle] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [activeId, setActiveId] = useState<number | null>(null);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [celebrationApp, setCelebrationApp] = useState<Application | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  useEffect(() => {
    const fetchAllApplications = async () => {
      if (profiles.length === 0) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const allApps: Application[] = [];
        for (const profile of profiles) {
          const response = await fetch(`/api/applications/${profile.id}`, {
            credentials: "include",
          });
          if (response.ok) {
            const data = await response.json();
            allApps.push(...(data.applications || []));
          }
        }
        allApps.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setApplications(allApps);
      } catch (error) {
        console.error("Error fetching applications:", error);
      } finally {
        setLoading(false);
      }
    };

    if (!profilesLoading && profiles.length > 0) {
      fetchAllApplications();
    } else if (!profilesLoading) {
      setLoading(false);
    }
  }, [profiles, profilesLoading]);

  const getColumnApps = (status: KanbanStatus) => 
    applications.filter(app => app.status === status);

  const triggerCelebration = (app: Application) => {
    // Fire confetti
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = window.setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);

    // Show celebration modal
    setCelebrationApp(app);
    setShowCelebration(true);
  };

  const updateApplicationStatus = async (appId: number, newStatus: KanbanStatus) => {
    const previousStatus = applications.find(app => app.id === appId)?.status;
    
    try {
      const response = await fetch(`/api/applications/${appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        const updatedApp = applications.find(app => app.id === appId);
        setApplications(apps => 
          apps.map(app => app.id === appId ? { ...app, status: newStatus, last_activity_at: new Date().toISOString() } : app)
        );
        
        // Trigger celebration when moving to "offered"
        if (newStatus === "offered" && previousStatus !== "offered" && updatedApp) {
          triggerCelebration({ ...updatedApp, status: newStatus });
        }
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const updateApplication = async (appId: number, updates: Partial<Application>) => {
    try {
      const response = await fetch(`/api/applications/${appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          notes: updates.notes,
          contactName: updates.contact_name,
          interviewDate: updates.interview_date,
          followUpReminder: updates.follow_up_reminder,
          priority: updates.priority,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setApplications(apps => 
          apps.map(app => app.id === appId ? { ...app, ...data.application } : app)
        );
        if (selectedApp?.id === appId) {
          setSelectedApp({ ...selectedApp, ...data.application });
        }
      }
    } catch (error) {
      console.error("Error updating application:", error);
    }
  };

  const handleAddApplication = async (status: KanbanStatus) => {
    if (!newJobTitle.trim() || !newCompany.trim()) return;
    
    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          profile_id: "me",
          job_title: newJobTitle.trim(),
          company: newCompany.trim(),
          status,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setApplications(apps => [data.application, ...apps]);
        setNewJobTitle("");
        setNewCompany("");
        setAddingToColumn(null);
        localStorage.setItem('ascend_has_tracked', 'true');
      }
    } catch (error) {
      console.error("Error adding application:", error);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeApp = applications.find(app => app.id === active.id);
    if (!activeApp) return;

    // Check if dropped on a column
    const targetColumn = columns.find(col => col.key === over.id);
    if (targetColumn && activeApp.status !== targetColumn.key) {
      updateApplicationStatus(activeApp.id, targetColumn.key);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const openDrawer = (app: Application) => {
    setSelectedApp(app);
    setDrawerOpen(true);
  };

  const activeApp = activeId ? applications.find(app => app.id === activeId) : null;

  // Stats calculation
  const totalApplied = applications.filter(a => a.status !== "wishlist").length;
  const inProgress = applications.filter(a => ["applied", "interviewing"].includes(a.status)).length;
  const interviewsScheduled = applications.filter(a => a.status === "interviewing").length;
  const totalFinished = applications.filter(a => ["offered", "rejected"].includes(a.status)).length;
  const offers = applications.filter(a => a.status === "offered").length;
  const offerRate = totalFinished > 0 ? Math.round((offers / totalFinished) * 100) : 0;

  if (authPending || profilesLoading) {
    return (
      <SidebarLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-border bg-card">
          <div className="max-w-[1600px] mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-emerald-400/20 flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Application Tracker</h1>
                  <p className="text-muted-foreground text-sm">
                    Drag cards between columns to update status
                  </p>
                </div>
              </div>
              {profiles.length > 0 && (
                <Button 
                  onClick={() => navigate(`/jobs/${profiles[0].id}`)}
                  className="gap-2"
                >
                  <Search className="w-4 h-4" />
                  Find Jobs
                </Button>
              )}
            </div>
          </div>
        </div>

        {showRedirectError && (
          <div className="mx-auto max-w-[1600px] px-6 py-3">
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 px-4 py-3 flex items-center justify-between gap-4">
              <p className="text-sm font-medium">{redirectError}</p>
              <Button variant="ghost" size="sm" onClick={() => { setDismissedRedirectError(true); navigate(location.pathname, { replace: true, state: {} }); }} className="shrink-0 text-amber-700 dark:text-amber-300">
                Dismiss
              </Button>
            </div>
          </div>
        )}

        {/* Stats Bar */}
        <div className="border-b border-border bg-muted/30">
          <div className="max-w-[1600px] mx-auto px-6 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Send className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalApplied}</p>
                  <p className="text-xs text-muted-foreground">Total Applied</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{inProgress}</p>
                  <p className="text-xs text-muted-foreground">In Progress</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{interviewsScheduled}</p>
                  <p className="text-xs text-muted-foreground">Interviews</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Percent className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{offerRate}%</p>
                  <p className="text-xs text-muted-foreground">Offer Rate</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="max-w-[1600px] mx-auto px-6 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="flex gap-4 overflow-x-auto pb-4">
                {columns.map((column) => {
                  const columnApps = getColumnApps(column.key);
                  return (
                    <div 
                      key={column.key}
                      className="flex-shrink-0 w-72 bg-muted/30 rounded-xl border border-border"
                    >
                      {/* Column Header */}
                      <div className="p-4 border-b border-border">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={column.color}>{column.icon}</span>
                            <h3 className="font-semibold">{column.label}</h3>
                            <span className={`
                              px-2 py-0.5 rounded-full text-xs font-medium
                              ${column.bgColor}
                            `}>
                              {columnApps.length}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => setAddingToColumn(addingToColumn === column.key ? null : column.key)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Add Form */}
                        {addingToColumn === column.key && (
                          <div className="mt-3 space-y-2">
                            <Input
                              placeholder="Job title"
                              value={newJobTitle}
                              onChange={(e) => setNewJobTitle(e.target.value)}
                              className="h-8 text-sm"
                            />
                            <Input
                              placeholder="Company"
                              value={newCompany}
                              onChange={(e) => setNewCompany(e.target.value)}
                              className="h-8 text-sm"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="flex-1 h-7 text-xs"
                                onClick={() => handleAddApplication(column.key)}
                                disabled={!newJobTitle.trim() || !newCompany.trim()}
                              >
                                Add
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => {
                                  setAddingToColumn(null);
                                  setNewJobTitle("");
                                  setNewCompany("");
                                }}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Column Content - Droppable */}
                      <SortableContext
                        id={column.key}
                        items={columnApps.map(app => app.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div 
                          className="p-3 space-y-2 min-h-[400px] max-h-[calc(100vh-380px)] overflow-y-auto"
                          data-column={column.key}
                        >
                          {columnApps.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                              <div className={`w-12 h-12 rounded-xl ${column.bgColor} flex items-center justify-center mb-3`}>
                                <span className={column.color}>{column.icon}</span>
                              </div>
                              <p className="text-sm font-medium text-muted-foreground mb-1">
                                No {column.label.toLowerCase()} jobs
                              </p>
                              <p className="text-xs text-muted-foreground/70 mb-3">
                                {column.key === "wishlist" && "Save jobs you're interested in"}
                                {column.key === "applied" && "Track jobs you've applied to"}
                                {column.key === "interviewing" && "Jobs with scheduled interviews"}
                                {column.key === "offered" && "Celebrate your offers here!"}
                                {column.key === "rejected" && "Learn from each experience"}
                              </p>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs h-7"
                                onClick={() => setAddingToColumn(column.key)}
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                Add Job
                              </Button>
                            </div>
                          ) : (
                            columnApps.map((app) => (
                              <SortableApplicationCard
                                key={app.id}
                                app={app}
                                onClick={() => openDrawer(app)}
                                formatDate={formatDate}
                                onPrepInterview={() => navigate(`/interview-prep/${app.id}`)}
                              />
                            ))
                          )}
                        </div>
                      </SortableContext>
                    </div>
                  );
                })}
              </div>

              {/* Drag Overlay */}
              <DragOverlay>
                {activeApp && (
                  <ApplicationCardOverlay app={activeApp} formatDate={formatDate} />
                )}
              </DragOverlay>
            </DndContext>
          )}
        </div>

        {/* Detail Drawer */}
        <DetailDrawer
          app={selectedApp}
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onUpdate={updateApplication}
          onPrepareInterview={(appId) => navigate(`/interview-prep/${appId}`)}
        />

        {/* Celebration Modal */}
        {showCelebration && celebrationApp && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300">
              {/* Celebration Header */}
              <div className="bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 p-8 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_50%)]" />
                <div className="relative">
                  <div className="w-20 h-20 mx-auto mb-4 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
                    <PartyPopper className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">Congratulations! 🎉</h2>
                  <p className="text-white/90 text-lg">You got an offer!</p>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="text-center mb-6">
                  <p className="text-xl font-semibold text-foreground">{celebrationApp.job_title}</p>
                  <p className="text-muted-foreground">at {celebrationApp.company}</p>
                </div>

                <div className="bg-muted/30 rounded-xl p-4 mb-6">
                  <p className="text-sm text-muted-foreground text-center">
                    Share your achievement with your network and inspire others on their job search journey!
                  </p>
                </div>

                {/* Share Options */}
                <div className="space-y-3">
                  <Button
                    className="w-full bg-[#0A66C2] hover:bg-[#004182] text-white h-12"
                    onClick={() => {
                      const text = `🎉 Exciting news! I just received an offer for ${celebrationApp.job_title} at ${celebrationApp.company}! Grateful for this opportunity. #NewJob #CareerMilestone`;
                      const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin)}&summary=${encodeURIComponent(text)}`;
                      window.open(url, '_blank', 'width=600,height=500');
                    }}
                  >
                    <Linkedin className="w-5 h-5 mr-2" />
                    Share on LinkedIn
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full h-12"
                    onClick={() => {
                      const text = `🎉 Exciting news! I just received an offer for ${celebrationApp.job_title} at ${celebrationApp.company}! Grateful for this opportunity.`;
                      navigator.clipboard.writeText(text);
                    }}
                  >
                    <Share2 className="w-5 h-5 mr-2" />
                    Copy to Share
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  className="w-full mt-4 text-muted-foreground"
                  onClick={() => {
                    setShowCelebration(false);
                    setCelebrationApp(null);
                  }}
                >
                  Maybe Later
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}