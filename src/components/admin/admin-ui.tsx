/* Small shared bits for the admin screens (no client state). */
import type { CSSProperties } from "react";
import type { AdminStatus } from "@/lib/admin-data";

export const STATUS: Record<AdminStatus, { label: string; cls: string }> = {
  request: { label: "Request", cls: "border-accent/50 bg-accent/12 text-accent" },
  confirmed: { label: "Confirmed", cls: "border-[#2f9e6f]/45 bg-[#2f9e6f]/12 text-[#2f9e6f]" },
  declined: { label: "Declined", cls: "border-ink-soft/40 text-ink-soft" },
  cancelled: { label: "Cancelled", cls: "border-danger/45 bg-danger/10 text-danger" },
};

export function StatusPill({ status }: { status: AdminStatus }) {
  const s = STATUS[status];
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] ${s.cls}`}>{s.label}</span>;
}

/** Stagger index for .adm-rise */
export const rise = (i: number) => ({ "--i": i }) as CSSProperties;

export const card = "rounded-3xl border border-sand/60 bg-page";
export const cardPad = "p-5 md:p-6";

/** Days from today (Hamburg) to a date: 0 = today, 1 = tomorrow … */
export const daysUntil = (date: string, today: string) => Math.round((Date.parse(`${date}T12:00:00Z`) - Date.parse(`${today}T12:00:00Z`)) / 86_400_000);
export const relDay = (n: number) => (n === 0 ? "Today" : n === 1 ? "Tomorrow" : n === -1 ? "Yesterday" : n > 1 ? `In ${n} days` : `${-n} days ago`);

export const mapsUrl = (q: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
export const waUrl = (phone: string) => `https://wa.me/${phone.replace(/[^\d]/g, "").replace(/^00/, "")}`;
