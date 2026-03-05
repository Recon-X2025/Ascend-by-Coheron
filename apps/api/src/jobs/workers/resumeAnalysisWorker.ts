import { prisma } from "../../db/prisma.js";
import { completeWithJson, prompts } from "@ascend/ai";
import { parsedResumeSchema } from "@ascend/validation";
import type { JobPayload } from "../queue.js";
import { getEnv } from "../../utils/get-app-env.js";

export async function resumeAnalysisWorker(payload: JobPayload): Promise<unknown> {
  const profileId = payload.profileId as number;
  const userId = payload.userId as string;
  let resumeText = payload.resumeText as string | undefined;
  const resumeKey = payload.resumeKey as string | undefined;

  if (!resumeText && resumeKey) {
    const object = await getEnv().R2_BUCKET.get(resumeKey);
    if (!object) throw new Error("Resume file not found");
    const buf = await object.arrayBuffer();
    resumeText = new TextDecoder().decode(buf);
  }
  if (!resumeText?.trim()) throw new Error("No resume text or key provided");

  const parsed = await completeWithJson(prompts.parseResume(resumeText), parsedResumeSchema);

  const resume = await prisma.resume.create({
    data: {
      user_id: userId,
      profile_id: profileId,
      storage_key: resumeKey ?? null,
      parsed_json: parsed as object,
    },
  });

  return { resumeId: resume.id, ...parsed };
}
