import type { Metadata } from "next";
// Fonts are self-hosted (latin subset of the Google variable fonts, OFL) so a build never depends on how
// Google Fonts happens to format its CSS that day — next/font/google broke on Vercel with "/l/font?kit=" URLs.
// Only the sans is preloaded; the three alternates load when the Studio "Site font" setting picks one.
import localFont from "next/font/local";
import { draftMode } from "next/headers";
import { VisualEditing } from "next-sanity/visual-editing";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import { ScrollReveal } from "@/components/layout/ScrollReveal";
import { LanguageProvider } from "@/components/i18n/LanguageProvider";
import { getSettings } from "@/sanity/queries";
import { getLang } from "@/i18n/server";

const bricolage = localFont({ src: "./fonts/bricolage-grotesque-latin.woff2", preload: false, weight: "400 800", variable: "--font-bricolage", display: "swap" });
const archivo = localFont({ src: "./fonts/archivo-latin.woff2", preload: false, weight: "400 800", variable: "--font-archivo", display: "swap" });
const fraunces = localFont({ src: "./fonts/fraunces-latin.woff2", preload: false, weight: "400 900", variable: "--font-fraunces", display: "swap" });
const sans = localFont({ src: "./fonts/hanken-grotesk-latin.woff2", weight: "400 700", variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://www.somdattsharma.com"),
  title: {
    default: "Somdatt Sharma — Photographer & Filmmaker, Hamburg",
    template: "%s · Somdatt Sharma",
  },
  description:
    "Full-service photography, videography and editing in Hamburg — weddings, brand shoots, nightlife and events.",
  openGraph: {
    type: "website",
    locale: "en_DE",
    siteName: "Somdatt Sharma",
    title: "Somdatt Sharma — Photographer & Filmmaker, Hamburg",
    description:
      "Full-service photography, videography and editing in Hamburg — weddings, brand shoots, nightlife and events.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Somdatt Sharma — Photographer & Filmmaker, Hamburg",
    description:
      "Full-service photography, videography and editing in Hamburg — weddings, brand shoots, nightlife and events.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [settings, lang] = await Promise.all([getSettings(), getLang()]);
  const font = settings?.font ?? "bricolage";
  const { isEnabled: isDraft } = await draftMode();

  return (
    <html lang={lang} data-font={font} suppressHydrationWarning>
      <body
        className={`${bricolage.variable} ${archivo.variable} ${fraunces.variable} ${sans.variable} bg-page text-ink antialiased`}
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var r=document.documentElement;var t=localStorage.getItem('theme');if(!t){t=matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'}r.dataset.theme=t;var f=localStorage.getItem('font');if(f)r.dataset.font=f;if(!matchMedia('(prefers-reduced-motion:reduce)').matches){r.classList.add('anim')}}catch(e){}`,
          }}
        />
        <ScrollReveal />
        <SmoothScroll>
          <LanguageProvider initial={lang}>
            <AppShell
              footer={{
                email: settings?.contactEmail,
                phone: settings?.phone,
                instagram: settings?.instagram,
                linkedin: settings?.linkedin,
                tagline: settings?.footerTagline,
                contactHeading: settings?.footerContactHeading,
                legalHeading: settings?.footerLegalHeading,
                copyright: settings?.footerCopyright,
              }}
              whatsapp={settings?.whatsapp}
            >
              {children}
            </AppShell>
          </LanguageProvider>
        </SmoothScroll>
        {isDraft ? <VisualEditing /> : null}
      </body>
    </html>
  );
}
