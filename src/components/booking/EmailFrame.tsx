"use client";

import { useEffect, useRef, useState } from "react";

/** Renders an email's HTML in a sandboxed frame that grows to fit (used in the Studio and in /admin). */
export function EmailFrame({ html, dark = false, maxWidth = "100%", title = "Email preview" }: { html: string; dark?: boolean; maxWidth?: number | string; title?: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [h, setH] = useState(480);
  const doc = dark ? html.replace("@media (prefers-color-scheme:dark){", "@media all{") : html;
  useEffect(() => {
    const f = ref.current;
    if (!f) return;
    let ro: ResizeObserver | undefined;
    const fit = () => {
      const body = f.contentDocument?.body;
      if (!body?.childElementCount) return;
      setH(body.scrollHeight + 2);
      ro?.disconnect();
      ro = new ResizeObserver(() => setH(body.scrollHeight + 2));
      ro.observe(body);
    };
    fit();
    f.addEventListener("load", fit);
    return () => {
      f.removeEventListener("load", fit);
      ro?.disconnect();
    };
  }, [doc]);
  return (
    <iframe
      ref={ref}
      title={title}
      srcDoc={doc}
      sandbox="allow-same-origin"
      style={{ display: "block", width: "100%", maxWidth, height: h, border: 0, margin: "0 auto", background: dark ? "#0d0c0a" : "#f4f3f0", borderRadius: 12 }}
    />
  );
}
