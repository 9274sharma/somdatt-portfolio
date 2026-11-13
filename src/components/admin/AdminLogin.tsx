"use client";

import { useSearchParams } from "next/navigation";
import { signInPassword } from "@/app/admin/actions";

export function AdminLogin() {
  const error = useSearchParams().get("error");
  return (
    <div className="relative grid min-h-[100svh] place-items-center overflow-hidden bg-page px-6 text-ink">
      <div aria-hidden className="pointer-events-none absolute -right-40 -top-40 h-[30rem] w-[30rem] rounded-full bg-accent/20 blur-[120px]" />
      <div className="view-in relative w-full max-w-sm">
        <p className="font-display text-lg font-extrabold tracking-[0.18em]">
          SOM<span className="text-accent">·</span>DATT
        </p>
        <h1 className="mt-6 font-display text-4xl font-extrabold tracking-tight">Booking desk</h1>
        <p className="mt-2 text-sm text-ink-soft">Requests, calendar and bookings — sign in to continue.</p>
        <form action={signInPassword} className="mt-8 grid gap-3">
          <label className="sr-only" htmlFor="pw">
            Password
          </label>
          <input
            id="pw"
            type="password"
            name="password"
            required
            autoFocus
            autoComplete="current-password"
            placeholder="Password"
            className="min-h-12 rounded-xl border border-sand/70 bg-transparent px-4 text-base text-ink placeholder:text-ink-soft/60 focus:border-accent focus:outline-none"
          />
          <button className="min-h-12 rounded-full bg-accent text-sm font-semibold text-white transition hover:opacity-90" type="submit">
            Sign in
          </button>
          {error ? (
            <p role="alert" className="text-center text-sm text-danger">
              Wrong password — try again.
            </p>
          ) : null}
        </form>
      </div>
    </div>
  );
}
