import { cookies } from "next/headers";
import type { Lang } from "./messages";

/** Reads the current language from the `lang` cookie (server components). */
export async function getLang(): Promise<Lang> {
  const store = await cookies();
  return store.get("lang")?.value === "de" ? "de" : "en";
}
