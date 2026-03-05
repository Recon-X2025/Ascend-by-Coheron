/**
 * Hono app: API routes and middleware.
 * Exported for the Node.js server (src/server.ts). Uses getEnv() and process.env (no c.env bindings).
 * Auth: NextAuth.js at /api/auth/* (Google OAuth, JWT session). c.get("user") is the NextAuth session user (from JWT).
 * In production, serves the built SPA from dist/ (static assets + index.html fallback).
 */
import { Hono } from "hono";
import { cors } from "hono/cors";
import { getCookie, deleteCookie } from "hono/cookie";
import type { HttpBindings, Http2Bindings } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import path from "path";
import fs from "fs";
import Anthropic from "@anthropic-ai/sdk";
import Firecrawl from "@mendable/firecrawl-js";
import * as mammoth from "mammoth";
import { ProfileSchema, ProfileResponse } from "@/shared/types";
import NextAuth from "next-auth/next";
import { decode } from "next-auth/jwt";
import { RESPONSE_ALREADY_SENT } from "@hono/node-server/utils/response";
import { authOptions } from "@/node/auth";
import { getEnv } from "@/node/get-app-env";

type AuthUser = { id: string; name?: string | null; email?: string | null; image?: string | null };
/** Node server: Bindings = HttpBindings | Http2Bindings (incoming/outgoing); no ExecutionContext. */
type Env = { Bindings: HttpBindings | Http2Bindings; Variables: { user: AuthUser } };
const app = new Hono<Env>();

// CORS: allow browser requests from frontend (Node.js compatible)
app.use(
  "*",
  cors({
    origin: process.env.CORS_ORIGIN ?? "*",
    allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Simple health check
app.get("/api/health", (c) => {
  return c.json(
    {
      status: "ok",
      service: "ascend-worker",
    },
    200,
  );
});

// NextAuth.js: GET/POST /api/auth/[...nextauth] — session, signin, callback, signout, csrf, providers.
// Uses Node bindings (incoming/outgoing) so NextAuth can run; response sent by NextAuth, then RESPONSE_ALREADY_SENT.
async function nextAuthHandler(c: import("hono").Context<Env>) {
  const { incoming, outgoing } = c.env;
  if (!incoming || !outgoing) {
    return c.json({ error: "Auth not available" }, 500);
  }
  // NextAuth 4 typings expect NextApiRequest/NextApiResponse; Node adapter accepts IncomingMessage/ServerResponse
  await (NextAuth as (req: unknown, res: unknown, options: typeof authOptions) => Promise<void>)(
    incoming,
    outgoing,
    authOptions
  );
  return RESPONSE_ALREADY_SENT;
}
app.on(["GET", "POST"], "/api/auth", nextAuthHandler);
app.on(["GET", "POST"], "/api/auth/:path{.+}", nextAuthHandler);

const NEXTAUTH_SESSION_COOKIE = "next-auth.session-token";
const NEXTAUTH_SESSION_COOKIE_SECURE = "__Secure-next-auth.session-token";

/** Require auth: read NextAuth JWT from cookie, verify with NEXTAUTH_SECRET, set user on context; 401 if invalid. */
async function requireAuth(
  c: import("hono").Context<Env>,
  next: () => Promise<void>
) {
  const token =
    getCookie(c, NEXTAUTH_SESSION_COOKIE) ??
    getCookie(c, NEXTAUTH_SESSION_COOKIE_SECURE);
  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
  if (!secret) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  try {
    const payload = await decode({ token, secret });
    if (!payload?.sub) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const user: AuthUser = {
      id: (payload.id as string) ?? payload.sub,
      name: payload.name ?? null,
      email: payload.email ?? null,
      image: payload.picture ?? null,
    };
    c.set("user", user);
    await next();
  } catch {
    return c.json({ error: "Unauthorized" }, 401);
  }
}

// Helper function to extract and parse JSON from Claude responses (handles various formats)
const OPTIMIZE_PLATFORM_IDS = ["linkedin", "naukri", "indeed", "foundit", "glassdoor"] as const;

/** Normalize optimize API response so top-level keys are always lowercase platform ids. Unwraps nested shapes (e.g. AI returns { platforms: { linkedin: ... } }). */
function normalizeOptimizedProfilesKeys(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object") return {};
  let obj = raw as Record<string, unknown>;
  const topKeys = Object.keys(obj);
  // If top-level has no platform key but has a single object value, unwrap (e.g. { "optimizedProfiles": { linkedin: ... } })
  const platformKeys = topKeys.filter((k) => OPTIMIZE_PLATFORM_IDS.includes(k.toLowerCase() as (typeof OPTIMIZE_PLATFORM_IDS)[number]));
  if (platformKeys.length === 0 && topKeys.length > 0) {
    const firstVal = obj[topKeys[0]];
    if (firstVal && typeof firstVal === "object" && !Array.isArray(firstVal)) {
      obj = firstVal as Record<string, unknown>;
    }
  }
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    const lower = key.toLowerCase();
    if (OPTIMIZE_PLATFORM_IDS.includes(lower as (typeof OPTIMIZE_PLATFORM_IDS)[number])) out[lower] = obj[key];
  }
  return out;
}


/** Strip markdown code fences (```json ... ``` or ``` ... ```) so JSON can be parsed. */
function stripMarkdownJson(text: string): string {
  let s = text.trim();
  const openFence = s.match(/^```(?:json)?\s*\n?/i);
  if (openFence) {
    s = s.slice(openFence[0].length);
    const closeIdx = s.indexOf("```");
    if (closeIdx !== -1) s = s.slice(0, closeIdx).trim();
  }
  return s.trim();
}

function extractJSON(text: string): unknown {
  const jsonString = stripMarkdownJson(text);

  // Try 1: Direct parse (cleanest case)
  try {
    return JSON.parse(jsonString);
  } catch {
    // fall through to fallbacks
  }

  // Try 2: Extract from markdown code blocks (greedy match for last ```)
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]+)\s*```\s*$/);
  if (codeBlockMatch) {
    try {
      const extracted = codeBlockMatch[1].trim();
      return JSON.parse(extracted);
    } catch {
      // fall through
    }
  }

  // Try 3: Find JSON object by looking for first { and last }
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    try {
      const extracted = text.substring(firstBrace, lastBrace + 1);
      return JSON.parse(extracted);
    } catch {
      // fall through
    }
  }

  // Try 4: Find JSON array by looking for first [ and last ]
  const firstBracket = text.indexOf('[');
  const lastBracket = text.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    try {
      return JSON.parse(text.substring(firstBracket, lastBracket + 1));
    } catch {
      // fall through
    }
  }

  console.error("[extractJSON] All methods failed");
  console.error("[extractJSON] Text length:", jsonString.length);
  console.error("[extractJSON] First 200 chars:", jsonString.substring(0, 200));
  console.error("[extractJSON] Last 200 chars:", jsonString.substring(jsonString.length - 200));
  return null;
}

// Authenticated user from NextAuth JWT (requireAuth sets c.set("user")).
app.get("/api/users/me", requireAuth, async (c) => {
  return c.json(c.get("user"));
});

// Clear NextAuth session cookie(s); client can also use POST /api/auth/signout.
app.get("/api/logout", (c) => {
  deleteCookie(c, NEXTAUTH_SESSION_COOKIE, { path: "/" });
  deleteCookie(c, NEXTAUTH_SESSION_COOKIE_SECURE, { path: "/" });
  return c.json({ success: true }, 200);
});

// EULA endpoints
const CURRENT_EULA_VERSION = "1.0";

app.get("/api/eula/status", requireAuth, async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const userId = user.id;

  const acceptance = await getEnv().DB.eulaAcceptance.findFirst({
    where: { user_id: userId, eula_version: CURRENT_EULA_VERSION },
    orderBy: { accepted_at: "desc" },
  });

  return c.json({
    accepted: !!acceptance,
    currentVersion: CURRENT_EULA_VERSION,
    acceptedAt: acceptance?.accepted_at?.toISOString() ?? null,
    marketingConsent: acceptance?.marketing_consent === 1,
    ageVerified: acceptance?.age_verified === 1,
    ageVerifiedAt: acceptance?.age_verified_at?.toISOString() ?? null,
  });
});

app.post("/api/eula/accept", requireAuth, async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const userId = user.id;
  const { ageVerified, termsAccepted, dataUsageAccepted, marketingConsent } = await c.req.json();
  
  if (!ageVerified) {
    return c.json({ error: "Age verification is required. Ascend by Coheron is currently available to users aged 18 and above." }, 400);
  }
  
  if (!termsAccepted || !dataUsageAccepted) {
    return c.json({ error: "All mandatory checkboxes must be accepted" }, 400);
  }
  
  const userAgent = c.req.header("user-agent") || null;
  const ipAddress = c.req.header("cf-connecting-ip") || c.req.header("x-forwarded-for") || null;
  const now = new Date();

  await getEnv().DB.eulaAcceptance.create({
    data: {
      user_id: userId,
      eula_version: CURRENT_EULA_VERSION,
      marketing_consent: marketingConsent ? 1 : 0,
      ip_address: ipAddress,
      user_agent: userAgent,
      age_verified: ageVerified ? 1 : 0,
      age_verified_at: now,
    },
  });

  return c.json({
    success: true,
    version: CURRENT_EULA_VERSION,
    acceptedAt: now.toISOString(),
    ageVerifiedAt: now.toISOString(),
  });
});

// Data & Privacy endpoints
app.get("/api/data-privacy/status", requireAuth, async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const userId = user.id;

  const [consent, eula, profileCount, applicationCount, pendingExport, pendingDeletion] =
    await Promise.all([
      getEnv().DB.dataConsentPreference.findFirst({
        where: { user_id: userId },
        orderBy: { updated_at: "desc" },
      }),
      getEnv().DB.eulaAcceptance.findFirst({
        where: { user_id: userId },
        orderBy: { accepted_at: "desc" },
      }),
      getEnv().DB.profile.count({ where: { user_id: userId } }),
      getEnv().DB.application.count({
        where: { profile: { user_id: userId } },
      }),
      getEnv().DB.dataExportRequest.findFirst({
        where: { user_id: userId, status: "pending" },
        orderBy: { requested_at: "desc" },
      }),
      getEnv().DB.accountDeletionRequest.findFirst({
        where: { user_id: userId, status: "pending" },
        orderBy: { requested_at: "desc" },
      }),
    ]);

  return c.json({
    helpImproveAscend: consent ? consent.help_improve_ascend === 1 : true,
    consentUpdatedAt: consent?.updated_at?.toISOString() ?? null,
    eulaAcceptedAt: eula?.accepted_at?.toISOString() ?? null,
    eulaVersion: eula?.eula_version ?? null,
    dataInventory: {
      profileCount,
      applicationCount,
      hasJobSearchHistory: true,
      hasOptimizationHistory: true,
    },
    pendingExportRequest: pendingExport
      ? {
          requestedAt: pendingExport.requested_at.toISOString(),
          status: pendingExport.status,
        }
      : null,
    pendingDeletionRequest: pendingDeletion
      ? {
          requestedAt: pendingDeletion.requested_at.toISOString(),
          scheduledDate: pendingDeletion.scheduled_deletion_date?.toISOString().split("T")[0] ?? null,
          status: pendingDeletion.status,
        }
      : null,
  });
});

app.post("/api/data-privacy/consent", requireAuth, async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const userId = user.id;
  const { helpImproveAscend } = await c.req.json();

  const existing = await getEnv().DB.dataConsentPreference.findFirst({
    where: { user_id: userId },
  });
  if (existing) {
    await getEnv().DB.dataConsentPreference.update({
      where: { id: existing.id },
      data: { help_improve_ascend: helpImproveAscend ? 1 : 0, updated_at: new Date() },
    });
  } else {
    await getEnv().DB.dataConsentPreference.create({
      data: { user_id: userId, help_improve_ascend: helpImproveAscend ? 1 : 0 },
    });
  }

  return c.json({
    success: true,
    helpImproveAscend,
    updatedAt: new Date().toISOString(),
  });
});

app.post("/api/data-privacy/export-request", requireAuth, async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const userId = user.id;

  const existing = await getEnv().DB.dataExportRequest.findFirst({
    where: { user_id: userId, status: "pending" },
  });
  if (existing) {
    return c.json({ error: "You already have a pending data export request" }, 400);
  }

  await getEnv().DB.dataExportRequest.create({
    data: { user_id: userId, status: "pending" },
  });

  return c.json({
    success: true,
    message: "Data export request submitted. You will receive your data via email within 24 hours.",
    requestedAt: new Date().toISOString(),
  });
});

app.post("/api/data-privacy/delete-account", requireAuth, async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const userId = user.id;
  const { confirmationText } = await c.req.json();

  if (confirmationText !== "DELETE") {
    return c.json({ error: "Please type DELETE to confirm account deletion" }, 400);
  }

  const existing = await getEnv().DB.accountDeletionRequest.findFirst({
    where: { user_id: userId, status: "pending" },
  });
  if (existing) {
    return c.json({ error: "You already have a pending account deletion request" }, 400);
  }

  const scheduledDate = new Date();
  scheduledDate.setDate(scheduledDate.getDate() + 30);

  await getEnv().DB.accountDeletionRequest.create({
    data: {
      user_id: userId,
      status: "pending",
      scheduled_deletion_date: scheduledDate,
    },
  });

  return c.json({
    success: true,
    message: "Account deletion scheduled. Your account and all data will be permanently deleted within 30 days.",
    scheduledDate: scheduledDate.toISOString().split("T")[0],
  });
});

app.post("/api/data-privacy/cancel-deletion", requireAuth, async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const userId = user.id;

  await getEnv().DB.accountDeletionRequest.updateMany({
    where: { user_id: userId, status: "pending" },
    data: { status: "cancelled", updated_at: new Date() },
  });

  return c.json({ success: true, message: "Account deletion cancelled" });
});

// Parse resume with AI - supports multiple file types
app.post("/api/resumes/parse", requireAuth, async (c) => {
  const { resumeKey } = await c.req.json();
  
  if (!resumeKey) {
    return c.json({ error: "Resume key is required" }, 400);
  }

  try {
    // Fetch the file from R2
    const object = await getEnv().R2_BUCKET.get(resumeKey);
    if (!object) {
      return c.json({ error: "Resume not found" }, 404);
    }

    const arrayBuffer = await object.arrayBuffer();
    const ext = resumeKey.toLowerCase().split('.').pop();
    const contentType = object.httpMetadata?.contentType || '';
    
    // Initialize Anthropic
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "", maxRetries: 3, timeout: 60000 });

    const parsePrompt = `Analyze this resume and extract structured information. Return a JSON object with the following structure:
{
  "fullName": "string",
  "email": "string", 
  "phone": "string or null",
  "location": "string or null",
  "headline": "string - a brief professional headline",
  "summary": "string - professional summary",
  "experiences": [
    {
      "title": "job title",
      "company": "company name",
      "startDate": "YYYY-MM format",
      "endDate": "YYYY-MM format or empty if current",
      "current": boolean,
      "description": "job description and achievements"
    }
  ],
  "education": [
    {
      "degree": "degree name",
      "institution": "school/university name",
      "year": "graduation year"
    }
  ],
  "skills": ["skill1", "skill2", ...]
}

Extract all work experiences, education entries, and skills. Be thorough but accurate - only include information that's clearly stated in the resume.

IMPORTANT: Respond with only the JSON object, no additional text.`;

    let textContent = "";
    
    // Handle different file types
    if (ext === 'pdf' || contentType === 'application/pdf') {
      // PDF - send as base64 document
      const base64Data = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
      );
      const response = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "document",
                source: {
                  type: "base64",
                  media_type: "application/pdf",
                  data: base64Data
                }
              },
              { type: "text", text: parsePrompt }
            ]
          }
        ]
      });
      textContent = response.content[0].type === 'text' ? response.content[0].text : "{}";
    } else if (ext === 'docx' || contentType.includes('wordprocessingml')) {
      // DOCX - extract text using mammoth, then send to Claude
      const buffer = Buffer.from(arrayBuffer);
      const result = await mammoth.extractRawText({ buffer });
      const docContent = result.value;
      
      if (!docContent || docContent.trim().length === 0) {
        return c.json({ error: "Could not extract text from the document. Please try a different file format." }, 400);
      }
      
      const response = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4096,
        messages: [
          { role: "user", content: `${parsePrompt}\n\nResume content:\n${docContent}` }
        ]
      });
      textContent = response.content[0].type === 'text' ? response.content[0].text : "{}";
    } else {
      // TXT, RTF, DOC - convert to text and send as text
      const decoder = new TextDecoder('utf-8');
      const docContent = decoder.decode(arrayBuffer);
      const response = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4096,
        messages: [
          { role: "user", content: `${parsePrompt}\n\nResume content:\n${docContent}` }
        ]
      });
      textContent = response.content[0].type === 'text' ? response.content[0].text : "{}";
    }

    const parsedData = extractJSON(textContent);
    
    if (!parsedData) {
      console.error("[resume-parse] Failed to parse AI response:", textContent.substring(0, 500));
      return c.json({ error: "Failed to parse resume. Please try again." }, 500);
    }

    type ParsedResumeData = { experiences?: unknown[]; education?: unknown[]; [k: string]: unknown };
    const data = parsedData as ParsedResumeData;

    // Add IDs to experiences and education for frontend use
    if (data.experiences && Array.isArray(data.experiences)) {
      data.experiences = data.experiences.map((exp: unknown) => ({
        ...(exp as Record<string, unknown>),
        id: crypto.randomUUID()
      }));
    }
    if (data.education && Array.isArray(data.education)) {
      data.education = data.education.map((edu: unknown) => ({
        ...(edu as Record<string, unknown>),
        id: crypto.randomUUID()
      }));
    }

    return c.json({ success: true, data });
  } catch (error) {
    console.error("Error parsing resume:", error);
    return c.json({ error: "Failed to parse resume" }, 500);
  }
});

// Import profile from LinkedIn
// Note: LinkedIn actively blocks web scraping. Users should export their profile data manually
// via LinkedIn's "Download Your Data" feature or upload their resume instead.
app.post("/api/linkedin/import", async (c) => {
  const { linkedinUrl } = await c.req.json();
  
  if (!linkedinUrl) {
    return c.json({ error: "LinkedIn URL is required" }, 400);
  }

  // Validate LinkedIn URL format
  const linkedinPattern = /^https?:\/\/(www\.)?linkedin\.com\/in\/[\w-]+\/?$/i;
  if (!linkedinPattern.test(linkedinUrl)) {
    return c.json({ error: "Please provide a valid LinkedIn profile URL (e.g., https://linkedin.com/in/username)" }, 400);
  }

  // LinkedIn blocks automated scraping - inform the user of alternatives
  return c.json({ 
    error: "LinkedIn import is currently unavailable. LinkedIn blocks automated profile access. Please upload your resume instead, or manually enter your information.",
    suggestion: "You can also export your LinkedIn profile: Go to LinkedIn Settings → Data Privacy → Get a copy of your data → Download larger data archive → Select 'Profile' and request your data."
  }, 400);
});

// Upload resume - supports PDF, DOCX, DOC, TXT, RTF
const ALLOWED_RESUME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
  "application/msword", // doc
  "text/plain",
  "application/rtf",
  "text/rtf"
];

app.post("/api/resumes/upload", async (c) => {
  const formData = await c.req.formData();
  const file = formData.get("file") as File | null;
  
  if (!file) {
    return c.json({ error: "No file provided" }, 400);
  }

  // Check file extension as fallback for MIME type
  const ext = file.name.toLowerCase().split('.').pop();
  const allowedExtensions = ['pdf', 'docx', 'doc', 'txt', 'rtf'];
  
  if (!ALLOWED_RESUME_TYPES.includes(file.type) && !allowedExtensions.includes(ext || '')) {
    return c.json({ error: "Supported formats: PDF, DOCX, DOC, TXT, RTF" }, 400);
  }

  const key = `resumes/${Date.now()}-${file.name}`;
  
  try {
    await getEnv().R2_BUCKET.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type,
      },
    });
    
    return c.json({ success: true, key, filename: file.name });
  } catch (error) {
    console.error("Error uploading resume:", error);
    return c.json({ error: "Failed to upload resume" }, 500);
  }
});

// Get resume
app.get("/api/resumes/:key{.+}", async (c) => {
  const key = c.req.param("key");
  
  try {
    const object = await getEnv().R2_BUCKET.get(key);
    
    if (!object) {
      return c.json({ error: "Resume not found" }, 404);
    }
    
    const headers = new Headers();
    const r2 = object as { writeHttpMetadata?: (h: Headers) => void; httpMetadata?: Record<string, string>; httpEtag?: string };
    if (typeof r2.writeHttpMetadata === "function") r2.writeHttpMetadata(headers);
    else if (r2.httpMetadata) Object.entries(r2.httpMetadata).forEach(([k, v]) => headers.set(k, v));
    if (r2.httpEtag) headers.set("etag", r2.httpEtag);
    
    return c.body(object.body, { headers });
  } catch (error) {
    console.error("Error fetching resume:", error);
    return c.json({ error: "Failed to fetch resume" }, 500);
  }
});

// Get current user's profiles
app.get("/api/profiles/me", requireAuth, async (c) => {
  const user = c.get("user");
  try {
    const profiles = await getEnv().DB.profile.findMany({
      where: { user_id: user!.id },
      orderBy: { updated_at: "desc" },
      select: { id: true, full_name: true, headline: true, updated_at: true },
    });
    return c.json(profiles.map((p) => ({
      id: p.id,
      full_name: p.full_name,
      headline: p.headline,
      updated_at: p.updated_at.toISOString(),
    })));
  } catch (error) {
    console.error("Error fetching profiles:", error);
    return c.json({ error: "Failed to fetch profiles" }, 500);
  }
});

// Create or update a profile
app.post("/api/profiles", requireAuth, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const result = ProfileSchema.safeParse(body);

  if (!result.success) {
    return c.json({ error: "Invalid profile data", details: result.error.flatten() }, 400);
  }

  const data = result.data;
  const now = new Date();

  try {
    const existing = await getEnv().DB.profile.findFirst({
      where: { email: data.email, user_id: user!.id },
    });

    let profileId: number;

    if (existing) {
      profileId = existing.id;
      await getEnv().DB.profile.update({
        where: { id: profileId },
        data: {
          full_name: data.fullName,
          phone: data.phone ?? null,
          location: data.location ?? null,
          headline: data.headline ?? null,
          summary: data.summary ?? null,
          linkedin_url: data.linkedinUrl ?? null,
          resume_key: data.resumeKey ?? null,
          target_role: data.targetRole ?? null,
          target_industry: data.targetIndustry ?? null,
          career_goals: data.careerGoals ?? null,
          updated_at: now,
        },
      });
      await getEnv().DB.experience.deleteMany({ where: { profile_id: profileId } });
      await getEnv().DB.education.deleteMany({ where: { profile_id: profileId } });
      await getEnv().DB.skill.deleteMany({ where: { profile_id: profileId } });
    } else {
      const created = await getEnv().DB.profile.create({
        data: {
          full_name: data.fullName,
          email: data.email,
          phone: data.phone ?? null,
          location: data.location ?? null,
          headline: data.headline ?? null,
          summary: data.summary ?? null,
          linkedin_url: data.linkedinUrl ?? null,
          resume_key: data.resumeKey ?? null,
          target_role: data.targetRole ?? null,
          target_industry: data.targetIndustry ?? null,
          career_goals: data.careerGoals ?? null,
          user_id: user!.id,
        },
      });
      profileId = created.id;
    }

    for (let i = 0; i < data.experiences.length; i++) {
      const exp = data.experiences[i];
      await getEnv().DB.experience.create({
        data: {
          profile_id: profileId,
          title: exp.title,
          company: exp.company,
          start_date: exp.startDate,
          end_date: exp.endDate,
          is_current: exp.current,
          description: exp.description ?? null,
          sort_order: i,
        },
      });
    }
    for (let i = 0; i < data.education.length; i++) {
      const edu = data.education[i];
      await getEnv().DB.education.create({
        data: {
          profile_id: profileId,
          degree: edu.degree,
          institution: edu.institution,
          graduation_year: edu.year,
          sort_order: i,
        },
      });
    }
    for (const skill of data.skills) {
      await getEnv().DB.skill.create({
        data: { profile_id: profileId, name: skill },
      });
    }

    return c.json({ success: true, profileId });
  } catch (error) {
    console.error("Error saving profile:", error);
    return c.json({ error: "Failed to save profile" }, 500);
  }
});

// Get a profile by ID
app.get("/api/profiles/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  if (isNaN(id)) return c.json({ error: "Profile not found" }, 404);

  try {
    const profile = await getEnv().DB.profile.findUnique({
      where: { id },
      include: {
        experiences: { orderBy: { sort_order: "asc" } },
        education: { orderBy: { sort_order: "asc" } },
        skills: true,
      },
    });

    if (!profile) {
      return c.json({ error: "Profile not found" }, 404);
    }

    const response: ProfileResponse = {
      id: profile.id,
      fullName: profile.full_name,
      email: profile.email,
      phone: profile.phone ?? null,
      location: profile.location ?? null,
      headline: profile.headline ?? null,
      summary: profile.summary ?? null,
      linkedinUrl: profile.linkedin_url ?? null,
      resumeKey: profile.resume_key ?? null,
      targetRole: profile.target_role ?? null,
      targetIndustry: profile.target_industry ?? null,
      careerGoals: profile.career_goals ?? null,
      experiences: profile.experiences.map((exp) => ({
        id: exp.id.toString(),
        title: exp.title,
        company: exp.company,
        startDate: exp.start_date ?? "",
        endDate: exp.end_date ?? "",
        current: exp.is_current,
        description: exp.description ?? "",
      })),
      education: profile.education.map((edu) => ({
        id: edu.id.toString(),
        degree: edu.degree,
        institution: edu.institution,
        year: edu.graduation_year ?? "",
      })),
      skills: profile.skills.map((s) => s.name),
      createdAt: profile.created_at.toISOString(),
      updatedAt: profile.updated_at.toISOString(),
    };

    return c.json(response);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return c.json({ error: "Failed to fetch profile" }, 500);
  }
});

// Generate optimized profiles for job boards (streaming endpoint)
app.post("/api/profiles/:id/optimize", requireAuth, async (c) => {
  const user = c.get("user");
  const idParam = c.req.param("id");

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY not configured");
    return c.json({ error: "AI service not configured" }, 503);
  }

  try {
    const body = await c.req.json().catch(() => ({}));
    const selectedPlatforms: string[] = body.platforms || ["linkedin", "naukri", "indeed", "foundit", "glassdoor"];
    const useStreaming = body.stream === true;

    const parsedId = parseInt(idParam);
    const profile = parsedId > 0
      ? await getEnv().DB.profile.findFirst({
          where: { id: parsedId, user_id: user!.id },
          include: { experiences: { orderBy: { sort_order: "asc" } }, education: { orderBy: { sort_order: "asc" } }, skills: true },
        })
      : await getEnv().DB.profile.findFirst({
          where: { user_id: user!.id },
          orderBy: { created_at: "desc" },
          include: { experiences: { orderBy: { sort_order: "asc" } }, education: { orderBy: { sort_order: "asc" } }, skills: true },
        });

    if (!profile) {
      return c.json({ error: "Profile not found. Please create a profile first.", code: "PROFILE_NOT_FOUND" }, 404);
    }

    const profileData = {
      fullName: profile.full_name || "Professional",
      email: profile.email || "",
      phone: profile.phone || "",
      location: profile.location || "Not specified",
      headline: profile.headline || profile.target_role || "Professional",
      summary: profile.summary || "",
      targetRole: profile.target_role || "Professional Role",
      targetIndustry: profile.target_industry || "General",
      careerGoals: profile.career_goals || "",
      linkedinUrl: profile.linkedin_url || "",
      experiences: profile.experiences,
      education: profile.education,
      skills: profile.skills.map((s) => s.name),
    };

    // Initialize Anthropic with longer timeout for streaming
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "", maxRetries: 2, timeout: 120000 });

    const platformInstructions = selectedPlatforms.map(p => {
      switch(p) {
        case "linkedin": return "LinkedIn: Professional, thought-leadership focused, rich headlines";
        case "naukri": return "Naukri: Keyword-rich for Indian job market, detailed skills section";
        case "indeed": return "Indeed: Concise, achievement-focused, easy to scan";
        case "foundit": return "Foundit: Modern, skills-based, career narrative style";
        case "glassdoor": return "Glassdoor: Authentic voice, culture-fit signals, career progression focus";
        default: return "";
      }
    }).filter(Boolean).join("\n- ");

    const platformSchemas = selectedPlatforms.map(p => {
      switch(p) {
        case "linkedin": return `"linkedin": { "headline": "string", "summary": "string", "experience": [{ "title": "string", "company": "string", "description": "string" }], "skills": ["string"], "strengthScore": number 0-100 }`;
        case "naukri": return `"naukri": { "headline": "string", "summary": "string", "keySkills": ["string"], "resumeHeadline": "string", "strengthScore": number 0-100 }`;
        case "indeed": return `"indeed": { "headline": "string", "summary": "string", "skills": ["string"], "workHighlights": ["string"], "strengthScore": number 0-100 }`;
        case "foundit": return `"foundit": { "headline": "string", "summary": "string", "skills": ["string"], "careerObjective": "string", "strengthScore": number 0-100 }`;
        case "glassdoor": return `"glassdoor": { "headline": "string", "summary": "string", "skills": ["string"], "careerHighlights": ["string"], "strengthScore": number 0-100 }`;
        default: return "";
      }
    }).filter(Boolean).join(",\n  ");

    const prompt = `You are an expert career coach and job board optimization specialist. Given the following candidate profile, generate optimized profile content for these job boards: ${selectedPlatforms.join(", ")}.

CANDIDATE PROFILE:
${JSON.stringify(profileData, null, 2)}

For each platform, create optimized content that:
- Uses platform-specific best practices and formatting
- Incorporates relevant keywords for better searchability
- Highlights achievements with metrics where possible
- Matches the tone and style expected on that platform
- ${platformInstructions}

IMPORTANT: For each platform, also calculate a "strengthScore" from 0-100 that rates how complete and optimized the profile is for that platform. Consider:
- Completeness of information (headline, summary, skills, experience)
- Keyword optimization for the platform's search algorithm
- Achievement quantification and impact statements
- Professional formatting and length appropriateness
- Target role alignment

Return a JSON object with this exact structure:
{
  ${platformSchemas}
}

OUTPUT RULES:
- Output ONLY the raw JSON object
- Start your response with { and end with }
- Do NOT wrap in markdown code blocks
- Do NOT include any text before or after the JSON
- Ensure all JSON is valid and complete`;

    // Use streaming for better UX and to avoid timeouts
    if (useStreaming) {
      const stream = await anthropic.messages.stream({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 8192,
        messages: [{ role: "user", content: prompt }]
      });

      // Return Server-Sent Events stream
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          try {
            let fullText = "";
            for await (const event of stream) {
              if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
                fullText += event.delta.text;
                // Send chunk as SSE
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk: event.delta.text, partial: true })}\n\n`));
              }
            }
            // Send final complete result
            const parsed = extractJSON(fullText);
            if (!parsed) {
              console.error("[optimize-stream] Failed to parse, full text:", fullText.substring(0, 500));
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "Failed to parse AI response. Please try again.", done: true })}\n\n`));
            } else {
              const optimizedProfiles = normalizeOptimizedProfilesKeys(parsed);
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ success: true, data: optimizedProfiles, done: true })}\n\n`));
            }
            controller.close();
          } catch (err: unknown) {
            console.error("Streaming error:", err);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err instanceof Error ? err.message : "Stream error", done: true })}\n\n`));
            controller.close();
          }
        }
      });

      return new Response(readable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    }

    // Non-streaming fallback (uses faster Haiku model)
    let optimizedProfiles;
    try {
      const response = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 8192,
        messages: [{ role: "user", content: prompt }]
      });

      const responseText = response.content[0].type === 'text' ? response.content[0].text : "{}";
      const parsed = extractJSON(responseText);
      if (!parsed) {
        console.error("[optimize] Invalid AI response:", responseText.substring(0, 500));
        return c.json({ success: false, data: {}, error: "AI generated invalid response" });
      }
      optimizedProfiles = normalizeOptimizedProfilesKeys(parsed);
    } catch (aiError: unknown) {
      console.error("AI error optimizing profile:", aiError);
      console.error("AI error details:", aiError instanceof Error ? aiError.message : String(aiError));
      console.error("AI error type:", aiError instanceof Error ? aiError.constructor?.name : typeof aiError);
      const status = aiError && typeof aiError === "object" && "status" in aiError ? (aiError as { status?: number }).status : undefined;
      if (status === 529) {
        return c.json({ error: "AI service is busy, please try again in a moment" }, 503);
      }
      // Return empty data so frontend handles gracefully
      return c.json({ success: false, data: {}, error: "AI optimization temporarily unavailable" });
    }

    return c.json({ success: true, data: optimizedProfiles });
  } catch (error) {
    console.error("Error optimizing profile:", error);
    return c.json({ error: "Failed to optimize profile" }, 500);
  }
});

// Generate optimized base resume
app.post("/api/profiles/:id/generate-resume", requireAuth, async (c) => {
  const user = c.get("user");
  const idParam = c.req.param("id");

  try {
    const parsedId = parseInt(idParam);
    const profile = parsedId > 0
      ? await getEnv().DB.profile.findFirst({
          where: { id: parsedId, user_id: user!.id },
          include: { experiences: { orderBy: { sort_order: "asc" } }, education: { orderBy: { sort_order: "asc" } }, skills: true },
        })
      : await getEnv().DB.profile.findFirst({
          where: { user_id: user!.id },
          orderBy: { created_at: "desc" },
          include: { experiences: { orderBy: { sort_order: "asc" } }, education: { orderBy: { sort_order: "asc" } }, skills: true },
        });

    if (!profile) {
      return c.json({ error: "Profile not found. Please create a profile first.", code: "PROFILE_NOT_FOUND" }, 404);
    }

    const profileData = {
      fullName: profile.full_name || "Professional",
      email: profile.email || "",
      phone: profile.phone || "",
      location: profile.location || "Not specified",
      headline: profile.headline || profile.target_role || "Professional",
      summary: profile.summary || "",
      targetRole: profile.target_role || "Professional Role",
      targetIndustry: profile.target_industry || "General",
      careerGoals: profile.career_goals || "",
      experiences: profile.experiences,
      education: profile.education,
      skills: profile.skills.map((s) => s.name),
    };

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "", maxRetries: 3, timeout: 60000 });

    const prompt = `You are an expert resume writer. Create a polished, professional master resume from the following profile data. This should be a comprehensive base resume that showcases the candidate's full career story.

CANDIDATE PROFILE:
${JSON.stringify(profileData, null, 2)}

Create an optimized resume with:
- A compelling professional summary (3-4 sentences) that highlights unique value proposition
- Rewritten experience descriptions with action verbs, quantified achievements, and impact statements
- Skills organized by category (Technical, Leadership, Industry-specific)
- Clean, professional formatting suggestions

Return a JSON object with this structure:
{
  "name": "Full Name",
  "contact": {
    "email": "email",
    "phone": "phone",
    "location": "city, state/country"
  },
  "headline": "Professional headline/title",
  "summary": "Compelling professional summary paragraph",
  "experiences": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "location": "City, Country",
      "startDate": "Month Year",
      "endDate": "Month Year or Present",
      "highlights": ["Achievement 1 with metrics", "Achievement 2 with impact"]
    }
  ],
  "education": [
    {
      "degree": "Degree Name",
      "institution": "University Name",
      "year": "Graduation Year",
      "honors": "Any honors/GPA if notable"
    }
  ],
  "skills": {
    "technical": ["skill1", "skill2"],
    "professional": ["skill1", "skill2"],
    "tools": ["tool1", "tool2"]
  },
  "certifications": ["Any relevant certifications"],
  "improvements": ["Suggestion 1 for further improving the resume", "Suggestion 2"]
}

IMPORTANT: Respond with only the JSON object, no additional text.`;

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }]
    });

    const responseText = response.content[0].type === 'text' ? response.content[0].text : "{}";
    const resume = extractJSON(responseText);
    
    if (!resume) {
      console.error("[generate-resume] Failed to parse AI response:", responseText.substring(0, 500));
      return c.json({ error: "Failed to generate resume. Please try again." }, 500);
    }

    return c.json({ success: true, data: resume });
  } catch (error) {
    console.error("Error generating resume:", error);
    return c.json({ error: "Failed to generate resume" }, 500);
  }
});

// List all profiles
app.get("/api/profiles", requireAuth, async (c) => {
  const user = c.get("user");
  try {
    const profiles = await getEnv().DB.profile.findMany({
      where: { user_id: user!.id },
      orderBy: { created_at: "desc" },
      select: { id: true, full_name: true, email: true, headline: true, target_role: true, created_at: true },
    });
    return c.json(profiles.map((p) => ({
      id: p.id,
      fullName: p.full_name,
      email: p.email,
      headline: p.headline,
      targetRole: p.target_role,
      createdAt: p.created_at.toISOString(),
    })));
  } catch (error) {
    console.error("Error fetching profiles:", error);
    return c.json({ error: "Failed to fetch profiles" }, 500);
  }
});

// Tailor resume for specific job
// ========== Role Fit % — single source of truth ==========
// - The only place that WRITES the fit score is POST /api/profiles/:id/assess-fit (AI analysis → role_fit_assessments).
// - The only place that READS for display is getStoredRoleFit (used by assess-fit cache and by stored-fit-scores).
// - Job cards and the full Role Fit Analysis page must both use this stored value; never run a second scoring algorithm.
// - Job key must be identical when storing (assess-fit) and when looking up (stored-fit-scores): same title, company, description (first 500 chars).

function normalizeDescriptionForJobKey(description: string): string {
  return (description || "").substring(0, 500).toLowerCase().trim();
}

/** Generate a stable job key from title, company, and description. Used by assess-fit (store) and stored-fit-scores (lookup). */
function generateJobKey(jobTitle: string, company: string, jobDescription: string): string {
  const title = (jobTitle || "").toLowerCase().trim();
  const comp = (company || "").toLowerCase().trim();
  const desc = normalizeDescriptionForJobKey(jobDescription || "");
  const normalized = `${title}|${comp}|${desc}`;
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `job_${Math.abs(hash).toString(36)}`;
}

/** Single shared lookup: get stored role fit assessment by user and job key. Used by assess-fit (cache) and stored-fit-scores. */
async function getStoredRoleFit(
  userId: string,
  jobKey: string
): Promise<{ fit_score: number; required_years_experience: number | null; candidate_years_experience: number | null; strong_matches: string | null; gaps_identified: string | null; fit_summary: string | null } | null> {
  const row = await getEnv().DB.roleFitAssessment.findUnique({
    where: { user_id_job_key: { user_id: userId, job_key: jobKey } },
    select: { fit_score: true, required_years_experience: true, candidate_years_experience: true, strong_matches: true, gaps_identified: true, fit_summary: true },
  });
  return row;
}

/** Single shared function for "Role Fit %" display: returns stored fit_score or null. Use this for both job cards and full analysis; no quick-estimate. */
async function getDisplayFitScore(
  userId: string,
  jobTitle: string,
  company: string,
  description: string
): Promise<number | null> {
  const jobKey = generateJobKey(jobTitle, company, description);
  const row = await getStoredRoleFit(userId, jobKey);
  return row?.fit_score ?? null;
}

app.post("/api/profiles/:id/assess-fit", requireAuth, async (c) => {
  const user = c.get("user");
  const idParam = c.req.param("id");
  const { jobDescription, jobTitle, company, forceRecalculate } = await c.req.json();
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!anthropicKey) {
    return c.json({ error: "AI service not configured" }, 503);
  }

  try {
    const parsedId = parseInt(idParam);
    const profile = parsedId > 0
      ? await getEnv().DB.profile.findFirst({
          where: { id: parsedId, user_id: user!.id },
          include: { experiences: { orderBy: { sort_order: "asc" } }, skills: true },
        })
      : await getEnv().DB.profile.findFirst({
          where: { user_id: user!.id },
          orderBy: { created_at: "desc" },
          include: { experiences: { orderBy: { sort_order: "asc" } }, skills: true },
        });

    if (!profile) {
      return c.json({ error: "Profile not found. Please create a profile first.", code: "PROFILE_NOT_FOUND" }, 404);
    }

    const jobKey = generateJobKey(jobTitle || "", company || "", jobDescription || "");

    if (!forceRecalculate) {
      const existingAssessment = await getStoredRoleFit(user!.id, jobKey);
      if (existingAssessment) {
        return c.json({
          overallFitScore: existingAssessment.fit_score,
          requiredYearsExperience: existingAssessment.required_years_experience,
          candidateYearsExperience: existingAssessment.candidate_years_experience,
          strongMatches: existingAssessment.strong_matches ? JSON.parse(existingAssessment.strong_matches) : [],
          gapsIdentified: existingAssessment.gaps_identified ? JSON.parse(existingAssessment.gaps_identified) : [],
          fitSummary: existingAssessment.fit_summary,
          cached: true,
        });
      }
    }

    let totalYearsExperience = 0;
    for (const exp of profile.experiences) {
      const startDate = exp.start_date ? new Date(exp.start_date) : null;
      const endDate = exp.is_current ? new Date() : (exp.end_date ? new Date(exp.end_date) : null);
      if (startDate && endDate) {
        const years = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
        totalYearsExperience += Math.max(0, years);
      }
    }

    const profileData = {
      headline: profile.headline || "",
      summary: profile.summary || "",
      totalYearsExperience: Math.round(totalYearsExperience),
      experiences: profile.experiences.map((e) => ({ title: e.title, company: e.company, description: e.description })),
      skills: profile.skills.map((s) => s.name),
    };

    const anthropic = new Anthropic({ apiKey: anthropicKey, maxRetries: 3, timeout: 60000 });
    const prompt = `You are an expert career advisor analyzing job fit. Compare this candidate's profile against the job requirements.

Candidate Profile:
- Total years of experience: ${profileData.totalYearsExperience} years
- Headline: ${profileData.headline}
- Summary: ${profileData.summary}
- Work experience: ${profileData.experiences.map((e) => `${e.title} at ${e.company}`).join(", ")}
- Skills: ${profileData.skills.join(", ")}

Job Title: ${jobTitle || "Not specified"}
Company: ${company || "Not specified"}
Job Description:
${jobDescription}

Analyze and return a JSON assessment with:
1. requiredYearsExperience: number (extract from JD, or estimate based on seniority level)
2. candidateYearsExperience: number (from profile)
3. strongMatches: array of strings (skills/qualifications that align well, max 4)
4. gapsIdentified: array of objects with {gap: string, severity: "minor"|"moderate"|"significant"} (missing requirements, max 4)
5. overallFitScore: number 0-100
6. fitSummary: string (one sentence summary of fit)

IMPORTANT: Respond with only the JSON object, no additional text.`;

    try {
      const result = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }]
      });

      const resultText = result.content[0].type === 'text' ? result.content[0].text : "{}";
      const rawAssessment = extractJSON(resultText);
      if (!rawAssessment || typeof rawAssessment !== 'object') {
        console.error("[assess-fit] Invalid AI response:", resultText.substring(0, 500));
        return c.json({ error: "Unable to assess fit - invalid response", code: "INVALID_RESPONSE" }, 500);
      }

      type AssessFitResult = {
        overallFitScore?: number;
        requiredYearsExperience?: number;
        candidateYearsExperience?: number;
        strongMatches?: unknown[];
        gapsIdentified?: unknown[];
        fitSummary?: string | null;
      };
      const assessment = rawAssessment as AssessFitResult;

      try {
        await getEnv().DB.roleFitAssessment.upsert({
          where: { user_id_job_key: { user_id: user!.id, job_key: jobKey } },
          create: {
            user_id: user!.id,
            profile_id: profile.id,
            job_key: jobKey,
            job_title: jobTitle || null,
            company: company || null,
            fit_score: assessment.overallFitScore || 0,
            required_years_experience: assessment.requiredYearsExperience ?? null,
            candidate_years_experience: assessment.candidateYearsExperience ?? null,
            strong_matches: JSON.stringify(assessment.strongMatches || []),
            gaps_identified: JSON.stringify(assessment.gapsIdentified || []),
            fit_summary: assessment.fitSummary || null,
          },
          update: {
            fit_score: assessment.overallFitScore || 0,
            required_years_experience: assessment.requiredYearsExperience ?? null,
            candidate_years_experience: assessment.candidateYearsExperience ?? null,
            strong_matches: JSON.stringify(assessment.strongMatches || []),
            gaps_identified: JSON.stringify(assessment.gapsIdentified || []),
            fit_summary: assessment.fitSummary || null,
            updated_at: new Date(),
          },
        });
      } catch (storeError) {
        console.error("[assess-fit] Failed to store assessment:", storeError);
      }

      return c.json(assessment);
    } catch (aiError: unknown) {
      console.error("[assess-fit] Error type:", aiError instanceof Error ? aiError.constructor?.name : typeof aiError);
      console.error("[assess-fit] Error message:", aiError instanceof Error ? aiError.message : String(aiError));
      const status = aiError && typeof aiError === "object" && "status" in aiError ? (aiError as { status?: number }).status : undefined;
      console.error("[assess-fit] Error status:", status);
      if (status === 529) {
        return c.json({ error: "AI service is busy, please try again in a moment" }, 503);
      }
      return c.json({ error: "Unable to assess fit at this time", code: "AI_ERROR" }, 500);
    }
  } catch (error: unknown) {
    console.error("Error assessing fit:", error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    return c.json({ error: "Unable to assess fit at this time", code: "SERVER_ERROR" }, 500);
  }
});

// POST /api/profiles/me/assess-fit is handled by /api/profiles/:id/assess-fit with id=me (default profile from session)

// Helper: Estimate token count (rough: ~4 chars per token)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

app.post("/api/profiles/:id/tailor", requireAuth, async (c) => {
  const user = c.get("user");
  const idParam = c.req.param("id");
  const { jobDescription, jobTitle, company, stream: useStreaming } = await c.req.json();
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!anthropicKey) {
    console.error("[tailor] ANTHROPIC_API_KEY not configured");
    return c.json({ error: "AI service not configured", code: "CONFIG_ERROR" }, 503);
  }

  try {
    const parsedId = parseInt(idParam);
    const profile = parsedId > 0
      ? await getEnv().DB.profile.findFirst({
          where: { id: parsedId, user_id: user!.id },
          include: { experiences: { orderBy: { sort_order: "asc" } }, education: { orderBy: { sort_order: "asc" } }, skills: true },
        })
      : await getEnv().DB.profile.findFirst({
          where: { user_id: user!.id },
          orderBy: { created_at: "desc" },
          include: { experiences: { orderBy: { sort_order: "asc" } }, education: { orderBy: { sort_order: "asc" } }, skills: true },
        });

    if (!profile) {
      console.error("[tailor] Profile not found for user:", user?.id);
      return c.json({ error: "Profile not found", code: "PROFILE_NOT_FOUND" }, 404);
    }

    const missingFields: string[] = [];
    if (!profile.experiences.length) missingFields.push("work experience");
    if (!profile.skills.length) missingFields.push("skills");
    if (!profile.summary || profile.summary.trim() === "") missingFields.push("professional summary");

    if (missingFields.length > 0) {
      return c.json({
        error: "Your profile is incomplete. Please add work experience, skills, and a professional summary before tailoring your resume.",
        code: "PROFILE_INCOMPLETE",
        missingFields,
      }, 400);
    }

    const profileData = {
      fullName: profile.full_name || "Professional",
      email: profile.email || "",
      phone: profile.phone || "",
      location: profile.location || "",
      headline: profile.headline || profile.target_role || "",
      summary: (profile.summary || "").substring(0, 500),
      targetRole: profile.target_role || "",
      experiences: profile.experiences.map((e) => ({
        title: e.title,
        company: e.company,
        startDate: e.start_date,
        endDate: e.end_date,
        current: e.is_current,
        description: (e.description || "").substring(0, 300),
      })),
      education: profile.education.map((e) => ({
        degree: e.degree,
        institution: e.institution,
        year: e.graduation_year,
      })),
      skills: profile.skills.slice(0, 20).map((s) => s.name),
    };

    const MAX_JD_CHARS = 2000;
    const MAX_INPUT_TOKENS = 150000;
    let processedJD = typeof jobDescription === "string" ? jobDescription : "";
    const profileJson = JSON.stringify(profileData);
    const basePromptLength = 2000;
    let estimatedTokens = estimateTokens(profileJson + processedJD + basePromptLength.toString());
    if (estimatedTokens > MAX_INPUT_TOKENS || processedJD.length > MAX_JD_CHARS) {
      processedJD = processedJD.substring(0, MAX_JD_CHARS) + "\n[Job description truncated for length]";
      estimatedTokens = estimateTokens(profileJson + processedJD + basePromptLength.toString());
    }
    if (estimatedTokens > MAX_INPUT_TOKENS) {
      return c.json({
        error: "Combined profile and job description exceed the maximum length. Please use a shorter job description.",
        code: "TOKEN_LIMIT",
      }, 400);
    }

    const anthropic = new Anthropic({
      apiKey: anthropicKey,
      maxRetries: 3,
      timeout: 120000 // 2 minute timeout for streaming
    });

    const prompt = `You are an expert resume writer. Tailor this resume for the job.

CANDIDATE:
${profileJson}

JOB: ${jobTitle || "Not specified"} at ${company || "Not specified"}
${processedJD}

RULES:
- Only use information from the candidate profile
- Never invent skills, experience, or achievements
- Mark gaps with "[Gap: X]"

OUTPUT RULES:
- Output ONLY the raw JSON object
- Start your response with { and end with }
- Do NOT wrap in markdown code blocks
- Do NOT include any text before or after the JSON

Return this exact JSON structure:
{"fullName":"string","email":"string","phone":"string","location":"string","headline":"tailored headline","summary":"2-3 sentences","experiences":[{"title":"string","company":"string","dates":"string","bullets":["achievement 1","achievement 2"]}],"education":[{"degree":"string","institution":"string","year":"string"}],"skills":["relevant skills"],"matchScore":0-100,"suggestions":["improvement tips"],"gapsIdentified":["gaps found"],"tailoringNotes":"what was emphasized"}`;

    // Use streaming to prevent 502 gateway timeouts
    if (useStreaming) {
      const stream = await anthropic.messages.stream({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }]
      });

      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          try {
            let fullText = "";
            for await (const event of stream) {
              if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
                fullText += event.delta.text;
                // Send chunk as SSE to keep connection alive
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk: event.delta.text, partial: true })}\n\n`));
              }
            }
            let tailoredResume: unknown = null;
            try {
              tailoredResume = extractJSON(fullText);
            } catch (parseErr: unknown) {
              console.error("[tailor-stream] Parse error:", parseErr instanceof Error ? parseErr.message : String(parseErr));
              console.error("[tailor-stream] Raw response ends with:", fullText.substring(Math.max(0, fullText.length - 400)));
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "AI returned an invalid format. Showing raw text.", code: "PARSE_ERROR", rawText: fullText.substring(0, 10000), parseFailed: true, done: true })}\n\n`));
              controller.close();
              return;
            }
            if (!tailoredResume || typeof tailoredResume !== "object") {
              console.error("[tailor-stream] Failed to parse (extractJSON returned null), response starts with:", fullText.substring(0, 300));
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "Could not parse AI response as JSON. Showing raw text.", code: "PARSE_ERROR", rawText: fullText.substring(0, 10000), parseFailed: true, done: true })}\n\n`));
            } else {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ success: true, data: tailoredResume, done: true })}\n\n`));
            }
            controller.close();
          } catch (err: unknown) {
            console.error("[tailor-stream] Streaming error:", err instanceof Error ? err.message : String(err));
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err instanceof Error ? err.message : "Stream error", code: "STREAM_ERROR", done: true })}\n\n`));
            controller.close();
          }
        }
      });

      return new Response(readable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    }

    // Non-streaming fallback
    const result = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }]
    });

    const resultText = result.content[0].type === "text" ? result.content[0].text : "{}";

    let tailoredResume: unknown = null;
    try {
      tailoredResume = extractJSON(resultText);
    } catch (parseErr: unknown) {
      console.error("[tailor] JSON parse threw:", parseErr instanceof Error ? parseErr.message : String(parseErr));
      console.error("[tailor] Raw response ends with:", resultText.substring(Math.max(0, resultText.length - 500)));
      return c.json({
        error: "AI returned an invalid format (e.g. markdown instead of JSON). Please try again.",
        code: "PARSE_ERROR",
        rawText: resultText.substring(0, 10000),
        parseFailed: true,
      }, 200);
    }

    if (!tailoredResume || typeof tailoredResume !== "object") {
      console.error("[tailor] extractJSON returned null or non-object. Full response length:", resultText.length);
      return c.json({
        error: "Could not parse AI response as JSON. Showing raw text.",
        code: "PARSE_ERROR",
        rawText: resultText.substring(0, 10000),
        parseFailed: true,
      }, 200);
    }

    return c.json(tailoredResume);
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    const errStatus = error && typeof error === "object" && "status" in error ? (error as { status?: number }).status : undefined;
    console.error("[tailor] Error type:", error instanceof Error ? error.constructor?.name : typeof error);
    console.error("[tailor] Error message:", errMsg);
    console.error("[tailor] Error status:", errStatus);
    console.error("[tailor] Full error:", error && typeof error === "object" ? JSON.stringify(error, Object.getOwnPropertyNames(error)) : String(error));

    if (errMsg.includes("token") || errMsg.includes("context_length") || errMsg.includes("too long")) {
      return c.json({ 
        error: "The job description is too long. Please try with a shorter description.",
        code: "TOKEN_LIMIT"
      }, 400);
    }
    
    if (errStatus === 529 || errMsg.includes("overloaded")) {
      return c.json({ error: "AI service is temporarily overloaded. Please wait a moment and try again.", code: "OVERLOADED" }, 503);
    }
    if (errMsg.includes("timeout") || errMsg.includes("ETIMEDOUT") || (error instanceof Error && error.name === "AbortError")) {
      return c.json({ error: "The AI service is taking too long to respond. Please try again.", code: "TIMEOUT" }, 504);
    }
    if (errMsg.includes("rate limit") || errStatus === 429) {
      return c.json({ error: "AI service is temporarily busy. Please wait a moment and try again.", code: "RATE_LIMITED" }, 429);
    }
    if (errMsg.includes("API key") || errMsg.includes("authentication") || errStatus === 401) {
      console.error("[tailor] AUTH ERROR - API key issue");
      return c.json({ error: "AI service configuration error. Please contact support.", code: "AUTH_ERROR" }, 500);
    }
    if (errMsg.includes("JSON") || errMsg.includes("parse")) {
      return c.json({ error: "AI response could not be processed. Please try again.", code: "PARSE_ERROR" }, 500);
    }
    return c.json({ error: "Failed to generate tailored resume. Please try again.", code: "SERVER_ERROR", details: errMsg }, 500);
  }
});

// POST /api/profiles/me/tailor is handled by /api/profiles/:id/tailor with id=me (default profile from session)

// Enhanced resume tailoring with missing keywords analysis
app.post("/api/profiles/:id/tailor-enhanced", requireAuth, async (c) => {
  const user = c.get("user");
  const idParam = c.req.param("id");
  const { jobDescription, jobTitle, company } = await c.req.json();
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (!anthropicKey) {
    console.error("[tailor-enhanced] ANTHROPIC_API_KEY not configured");
    return c.json({ error: "AI service not configured", code: "CONFIG_ERROR" }, 503);
  }

  if (!jobDescription) {
    return c.json({ error: "Job description is required" }, 400);
  }

  try {
    const parsedId = parseInt(idParam);
    const profile = parsedId > 0
      ? await getEnv().DB.profile.findFirst({
          where: { id: parsedId, user_id: user!.id },
          include: { experiences: { orderBy: { sort_order: "asc" } }, education: { orderBy: { sort_order: "asc" } }, skills: true },
        })
      : await getEnv().DB.profile.findFirst({
          where: { user_id: user!.id },
          orderBy: { created_at: "desc" },
          include: { experiences: { orderBy: { sort_order: "asc" } }, education: { orderBy: { sort_order: "asc" } }, skills: true },
        });

    if (!profile) {
      console.error("[tailor-enhanced] Profile not found for user:", user?.id);
      return c.json({ error: "Profile not found", code: "PROFILE_NOT_FOUND" }, 404);
    }

    const missingFields: string[] = [];
    if (!profile.experiences.length) missingFields.push("work experience");
    if (!profile.skills.length) missingFields.push("skills");
    if (!profile.summary || profile.summary.trim() === "") missingFields.push("professional summary");

    if (missingFields.length > 0) {
      return c.json({
        error: "Your profile is incomplete. Please add work experience, skills, and a professional summary before tailoring your resume.",
        code: "PROFILE_INCOMPLETE",
        missingFields,
      }, 400);
    }

    const profileData = {
      fullName: profile.full_name || "Professional",
      email: profile.email || "",
      phone: profile.phone || "",
      location: profile.location || "",
      headline: profile.headline || profile.target_role || "",
      summary: (profile.summary || "").substring(0, 500),
      experiences: profile.experiences.map((e) => ({
        title: e.title,
        company: e.company,
        startDate: e.start_date,
        endDate: e.end_date,
        current: e.is_current,
        description: (e.description || "").substring(0, 300),
      })),
      education: profile.education.map((e) => ({
        degree: e.degree,
        institution: e.institution,
        year: e.graduation_year,
      })),
      skills: profile.skills.slice(0, 20).map((s) => s.name),
    };

    const MAX_JD_CHARS = 2000;
    const MAX_INPUT_TOKENS = 150000;
    let processedJD = typeof jobDescription === "string" ? jobDescription : "";
    const profileJson = JSON.stringify(profileData);
    let estimatedTokens = estimateTokens(profileJson + processedJD + "2000");
    if (estimatedTokens > MAX_INPUT_TOKENS || processedJD.length > MAX_JD_CHARS) {
      processedJD = processedJD.substring(0, MAX_JD_CHARS) + "\n[Job description truncated]";
      estimatedTokens = estimateTokens(profileJson + processedJD + "2000");
    }
    if (estimatedTokens > MAX_INPUT_TOKENS) {
      return c.json({
        error: "Combined profile and job description exceed the maximum length. Please use a shorter job description.",
        code: "TOKEN_LIMIT",
      }, 400);
    }

    const anthropic = new Anthropic({ 
      apiKey: anthropicKey,
      maxRetries: 3,
      timeout: 45000 // 45 second timeout for faster model
    });
    
    const prompt = `Tailor this resume for the job. Output JSON only.

CANDIDATE:
${profileJson}

JOB: ${jobTitle || "Not specified"} at ${company || "Not specified"}
${processedJD}

RULES: Only use candidate data. Never invent skills/experience.

Return JSON:
{"fullName":"${profileData.fullName}","email":"${profileData.email || ""}","phone":"${profileData.phone || ""}","location":"${profileData.location || ""}","headline":"tailored headline","summary":"3-4 sentences","experiences":[{"title":"string","company":"string","dates":"string","bullets":["bullet1","bullet2"]}],"education":[{"degree":"string","institution":"string","year":"string"}],"matchedSkills":["skills matching JD"],"additionalSkills":["other relevant skills"],"missingKeywords":[{"keyword":"gap","importance":"critical|important|nice-to-have","suggestion":"how to address"}],"matchScore":0-100,"strengthAreas":["strengths"],"improvementAreas":["areas to improve"]}`;

    const result = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }]
    });

    const resultText = result.content[0].type === "text" ? result.content[0].text : "{}";

    let tailoredResume: unknown = null;
    try {
      tailoredResume = extractJSON(resultText);
    } catch (parseErr: unknown) {
      console.error("[tailor-enhanced] JSON parse threw:", parseErr instanceof Error ? parseErr.message : String(parseErr));
      return c.json({
        error: "AI returned an invalid format. Showing raw text.",
        code: "PARSE_ERROR",
        rawText: resultText.substring(0, 10000),
        parseFailed: true,
      }, 200);
    }

    if (!tailoredResume || typeof tailoredResume !== "object" || !(tailoredResume as Record<string, unknown>).fullName) {
      console.error("[tailor-enhanced] Invalid or incomplete response; full length:", resultText.length);
      return c.json({
        error: "Could not parse AI response as expected JSON. Showing raw text.",
        code: "PARSE_ERROR",
        rawText: resultText.substring(0, 10000),
        parseFailed: true,
      }, 200);
    }

    return c.json(tailoredResume);
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    const errStatus = error && typeof error === "object" && "status" in error ? (error as { status?: number }).status : undefined;
    console.error("[tailor-enhanced] Error type:", error instanceof Error ? error.constructor?.name : typeof error);
    console.error("[tailor-enhanced] Error message:", errMsg);
    console.error("[tailor-enhanced] Error status:", errStatus);

    if (errMsg.includes("token") || errMsg.includes("context_length")) {
      return c.json({ error: "Job description too long. Please shorten it.", code: "TOKEN_LIMIT" }, 400);
    }
    if (errStatus === 529 || errMsg.includes("overloaded")) {
      return c.json({ error: "AI service is temporarily overloaded. Please try again.", code: "OVERLOADED" }, 503);
    }
    if (errMsg.includes("timeout") || errMsg.includes("ETIMEDOUT") || (error instanceof Error && error.name === "AbortError")) {
      return c.json({ error: "The AI service is taking too long. Please try again.", code: "TIMEOUT" }, 504);
    }
    
    if (errMsg.includes("rate limit") || errStatus === 429) {
      return c.json({ error: "AI service is temporarily busy. Please wait and try again.", code: "RATE_LIMITED" }, 429);
    }
    if (errMsg.includes("API key") || errMsg.includes("authentication") || errStatus === 401) {
      console.error("[tailor-enhanced] AUTH ERROR - check API key");
      return c.json({ error: "AI service configuration error. Contact support.", code: "AUTH_ERROR" }, 500);
    }
    return c.json({ error: "Failed to generate tailored resume. Please try again.", code: "SERVER_ERROR" }, 500);
  }
});

// Resume versions CRUD
app.get("/api/resume-versions/:profileId", requireAuth, async (c) => {
  const user = c.get("user");
  const profileId = parseInt(c.req.param("profileId"));
  const profile = await getEnv().DB.profile.findFirst({
    where: { id: profileId, user_id: user!.id },
    select: { id: true },
  });
  if (!profile) return c.json({ error: "Profile not found" }, 404);
  const versions = await getEnv().DB.resumeVersion.findMany({
    where: { profile_id: profileId },
    select: { id: true, job_title: true, company: true, match_score: true, created_at: true },
    orderBy: { created_at: "desc" },
  });
  return c.json({ versions });
});

app.post("/api/resume-versions", requireAuth, async (c) => {
  const user = c.get("user");
  const { profileId, jobTitle, company, jobDescription, tailoredContent, matchScore } = await c.req.json();
  const profile = await getEnv().DB.profile.findFirst({
    where: { id: profileId, user_id: user!.id },
    select: { id: true },
  });
  if (!profile) return c.json({ error: "Profile not found" }, 404);
  const created = await getEnv().DB.resumeVersion.create({
    data: {
      profile_id: profileId,
      job_title: jobTitle,
      company: company || "",
      job_description: jobDescription ?? null,
      tailored_content: typeof tailoredContent === "string" ? tailoredContent : JSON.stringify(tailoredContent ?? {}),
      match_score: matchScore ?? null,
    },
  });
  return c.json({ success: true, id: created.id });
});

// Search jobs across multiple job boards
app.post("/api/jobs/search", async (c) => {
  const { query, location, experienceLevel, jobType } = await c.req.json();

  if (!query) {
    return c.json({ error: "Search query is required" }, 400);
  }

  try {
    const firecrawl = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY ?? "" });
    interface ScrapedJob { id: string; title: string; description: string; url: string; source: string; location: string; postedDate: string | null; company?: string }
    const allJobs: ScrapedJob[] = [];
    const errors: string[] = [];
    
    // Encode query params
    const encodedQuery = encodeURIComponent(query);
    const encodedLocation = location ? encodeURIComponent(location) : "";
    
    // Define job board search URLs
    const jobBoardUrls = [
      {
        name: "Indeed",
        url: `https://www.indeed.com/jobs?q=${encodedQuery}${encodedLocation ? `&l=${encodedLocation}` : ""}`,
      },
      {
        name: "Glassdoor", 
        url: `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${encodedQuery}${encodedLocation ? `&locT=C&locKeyword=${encodedLocation}` : ""}`,
      },
      {
        name: "Naukri",
        url: `https://www.naukri.com/${encodedQuery.replace(/%20/g, "-")}-jobs${encodedLocation ? `-in-${encodedLocation.replace(/%20/g, "-")}` : ""}`,
      },
    ];

    // Try to scrape each job board
    for (const board of jobBoardUrls) {
      try {
        const result = await firecrawl.scrape(board.url, {
          formats: ["markdown"],
          timeout: 15000,
        });
        
        if (result && result.markdown) {
          // Extract job listings from markdown using patterns
          const lines = result.markdown.split("\n");
          let currentJob: Omit<ScrapedJob, "id"> & { id?: string } | null = null;
          
          for (const line of lines) {
            // Look for job title patterns (usually in headers or links)
            const titleMatch = line.match(/\[([^\]]+)\]\(([^)]+)\)/);
            if (titleMatch && (
              titleMatch[2].includes("/job/") || 
              titleMatch[2].includes("/jobs/") ||
              titleMatch[2].includes("/viewjob") ||
              titleMatch[2].includes("/rc/clk")
            )) {
              if (currentJob) {
                allJobs.push(currentJob as ScrapedJob);
              }
              currentJob = {
                id: `job-${allJobs.length}-${Date.now()}`,
                title: titleMatch[1].replace(/\*+/g, "").trim(),
                description: "",
                url: titleMatch[2].startsWith("http") ? titleMatch[2] : `https://${board.name.toLowerCase()}.com${titleMatch[2]}`,
                source: board.name,
                location: location || "Not specified",
                postedDate: null,
              };
            } else if (currentJob && line.trim() && !line.startsWith("#") && !line.startsWith("[")) {
              // Add to description
              currentJob.description += line.trim() + " ";
              
              // Try to extract location from description lines
              const locationPatterns = [
                /(?:location|loc|place):\s*([^,\n]+)/i,
                /(?:in|at)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?(?:,\s*[A-Z]{2})?)/,
                /([A-Z][a-z]+,\s*[A-Z]{2})/,  // City, STATE format
              ];
              for (const pattern of locationPatterns) {
                const locMatch = line.match(pattern);
                if (locMatch && currentJob.location === (location || "Not specified")) {
                  currentJob.location = locMatch[1].trim();
                  break;
                }
              }
            }
          }
          if (currentJob) {
            allJobs.push(currentJob as ScrapedJob);
          }
        }
      } catch (boardError: unknown) {
        console.error(`Error scraping ${board.name}:`, boardError instanceof Error ? boardError.message : boardError);
        errors.push(`${board.name}: Unable to fetch`);
      }
    }
    
    // If no jobs found from scraping, use Firecrawl search as fallback
    if (allJobs.length === 0) {
      try {
        // Put location at the start for better relevance
        const locationQuery = location ? `${location} ` : "";
        const expQuery = experienceLevel ? ` ${experienceLevel}` : "";
        const typeQuery = jobType ? ` ${jobType}` : "";
        const searchQuery = `${locationQuery}${query}${expQuery} jobs${typeQuery}`;
        
        const results = await firecrawl.search(searchQuery, {
          limit: 30,
        });

        const resultData = Array.isArray(results) ? results : (results as { data?: unknown[] }).data ?? [];
        const items = Array.isArray(resultData) ? resultData : [];
        items.forEach((item: Record<string, unknown>, index: number) => {
          const url = String(item.url ?? "");
          let source = "Web";
          
          if (url.includes("linkedin.com")) source = "LinkedIn";
          else if (url.includes("indeed.com")) source = "Indeed";
          else if (url.includes("naukri.com")) source = "Naukri";
          else if (url.includes("foundit.in") || url.includes("foundit.com")) source = "Foundit";
          else if (url.includes("glassdoor.com")) source = "Glassdoor";
          
          // Only add job-related URLs
          if (url && (
            url.includes("job") || 
            url.includes("career") || 
            url.includes("hiring") ||
            url.includes("position") ||
            url.includes("vacancy")
          )) {
            allJobs.push({
              id: `job-${index}-${Date.now()}`,
              title: String(item.title ?? "").trim() || "Job Position",
              description: String(item.description ?? item.snippet ?? ""),
              url: url,
              source: source,
              location: location || "Not specified",
              postedDate: null,
            });
          }
        });
      } catch (searchError) {
        console.error("Fallback search also failed:", searchError);
      }
    }

    // Deduplicate by URL
    const uniqueJobs = allJobs.filter((job, index, self) => 
      index === self.findIndex(j => j.url === job.url)
    );

    // If location was specified, filter and sort jobs to prioritize location matches
    let filteredJobs = uniqueJobs;
    let locationFilterMessage = "";
    
    if (location && location.trim()) {
      const locationLower = location.toLowerCase().trim();
      const locationTerms = locationLower.split(/[\s,]+/).filter((t: string) => t.length > 2);
      
      // Score each job based on location match
      type ScoredJob = ScrapedJob & { locationScore: number };
      const scoredJobs: ScoredJob[] = uniqueJobs.map(job => {
        const jobText = `${job.title} ${job.description} ${job.location} ${job.company || ""}`.toLowerCase();
        let score = 0;

        // Check for exact location match
        if (jobText.includes(locationLower)) {
          score += 100;
        }

        // Check for partial matches (city, state, country names)
        locationTerms.forEach((term: string) => {
          if (jobText.includes(term)) {
            score += 30;
          }
        });

        // Check for remote if location mentions remote
        if (locationLower.includes("remote") && jobText.includes("remote")) {
          score += 50;
        }

        return { ...job, locationScore: score };
      });

      // Sort by location score (highest first) and filter to those with some match
      const matchingJobs = scoredJobs
        .filter(job => job.locationScore > 0)
        .sort((a, b) => b.locationScore - a.locationScore);

      const nonMatchingJobs = scoredJobs
        .filter(job => job.locationScore === 0);

      // Prioritize matching jobs, then include others
      filteredJobs = [...matchingJobs, ...nonMatchingJobs].slice(0, 30);
      
      if (matchingJobs.length < uniqueJobs.length && matchingJobs.length > 0) {
        locationFilterMessage = `Showing ${matchingJobs.length} jobs matching "${location}" first, plus ${Math.min(nonMatchingJobs.length, 30 - matchingJobs.length)} other results.`;
      } else if (matchingJobs.length === 0) {
        locationFilterMessage = `No jobs found specifically in "${location}". Showing general results - try the direct job board links for better location filtering.`;
      }
    }

    // Remove the locationScore from final output (optional so it works when location filter wasn't applied)
    const finalJobs = filteredJobs.map((job: ScrapedJob & { locationScore?: number }) => {
      const { locationScore: _s, ...rest } = job;
      return rest;
    }).slice(0, 30);

    return c.json({ 
      jobs: finalJobs, 
      message: locationFilterMessage || (errors.length > 0 ? `Some job boards couldn't be reached: ${errors.join(", ")}` : undefined)
    });
  } catch (error: unknown) {
    console.error("Error searching jobs:", error);
    const message = error instanceof Error ? error.message : "Failed to search jobs";
    return c.json({ error: `Job search error: ${message}. Please try again.` }, 500);
  }
});

// ================== JOB MATCH SCORING API ==================

// Get stored role fit assessments for jobs (single source: role_fit_assessments only; no quick-estimate)
app.post("/api/jobs/stored-fit-scores", requireAuth, async (c) => {
  const user = c.get("user");
  const { jobs } = await c.req.json();

  if (!jobs || !Array.isArray(jobs)) {
    return c.json({ error: "Jobs array is required" }, 400);
  }

  try {
    const scores: Record<string, number | null> = {};
    const descriptionForKey = (j: { description?: string; fullDescription?: string }) => (j.fullDescription ?? j.description ?? "").trim();
    for (const job of jobs) {
      const desc = descriptionForKey(job);
      scores[job.id] = await getDisplayFitScore(user!.id, job.title || "", job.company || "", desc);
    }
    return c.json({ scores });
  } catch (error) {
    console.error("Error fetching stored fit scores:", error);
    return c.json({ scores: {} });
  }
});

// Role Fit is stored only via assess-fit; never use a second scoring algorithm.
app.post("/api/jobs/match-scores", async (c) => {
  return c.json(
    { error: "Use POST /api/jobs/stored-fit-scores for Role Fit. Run full analysis via POST /api/profiles/:id/assess-fit to store a score.", code: "DEPRECATED_USE_STORED_FIT" },
    410
  );
});

// ================== APPLICATIONS API ==================

// Create application
app.post("/api/applications", requireAuth, async (c) => {
  const user = c.get("user");
  const body = await c.req.json() as {
    profileId?: string; profile_id?: string; jobTitle?: string; job_title?: string; company?: string;
    jobUrl?: string; job_url?: string; source?: string; location?: string; salaryRange?: string; salary_range?: string;
    notes?: string; status?: string; matchScore?: number; match_score?: number; priority?: string;
    jobDescription?: string; job_description?: string;
  };
  const { profileId, profile_id, jobTitle, job_title, company, jobUrl, job_url, source, location, salaryRange, salary_range, notes, status, matchScore, match_score, priority, jobDescription, job_description } = body;
  const finalProfileId = profileId ?? profile_id;
  const finalJobTitle = jobTitle ?? job_title ?? "";
  const finalJobUrl = jobUrl ?? job_url;
  const finalSalaryRange = salaryRange ?? salary_range;
  const finalMatchScore = matchScore ?? match_score;
  const finalJobDescription = jobDescription ?? job_description;

  if (!finalJobTitle || !company) {
    return c.json({ error: "Job title and company are required" }, 400);
  }

  // Resolve profile from session: "me" or omit = user's default profile; otherwise must be user's profile id
  const profile =
    finalProfileId === "me" || finalProfileId === undefined || finalProfileId === null
      ? await getEnv().DB.profile.findFirst({ where: { user_id: user!.id }, orderBy: { created_at: "desc" }, select: { id: true } })
      : await getEnv().DB.profile.findFirst({ where: { id: Number(finalProfileId), user_id: user!.id }, select: { id: true } });
  if (!profile) {
    return c.json({ error: "Profile not found" }, 404);
  }

  try {
    const application = await getEnv().DB.application.create({
      data: {
        profile_id: profile.id,
        user_id: user!.id,
        job_title: finalJobTitle,
        company,
        job_url: finalJobUrl || null,
        source: source || null,
        location: location || null,
        salary_range: finalSalaryRange || null,
        notes: notes || null,
        status: status || "applied",
        match_score: finalMatchScore ?? null,
        priority: priority || "warm",
        job_description: finalJobDescription || null,
      },
    });
    return c.json({ id: application.id, application, message: "Application tracked successfully" });
  } catch (error) {
    console.error("Error creating application:", error);
    return c.json({ error: "Failed to track application" }, 500);
  }
});

// Get all applications for the current user ("me") across all profiles
app.get("/api/applications/me", requireAuth, async (c) => {
  const user = c.get("user");
  try {
    const applications = await getEnv().DB.application.findMany({
      where: { user_id: user!.id },
      orderBy: { applied_at: "desc" },
    });
    return c.json({ applications });
  } catch (error) {
    console.error("Error fetching applications for current user:", error);
    return c.json({ error: "Failed to fetch applications" }, 500);
  }
});

// Get all applications for a profile
app.get("/api/applications/:profileId", requireAuth, async (c) => {
  const user = c.get("user");
  const profileIdParam = c.req.param("profileId");
  const profile = profileIdParam === "me"
    ? await getEnv().DB.profile.findFirst({ where: { user_id: user!.id }, orderBy: { created_at: "desc" }, select: { id: true } })
    : await getEnv().DB.profile.findFirst({ where: { id: parseInt(profileIdParam, 10), user_id: user!.id }, select: { id: true } });
  if (!profile) {
    return c.json({ error: "Profile not found" }, 404);
  }
  try {
    const applications = await getEnv().DB.application.findMany({
      where: { profile_id: profile.id },
      orderBy: { applied_at: "desc" },
    });
    return c.json({ applications });
  } catch (error) {
    console.error("Error fetching applications:", error);
    return c.json({ error: "Failed to fetch applications" }, 500);
  }
});

// Update application
app.patch("/api/applications/:id", requireAuth, async (c) => {
  const user = c.get("user");
  const id = parseInt(c.req.param("id"), 10);
  const body = await c.req.json();
  const { status, notes, matchScore, priority, interviewDate, contactName, followUpReminder, jobDescription } = body;

  const app = await getEnv().DB.application.findFirst({
    where: { id, profile: { user_id: user!.id } },
    select: { id: true },
  });
  if (!app) {
    return c.json({ error: "Application not found" }, 404);
  }

  try {
    const updated = await getEnv().DB.application.update({
      where: { id },
      data: {
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes }),
        ...(matchScore !== undefined && { match_score: matchScore }),
        ...(priority !== undefined && { priority }),
        ...(interviewDate !== undefined && { interview_date: interviewDate ? new Date(interviewDate) : null }),
        ...(contactName !== undefined && { contact_name: contactName }),
        ...(followUpReminder !== undefined && { follow_up_reminder: followUpReminder }),
        ...(jobDescription !== undefined && { job_description: jobDescription }),
        last_activity_at: new Date(),
        updated_at: new Date(),
      },
    });
    return c.json({ message: "Application updated", application: updated });
  } catch (error) {
    console.error("Error updating application:", error);
    return c.json({ error: "Failed to update application" }, 500);
  }
});

// Delete application
app.delete("/api/applications/:id", requireAuth, async (c) => {
  const user = c.get("user");
  const id = parseInt(c.req.param("id"), 10);
  const app = await getEnv().DB.application.findFirst({
    where: { id, profile: { user_id: user!.id } },
    select: { id: true },
  });
  if (!app) {
    return c.json({ error: "Application not found" }, 404);
  }
  try {
    await getEnv().DB.application.delete({ where: { id } });
    return c.json({ message: "Application deleted" });
  } catch (error) {
    console.error("Error deleting application:", error);
    return c.json({ error: "Failed to delete application" }, 500);
  }
});

// Get aggregated application stats for the current user ("me") across all profiles
app.get("/api/applications/me/stats", requireAuth, async (c) => {
  const user = c.get("user");
  try {
    const [total, applied, interviewing, offered, rejected, accepted] = await Promise.all([
      getEnv().DB.application.count({ where: { user_id: user!.id } }),
      getEnv().DB.application.count({ where: { user_id: user!.id, status: "applied" } }),
      getEnv().DB.application.count({ where: { user_id: user!.id, status: "interviewing" } }),
      getEnv().DB.application.count({ where: { user_id: user!.id, status: "offered" } }),
      getEnv().DB.application.count({ where: { user_id: user!.id, status: "rejected" } }),
      getEnv().DB.application.count({ where: { user_id: user!.id, status: "accepted" } }),
    ]);
    return c.json({ stats: { total, applied, interviewing, offered, rejected, accepted } });
  } catch (error) {
    console.error("Error fetching stats for current user:", error);
    return c.json({ error: "Failed to fetch stats" }, 500);
  }
});

// Get application stats for a profile
app.get("/api/applications/:profileId/stats", requireAuth, async (c) => {
  const user = c.get("user");
  const profileIdParam = c.req.param("profileId");
  const profile = profileIdParam === "me"
    ? await getEnv().DB.profile.findFirst({ where: { user_id: user!.id }, orderBy: { created_at: "desc" }, select: { id: true } })
    : await getEnv().DB.profile.findFirst({ where: { id: parseInt(profileIdParam, 10), user_id: user!.id }, select: { id: true } });
  if (!profile) {
    return c.json({ error: "Profile not found" }, 404);
  }
  try {
    const [total, applied, interviewing, offered, rejected, accepted] = await Promise.all([
      getEnv().DB.application.count({ where: { profile_id: profile.id } }),
      getEnv().DB.application.count({ where: { profile_id: profile.id, status: "applied" } }),
      getEnv().DB.application.count({ where: { profile_id: profile.id, status: "interviewing" } }),
      getEnv().DB.application.count({ where: { profile_id: profile.id, status: "offered" } }),
      getEnv().DB.application.count({ where: { profile_id: profile.id, status: "rejected" } }),
      getEnv().DB.application.count({ where: { profile_id: profile.id, status: "accepted" } }),
    ]);
    return c.json({ stats: { total, applied, interviewing, offered, rejected, accepted } });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return c.json({ error: "Failed to fetch stats" }, 500);
  }
});

// ===== Saved Searches Endpoints =====

// Get saved searches for a profile
app.get("/api/saved-searches", requireAuth, async (c) => {
  const user = c.get("user");
  const profileId = c.req.query("profileId");
  if (!profileId) {
    return c.json({ error: "profileId required" }, 400);
  }
  const profile = await getEnv().DB.profile.findFirst({
    where: { id: parseInt(profileId, 10), user_id: user!.id },
    select: { id: true },
  });
  if (!profile) {
    return c.json({ error: "Profile not found" }, 404);
  }
  try {
    const searches = await getEnv().DB.savedSearch.findMany({
      where: { profile_id: profile.id },
      orderBy: { created_at: "desc" },
    });
    return c.json({ searches });
  } catch (error) {
    console.error("Error fetching saved searches:", error);
    return c.json({ error: "Failed to fetch saved searches" }, 500);
  }
});

// Save a search
app.post("/api/saved-searches", requireAuth, async (c) => {
  const user = c.get("user");
  try {
    const body = await c.req.json();
    const { profileId, name, query, location, filters } = body;
    if (!profileId || !name || !query) {
      return c.json({ error: "profileId, name, and query are required" }, 400);
    }
    const profile = await getEnv().DB.profile.findFirst({
      where: { id: profileId, user_id: user!.id },
      select: { id: true },
    });
    if (!profile) {
      return c.json({ error: "Profile not found" }, 404);
    }
    const created = await getEnv().DB.savedSearch.create({
      data: { profile_id: profileId, name, query, location: location || null, filters: filters ?? "{}" },
    });
    return c.json({ success: true, id: created.id });
  } catch (error) {
    console.error("Error saving search:", error);
    return c.json({ error: "Failed to save search" }, 500);
  }
});

// Delete a saved search
app.delete("/api/saved-searches/:id", requireAuth, async (c) => {
  const user = c.get("user");
  const id = parseInt(c.req.param("id"), 10);
  const search = await getEnv().DB.savedSearch.findFirst({
    where: { id, profile: { user_id: user!.id } },
    select: { id: true },
  });
  if (!search) {
    return c.json({ error: "Saved search not found" }, 404);
  }
  try {
    await getEnv().DB.savedSearch.delete({ where: { id } });
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting saved search:", error);
    return c.json({ error: "Failed to delete saved search" }, 500);
  }
});

// Get saved resume versions for a profile (with ownership check)
app.get("/api/resume-versions/:profileId", requireAuth, async (c) => {
  const user = c.get("user");
  const profileId = parseInt(c.req.param("profileId"));
  const profile = await getEnv().DB.profile.findFirst({
    where: { id: profileId, user_id: user!.id },
    select: { id: true },
  });
  if (!profile) {
    return c.json({ error: "Profile not found" }, 404);
  }
  try {
    const versions = await getEnv().DB.resumeVersion.findMany({
      where: { profile_id: profileId },
      select: { id: true, job_title: true, company: true, match_score: true, created_at: true },
      orderBy: { created_at: "desc" },
    });
    return c.json({ versions });
  } catch (error) {
    console.error("Error fetching resume versions:", error);
    return c.json({ error: "Failed to fetch resume versions" }, 500);
  }
});

// Save a resume version (with ownership check)
app.post("/api/resume-versions", requireAuth, async (c) => {
  const user = c.get("user");
  try {
    const { profileId, jobTitle, company, jobDescription, tailoredContent, matchScore } = await c.req.json();
    if (!profileId || !jobTitle || !tailoredContent) {
      return c.json({ error: "profileId, jobTitle, and tailoredContent are required" }, 400);
    }
    const profile = await getEnv().DB.profile.findFirst({
      where: { id: profileId, user_id: user!.id },
      select: { id: true },
    });
    if (!profile) {
      return c.json({ error: "Profile not found" }, 404);
    }
    const created = await getEnv().DB.resumeVersion.create({
      data: {
        profile_id: profileId,
        job_title: jobTitle,
        company: company || "",
        job_description: jobDescription ?? null,
        tailored_content: typeof tailoredContent === "string" ? tailoredContent : JSON.stringify(tailoredContent),
        match_score: matchScore ?? null,
      },
    });
    return c.json({ success: true, id: created.id });
  } catch (error) {
    console.error("Error saving resume version:", error);
    return c.json({ error: "Failed to save resume version" }, 500);
  }
});

// Get a specific resume version
app.get("/api/resume-versions/detail/:id", requireAuth, async (c) => {
  const user = c.get("user");
  const id = parseInt(c.req.param("id"));
  const version = await getEnv().DB.resumeVersion.findFirst({
    where: { id, profile: { user_id: user!.id } },
  });
  if (!version) {
    return c.json({ error: "Resume version not found" }, 404);
  }
  try {
    const tailored = version.tailored_content ? JSON.parse(version.tailored_content) : null;
    return c.json({ ...version, tailored_content: tailored });
  } catch {
    return c.json({ error: "Failed to fetch resume version" }, 500);
  }
});

// Delete a resume version
app.delete("/api/resume-versions/:id", requireAuth, async (c) => {
  const user = c.get("user");
  const id = parseInt(c.req.param("id"));
  const version = await getEnv().DB.resumeVersion.findFirst({
    where: { id, profile: { user_id: user!.id } },
    select: { id: true },
  });
  if (!version) {
    return c.json({ error: "Resume version not found" }, 404);
  }
  try {
    await getEnv().DB.resumeVersion.delete({ where: { id } });
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting resume version:", error);
    return c.json({ error: "Failed to delete resume version" }, 500);
  }
});

// Generate interview prep questions with STAR answers
app.post("/api/interview-prep/:applicationId", requireAuth, async (c) => {
  const param = c.req.param("applicationId");
  const applicationId = parseInt(param, 10);
  const user = c.get("user");
  const userId = user?.id;

  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  if (Number.isNaN(applicationId) || applicationId < 1) {
    console.error("[interview-prep] Invalid applicationId:", param);
    return c.json({ error: "Application not found. Please select an application from your list." }, 404);
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return c.json({ error: "AI service not configured" }, 503);
  }

  try {
    // Verify ownership: application.id = :id AND profile.user_id = current user (UUID)
    const application = await getEnv().DB.application.findFirst({
      where: {
        id: applicationId,
        profile: { user_id: userId },
      },
      include: {
        profile: {
          include: { experiences: true, education: true, skills: true },
        },
      },
    });

    if (!application) {
      console.error("[interview-prep] Application not found or access denied. applicationId:", applicationId, "userId:", userId);
      return c.json({ error: "Application not found or you don't have access. Please select an application from your list." }, 404);
    }

    const profile = application.profile;

    // If no job description, return app + profile so frontend can prompt user to add one
    const hasJobDescription = application.job_description != null && application.job_description.trim().length > 0;
    if (!hasJobDescription) {
      return c.json({
        application: {
          id: application.id,
          job_title: application.job_title,
          company: application.company,
          job_description: application.job_description,
          interview_date: application.interview_date,
        },
        profile: {
          id: profile.id,
          full_name: profile.full_name,
          headline: profile.headline,
          summary: profile.summary,
          experiences: profile.experiences,
          education: profile.education,
          skills: profile.skills,
        },
        questions: [],
        noJobDescription: true,
      });
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "", maxRetries: 3, timeout: 60000 });
    const recentExperiences = profile.experiences.slice(0, 3);

    const prompt = `Generate 6 interview questions for this role with STAR answer frameworks.

JOB: ${application.job_title} at ${application.company}
DESCRIPTION: ${(application.job_description || "").substring(0, 500)}

CANDIDATE: ${profile.full_name}
EXPERIENCE: ${recentExperiences.map((exp) => `${exp.title} at ${exp.company}`).join("; ") || "None"}
SKILLS: ${profile.skills.slice(0, 10).map((s) => s.name).join(", ") || "None"}

Return JSON only:
{"questions":[{"id":1,"question":"...","category":"behavioral|technical|situational|role-specific","difficulty":"easy|medium|hard","starAnswer":{"situation":"...","task":"...","action":"...","result":"..."},"tips":"..."}]}

Generate 6 questions: 2 behavioral, 2 technical, 1 situational, 1 role-specific. Be concise.`;

    const result = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const resultText = result.content[0].type === "text" ? result.content[0].text : "{}";
    const rawQuestions = extractJSON(resultText);
    if (!rawQuestions) {
      console.error("[interview-prep] Failed to parse AI response:", resultText.substring(0, 500));
      return c.json({ error: "Failed to process interview prep. Please try again." }, 500);
    }
    const questionsList = (rawQuestions as { questions?: unknown[] }).questions || [];

    return c.json({
      application: {
        id: application.id,
        job_title: application.job_title,
        company: application.company,
        job_description: application.job_description,
        interview_date: application.interview_date,
      },
      profile: {
        id: profile.id,
        full_name: profile.full_name,
        headline: profile.headline,
        summary: profile.summary,
        experiences: profile.experiences,
        education: profile.education,
        skills: profile.skills,
      },
      questions: questionsList,
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    const errStack = error instanceof Error ? error.stack : undefined;
    const errName = error instanceof Error ? error.name : undefined;
    console.error("[interview-prep] Failed to load interview prep. Error name:", errName, "message:", errMsg);
    if (errStack) console.error("[interview-prep] Stack:", errStack);
    console.error("[interview-prep] Full error object:", error);
    return c.json({ error: "Failed to generate interview prep. Please try again." }, 500);
  }
});

// Get AI feedback on practice answer
app.post("/api/interview-prep/feedback", requireAuth, async (c) => {
  const body = await c.req.json();
  const { question, userAnswer, starAnswer } = body;

  if (!question || !userAnswer) {
    return c.json({ error: "Question and answer are required" }, 400);
  }

  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY) {
    return c.json({ error: "AI service not configured" }, 503);
  }

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? "", maxRetries: 3, timeout: 60000 });

    const prompt = `You are an expert interview coach. Evaluate this practice answer and provide constructive feedback.

INTERVIEW QUESTION:
${question}

SUGGESTED STAR FRAMEWORK:
- Situation: ${starAnswer?.situation || 'Not provided'}
- Task: ${starAnswer?.task || 'Not provided'}
- Action: ${starAnswer?.action || 'Not provided'}
- Result: ${starAnswer?.result || 'Not provided'}

CANDIDATE'S PRACTICE ANSWER:
${userAnswer}

Provide feedback as JSON:
{
  "overallScore": 0-100,
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1", "improvement 2"],
  "starAnalysis": {
    "situation": { "present": true/false, "feedback": "brief feedback" },
    "task": { "present": true/false, "feedback": "brief feedback" },
    "action": { "present": true/false, "feedback": "brief feedback" },
    "result": { "present": true/false, "feedback": "brief feedback" }
  },
  "revisedAnswer": "A polished version of their answer incorporating the improvements"
}

Be encouraging but honest. Focus on actionable improvements.

IMPORTANT: Respond with only the JSON object, no additional text.`;

    const result = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }]
    });

    const resultText = result.content[0].type === 'text' ? result.content[0].text : "{}";
    const feedback = extractJSON(resultText);
    
    if (!feedback) {
      console.error("[interview-feedback] Failed to parse AI response:", resultText.substring(0, 500));
      return c.json({ error: "Failed to process feedback. Please try again." }, 500);
    }
    
    return c.json(feedback);
  } catch (error) {
    console.error("Error generating feedback:", error);
    return c.json({ error: "Failed to generate feedback" }, 500);
  }
});

// Get or create user's referral data
app.get("/api/referral", requireAuth, async (c) => {
  const user = c.get("user") as { id: string };
  try {
    let referral = await getEnv().DB.referral.findFirst({ where: { user_id: user.id } });
    if (!referral) {
      const referralCode = `CF${user.id.slice(0, 8).toUpperCase()}${Date.now().toString(36).toUpperCase()}`;
      referral = await getEnv().DB.referral.create({
        data: { user_id: user.id, referral_code: referralCode },
      });
    }
    return c.json({ referral });
  } catch (error) {
    console.error("Error fetching referral:", error);
    return c.json({ error: "Failed to fetch referral data" }, 500);
  }
});

// Track referral signup (called when new user signs up with referral code)
app.post("/api/referral/track", async (c) => {
  const body = await c.req.json();
  const { referralCode } = body;
  if (!referralCode) {
    return c.json({ error: "Referral code is required" }, 400);
  }
  try {
    const referral = await getEnv().DB.referral.findUnique({ where: { referral_code: referralCode } });
    if (!referral) {
      return c.json({ error: "Invalid referral code" }, 404);
    }
    await getEnv().DB.referral.update({
      where: { id: referral.id },
      data: { referred_count: { increment: 1 }, updated_at: new Date() },
    });
    return c.json({ success: true });
  } catch (error) {
    console.error("Error tracking referral:", error);
    return c.json({ error: "Failed to track referral" }, 500);
  }
});

// Track platform referral clicks (for job board partnership data)
app.post("/api/tracking/platform-referral", requireAuth, async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const body = await c.req.json();
  const { platform, jobTitle, jobUrl } = body;
  if (!platform) {
    return c.json({ error: "Platform is required" }, 400);
  }
  try {
    await getEnv().DB.platformReferral.create({
      data: { user_id: user.id, platform, job_title: jobTitle || null, job_url: jobUrl || null },
    });
    return c.json({ success: true });
  } catch (error) {
    console.error("Error tracking platform referral:", error);
    return c.json({ error: "Failed to track referral" }, 500);
  }
});

// Track company page searches
app.post("/api/tracking/company-search", requireAuth, async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const body = await c.req.json();
  const { companyName, companyUrl } = body;
  if (!companyName) {
    return c.json({ error: "Company name is required" }, 400);
  }
  try {
    await getEnv().DB.companySearch.create({
      data: { user_id: user.id, company_name: companyName, company_url: companyUrl || null },
    });
    return c.json({ success: true });
  } catch (error) {
    console.error("Error tracking company search:", error);
    return c.json({ error: "Failed to track company search" }, 500);
  }
});

// JSearch API - Search jobs via RapidAPI
app.get("/api/jsearch", async (c) => {
  const query = c.req.query("query") || "";
  const location = c.req.query("location") || "";
  const country = c.req.query("country") || "in";
  const page = c.req.query("page") || "1";
  const numResults = c.req.query("num_results") || "10";

  if (!query.trim()) {
    return c.json({ error: "Search query is required" }, 400);
  }

  const rapidApiKey = process.env.RAPIDAPI_KEY;
  if (!rapidApiKey) {
    return c.json({ 
      error: "Job search API not configured. Please add your RapidAPI key.",
      code: "API_NOT_CONFIGURED"
    }, 500);
  }

  try {
    // Combine query and location for the search
    const searchQuery = location.trim() 
      ? `${query.trim()} in ${location.trim()}`
      : query.trim();

    const url = new URL("https://jsearch.p.rapidapi.com/search");
    url.searchParams.set("query", searchQuery);
    url.searchParams.set("page", page);
    url.searchParams.set("num_pages", "1");
    url.searchParams.set("num_results", numResults);
    url.searchParams.set("country", country);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "x-rapidapi-host": "jsearch.p.rapidapi.com",
        "x-rapidapi-key": rapidApiKey,
      },
    });

    if (!response.ok) {
      let errorDetails: string;
      try {
        errorDetails = await response.text();
      } catch {
        errorDetails = "Could not read error response";
      }
      console.error("JSearch API error:", response.status, errorDetails);
      
      if (response.status === 401) {
        return c.json({ 
          error: "Invalid or missing RapidAPI key",
          code: "AUTH_ERROR"
        }, 401);
      }
      if (response.status === 403) {
        return c.json({ 
          error: "Access forbidden. Check if your RapidAPI subscription includes JSearch.",
          code: "AUTH_ERROR",
          status: response.status
        }, 403);
      }
      if (response.status === 429) {
        return c.json({ 
          error: "API rate limit exceeded. Please try again later.",
          code: "RATE_LIMITED",
          status: response.status
        }, 429);
      }
      
      return c.json({ 
        error: "Job search failed",
        status: response.status,
        details: errorDetails
      }, 500);
    }

    const data = (await response.json()) as {
      data?: unknown[];
      parameters?: { total_num?: number; num_results?: number };
      total?: number;
    };
    // Expose total when available for "Showing 1-10 of N results"
    const total = data.total ?? data.parameters?.total_num ?? null;
    if (total !== null && typeof total === "number") {
      return c.json({ ...data, totalResults: total });
    }
    return c.json(data);
  } catch (error: unknown) {
    console.error("JSearch API error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return c.json({ 
      error: "Failed to search jobs. Please try again.",
      code: "FETCH_ERROR",
      details: errorMessage
    }, 500);
  }
});

// Track referral conversion (when referred user upgrades to Pro)
app.post("/api/referral/convert", async (c) => {
  const body = await c.req.json();
  const { referralCode } = body;
  if (!referralCode) {
    return c.json({ error: "Referral code is required" }, 400);
  }
  try {
    const referral = await getEnv().DB.referral.findUnique({ where: { referral_code: referralCode } });
    if (!referral) {
      return c.json({ error: "Invalid referral code" }, 404);
    }
    await getEnv().DB.referral.update({
      where: { id: referral.id },
      data: { converted_count: { increment: 1 }, updated_at: new Date() },
    });
    return c.json({ success: true });
  } catch (error) {
    console.error("Error tracking conversion:", error);
    return c.json({ error: "Failed to track conversion" }, 500);
  }
});

// Production: serve built SPA from dist/ (only when dist exists, e.g. after npm run build)
const staticRoot = path.join(process.cwd(), "dist");
if (fs.existsSync(staticRoot)) {
  app.use("/assets/*", serveStatic({ root: staticRoot }));
  const indexPath = path.join(staticRoot, "index.html");
  if (fs.existsSync(indexPath)) {
    const indexHtml = fs.readFileSync(indexPath, "utf-8");
    app.get("*", (c) => {
      if (c.req.path.startsWith("/api")) return c.notFound();
      return c.html(indexHtml);
    });
  }
}

export default app;
