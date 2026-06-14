import Link from "next/link";

function PaginationButton({
  to,
  pages,
  hrefFor,
  children,
}: {
  to: number;
  pages: number;
  hrefFor: (page: number) => string;
  children: React.ReactNode;
}) {
  const enabled = to >= 1 && to <= pages;
  return enabled ? (
    <Link
      href={hrefFor(to)}
      className="rounded-md border border-line-strong bg-surface px-2.5 py-1.5 text-[13px] font-medium text-ink-soft hover:border-blueprint hover:text-blueprint"
    >
      {children}
    </Link>
  ) : (
    <span className="rounded-md border border-line bg-surface px-2.5 py-1.5 text-[13px] font-medium text-ink-faint opacity-50">
      {children}
    </span>
  );
}

export function Pagination({
  page,
  pages,
  total,
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
  return (
    <div className="sticky bottom-0 flex items-center justify-between border-t border-line bg-paper/90 px-4 py-2.5 backdrop-blur-sm">
      <span className="text-[13px] text-ink-faint">
        <span className="tnum">{total.toLocaleString()}</span> {unit} · page{" "}
        <span className="tnum">{page.toLocaleString()}</span> of{" "}
        <span className="tnum">{pages.toLocaleString()}</span>
      </span>
      <div className="flex gap-2">
        <PaginationButton to={page - 1} pages={pages} hrefFor={hrefFor}>
          ← Prev
        </PaginationButton>
        <PaginationButton to={page + 1} pages={pages} hrefFor={hrefFor}>
          Next →
        </PaginationButton>
      </div>
    </div>
  );
}
