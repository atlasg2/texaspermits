import Link from "next/link";

export function DataTableFrame({
  children,
  empty,
}: {
  children: React.ReactNode;
  empty?: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      {children}
      {empty}
    </div>
  );
}

export function SortHead({
  basePath,
  col,
  label,
  align,
  activeSort,
  params,
}: {
  basePath: string;
  col: string;
  label: string;
  align?: "text-left" | "text-right";
  activeSort: string;
  params: Record<string, string>;
}) {
  const next = new URLSearchParams(params);
  next.set("sort", col);
  next.delete("page");
  const active = activeSort === col;

  return (
    <th className={`px-3 py-2 font-medium ${align ?? "text-left"}`}>
      <Link
        href={`${basePath}?${next.toString()}`}
        className={`inline-flex items-center gap-1 hover:text-ink ${
          active ? "text-ink" : ""
        }`}
      >
        {label}
        <span className={active ? "text-blueprint" : "text-transparent"}>
          ▾
        </span>
      </Link>
    </th>
  );
}

export function TableEmpty({
  title = "No matches",
  message = "Try different filters or clear the search.",
}: {
  title?: string;
  message?: string;
}) {
  return (
    <div className="blueprint-grid grid place-items-center py-24 text-center">
      <div>
        <div className="label mb-1">{title}</div>
        <p className="text-base text-ink">{message}</p>
      </div>
    </div>
  );
}
