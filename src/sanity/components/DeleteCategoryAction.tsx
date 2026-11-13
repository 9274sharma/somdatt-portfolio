"use client";

import { Box, Button, Card, Flex, Stack, Text, TextInput } from "@sanity/ui";
import { TrashIcon } from "@sanity/icons/Trash";
import { useEffect, useState } from "react";
import { type DocumentActionComponent, useClient } from "sanity";
import { useRouter } from "sanity/router";
import { apiVersion } from "../env";

/**
 * Category delete with a final warning: shows how many projects live in the folder and
 * asks for the category name. Deletes the category AND its projects (drafts included).
 */
export const DeleteCategoryAction: DocumentActionComponent = (props) => {
  const { id, published, draft, onComplete } = props;
  const client = useClient({ apiVersion });
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<string[] | null>(null);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const doc = (draft ?? published) as { title?: { en?: string } } | null;
  const name = doc?.title?.en?.trim() || "this category";

  useEffect(() => {
    if (!open) return;
    client
      .fetch<string[]>(`*[_type=="project" && category._ref==$id]._id`, { id })
      .then(setProjects)
      .catch(() => setProjects([]));
  }, [open, client, id]);

  const remove = async () => {
    setBusy(true);
    setError(null);
    try {
      const tx = client.transaction();
      for (const pid of projects ?? []) tx.delete(pid.replace(/^drafts\./, "")).delete(`drafts.${pid.replace(/^drafts\./, "")}`);
      tx.delete(id).delete(`drafts.${id}`);
      await tx.commit({ visibility: "async" });
      setOpen(false);
      onComplete();
      router.navigateUrl({ path: "/studio/structure/work" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
      setBusy(false);
    }
  };

  const n = projects?.length ?? 0;
  return {
    label: "Delete category…",
    icon: TrashIcon,
    tone: "critical",
    disabled: !published && !draft,
    onHandle: () => {
      setTyped("");
      setOpen(true);
    },
    dialog: open
      ? {
          type: "dialog",
          header: `Delete “${name}”?`,
          onClose: () => {
            setOpen(false);
            onComplete();
          },
          content: (
            <Stack gap={4}>
              <Card tone="critical" padding={3} radius={2}>
                <Text size={1}>
                  {projects === null
                    ? "Checking projects…"
                    : n
                      ? `This also deletes ${n} project${n > 1 ? "s" : ""} in this folder, with all their photos and videos. The chip disappears from the Work page. This can’t be undone.`
                      : "The chip disappears from the Work page. This can’t be undone."}
                </Text>
              </Card>
              <Stack gap={2}>
                <Text size={1} muted>
                  Type <b>{name}</b> to confirm:
                </Text>
                <TextInput value={typed} onChange={(e) => setTyped(e.currentTarget.value)} disabled={busy} />
              </Stack>
              {error ? (
                <Text size={1} style={{ color: "var(--card-badge-critical-fg-color)" }}>
                  {error}
                </Text>
              ) : null}
              <Flex justify="flex-end" gap={2}>
                <Box>
                  <Button mode="ghost" text="Cancel" onClick={() => setOpen(false)} disabled={busy} />
                </Box>
                <Button
                  tone="critical"
                  icon={TrashIcon}
                  text={busy ? "Deleting…" : n ? `Delete category + ${n} project${n > 1 ? "s" : ""}` : "Delete category"}
                  disabled={busy || projects === null || typed.trim() !== name}
                  onClick={remove}
                />
              </Flex>
            </Stack>
          ),
        }
      : null,
  };
};
