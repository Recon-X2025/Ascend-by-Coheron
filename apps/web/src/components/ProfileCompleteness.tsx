import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { AlertTriangle, CheckCircle2, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { calculateCompleteness, type ProfileData } from "@/components/profileCompletenessUtils";

interface ProfileCompletenessProps {
  profileId: number;
  variant?: "card" | "full";
  onNavigateToField?: (field: string) => void;
}

export function ProfileCompleteness({ 
  profileId, 
  variant = "card",
  onNavigateToField 
}: ProfileCompletenessProps) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/profiles/${profileId}`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [profileId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) return null;

  const { score, items } = calculateCompleteness(profile);
  const incompleteItems = items.filter(item => !item.completed);
  const prioritizedItems = incompleteItems.sort((a, b) => b.weight - a.weight);

  const handleItemClick = (field: string) => {
    if (onNavigateToField) {
      onNavigateToField(field);
    } else {
      // Navigate to profile editor with field parameter
      navigate(`/profiles?edit=${profileId}&step=${field}`);
    }
  };

  // Determine badge
  let badge: { text: string; color: string; bgColor: string } | null = null;
  if (score >= 80) {
    badge = { text: "Strong", color: "text-emerald-700", bgColor: "bg-emerald-100" };
  } else if (score < 60) {
    badge = { text: "Needs Work", color: "text-amber-700", bgColor: "bg-amber-100" };
  }

  // Card variant - compact display for dashboard cards
  if (variant === "card") {
    return (
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center gap-3">
          {/* Circular Progress */}
          <div className="relative w-14 h-14 flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="28"
                cy="28"
                r="24"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                className="text-muted"
              />
              <circle
                cx="28"
                cy="28"
                r="24"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${score * 1.508} 151`}
                className={
                  score >= 80 ? "text-emerald-500" : 
                  score >= 60 ? "text-primary" : "text-amber-500"
                }
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold">{score}%</span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium">Profile Completeness</span>
              {badge && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${badge.bgColor} ${badge.color}`}>
                  {score < 60 && <AlertTriangle className="w-3 h-3 inline mr-1" />}
                  {score >= 80 && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                  {badge.text}
                </span>
              )}
            </div>
            {prioritizedItems.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleItemClick(prioritizedItems[0].field);
                }}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                {prioritizedItems[0].icon}
                {prioritizedItems[0].label}
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Full variant - expanded display for profile view page
  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-start gap-6">
        {/* Large Circular Progress */}
        <div className="relative w-28 h-28 flex-shrink-0">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="56"
              cy="56"
              r="48"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted"
            />
            <circle
              cx="56"
              cy="56"
              r="48"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${score * 3.016} 302`}
              className={
                score >= 80 ? "text-emerald-500" : 
                score >= 60 ? "text-primary" : "text-amber-500"
              }
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold">{score}%</span>
            <span className="text-xs text-muted-foreground">Complete</span>
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-lg font-semibold">Profile Completeness</h3>
            {badge && (
              <span className={`text-sm px-3 py-1 rounded-full ${badge.bgColor} ${badge.color} flex items-center gap-1`}>
                {score < 60 && <AlertTriangle className="w-4 h-4" />}
                {score >= 80 && <CheckCircle2 className="w-4 h-4" />}
                {badge.text}
              </span>
            )}
          </div>

          {prioritizedItems.length > 0 ? (
            <div>
              <p className="text-sm text-muted-foreground mb-3">
                Improve your profile to increase your chances of getting noticed:
              </p>
              <div className="space-y-2">
                {prioritizedItems.slice(0, 4).map((item) => (
                  <Button
                    key={item.key}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleItemClick(item.field)}
                    className="w-full justify-start h-auto py-2 px-3 hover:bg-primary/5 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center mr-3 group-hover:bg-primary group-hover:text-white transition-colors">
                      {item.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <span className="font-medium">{item.label}</span>
                      <span className="text-xs text-muted-foreground ml-2">+{item.weight}%</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">Your profile is complete! Great job!</span>
            </div>
          )}
        </div>
      </div>

      {/* All items checklist (collapsed by default in full variant) */}
      <details className="mt-6 pt-4 border-t border-border">
        <summary className="text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground">
          View all checklist items ({items.filter(i => i.completed).length}/{items.length} complete)
        </summary>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {items.map((item) => (
            <div 
              key={item.key}
              className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
                item.completed ? "text-muted-foreground" : "text-foreground"
              }`}
            >
              {item.completed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
              )}
              <span className={item.completed ? "line-through" : ""}>
                {item.label.replace("Add ", "").replace("Write ", "").replace("Define ", "")}
              </span>
              <span className="text-xs text-muted-foreground ml-auto">{item.weight}%</span>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
