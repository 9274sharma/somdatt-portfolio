"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/components/i18n/LanguageProvider";

const COPY = {
  en: {
    label: "Chat on WhatsApp",
    message: "Hi Somdatt, I found you on your website and I'd like to ask about a shoot.",
  },
  de: {
    label: "Auf WhatsApp schreiben",
    message: "Hallo Somdatt, ich habe dich über deine Website gefunden und möchte nach einem Shooting fragen.",
  },
} as const;

/** Floating "chat on WhatsApp" button (bottom right) — a plain wa.me link, no third-party script.
 *  Number comes from Studio → Site settings → WhatsApp number. It lifts above the phone bottom bars
 *  (contact "Send request", project "Book" pill — they carry [data-bottom-bar="on"]) and steps aside
 *  while the footer's last row is on screen, so it never covers Impressum / Datenschutz. */
export function WhatsAppBubble({ number }: { number?: string }) {
  const { language } = useLanguage();
  const [ready, setReady] = useState(false);
  const [atFooter, setAtFooter] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 1200);
    const end = document.querySelector("#site-footer > :last-child") ?? document.getElementById("site-footer");
    if (!end) return () => clearTimeout(t);
    const io = new IntersectionObserver(([e]) => setAtFooter(Boolean(e?.isIntersecting)), { threshold: 0 });
    io.observe(end);
    return () => {
      clearTimeout(t);
      io.disconnect();
    };
  }, []);

  const digits = (number ?? "").replace(/\D/g, "");
  if (digits.length < 8) return null;
  const t = COPY[language === "de" ? "de" : "en"];
  const show = ready && !atFooter;

  return (
    <a
      href={`https://wa.me/${digits}?text=${encodeURIComponent(t.message)}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t.label}
      tabIndex={show ? 0 : -1}
      aria-hidden={!show}
      className={`wa-bubble group fixed z-[45] flex h-14 items-center rounded-full bg-[#25D366] text-white shadow-[0_10px_30px_-8px_rgba(0,0,0,0.55)] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#25D366] ${
        show ? "opacity-100" : "pointer-events-none translate-y-3 scale-90 opacity-0"
      }`}
    >
      <span className="grid h-14 w-14 shrink-0 place-items-center">
        <svg viewBox="0 0 32 32" className="h-7 w-7" fill="currentColor" aria-hidden>
          <path d="M16.003 3C8.832 3 3 8.83 3 16c0 2.29.6 4.53 1.74 6.5L3 29l6.68-1.75A12.95 12.95 0 0 0 16.003 29C23.17 29 29 23.17 29 16S23.17 3 16.003 3Zm0 23.8c-2.02 0-4-.54-5.73-1.57l-.41-.24-3.96 1.04 1.06-3.86-.27-.4A10.73 10.73 0 0 1 5.2 16c0-5.96 4.85-10.8 10.8-10.8S26.8 10.04 26.8 16 21.96 26.8 16 26.8Zm5.93-8.09c-.33-.16-1.93-.95-2.23-1.06-.3-.11-.52-.16-.73.17-.22.32-.84 1.05-1.03 1.27-.19.22-.38.24-.7.08-.33-.16-1.38-.51-2.62-1.62-.97-.86-1.62-1.93-1.81-2.25-.19-.33-.02-.5.14-.66.15-.15.33-.38.49-.57.16-.19.22-.32.33-.54.11-.22.05-.41-.03-.57-.08-.16-.73-1.76-1-2.41-.26-.63-.53-.55-.73-.56h-.62c-.22 0-.57.08-.87.41-.3.32-1.14 1.11-1.14 2.71s1.17 3.15 1.33 3.36c.16.22 2.3 3.51 5.57 4.92.78.34 1.39.54 1.86.69.78.25 1.5.21 2.06.13.63-.09 1.93-.79 2.2-1.55.27-.76.27-1.42.19-1.55-.08-.14-.3-.22-.62-.38Z" />
        </svg>
      </span>
      {/* desktop: the label slides out on hover / keyboard focus */}
      <span className="hidden max-w-0 overflow-hidden whitespace-nowrap pr-0 text-sm font-semibold transition-all duration-300 group-hover:max-w-[14rem] group-hover:pr-5 group-focus-visible:max-w-[14rem] group-focus-visible:pr-5 md:inline">
        {t.label}
      </span>
    </a>
  );
}
