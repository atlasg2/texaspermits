import Link from "next/link";

// The browse surface is one screen; these chips swap the active "view".
// "All projects" is just the default (no view param). Short labels keep the
// switcher to one row; the full descriptions live on each view's caveat banner.
const CHIPS: { key: string; label: string; href: string }[] = [
  { key: "all", label: "All projects", href: "/projects" },
  { key: "new_changed", label: "New & Changed", href: "/projects?view=new_changed" },
  { key: "prospects", label: "Prospects", href: "/projects?view=prospects" },
  { key: "gym", label: "Gym Projects", href: "/projects?view=gym" },
];

export function ViewSwitcher({ active }: { active: string }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 px-4 pt-1 pb-3">
      {CHIPS.map((chip) => {
        const isActive = active === chip.key;
        return (
          <Link
            key={chip.key}
            href={chip.href}
            aria-current={isActive ? "page" : undefined}
            className={`rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors ${
              isActive
                ? "border-blueprint bg-blueprint text-white"
                : "border-line-strong bg-surface text-ink-soft hover:border-blueprint hover:text-blueprint"
            }`}
          >
            {chip.label}
          </Link>
        );
      })}
    </div>
  );
}
