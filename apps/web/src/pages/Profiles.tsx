import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Plus, Loader2, User, 
  Sparkles, Search, FileText, Edit, Trash2, MoreVertical
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMyProfiles } from "@/hooks/useProfile";
import ProfileBuilder from "@/components/ProfileBuilder";
import SidebarLayout from "@/components/SidebarLayout";
import { ProfileCompleteness } from "@/components/ProfileCompleteness";

export default function Profiles() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isPending } = useAuth();
  const { profiles, loading, refresh } = useMyProfiles();
  const [showProfileBuilder, setShowProfileBuilder] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<number | undefined>(undefined);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const redirectMessage = (location.state as { message?: string } | null)?.message;
  const [dismissedMessage, setDismissedMessage] = useState(false);
  const showRedirectBanner = Boolean(redirectMessage) && !dismissedMessage;

  // Handle ?create=true or redirect from optimize (no profile) → open profile builder
  useEffect(() => {
    if (!loading && (searchParams.get("create") === "true" || redirectMessage === "Create a profile first to optimize.")) {
      setShowProfileBuilder(true);
      setEditingProfileId(undefined);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, loading, setSearchParams, redirectMessage]);

  const handleDeleteProfile = async (id: number) => {
    if (!confirm("Are you sure you want to delete this profile?")) return;
    
    setDeletingId(id);
    try {
      const response = await fetch(`/api/profiles/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (response.ok) {
        refresh();
      }
    } catch (error) {
      console.error('Failed to delete profile:', error);
    } finally {
      setDeletingId(null);
    }
  };

  if (isPending || loading) {
    return (
      <SidebarLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </SidebarLayout>
    );
  }

  if (showProfileBuilder) {
    return (
      <SidebarLayout>
        <div className="min-h-screen bg-background py-8 px-6">
          <ProfileBuilder 
            profileId={editingProfileId}
          />
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {showRedirectBanner && (
            <div className="mb-6 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 px-4 py-3 flex items-center justify-between gap-4">
              <p className="text-sm font-medium">{redirectMessage}</p>
              <Button variant="ghost" size="sm" onClick={() => setDismissedMessage(true)} className="text-amber-700 dark:text-amber-300 shrink-0">
                Dismiss
              </Button>
            </div>
          )}
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">My Profiles</h1>
              <p className="text-muted-foreground">
                Manage your career profiles for different job platforms
              </p>
            </div>
            <Button 
              onClick={() => {
                setEditingProfileId(undefined);
                setShowProfileBuilder(true);
              }}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              New Profile
            </Button>
          </div>

          {/* Profiles Grid */}
          {profiles.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-16">
                <div className="text-center max-w-md mx-auto">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-emerald-400/20 flex items-center justify-center mx-auto mb-6">
                    <User className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No profiles yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Create your first profile to start optimizing for job boards and searching for opportunities.
                  </p>
                  <Button 
                    onClick={() => setShowProfileBuilder(true)}
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create Your First Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profiles.map((profile) => (
                <Card key={profile.id} className="group hover:shadow-lg hover:border-primary/30 transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-emerald-400/20 flex items-center justify-center">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setEditingProfileId(profile.id);
                            setShowProfileBuilder(true);
                          }}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Profile
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteProfile(profile.id)}
                            className="text-destructive focus:text-destructive"
                            disabled={deletingId === profile.id}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            {deletingId === profile.id ? 'Deleting...' : 'Delete'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    <h3 className="font-semibold text-lg mb-1 truncate">{profile.full_name}</h3>
                    {profile.headline && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{profile.headline}</p>
                    )}
                    
                    {/* Profile Completeness */}
                    <ProfileCompleteness profileId={profile.id} variant="card" />
                    
                    {/* Quick Actions */}
                    <div className="flex gap-2 pt-4 border-t border-border">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 gap-1.5"
                        onClick={() => navigate('/optimize')}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Optimize
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 gap-1.5"
                        onClick={() => navigate(`/jobs/${profile.id}`)}
                      >
                        <Search className="w-3.5 h-3.5" />
                        Jobs
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 gap-1.5"
                        onClick={() => navigate(`/resume/generate`)}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Resume
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* Add New Profile Card */}
              <Card 
                className="border-dashed hover:border-primary/50 cursor-pointer transition-all group"
                onClick={() => {
                  setEditingProfileId(undefined);
                  setShowProfileBuilder(true);
                }}
              >
                <CardContent className="p-6 flex flex-col items-center justify-center h-full min-h-[200px]">
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3 group-hover:bg-primary/10 transition-colors">
                    <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <p className="font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                    Add Another Profile
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}
