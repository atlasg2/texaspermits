// Display formatting. Unknown values render as a visible em-dash, never a guess.

export const DASH = "—";

export function money(n: number | null | undefined): string {
  if (n == null) return DASH;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n.toLocaleString()}`;
}

export function sqft(n: number | null | undefined): string {
  if (n == null) return DASH;
  return n.toLocaleString();
}

export function shortDate(d: string | null | undefined): string {
  if (!d) return DASH;
  const dt = new Date(d + "T00:00:00");
  if (isNaN(dt.getTime())) return DASH;
  return dt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// "3d ago", "2mo ago" — for last-checked / last-change columns.
export function relative(ts: string | null | undefined): string {
  if (!ts) return DASH;
  const then = new Date(ts).getTime();
  if (isNaN(then)) return DASH;
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "1d ago";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export function firstLine(text: string | null | undefined, max = 64): string {
  if (!text) return DASH;
  const line = text.split(/\r?\n/)[0].trim();
  return line.length > max ? line.slice(0, max - 1) + "…" : line;
}
