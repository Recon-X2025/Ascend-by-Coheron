import { NavLink, useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { 
  LayoutDashboard, User, Target, Briefcase, 
  Sparkles, LogOut, Menu, X, FileText, Settings, Crown, ArrowRight, Gift, Mic, Loader2
} from "lucide-react";
import AscendLogo from "@/components/ui/AscendLogo";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useMyProfiles } from "@/hooks/useProfile";

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export default function SidebarLayout({ children }: SidebarLayoutProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  useMyProfiles(); // Hook still needed for potential future use
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    setSignOutError(null);
    
    try {
      // Call the logout function from auth
      await logout();
      
      // Clear all localStorage items related to user
      const keysToRemove = [
        'cf_opted_in',
        'cf_saved_jobs',
        'cf_onboarding_optimized',
        'cf_onboarding_searched',
        'cf_onboarding_tracked',
        'cf_onboarding_downloaded'
      ];
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Clear any other user-related localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('cf_') || key.startsWith('ascend_')) {
          localStorage.removeItem(key);
        }
      });
      
      // Redirect to home with replace to prevent back navigation
      // Pass state to show success toast
      navigate('/', { replace: true, state: { signedOut: true } });
    } catch (error) {
      console.error('Sign out failed:', error);
      setSignOutError('Sign out failed — please try again');
      setSigningOut(false);
    }
  };

  // Auto-clear error toast after 4 seconds
  if (signOutError) {
    setTimeout(() => setSignOutError(null), 4000);
  }
  
  // For now, treat all users as free users (no subscription system yet)
  const isFreeTier = true;

  const navItems = [
    { 
      to: "/dashboard", 
      icon: LayoutDashboard, 
      label: "Dashboard",
      end: true
    },
    { 
      to: "/profiles", 
      icon: User, 
      label: "My Profiles"
    },
    { 
      to: "/optimize", 
      icon: Sparkles, 
      label: "AI Optimize"
    },
    { 
      to: "/jobs", 
      icon: Target, 
      label: "Find & Apply" 
    },
    { 
      to: "/applications", 
      icon: Briefcase, 
      label: "Applications" 
    },
    { 
      to: "/resume", 
      icon: FileText, 
      label: "Resume Builder"
    },
    { 
      to: "/interview-prep", 
      icon: Mic, 
      label: "Interview Prep"
    },
  ];

  const NavItem = ({ item }: { item: typeof navItems[0] }) => {
    const Icon = item.icon;
    const isDisabled = 'disabled' in item && item.disabled;
    
    if (isDisabled) {
      return (
        <div className="flex items-center gap-3 px-4 py-3 text-muted-foreground/50 cursor-not-allowed">
          <Icon className="w-5 h-5" />
          <span className="font-medium">{item.label}</span>
        </div>
      );
    }

    return (
      <NavLink
        to={item.to}
        end={'end' in item && item.end}
        onClick={() => setMobileMenuOpen(false)}
        className={({ isActive }) => `
          relative flex items-center gap-3 px-4 py-3 transition-all rounded-r-lg
          ${isActive 
            ? 'bg-primary/10 text-primary border-l-3 border-primary -ml-px' 
            : 'text-foreground/70 hover:bg-muted hover:text-foreground'
          }
        `}
      >
        <Icon className="w-5 h-5" />
        <span className="font-medium">{item.label}</span>
      </NavLink>
    );
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex print:hidden w-60 border-r border-border bg-card flex-col fixed h-full">
        {/* Logo */}
        <div className="border-b border-border p-4">
          <AscendLogo />
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 pr-4 space-y-1">
          {navItems.map((item) => (
            <NavItem key={item.label} item={item} />
          ))}
          
          {/* Earn Free Pro - Special Nav Item */}
          <NavLink
            to="/referrals"
            className={({ isActive }) => `
              relative flex items-center gap-3 px-4 py-3 mt-2 transition-all rounded-r-lg
              ${isActive 
                ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-600 border-l-3 border-amber-500 -ml-px' 
                : 'bg-gradient-to-r from-amber-500/5 to-orange-500/5 text-amber-600 hover:from-amber-500/15 hover:to-orange-500/15'
              }
            `}
          >
            <Gift className="w-5 h-5" />
            <span className="font-medium">Earn Free Pro</span>
            <span className="ml-auto px-1.5 py-0.5 text-[10px] font-bold bg-amber-500 text-white rounded">NEW</span>
          </NavLink>
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-border">
          {/* Upgrade to Pro Banner */}
          {isFreeTier && (
            <div className="m-4 p-3 rounded-xl bg-gradient-to-br from-primary/10 to-emerald-400/10 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-4 h-4 text-primary" />
                <span className="font-semibold text-sm">Upgrade to Pro</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Unlock AI optimization for all platforms
              </p>
              <Button 
                size="sm" 
                className="w-full gap-1 text-xs"
                onClick={() => navigate("/pricing")}
              >
                View Plans <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          )}
          
          {/* Settings */}
          <div className="py-2 pr-4">
            <NavLink
              to="/settings"
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) => `
                relative flex items-center gap-3 px-4 py-3 transition-all rounded-r-lg
                ${isActive 
                  ? 'bg-primary/10 text-primary border-l-3 border-primary -ml-px' 
                  : 'text-foreground/70 hover:bg-muted hover:text-foreground'
                }
              `}
            >
              <Settings className="w-5 h-5" />
              <span className="font-medium">Settings</span>
            </NavLink>
          </div>
          
          {/* User Info & Sign Out */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-3 px-3 py-2 mb-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.google_user_data?.given_name || user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSignOut}
              disabled={signingOut}
              className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive"
            >
              {signingOut ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing out...
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </>
              )}
            </Button>
          </div>
          
          {/* Footer Links */}
          <div className="px-4 py-3 border-t border-border">
            <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
              <NavLink to="/privacy-policy" className="hover:text-foreground transition-colors">Privacy</NavLink>
              <span>•</span>
              <NavLink to="/terms-of-service" className="hover:text-foreground transition-colors">Terms</NavLink>
            </div>
            <p className="text-[10px] text-muted-foreground/60 text-center mt-2">
              © 2025 Ascend
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden print:hidden fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <AscendLogo />
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-background border-b border-border shadow-lg max-h-[80vh] overflow-y-auto">
            <nav className="py-4 pr-4 space-y-1">
              {navItems.map((item) => (
                <NavItem key={item.label} item={item} />
              ))}
            </nav>
            <div className="border-t border-border py-2 pr-4">
              <NavLink
                to="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) => `
                  relative flex items-center gap-3 px-4 py-3 transition-all rounded-r-lg
                  ${isActive 
                    ? 'bg-primary/10 text-primary border-l-3 border-primary -ml-px' 
                    : 'text-foreground/70 hover:bg-muted hover:text-foreground'
                  }
                `}
              >
                <Settings className="w-5 h-5" />
                <span className="font-medium">Settings</span>
              </NavLink>
            </div>
            <div className="p-4 border-t border-border">
              <div className="flex items-center gap-3 px-3 py-2 mb-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground truncate">{user?.email}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSignOut}
                disabled={signingOut}
                className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive"
              >
                {signingOut ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing out...
                  </>
                ) : (
                  <>
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Sign Out Error Toast */}
      {signOutError && (
        <div className="fixed bottom-4 right-4 z-50 bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom-2">
          <X className="w-4 h-4" />
          <span className="text-sm font-medium">{signOutError}</span>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:ml-60">
        <div className="pt-16 lg:pt-0">
          {children}
        </div>
      </main>
    </div>
  );
}
