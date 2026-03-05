import { useState, useEffect } from "react";
import { Link } from "react-router";
import { formatDate } from "@/react-app/lib/dateUtils";
import { 
  Briefcase, 
  Calendar, 
  MapPin, 
  ExternalLink, 
  MoreVertical,
  Plus,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  ChevronLeft,
  Trash2,
  ClipboardList
} from "lucide-react";
import { Button } from "@/react-app/components/ui/button";
import { Application, ApplicationStats } from "@/shared/types";
import SidebarLayout from "@/react-app/components/SidebarLayout";

const STATUS_CONFIG = {
  applied: { label: "Applied", color: "bg-blue-500", textColor: "text-blue-700", bgLight: "bg-blue-50" },
  interviewing: { label: "Interviewing", color: "bg-amber-500", textColor: "text-amber-700", bgLight: "bg-amber-50" },
  offered: { label: "Offered", color: "bg-emerald-500", textColor: "text-emerald-700", bgLight: "bg-emerald-50" },
  rejected: { label: "Rejected", color: "bg-red-500", textColor: "text-red-700", bgLight: "bg-red-50" },
  accepted: { label: "Accepted", color: "bg-green-600", textColor: "text-green-700", bgLight: "bg-green-50" },
};

const STATUSES = ["applied", "interviewing", "offered", "rejected", "accepted"] as const;

export default function ApplicationTracker() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState<ApplicationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingNotes, setEditingNotes] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchApplications();
    fetchStats();
  }, []);

  const fetchApplications = async () => {
    try {
      const res = await fetch(`/api/applications/me`);
      if (!res.ok || !res.headers.get("Content-Type")?.includes("application/json")) {
        console.error("Error fetching applications: invalid response");
        return;
      }
      const data = await res.json();
      setApplications(data.applications || []);
    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/applications/me/stats`);
      if (!res.ok || !res.headers.get("Content-Type")?.includes("application/json")) {
        console.error("Error fetching stats: invalid response");
        return;
      }
      const data = await res.json();
      setStats(data.stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const updateStatus = async (appId: number, status: string) => {
    try {
      await fetch(`/api/applications/${appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      fetchApplications();
      fetchStats();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const updateNotes = async (appId: number, notes: string) => {
    try {
      await fetch(`/api/applications/${appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      setEditingNotes(null);
      fetchApplications();
    } catch (error) {
      console.error("Error updating notes:", error);
    }
  };

  const deleteApplication = async (appId: number) => {
    if (!confirm("Are you sure you want to delete this application?")) return;
    try {
      await fetch(`/api/applications/${appId}`, { method: "DELETE" });
      fetchApplications();
      fetchStats();
    } catch (error) {
      console.error("Error deleting application:", error);
    }
  };

  const filteredApplications = filter === "all" 
    ? applications 
    : applications.filter(app => app.status === filter);


  if (loading) {
    return (
      <SidebarLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/jobs">
              <Button variant="ghost" size="sm" className="gap-2">
                <ChevronLeft className="w-4 h-4" />
                Back to Jobs
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Application Tracker</h1>
              <p className="text-slate-600 mt-1">Track your job applications and their progress</p>
            </div>
          </div>
          <Button onClick={() => setShowAddModal(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4" />
            Add Application
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
            <StatCard label="Total" value={stats.total} icon={Briefcase} color="bg-slate-600" />
            <StatCard label="Applied" value={stats.applied} icon={Clock} color="bg-blue-500" />
            <StatCard label="Interviewing" value={stats.interviewing} icon={MessageSquare} color="bg-amber-500" />
            <StatCard label="Offered" value={stats.offered} icon={TrendingUp} color="bg-emerald-500" />
            <StatCard label="Accepted" value={stats.accepted} icon={CheckCircle} color="bg-green-600" />
            <StatCard label="Rejected" value={stats.rejected} icon={XCircle} color="bg-red-500" />
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <FilterTab label="All" active={filter === "all"} onClick={() => setFilter("all")} />
          {STATUSES.map(status => (
            <FilterTab 
              key={status}
              label={STATUS_CONFIG[status].label} 
              active={filter === status} 
              onClick={() => setFilter(status)} 
            />
          ))}
        </div>

        {/* Applications List */}
        {filteredApplications.length === 0 ? (
          <div className="bg-gradient-to-br from-white to-emerald-50/50 rounded-2xl shadow-sm border-2 border-dashed border-emerald-200 p-16 text-center">
            <div className="relative w-28 h-28 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl transform rotate-6" />
              <div className="absolute inset-0 bg-white rounded-2xl shadow-sm flex items-center justify-center">
                <ClipboardList className="w-14 h-14 text-emerald-600" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-3">Your job search command center awaits</h3>
            <p className="text-slate-600 mb-8 max-w-md mx-auto leading-relaxed">
              Track every application, monitor your progress, and never lose sight of an opportunity. 
              Stay organized and land more interviews.
            </p>
            <Button onClick={() => setShowAddModal(true)} size="lg" className="gap-2 bg-emerald-600 hover:bg-emerald-700 px-8">
              <Plus className="w-5 h-5" />
              Track Your First Application
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map(app => (
              <ApplicationCard
                key={app.id}
                application={app}
                onStatusChange={(status) => updateStatus(app.id, status)}
                onDelete={() => deleteApplication(app.id)}
                onNotesUpdate={(notes) => updateNotes(app.id, notes)}
                isEditingNotes={editingNotes === app.id}
                setEditingNotes={setEditingNotes}
                formatDate={formatDate}
              />
            ))}
          </div>
        )}

        {/* Add Application Modal */}
        {showAddModal && (
          <AddApplicationModal 
            profileId="me" 
            onClose={() => setShowAddModal(false)} 
            onSuccess={() => {
              setShowAddModal(false);
              fetchApplications();
              fetchStats();
            }}
          />
        )}
        </div>
      </div>
    </SidebarLayout>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ComponentType<{ className?: string }>; color: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          <p className="text-sm text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

function FilterTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
        active 
          ? "bg-emerald-600 text-white" 
          : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
      }`}
    >
      {label}
    </button>
  );
}

function ApplicationCard({ 
  application, 
  onStatusChange, 
  onDelete,
  onNotesUpdate,
  isEditingNotes,
  setEditingNotes,
  formatDate 
}: { 
  application: Application;
  onStatusChange: (status: string) => void;
  onDelete: () => void;
  onNotesUpdate: (notes: string) => void;
  isEditingNotes: boolean;
  setEditingNotes: (id: number | null) => void;
  formatDate: (date: string) => string;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [notes, setNotes] = useState(application.notes || "");
  const config = STATUS_CONFIG[application.status];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-slate-900">{application.job_title}</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.bgLight} ${config.textColor}`}>
              {config.label}
            </span>
          </div>
          <p className="text-slate-700 font-medium mb-2">{application.company}</p>
          <div className="flex flex-wrap gap-4 text-sm text-slate-500">
            {application.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {application.location}
              </span>
            )}
            {application.source && (
              <span className="flex items-center gap-1">
                <Briefcase className="w-4 h-4" />
                {application.source}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Applied {formatDate(application.applied_at)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {application.job_url && (
            <a href={application.job_url} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm">
                <ExternalLink className="w-4 h-4" />
              </Button>
            </a>
          )}
          <div className="relative">
            <Button variant="ghost" size="sm" onClick={() => setShowMenu(!showMenu)}>
              <MoreVertical className="w-4 h-4" />
            </Button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20">
                  <p className="px-3 py-2 text-xs font-medium text-slate-500 uppercase">Update Status</p>
                  {STATUSES.map(status => (
                    <button
                      key={status}
                      onClick={() => { onStatusChange(status); setShowMenu(false); }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center gap-2 ${
                        application.status === status ? "bg-slate-50 font-medium" : ""
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${STATUS_CONFIG[status].color}`} />
                      {STATUS_CONFIG[status].label}
                    </button>
                  ))}
                  <hr className="my-1" />
                  <button
                    onClick={() => { setEditingNotes(application.id); setShowMenu(false); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    {application.notes ? "Edit Notes" : "Add Notes"}
                  </button>
                  <button
                    onClick={() => { onDelete(); setShowMenu(false); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Notes Section */}
      {(application.notes || isEditingNotes) && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          {isEditingNotes ? (
            <div className="space-y-2">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
                rows={3}
                placeholder="Add notes about this application..."
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => onNotesUpdate(notes)} className="bg-emerald-600 hover:bg-emerald-700">
                  Save Notes
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingNotes(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">{application.notes}</p>
          )}
        </div>
      )}
    </div>
  );
}

function AddApplicationModal({ profileId, onClose, onSuccess }: { profileId: number | "me"; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    jobTitle: "",
    company: "",
    jobUrl: "",
    source: "",
    location: "",
    salaryRange: "",
    notes: ""
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.jobTitle || !form.company) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: profileId === "me" ? "me" : profileId,
          jobTitle: form.jobTitle,
          company: form.company,
          jobUrl: form.jobUrl || null,
          source: form.source || null,
          location: form.location || null,
          salaryRange: form.salaryRange || null,
          notes: form.notes || null
        })
      });

      if (res.ok) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error adding application:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Add New Application</h2>
          <p className="text-slate-500 text-sm mt-1">Track a job you've applied to</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Job Title *</label>
            <input
              type="text"
              value={form.jobTitle}
              onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
              className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g. Senior Software Engineer"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Company *</label>
            <input
              type="text"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g. Google"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g. New York, NY"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Source</label>
              <select
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select source</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Indeed">Indeed</option>
                <option value="Naukri">Naukri</option>
                <option value="Foundit">Foundit</option>
                <option value="Glassdoor">Glassdoor</option>
                <option value="Company Website">Company Website</option>
                <option value="Referral">Referral</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Job URL</label>
            <input
              type="url"
              value={form.jobUrl}
              onChange={(e) => setForm({ ...form, jobUrl: e.target.value })}
              className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Salary Range</label>
            <input
              type="text"
              value={form.salaryRange}
              onChange={(e) => setForm({ ...form, salaryRange: e.target.value })}
              className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g. $120k - $150k"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              rows={3}
              placeholder="Any notes about this application..."
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
              {submitting ? "Adding..." : "Add Application"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}