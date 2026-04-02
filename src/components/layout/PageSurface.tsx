"use client";

type Props = {
  children: React.ReactNode;
};

/** Soft background accents shared across main pages (home, portfolio, services, contact). */
export function PageSurface({ children }: Props) {
  return (
    <div className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute -right-24 top-0 h-80 w-80 rounded-full bg-accent/12 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-16 top-[28%] h-64 w-64 rounded-full border border-sand/40 opacity-50"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-[8%] right-[5%] h-40 w-40 rounded-full bg-sand/25 blur-2xl"
        aria-hidden
      />
      {children}
    </div>
  );
}
