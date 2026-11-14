"use client";

import { usePathname } from "next/navigation";
import { Header } from "./Header";
import { Footer, type FooterData } from "./Footer";
import { WhatsAppBubble } from "./WhatsAppBubble";

/** Renders the site chrome (header/footer) everywhere except the full-screen Studio and the admin app. */
export function AppShell({ children, footer, whatsapp }: { children: React.ReactNode; footer: FooterData; whatsapp?: string }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/studio") || pathname?.startsWith("/admin")) return <>{children}</>;

  return (
    // overflow-x-clip: decorative glows bleed past the edge but must never widen the page
    // (clip, not hidden — it doesn't create a scroll container, so sticky/fixed children keep working)
    <div className="flex min-h-screen flex-col overflow-x-clip">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer data={footer} />
      <WhatsAppBubble number={whatsapp} />
    </div>
  );
}
