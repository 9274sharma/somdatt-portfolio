"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="hm-wrap" style={{ textAlign: "center", padding: "6rem 0" }}>
      <p className="hm-eyebrow">Error</p>
      <h1
        className="font-display"
        style={{
          fontSize: "clamp(2rem, 6vw, 3.5rem)",
          fontWeight: 800,
          letterSpacing: "-0.02em",
          margin: "0.4em 0 0.5em",
        }}
      >
        Something went wrong.
      </h1>
      <p style={{ color: "var(--color-ink-soft)", marginBottom: "1.6rem" }}>
        An unexpected error occurred. Try again, or head back home.
      </p>
      <div
        style={{
          display: "flex",
          gap: "1rem",
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        <button className="hm-btn dark" onClick={reset} type="button">
          Try again
        </button>
        <Link
          className="hm-btn"
          style={{
            border:
              "1px solid color-mix(in srgb, var(--color-ink) 25%, transparent)",
            color: "var(--color-ink)",
          }}
          href="/"
        >
          Back home
        </Link>
      </div>
    </div>
  );
}
