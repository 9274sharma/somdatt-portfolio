"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { Icon, useAdminUI } from "./AdminShell";

/** Dashboard shortcuts. */
export function QuickActions({ style, className = "" }: { style?: CSSProperties; className?: string }) {
  const { openAdd } = useAdminUI();
  const tile =
    "flex min-h-[5.5rem] flex-col justify-between gap-2 rounded-2xl border border-sand/60 p-3.5 text-left text-sm font-semibold transition hover:-translate-y-0.5 hover:border-accent/50";
  return (
    <section className={`adm-rise rounded-3xl border border-sand/60 p-5 md:p-6 ${className}`} style={style}>
      <h2 className="text-xs uppercase tracking-[0.2em] text-ink-soft">Quick actions</h2>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" onClick={openAdd} className={`${tile} bg-accent/10`}>
          <Icon d="plus" className="h-5 w-5 text-accent" /> New booking
        </button>
        <Link href="/admin/calendar" className={tile}>
          <Icon d="calendar" className="h-5 w-5 text-accent" /> Calendar
        </Link>
        <Link href="/admin/reviews" className={tile}>
          <Icon d="star" className="h-5 w-5 text-accent" /> Ask for a review
        </Link>
        <Link href="/studio/structure/bookings" className={tile}>
          <Icon d="M4 6h16v12H4zM4 7l8 6 8-6" className="h-5 w-5 text-accent" /> Edit emails
        </Link>
      </div>
      <Link href="/admin/guide#install" className="mt-3 flex min-h-11 items-center gap-2 rounded-2xl px-1 text-xs text-ink-soft hover:text-ink">
        <Icon d="M7 3h10v18H7zM11 18h2" className="h-4 w-4" /> Put this on your phone as an app →
      </Link>
    </section>
  );
}
