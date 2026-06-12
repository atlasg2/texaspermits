import { PageHeader } from "@/components/PageHeader";
import { getInbox } from "@/lib/data/inbox";
import { InboxCard } from "./InboxCard";

export const dynamic = "force-dynamic";

export default async function InboxPage() {
  const { items, watchlistId, followupId } = await getInbox();

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader
        eyebrow="What changed — review and clear"
        title="Inbox"
        count={`${items.length} to review`}
      />

      {items.length === 0 ? (
        <div className="blueprint-grid grid flex-1 place-items-center">
          <div className="max-w-sm text-center">
            <div className="label mb-1">Inbox zero</div>
            <p className="text-sm text-ink-soft">
              Nothing new to review. New and changed gym projects will appear
              here as the daily engine finds them.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 p-6 lg:grid-cols-2 2xl:grid-cols-3">
          {items.map((it) => (
            <InboxCard
              key={it.id}
              item={it}
              watchlistId={watchlistId}
              followupId={followupId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
