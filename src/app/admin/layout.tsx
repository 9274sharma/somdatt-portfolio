import type { Metadata, Viewport } from "next";
import { Suspense, type ReactNode } from "react";
import { auth } from "@/auth";
import { loadAdmin } from "@/lib/admin-data";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminLogin } from "@/components/admin/AdminLogin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Booking desk", template: "%s · Booking desk" },
  robots: { index: false, follow: false },
  manifest: "/admin/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Bookings", statusBarStyle: "black-translucent" },
  icons: { apple: "/admin-icons/apple-touch-icon.png" },
};
export const viewport: Viewport = { themeColor: "#0b0a09", viewportFit: "cover" };

/** The admin is its own little app: sidebar on desktop, bottom tabs on the phone, installable. */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session)
    return (
      <Suspense>
        <AdminLogin />
      </Suspense>
    );
  const d = await loadAdmin();
  return (
    <AdminShell counts={{ requests: d.requests.length, reviews: d.reviewsPending }} user={session.user?.email ?? ""} eventTypes={d.eventTypes}>
      {children}
    </AdminShell>
  );
}
