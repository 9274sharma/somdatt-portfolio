"use client";

import { type ReactNode, useState } from "react";

/** Collapses long copy on phones (desktop always shows everything). */
export function ReadMore({
  children,
  more = "Read more",
  less = "Show less",
}: {
  children: ReactNode;
  more?: string;
  less?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div className={`relative ${open ? "" : "max-md:max-h-[10.5rem] max-md:overflow-hidden"}`}>
        {children}
        {!open ? (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-page to-transparent md:hidden"
          />
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="mt-3 min-h-11 text-sm font-semibold text-ink underline decoration-accent decoration-2 underline-offset-4 md:hidden"
      >
        {open ? less : more}
      </button>
    </div>
  );
}
