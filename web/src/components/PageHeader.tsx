export function PageHeader({
  title,
  count,
  children,
}: {
  /** @deprecated no longer rendered; kept so existing callers still compile */
  eyebrow?: string;
  title: string;
  count?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="z-20 border-b border-line bg-paper/90 backdrop-blur-sm md:sticky md:top-0">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <h1 className="text-[22px] font-bold tracking-tight text-ink">
          {title}
        </h1>
        {count && (
          <span className="rounded-full border border-line bg-surface-2 px-2.5 py-0.5 text-[12px] font-semibold text-ink-soft">
            {count}
          </span>
        )}
        {children && <div className="ml-auto">{children}</div>}
      </div>
    </header>
  );
}
