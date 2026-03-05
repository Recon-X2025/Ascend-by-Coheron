import { prisma } from "../../db/prisma.js";
import { completeWithJson, prompts } from "@ascend/ai";
import { parsedJDSchema } from "@ascend/validation";
import type { JobPayload } from "../queue.js";

export async function jdParserWorker(payload: JobPayload): Promise<unknown> {
  const url = payload.url as string | undefined;
  const rawText = payload.rawText as string | undefined;
  const text = rawText ?? (url ? await fetch(url).then((r) => r.text()) : "");
  if (!text?.trim()) throw new Error("No JD text or URL provided");

  const parsed = await completeWithJson(prompts.parseJobDescription(text), parsedJDSchema);

  const jd = await prisma.jobDescription.create({
    data: {
      source_url: url ?? null,
      raw_text: rawText ?? null,
      title: parsed.title ?? null,
      company_name: parsed.company ?? null,
      location: parsed.location ?? null,
      salary: parsed.salary ?? null,
      description: parsed.description ?? null,
      requirements: parsed.requirements ? (parsed.requirements as object) : undefined,
      responsibilities: parsed.responsibilities ? (parsed.responsibilities as object) : undefined,
      skills: parsed.skills ? (parsed.skills as object) : undefined,
    },
  });

  return { jobDescriptionId: jd.id, ...parsed };
}
