/**
 * API client layer: all server calls go through here. Credentials included for auth.
 */

const BASE = "";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

async function request<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  const json = (await res.json().catch(() => ({}))) as ApiResponse<T>;
  if (!res.ok) return { success: false, error: json.error ?? res.statusText };
  return json;
}

// —— AI job queue (async) ——
export interface AiJobStatus {
  id: string;
  type: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  result: unknown;
  error: string | null;
  completed_at: string | null;
}

export function getAiJobStatus(jobId: string): Promise<ApiResponse<AiJobStatus>> {
  return request<AiJobStatus>(`/api/ai/jobs/${jobId}`);
}

export function enqueueParseJd(body: { url?: string; rawText?: string }): Promise<ApiResponse<{ jobId: string }>> {
  return request<{ jobId: string }>("/api/ai/jobs/parse-jd", { method: "POST", body: JSON.stringify(body) });
}

export function enqueueEnrichCompany(body: { domain: string; companyName?: string }): Promise<ApiResponse<{ jobId: string }>> {
  return request<{ jobId: string }>("/api/ai/jobs/enrich-company", { method: "POST", body: JSON.stringify(body) });
}

export function enqueueAnalyzeResume(body: { profileId: number; resumeText?: string; resumeKey?: string }): Promise<ApiResponse<{ jobId: string }>> {
  return request<{ jobId: string }>("/api/ai/jobs/analyze-resume", { method: "POST", body: JSON.stringify(body) });
}

export function enqueueCareerAnalysis(body: { profileId: number }): Promise<ApiResponse<{ jobId: string }>> {
  return request<{ jobId: string }>("/api/ai/jobs/career-analysis", { method: "POST", body: JSON.stringify(body) });
}
