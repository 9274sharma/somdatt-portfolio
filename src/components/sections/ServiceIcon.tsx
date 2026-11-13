import type { SVGProps } from "react";

/** Picks a line icon from the service name (EN/DE keywords). Pure SVG, inherits
 *  currentColor so it themes + animates with the card. Falls back to a spark. */
export function ServiceIcon({ hint }: { hint: string }) {
  const h = hint.toLowerCase();
  const p: SVGProps<SVGSVGElement> = {
    viewBox: "0 0 24 24",
    width: 26,
    height: 26,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  if (/photo|foto|portrait|still/.test(h)) {
    return (
      <svg {...p}>
        <path d="M3 8.5A1.5 1.5 0 0 1 4.5 7H7l1.3-2h7.4L17 7h2.5A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5z" />
        <circle cx="12" cy="12.8" r="3.3" />
      </svg>
    );
  }
  if (/video|film|cine|motion|movie/.test(h)) {
    return (
      <svg {...p}>
        <rect x="3" y="7" width="12.5" height="10" rx="2" />
        <path d="M15.5 10.5 21 7.5v9l-5.5-3z" />
      </svg>
    );
  }
  if (/edit|schnitt|bearbeit|grade|colour|color|retou|post/.test(h)) {
    return (
      <svg {...p}>
        <path d="M4 7h8" />
        <path d="M17 7h3" />
        <circle cx="14.5" cy="7" r="2.2" />
        <path d="M4 17h3" />
        <path d="M12 17h8" />
        <circle cx="9.5" cy="17" r="2.2" />
      </svg>
    );
  }
  if (/reel|social|content|story|short|clip/.test(h)) {
    return (
      <svg {...p}>
        <circle cx="12" cy="12" r="9" />
        <path d="M10.5 8.5 16 12l-5.5 3.5z" />
      </svg>
    );
  }
  return (
    <svg {...p}>
      <path d="M12 3l1.9 4.6L18.5 9l-4.6 1.4L12 15l-1.9-4.6L5.5 9l4.6-1.4z" />
    </svg>
  );
}
