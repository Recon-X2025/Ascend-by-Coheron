import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { 
  Briefcase, FileText, Search, Sparkles, ArrowRight, Loader2,
  Target, ClipboardList, MessageSquare, ChevronDown, ChevronUp, Star,
  Linkedin, Building2, Users, CheckCircle2, Zap, Shield
} from "lucide-react";
import AscendLogo from "@/components/ui/AscendLogo";

export default function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isPending, redirectToLogin } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [signOutToast, setSignOutToast] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check if user just signed out
    if (location.state?.signedOut) {
      setSignOutToast(true);
      // Clear the state so refresh doesn't show toast again
      window.history.replaceState({}, document.title);
      // Auto-hide toast after 3 seconds
      const timer = setTimeout(() => setSignOutToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  useEffect(() => {
    if (!isPending && user) {
      navigate("/dashboard");
    }
  }, [user, isPending, navigate]);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const features = [
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "AI Profile Optimization",
      description: "Our AI analyzes your experience and crafts compelling profiles optimized for each platform's algorithm. Stand out from the crowd with data-driven optimization.",
      color: "primary"
    },
    {
      icon: <Linkedin className="w-6 h-6" />,
      title: "Multi-Platform Publishing",
      description: "Generate tailored profiles for LinkedIn, Naukri, Indeed, Foundit, and Glassdoor from a single source. One click to optimize for all platforms.",
      color: "blue-500"
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "Smart Job Matching",
      description: "AI-powered matching scores show how well you fit each role. Focus your energy on opportunities where you'll actually succeed.",
      color: "amber-500"
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: "Resume Tailoring",
      description: "Automatically customize your resume for each position. Highlight relevant skills and experience that ATS systems want to see.",
      color: "violet-500"
    },
    {
      icon: <ClipboardList className="w-6 h-6" />,
      title: "Application Tracking",
      description: "Kanban-style tracker keeps every application organized. Set reminders, track stages, and never miss a follow-up again.",
      color: "rose-500"
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: "Interview Prep",
      description: "AI generates role-specific interview questions with STAR format answers. Practice with instant feedback to ace your interviews.",
      color: "teal-500"
    }
  ];

  const testimonials = [
    {
      name: "Priya S.",
      role: "Senior Software Engineer",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
      quote: "Ascend completely transformed my job search. The AI-optimized profiles got me 3x more recruiter responses. Landed my dream role within 6 weeks!",
      rating: 5
    },
    {
      name: "Rahul V.",
      role: "Product Manager",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      quote: "The resume tailoring feature is a game-changer. Every application felt personalized, and the match scoring helped me focus on roles I could actually get.",
      rating: 5
    },
    {
      name: "Ananya P.",
      role: "Data Scientist",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
      quote: "From uploading my resume to getting interview prep questions — Ascend handled everything. The application tracker alone saved me hours every week.",
      rating: 5
    }
  ];

  const faqs = [
    {
      question: "How does the AI profile optimization work?",
      answer: "Our AI analyzes your experience, skills, and career goals, then generates platform-specific profiles optimized for each job board's algorithm. It emphasizes keywords and formats that recruiters and ATS systems prioritize on LinkedIn, Naukri, Indeed, Foundit, and Glassdoor."
    },
    {
      question: "Is my data secure and private?",
      answer: "Absolutely. We use enterprise-grade encryption for all data in transit and at rest. Your information is never shared with third parties or used to train AI models. You can delete your account and all associated data at any time."
    },
    {
      question: "Can I use Ascend for free?",
      answer: "Yes! Our free tier lets you create one profile, search jobs, and access basic features. Upgrade to Pro for unlimited profiles, advanced AI optimization, priority job matching, and unlimited interview prep sessions."
    },
    {
      question: "How accurate is the job match scoring?",
      answer: "Our match scoring analyzes your skills, experience, and preferences against job requirements with over 90% accuracy. The AI considers factors like skill overlap, experience level, industry alignment, and location to give you a realistic picture of your chances."
    },
    {
      question: "Do I need to manually update each platform?",
      answer: "No — that's the beauty of Ascend. You maintain one master profile with us, and we generate optimized versions for each platform. Simply copy the generated content to your profiles, or use our guides to update them efficiently."
    }
  ];

  const companyLogos = [
    { name: "Google", color: "text-blue-600" },
    { name: "Microsoft", color: "text-emerald-600" },
    { name: "Amazon", color: "text-amber-600" },
    { name: "Flipkart", color: "text-yellow-500" },
    { name: "Infosys", color: "text-blue-500" },
    { name: "TCS", color: "text-slate-600" }
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-gradient-to-br from-primary/20 via-emerald-400/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl" />
        <div 
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center no-underline">
            <AscendLogo />
          </a>
          
          <div className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => scrollToSection("features")} 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </button>
            <button 
              onClick={() => navigate("/pricing")} 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </button>
            <button 
              onClick={() => scrollToSection("how-it-works")} 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              How it Works
            </button>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={redirectToLogin} className="hidden sm:inline-flex">
              Sign In
            </Button>
            <Button onClick={redirectToLogin} className="gap-2 shadow-lg shadow-primary/20">
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 pt-24">
        <section className="max-w-7xl mx-auto px-6 pt-16 pb-8">
          <div className={`text-center max-w-4xl mx-auto transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-emerald-400/10 text-primary text-sm font-medium mb-8 border border-primary/20">
              <Zap className="w-4 h-4" />
              AI-Powered Career Acceleration
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.08]">
              Your Career,{" "}
              <span className="bg-gradient-to-r from-primary via-emerald-500 to-teal-500 bg-clip-text text-transparent">
                Supercharged
              </span>
              <br className="hidden sm:block" />
              by AI
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Build optimized profiles for LinkedIn, Naukri, Indeed & more. 
              Find matching jobs, tailor resumes, and track applications — all in one platform.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={redirectToLogin} 
                className="text-lg px-8 py-6 gap-2 shadow-xl shadow-primary/25 bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90"
              >
                Get Started Free <ArrowRight className="w-5 h-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => scrollToSection("how-it-works")} 
                className="text-lg px-8 py-6"
              >
                See How It Works
              </Button>
            </div>
            
            <div className="flex items-center justify-center gap-6 mt-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                Free to start
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                No credit card
              </span>
              <span className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-primary" />
                100% secure
              </span>
            </div>
          </div>

          {/* Dashboard Mockup with 3D Effect */}
          <div className={`mt-16 transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
            <div className="relative max-w-5xl mx-auto px-4">
              {/* Glow effect behind */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-emerald-400/30 to-teal-500/30 blur-3xl opacity-40 scale-95" />
              
              <div 
                className="relative rounded-2xl overflow-hidden border border-border/60 bg-card shadow-2xl"
                style={{
                  transform: 'perspective(2000px) rotateX(8deg) rotateY(-2deg)',
                  transformOrigin: 'center center'
                }}
              >
                {/* Browser Chrome */}
                <div className="bg-muted/80 border-b border-border px-4 py-3 flex items-center gap-3">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="px-4 py-1.5 bg-background rounded-lg text-xs text-muted-foreground border border-border flex items-center gap-2">
                      <Shield className="w-3 h-3 text-green-500" />
                      ascend.coheron.in/dashboard
                    </div>
                  </div>
                </div>
                
                {/* Dashboard Content */}
                <div className="p-6 bg-background min-h-[420px] relative">
                  {/* Sidebar */}
                  <div className="absolute left-0 top-0 bottom-0 w-56 bg-sidebar border-r border-border p-4">
                    <div className="flex items-center gap-2 mb-8">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-emerald-400" />
                      <span className="font-bold text-sm text-sidebar-foreground">Ascend</span>
                    </div>
                    <div className="space-y-1">
                      {["Dashboard", "My Profiles", "AI Optimize", "Job Search", "Applications", "Interview Prep"].map((item, i) => (
                        <div 
                          key={item}
                          className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                            i === 0 
                              ? "bg-primary text-primary-foreground" 
                              : "text-sidebar-foreground/60 hover:bg-muted"
                          }`}
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Main Content */}
                  <div className="ml-60 space-y-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold">Welcome back, Priya! 👋</h2>
                        <p className="text-sm text-muted-foreground">Your career journey is looking great</p>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
                        <Sparkles className="w-4 h-4" />
                        Pro Plan
                      </div>
                    </div>
                    
                    {/* Stats Cards */}
                    <div className="grid grid-cols-4 gap-4">
                      {[
                        { label: "Profile Score", value: "94%", color: "primary", icon: <Target className="w-4 h-4" /> },
                        { label: "Jobs Matched", value: "147", color: "blue-500", icon: <Search className="w-4 h-4" /> },
                        { label: "Applications", value: "23", color: "violet-500", icon: <ClipboardList className="w-4 h-4" /> },
                        { label: "Interviews", value: "5", color: "amber-500", icon: <MessageSquare className="w-4 h-4" /> }
                      ].map((stat) => (
                        <div key={stat.label} className="p-4 rounded-xl border border-border bg-card">
                          <div className={`w-8 h-8 rounded-lg bg-${stat.color}/10 text-${stat.color} flex items-center justify-center mb-2`}>
                            {stat.icon}
                          </div>
                          <p className="text-2xl font-bold">{stat.value}</p>
                          <p className="text-xs text-muted-foreground">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                    
                    {/* Recent Activity */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl border border-border bg-card">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-primary" />
                          Recent Applications
                        </h3>
                        {[
                          { company: "Google", role: "Senior SWE", status: "Interview" },
                          { company: "Microsoft", role: "Staff Engineer", status: "Applied" }
                        ].map((app) => (
                          <div key={app.company} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                            <div>
                              <p className="text-sm font-medium">{app.role}</p>
                              <p className="text-xs text-muted-foreground">{app.company}</p>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              app.status === "Interview" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                            }`}>
                              {app.status}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="p-4 rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 to-emerald-500/5">
                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-primary" />
                          AI Recommendations
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3">3 new jobs match your profile perfectly</p>
                        <Button size="sm" className="w-full">View Matches</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof Bar */}
        <section className="py-16 border-y border-border/50 bg-muted/30">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
              <div className="flex items-center gap-3 text-center md:text-left">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">1,000+</p>
                  <p className="text-sm text-muted-foreground">Job Seekers</p>
                </div>
              </div>
              
              <div className="h-12 w-px bg-border hidden md:block" />
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">Trusted by professionals placed at</p>
                <div className="flex items-center justify-center gap-6 flex-wrap">
                  {companyLogos.map((company) => (
                    <div 
                      key={company.name}
                      className={`flex items-center gap-2 ${company.color} font-semibold text-lg opacity-70 hover:opacity-100 transition-opacity`}
                    >
                      <Building2 className="w-5 h-5" />
                      {company.name}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 scroll-mt-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <Sparkles className="w-4 h-4" />
                Powerful Features
              </div>
              <h2 className="text-4xl font-bold mb-4">Everything You Need to Land Your Dream Job</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                From AI-optimized profiles to interview preparation, we've got every step of your job search covered.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, i) => (
                <div 
                  key={feature.title}
                  className="group p-8 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1"
                >
                  <div 
                    className={`w-14 h-14 rounded-xl bg-${feature.color}/10 flex items-center justify-center mb-5 text-${feature.color} group-hover:scale-110 transition-transform`}
                    style={{ 
                      backgroundColor: i === 0 ? 'rgb(var(--primary) / 0.1)' : undefined,
                      color: i === 0 ? 'rgb(var(--primary))' : undefined
                    }}
                  >
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-24 bg-muted/30 border-y border-border scroll-mt-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <Zap className="w-4 h-4" />
                Simple Process
              </div>
              <h2 className="text-4xl font-bold mb-4">Get Started in 4 Easy Steps</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                From signup to landing interviews — we make every step seamless.
              </p>
            </div>
            
            <div className="grid md:grid-cols-4 gap-8 relative">
              {/* Connecting line */}
              <div className="hidden md:block absolute top-12 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20" />
              
              {[
                { number: 1, title: "Sign Up Free", description: "Create your account with Google in just 10 seconds", icon: <Users className="w-5 h-5" /> },
                { number: 2, title: "Build Your Profile", description: "Add experience, skills & goals — or upload your resume", icon: <FileText className="w-5 h-5" /> },
                { number: 3, title: "Get AI Optimized", description: "AI creates tailored profiles for every job platform", icon: <Sparkles className="w-5 h-5" /> },
                { number: 4, title: "Land Your Job", description: "Search, apply, track & prep for interviews", icon: <Target className="w-5 h-5" /> }
              ].map((step) => (
                <div key={step.number} className="relative text-center">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-emerald-500 text-white font-bold text-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/25 relative z-10">
                    {step.number}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 text-amber-600 text-sm font-medium mb-4">
                <Star className="w-4 h-4 fill-current" />
                Success Stories
              </div>
              <h2 className="text-4xl font-bold mb-4">Loved by Job Seekers</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Join thousands who've accelerated their careers with Ascend.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial) => (
                <div 
                  key={testimonial.name}
                  className="p-8 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all hover:shadow-xl"
                >
                  {/* Stars */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  
                  <p className="text-muted-foreground mb-6 leading-relaxed italic">
                    "{testimonial.quote}"
                  </p>
                  
                  <div className="flex items-center gap-4">
                    <img 
                      src={testimonial.avatar} 
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/20"
                    />
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-24 bg-muted/30 border-y border-border">
          <div className="max-w-3xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Frequently Asked Questions</h2>
              <p className="text-lg text-muted-foreground">
                Got questions? We've got answers.
              </p>
            </div>
            
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div 
                  key={index}
                  className="bg-card rounded-xl border border-border overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-muted/50 transition-colors"
                  >
                    <span className="font-semibold pr-4">{faq.question}</span>
                    {openFaq === index ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    )}
                  </button>
                  {openFaq === index && (
                    <div className="px-6 pb-5 text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-4xl mx-auto p-12 md:p-16 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
              {/* Background effects */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent" />
              
              <div className="relative z-10 text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Supercharge Your Career?</h2>
                <p className="text-white/70 mb-8 text-lg max-w-xl mx-auto">
                  Join 1,000+ professionals who've landed their dream jobs with Ascend. Start free today.
                </p>
                <Button 
                  size="lg" 
                  onClick={redirectToLogin} 
                  className="text-lg px-10 py-6 gap-2 bg-white text-slate-900 hover:bg-white/90"
                >
                  Get Started Free <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="mb-4">
                <AscendLogo />
              </div>
              <p className="text-muted-foreground max-w-md">
                AI-powered career platform helping professionals land their dream jobs faster. 
                Optimize profiles, find matching jobs, and ace interviews.
              </p>
            </div>
            
            {/* Links */}
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-3 text-muted-foreground">
                <li><button onClick={() => scrollToSection("features")} className="hover:text-foreground transition-colors">Features</button></li>
                <li><button onClick={() => navigate("/pricing")} className="hover:text-foreground transition-colors">Pricing</button></li>
                <li><button onClick={() => scrollToSection("how-it-works")} className="hover:text-foreground transition-colors">How it Works</button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-3 text-muted-foreground">
                <li><Link to="/privacy-policy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms-of-service" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
                <li><a href="mailto:legal@coheron.tech" className="hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© 2025 Coheron Tech Private Limited. All rights reserved.</p>
            <p>Made with ❤️ for job seekers in India</p>
          </div>
        </div>
      </footer>

      {/* Sign Out Success Toast */}
      {signOutToast && (
        <div className="fixed bottom-4 right-4 z-50 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom-2 fade-in duration-300">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm font-medium">You've been signed out successfully</span>
        </div>
      )}
    </div>
  );
}
