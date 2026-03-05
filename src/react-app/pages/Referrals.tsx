import { useState, useEffect } from "react";
import { useAuth } from "@/react-app/hooks/useAuth";
import { 
  Gift, Copy, Check, Users, Crown, Share2, 
  Linkedin, MessageCircle, Award, Sparkles, Star
} from "lucide-react";
import { Button } from "@/react-app/components/ui/button";
import { Card, CardContent } from "@/react-app/components/ui/card";
import SidebarLayout from "@/react-app/components/SidebarLayout";

interface ReferralData {
  id: number;
  user_id: string;
  referral_code: string;
  referred_count: number;
  converted_count: number;
}

const rewardTiers = [
  { friends: 1, reward: "1 Month Pro Free", icon: Gift, color: "from-blue-500 to-cyan-500" },
  { friends: 3, reward: "3 Months Pro Free", icon: Award, color: "from-purple-500 to-pink-500" },
  { friends: 5, reward: "Lifetime Pro", icon: Crown, color: "from-amber-500 to-orange-500" },
];

export default function Referrals() {
  const { user, isPending } = useAuth();
  const [referral, setReferral] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchReferral = async () => {
      try {
        const response = await fetch("/api/referral", { credentials: "include" });
        if (response.ok) {
          const data = await response.json();
          setReferral(data.referral);
        }
      } catch (error) {
        console.error("Error fetching referral:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchReferral();
    }
  }, [user]);

  const referralLink = referral 
    ? `${window.location.origin}?ref=${referral.referral_code}`
    : "";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const text = `🚀 I'm using Ascend by Coheron to supercharge my job search with AI! Build optimized profiles for LinkedIn, Indeed & more. Join me: ${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleLinkedInShare = () => {
    const text = `I've been using Ascend by Coheron to optimize my professional profiles and job search with AI. Highly recommend checking it out!`;
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}&summary=${encodeURIComponent(text)}`,
      "_blank"
    );
  };

  const getCurrentTier = () => {
    const converted = referral?.converted_count || 0;
    if (converted >= 5) return 2;
    if (converted >= 3) return 1;
    if (converted >= 1) return 0;
    return -1;
  };

  const getNextTier = () => {
    const converted = referral?.converted_count || 0;
    if (converted >= 5) return null;
    if (converted >= 3) return rewardTiers[2];
    if (converted >= 1) return rewardTiers[1];
    return rewardTiers[0];
  };

  if (isPending || loading) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </SidebarLayout>
    );
  }

  const currentTier = getCurrentTier();
  const nextTier = getNextTier();
  const progressToNext = nextTier 
    ? ((referral?.converted_count || 0) / nextTier.friends) * 100 
    : 100;

  return (
    <SidebarLayout>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Earn Free Pro</h1>
              <p className="text-muted-foreground">Invite friends and unlock premium features</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Card className="border-2">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center">
                  <Users className="w-7 h-7 text-blue-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{referral?.referred_count || 0}</p>
                  <p className="text-muted-foreground">Friends Referred</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-2">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center">
                  <Crown className="w-7 h-7 text-green-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{referral?.converted_count || 0}</p>
                  <p className="text-muted-foreground">Converted to Pro</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Referral Link */}
        <Card className="mb-8 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-emerald-400/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Share2 className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-lg">Your Referral Link</h2>
            </div>
            
            <div className="flex gap-2 mb-4">
              <div className="flex-1 px-4 py-3 bg-background border-2 border-border rounded-xl font-mono text-sm truncate">
                {referralLink}
              </div>
              <Button 
                onClick={handleCopy} 
                variant="outline" 
                className="shrink-0 gap-2 border-2"
              >
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
            
            <div className="flex gap-3">
              <Button 
                onClick={handleWhatsAppShare}
                className="flex-1 gap-2 bg-[#25D366] hover:bg-[#20BD5A] text-white"
              >
                <MessageCircle className="w-5 h-5" />
                Share on WhatsApp
              </Button>
              <Button 
                onClick={handleLinkedInShare}
                className="flex-1 gap-2 bg-[#0A66C2] hover:bg-[#0958A8] text-white"
              >
                <Linkedin className="w-5 h-5" />
                Share on LinkedIn
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Progress to Next Tier */}
        {nextTier && (
          <Card className="mb-8 border-2">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">Progress to next reward</span>
                <span className="text-sm font-semibold">
                  {referral?.converted_count || 0} / {nextTier.friends} friends
                </span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden mb-3">
                <div 
                  className={`h-full bg-gradient-to-r ${nextTier.color} transition-all duration-500`}
                  style={{ width: `${Math.min(progressToNext, 100)}%` }}
                />
              </div>
              <p className="text-sm text-center">
                <span className="font-medium">{nextTier.friends - (referral?.converted_count || 0)} more</span>
                {" "}friend{nextTier.friends - (referral?.converted_count || 0) !== 1 ? "s" : ""} to unlock{" "}
                <span className="font-semibold text-primary">{nextTier.reward}</span>
              </p>
            </CardContent>
          </Card>
        )}

        {/* Reward Tiers */}
        <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          Reward Tiers
        </h2>
        
        <div className="space-y-4">
          {rewardTiers.map((tier, index) => {
            const TierIcon = tier.icon;
            const isUnlocked = currentTier >= index;
            const isNext = currentTier === index - 1;
            
            return (
              <Card 
                key={index}
                className={`border-2 transition-all ${
                  isUnlocked 
                    ? "border-green-300 bg-green-50/50" 
                    : isNext 
                      ? "border-primary/30 bg-primary/5" 
                      : "border-border"
                }`}
              >
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tier.color} flex items-center justify-center shrink-0 ${!isUnlocked && "opacity-50"}`}>
                      <TierIcon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-lg">{tier.reward}</span>
                        {isUnlocked && (
                          <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium flex items-center gap-1">
                            <Check className="w-3 h-3" /> Unlocked
                          </span>
                        )}
                        {isNext && (
                          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center gap-1">
                            <Star className="w-3 h-3" /> Next Goal
                          </span>
                        )}
                      </div>
                      <p className="text-muted-foreground text-sm">
                        Refer {tier.friends} friend{tier.friends > 1 ? "s" : ""} who upgrade{tier.friends === 1 ? "s" : ""} to Pro
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* How it works */}
        <Card className="mt-8 border-2 bg-muted/30">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">How it works</h3>
            <ol className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-xs font-semibold">1</span>
                <span>Share your unique referral link with friends</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-xs font-semibold">2</span>
                <span>When they sign up using your link, they're tracked as your referral</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-xs font-semibold">3</span>
                <span>When they upgrade to Pro, you unlock rewards automatically</span>
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
}