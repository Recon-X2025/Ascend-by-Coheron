/**
 * Profile completeness calculation and hook. Kept in a separate file so
 * ProfileCompleteness.tsx only exports the component (react-refresh/only-export-components).
 */

import { useState, useEffect } from "react";
import { User, FileText, Briefcase, GraduationCap, Wrench, Target, Linkedin } from "lucide-react";

export interface ProfileData {
  id: number;
  full_name: string;
  headline: string | null;
  summary: string | null;
  linkedin_url: string | null;
  career_goals: string | null;
  experiences: Array<{ id: number }>;
  education: Array<{ id: number }>;
  skills: Array<{ name: string }>;
}

export interface CompletenessItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  weight: number;
  completed: boolean;
  field: string;
}

export function calculateCompleteness(profile: ProfileData): { score: number; items: CompletenessItem[] } {
  const items: CompletenessItem[] = [
    { key: "name", label: "Add your name", icon: <User className="w-4 h-4" />, weight: 5, completed: Boolean(profile.full_name?.trim()), field: "personal" },
    { key: "headline", label: "Write a headline", icon: <FileText className="w-4 h-4" />, weight: 10, completed: Boolean(profile.headline?.trim()), field: "personal" },
    { key: "summary", label: "Add a professional summary", icon: <FileText className="w-4 h-4" />, weight: 15, completed: Boolean(profile.summary?.trim() && profile.summary.length > 20), field: "personal" },
    { key: "experience", label: "Add at least 1 work experience", icon: <Briefcase className="w-4 h-4" />, weight: 20, completed: (profile.experiences?.length ?? 0) >= 1, field: "experience" },
    { key: "education", label: "Add education details", icon: <GraduationCap className="w-4 h-4" />, weight: 10, completed: (profile.education?.length ?? 0) >= 1, field: "education" },
    { key: "skills", label: "Add at least 5 skills", icon: <Wrench className="w-4 h-4" />, weight: 15, completed: (profile.skills?.length ?? 0) >= 5, field: "skills" },
    { key: "careerGoals", label: "Define your career goals", icon: <Target className="w-4 h-4" />, weight: 15, completed: Boolean(profile.career_goals?.trim() && profile.career_goals.length > 10), field: "aspirations" },
    { key: "linkedin", label: "Add your LinkedIn URL", icon: <Linkedin className="w-4 h-4" />, weight: 10, completed: Boolean(profile.linkedin_url?.trim()), field: "personal" },
  ];
  const score = items.reduce((acc, item) => acc + (item.completed ? item.weight : 0), 0);
  return { score, items };
}

export function useProfileCompleteness(profileId: number) {
  const [score, setScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAndCalculate = async () => {
      try {
        const res = await fetch(`/api/profiles/${profileId}`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          const { score: s } = calculateCompleteness(data);
          setScore(s);
        }
      } catch (error) {
        console.error("Error calculating completeness:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAndCalculate();
  }, [profileId]);

  return { score, loading };
}
