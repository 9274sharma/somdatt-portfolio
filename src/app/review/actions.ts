"use server";

import { headers } from "next/headers";
import { Resend } from "resend";
import { z } from "zod";
import { writeClient } from "@/sanity/writeClient";
import { readReviewToken } from "@/lib/reviewToken";
import { purgeRejectedReviews } from "@/lib/reviews";
import { getLang } from "@/i18n/server";
import type { ReviewInput, ReviewResult } from "@/components/reviews/ReviewForm";

const Input = z.object({
  rating: z.number().int().min(1).max(5),
  type: z.enum(["", "wedding", "event", "brand", "portrait", "other"]),
  name: z.string().trim().min(1).max(60),
  role: z.string().trim().max(60),
  text: z.string().trim().min(30).max(600),
  consent: z.literal(true),
  website: z.string().max(200),
  invite: z.string().max(200).optional(),
});

// 5 submissions per IP per hour (in-memory; good enough against casual spam).
const hits = new Map<string, number[]>();
function allow(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 3_600_000);
  if (recent.length >= 5) return false;
  hits.set(ip, [...recent, now]);
  return true;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** Saves a review as "pending" (never published automatically) and emails the owner. */
export async function submitReview(raw: ReviewInput): Promise<ReviewResult> {
  const parsed = Input.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const v = parsed.data;
  if (v.website) return { ok: true }; // honeypot: pretend it worked

  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || "local";
  if (!allow(ip)) return { ok: false, error: "rate_limited" };

  // Personal link → verified (max 2 reviews per booking, e.g. a couple); later uses are flagged.
  const bookingId = readReviewToken(v.invite);
  let verified = false;
  let tokenReused = false;
  if (bookingId) {
    const used = await writeClient.fetch<number>(`count(*[_type=="review" && booking._ref==$id])`, { id: bookingId });
    verified = used < 2;
    tokenReused = used >= 2;
  }

  const lang = await getLang();
  try {
    await writeClient.create({
      _type: "review",
      status: "pending",
      rating: v.rating,
      ...(v.type ? { type: v.type } : {}),
      name: v.name,
      ...(v.role ? { role: v.role } : {}),
      text: v.text,
      lang,
      consent: true,
      verified,
      ...(tokenReused ? { tokenReused: true } : {}),
      ...(bookingId ? { booking: { _type: "reference", _ref: bookingId, _weak: true } } : {}),
      submittedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error("review: create failed", e);
    return { ok: false, error: "save" };
  }

  void purgeRejectedReviews();

  // Tell the owner (never blocks the client's success screen).
  const key = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  if (key && to) {
    const stars = "★".repeat(v.rating) + "☆".repeat(5 - v.rating);
    const origin = h.get("origin") ?? "";
    await new Resend(key).emails
      .send({
        from: process.env.RESEND_FROM ?? "Portfolio <onboarding@resend.dev>",
        to: [to],
        subject: `New review ${stars} · ${v.name}${verified ? " (verified)" : ""}`,
        html: `<p><strong>${esc(v.name)}</strong>${v.role ? ` · ${esc(v.role)}` : ""} — ${stars}${verified ? " · ✓ verified booking" : ""}${tokenReused ? " · ⚠ personal link used before" : ""}</p>
<blockquote style="white-space:pre-wrap">${esc(v.text)}</blockquote>
<p><a href="${origin}/admin?tab=reviews">Approve or reject in Admin → Reviews</a></p>`,
        text: `${v.name} — ${stars}\n\n${v.text}\n\nApprove: ${origin}/admin?tab=reviews`,
      })
      .catch((e: unknown) => console.error("review: email failed", e));
  }
  return { ok: true };
}
