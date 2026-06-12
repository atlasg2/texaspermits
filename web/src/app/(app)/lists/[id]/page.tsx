import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/Badge";
import { getList } from "@/lib/data/lists";
import { removeListItem, setListItemFields } from "@/lib/actions";
import { statusTone } from "@/lib/schedule";
import { shortDate, DASH } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ListDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getList(Number(id));
  if (!data) notFound();
  const { list, items } = data;
  const isFollowUp = list.name === "Follow-Up";

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader
        eyebrow="List · the team chooses it"
        title={list.name}
        count={`${items.length} ${items.length === 1 ? "item" : "items"}`}
      />
      <div className="mb-1 px-6 pt-4">
        <Link
          href="/lists"
          className="font-mono text-[11px] text-ink-faint hover:text-blueprint"
        >
          ← All lists
        </Link>
      </div>

      <div className="flex-1 px-3 py-2">
        {items.length === 0 ? (
          <div className="blueprint-grid grid place-items-center py-24 text-center">
            <div className="max-w-sm">
              <div className="label mb-1">Empty list</div>
              <p className="text-sm text-ink-soft">
                Add projects from the Inbox, a project page, or the Projects
                table — they&apos;ll show up here.
              </p>
            </div>
          </div>
        ) : (
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="label border-b border-line-strong text-left">
                <th className="px-3 py-2 font-medium">Item</th>
                <th className="px-3 py-2 font-medium">Status</th>
                {isFollowUp && (
                  <>
                    <th className="px-3 py-2 font-medium">Assigned</th>
                    <th className="px-3 py-2 font-medium">Due</th>
                    <th className="px-3 py-2 font-medium">Done</th>
                  </>
                )}
                <th className="px-3 py-2 font-medium">Added by</th>
                <th className="px-3 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr
                  key={it.id}
                  className={`group border-b border-line align-middle hover:bg-surface-2 ${
                    it.resolved ? "opacity-55" : ""
                  }`}
                >
                  <td className="px-3 py-2.5">
                    <Link
                      href={it.href}
                      className="font-medium text-ink hover:text-blueprint"
                    >
                      {it.title}
                    </Link>
                    {it.subtitle && (
                      <div className="text-[11px] text-ink-faint">
                        {it.subtitle}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    {it.status ? (
                      <Badge tone={statusTone(it.status)}>{it.status}</Badge>
                    ) : (
                      <span className="text-ink-faint">{DASH}</span>
                    )}
                  </td>
                  {isFollowUp && (
                    <>
                      <td className="px-3 py-2.5">
                        <form
                          action={async (fd: FormData) => {
                            "use server";
                            await setListItemFields(it.id, {
                              assigned_to:
                                (fd.get("assigned_to") as string) || null,
                            });
                          }}
                        >
                          <input
                            name="assigned_to"
                            defaultValue={it.assigned_to ?? ""}
                            placeholder="—"
                            className="w-28 rounded-[var(--radius)] border border-transparent bg-transparent px-1.5 py-1 font-mono text-[11px] text-ink-soft hover:border-line focus:border-blueprint focus:bg-surface focus:outline-none"
                          />
                        </form>
                      </td>
                      <td className="px-3 py-2.5">
                        <form
                          action={async (fd: FormData) => {
                            "use server";
                            await setListItemFields(it.id, {
                              due_date: (fd.get("due_date") as string) || null,
                            });
                          }}
                        >
                          <input
                            type="date"
                            name="due_date"
                            defaultValue={it.due_date ?? ""}
                            className="rounded-[var(--radius)] border border-transparent bg-transparent px-1.5 py-1 font-mono text-[11px] text-ink-soft hover:border-line focus:border-blueprint focus:bg-surface focus:outline-none"
                          />
                        </form>
                      </td>
                      <td className="px-3 py-2.5">
                        <form
                          action={async () => {
                            "use server";
                            await setListItemFields(it.id, {
                              resolved: !it.resolved,
                            });
                          }}
                        >
                          <button
                            type="submit"
                            className={`size-4 rounded border ${
                              it.resolved
                                ? "border-grass bg-grass text-white"
                                : "border-line-strong bg-surface"
                            } grid place-items-center font-mono text-[10px]`}
                            title={it.resolved ? "Mark open" : "Mark done"}
                          >
                            {it.resolved ? "✓" : ""}
                          </button>
                        </form>
                      </td>
                    </>
                  )}
                  <td className="px-3 py-2.5 font-mono text-[11px] text-ink-faint">
                    {it.added_by ?? DASH}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <form action={removeListItem.bind(null, it.id)}>
                      <button
                        type="submit"
                        className="font-mono text-[11px] text-ink-faint opacity-0 transition-opacity group-hover:opacity-100 hover:text-rust"
                      >
                        Remove
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
