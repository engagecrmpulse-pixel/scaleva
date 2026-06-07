"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    router.push("/dashboard");
    router.refresh();
  }

  const inputCls = (err: boolean) =>
    `w-full rounded-xl border bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-1 transition-all ${
      err
        ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/30"
        : "border-white/10 focus:border-blue-500/60 focus:ring-blue-500/20"
    }`;

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-16"
      style={{ background: "#080b14" }}
    >
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute rounded-full opacity-20"
          style={{
            width: 600, height: 600,
            top: "-100px", left: "-100px",
            background: "radial-gradient(circle, rgba(99,102,241,0.6) 0%, transparent 70%)",
            filter: "blur(60px)",
            animation: "blob1 18s ease-in-out infinite",
          }}
        />
        <div
          className="absolute rounded-full opacity-15"
          style={{
            width: 400, height: 400,
            bottom: "-50px", right: "-50px",
            background: "radial-gradient(circle, rgba(59,130,246,0.5) 0%, transparent 70%)",
            filter: "blur(60px)",
            animation: "blob2 22s ease-in-out infinite",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%)",
          }}
        />
      </div>

      {/* Card */}
      <div
        className="relative w-full max-w-sm rounded-2xl border border-white/8 p-8"
        style={{
          background: "rgba(15,20,32,0.8)",
          backdropFilter: "blur(24px)",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 24px 60px rgba(0,0,0,0.6)",
          animation: "fadeInUp 0.6s ease both",
        }}
      >
        {/* Logo */}
        <Link href="/" className="mb-8 block">
          <span className="font-heading text-sm font-semibold tracking-tight text-white">Scaleva</span>
        </Link>

        <h1 className="font-heading text-2xl font-bold tracking-[-0.02em] text-white">Welcome back</h1>
        <p className="mt-1.5 text-sm text-white/40">Enter your credentials to continue.</p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <div>
            <label htmlFor="email" className="mb-2 block text-xs font-medium text-white/40 uppercase tracking-wider">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls(!!error)}
              placeholder="you@company.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-xs font-medium text-white/40 uppercase tracking-wider">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls(!!error)}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-xs text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-glow mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden />
                Logging in…
              </>
            ) : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white/30">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-blue-400 transition-colors hover:text-blue-300">
            Get started free
          </Link>
        </p>
      </div>
    </div>
  );
}
