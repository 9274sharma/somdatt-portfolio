/** Infinite, pausable logo/name strip (static under reduced motion). */
export function Marquee({ items }: { items: string[] }) {
  const row = [...items, ...items];
  return (
    <div className="marquee relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_10%,#000_90%,transparent)]">
      <div className="marquee-track flex w-max py-2">
        {row.map((t, i) => (
          <span
            key={i}
            aria-hidden={i >= items.length}
            className="whitespace-nowrap pr-14 font-display text-2xl font-bold tracking-tight text-ink/35 transition hover:text-ink md:text-3xl"
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
