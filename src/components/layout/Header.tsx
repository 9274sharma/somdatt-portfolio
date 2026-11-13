"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { type MouseEvent, useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { useI18n } from "@/components/i18n/useI18n";
import { tr } from "@/i18n/messages";
import { getLenis } from "./lenis";

/** Primary nav scrolls to home sections (Contact is a dedicated page/CTA). */
/* The menu goes to the real pages (the About page used to be reachable only from Home). */
const navItems = [
  { href: "/portfolio", key: "nav.work", section: "work" },
  { href: "/services", key: "nav.services", section: "services" },
  { href: "/about", key: "nav.about", section: "about" },
] as const;

/** Which nav item a page belongs to. */
function routeSection(pathname: string | null): string {
  if (!pathname) return "";
  if (pathname.startsWith("/portfolio") || pathname.startsWith("/projects")) return "work";
  if (pathname.startsWith("/services")) return "services";
  if (pathname.startsWith("/about")) return "about";
  return "";
}

function MenuIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <span className="text-[1.35rem] font-light leading-none text-ink" aria-hidden>
        ×
      </span>
    );
  }
  return (
    <span className="flex flex-col gap-[5px]" aria-hidden>
      <span className="block h-0.5 w-6 rounded-full bg-ink" />
      <span className="block h-0.5 w-6 rounded-full bg-ink" />
      <span className="block h-0.5 w-6 rounded-full bg-ink" />
    </span>
  );
}

export function Header() {
  const pathname = usePathname();
  const { language, setLanguage } = useLanguage();
  const { t } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [theme, setThemeState] = useState<"light" | "dark">("light");

  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- portal needs document.body after hydration
    setMounted(true);
  }, []);

  useEffect(() => {
    /* Close drawer on navigation (including browser back). */
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync UI to route
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  useEffect(() => {
    const current = document.documentElement.dataset.theme;
    if (current === "dark" || current === "light") setThemeState(current);
  }, []);

  /* Logo: on home, smooth-scroll to the very top; elsewhere, navigate home. */
  const goHome = (e: MouseEvent<HTMLAnchorElement>) => {
    setMobileOpen(false);
    if (pathname !== "/") return;
    e.preventDefault();
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(0);
    else window.scrollTo({ top: 0, behavior: "smooth" });
    try {
      history.replaceState(null, "", "/");
    } catch {
      /* ignore */
    }
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setThemeState(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* ignore */
    }
  };

  const mobileDrawer =
    mounted &&
    createPortal(
      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            id="mobile-nav-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={t("nav.menu")}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] md:hidden"
          >
            <motion.button
              type="button"
              aria-label={t("nav.closeMenu")}
              className="absolute inset-0 bg-ink/35 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{
                type: "tween",
                duration: 0.28,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="absolute left-0 top-0 flex h-[100dvh] max-h-[100dvh] w-[min(20rem,88vw)] flex-col border-r border-sand/50 bg-page shadow-[8px_0_40px_rgba(31,19,12,0.12)]"
            >
              <div className="flex shrink-0 items-center justify-between border-b border-sand/45 px-4 py-4">
                <p className="font-display text-lg tracking-[0.08em] text-ink">
                  {t("nav.menu")}
                </p>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-sand/60 text-lg text-ink-soft transition-colors hover:border-ink/25 hover:text-ink"
                  aria-label={t("nav.closeMenu")}
                >
                  ×
                </button>
              </div>
              <nav className="min-h-0 flex flex-1 flex-col gap-0.5 overflow-y-auto overscroll-contain p-3 pb-10 pt-2">
                {navItems.map((item) => {
                  const isActive =
                    routeSection(pathname) === item.section;
                  const label = tr(item.key, language);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`rounded-xl px-4 py-3.5 text-sm uppercase tracking-[0.22em] transition-colors ${
                        isActive
                          ? "bg-ink/8 font-medium text-ink"
                          : "text-ink-soft hover:bg-sand/25 hover:text-ink"
                      }`}
                    >
                      {label}
                    </Link>
                  );
                })}
                <Link
                  href="/contact"
                  onClick={() => setMobileOpen(false)}
                  className={`mt-2 rounded-xl px-4 py-3.5 text-center text-sm uppercase tracking-[0.22em] transition-colors ${
                    pathname === "/contact"
                      ? "bg-accent text-white"
                      : "bg-ink text-page hover:bg-accent hover:text-white"
                  }`}
                >
                  {tr("nav.contact", language)}
                </Link>
              </nav>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>,
      document.body,
    );

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-sand/40 bg-page/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 md:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-3 md:flex-none md:gap-0">
            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-sand/60 text-ink transition-colors hover:border-ink/30 hover:bg-page md:hidden"
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav-drawer"
              aria-label={mobileOpen ? t("nav.closeMenu") : t("nav.openMenu")}
            >
              <MenuIcon open={mobileOpen} />
            </button>
            <Link
              href="/"
              onClick={goHome}
              className="min-w-0 truncate font-display text-lg font-extrabold tracking-[0.18em] md:text-xl"
            >
              SOM<span className="text-accent">·</span>DATT
            </Link>
          </div>

          <nav className="hidden items-center gap-6 text-sm md:flex">
            {navItems.map((item) => {
              const isActive =
                routeSection(pathname) === item.section;
              const label = tr(item.key, language);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className="relative px-1 text-xs uppercase tracking-[0.22em]"
                >
                  <span className={isActive ? "text-ink" : "text-ink-soft"}>
                    {label}
                  </span>
                  {isActive && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute -bottom-1 left-0 h-px w-full bg-ink"
                    />
                  )}
                </Link>
              );
            })}
            <Link
              href="/contact"
              className={`rounded-full px-4 py-2 text-xs uppercase tracking-[0.2em] transition-colors ${
                pathname === "/contact"
                  ? "bg-accent text-white"
                  : "bg-ink text-page hover:bg-accent hover:text-white"
              }`}
            >
              {tr("nav.contact", language)}
            </Link>
          </nav>

          <div className="flex shrink-0 items-center text-[11px] uppercase tracking-[0.18em]">
            <div className="inline-flex items-center rounded-full border border-sand/60 bg-page/60 px-1 py-0.5 text-xs">
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`hit44 hit44-y inline-flex min-h-9 min-w-10 items-center justify-center rounded-full px-2.5 transition md:min-h-8 ${
                  language === "en"
                    ? "bg-ink text-page"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                EN
              </button>
              <span className="px-1 text-ink-soft">/</span>
              <button
                type="button"
                onClick={() => setLanguage("de")}
                className={`hit44 hit44-y inline-flex min-h-9 min-w-10 items-center justify-center rounded-full px-2.5 transition md:min-h-8 ${
                  language === "de"
                    ? "bg-ink text-page"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                DE
              </button>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              className="ml-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-sand/60 text-sm transition-colors hover:border-ink/30 md:h-9 md:w-9"
            >
              {mounted ? (theme === "dark" ? "☀️" : "🌙") : "🌙"}
            </button>
          </div>
        </div>
      </header>
      {mobileDrawer || null}
    </>
  );
}
