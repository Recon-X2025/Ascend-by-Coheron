/**
 * API client: all backend communication goes through this module. No direct DB access from frontend.
 */
export {
  getAiJobStatus,
  enqueueParseJd,
  enqueueEnrichCompany,
  enqueueAnalyzeResume,
  enqueueCareerAnalysis,
  type ApiResponse,
  type AiJobStatus,
} from "@/lib/api-client";
