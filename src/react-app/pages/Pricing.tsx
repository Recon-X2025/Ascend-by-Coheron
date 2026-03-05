import { useNavigate } from "react-router";
import { useAuth } from "@/react-app/hooks/useAuth";
import { Button } from "@/react-app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/react-app/components/ui/card";
import { Check, X, ArrowRight, Sparkles, Crown, Zap } from "lucide-react";
import { AscendMark } from "@/react-app/components/AscendMark";

const features = [
  { name: "Profile Creation", free: true, pro: true },
  { name: "Number of Profiles", free: "1", pro: "Unlimited" },
  { name: "AI Profile Optimization", free: false, pro: "All 5 Platforms" },
  { name: "Resume Builder", free: "Basic", pro: "AI-Powered" },
  { name: "Resume Tailoring", free: false, pro: true },
  { name: "Job Search", free: "5 searches/day", pro: "Unlimited" },
  { name: "Application Tracking", free: "5 applications", pro: "Unlimited" },
  { name: "Match Scoring", free: false, pro: true },
  { name: "Platform Preview Mockups", free: false, pro: true },
  { name: "Career Insights Dashboard", free: "Basic", pro: "Advanced Analytics" },
  { name: "Support", free: "Community", pro: "Priority Email" },
];

export default function Pricing() {
  const navigate = useNavigate();
  const { user, isPending, redirectToLogin } = useAuth();

  const handleGetStarted = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      redirectToLogin();
    }
  };

  const handleStartTrial = () => {
    if (user) {
      // For now, redirect to dashboard - actual payment would be integrated later
      navigate("/dashboard");
    } else {
      redirectToLogin();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <AscendMark size={28} variant="color" />
            <span style={{
              fontFamily: "'ZalandoSans', sans-serif",
              fontSize: '13px',
              fontWeight: 400,
              letterSpacing: '3.5px',
              textTransform: 'uppercase',
              color: '#0A0A0A'
            }}>
              ASCEND
            </span>
          </a>
          <div className="flex items-center gap-3">
            {!isPending && !user && (
              <>
                <Button variant="ghost" onClick={redirectToLogin}>
                  Sign In
                </Button>
                <Button onClick={redirectToLogin} className="gap-2">
                  Get Started <ArrowRight className="w-4 h-4" />
                </Button>
              </>
            )}
            {user && (
              <Button onClick={() => navigate("/dashboard")} className="gap-2">
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            Simple, Transparent Pricing
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start free and upgrade when you're ready to supercharge your career with AI-powered optimization.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="px-6 pb-16">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Free Plan */}
          <Card className="relative overflow-hidden">
            <CardHeader className="pb-4">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-muted-foreground" />
              </div>
              <CardTitle className="text-2xl">Free</CardTitle>
              <CardDescription>Perfect for getting started</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">₹0</span>
                <span className="text-muted-foreground">/forever</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-8">
                <PlanFeature included>1 Profile</PlanFeature>
                <PlanFeature included>Basic resume creation</PlanFeature>
                <PlanFeature included>5 application tracks</PlanFeature>
                <PlanFeature included>5 job searches per day</PlanFeature>
                <PlanFeature>AI optimization</PlanFeature>
                <PlanFeature>Resume tailoring</PlanFeature>
                <PlanFeature>Match scoring</PlanFeature>
              </ul>
              <Button 
                variant="outline" 
                className="w-full"
                size="lg"
                onClick={handleGetStarted}
              >
                {user ? "Go to Dashboard" : "Get Started Free"}
              </Button>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className="relative overflow-hidden border-2 border-primary shadow-xl shadow-primary/10">
            {/* Most Popular Badge */}
            <div className="absolute top-4 right-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                <Crown className="w-3.5 h-3.5" />
                Most Popular
              </span>
            </div>
            
            <CardHeader className="pb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center mb-4">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-2xl">Pro</CardTitle>
              <CardDescription>For serious job seekers</CardDescription>
              
              {/* Pricing with toggle concept */}
              <div className="mt-4 space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">₹499</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg text-muted-foreground">or</span>
                  <span className="text-xl font-semibold">₹3,999</span>
                  <span className="text-muted-foreground">/year</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                    Save 33%
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-8">
                <PlanFeature included>Unlimited Profiles</PlanFeature>
                <PlanFeature included>AI optimization for all 5 platforms</PlanFeature>
                <PlanFeature included>AI-powered resume tailoring</PlanFeature>
                <PlanFeature included>Unlimited job searches</PlanFeature>
                <PlanFeature included>Unlimited application tracking</PlanFeature>
                <PlanFeature included>Match scoring & insights</PlanFeature>
                <PlanFeature included>Priority support</PlanFeature>
              </ul>
              <Button 
                className="w-full gap-2"
                size="lg"
                onClick={handleStartTrial}
              >
                Start 7-Day Free Trial <ArrowRight className="w-4 h-4" />
              </Button>
              <p className="text-center text-xs text-muted-foreground mt-3">
                No credit card required
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="px-6 pb-24">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Feature Comparison</h2>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-4 font-semibold">Feature</th>
                      <th className="text-center p-4 font-semibold w-32">Free</th>
                      <th className="text-center p-4 font-semibold w-32 bg-primary/5">
                        <span className="text-primary">Pro</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {features.map((feature, index) => (
                      <tr 
                        key={feature.name} 
                        className={index < features.length - 1 ? "border-b border-border" : ""}
                      >
                        <td className="p-4 text-sm">{feature.name}</td>
                        <td className="p-4 text-center">
                          <FeatureValue value={feature.free} />
                        </td>
                        <td className="p-4 text-center bg-primary/5">
                          <FeatureValue value={feature.pro} isPro />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 pb-24">
        <div className="max-w-3xl mx-auto text-center p-12 rounded-3xl bg-gradient-to-br from-primary/10 to-emerald-400/10 border border-primary/20">
          <h2 className="text-2xl font-bold mb-3">Ready to Accelerate Your Career?</h2>
          <p className="text-muted-foreground mb-6">
            Start your 7-day free trial today. No credit card required.
          </p>
          <Button size="lg" onClick={handleStartTrial} className="gap-2">
            Start Free Trial <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center text-muted-foreground text-sm">
          © 2025 Ascend by Coheron. Empowering careers worldwide.
        </div>
      </footer>
    </div>
  );
}

function PlanFeature({ children, included = false }: { children: React.ReactNode; included?: boolean }) {
  return (
    <li className={`flex items-center gap-3 ${!included ? 'text-muted-foreground' : ''}`}>
      {included ? (
        <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
      ) : (
        <X className="w-5 h-5 text-muted-foreground/50 flex-shrink-0" />
      )}
      <span className={!included ? 'line-through' : ''}>{children}</span>
    </li>
  );
}

function FeatureValue({ value, isPro = false }: { value: boolean | string; isPro?: boolean }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className={`w-5 h-5 mx-auto ${isPro ? 'text-primary' : 'text-emerald-500'}`} />
    ) : (
      <X className="w-5 h-5 mx-auto text-muted-foreground/40" />
    );
  }
  return (
    <span className={`text-sm ${isPro ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
      {value}
    </span>
  );
}
