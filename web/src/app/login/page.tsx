"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [msg, setMsg] = useState("");

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        shouldCreateUser: false, // signups disabled — allowlisted users only
      },
    });
    if (error) {
      setState("error");
      setMsg(
        error.message.toLowerCase().includes("signups")
          ? "That email isn't on the access list. Ask Nick to add you."
          : error.message,
      );
    } else {
      setState("sent");
    }
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Brand panel */}
      <div className="blueprint-grid relative hidden flex-col justify-between border-r border-line bg-surface p-12 lg:flex">
        <div className="flex items-center gap-2.5">
          <span className="grid size-7 place-items-center rounded-[var(--radius)] bg-blueprint font-mono text-xs font-bold text-white">
            FT
          </span>
          <span className="font-mono text-sm font-semibold tracking-wide">
            FIELD TERMINAL
          </span>
        </div>

        <div className="max-w-md">
          <div className="label mb-4">Texas TABS · Daily intelligence</div>
          <h1 className="font-mono text-3xl font-semibold leading-[1.15] text-ink">
            Every commercial construction project in Texas,
            <span className="text-blueprint"> watched daily.</span>
          </h1>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-ink-soft">
            New filings, status changes, and the owners, tenants, and architects
            behind them — read off the public record so your team doesn&apos;t
            have to.
          </p>
        </div>

        <div className="flex gap-8 font-mono text-xs text-ink-faint">
          <div>
            <div className="text-lg font-semibold text-ink">95,877</div>
            projects tracked
          </div>
          <div>
            <div className="text-lg font-semibold text-ink">73,490</div>
            companies mapped
          </div>
          <div>
            <div className="text-lg font-semibold text-ink">FY23–26</div>
            36-month history
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-paper px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <span className="font-mono text-sm font-semibold tracking-wide">
              FIELD TERMINAL
            </span>
          </div>

          {state === "sent" ? (
            <div className="rounded-[var(--radius)] border border-grass/30 bg-grass-wash p-5">
              <div className="label mb-1 !text-grass">Check your email</div>
              <p className="text-sm text-ink">
                A sign-in link is on its way to{" "}
                <span className="font-mono font-medium">{email}</span>. Open it
                on this device.
              </p>
            </div>
          ) : (
            <form onSubmit={sendLink}>
              <div className="label mb-2">Sign in</div>
              <h2 className="mb-1 text-xl font-semibold text-ink">
                Access the terminal
              </h2>
              <p className="mb-6 text-sm text-ink-soft">
                Enter your work email — we&apos;ll send a one-time link. No
                password.
              </p>

              <label className="label mb-1.5 block" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full rounded-[var(--radius)] border border-line-strong bg-surface px-3 py-2.5 font-mono text-sm text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-blueprint focus:ring-2 focus:ring-blueprint/15"
              />

              {state === "error" && (
                <p className="mt-2 text-xs text-rust">{msg}</p>
              )}

              <button
                type="submit"
                disabled={state === "sending"}
                className="mt-4 w-full rounded-[var(--radius)] bg-blueprint px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blueprint-bright disabled:opacity-60"
              >
                {state === "sending" ? "Sending…" : "Send sign-in link"}
              </button>

              <p className="mt-4 font-mono text-[11px] leading-relaxed text-ink-faint">
                Access is limited to approved team members.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
