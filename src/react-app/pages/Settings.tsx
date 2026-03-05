import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/react-app/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/react-app/components/ui/card";
import { Button } from "@/react-app/components/ui/button";
import { Switch } from "@/react-app/components/ui/switch";
import { Input } from "@/react-app/components/ui/input";
import { Label } from "@/react-app/components/ui/label";
import { 
  User, Mail, Shield, Bell, Loader2, Database, Download, Trash2, 
  AlertTriangle, CheckCircle2, Clock, FileText, Briefcase, Search, Sparkles, X
} from "lucide-react";
import SidebarLayout from "@/react-app/components/SidebarLayout";

interface DataPrivacyStatus {
  helpImproveAscend: boolean;
  consentUpdatedAt: string | null;
  eulaAcceptedAt: string | null;
  eulaVersion: string | null;
  dataInventory: {
    profileCount: number;
    applicationCount: number;
    hasJobSearchHistory: boolean;
    hasOptimizationHistory: boolean;
  };
  pendingExportRequest: {
    requestedAt: string;
    status: string;
  } | null;
  pendingDeletionRequest: {
    requestedAt: string;
    scheduledDate: string;
    status: string;
  } | null;
}

export default function Settings() {
  const navigate = useNavigate();
  const { user, isPending, logout } = useAuth();
  const [privacyStatus, setPrivacyStatus] = useState<DataPrivacyStatus | null>(null);
  const [loadingPrivacy, setLoadingPrivacy] = useState(true);
  const [savingConsent, setSavingConsent] = useState(false);
  const [requestingExport, setRequestingExport] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    setToast(null);
    
    try {
      await logout();
      
      // Clear all localStorage items related to user
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('cf_') || key.startsWith('ascend_')) {
          localStorage.removeItem(key);
        }
      });
      
      // Redirect to home with replace to prevent back navigation
      navigate('/', { replace: true, state: { signedOut: true } });
    } catch (error) {
      console.error('Sign out failed:', error);
      setToast({ message: 'Sign out failed — please try again', type: 'error' });
      setSigningOut(false);
    }
  };

  useEffect(() => {
    fetchPrivacyStatus();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchPrivacyStatus = async () => {
    try {
      const res = await fetch("/api/data-privacy/status", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setPrivacyStatus(data);
      }
    } catch (error) {
      console.error("Error fetching privacy status:", error);
    } finally {
      setLoadingPrivacy(false);
    }
  };

  const handleConsentToggle = async (newValue: boolean) => {
    setSavingConsent(true);
    try {
      const res = await fetch("/api/data-privacy/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ helpImproveAscend: newValue })
      });
      if (res.ok) {
        setPrivacyStatus(prev => prev ? { ...prev, helpImproveAscend: newValue, consentUpdatedAt: new Date().toISOString() } : null);
        setToast({ message: newValue ? "Data sharing enabled" : "Data sharing disabled", type: "success" });
      }
    } catch (error) {
      console.error("Error updating consent:", error);
      setToast({ message: "Failed to update preference", type: "error" });
    } finally {
      setSavingConsent(false);
    }
  };

  const handleExportRequest = async () => {
    setRequestingExport(true);
    try {
      const res = await fetch("/api/data-privacy/export-request", {
        method: "POST",
        credentials: "include"
      });
      if (!res.headers.get("Content-Type")?.includes("application/json")) {
        setToast({ message: "Server error. Please try again.", type: "error" });
        return;
      }
      const data = await res.json();
      if (res.ok) {
        setToast({ message: "Export request submitted! Check your email within 24 hours.", type: "success" });
        fetchPrivacyStatus();
      } else {
        setToast({ message: data.error || "Failed to request export", type: "error" });
      }
    } catch (error) {
      console.error("Error requesting export:", error);
      setToast({ message: "Failed to request export", type: "error" });
    } finally {
      setRequestingExport(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return;
    
    setDeletingAccount(true);
    try {
      const res = await fetch("/api/data-privacy/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ confirmationText: deleteConfirmText })
      });
      if (!res.headers.get("Content-Type")?.includes("application/json")) {
        setToast({ message: "Server error. Please try again.", type: "error" });
        return;
      }
      const data = await res.json();
      if (res.ok) {
        setToast({ message: "Account deletion scheduled for 30 days", type: "success" });
        setShowDeleteModal(false);
        setDeleteConfirmText("");
        fetchPrivacyStatus();
      } else {
        setToast({ message: data.error || "Failed to delete account", type: "error" });
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      setToast({ message: "Failed to delete account", type: "error" });
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleCancelDeletion = async () => {
    try {
      const res = await fetch("/api/data-privacy/cancel-deletion", {
        method: "POST",
        credentials: "include"
      });
      if (res.ok) {
        setToast({ message: "Account deletion cancelled", type: "success" });
        fetchPrivacyStatus();
      }
    } catch (error) {
      console.error("Error cancelling deletion:", error);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isPending) {
    return (
      <SidebarLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Toast Notification */}
          {toast && (
            <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
              toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
            }`}>
              {toast.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              {toast.message}
            </div>
          )}

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Settings</h1>
            <p className="text-muted-foreground">Manage your account preferences</p>
          </div>

          <div className="space-y-6">
            {/* Account Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Account Information</CardTitle>
                    <CardDescription>Your account details</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center">
                    {user?.google_user_data?.picture ? (
                      <img 
                        src={user.google_user_data.picture} 
                        alt="Profile" 
                        className="w-16 h-16 rounded-full"
                      />
                    ) : (
                      <User className="w-8 h-8 text-white" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-lg">
                      {user?.google_user_data?.name || user?.email?.split('@')[0] || 'User'}
                    </p>
                    <p className="text-muted-foreground flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {user?.email}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data & Privacy */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Database className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <CardTitle>Data & Privacy</CardTitle>
                    <CardDescription>Manage your data and privacy preferences</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {loadingPrivacy ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    {/* Help Improve Ascend Toggle */}
                    <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-base font-medium">Help Improve Ascend</Label>
                          <p className="text-sm text-muted-foreground max-w-md">
                            Allow Ascend to use your anonymized profile data to improve AI recommendations 
                            and market intelligence. Your data is never shared individually. You can opt out 
                            at any time without affecting your Pro features.
                          </p>
                        </div>
                        <Switch 
                          checked={privacyStatus?.helpImproveAscend ?? true}
                          onCheckedChange={handleConsentToggle}
                          disabled={savingConsent}
                        />
                      </div>
                      {privacyStatus?.consentUpdatedAt && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Last updated: {formatDate(privacyStatus.consentUpdatedAt)}
                        </p>
                      )}
                    </div>

                    {/* Consent Status */}
                    <div className="p-4 border rounded-lg space-y-3">
                      <h4 className="font-medium flex items-center gap-2">
                        <Shield className="w-4 h-4 text-emerald-600" />
                        Current Consent Status
                      </h4>
                      <div className="grid gap-2 text-sm">
                        <div className="flex items-center justify-between py-1.5 border-b border-dashed">
                          <span className="text-muted-foreground">EULA Version</span>
                          <span className="font-medium">{privacyStatus?.eulaVersion || "Not accepted"}</span>
                        </div>
                        <div className="flex items-center justify-between py-1.5 border-b border-dashed">
                          <span className="text-muted-foreground">EULA Accepted</span>
                          <span className="font-medium">
                            {privacyStatus?.eulaAcceptedAt ? formatDate(privacyStatus.eulaAcceptedAt) : "—"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-1.5">
                          <span className="text-muted-foreground">Data Sharing</span>
                          <span className={`font-medium ${privacyStatus?.helpImproveAscend ? "text-emerald-600" : "text-amber-600"}`}>
                            {privacyStatus?.helpImproveAscend ? "Enabled" : "Disabled"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Data Inventory */}
                    <div className="p-4 border rounded-lg space-y-3">
                      <h4 className="font-medium flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-500" />
                        Your Data Inventory
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Here's what data Ascend currently holds for your account:
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <DataInventoryItem 
                          icon={<User className="w-4 h-4" />}
                          label="Profile Data"
                          value={`${privacyStatus?.dataInventory.profileCount || 0} profile(s)`}
                        />
                        <DataInventoryItem 
                          icon={<Briefcase className="w-4 h-4" />}
                          label="Application History"
                          value={`${privacyStatus?.dataInventory.applicationCount || 0} application(s)`}
                        />
                        <DataInventoryItem 
                          icon={<Search className="w-4 h-4" />}
                          label="Job Search History"
                          value={privacyStatus?.dataInventory.hasJobSearchHistory ? "Present" : "None"}
                        />
                        <DataInventoryItem 
                          icon={<Sparkles className="w-4 h-4" />}
                          label="Optimization History"
                          value={privacyStatus?.dataInventory.hasOptimizationHistory ? "Present" : "None"}
                        />
                      </div>
                    </div>

                    {/* Data Export */}
                    <div className="p-4 border rounded-lg space-y-3">
                      <h4 className="font-medium flex items-center gap-2">
                        <Download className="w-4 h-4 text-primary" />
                        Download My Data
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Request a complete export of all your data. You'll receive a JSON file and PDF summary 
                        delivered to your registered email within 24 hours.
                      </p>
                      {privacyStatus?.pendingExportRequest ? (
                        <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                          <Clock className="w-4 h-4" />
                          Export requested on {formatDate(privacyStatus.pendingExportRequest.requestedAt)}. Check your email.
                        </div>
                      ) : (
                        <Button 
                          variant="outline" 
                          onClick={handleExportRequest}
                          disabled={requestingExport}
                          className="gap-2"
                        >
                          {requestingExport ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Requesting...
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4" />
                              Request Data Export
                            </>
                          )}
                        </Button>
                      )}
                    </div>

                    {/* Account Deletion */}
                    <div className="p-4 border border-red-200 bg-red-50/50 rounded-lg space-y-3">
                      <h4 className="font-medium flex items-center gap-2 text-red-700">
                        <Trash2 className="w-4 h-4" />
                        Delete My Account and All Data
                      </h4>
                      <p className="text-sm text-red-600/80">
                        Permanently delete your account, all profiles, applications, and data. This action is 
                        compliant with India's Digital Personal Data Protection Act 2023.
                      </p>
                      {privacyStatus?.pendingDeletionRequest ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-100 px-3 py-2 rounded-lg">
                            <AlertTriangle className="w-4 h-4" />
                            Account scheduled for deletion on {privacyStatus.pendingDeletionRequest.scheduledDate}
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleCancelDeletion}
                            className="text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                          >
                            Cancel Deletion Request
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-100"
                          onClick={() => setShowDeleteModal(true)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete My Account
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Security */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-chart-2/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-chart-2" />
                  </div>
                  <div>
                    <CardTitle>Security</CardTitle>
                    <CardDescription>Manage your account security</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">Sign in method</p>
                    <p className="text-sm text-muted-foreground">Google OAuth</p>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-sm">
                    <Shield className="w-4 h-4" />
                    Secure
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-chart-3/10 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-chart-3" />
                  </div>
                  <div>
                    <CardTitle>Notifications</CardTitle>
                    <CardDescription>Email notification preferences</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg">
                  Notification preferences coming soon. We'll let you customize which emails you receive.
                </p>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive/30">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>Irreversible account actions</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={handleSignOut}
                  disabled={signingOut}
                >
                  {signingOut ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Signing out...
                    </>
                  ) : (
                    "Sign Out of All Devices"
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            <div className="bg-red-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3 text-white">
                <AlertTriangle className="w-6 h-6" />
                <h3 className="font-semibold text-lg">Delete Account</h3>
              </div>
              <button 
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(""); }}
                className="text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
                <p className="font-medium mb-2">⚠️ Warning: This action cannot be undone</p>
                <p>
                  This will permanently delete your account, all profiles, applications, and data within 
                  30 days. This action is compliant with India's Digital Personal Data Protection Act 2023.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-delete" className="text-sm font-medium">
                  Type <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">DELETE</span> to confirm
                </Label>
                <Input 
                  id="confirm-delete"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE here"
                  className="font-mono"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(""); }}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive"
                  className="flex-1"
                  disabled={deleteConfirmText !== "DELETE" || deletingAccount}
                  onClick={handleDeleteAccount}
                >
                  {deletingAccount ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Deleting...
                    </>
                  ) : (
                    "Delete My Account"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
}

function DataInventoryItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
