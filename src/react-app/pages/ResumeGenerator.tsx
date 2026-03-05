import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/react-app/components/ui/button";
import { ArrowLeft, Download, Printer, Sparkles, Lightbulb, Mail, Phone, MapPin } from "lucide-react";
import SidebarLayout from "@/react-app/components/SidebarLayout";


interface GeneratedResume {
  name: string;
  contact: {
    email: string;
    phone: string;
    location: string;
  };
  headline: string;
  summary: string;
  experiences: Array<{
    title: string;
    company: string;
    location: string;
    startDate: string;
    endDate: string;
    highlights: string[];
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year: string;
    honors?: string;
  }>;
  skills: {
    technical?: string[];
    professional?: string[];
    tools?: string[];
  };
  certifications?: string[];
  improvements?: string[];
}

export default function ResumeGenerator() {
  const navigate = useNavigate();
  const [resume, setResume] = useState<GeneratedResume | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const resumeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    generateResume();
  }, []);

  const generateResume = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/profiles/me/generate-resume`, {
        method: "POST",
        credentials: "include",
      });
      // Check for server errors that return HTML instead of JSON
      if (res.status >= 500 || !res.headers.get("Content-Type")?.includes("application/json")) {
        throw new Error("Service temporarily unavailable. Please try again.");
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResume(data.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to generate resume");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Trigger print dialog with PDF option
    window.print();
  };

  if (loading) {
    return (
      <SidebarLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-lg font-medium">Generating your optimized resume...</p>
            <p className="text-muted-foreground text-sm mt-2">Our AI is crafting a professional resume from your profile</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (error) {
    return (
      <SidebarLayout>
        <div className="min-h-screen bg-background p-8">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={generateResume}>Try Again</Button>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (!resume) return null;

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-background">
      {/* Controls - hidden in print */}
      <div className="print:hidden sticky top-0 bg-background/95 backdrop-blur border-b border-border z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={generateResume} className="gap-2">
              <Sparkles className="w-4 h-4" /> Regenerate
            </Button>
            <Button variant="outline" onClick={handlePrint} className="gap-2">
              <Printer className="w-4 h-4" /> Print
            </Button>
            <Button onClick={handleDownload} className="gap-2">
              <Download className="w-4 h-4" /> Download PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 print:p-0">
        {/* AI Suggestions - hidden in print */}
        {resume.improvements && resume.improvements.length > 0 && (
          <div className="print:hidden mb-6 bg-primary/5 border border-primary/20 rounded-xl p-5">
            <div className="flex gap-3">
              <Lightbulb className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-primary mb-2">Suggestions to Improve Your Resume</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {resume.improvements.map((tip, i) => (
                    <li key={i}>• {tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Resume Document */}
        <div 
          ref={resumeRef}
          className="bg-white text-black rounded-lg shadow-lg print:shadow-none print:rounded-none"
          style={{ padding: "48px" }}
        >
          {/* Header */}
          <header className="border-b-2 border-gray-800 pb-4 mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-1">{resume.name}</h1>
            <p className="text-lg text-gray-600 mb-3">{resume.headline}</p>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              {resume.contact.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4" /> {resume.contact.email}
                </span>
              )}
              {resume.contact.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4" /> {resume.contact.phone}
                </span>
              )}
              {resume.contact.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" /> {resume.contact.location}
                </span>
              )}
            </div>
          </header>

          {/* Summary */}
          {resume.summary && (
            <section className="mb-6">
              <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide mb-2">Professional Summary</h2>
              <p className="text-gray-700 leading-relaxed">{resume.summary}</p>
            </section>
          )}

          {/* Experience */}
          {resume.experiences && resume.experiences.length > 0 && (
            <section className="mb-6">
              <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide mb-3">Professional Experience</h2>
              <div className="space-y-4">
                {resume.experiences.map((exp, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <h3 className="font-semibold text-gray-900">{exp.title}</h3>
                        <p className="text-gray-600">{exp.company}{exp.location ? ` • ${exp.location}` : ""}</p>
                      </div>
                      <span className="text-sm text-gray-500 whitespace-nowrap">
                        {exp.startDate} – {exp.endDate}
                      </span>
                    </div>
                    {exp.highlights && exp.highlights.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {exp.highlights.map((highlight, j) => (
                          <li key={j} className="text-gray-700 text-sm pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-gray-400">
                            {highlight}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Education */}
          {resume.education && resume.education.length > 0 && (
            <section className="mb-6">
              <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide mb-3">Education</h2>
              <div className="space-y-2">
                {resume.education.map((edu, i) => (
                  <div key={i} className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">{edu.degree}</h3>
                      <p className="text-gray-600">{edu.institution}</p>
                      {edu.honors && <p className="text-sm text-gray-500">{edu.honors}</p>}
                    </div>
                    <span className="text-sm text-gray-500">{edu.year}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Skills */}
          {resume.skills && (
            <section className="mb-6">
              <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide mb-3">Skills</h2>
              <div className="space-y-2">
                {resume.skills.technical && resume.skills.technical.length > 0 && (
                  <p className="text-sm">
                    <span className="font-semibold text-gray-900">Technical:</span>{" "}
                    <span className="text-gray-700">{resume.skills.technical.join(", ")}</span>
                  </p>
                )}
                {resume.skills.professional && resume.skills.professional.length > 0 && (
                  <p className="text-sm">
                    <span className="font-semibold text-gray-900">Professional:</span>{" "}
                    <span className="text-gray-700">{resume.skills.professional.join(", ")}</span>
                  </p>
                )}
                {resume.skills.tools && resume.skills.tools.length > 0 && (
                  <p className="text-sm">
                    <span className="font-semibold text-gray-900">Tools & Technologies:</span>{" "}
                    <span className="text-gray-700">{resume.skills.tools.join(", ")}</span>
                  </p>
                )}
              </div>
            </section>
          )}

          {/* Certifications */}
          {resume.certifications && resume.certifications.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide mb-2">Certifications</h2>
              <ul className="text-gray-700 text-sm space-y-1">
                {resume.certifications.map((cert, i) => (
                  <li key={i}>• {cert}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          [data-resume], [data-resume] * {
            visibility: visible;
          }
        }
      `}</style>
      </div>
    </SidebarLayout>
  );
}
