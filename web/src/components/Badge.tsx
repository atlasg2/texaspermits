import type { Tone } from "@/lib/schedule";

const TONE: Record<Tone, string> = {
  blueprint: "bg-blueprint-wash text-blueprint border-blueprint/20",
  grass: "bg-grass-wash text-grass border-grass/20",
  amber: "bg-amber-wash text-amber border-amber/25",
  rust: "bg-rust-wash text-rust border-rust/20",
  slate: "bg-slate-wash text-slate border-slate/20",
  neutral: "bg-surface-2 text-ink border-line-strong",
};

export function Badge({
  children,
  tone = "neutral",
  dot = false,
}: {
  children: React.ReactNode;
  tone?: Tone;
  dot?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-[12px] font-medium ${TONE[tone]}`}
    >
      {dot && (
        <span className="size-1.5 rounded-full bg-current opacity-80" />
      )}
      {children}
    </span>
  );
}
