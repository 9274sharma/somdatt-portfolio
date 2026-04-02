import { Resend } from "resend";
import { NextResponse } from "next/server";

const MAX_MESSAGE = 8000;
const MAX_NAME = 200;
const MAX_BUDGET = 240;

const ALLOWED_TYPES = new Set(["wedding", "brand", "social", "other"]);

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  try {
    const json: unknown = await request.json();
    if (!json || typeof json !== "object") {
      return NextResponse.json({ error: "invalid" }, { status: 400 });
    }

    const body = json as Record<string, unknown>;
    const { name, email, projectType, budget, message, website } = body;

    if (typeof website === "string" && website.trim() !== "") {
      return NextResponse.json({ ok: true });
    }

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof projectType !== "string" ||
      typeof message !== "string"
    ) {
      return NextResponse.json({ error: "invalid" }, { status: 400 });
    }

    const budgetStr = typeof budget === "string" ? budget : "";
    const cleanName = name.trim().slice(0, MAX_NAME);
    const cleanEmail = email.trim().slice(0, 320);
    const cleanMessage = message.trim().slice(0, MAX_MESSAGE);
    const cleanBudget = budgetStr.trim().slice(0, MAX_BUDGET);
    const typeKey = ALLOWED_TYPES.has(projectType) ? projectType : "other";

    if (!cleanName || !isValidEmail(cleanEmail) || !cleanMessage) {
      return NextResponse.json({ error: "validation" }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const to = process.env.CONTACT_TO_EMAIL;
    const from =
      process.env.RESEND_FROM ?? "Portfolio contact <onboarding@resend.dev>";

    if (!apiKey || !to) {
      console.error("contact: missing RESEND_API_KEY or CONTACT_TO_EMAIL");
      return NextResponse.json({ error: "config" }, { status: 503 });
    }

    const resend = new Resend(apiKey);
    const subject = `New inquiry · ${cleanName}`;

    const html = `
      <h1>New contact inquiry</h1>
      <p><strong>Name:</strong> ${escapeHtml(cleanName)}</p>
      <p><strong>Email:</strong> ${escapeHtml(cleanEmail)}</p>
      <p><strong>Project type:</strong> ${escapeHtml(typeKey)}</p>
      <p><strong>Budget:</strong> ${cleanBudget ? escapeHtml(cleanBudget) : "—"}</p>
      <p><strong>Message:</strong></p>
      <pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(cleanMessage)}</pre>
    `;

    const text = [
      `Name: ${cleanName}`,
      `Email: ${cleanEmail}`,
      `Project type: ${typeKey}`,
      `Budget: ${cleanBudget || "—"}`,
      "",
      cleanMessage,
    ].join("\n");

    const { error } = await resend.emails.send({
      from,
      to: [to],
      replyTo: cleanEmail,
      subject,
      html,
      text,
    });

    if (error) {
      console.error("Resend:", error);
      return NextResponse.json({ error: "email" }, { status: 502 });
    }

    const waKey = process.env.CALLMEBOT_API_KEY;
    const waPhone = process.env.CALLMEBOT_PHONE;
    if (waKey && waPhone) {
      const snippet =
        cleanMessage.length > 1200 ? `${cleanMessage.slice(0, 1200)}…` : cleanMessage;
      const waText = [
        "📩 New portfolio inquiry",
        `Name: ${cleanName}`,
        `Email: ${cleanEmail}`,
        `Type: ${typeKey}`,
        `Budget: ${cleanBudget || "—"}`,
        "",
        snippet,
      ].join("\n");

      try {
        const params = new URLSearchParams({
          phone: waPhone.trim(),
          text: waText,
          apikey: waKey.trim(),
        });
        const waRes = await fetch(
          `https://api.callmebot.com/whatsapp.php?${params.toString()}`,
          { method: "GET", cache: "no-store" },
        );
        const waBody = await waRes.text();
        if (!waRes.ok) {
          console.error("CallMeBot:", waRes.status, waBody);
        }
      } catch (e) {
        console.error("CallMeBot:", e);
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
