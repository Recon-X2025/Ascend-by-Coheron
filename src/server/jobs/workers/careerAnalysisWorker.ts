import { prisma } from "@/server/db/prisma";
import { completeWithJson, prompts } from "@/server/services/ai/anthropic";
import { careerRecommendationSchema } from "@/server/validation/schemas";
import type { JobPayload } from "@/server/jobs/queue";

export async function careerAnalysisWorker(payload: JobPayload): Promise<unknown> {
  const profileId = payload.profileId as number;
  const userId = payload.userId as string;
  if (!profileId || !userId) throw new Error("profileId and userId required");

  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    include: { skills: true, experiences: true, education: true },
  });
  if (!profile) throw new Error("Profile not found");

  const context = [
    profile.summary,
    profile.target_role,
    profile.target_industry,
    profile.career_goals,
    "Skills: " + profile.skills.map((s) => s.name).join(", "),
    "Experience: " + profile.experiences.map((e) => `${e.title} at ${e.company}`).join("; "),
    "Education: " + profile.education.map((e) => `${e.degree} at ${e.institution}`).join("; "),
  ].filter(Boolean).join("\n");

  const result = await completeWithJson(prompts.careerAnalysis(context), careerRecommendationSchema);

  await prisma.careerRecommendation.create({
    data: {
      user_id: userId,
      profile_id: profileId,
      recommendations: result.recommendations ?? undefined,
    },
  });

  if (result.skillGaps?.length) {
    await prisma.skillGap.createMany({
      data: result.skillGaps.map((g) => ({
        user_id: userId,
        profile_id: profileId,
        skill: g.skill,
        importance: g.importance ?? null,
        suggestion: g.suggestion ?? null,
      })),
    });
  }

  return result;
}
