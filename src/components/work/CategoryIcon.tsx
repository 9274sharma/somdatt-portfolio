import type { SVGProps } from "react";

/** Line icon per category, picked from its slug/title (EN/DE keywords). */
export function CategoryIcon({ hint, size = 22 }: { hint: string; size?: number }) {
  const h = hint.toLowerCase();
  const p: SVGProps<SVGSVGElement> = {
    viewBox: "0 0 24 24",
    width: size,
    height: size,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  if (/wedd|hochzeit|bride|marri/.test(h)) {
    return (
      <svg {...p}>
        <circle cx="9" cy="14.5" r="5" />
        <circle cx="15" cy="14.5" r="5" />
        <path d="M10.6 5.6 12 4.2l1.4 1.4L12 7z" />
      </svg>
    );
  }
  if (/event|night|party|club|concert/.test(h)) {
    return (
      <svg {...p}>
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }
  if (/commerc|brand|werbung|product|business/.test(h)) {
    return (
      <svg {...p}>
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 12.5h18" />
      </svg>
    );
  }
  if (/portrait|porträt|people|headshot/.test(h)) {
    return (
      <svg {...p}>
        <circle cx="12" cy="8.5" r="4" />
        <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" />
      </svg>
    );
  }
  return (
    <svg {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3 9 12l3 9M3 12h18" />
    </svg>
  );
}
