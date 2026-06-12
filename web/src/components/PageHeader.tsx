export function PageHeader({
  eyebrow,
  title,
  count,
  children,
}: {
  eyebrow: string;
  title: string;
  count?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-paper/85 backdrop-blur-sm">
      <div className="flex flex-wrap items-end justify-between gap-4 px-6 pt-5 pb-4">
        <div>
          <div className="label">{eyebrow}</div>
          <div className="mt-1 flex items-baseline gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              {title}
            </h1>
            {count && (
              <span className="font-mono text-xs text-ink-faint">{count}</span>
            )}
          </div>
        </div>
        {children}
      </div>
    </header>
  );
}
