/**
 * Portable Text ⇄ "tagged" strings, so a whole paragraph is translated in one
 * piece (good German word order) while bold/italic/links survive:
 *   [plain "We shoot ", bold "weddings", plain " too."]  →  "We shoot <s1>weddings</s1> too."
 */

type Span = { _type: "span"; _key: string; text: string; marks?: string[] };
type Block = {
  _type: "block";
  _key: string;
  children?: Span[];
  markDefs?: unknown[];
  style?: string;
  listItem?: string;
  level?: number;
};
export type PTItem = Block | { _type: string; _key: string; [k: string]: unknown };

const isBlock = (b: PTItem): b is Block => b._type === "block";
const key = () => Math.random().toString(36).slice(2, 10);

/** One string per text block (non-text items, e.g. images, become ""). */
export function blocksToTagged(blocks: PTItem[] | undefined): string[] {
  return (blocks ?? []).map((b) =>
    isBlock(b)
      ? (b.children ?? [])
          .map((s, i) => (s.marks?.length ? `<s${i}>${s.text}</s${i}>` : s.text))
          .join("")
      : "",
  );
}

/** Rebuild German blocks from the English structure + translated tagged strings. */
export function taggedToBlocks(src: PTItem[] | undefined, de: string[]): PTItem[] {
  return (src ?? []).map((b, bi) => {
    if (!isBlock(b)) return { ...b };
    const out = de[bi] ?? "";
    const spans: Span[] = [];
    const re = /<s(\d+)>([\s\S]*?)<\/s\1>/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(out))) {
      if (m.index > last) spans.push({ _type: "span", _key: key(), text: out.slice(last, m.index), marks: [] });
      const orig = b.children?.[Number(m[1])];
      spans.push({ _type: "span", _key: key(), text: m[2], marks: orig?.marks ?? [] });
      last = m.index + m[0].length;
    }
    if (last < out.length) spans.push({ _type: "span", _key: key(), text: out.slice(last).replace(/<\/?s\d+>/g, ""), marks: [] });
    if (!spans.length) spans.push({ _type: "span", _key: key(), text: "", marks: [] });
    return { ...b, _key: b._key, children: spans, markDefs: b.markDefs ?? [] };
  });
}

/** Small stable hash, used to know which English text the German was made from. */
export function hashOf(v: unknown): string {
  const s = typeof v === "string" ? v : JSON.stringify(v ?? "");
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

/** Plain text of a value, to compare / hash (ignores keys so re-saves don't look like edits). */
export function textOf(v: unknown): string {
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return blocksToTagged(v as PTItem[]).join("\n");
  return "";
}
