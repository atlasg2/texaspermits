"use client";

import { FormEvent, useEffect, useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addProjectToList,
  createListAndAddProject,
  setProjectViewHidden,
} from "@/lib/actions";

export type ProjectListOption = {
  id: number;
  name: string;
};

const MENU_WIDTH = 268;

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function EyeIcon({ off }: { off: boolean }) {
  return off ? (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c7 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19M6.6 6.6A18.5 18.5 0 0 0 2 12s3 8 10 8a9.1 9.1 0 0 0 5.4-1.6M1 1l22 22M14.12 14.12A3 3 0 1 1 9.88 9.88" />
    </svg>
  ) : (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2 12s3-8 10-8 10 8 10 8-3 8-10 8-10-8-10-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function ProjectRowActions({
  projectNumber,
  viewKey,
  lists,
  hidden,
}: {
  projectNumber: string;
  viewKey: string;
  lists: ProjectListOption[];
  hidden: boolean;
}) {
  const router = useRouter();
  const popId = useId().replace(/:/g, "");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [options, setOptions] = useState(lists);
  const [added, setAdded] = useState<Set<number>>(new Set());
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");

  // Anchor the top-layer popover under the trigger, flipping up near the
  // viewport bottom. Positioned in `beforetoggle` so it never flashes centered.
  useEffect(() => {
    const el = popRef.current;
    const trigger = triggerRef.current;
    if (!el || !trigger) return;

    const onToggle = (event: Event) => {
      const e = event as ToggleEvent;
      if (e.newState === "open") {
        const r = trigger.getBoundingClientRect();
        const left = Math.max(8, Math.min(r.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8));
        const estHeight = 270;
        const below = r.bottom + 6;
        const top = below + estHeight > window.innerHeight - 8
          ? Math.max(8, r.top - estHeight - 6)
          : below;
        el.style.left = `${left}px`;
        el.style.top = `${top}px`;
        setError("");
        setOpen(true);
      } else {
        setOpen(false);
        setCreating(false);
      }
    };

    el.addEventListener("beforetoggle", onToggle);
    return () => el.removeEventListener("beforetoggle", onToggle);
  }, []);

  function add(list: ProjectListOption) {
    start(async () => {
      setError("");
      try {
        await addProjectToList(list.id, projectNumber);
        setAdded((prev) => new Set(prev).add(list.id));
      } catch {
        setError("Could not add this project.");
      }
    });
  }

  function create(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    start(async () => {
      setError("");
      try {
        const list = await createListAndAddProject(name, projectNumber);
        setOptions((current) =>
          current.some((option) => option.id === list.id)
            ? current
            : [...current, list],
        );
        setAdded((prev) => new Set(prev).add(list.id));
        setName("");
        setCreating(false);
      } catch {
        setError("Could not create that list.");
      }
    });
  }

  function setHidden(nextHidden: boolean) {
    start(async () => {
      setError("");
      try {
        await setProjectViewHidden(viewKey, projectNumber, nextHidden);
        popRef.current?.hidePopover();
        router.refresh();
      } catch {
        setError("Could not update this view.");
      }
    });
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        popoverTarget={popId}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[12px] font-medium transition-colors ${
          open
            ? "border-blueprint bg-blueprint-wash text-blueprint"
            : "border-line-strong bg-surface text-ink-soft hover:border-blueprint hover:text-blueprint"
        }`}
      >
        Actions
        <ChevronIcon open={open} />
      </button>

      <div
        ref={popRef}
        id={popId}
        popover="auto"
        style={{ position: "fixed", inset: "auto", margin: 0 }}
        className="actions-menu w-[268px] rounded-xl border border-line-strong bg-surface text-left text-ink shadow-2xl shadow-ink/20"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2.5">
          <span className="label !text-ink-soft">Actions</span>
          <span className="tnum text-[11px] text-ink-faint">#{projectNumber}</span>
        </div>

        <div className="p-1.5">
          {/* Add to list */}
          <div className="label px-2 pt-1 pb-1.5">Add to list</div>
          <div className="max-h-44 space-y-0.5 overflow-y-auto">
            {options.map((list) => {
              const isAdded = added.has(list.id);
              return (
                <button
                  key={list.id}
                  type="button"
                  disabled={pending || isAdded}
                  onClick={() => add(list)}
                  className={`group flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-[13px] transition-colors disabled:cursor-default ${
                    isAdded
                      ? "text-grass"
                      : "text-ink hover:bg-blueprint-wash hover:text-blueprint"
                  }`}
                >
                  <span className={isAdded ? "text-grass" : "text-ink-faint group-hover:text-blueprint"}>
                    {isAdded ? <CheckIcon /> : <ListIcon />}
                  </span>
                  <span className="flex-1 truncate font-medium">{list.name}</span>
                  <span className="text-[11px] font-medium">
                    {isAdded ? "Added" : <span className="opacity-0 transition-opacity group-hover:opacity-100"><PlusIcon /></span>}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Create new list */}
          {creating ? (
            <form onSubmit={create} className="mt-1 px-1 pt-1">
              <input
                autoFocus
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={60}
                placeholder="New list name…"
                className="h-9 w-full rounded-lg border border-line-strong bg-paper px-2.5 text-[13px] text-ink outline-none transition-colors focus:border-blueprint focus:ring-2 focus:ring-blueprint/15"
              />
              <div className="mt-1.5 flex justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => setCreating(false)}
                  className="rounded-md px-2.5 py-1.5 text-[12px] font-medium text-ink-faint hover:text-ink"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending || !name.trim()}
                  className="rounded-md bg-blueprint px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-blueprint-bright disabled:opacity-50"
                >
                  Create &amp; add
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="mt-0.5 flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-[13px] font-medium text-blueprint transition-colors hover:bg-blueprint-wash"
            >
              <span className="grid size-[14px] place-items-center"><PlusIcon /></span>
              New list
            </button>
          )}

          {error && (
            <div className="mx-1 mt-1.5 rounded-md bg-rust-wash px-2.5 py-1.5 text-[11px] text-rust">
              {error}
            </div>
          )}

          {/* Hide / restore */}
          <div className="my-1.5 border-t border-line" />
          <button
            type="button"
            disabled={pending}
            onClick={() => setHidden(!hidden)}
            className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-[13px] text-ink-soft transition-colors hover:bg-rust-wash hover:text-rust disabled:opacity-50"
          >
            <span className="text-ink-faint"><EyeIcon off={!hidden} /></span>
            {hidden ? "Restore to this view" : "Hide from this view"}
          </button>
        </div>
      </div>
    </>
  );
}
