import Link from "next/link";
import { STAGE_FILTERS } from "@/lib/data/views";

// Stage chips for the Gym Projects view. Each project is exactly one stage, so
// these are mutually exclusive (single-select), not overlapping toggles.
export function StageFilter({
  params,
  active,
}: {
  params: Record<string, string>;
  active?: string;
}) {
  const hrefFor = (stage?: string) => {
    const next = new URLSearchParams(params);
    if (stage) next.set("stage", stage);
    else next.delete("stage");
    next.delete("page");
    return `/projects?${next.toString()}`;
  };

  const chips = [{ key: "", label: "All stages" }, ...STAGE_FILTERS];

  return (
    <div className="flex flex-wrap items-center gap-1.5 border-b border-line bg-surface px-4 py-2.5">
      <span className="label mr-1">Stage</span>
      {chips.map((chip) => {
        const isActive = (active ?? "") === chip.key;
        return (
          <Link
            key={chip.key || "all"}
            href={hrefFor(chip.key || undefined)}
            aria-current={isActive ? "true" : undefined}
            className={`rounded-full border px-2.5 py-1 text-[12.5px] font-medium transition-colors ${
              isActive
                ? "border-blueprint bg-blueprint text-white"
                : "border-line-strong bg-paper text-ink-soft hover:border-blueprint hover:text-blueprint"
            }`}
          >
            {chip.label}
          </Link>
        );
      })}
    </div>
  );
}
