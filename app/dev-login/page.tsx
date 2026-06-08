"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function DevLoginPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/dev/bypass", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    const data = await res.json() as { ok?: boolean; error?: string };
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Failed");
      setCode("");
      inputRef.current?.focus();
      return;
    }

    router.push("/onboarding");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-base px-6">
      <div className="w-full max-w-xs">
        <div className="mb-6 flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded border border-line text-xs text-content-muted">
            ⚡
          </span>
          <span className="font-heading text-xs font-semibold uppercase tracking-widest text-content-muted">
            Dev bypass
          </span>
        </div>

        <h1 className="font-heading text-2xl font-semibold tracking-tight text-content">
          Enter bypass code
        </h1>
        <p className="mt-1.5 text-sm text-content-muted">
          Set <code className="rounded bg-surface px-1 text-xs text-content">DEV_BYPASS_CODE</code>,{" "}
          <code className="rounded bg-surface px-1 text-xs text-content">DEV_EMAIL</code>, and{" "}
          <code className="rounded bg-surface px-1 text-xs text-content">DEV_PASSWORD</code>{" "}
          in <code className="rounded bg-surface px-1 text-xs text-content">.env.local</code>.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <input
            ref={inputRef}
            type="text"
            autoFocus
            autoComplete="off"
            placeholder="bypass code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full rounded-btn border border-line bg-surface px-3 py-2.5 font-mono text-sm text-content placeholder:text-content-muted/40 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />

          {error && (
            <p className="text-xs text-danger">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-btn bg-accent text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Signing in…
              </>
            ) : (
              "Enter"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-content-muted">
          Only available in development. Not shown in production.
        </p>
      </div>
    </div>
  );
}
