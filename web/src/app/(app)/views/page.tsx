import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { allProjectsCount } from "@/lib/data/projects";
import { getViewCounts, VIEWS } from "@/lib/data/views";

export const dynamic = "force-dynamic";

// The home screen: every view we offer, as a readable card with its count and
// description. "All projects" is just the first view — it opens the full table.
export default async function ViewsPage() {
  const [counts, allCount] = await Promise.all([
    getViewCounts(),
    allProjectsCount(),
  ]);

  const cards = [
    {
      href: "/projects",
      label: "All projects",
      blurb:
        "Every project we track across Texas — search, filter, and sort the full record.",
      count: allCount,
      caveat: undefined as string | undefined,
    },
    ...VIEWS.map((v) => ({
      href: `/projects?view=${v.key}`,
      label: v.label,
      blurb: v.blurb,
      count: counts[v.key],
      caveat: v.caveat,
    })),
  ];

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title="Views" count="Pick a view to start" />

      <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group flex flex-col rounded-xl border border-line bg-surface p-5 transition-colors hover:border-blueprint hover:bg-blueprint-wash"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-base font-semibold text-ink group-hover:text-blueprint">
                {card.label}
              </h2>
              <span className="tnum text-2xl font-bold text-ink">
                {card.count.toLocaleString()}
              </span>
            </div>
            <p className="mt-1.5 max-w-md text-[13px] leading-relaxed text-ink-soft">
              {card.blurb}
            </p>
            {card.caveat && (
              <p className="mt-3 border-t border-line pt-2.5 font-mono text-[10.5px] leading-relaxed text-amber">
                {card.caveat}
              </p>
            )}
            <span className="mt-3 text-[12px] font-medium text-blueprint opacity-0 transition-opacity group-hover:opacity-100">
              Open →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
