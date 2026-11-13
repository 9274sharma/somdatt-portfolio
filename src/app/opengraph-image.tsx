import { ImageResponse } from "next/og";

export const alt = "Somdatt Sharma — Photographer & Filmmaker, Hamburg";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Branded social-share card for every page (dark, warm off-white, accent dot). */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0b0a09",
          color: "#f1ece4",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: 46,
            fontWeight: 800,
            letterSpacing: "0.12em",
          }}
        >
          SOM
          <span style={{ color: "#e0683f", margin: "0 8px" }}>·</span>
          DATT
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 82,
              fontWeight: 800,
              lineHeight: 1.04,
              letterSpacing: "-0.02em",
            }}
          >
            Photographer &amp; Filmmaker
          </div>
          <div style={{ display: "flex", marginTop: 22, fontSize: 34, color: "#9a938a" }}>
            Weddings · Brands · Nightlife · Events — Hamburg
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
