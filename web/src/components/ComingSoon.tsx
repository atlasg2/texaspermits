import { PageHeader } from "@/components/PageHeader";

export function ComingSoon({
  eyebrow,
  title,
  note,
}: {
  eyebrow: string;
  title: string;
  note: string;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader eyebrow={eyebrow} title={title} />
      <div className="blueprint-grid grid flex-1 place-items-center">
        <div className="max-w-sm text-center">
          <div className="label mb-2">On the build queue</div>
          <p className="text-sm text-ink-soft">{note}</p>
        </div>
      </div>
    </div>
  );
}
