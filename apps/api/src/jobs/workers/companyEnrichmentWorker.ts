import { prisma } from "../../db/prisma.js";
import { completeWithJson, prompts } from "@ascend/ai";
import { scrape } from "@ascend/scraping";
import { companyEnrichmentSchema } from "@ascend/validation";
import type { JobPayload } from "../queue.js";

export async function companyEnrichmentWorker(payload: JobPayload): Promise<unknown> {
  const domain = (payload.domain as string)?.replace(/^www\./, "").toLowerCase();
  const companyName = payload.companyName as string | undefined;
  if (!domain) throw new Error("domain is required");

  const pageContent = (await scrape(`https://${domain}`)).markdown ?? "";

  const enriched = await completeWithJson(prompts.enrichCompany(domain, pageContent), companyEnrichmentSchema);

  const company = await prisma.company.upsert({
    where: { domain },
    create: {
      domain,
      name: companyName ?? enriched.name ?? null,
      description: enriched.description ?? null,
      industry: enriched.industry ?? null,
      size: enriched.size ?? null,
      website: enriched.website ?? null,
      linkedin: enriched.linkedin ?? null,
      raw_content: pageContent.slice(0, 50000) || null,
    },
    update: {
      name: companyName ?? enriched.name ?? undefined,
      description: enriched.description ?? undefined,
      industry: enriched.industry ?? undefined,
      size: enriched.size ?? undefined,
      website: enriched.website ?? undefined,
      linkedin: enriched.linkedin ?? undefined,
      raw_content: pageContent.slice(0, 50000) || undefined,
      updated_at: new Date(),
    },
  });

  return { companyId: company.id, ...enriched };
}
