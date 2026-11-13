import { generateText, Output } from "ai";
import { z } from "zod";
import { auth } from "@/auth";
import { apiVersion, projectId } from "@/sanity/env";

/**
 * EN → DE translation for Sanity Studio's bilingual fields.
 * Auth: a logged-in Studio user (their Sanity token, verified against Sanity) or an admin session.
 * Model: AI Gateway (Vercel OIDC on Vercel; `vercel env pull` locally). Override with AI_TRANSLATE_MODEL.
 */
export const runtime = "nodejs";

const MODEL = process.env.AI_TRANSLATE_MODEL || "anthropic/claude-haiku-5.5";
const MAX_ITEMS = 120;
const MAX_CHARS = 24_000;

const Body = z.object({ texts: z.array(z.string().max(6000)).min(1).max(MAX_ITEMS) });

// --- auth: verify the caller is a member of this Sanity project (cached 10 min) ---
const verified = new Map<string, { id: string; until: number }>();
async function sanityUser(token: string): Promise<string | null> {
  const hit = verified.get(token);
  if (hit && hit.until > Date.now()) return hit.id;
  const res = await fetch(`https://${projectId}.api.sanity.io/v${apiVersion}/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  }).catch(() => null);
  if (!res?.ok) return null;
  const me = (await res.json().catch(() => null)) as { id?: string; role?: string } | null;
  if (!me?.id) return null;
  verified.set(token, { id: me.id, until: Date.now() + 10 * 60_000 });
  return me.id;
}

// --- tiny per-user rate limit: 300 strings / 10 min (protects the free credit) ---
const usage = new Map<string, { n: number; since: number }>();
function allow(user: string, n: number): boolean {
  const now = Date.now();
  const u = usage.get(user);
  if (!u || now - u.since > 10 * 60_000) {
    usage.set(user, { n, since: now });
    return true;
  }
  if (u.n + n > 300) return false;
  u.n += n;
  return true;
}

const SYSTEM = `You translate website copy for Somdatt Sharma, a wedding, event and brand photographer & filmmaker based in Hamburg, from English into natural, idiomatic German.
Rules:
- Return exactly one German string per input string, in the same order.
- Tone: warm, confident, modern. Address the reader informally ("du"/"ihr"), matching existing German copy like "Lass uns etwas Bleibendes schaffen."
- Keep names, places, brands, numbers, URLs, e-mail addresses and emoji unchanged.
- Keep inline tags such as <s0>…</s0> exactly (same tag names, same order) around the matching German words.
- Keep line breaks, leading/trailing spaces and punctuation style. Do not add quotes or explanations.
- An empty input string stays empty.`;

export async function POST(req: Request) {
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  let user: string | null = null;
  if (bearer) user = await sanityUser(bearer);
  else {
    const session = await auth();
    if (session) user = session.user?.email ?? "admin";
  }
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "bad_request" }, { status: 400 });
  const { texts } = parsed.data;
  if (texts.reduce((s, t) => s + t.length, 0) > MAX_CHARS) {
    return Response.json({ error: "too_long" }, { status: 413 });
  }
  if (!allow(user, texts.length)) return Response.json({ error: "rate_limited" }, { status: 429 });

  // Nothing to translate → echo empties without a model call.
  if (texts.every((t) => !t.trim())) return Response.json({ de: texts });

  try {
    const { output } = await generateText({
      model: MODEL,
      system: SYSTEM,
      prompt: JSON.stringify(texts),
      output: Output.array({ element: z.string(), minItems: texts.length, maxItems: texts.length }),
    });
    return Response.json({ de: output.map((t, i) => (texts[i].trim() ? t : texts[i])) });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[translate]", msg);
    const status = /credit|verification|payment|quota|429|rate/i.test(msg) ? 503 : 502;
    return Response.json({ error: "translation_unavailable" }, { status });
  }
}
