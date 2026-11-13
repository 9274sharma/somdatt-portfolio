import "server-only";
import { createSign } from "node:crypto";
import { readFileSync } from "node:fs";

/** Google Calendar via a service account the owner shared his calendar with ("Make changes to events").
 *  Write-only by choice: the site adds/removes its own booking events and never reads his personal events.
 *  Env: GOOGLE_CALENDAR_ID + GOOGLE_CLIENT_EMAIL + GOOGLE_PRIVATE_KEY
 *  (locally GOOGLE_SERVICE_ACCOUNT_FILE pointing at the downloaded JSON also works). Everything is a no-op without them. */

type Creds = { email: string; key: string };
function creds(): Creds | null {
  if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY)
    return { email: process.env.GOOGLE_CLIENT_EMAIL, key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n") };
  const file = process.env.GOOGLE_SERVICE_ACCOUNT_FILE;
  if (file) {
    try {
      const j = JSON.parse(readFileSync(file, "utf8")) as { client_email?: string; private_key?: string };
      if (j.client_email && j.private_key) return { email: j.client_email, key: j.private_key };
    } catch {
      console.error("gcal: could not read GOOGLE_SERVICE_ACCOUNT_FILE");
    }
  }
  return null;
}
const calendarId = () => process.env.GOOGLE_CALENDAR_ID || "";
export const calendarConfigured = () => Boolean(calendarId() && creds());

let cached: { token: string; exp: number } | null = null;
async function accessToken(): Promise<string | null> {
  const c = creds();
  if (!c) return null;
  const now = Math.floor(Date.now() / 1000);
  if (cached && cached.exp - 60 > now) return cached.token;
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const unsigned = `${b64({ alg: "RS256", typ: "JWT" })}.${b64({
    iss: c.email,
    scope: "https://www.googleapis.com/auth/calendar.events",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  })}`;
  const signature = createSign("RSA-SHA256").update(unsigned).sign(c.key, "base64url");
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${unsigned}.${signature}` }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error("gcal token:", res.status);
      return null;
    }
    const j = (await res.json()) as { access_token: string; expires_in: number };
    cached = { token: j.access_token, exp: now + j.expires_in };
    return j.access_token;
  } catch (e) {
    console.error("gcal token:", e);
    return null;
  }
}

async function api<T>(path: string, init: RequestInit = {}): Promise<T | null> {
  const token = await accessToken();
  if (!token) return null;
  try {
    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId())}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (res.status === 204 || res.status === 410) return {} as T;
    if (!res.ok) {
      console.error("gcal:", path.split("?")[0], res.status);
      return null;
    }
    return (await res.json()) as T;
  } catch (e) {
    console.error("gcal:", e);
    return null;
  }
}

export type GEvent = { summary: string; description?: string; location?: string; start: Date; end: Date; bookingId: string };

/** Creates one event; returns its id (or null). Never invites anyone — the client gets the .ics instead. */
export async function createEvent(e: GEvent): Promise<string | null> {
  const r = await api<{ id?: string }>("/events?sendUpdates=none", {
    method: "POST",
    body: JSON.stringify({
      summary: e.summary,
      description: e.description,
      location: e.location,
      start: { dateTime: e.start.toISOString(), timeZone: "Europe/Berlin" },
      end: { dateTime: e.end.toISOString(), timeZone: "Europe/Berlin" },
      extendedProperties: { private: { source: "website", bookingId: e.bookingId } },
    }),
  });
  return r?.id ?? null;
}

/** Change an existing event's description (e.g. when he adds a note later). */
export async function updateEventDescription(id: string, description: string): Promise<boolean> {
  const r = await api(`/events/${encodeURIComponent(id)}?sendUpdates=none`, { method: "PATCH", body: JSON.stringify({ description }) });
  return r !== null;
}

export async function deleteEvent(id: string) {
  await api(`/events/${encodeURIComponent(id)}?sendUpdates=none`, { method: "DELETE" });
}
