/* eslint-disable @next/next/no-img-element */
import { PortableText, type PortableTextComponents, type PortableTextBlock } from "next-sanity";
import { img, type SanityImage } from "@/sanity/content";

type Img = { _type: "image"; asset?: { _ref?: string }; alt?: string; size?: "logo" | "small" | "full" };

const components: PortableTextComponents = {
  block: {
    normal: ({ children }) => <p>{children}</p>,
    h3: ({ children }) => <h3 className="font-display text-2xl font-bold tracking-tight text-ink">{children}</h3>,
    h4: ({ children }) => <h4 className="font-display text-lg font-bold text-ink">{children}</h4>,
    blockquote: ({ children }) => (
      <blockquote className="border-l-[3px] border-accent pl-5 font-display text-xl italic text-ink">{children}</blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => <ul className="list-disc space-y-2 pl-5 marker:text-accent">{children}</ul>,
    number: ({ children }) => <ol className="list-decimal space-y-2 pl-5 marker:font-semibold marker:text-accent">{children}</ol>,
  },
  marks: {
    strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
    link: ({ value, children }) => {
      const href = (value as { href?: string })?.href ?? "#";
      const external = /^https?:\/\//.test(href);
      return (
        <a
          href={href}
          className="text-ink underline decoration-accent decoration-2 underline-offset-4 hover:text-accent"
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {children}
        </a>
      );
    },
  },
  types: {
    image: ({ value }) => {
      const v = value as Img;
      const size = v.size ?? "full";
      const src = img(v as SanityImage, size === "logo" ? 360 : size === "small" ? 900 : 1600);
      if (!src) return null;
      return (
        <img
          src={src}
          alt={v.alt ?? ""}
          loading="lazy"
          className={
            size === "logo"
              ? "inline-block h-10 w-auto opacity-80 grayscale transition hover:opacity-100 hover:grayscale-0"
              : size === "small"
                ? "max-w-sm rounded-2xl"
                : "w-full rounded-2xl"
          }
        />
      );
    },
  },
};

/** Renders a localeBlock value (Portable Text) in the site's type styles. */
export function RichText({ value, className = "" }: { value?: PortableTextBlock[] | null; className?: string }) {
  if (!value?.length) return null;
  return (
    <div className={`space-y-5 ${className}`}>
      <PortableText value={value} components={components} />
    </div>
  );
}
