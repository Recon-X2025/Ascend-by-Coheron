/**
 * React Query hooks for async AI jobs: enqueue and poll status.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAiJobStatus,
  enqueueParseJd,
  enqueueEnrichCompany,
  enqueueAnalyzeResume,
  enqueueCareerAnalysis,
  type AiJobStatus,
} from "@/react-app/lib/api-client";

const JOB_KEY = "aiJob";

export function useAiJobStatus(jobId: string | null, options?: { enabled?: boolean; refetchInterval?: number }) {
  return useQuery({
    queryKey: [JOB_KEY, jobId],
    queryFn: () => getAiJobStatus(jobId!).then((r) => (r.success && r.data ? r.data : Promise.reject(new Error(r.error ?? "Failed")))),
    enabled: !!jobId && (options?.enabled ?? true),
    refetchInterval: (query) => {
      const data = query.state.data as AiJobStatus | undefined;
      if (data?.status === "COMPLETED" || data?.status === "FAILED") return false;
      return options?.refetchInterval ?? 2000;
    },
  });
}

export function useEnqueueParseJd() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { url?: string; rawText?: string }) => enqueueParseJd(body).then((r) => (r.success && r.data ? r.data.jobId : Promise.reject(new Error(r.error ?? "Failed")))),
    onSuccess: (jobId) => qc.invalidateQueries({ queryKey: [JOB_KEY, jobId] }),
  });
}

export function useEnqueueEnrichCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { domain: string; companyName?: string }) => enqueueEnrichCompany(body).then((r) => (r.success && r.data ? r.data.jobId : Promise.reject(new Error(r.error ?? "Failed")))),
    onSuccess: (jobId) => qc.invalidateQueries({ queryKey: [JOB_KEY, jobId] }),
  });
}

export function useEnqueueAnalyzeResume() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { profileId: number; resumeText?: string; resumeKey?: string }) =>
      enqueueAnalyzeResume(body).then((r) => (r.success && r.data ? r.data.jobId : Promise.reject(new Error(r.error ?? "Failed")))),
    onSuccess: (jobId) => qc.invalidateQueries({ queryKey: [JOB_KEY, jobId] }),
  });
}

export function useEnqueueCareerAnalysis() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { profileId: number }) => enqueueCareerAnalysis(body).then((r) => (r.success && r.data ? r.data.jobId : Promise.reject(new Error(r.error ?? "Failed")))),
    onSuccess: (jobId) => qc.invalidateQueries({ queryKey: [JOB_KEY, jobId] }),
  });
}
