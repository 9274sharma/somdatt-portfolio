import "server-only";

/** Driving time between two addresses via OpenRouteService (free, OpenStreetMap data, no card).
 *  Needs ORS_API_KEY. Results are cached per server instance; failures return null ("unknown"). */
const BASE = (process.env.ORS_BASE || "https://api.openrouteservice.org").replace(/\/$/, "");
const geoCache = new Map<string, [number, number] | null>();
const routeCache = new Map<string, number | null>();

export const travelConfigured = () => Boolean(process.env.ORS_API_KEY);

async function geocode(text: string): Promise<[number, number] | null> {
  const key = text.trim().toLowerCase();
  if (geoCache.has(key)) return geoCache.get(key)!;
  const q = new URLSearchParams({ api_key: process.env.ORS_API_KEY!, text, size: "1", "boundary.country": "DE,IN,AT,CH,NL,DK" });
  // Bias towards Hamburg so "Altona" or "Strandperle" resolve locally.
  q.set("focus.point.lon", "9.99");
  q.set("focus.point.lat", "53.55");
  let out: [number, number] | null = null;
  try {
    const res = await fetch(`${BASE}/geocode/search?${q}`, { cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      const j = (await res.json()) as { features?: { geometry?: { coordinates?: [number, number] } }[] };
      out = j.features?.[0]?.geometry?.coordinates ?? null;
    } else console.error("ORS geocode:", res.status);
  } catch (e) {
    console.error("ORS geocode:", e);
  }
  geoCache.set(key, out);
  return out;
}

/** Minutes by car from a to b, or null if unknown. */
export async function driveMinutes(a: string, b: string): Promise<number | null> {
  if (!travelConfigured() || !a.trim() || !b.trim()) return null;
  const key = `${a.trim().toLowerCase()}→${b.trim().toLowerCase()}`;
  if (routeCache.has(key)) return routeCache.get(key)!;
  const [p, q] = await Promise.all([geocode(a), geocode(b)]);
  let out: number | null = null;
  if (p && q) {
    try {
      const res = await fetch(`${BASE}/v2/directions/driving-car`, {
        method: "POST",
        headers: { Authorization: process.env.ORS_API_KEY!, "Content-Type": "application/json" },
        body: JSON.stringify({ coordinates: [p, q] }),
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        const j = (await res.json()) as { routes?: { summary?: { duration?: number } }[] };
        const s = j.routes?.[0]?.summary?.duration;
        out = typeof s === "number" ? Math.max(1, Math.round(s / 60)) : null;
      } else console.error("ORS route:", res.status);
    } catch (e) {
      console.error("ORS route:", e);
    }
  }
  routeCache.set(key, out);
  return out;
}
