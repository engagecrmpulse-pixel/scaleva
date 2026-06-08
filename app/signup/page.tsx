"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    if (data.session) {
      router.push("/onboarding");
      router.refresh();
      return;
    }

    setMessage(
      "Check your email to confirm your account, then log in to get started."
    );
  }

  const inputClass = (hasError: boolean) =>
    `w-full rounded-btn border bg-base px-3 py-2.5 text-sm text-content placeholder:text-content-muted/60 focus:outline-none focus:ring-1 transition-colors ${
      hasError
        ? "border-danger focus:border-danger focus:ring-danger"
        : "border-line focus:border-accent focus:ring-accent"
    }`;

  return (
    <div className="grid min-h-screen lg:grid-cols-[420px_1fr]">
      {/* Left panel */}
      <div className="hidden flex-col bg-base px-10 py-10 lg:flex border-r border-line">
        <Link
          href="/"
          className="font-heading text-sm font-semibold tracking-tight text-content"
        >
          Scaleva
        </Link>
        <div className="mt-auto pb-16">
          <p className="font-heading text-xl font-semibold leading-snug tracking-[-0.02em] text-content">
            Your customers forget you exist. Scaleva fixes that.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex items-center justify-center bg-surface px-6 py-16">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="font-heading text-sm font-semibold tracking-tight text-content lg:hidden"
          >
            Scaleva
          </Link>

          <h1 className="mt-8 font-heading text-2xl font-semibold tracking-[-0.02em] text-content lg:mt-0">
            Create your account
          </h1>
          <p className="mt-1.5 text-sm text-content-muted">
            Free to start. No credit card required.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-xs font-medium text-content-muted"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                name="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass(!!error)}
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-xs font-medium text-content-muted"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                name="password"
                autoComplete="new-password"
                minLength={6}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass(!!error)}
                placeholder="Min. 6 characters"
              />
            </div>

            {error && <p className="text-xs text-danger">{error}</p>}

            {message && (
              <p className="rounded-btn border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5 text-xs text-emerald-400">
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !!message}
              className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-btn bg-accent text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span
                    className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                    aria-hidden
                  />
                  Creating account...
                </>
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-content-muted">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-content transition-colors hover:text-accent"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
