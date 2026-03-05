import { z } from "zod";

export const ExperienceSchema = z.object({
  id: z.string(),
  title: z.string(),
  company: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  current: z.boolean(),
  description: z.string(),
});

export const EducationSchema = z.object({
  id: z.string(),
  degree: z.string(),
  institution: z.string(),
  year: z.string(),
});

export const ProfileSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  location: z.string().optional(),
  headline: z.string().optional(),
  summary: z.string().optional(),
  linkedinUrl: z.string().optional(),
  resumeKey: z.string().optional(),
  experiences: z.array(ExperienceSchema),
  education: z.array(EducationSchema),
  skills: z.array(z.string()),
  targetRole: z.string().optional(),
  targetIndustry: z.string().optional(),
  careerGoals: z.string().optional(),
});

export type Experience = z.infer<typeof ExperienceSchema>;
export type Education = z.infer<typeof EducationSchema>;
export type ProfileData = z.infer<typeof ProfileSchema>;

export interface Application {
  id: number;
  profile_id: number;
  job_title: string;
  company: string;
  job_url: string | null;
  source: string | null;
  location: string | null;
  salary_range: string | null;
  status: "applied" | "interviewing" | "offered" | "rejected" | "accepted";
  notes: string | null;
  applied_at: string;
  last_activity_at: string;
  created_at: string;
  updated_at: string;
}

export interface ApplicationStats {
  total: number;
  applied: number;
  interviewing: number;
  offered: number;
  rejected: number;
  accepted: number;
}

export interface ProfileResponse {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  location: string | null;
  headline: string | null;
  summary: string | null;
  linkedinUrl: string | null;
  resumeKey: string | null;
  targetRole: string | null;
  targetIndustry: string | null;
  careerGoals: string | null;
  experiences: Experience[];
  education: Education[];
  skills: string[];
  createdAt: string;
  updatedAt: string;
}
