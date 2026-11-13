import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Studio",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

/** The Studio renders its own full-screen UI; keep this layout a pass-through. */
export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return children;
}
