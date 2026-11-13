"use client";

import { Box, Button, Card, Flex, Spinner, Stack, Text } from "@sanity/ui";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  type FormPatch,
  type ObjectInputProps,
  PatchEvent,
  set,
  setIfMissing,
  useClient,
} from "sanity";
import { apiVersion } from "../env";
import { blocksToTagged, hashOf, type PTItem, taggedToBlocks, textOf } from "../translate/tagged";

type Val = { _type?: string; en?: unknown; de?: unknown; deFor?: string; deMode?: "auto" | "manual" };
type Status = "idle" | "translating" | "error" | "noauth" | "offline";

const DELAY = 1400; // ms after the last English keystroke

/**
 * English + German side by side. Typing English auto-fills German (debounced).
 * Editing German by hand keeps it — until English changes again, then it re-translates.
 */
export function LocaleInput(props: ObjectInputProps) {
  const { onChange, schemaType } = props;
  const value = props.value as Val | undefined;
  const client = useClient({ apiVersion });
  const [status, setStatus] = useState<Status>("idle");
  const latest = useRef(value);
  latest.current = value;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const translate = useCallback(async () => {
    const en = latest.current?.en;
    const enText = textOf(en);
    if (!enText.trim()) return;
    const blocks = Array.isArray(en);
    const texts = blocks ? blocksToTagged(en as PTItem[]) : [String(en)];
    setStatus("translating");
    try {
      const token = client.config().token;
      const res = await fetch("/api/translate", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ texts }),
      });
      if (!res.ok) {
        setStatus(res.status === 401 ? "noauth" : res.status === 503 ? "offline" : "error");
        return;
      }
      const { de } = (await res.json()) as { de: string[] };
      // English changed while we waited → the newer run will write German.
      if (textOf(latest.current?.en) !== enText) return;
      const deValue = blocks ? taggedToBlocks(en as PTItem[], de) : de[0];
      onChange([
        setIfMissing({ _type: schemaType.name }),
        set(deValue, ["de"]),
        set(hashOf(enText), ["deFor"]),
        set("auto", ["deMode"]),
      ]);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }, [client, onChange, schemaType.name]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const handleChange = useCallback(
    (patch: FormPatch | FormPatch[] | PatchEvent) => {
      onChange(patch);
      const list: FormPatch[] = patch instanceof PatchEvent ? patch.patches : Array.isArray(patch) ? patch : [patch];
      const field = list[0]?.path?.[0];
      if (field === "en") {
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(translate, DELAY);
      } else if (field === "de") {
        // Hand-edited German: remember which English it belongs to, keep it until English changes.
        onChange([set(hashOf(textOf(latest.current?.en)), ["deFor"]), set("manual", ["deMode"])]);
      }
    },
    [onChange, translate],
  );

  const enText = textOf(value?.en);
  const fresh = Boolean(value?.deFor) && value?.deFor === hashOf(enText);
  const hasDe = textOf(value?.de).trim().length > 0;

  let note: { tone: "default" | "positive" | "caution" | "critical"; text: string } | null = null;
  if (!enText.trim()) note = null;
  else if (status === "translating") note = { tone: "default", text: "Translating to German…" };
  else if (status === "noauth") note = { tone: "critical", text: "Couldn't translate — please log in to the Studio again." };
  else if (status === "offline") note = { tone: "caution", text: "Auto-translation is switched off (AI credit). German can be edited by hand." };
  else if (status === "error") note = { tone: "critical", text: "Translation failed. Try again." };
  else if (!hasDe) note = { tone: "caution", text: "German is missing." };
  // no fingerprint = German written before auto-translate existed → it's a hand-written translation, not a stale one
  else if (!value?.deFor) note = { tone: "default", text: "✎ German written by hand — re-translates when you change the English." };
  else if (!fresh) note = { tone: "caution", text: "English changed — German may be outdated." };
  else if (value?.deMode === "manual") note = { tone: "default", text: "✎ German edited by you — kept until English changes." };
  else note = { tone: "positive", text: "✓ German auto-translated" };

  return (
    <Stack gap={3}>
      {props.renderDefault({ ...props, onChange: handleChange })}
      {note ? (
        <Card tone={note.tone} radius={2} paddingX={3} paddingY={2}>
          <Flex align="center" gap={3}>
            {status === "translating" ? <Spinner muted /> : null}
            <Box style={{ flex: 1 }}>
              <Text size={1} muted={note.tone === "default"}>
                {note.text}
              </Text>
            </Box>
            {status !== "translating" ? (
              <Button
                mode="bleed"
                fontSize={1}
                padding={2}
                text={hasDe ? "Re-translate" : "Translate"}
                onClick={translate}
              />
            ) : null}
          </Flex>
        </Card>
      ) : null}
    </Stack>
  );
}
