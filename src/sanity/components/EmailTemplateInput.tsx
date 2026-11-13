"use client";

import { useEffect, useState } from "react";
import type { ObjectInputProps } from "sanity";
import { useClient } from "sanity";
import { Box, Button, Card, Flex, Stack, Text } from "@sanity/ui";
import { EmailFrame } from "@/components/booking/EmailFrame";
import { type Lang, type RawTemplate, DEFAULTS, pickL, resolveConfirm, resolveDecline, resolveOther } from "@/lib/booking-config";
import { bookingConfirmed, bookingDeclined, customEmail, requestReceived, sampleData } from "@/lib/emails";

type Kind = "received" | "confirm" | "decline" | "other";
const SITE = "https://www.somdattsharma.com";

/** The normal fields + a live preview of the email underneath (sample client, EN/DE, light/dark). */
function EmailTemplateInput(props: ObjectInputProps & { kind: Kind }) {
  const { kind } = props;
  const client = useClient({ apiVersion: "2024-01-01" });
  const [lang, setLang] = useState<Lang>("en");
  const [dark, setDark] = useState(false);
  const [contact, setContact] = useState({ replyTo: "you@example.com", phone: undefined as string | undefined, site: SITE });
  useEffect(() => {
    client
      .fetch<{ contactEmail?: string; phone?: string } | null>(`*[_id=="siteSettings"][0]{contactEmail,phone}`)
      .then((s) => s && setContact({ replyTo: s.contactEmail || "you@example.com", phone: s.phone, site: SITE }))
      .catch(() => {});
  }, [client]);

  const v = (props.value ?? {}) as RawTemplate & { note?: { en?: string; de?: string } };
  const d = sampleData(lang, kind, contact);
  let mail: { subject: string; html: string } | null = null;
  if (kind === "received") {
    const r = DEFAULTS.emailReceived;
    mail = requestReceived(d, {
      subject: pickL(v.subject, lang) || pickL(r.subject, lang),
      heading: pickL(v.heading, lang) || pickL(r.heading, lang),
      text: pickL(v.text, lang) || pickL(r.text, lang),
      note: pickL(v.note, lang) || pickL(r.note, lang),
    });
  } else if (kind === "confirm") mail = bookingConfirmed(d, resolveConfirm({ ...v, _key: "x" }, lang));
  else if (kind === "decline") mail = bookingDeclined(d, resolveDecline({ ...v, _key: "x" }, lang));
  else mail = customEmail({ ...d, blocks: [] }, resolveOther({ ...v, _key: "x" }, lang));

  return (
    <Stack gap={4}>
      {props.renderDefault(props)}
      <Card padding={3} radius={3} tone="transparent" border>
        <Stack gap={3}>
          <Flex align="center" gap={2} wrap="wrap">
            <Box style={{ flex: 1, minWidth: 160 }}>
              <Text size={1} weight="semibold">
                Live preview
              </Text>
              <Box marginTop={2}>
                <Text size={1} muted>
                  Sample client: Priya &amp; Arjun · Wedding
                </Text>
              </Box>
            </Box>
            <Button mode={lang === "en" ? "default" : "ghost"} text="EN" fontSize={1} padding={2} onClick={() => setLang("en")} />
            <Button mode={lang === "de" ? "default" : "ghost"} text="DE" fontSize={1} padding={2} onClick={() => setLang("de")} />
            <Button mode={dark ? "default" : "ghost"} text={dark ? "Dark mail app" : "Light mail app"} fontSize={1} padding={2} onClick={() => setDark((x) => !x)} />
          </Flex>
          {mail.subject ? (
            <Text size={1}>
              <strong>Subject:</strong> {mail.subject}
            </Text>
          ) : (
            <Text size={1} muted>
              Add a subject and text to see the email.
            </Text>
          )}
          <EmailFrame html={mail.html} dark={dark} />
        </Stack>
      </Card>
    </Stack>
  );
}

export const emailPreviewInput = (kind: Kind) =>
  function EmailPreview(props: ObjectInputProps) {
    return <EmailTemplateInput {...props} kind={kind} />;
  };
