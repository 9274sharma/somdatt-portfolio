import Link from "next/link";

export default function NotFound() {
  return (
    <div
      className="hm-wrap"
      style={{ textAlign: "center", padding: "6rem 0" }}
    >
      <p className="hm-eyebrow">404</p>
      <h1
        className="font-display"
        style={{
          fontSize: "clamp(2rem, 6vw, 3.5rem)",
          fontWeight: 800,
          letterSpacing: "-0.02em",
          margin: "0.4em 0 0.5em",
        }}
      >
        This page wandered off.
      </h1>
      <p style={{ color: "var(--color-ink-soft)", marginBottom: "1.6rem" }}>
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <Link className="hm-btn dark" href="/">
        Back home
      </Link>
    </div>
  );
}
