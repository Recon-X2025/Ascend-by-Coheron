import { useNavigate } from "react-router";
import { MessageSquare, ArrowRight, Briefcase, Calendar, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import SidebarLayout from "@/components/SidebarLayout";

export default function InterviewPrepLanding() {
  const navigate = useNavigate();

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-background">
        <main className="max-w-3xl mx-auto px-6 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-emerald-400/20 flex items-center justify-center mx-auto mb-6">
              <MessageSquare className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-3">Interview Prep</h1>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              AI-powered interview preparation tailored to your target role and experience
            </p>
          </div>

          {/* Empty State Card */}
          <Card className="border-2 border-dashed border-primary/20 bg-gradient-to-br from-primary/5 to-emerald-400/5">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
                <Briefcase className="w-8 h-8 text-amber-600" />
              </div>
              <h2 className="text-xl font-semibold mb-3">Select a Job from Your Applications</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                To start your interview prep session, go to your Applications and select a job you're interviewing for. 
                We'll generate personalized questions based on the role and your experience.
              </p>
              <Button onClick={() => navigate("/applications")} className="gap-2">
                Go to Applications
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>

          {/* How It Works */}
          <div className="mt-12">
            <h3 className="text-lg font-semibold mb-6 text-center">How It Works</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-lg font-bold text-primary">1</span>
                </div>
                <h4 className="font-medium mb-2">Track a Job</h4>
                <p className="text-sm text-muted-foreground">
                  Add jobs to your application tracker from the Job Search
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-lg font-bold text-primary">2</span>
                </div>
                <h4 className="font-medium mb-2">Start Prep Session</h4>
                <p className="text-sm text-muted-foreground">
                  Click "Prep Interview" on any application to generate questions
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-lg font-bold text-primary">3</span>
                </div>
                <h4 className="font-medium mb-2">Practice & Get Feedback</h4>
                <p className="text-sm text-muted-foreground">
                  Answer questions using STAR method and get AI feedback
                </p>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="mt-12 grid md:grid-cols-2 gap-4">
            <Card className="hover:border-primary/30 transition-colors">
              <CardContent className="p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium mb-1">10 Tailored Questions</h4>
                  <p className="text-sm text-muted-foreground">
                    Questions generated specifically for the role and company
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:border-primary/30 transition-colors">
              <CardContent className="p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <ChevronRight className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium mb-1">STAR Method Guidance</h4>
                  <p className="text-sm text-muted-foreground">
                    Suggested answers using Situation, Task, Action, Result
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:border-primary/30 transition-colors">
              <CardContent className="p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h4 className="font-medium mb-1">Practice Mode</h4>
                  <p className="text-sm text-muted-foreground">
                    Type your answers and get real-time AI feedback
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="hover:border-primary/30 transition-colors">
              <CardContent className="p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                  <Briefcase className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium mb-1">Score & Improve</h4>
                  <p className="text-sm text-muted-foreground">
                    Get scored on your responses with improvement tips
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarLayout>
  );
}
