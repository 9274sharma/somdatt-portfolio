"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

export type Language = "en" | "de";

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined,
);

function readCookie(): Language {
  if (typeof document === "undefined") return "en";
  const m = document.cookie.match(/(?:^|;\s*)lang=(en|de)/);
  return m ? (m[1] as Language) : "en";
}

export function LanguageProvider({
  children,
  initial,
}: {
  children: ReactNode;
  initial?: Language;
}) {
  const router = useRouter();
  const [language, setLanguageState] = useState<Language>(
    initial ?? readCookie(),
  );

  function setLanguage(next: Language) {
    setLanguageState(next);
    try {
      document.cookie = `lang=${next};path=/;max-age=31536000;samesite=lax`;
      document.documentElement.lang = next;
    } catch {
      /* ignore */
    }
    // Re-render server components (Sanity content) in the new language.
    router.refresh();
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}
