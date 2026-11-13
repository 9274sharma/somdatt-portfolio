/* eslint-disable @next/next/no-img-element */
"use client";

import QRCode from "qrcode";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Stars } from "@/components/reviews/Testimonials";

export type AdminReview = {
  id: string;
  rating: number;
  type?: string;
  name: string;
  role?: string;
  text: string;
  date: string; // display string
  status: "pending" | "published" | "hidden";
  reason?: string;
  /** set when submitted through a booking's personal link */
  booking?: string;
  /** the personal link had already been used twice */
  reused?: boolean;
};
export type InviteBooking = { id: string; label: string; token: string; type?: string };
type Status = AdminReview["status"];

const PRESETS = [
  { key: "", label: "Any shoot" },
  { key: "wedding", label: "Wedding" },
  { key: "event", label: "Event" },
  { key: "brand", label: "Brand" },
  { key: "portrait", label: "Portrait" },
];
const REASONS = ["Spam", "Not a client", "Contains personal data", "Duplicate", "Client asked to remove"];

/** Admin: share the review form (personal or general link · QR · share) and moderate reviews. */
export function ReviewsPanel({
  formUrl,
  bookings,
  initial,
  setStatus,
  remove,
}: {
  formUrl: string;
  bookings: InviteBooking[];
  initial: AdminReview[];
  setStatus: (id: string, status: Status, reason?: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
}) {
  const [mode, setMode] = useState<"personal" | "general">(bookings.length ? "personal" : "general");
  const [bookingId, setBookingId] = useState(bookings[0]?.id ?? "");
  const [preset, setPreset] = useState("");
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [items, setItems] = useState(initial);
  const [tab, setTab] = useState<Status>("pending");
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; undo?: () => void; error?: boolean } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // false on the server, the real answer in the browser — without a hydration mismatch
  const canShare = useSyncExternalStore(
    () => () => {},
    () => "share" in navigator,
    () => false,
  );

  const booking = bookings.find((b) => b.id === bookingId);
  const link =
    mode === "personal" && booking
      ? `${formUrl}?invite=${booking.token}`
      : preset
        ? `${formUrl}?type=${preset}`
        : formUrl;

  useEffect(() => {
    let live = true;
    QRCode.toDataURL(link, { margin: 2, width: 720, errorCorrectionLevel: "M", color: { dark: "#111111", light: "#ffffff" } })
      .then((u) => live && setQr(u))
      .catch(() => live && setQr(null));
    return () => {
      live = false;
    };
  }, [link]);

  const show = useCallback((t: { text: string; undo?: () => void; error?: boolean }) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(t);
    toastTimer.current = setTimeout(() => setToast(null), 6000);
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copy this link:", link);
    }
  };

  const share = async () => {
    try {
      await navigator.share({ title: "Leave a review", text: "I'd love a short review of our shoot:", url: link });
    } catch {
      /* cancelled */
    }
  };

  /** Printable card: logo line, QR, call to action — PNG, ready for A6 / a table stand. */
  const downloadCard = async () => {
    if (!qr) return;
    const W = 1200;
    const H = 1700;
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const g = c.getContext("2d");
    if (!g) return;
    g.fillStyle = "#f4f3f0";
    g.fillRect(0, 0, W, H);
    g.fillStyle = "#17140f";
    g.textAlign = "center";
    g.font = "600 54px system-ui, sans-serif";
    g.fillText("S O M · D A T T", W / 2, 190);
    g.font = "800 96px system-ui, sans-serif";
    g.fillText("How was it?", W / 2, 360);
    g.font = "400 44px system-ui, sans-serif";
    g.fillStyle = "#595349";
    g.fillText("Scan to leave a short review", W / 2, 440);
    const im = new Image();
    im.src = qr;
    await im.decode();
    g.fillStyle = "#ffffff";
    g.fillRect(W / 2 - 400, 520, 800, 800);
    g.drawImage(im, W / 2 - 380, 540, 760, 760);
    g.fillStyle = "#c84d27";
    g.font = "600 40px system-ui, sans-serif";
    g.fillText(mode === "personal" && booking ? booking.label : "Thank you!", W / 2, 1440);
    g.fillStyle = "#595349";
    g.font = "400 30px ui-monospace, monospace";
    g.fillText(link.replace(/^https?:\/\//, ""), W / 2, 1540);
    const a = document.createElement("a");
    a.href = c.toDataURL("image/png");
    a.download = `review-card${mode === "personal" && booking ? `-${booking.token}` : preset ? `-${preset}` : ""}.png`;
    a.click();
  };

  const groups = useMemo(() => {
    const g: Record<Status, AdminReview[]> = { pending: [], published: [], hidden: [] };
    for (const r of items) g[r.status].push(r);
    return g;
  }, [items]);

  const move = async (id: string, status: Status, reason?: string) => {
    const before = items.find((x) => x.id === id);
    if (!before) return;
    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, status, reason } : x)));
    setRejecting(null);
    const undo = () => {
      setItems((xs) => xs.map((x) => (x.id === id ? before : x)));
      setStatus(id, before.status, before.reason).catch(() => show({ text: "Couldn’t undo — please refresh.", error: true }));
      setToast(null);
    };
    const verb = status === "published" ? "Published" : status === "hidden" ? `Rejected${reason ? ` (${reason})` : ""}` : "Moved to pending";
    show({ text: `${verb} · ${before.name}`, undo });
    try {
      await setStatus(id, status, reason);
    } catch {
      setItems((xs) => xs.map((x) => (x.id === id ? before : x)));
      show({ text: "Saving failed — nothing changed. Try again.", error: true });
    }
  };

  const destroy = async (id: string) => {
    const before = items;
    setItems((xs) => xs.filter((x) => x.id !== id));
    setDeleting(null);
    try {
      await remove(id);
      show({ text: "Deleted permanently." });
    } catch {
      setItems(before);
      show({ text: "Deleting failed — try again.", error: true });
    }
  };

  const btn = "inline-flex min-h-11 items-center rounded-full px-5 text-xs uppercase tracking-[0.16em] transition";
  const solid = `${btn} bg-ink text-page hover:bg-accent hover:text-white`;
  const ghost = `${btn} border border-ink-soft/40 text-ink-soft hover:border-ink/40 hover:text-ink`;
  const chip = (on: boolean) =>
    `inline-flex min-h-11 items-center rounded-full border px-4 text-xs transition ${
      on ? "border-ink bg-ink text-page" : "border-ink-soft/40 text-ink-soft hover:text-ink"
    }`;

  return (
    <div className="grid gap-8">
      {/* collect */}
      <section className="grid gap-6 rounded-3xl border border-sand/55 bg-page/50 p-5 md:grid-cols-[1fr_auto] md:p-7">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.2em] text-accent">Collect reviews</p>
          <h2 className="mt-1 font-display text-2xl font-bold">Send the form to a client</h2>
          <p className="mt-1.5 text-sm text-ink-soft">
            A personal link (made from a booking) pre-fills their name and marks the review “Verified client”. Reviews
            wait here until you approve them.
          </p>

          <div className="mt-5 inline-flex gap-1 rounded-full border border-sand/50 p-1" role="radiogroup" aria-label="Link type">
            {(["personal", "general"] as const).map((m) => (
              <button key={m} type="button" role="radio" aria-checked={mode === m} onClick={() => setMode(m)} className={chip(mode === m)}>
                {m === "personal" ? "Personal link (booking)" : "General link"}
              </button>
            ))}
          </div>

          {mode === "personal" ? (
            <label className="mt-4 block">
              <span className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-ink-soft">Booking</span>
              <select
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
                className="min-h-11 w-full rounded-xl border border-ink-soft/40 bg-page px-3.5 text-sm text-ink"
              >
                {bookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.label}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <div className="mt-4 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Shoot type in the link">
              {PRESETS.map((p) => (
                <button key={p.key || "any"} type="button" role="radio" aria-checked={preset === p.key} onClick={() => setPreset(p.key)} className={chip(preset === p.key)}>
                  {p.label}
                </button>
              ))}
            </div>
          )}

          <div className="mt-4 flex items-stretch gap-2">
            <input
              readOnly
              value={link}
              onFocus={(e) => e.currentTarget.select()}
              aria-label="Review form link"
              className="min-h-11 min-w-0 flex-1 rounded-xl border border-ink-soft/40 bg-transparent px-3.5 font-mono text-[13px] text-ink"
            />
            <button type="button" onClick={copy} className={`${solid} shrink-0`} aria-live="polite">
              {copied ? "Copied ✓" : "Copy"}
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {canShare ? (
              <button type="button" onClick={share} className={ghost}>
                Share…
              </button>
            ) : null}
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Thank you for having me! If you have two minutes, I'd love a short review: ${link}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={ghost}
            >
              WhatsApp
            </a>
            <button type="button" onClick={downloadCard} disabled={!qr} className={ghost}>
              Printable card
            </button>
            {qr ? (
              <a href={qr} download="review-qr.png" className={ghost}>
                QR only
              </a>
            ) : null}
          </div>
        </div>

        <figure className="mx-auto w-44 md:w-48">
          <div className="overflow-hidden rounded-2xl bg-white p-2 shadow-sm ring-1 ring-sand/60">
            {qr ? <img src={qr} alt={`QR code for ${link}`} className="aspect-square w-full" /> : <div className="aspect-square w-full animate-pulse bg-sand/30" />}
          </div>
          <figcaption className="mt-2 text-center text-[11px] uppercase tracking-[0.16em] text-ink-soft">Scan to leave a review</figcaption>
        </figure>
      </section>

      {/* moderate */}
      <section>
        <div className="mb-5 inline-flex gap-1 rounded-full border border-sand/50 bg-page/50 p-1 text-[0.7rem] uppercase tracking-[0.14em]" role="tablist">
          {(
            [
              ["pending", "Pending"],
              ["published", "Published"],
              ["hidden", "Rejected"],
            ] as [Status, string][]
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={tab === k}
              onClick={() => setTab(k)}
              className={`flex min-h-11 items-center gap-1.5 rounded-full px-4 transition ${tab === k ? "bg-ink text-page" : "text-ink-soft hover:text-ink"}`}
            >
              {label}
              <span className="opacity-60">{groups[k].length}</span>
            </button>
          ))}
        </div>

        {groups[tab].length ? (
          <ul className="grid gap-3">
            {groups[tab].map((r) => (
              <li key={r.id} className="view-in rounded-2xl border border-sand/55 bg-page/50 p-4 md:p-5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Stars value={r.rating} />
                  {r.type ? <span className="rounded-full border border-sand/70 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-ink-soft">{r.type}</span> : null}
                  {r.reused ? (
                    <span className="rounded-full bg-danger/12 px-2 py-0.5 text-[11px] font-medium text-danger">⚠ Personal link used before — check the name</span>
                  ) : r.booking ? (
                    <span className="rounded-full bg-accent/12 px-2 py-0.5 text-[11px] font-medium text-accent">✓ Linked to booking · {r.booking}</span>
                  ) : (
                    <span className="rounded-full border border-dashed border-ink-soft/40 px-2 py-0.5 text-[11px] text-ink-soft">General link — check the name</span>
                  )}
                  <span className="ml-auto text-xs text-ink-soft">{r.date}</span>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-[0.95rem] leading-relaxed text-ink">&ldquo;{r.text}&rdquo;</p>
                {r.status === "hidden" && r.reason ? <p className="mt-2 text-xs text-ink-soft">Rejected: {r.reason}</p> : null}

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm">
                    <span className="font-semibold">{r.name}</span>
                    {r.role ? <span className="text-ink-soft"> · {r.role}</span> : null}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {r.status !== "published" ? (
                      <button type="button" onClick={() => move(r.id, "published")} className={solid}>
                        {r.status === "hidden" ? "Publish" : "Approve"}
                      </button>
                    ) : null}
                    {r.status !== "hidden" ? (
                      <button type="button" onClick={() => setRejecting(rejecting === r.id ? null : r.id)} aria-expanded={rejecting === r.id} className={ghost}>
                        {r.status === "published" ? "Unpublish…" : "Reject…"}
                      </button>
                    ) : null}
                    <button type="button" onClick={() => setDeleting(deleting === r.id ? null : r.id)} aria-expanded={deleting === r.id} className={ghost}>
                      Delete…
                    </button>
                  </div>
                </div>

                {rejecting === r.id ? (
                  <div className="mt-3 rounded-xl border border-sand/60 p-3">
                    <p className="mb-2 text-xs text-ink-soft">
                      Why? Critical but genuine reviews should be published — reject only for one of these reasons.
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {REASONS.map((why) => (
                        <button key={why} type="button" onClick={() => move(r.id, "hidden", why)} className={chip(false)}>
                          {why}
                        </button>
                      ))}
                      <button type="button" onClick={() => setRejecting(null)} className="inline-flex min-h-11 items-center px-3 text-xs text-ink-soft underline underline-offset-2 hover:text-ink">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}
                {deleting === r.id ? (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/50 bg-danger/10 p-3">
                    <p className="text-sm text-ink">Delete this review permanently? This can’t be undone.</p>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setDeleting(null)} className={ghost}>
                        Cancel
                      </button>
                      <button type="button" onClick={() => destroy(r.id)} className={`${btn} bg-danger text-white hover:opacity-90`}>
                        Delete
                      </button>
                    </div>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-2xl border border-dashed border-sand/50 p-10 text-center text-sm text-ink-soft">
            {tab === "pending" ? "No new reviews. Send a personal link after your next delivery." : "Nothing here yet."}
          </p>
        )}
        <p className="mt-4 text-xs text-ink-soft">Rejected reviews are deleted automatically after 90 days.</p>
      </section>

      {toast ? (
        <div
          role="status"
          className={`fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 z-[130] flex w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-4 rounded-full py-2 pl-5 pr-3 text-sm shadow-2xl ${
            toast.error ? "bg-danger text-white" : "bg-ink text-page"
          }`}
        >
          <span>{toast.text}</span>
          {toast.undo ? (
            <button type="button" onClick={toast.undo} className="min-h-11 px-1 font-semibold underline underline-offset-2">
              Undo
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
