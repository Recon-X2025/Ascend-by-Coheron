import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { toPng } from "html-to-image";
import { Button } from "@/react-app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/react-app/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/react-app/components/ui/tabs";
import { Badge } from "@/react-app/components/ui/badge";
import { Checkbox } from "@/react-app/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/react-app/components/ui/select";
import { 
  Sparkles, Loader2, Copy, Check, Linkedin, 
  Briefcase, Search, Building2, Star, ChevronRight,
  Eye, Share2, Download, X, Camera, MapPin, Users, Mail
} from "lucide-react";
import SidebarLayout from "@/react-app/components/SidebarLayout";
import { useMyProfiles } from "@/react-app/hooks/useProfile";

interface OptimizedProfile {
  headline: string;
  summary: string;
  skills?: string[];
  keySkills?: string[];
  experience?: { title: string; company: string; description: string }[];
  workHighlights?: string[];
  careerHighlights?: string[];
  resumeHeadline?: string;
  careerObjective?: string;
  strengthScore?: number;
}

interface OptimizedProfiles {
  linkedin?: OptimizedProfile;
  naukri?: OptimizedProfile;
  indeed?: OptimizedProfile;
  foundit?: OptimizedProfile;
  glassdoor?: OptimizedProfile;
}

const PLATFORMS = [
  { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "bg-blue-600", description: "Professional networking" },
  { id: "naukri", name: "Naukri", icon: Briefcase, color: "bg-blue-500", description: "India's #1 job site" },
  { id: "indeed", name: "Indeed", icon: Search, color: "bg-indigo-600", description: "Global job search" },
  { id: "foundit", name: "Foundit", icon: Building2, color: "bg-purple-600", description: "Monster India" },
  { id: "glassdoor", name: "Glassdoor", icon: Star, color: "bg-green-600", description: "Reviews & jobs" },
];

const PLATFORM_IDS = PLATFORMS.map((p) => p.id);

/** Unwrap nested response (e.g. { platforms: { linkedin: ... } } or { data: { linkedin: ... } }) to get platform-keyed object. */
function unwrapPlatformData(data: unknown): Record<string, unknown> {
  if (!data || typeof data !== "object") return {};
  const raw = data as Record<string, unknown>;
  const keys = Object.keys(raw);
  const platformIds = ["linkedin", "naukri", "indeed", "foundit", "glassdoor"];
  const hasPlatformKey = keys.some((k) => platformIds.includes(k.toLowerCase()));
  if (hasPlatformKey) return raw;
  if (keys.length > 0) {
    const first = raw[keys[0]];
    if (first && typeof first === "object" && !Array.isArray(first)) return first as Record<string, unknown>;
  }
  return raw;
}

/** Normalize API response: lowercase platform keys and safe defaults so UI always has data. Accepts strengthScore or strength_score. */
function normalizeOptimizedProfiles(data: unknown): OptimizedProfiles {
  const raw = unwrapPlatformData(data);
  const out: OptimizedProfiles = {};
  for (const id of PLATFORM_IDS) {
    const key = Object.keys(raw).find((k) => k.toLowerCase() === id);
    if (!key) continue;
    const v = raw[key] as Record<string, unknown> | undefined;
    if (!v || typeof v !== "object") continue;
    const strength = typeof v.strengthScore === "number" ? v.strengthScore : typeof (v as Record<string, unknown>).strength_score === "number" ? (v as Record<string, unknown>).strength_score as number : 0;
    out[id as keyof OptimizedProfiles] = {
      headline: typeof v.headline === "string" ? v.headline : "",
      summary: typeof v.summary === "string" ? v.summary : "",
      strengthScore: strength,
      skills: Array.isArray(v.skills) ? v.skills : undefined,
      keySkills: Array.isArray(v.keySkills) ? v.keySkills : undefined,
      experience: Array.isArray(v.experience) ? v.experience : undefined,
      workHighlights: Array.isArray(v.workHighlights) ? v.workHighlights : undefined,
      careerHighlights: Array.isArray(v.careerHighlights) ? v.careerHighlights : undefined,
      resumeHeadline: typeof v.resumeHeadline === "string" ? v.resumeHeadline : undefined,
      careerObjective: typeof v.careerObjective === "string" ? v.careerObjective : undefined,
    };
  }
  return out;
}

function CircularProgress({ score, size = 80 }: { score: number; size?: number }) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;
  
  const getColor = (score: number) => {
    if (score >= 80) return { stroke: "#22c55e", bg: "bg-green-50", text: "text-green-600" };
    if (score >= 60) return { stroke: "#f59e0b", bg: "bg-amber-50", text: "text-amber-600" };
    return { stroke: "#ef4444", bg: "bg-red-50", text: "text-red-600" };
  };
  
  const colors = getColor(score);
  
  return (
    <div className={`relative inline-flex items-center justify-center ${colors.bg} rounded-full p-2`}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-200"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.stroke}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-lg font-bold ${colors.text}`}>{score}</span>
      </div>
    </div>
  );
}

// Platform-specific preview components
function LinkedInPreview({ profile, userName }: { profile: OptimizedProfile; userName: string }) {
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-xl max-w-xl w-full">
      {/* Cover Photo */}
      <div className="h-28 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500" />
      
      {/* Profile Section */}
      <div className="relative px-6 pb-6">
        {/* Avatar */}
        <div className="absolute -top-16 left-6">
          <div className="w-32 h-32 rounded-full border-4 border-white bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
            <span className="text-4xl font-bold text-white">{userName.charAt(0).toUpperCase()}</span>
          </div>
        </div>
        
        {/* Connect Button */}
        <div className="flex justify-end pt-4">
          <button className="px-4 py-1.5 bg-blue-600 text-white text-sm font-semibold rounded-full hover:bg-blue-700">
            Connect
          </button>
        </div>
        
        {/* Name & Headline */}
        <div className="mt-8">
          <h1 className="text-2xl font-bold text-gray-900">{userName}</h1>
          <p className="text-base text-gray-700 mt-1 leading-snug">{profile.headline}</p>
          <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" /> San Francisco Bay Area • <span className="text-blue-600 hover:underline cursor-pointer">500+ connections</span>
          </p>
        </div>
        
        {/* About Section */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-3">About</h2>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{profile.summary}</p>
        </div>
        
        {/* Skills */}
        {profile.skills && profile.skills.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {profile.skills.slice(0, 8).map((skill, i) => (
                <span key={i} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm rounded-full border border-blue-100">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function NaukriPreview({ profile, userName }: { profile: OptimizedProfile; userName: string }) {
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-xl max-w-xl w-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
            <span className="text-blue-900 font-bold text-sm">N</span>
          </div>
          <span className="text-white font-semibold">naukri.com</span>
        </div>
      </div>
      
      {/* Profile Card */}
      <div className="p-6">
        <div className="flex gap-5">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-bold text-white">{userName.charAt(0).toUpperCase()}</span>
          </div>
          
          {/* Info */}
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{userName}</h1>
            {profile.resumeHeadline && (
              <p className="text-sm text-gray-600 mt-1">{profile.resumeHeadline}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Bangalore</span>
              <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" /> 5 Years</span>
            </div>
          </div>
        </div>
        
        {/* Profile Summary */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wider">Profile Summary</h3>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{profile.summary}</p>
        </div>
        
        {/* Key Skills */}
        {profile.keySkills && profile.keySkills.length > 0 && (
          <div className="mt-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Key Skills</h3>
            <div className="flex flex-wrap gap-2">
              {profile.keySkills.map((skill, i) => (
                <span key={i} className="px-3 py-1 bg-blue-900 text-white text-xs rounded">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Work Highlights */}
        {profile.workHighlights && profile.workHighlights.length > 0 && (
          <div className="mt-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wider">Work Highlights</h3>
            <ul className="space-y-1.5">
              {profile.workHighlights.slice(0, 4).map((highlight, i) => (
                <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  {highlight}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function IndeedPreview({ profile, userName }: { profile: OptimizedProfile; userName: string }) {
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-xl max-w-xl w-full">
      {/* Header */}
      <div className="bg-[#2164f3] px-6 py-3 flex items-center gap-2">
        <div className="text-white font-bold text-lg">indeed</div>
      </div>
      
      {/* Resume Preview */}
      <div className="p-6 bg-gray-50">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-bold text-indigo-600">{userName.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{userName}</h1>
                <p className="text-sm text-gray-600 mt-0.5">{profile.headline}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Remote</span>
                  <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> Contact available</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Summary */}
          <div className="p-5 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Professional Summary</h3>
            <p className="text-sm text-gray-700 leading-relaxed">{profile.summary}</p>
          </div>
          
          {/* Skills */}
          {profile.skills && profile.skills.length > 0 && (
            <div className="p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {profile.skills.slice(0, 10).map((skill, i) => (
                  <span key={i} className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FounditPreview({ profile, userName }: { profile: OptimizedProfile; userName: string }) {
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-xl max-w-xl w-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-500 px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-lg">foundit</span>
          <span className="text-white/70 text-sm">(formerly Monster)</span>
        </div>
      </div>
      
      {/* Profile Card */}
      <div className="p-6">
        <div className="flex items-start gap-5">
          <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-bold text-white">{userName.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{userName}</h1>
            <p className="text-sm text-purple-600 font-medium mt-1">{profile.headline}</p>
            <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Mumbai</span>
              <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Open to work</span>
            </div>
          </div>
        </div>
        
        {/* Career Objective */}
        {profile.careerObjective && (
          <div className="mt-6 p-4 bg-purple-50 rounded-xl border border-purple-100">
            <h3 className="text-sm font-semibold text-purple-900 mb-2">Career Objective</h3>
            <p className="text-sm text-gray-700 leading-relaxed">{profile.careerObjective}</p>
          </div>
        )}
        
        {/* Profile Summary */}
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Profile Summary</h3>
          <p className="text-sm text-gray-700 leading-relaxed">{profile.summary}</p>
        </div>
        
        {/* Career Highlights */}
        {profile.careerHighlights && profile.careerHighlights.length > 0 && (
          <div className="mt-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Career Highlights</h3>
            <ul className="space-y-1.5">
              {profile.careerHighlights.slice(0, 4).map((highlight, i) => (
                <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-purple-500 mt-0.5">✓</span>
                  {highlight}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function GlassdoorPreview({ profile, userName }: { profile: OptimizedProfile; userName: string }) {
  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-xl max-w-xl w-full">
      {/* Header */}
      <div className="bg-[#0caa41] px-6 py-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
            <span className="text-[#0caa41] font-bold text-xs">G</span>
          </div>
          <span className="text-white font-semibold">Glassdoor</span>
        </div>
      </div>
      
      {/* Profile */}
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
            <span className="text-xl font-bold text-green-600">{userName.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900">{userName}</h1>
            <p className="text-sm text-gray-600">{profile.headline}</p>
            <div className="flex items-center gap-1 mt-2">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <Star className="w-4 h-4 text-gray-200" />
              <span className="text-xs text-gray-500 ml-1">Profile strength: Strong</span>
            </div>
          </div>
        </div>
        
        {/* Summary Box */}
        <div className="mt-5 p-4 bg-green-50 rounded-lg border border-green-100">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">About</h3>
          <p className="text-sm text-gray-700 leading-relaxed">{profile.summary}</p>
        </div>
        
        {/* Skills */}
        {(profile.skills || profile.keySkills) && (
          <div className="mt-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Top Skills</h3>
            <div className="flex flex-wrap gap-2">
              {(profile.skills || profile.keySkills)!.slice(0, 8).map((skill, i) => (
                <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full border border-gray-200">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Work Highlights */}
        {(profile.workHighlights || profile.careerHighlights) && (
          <div className="mt-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Highlights</h3>
            <ul className="space-y-1.5">
              {(profile.workHighlights || profile.careerHighlights)!.slice(0, 3).map((h, i) => (
                <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  {h}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// Preview Modal Component
function PreviewModal({ 
  isOpen, 
  onClose, 
  platform, 
  profile, 
  userName 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  platform: typeof PLATFORMS[0]; 
  profile: OptimizedProfile;
  userName: string;
}) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);

  if (!isOpen) return null;

  const handleShare = async () => {
    if (!previewRef.current) return;
    
    setGenerating(true);
    try {
      const dataUrl = await toPng(previewRef.current, {
        quality: 0.95,
        pixelRatio: 2,
      });
      
      // Create download link
      const link = document.createElement('a');
      link.download = `ascend-${platform.id}-preview.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error generating image:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyToClipboard = async () => {
    if (!previewRef.current) return;
    
    setGenerating(true);
    try {
      const dataUrl = await toPng(previewRef.current, {
        quality: 0.95,
        pixelRatio: 2,
      });
      
      const blob = await (await fetch(dataUrl)).blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      alert('Image copied to clipboard!');
    } catch (error) {
      console.error('Error copying image:', error);
    } finally {
      setGenerating(false);
    }
  };

  const PreviewComponent = {
    linkedin: LinkedInPreview,
    naukri: NaukriPreview,
    indeed: IndeedPreview,
    foundit: FounditPreview,
    glassdoor: GlassdoorPreview,
  }[platform.id] || LinkedInPreview;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-card rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${platform.color} flex items-center justify-center`}>
              <platform.icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{platform.name} Preview</h2>
              <p className="text-sm text-muted-foreground">How your profile will appear</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        {/* Preview Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-100">
          <div ref={previewRef} className="flex justify-center">
            <PreviewComponent profile={profile} userName={userName} />
          </div>
        </div>
        
        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-card">
          <p className="text-sm text-muted-foreground">
            <Camera className="w-4 h-4 inline mr-1" />
            Save or share this preview
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCopyToClipboard} disabled={generating}>
              {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              Copy Image
            </Button>
            <Button onClick={handleShare} disabled={generating} className="gap-2">
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Download
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AIOptimize() {
  const navigate = useNavigate();
  const { profiles, loading: loadingProfiles } = useMyProfiles();
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["linkedin", "naukri", "indeed", "foundit", "glassdoor"]);
  const [optimizing, setOptimizing] = useState(false);
  const [streamingProgress, setStreamingProgress] = useState<string>("");
  const [optimizedProfiles, setOptimizedProfiles] = useState<OptimizedProfiles | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("");
  const [previewModal, setPreviewModal] = useState<{ isOpen: boolean; platformId: string | null }>({ isOpen: false, platformId: null });

  const selectedProfile = profiles.find(p => String(p.id) === selectedProfileId);
  const userName = selectedProfile?.full_name || "User";

  // Load profiles from GET /api/profiles/me (via useMyProfiles). If none, redirect to /profiles with message.
  useEffect(() => {
    if (!loadingProfiles && profiles.length === 0) {
      navigate("/profiles", { state: { message: "Create a profile first to optimize." }, replace: true });
    }
  }, [loadingProfiles, profiles.length, navigate]);

  // Set selected profile: single profile → auto-select; multiple → default to first, user can change via selector
  useEffect(() => {
    if (loadingProfiles || profiles.length === 0) return;
    const currentValid = selectedProfileId && profiles.some(p => String(p.id) === selectedProfileId);
    if (!currentValid) {
      setSelectedProfileId(String(profiles[0].id));
    }
  }, [loadingProfiles, profiles, selectedProfileId]);

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  // Keep activeTab in sync with available data so a tab is always selected when results exist
  useEffect(() => {
    if (!optimizedProfiles || Object.keys(optimizedProfiles).length === 0) return;
    const keys = Object.keys(optimizedProfiles);
    if (keys.length > 0 && !keys.includes(activeTab)) {
      setActiveTab(keys[0]);
    }
  }, [optimizedProfiles, activeTab]);

  const handleOptimize = async () => {
    if (!selectedProfileId || selectedPlatforms.length === 0) return;
    
    setOptimizing(true);
    setError(null);
    setOptimizedProfiles(null);
    setStreamingProgress("");
    
    const maxRetries = 2;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Use streaming for better UX and to avoid timeouts
        const response = await fetch(`/api/profiles/${selectedProfileId}/optimize`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ platforms: selectedPlatforms, stream: true }),
          credentials: "include",
        });
        
        // Handle server errors with retry
        if (response.status >= 500) {
          throw new Error(`Server error (${response.status})`);
        }
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Request failed (${response.status})`);
        }
        
        // Check if we got a streaming response
        const contentType = response.headers.get("content-type") || "";
        
        if (contentType.includes("text/event-stream")) {
          // Handle SSE streaming response
          const reader = response.body?.getReader();
          if (!reader) throw new Error("No response body");
          
          const decoder = new TextDecoder();
          let buffer = "";
          let charCount = 0;
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n\n");
            buffer = lines.pop() || "";
            
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6));
                  
                  if (data.chunk) {
                    charCount += data.chunk.length;
                    // Show progress indicator
                    const platformCount = selectedPlatforms.length;
                    const estimatedCharsPerPlatform = 800;
                    const progress = Math.min(95, Math.round((charCount / (platformCount * estimatedCharsPerPlatform)) * 100));
                    setStreamingProgress(`Generating optimizations... ${progress}%`);
                  }
                  
                  if (data.done && data.success) {
                    const rawData = data.data;
                    const normalized = normalizeOptimizedProfiles(rawData);
                    const normalizedKeys = Object.keys(normalized);
                    if (normalizedKeys.length === 0) {
                      console.error("[AI Optimize] No platform data after normalization. Raw data:", JSON.stringify(rawData, null, 2));
                      setOptimizedProfiles({});
                      setError("AI returned no platform data. Check the browser console for the raw response.");
                    } else {
                      setOptimizedProfiles({ ...normalized });
                      const firstWithData = normalizedKeys[0];
                      setActiveTab(firstWithData);
                    }
                    localStorage.setItem("ascend_has_optimized", "true");
                    setOptimizing(false);
                    setStreamingProgress("");
                    return;
                  }
                  
                  if (data.done && data.error) {
                    throw new Error(data.error);
                  }
                } catch {
                  // Ignore parse errors for partial chunks
                }
              }
            }
          }
        } else {
          // Handle regular JSON response (fallback)
          const result = await response.json();
          if (result.success) {
            const normalized = normalizeOptimizedProfiles(result.data);
            const normalizedKeys = Object.keys(normalized);
            if (normalizedKeys.length === 0) {
              console.error("[AI Optimize] No platform data after normalization. result.data:", result.data);
              setOptimizedProfiles({});
              setError("AI returned no platform data. Check the browser console for the raw response.");
            } else {
              setOptimizedProfiles({ ...normalized });
              setActiveTab(normalizedKeys[0]);
            }
            localStorage.setItem("ascend_has_optimized", "true");
            setOptimizing(false);
            return;
          } else {
            const errorMsg = result.error || "Failed to optimize profile";
            if (errorMsg.includes("busy") || errorMsg.includes("unavailable")) {
              throw new Error(errorMsg);
            }
            setError(errorMsg);
            setOptimizing(false);
            return;
          }
        }
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (err instanceof Error && err.name === "AbortError") {
          setError("Request was cancelled. Please try again.");
          setOptimizing(false);
          return;
        }
        
        // Retry with exponential backoff
        if (attempt < maxRetries) {
          setStreamingProgress(`Retrying... (attempt ${attempt + 1}/${maxRetries})`);
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
    }
    
    // All retries failed
    if (lastError) {
      if (lastError.message.includes('Failed to fetch') || lastError.message.includes('NetworkError')) {
        setError("Network connection error. Please check your internet connection and try again.");
      } else if (lastError.message.includes('Server error')) {
        setError("The server is experiencing issues. Please try again in a few moments.");
      } else if (lastError.message.includes('busy') || lastError.message.includes('unavailable')) {
        setError("The AI service is currently busy. Please wait a moment and try again.");
      } else {
        setError(lastError.message || `Unable to connect after ${maxRetries} attempts. Please try again later.`);
      }
    }
    
    setOptimizing(false);
    setStreamingProgress("");
  };

  const copyToClipboard = async (text: string, fieldId: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const openPreview = (platformId: string) => {
    setPreviewModal({ isOpen: true, platformId });
  };

  const closePreview = () => {
    setPreviewModal({ isOpen: false, platformId: null });
  };

  const CopyButton = ({ text, fieldId }: { text: string; fieldId: string }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => copyToClipboard(text, fieldId)}
      className="h-8 px-2 gap-1.5"
    >
      {copiedField === fieldId ? (
        <>
          <Check className="w-4 h-4 text-green-500" />
          <span className="text-xs text-green-500">Copied</span>
        </>
      ) : (
        <>
          <Copy className="w-4 h-4" />
          <span className="text-xs">Copy</span>
        </>
      )}
    </Button>
  );

  const activePlatforms = PLATFORMS.filter(p => selectedPlatforms.includes(p.id));
  const platformsWithData = optimizedProfiles && Object.keys(optimizedProfiles).length > 0
    ? PLATFORMS.filter((p) => optimizedProfiles[p.id as keyof OptimizedProfiles])
    : activePlatforms;
  const previewPlatform = PLATFORMS.find(p => p.id === previewModal.platformId);
  const previewProfile = previewModal.platformId ? optimizedProfiles?.[previewModal.platformId as keyof OptimizedProfiles] : null;

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        {/* Preview Modal */}
        {previewPlatform && previewProfile && (
          <PreviewModal
            isOpen={previewModal.isOpen}
            onClose={closePreview}
            platform={previewPlatform}
            profile={previewProfile}
            userName={userName}
          />
        )}

        {/* Header */}
        <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-6 py-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center shadow-lg shadow-primary/20">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">AI Profile Optimizer</h1>
                <p className="text-sm text-muted-foreground">Optimize your profile for maximum visibility on job boards</p>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 py-8 relative">
          {/* Loading overlay while optimization is in progress */}
          {optimizing && (
            <div className="fixed inset-0 z-20 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <Card className="max-w-md mx-auto shadow-xl border-2 border-primary/20">
                <CardContent className="pt-8 pb-8 px-8 flex flex-col items-center gap-4">
                  <Loader2 className="w-12 h-12 animate-spin text-primary" />
                  <h3 className="text-lg font-semibold">Optimizing your profiles</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    {streamingProgress || "Connecting to AI..."}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Empty state: optimization returned no platform data */}
          {optimizedProfiles && Object.keys(optimizedProfiles).length === 0 && !error && (
            <Card className="max-w-lg mx-auto border-2 border-dashed border-amber-500/30 bg-amber-500/5">
              <CardContent className="pt-8 pb-8 px-8 text-center">
                <p className="text-muted-foreground mb-4">No platform content was generated. The AI response may use an unexpected format.</p>
                <p className="text-xs text-muted-foreground mb-6">Check the browser console (F12 → Console) for &quot;[AI Optimize] Raw API response&quot; to inspect the response.</p>
                <Button onClick={() => { setOptimizedProfiles(null); setError(null); }} variant="outline" className="gap-2">
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Configuration Section - show when no results yet or user clicked Start Over */}
          {!optimizedProfiles && (
            <div className="space-y-8">
              <p className="text-center text-muted-foreground">Select a profile and platforms, then click Generate to optimize your profile for each job board.</p>
              {/* Step 1: Select Profile */}
              <Card className="border-2 border-dashed border-primary/20 bg-card/50">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">1</div>
                    <div>
                      <CardTitle className="text-lg">Select a Profile</CardTitle>
                      <CardDescription>Choose which profile you want to optimize</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingProfiles ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading profiles...
                    </div>
                  ) : profiles.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">You haven't created any profiles yet.</p>
                      <Button onClick={() => navigate("/profiles")}>
                        Create Your First Profile
                      </Button>
                    </div>
                  ) : (
                    <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
                      <SelectTrigger className="w-full max-w-md">
                        <SelectValue placeholder="Choose a profile..." />
                      </SelectTrigger>
                      <SelectContent>
                        {profiles.map((profile) => (
                          <SelectItem key={profile.id} value={String(profile.id)}>
                            <div className="flex flex-col">
                              <span className="font-medium">{profile.full_name}</span>
                              {profile.headline && (
                                <span className="text-xs text-muted-foreground">{profile.headline}</span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </CardContent>
              </Card>

              {/* Step 2: Select Platforms */}
              <Card className={`border-2 border-dashed transition-colors ${selectedProfileId ? 'border-primary/20 bg-card/50' : 'border-muted bg-muted/20 opacity-60'}`}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${selectedProfileId ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>2</div>
                    <div>
                      <CardTitle className="text-lg">Choose Platforms</CardTitle>
                      <CardDescription>Select which job boards to optimize for</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {PLATFORMS.map((platform) => {
                      const isSelected = selectedPlatforms.includes(platform.id);
                      return (
                        <label
                          key={platform.id}
                          className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            isSelected 
                              ? 'border-primary bg-primary/5 shadow-sm' 
                              : 'border-border hover:border-primary/30 hover:bg-muted/50'
                          } ${!selectedProfileId ? 'pointer-events-none' : ''}`}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => togglePlatform(platform.id)}
                            disabled={!selectedProfileId}
                          />
                          <div className={`w-10 h-10 rounded-lg ${platform.color} flex items-center justify-center`}>
                            <platform.icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{platform.name}</p>
                            <p className="text-xs text-muted-foreground">{platform.description}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Generate Button */}
              <div className="flex justify-center">
                <Button
                  size="lg"
                  onClick={handleOptimize}
                  disabled={!selectedProfileId || selectedPlatforms.length === 0 || optimizing}
                  className="gap-2 px-8 h-12 text-base shadow-lg shadow-primary/20 min-w-[280px]"
                >
                  {optimizing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {streamingProgress || "Connecting to AI..."}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate Optimizations
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <Card className="max-w-md mx-auto mt-8">
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-destructive" />
                </div>
                <h2 className="text-xl font-bold mb-2">Optimization Failed</h2>
                <p className="text-muted-foreground mb-4">{error}</p>
                {error.includes("network") || error.includes("connection") ? (
                  <p className="text-xs text-muted-foreground mb-6">
                    Tip: Check your internet connection and ensure you're not behind a firewall blocking requests.
                  </p>
                ) : error.includes("busy") || error.includes("server") ? (
                  <p className="text-xs text-muted-foreground mb-6">
                    Tip: The AI service processes many requests. Waiting a few seconds before retrying usually helps.
                  </p>
                ) : null}
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={() => setError(null)}>
                    Dismiss
                  </Button>
                  <Button onClick={() => { setError(null); handleOptimize(); }}>
                    Retry Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results Section - only when we have at least one platform of data */}
          {optimizedProfiles && !error && Object.keys(optimizedProfiles).length > 0 && (
            <div className="space-y-6">
              {/* Results Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Your Optimized Profiles</h2>
                  <p className="text-muted-foreground">Copy these tailored versions to each job board</p>
                </div>
                <Button variant="outline" onClick={() => setOptimizedProfiles(null)}>
                  Start Over
                </Button>
              </div>

              {/* Strength Scores Overview */}
              <Card className="bg-gradient-to-r from-primary/5 to-emerald-500/5 border-primary/20">
                <CardContent className="pt-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-4">Profile Strength Scores</h3>
                  <div className="flex flex-wrap justify-center gap-8">
                    {platformsWithData.map((platform) => {
                      const profile = optimizedProfiles[platform.id as keyof OptimizedProfiles];
                      if (!profile) return null;
                      const score = profile.strengthScore ?? 0;
                      return (
                        <div key={platform.id} className="flex flex-col items-center gap-2">
                          <CircularProgress score={score} />
                          <div className="flex items-center gap-1.5">
                            <platform.icon className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{platform.name}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Tabbed Results */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full max-w-2xl mx-auto" style={{ gridTemplateColumns: `repeat(${platformsWithData.length}, 1fr)` }}>
                  {platformsWithData.map((platform) => (
                    <TabsTrigger key={platform.id} value={platform.id} className="gap-2">
                      <platform.icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{platform.name}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>

                {platformsWithData.map((platform) => {
                  const profile = optimizedProfiles[platform.id as keyof OptimizedProfiles];
                  if (!profile) return null;

                  return (
                    <TabsContent key={platform.id} value={platform.id} className="space-y-6">
                      <Card>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg ${platform.color} flex items-center justify-center`}>
                                <platform.icon className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <CardTitle>{platform.name} Profile</CardTitle>
                                <CardDescription>Optimized for {platform.name}'s algorithm and audience</CardDescription>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <CircularProgress score={profile.strengthScore ?? 0} size={64} />
                            </div>
                          </div>
                          
                          {/* Preview & Share Buttons */}
                          <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                            <Button 
                              variant="outline" 
                              onClick={() => openPreview(platform.id)}
                              className="gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              Preview as {platform.name}
                            </Button>
                            <Button 
                              variant="outline"
                              onClick={() => openPreview(platform.id)}
                              className="gap-2"
                            >
                              <Share2 className="w-4 h-4" />
                              Share Preview
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {/* Headline */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-sm font-semibold text-foreground">Headline</label>
                              <CopyButton text={profile.headline} fieldId={`${platform.id}-headline`} />
                            </div>
                            <div className="p-4 bg-muted/50 rounded-lg border">
                              <p className="font-medium">{profile.headline}</p>
                            </div>
                          </div>

                          {/* Resume Headline (Naukri specific) */}
                          {profile.resumeHeadline && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <label className="text-sm font-semibold text-foreground">Resume Headline</label>
                                <CopyButton text={profile.resumeHeadline} fieldId={`${platform.id}-resume-headline`} />
                              </div>
                              <div className="p-4 bg-muted/50 rounded-lg border">
                                <p>{profile.resumeHeadline}</p>
                              </div>
                            </div>
                          )}

                          {/* Summary */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-sm font-semibold text-foreground">
                                {platform.id === "linkedin" ? "About Section" : "Summary"}
                              </label>
                              <CopyButton text={profile.summary} fieldId={`${platform.id}-summary`} />
                            </div>
                            <div className="p-4 bg-muted/50 rounded-lg border">
                              <p className="whitespace-pre-wrap leading-relaxed">{profile.summary}</p>
                            </div>
                          </div>

                          {/* Career Objective (Foundit specific) */}
                          {profile.careerObjective && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <label className="text-sm font-semibold text-foreground">Career Objective</label>
                                <CopyButton text={profile.careerObjective} fieldId={`${platform.id}-objective`} />
                              </div>
                              <div className="p-4 bg-muted/50 rounded-lg border">
                                <p>{profile.careerObjective}</p>
                              </div>
                            </div>
                          )}

                          {/* Experience (LinkedIn specific) */}
                          {profile.experience && profile.experience.length > 0 && (
                            <div className="space-y-3">
                              <label className="text-sm font-semibold text-foreground">Experience Descriptions</label>
                              {profile.experience.map((exp, index) => (
                                <div key={index} className="p-4 bg-muted/50 rounded-lg border space-y-2">
                                  <div className="flex items-center justify-between">
                                    <p className="font-medium">{exp.title} at {exp.company}</p>
                                    <CopyButton text={exp.description} fieldId={`${platform.id}-exp-${index}`} />
                                  </div>
                                  <p className="text-sm whitespace-pre-wrap">{exp.description}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Work Highlights / Career Highlights */}
                          {(profile.workHighlights || profile.careerHighlights) && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <label className="text-sm font-semibold text-foreground">
                                  {profile.workHighlights ? "Work Highlights" : "Career Highlights"}
                                </label>
                                <CopyButton 
                                  text={"• " + (profile.workHighlights || profile.careerHighlights)!.join("\n• ")} 
                                  fieldId={`${platform.id}-highlights`} 
                                />
                              </div>
                              <div className="p-4 bg-muted/50 rounded-lg border">
                                <ul className="space-y-2">
                                  {(profile.workHighlights || profile.careerHighlights)!.map((highlight, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                      <span className="text-primary mt-1">•</span>
                                      <span>{highlight}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}

                          {/* Skills */}
                          {(profile.skills || profile.keySkills) && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <label className="text-sm font-semibold text-foreground">
                                  {profile.keySkills ? "Key Skills" : "Skills"}
                                </label>
                                <CopyButton 
                                  text={(profile.skills || profile.keySkills)!.join(", ")} 
                                  fieldId={`${platform.id}-skills`} 
                                />
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {(profile.skills || profile.keySkills)!.map((skill, i) => (
                                  <Badge key={i} variant="secondary" className="px-3 py-1">{skill}</Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                  );
                })}
              </Tabs>

              {/* Action Buttons */}
              <div className="flex justify-center gap-4 pt-4">
                <Button variant="outline" onClick={() => navigate("/dashboard")}>
                  Back to Dashboard
                </Button>
                <Button onClick={handleOptimize} disabled={optimizing} className="gap-2">
                  {optimizing ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Regenerating...</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> Regenerate</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </SidebarLayout>
  );
}