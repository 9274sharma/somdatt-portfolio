import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/** Personal review links: `<bookingId>.<sig>` — signed with AUTH_SECRET, so they can't be forged. */
const secret = () => {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET missing");
  return s;
};
const sig = (id: string) => createHmac("sha256", secret()).update(`review:${id}`).digest("base64url").slice(0, 16);

export function reviewToken(bookingId: string): string {
  return `${Buffer.from(bookingId).toString("base64url")}.${sig(bookingId)}`;
}

/** Returns the booking id for a valid token, else null. */
export function readReviewToken(token: string | undefined | null): string | null {
  if (!token) return null;
  const [raw, s] = token.split(".");
  if (!raw || !s) return null;
  let id: string;
  try {
    id = Buffer.from(raw, "base64url").toString("utf8");
  } catch {
    return null;
  }
  if (!/^[\w.-]{1,100}$/.test(id)) return null;
  const a = Buffer.from(s);
  const b = Buffer.from(sig(id));
  return a.length === b.length && timingSafeEqual(a, b) ? id : null;
}

/* Same scheme for other per-booking links (e.g. the client's calendar file). */
const sigFor = (kind: string, id: string) => createHmac("sha256", secret()).update(`${kind}:${id}`).digest("base64url").slice(0, 16);
export const signedId = (kind: string, id: string) => `${Buffer.from(id).toString("base64url")}.${sigFor(kind, id)}`;
export function readSignedId(kind: string, token: string | undefined | null): string | null {
  if (!token) return null;
  const [raw, s] = token.split(".");
  if (!raw || !s) return null;
  const id = Buffer.from(raw, "base64url").toString("utf8");
  if (!/^[\w.-]{1,100}$/.test(id)) return null;
  const a = Buffer.from(s);
  const b = Buffer.from(sigFor(kind, id));
  return a.length === b.length && timingSafeEqual(a, b) ? id : null;
}
