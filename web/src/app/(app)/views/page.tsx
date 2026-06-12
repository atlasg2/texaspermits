import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { getViewCounts, VIEWS } from "@/lib/data/views";

export const dynamic = "force-dynamic";

export default async function ViewsPage() {
  const counts = await getViewCounts();

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader
        eyebrow="The system finds it"
        title="Views"
        count="Saved automatic filters"
      />
      <div className="grid gap-4 p-6 sm:grid-cols-2">
        {VIEWS.map((v) => (
          <Link
            key={v.key}
            href={`/views/${v.key}`}
            className="group rounded-[var(--radius)] border border-line bg-surface p-5 transition-colors hover:border-blueprint hover:bg-blueprint-wash"
          >
            <div className="flex items-start justify-between">
              <h2 className="text-base font-semibold text-ink group-hover:text-blueprint">
                {v.label}
              </h2>
              <span className="tnum text-2xl font-semibold text-ink">
                {counts[v.key].toLocaleString()}
              </span>
            </div>
            <p className="mt-1.5 max-w-md text-[13px] leading-relaxed text-ink-soft">
              {v.blurb}
            </p>
            {v.caveat && (
              <p className="mt-3 border-t border-line pt-2.5 font-mono text-[10.5px] leading-relaxed text-amber">
                {v.caveat}
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
