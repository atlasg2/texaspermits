export function RouteLoading({
  title = "Loading",
}: {
  title?: string;
}) {
  return (
    <div className="min-h-dvh animate-pulse">
      <div className="border-b border-line bg-paper px-6 py-5">
        <div className="h-3 w-28 bg-line" />
        <div className="mt-3 h-8 w-64 bg-line-strong" />
      </div>
      <div className="p-6">
        <span className="sr-only">{title}</span>
        <div className="mb-4 flex gap-2">
          <div className="h-10 w-72 bg-line" />
          <div className="h-10 w-44 bg-line" />
          <div className="h-10 w-44 bg-line" />
        </div>
        <div className="overflow-hidden rounded-[var(--radius)] border border-line bg-surface">
          <div className="h-12 border-b border-line bg-surface-2" />
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="grid h-16 grid-cols-[2fr_1fr_1fr_1fr] gap-5 border-b border-line px-4 py-4 last:border-b-0"
            >
              <div className="bg-line" />
              <div className="bg-line" />
              <div className="bg-line" />
              <div className="bg-line" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
