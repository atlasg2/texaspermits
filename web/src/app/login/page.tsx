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

  async function signInWithGoogle() {
    setState("sending");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    // On success the browser is redirected to Google; we only land here on error.
    if (error) {
      setState("error");
      setMsg(error.message);
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

              <button
                type="button"
                onClick={signInWithGoogle}
                disabled={state === "sending"}
                className="mb-5 flex w-full items-center justify-center gap-2.5 rounded-[var(--radius)] border border-line-strong bg-surface px-3 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-paper disabled:opacity-60"
              >
                <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.46 14.97.5 12 .5A11 11 0 0 0 2.18 6.94l3.66 2.84C6.71 6.68 9.14 4.75 12 4.75Z"
                  />
                </svg>
                Continue with Google
              </button>

              <div className="mb-5 flex items-center gap-3">
                <span className="h-px flex-1 bg-line" />
                <span className="label !text-ink-faint">or</span>
                <span className="h-px flex-1 bg-line" />
              </div>

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
