"use client";

import { Button, Card, Flex, Text } from "@sanity/ui";
import { useCallback, useEffect, useRef } from "react";
import type { InputProps, LayoutProps } from "sanity";
import { useRouter } from "sanity/router";
import { usePaneRouter } from "sanity/structure";
import { PREVIEWABLE } from "../previewTargets";

const WIDE = 1100;

/** Splits the current document pane into [Editor | Preview] (editor left, preview right). */
function useOpenPreview() {
  const pane = usePaneRouter();
  const { navigate, state } = useRouter();
  return useCallback(() => {
    const groups = pane.routerPanesState ?? [];
    const group = groups[pane.groupIndex] ?? [];
    const cur = group[pane.siblingIndex];
    if (!cur || !("panes" in state)) return;
    const params = { ...(cur.params ?? {}) } as Record<string, string>;
    delete params.view;
    const next = [
      ...groups.slice(0, pane.groupIndex),
      [
        { ...cur, params },
        { ...cur, params: { ...params, view: "preview" } },
      ],
      ...groups.slice(pane.groupIndex + 1),
    ];
    setTimeout(() => navigate({ ...state, panes: next }, { replace: true }), 0);
  }, [pane, navigate, state]);
}

function PreviewControls() {
  const pane = usePaneRouter();
  const open = useOpenPreview();
  const done = useRef(false);
  const inStructure = typeof window !== "undefined" && window.location.pathname.includes("/structure");

  // Open it automatically once per document, on screens wide enough for two panes.
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    if (!inStructure || window.innerWidth < WIDE) return;
    if (pane.hasGroupSiblings || pane.params?.view === "preview") return;
    open();
  }, [inStructure, open, pane.hasGroupSiblings, pane.params?.view]);

  if (!inStructure || pane.hasGroupSiblings) return null;
  return (
    <Card tone="primary" radius={2} padding={2} paddingX={3} marginBottom={4}>
      <Flex align="center" justify="space-between" gap={3}>
        <Text size={1} muted>
          See your changes live while you edit.
        </Text>
        <Button mode="ghost" fontSize={1} padding={2} text="Show live preview" onClick={open} />
      </Flex>
    </Card>
  );
}

/** Root-level form wrapper for page-backed documents. */
export function RootInput(props: InputProps) {
  if (props.path.length === 0 && PREVIEWABLE.has(props.schemaType.name)) {
    return (
      <>
        <PreviewControls />
        {props.renderDefault(props)}
      </>
    );
  }
  return props.renderDefault(props);
}

/** Studio-wide CSS: with the editor and preview side by side, the Editor/Preview tab row is noise on wide screens. */
export function StudioLayout(props: LayoutProps) {
  return (
    <>
      <style>{`@media (min-width:${WIDE}px){[role="tablist"]:has([id$="tab-preview"]){display:none!important}}`}</style>
      {props.renderDefault(props)}
    </>
  );
}
