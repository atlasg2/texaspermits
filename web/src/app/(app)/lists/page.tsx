import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { getLists } from "@/lib/data/lists";

export const dynamic = "force-dynamic";

const BLURB: Record<string, string> = {
  Watchlist: "Projects or companies worth keeping an eye on.",
  "Follow-Up": "Records that need an action — with an owner and a due date.",
};

export default async function ListsPage() {
  const lists = await getLists();

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader
        eyebrow="The team chooses it"
        title="Lists"
        count={`${lists.length} lists`}
      />
      <div className="grid gap-4 p-6 sm:grid-cols-2">
        {lists.map((l) => (
          <Link
            key={l.id}
            href={`/lists/${l.id}`}
            className="group rounded-[var(--radius)] border border-line bg-surface p-5 transition-colors hover:border-blueprint hover:bg-blueprint-wash"
          >
            <div className="flex items-start justify-between">
              <h2 className="text-base font-semibold text-ink group-hover:text-blueprint">
                {l.name}
              </h2>
              <span className="tnum text-2xl font-semibold text-ink">
                {l.count.toLocaleString()}
              </span>
            </div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">
              {BLURB[l.name] ?? "A team-curated collection."}
            </p>
            {l.is_system && (
              <span className="label mt-3 inline-block">System list</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
