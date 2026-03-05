import { registerHandler, startWorker } from "@/server/jobs/queue";
import { jdParserWorker } from "@/server/jobs/workers/jdParserWorker";
import { companyEnrichmentWorker } from "@/server/jobs/workers/companyEnrichmentWorker";
import { resumeAnalysisWorker } from "@/server/jobs/workers/resumeAnalysisWorker";
import { careerAnalysisWorker } from "@/server/jobs/workers/careerAnalysisWorker";

export function registerAllWorkers(): void {
  registerHandler("jd_parse", jdParserWorker);
  registerHandler("company_enrich", companyEnrichmentWorker);
  registerHandler("resume_analysis", resumeAnalysisWorker);
  registerHandler("career_analysis", careerAnalysisWorker);
}

export function startJobWorker(): void {
  registerAllWorkers();
  startWorker();
}
