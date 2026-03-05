import { registerHandler, startWorker } from "../queue.js";
import { jdParserWorker } from "./jdParserWorker.js";
import { companyEnrichmentWorker } from "./companyEnrichmentWorker.js";
import { resumeAnalysisWorker } from "./resumeAnalysisWorker.js";
import { careerAnalysisWorker } from "./careerAnalysisWorker.js";

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
