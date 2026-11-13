"use client";

import { Box, Button, Card, Flex, Spinner, Text } from "@sanity/ui";
import { createPreviewSecret } from "@sanity/preview-url-secret/create-secret";
import { urlSearchParamPreviewPathname, urlSearchParamPreviewSecret } from "@sanity/preview-url-secret/constants";
import { useCallback, useEffect, useRef, useState } from "react";
import { type SanityDocument, useClient } from "sanity";
import { apiVersion } from "../env";
import { previewTarget } from "../previewTargets";

type Props = { document: { displayed: SanityDocument | null } };

/**
 * Live page preview inside the Studio tree: opens the exact page (drafts included),
 * scrolls to this document's section and highlights it, and refreshes ~1s after every edit
 * while keeping the scroll position.
 */
export function PreviewPane({ document: { displayed } }: Props) {
  const client = useClient({ apiVersion });
  const target = previewTarget(displayed);
  const path = target?.path;
  const anchor = target?.anchor;
  const frame = useRef<HTMLIFrameElement>(null);
  const keepY = useRef<number | null>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);

  // First load: switch the preview into draft mode once (same mechanism as Presentation).
  useEffect(() => {
    if (!path) return;
    let live = true;
    setLoading(true);
    keepY.current = null;
    createPreviewSecret(client, "studio-preview-pane", window.location.href)
      .then(({ secret }) => {
        if (!live) return;
        const u = new URL("/api/draft-mode/enable", window.location.origin);
        u.searchParams.set(urlSearchParamPreviewSecret, secret);
        u.searchParams.set(urlSearchParamPreviewPathname, path);
        setSrc(u.toString());
      })
      .catch(() => live && setError("Couldn’t start the preview. Reload the Studio and try again."));
    return () => {
      live = false;
    };
  }, [client, path]);

  const reload = useCallback(() => {
    if (!path) return;
    try {
      keepY.current = frame.current?.contentWindow?.scrollY ?? null;
    } catch {
      keepY.current = null;
    }
    setLoading(true);
    setSrc(`${path}${path.includes("?") ? "&" : "?"}preview=${Date.now()}`);
  }, [path]);

  // Refresh after edits (debounced).
  const rev = displayed?._rev;
  const firstRev = useRef(rev);
  useEffect(() => {
    if (!rev || rev === firstRev.current) return;
    const t = setTimeout(reload, 900);
    return () => clearTimeout(t);
  }, [rev, reload]);

  const onLoad = () => {
    setLoading(false);
    const w = frame.current?.contentWindow;
    const d = frame.current?.contentDocument;
    if (!w || !d) return;
    setTimeout(() => {
      if (keepY.current !== null) {
        w.scrollTo(0, keepY.current);
        return;
      }
      const el = anchor ? d.getElementById(anchor) : null;
      if (!el) return;
      el.scrollIntoView({ block: "start" });
      el.style.transition = "outline-color .6s ease";
      el.style.outline = "3px solid rgba(224,104,63,.9)";
      el.style.outlineOffset = "6px";
      el.style.borderRadius = el.style.borderRadius || "12px";
      setTimeout(() => (el.style.outlineColor = "transparent"), 1600);
    }, 350);
  };

  if (!target) {
    return (
      <Card padding={5}>
        <Text muted>This item isn’t shown as a page on the website.</Text>
      </Card>
    );
  }

  return (
    <Flex direction="column" style={{ height: "100%" }}>
      <Card borderBottom padding={2} paddingX={3}>
        <Flex align="center" gap={2}>
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Text size={1} muted textOverflow="ellipsis">
              {target.title} — {path}
              {anchor ? `#${anchor}` : ""}
            </Text>
          </Box>
          <Button mode={mobile ? "bleed" : "default"} fontSize={1} padding={2} text="Desktop" onClick={() => setMobile(false)} />
          <Button mode={mobile ? "default" : "bleed"} fontSize={1} padding={2} text="Mobile" onClick={() => setMobile(true)} />
          <Button mode="bleed" fontSize={1} padding={2} text="Reload" onClick={reload} />
          <Button
            as="a"
            href={`/studio/presentation?preview=${encodeURIComponent(path ?? "/")}`}
            mode="ghost"
            fontSize={1}
            padding={2}
            text="Open in Presentation"
          />
          <Button as="a" href={path} target="_blank" rel="noopener noreferrer" mode="bleed" fontSize={1} padding={2} text="↗" />
        </Flex>
      </Card>
      <Card tone="transparent" style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {error ? (
          <Box padding={5}>
            <Text>{error}</Text>
          </Box>
        ) : null}
        {loading && !error ? (
          <Flex align="center" justify="center" style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1 }}>
            <Spinner muted />
          </Flex>
        ) : null}
        {src ? (
          <Flex justify="center" style={{ height: "100%" }}>
            <iframe
              ref={frame}
              src={src}
              title="Page preview"
              onLoad={onLoad}
              style={{
                border: 0,
                height: "100%",
                width: mobile ? 390 : "100%",
                maxWidth: "100%",
                background: "white",
                boxShadow: mobile ? "0 0 0 1px rgba(127,127,127,.25)" : "none",
                opacity: loading ? 0.55 : 1,
                transition: "opacity .2s ease",
              }}
            />
          </Flex>
        ) : null}
      </Card>
    </Flex>
  );
}
