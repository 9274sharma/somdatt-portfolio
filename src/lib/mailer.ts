import "server-only";
import { Resend } from "resend";

/** Client emails go out from the verified site domain; replies go to the owner's inbox. */
export const BOOKING_FROM = process.env.BOOKING_FROM || "Somdatt Sharma <booking@somdattsharma.com>";
export const SITE_URL = (process.env.SITE_URL || "https://www.somdattsharma.com").replace(/\/$/, "");

type Mail = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  from?: string;
  attachments?: { filename: string; content: string | Buffer; contentType?: string }[];
};

/** Sends one email. Never throws — returns whether it went out, so a failed email never loses a booking. */
export async function sendMail(m: Mail): Promise<{ ok: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: "RESEND_API_KEY missing" };
  try {
    const { error } = await new Resend(key).emails.send({
      from: m.from ?? BOOKING_FROM,
      to: [m.to],
      subject: m.subject,
      html: m.html,
      text: m.text,
      ...(m.replyTo ? { replyTo: m.replyTo } : {}),
      ...(m.attachments?.length ? { attachments: m.attachments } : {}),
    });
    if (error) {
      console.error("mail:", error.message);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (e) {
    console.error("mail:", e);
    return { ok: false, error: "send failed" };
  }
}

/** WhatsApp ping to the owner via CallMeBot (optional — only if configured). */
export async function pingWhatsApp(text: string) {
  const key = process.env.CALLMEBOT_API_KEY;
  const phone = process.env.CALLMEBOT_PHONE;
  if (!key || !phone) return;
  try {
    const params = new URLSearchParams({ phone: phone.trim(), text: text.slice(0, 1500), apikey: key.trim() });
    const res = await fetch(`https://api.callmebot.com/whatsapp.php?${params}`, { cache: "no-store" });
    if (!res.ok) console.error("CallMeBot:", res.status);
  } catch (e) {
    console.error("CallMeBot:", e);
  }
}
