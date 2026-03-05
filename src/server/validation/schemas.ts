/**
 * Zod schemas for API input validation and AI output validation.
 */
import { z } from "zod";

// —— API input ——
export const jobEnqueueSchema = z.object({
  url: z.string().url().optional(),
  rawText: z.string().min(1).optional(),
}).refine((d) => d.url ?? d.rawText, { message: "Provide url or rawText" });

export const companyEnrichSchema = z.object({
  domain: z.string().min(1),
  companyName: z.string().optional(),
});

export const resumeAnalysisSchema = z.object({
  profileId: z.number().int().positive(),
  resumeText: z.string().min(1).optional(),
  resumeKey: z.string().min(1).optional(),
}).refine((d) => d.resumeText ?? d.resumeKey, { message: "Provide resumeText or resumeKey" });

export const careerAnalysisSchema = z.object({
  profileId: z.number().int().positive(),
});

export const aiJobIdParamSchema = z.object({ id: z.string().min(1) });

// —— AI output (for parsing/storing) ——
export const parsedJDSchema = z.object({
  title: z.string(),
  company: z.string().optional(),
  location: z.string().optional(),
  salary: z.string().optional(),
  description: z.string(),
  requirements: z.array(z.string()).optional(),
  responsibilities: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
});

export const companyEnrichmentSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  industry: z.string().optional(),
  size: z.string().optional(),
  website: z.string().url().optional(),
  linkedin: z.string().url().optional(),
});

export const parsedResumeSchema = z.object({
  skills: z.array(z.string()).optional(),
  experience: z.array(z.object({
    title: z.string(),
    company: z.string(),
    duration: z.string().optional(),
    description: z.string().optional(),
  })).optional(),
  education: z.array(z.object({
    degree: z.string(),
    institution: z.string(),
    year: z.string().optional(),
  })).optional(),
  summary: z.string().optional(),
});

export const careerRecommendationSchema = z.object({
  recommendations: z.array(z.string()).optional(),
  skillGaps: z.array(z.object({
    skill: z.string(),
    importance: z.string().optional(),
    suggestion: z.string().optional(),
  })).optional(),
});

export type ParsedJD = z.infer<typeof parsedJDSchema>;
export type CompanyEnrichment = z.infer<typeof companyEnrichmentSchema>;
export type ParsedResume = z.infer<typeof parsedResumeSchema>;
export type CareerRecommendation = z.infer<typeof careerRecommendationSchema>;
