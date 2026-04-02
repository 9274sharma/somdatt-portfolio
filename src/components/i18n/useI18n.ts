import en from "@/components/i18n/messages/en.json";
import de from "@/components/i18n/messages/de.json";
import { useLanguage } from "@/components/i18n/LanguageProvider";

const messages = {
  en,
  de,
} as const;

type Messages = typeof messages.en;

function getMessage(obj: Messages, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in acc) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (acc as any)[key];
    }
    return undefined;
  }, obj);
}

export function useI18n() {
  const { language } = useLanguage();
  const bundle = messages[language];

  function t(path: string): string {
    const value = getMessage(bundle, path);
    if (typeof value === "string") return value;
    return path;
  }

  function tList(path: string): string[] {
    const value = getMessage(bundle, path);
    if (Array.isArray(value)) return value;
    return [];
  }

  return { t, tList, language };
}

