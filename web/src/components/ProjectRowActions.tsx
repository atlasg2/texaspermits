"use client";

import { FormEvent, useRef, useState, useTransition } from "react";
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
  const dialog = useRef<HTMLDialogElement>(null);
  const [pending, start] = useTransition();
  const [options, setOptions] = useState(lists);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");

  function close() {
    dialog.current?.close();
  }

  function add(list: ProjectListOption) {
    start(async () => {
      setError("");
      try {
        await addProjectToList(list.id, projectNumber);
        setMessage(`Added to ${list.name}`);
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
        setName("");
        setCreating(false);
        setMessage(`Added to ${list.name}`);
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
        close();
        router.refresh();
      } catch {
        setError("Could not update this view.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        aria-label="Project actions"
        onClick={() => dialog.current?.showModal()}
        className="grid size-7 place-items-center rounded-md border border-transparent text-base leading-none text-ink-faint hover:border-line-strong hover:bg-surface hover:text-ink"
      >
        •••
      </button>
      <dialog
        ref={dialog}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
        className="m-auto w-72 rounded-lg border border-line-strong bg-surface p-0 text-left text-ink shadow-xl backdrop:bg-ink/30"
      >
        <div className="flex items-center justify-between border-b border-line px-3 py-2.5">
          <span className="label">Project actions</span>
          <button
            type="button"
            onClick={close}
            className="grid size-6 place-items-center rounded text-ink-faint hover:bg-surface-2 hover:text-ink"
            aria-label="Close actions"
          >
            ×
          </button>
        </div>
        <div className="p-2">
        <div className="label px-1 pb-1.5">Add to list</div>
        <div className="max-h-40 overflow-y-auto">
          {options.map((list) => (
            <button
              key={list.id}
              type="button"
              disabled={pending}
              onClick={() => add(list)}
              className="block w-full rounded px-2 py-1.5 text-left text-[13px] text-ink hover:bg-blueprint-wash hover:text-blueprint disabled:opacity-50"
            >
              {list.name}
            </button>
          ))}
        </div>

        {creating ? (
          <form onSubmit={create} className="mt-1 border-t border-line pt-2">
            <input
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={60}
              placeholder="New list name"
              className="h-8 w-full rounded-md border border-line-strong bg-surface px-2 text-[13px] text-ink outline-none focus:border-blueprint"
            />
            <div className="mt-1.5 flex justify-end gap-1">
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="px-2 py-1 text-[11px] text-ink-faint hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending || !name.trim()}
                className="rounded bg-blueprint px-2 py-1 text-[11px] font-medium text-white disabled:opacity-50"
              >
                Create & add
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="mt-1 block w-full border-t border-line px-2 pt-2 pb-1 text-left text-[12px] font-medium text-blueprint hover:text-blueprint-bright"
          >
            + Create new list
          </button>
        )}

        {message && (
          <div className="mt-1 rounded bg-grass-wash px-2 py-1.5 text-[11px] text-grass">
            {message}
          </div>
        )}
        {error && (
          <div className="mt-1 rounded bg-rust-wash px-2 py-1.5 text-[11px] text-rust">
            {error}
          </div>
        )}

        <button
          type="button"
          disabled={pending}
          onClick={() => setHidden(!hidden)}
          className="mt-2 block w-full border-t border-line px-2 pt-2 pb-1 text-left text-[12px] text-ink-soft hover:text-rust disabled:opacity-50"
        >
          {hidden ? "Restore to this view" : "Hide from this view"}
        </button>
        </div>
      </dialog>
    </>
  );
}
