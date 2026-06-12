import Link from "next/link";

export function Pagination({
  page,
  pages,
  total,
  pageSize,
  hrefFor,
  unit = "rows",
}: {
  page: number;
  pages: number;
  total: number;
  pageSize: number;
  hrefFor: (p: number) => string;
  unit?: string;
}) {
  const Btn = ({ to, children }: { to: number; children: React.ReactNode }) => {
    const ok = to >= 1 && to <= pages;
    return ok ? (
      <Link
        href={hrefFor(to)}
        className="rounded-[var(--radius)] border border-line-strong bg-surface px-3 py-1.5 font-mono text-xs text-ink-soft hover:border-blueprint hover:text-blueprint"
      >
        {children}
      </Link>
    ) : (
      <span className="rounded-[var(--radius)] border border-line bg-surface px-3 py-1.5 font-mono text-xs text-ink-faint opacity-50">
        {children}
      </span>
    );
  };
  return (
    <div className="sticky bottom-0 flex items-center justify-between border-t border-line bg-paper/90 px-6 py-3 backdrop-blur-sm">
      <span className="font-mono text-[11px] text-ink-faint">
        {total.toLocaleString()} {unit} · page {page.toLocaleString()} of{" "}
        {pages.toLocaleString()}
      </span>
      <div className="flex gap-2">
        <Btn to={page - 1}>← Prev</Btn>
        <Btn to={page + 1}>Next →</Btn>
      </div>
    </div>
  );
}
