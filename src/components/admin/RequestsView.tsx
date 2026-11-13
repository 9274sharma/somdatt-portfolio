"use client";

import { useMemo, useState } from "react";
import { type BookingRequest, RequestsPanel } from "./RequestsPanel";
import type { ComponentProps } from "react";

type Sort = "new" | "old" | "date";
const SORTS: [Sort, string][] = [
  ["new", "Newest first"],
  ["old", "Waiting longest"],
  ["date", "Event date"],
];

/** Requests with sort / type filter / search on top of the request cards. */
export function RequestsView(props: Omit<ComponentProps<typeof RequestsPanel>, "requests" | "layout"> & { requests: BookingRequest[] }) {
  const [sort, setSort] = useState<Sort>("new");
  const [type, setType] = useState("");
  const [q, setQ] = useState("");
  const types = useMemo(() => [...new Set(props.requests.map((r) => r.type))].sort(), [props.requests]);
  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const f = props.requests.filter(
      (r) => (!type || r.type === type) && (!needle || [r.name, r.email, r.venue, r.message ?? ""].some((x) => x.toLowerCase().includes(needle))),
    );
    return f.sort((a, b) =>
      sort === "date" ? a.wish.start.localeCompare(b.wish.start) : sort === "old" ? (a.receivedAt ?? "").localeCompare(b.receivedAt ?? "") : (b.receivedAt ?? "").localeCompare(a.receivedAt ?? ""),
    );
  }, [props.requests, sort, type, q]);

  const pill = (on: boolean) => `inline-flex min-h-11 shrink-0 items-center rounded-full px-4 text-xs font-semibold transition ${on ? "bg-ink text-page" : "text-ink-soft hover:text-ink"}`;
  return (
    <>
      {props.requests.length ? (
        <div className="mb-5 grid gap-3">
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
            <span className="inline-flex gap-1 rounded-full border border-sand/60 p-1" role="radiogroup" aria-label="Sort">
              {SORTS.map(([k, label]) => (
                <button key={k} type="button" role="radio" aria-checked={sort === k} onClick={() => setSort(k)} className={pill(sort === k)}>
                  {label}
                </button>
              ))}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, email, venue…"
              aria-label="Search requests"
              className="min-h-11 min-w-0 flex-1 rounded-full border border-sand/60 bg-transparent px-4 text-sm text-ink placeholder:text-ink-soft/60 focus:border-accent focus:outline-none"
            />
            {types.length > 1 ? (
              <select
                aria-label="Event type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="min-h-11 rounded-full border border-sand/60 bg-page px-4 text-sm text-ink focus:border-accent focus:outline-none"
              >
                <option value="">All types</option>
                {types.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            ) : null}
          </div>
          {list.length !== props.requests.length ? (
            <p className="text-xs text-ink-soft">
              Showing {list.length} of {props.requests.length}
            </p>
          ) : null}
        </div>
      ) : null}
      {props.requests.length && !list.length ? (
        <p className="rounded-3xl border border-dashed border-sand/60 p-10 text-center text-sm text-ink-soft">Nothing matches — clear the search or type filter.</p>
      ) : (
        <RequestsPanel {...props} requests={list} />
      )}
    </>
  );
}
