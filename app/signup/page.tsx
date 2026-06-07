"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldError, setFieldError] = useState<{ email?: string; password?: string }>({});
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const errs: { email?: string; password?: string } = {};
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = "Enter a valid email address.";
    }
    if (password.length < 8) {
      errs.password = "Password must be at least 8 characters.";
    }
    setFieldError(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (!validate()) return;
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?type=signup` },
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    if (data.session) { router.push("/onboarding"); router.refresh(); return; }
    setMessage("Check your email to confirm your account, then log in to get started.");
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
            top: "-100px", right: "-150px",
            background: "radial-gradient(circle, rgba(99,102,241,0.6) 0%, transparent 70%)",
            filter: "blur(60px)",
            animation: "blob2 20s ease-in-out infinite",
          }}
        />
        <div
          className="absolute rounded-full opacity-15"
          style={{
            width: 400, height: 400,
            bottom: "-80px", left: "-80px",
            background: "radial-gradient(circle, rgba(167,139,250,0.5) 0%, transparent 70%)",
            filter: "blur(60px)",
            animation: "blob3 25s ease-in-out infinite",
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
        <Link href="/" className="mb-8 block">
          <span className="font-heading text-sm font-semibold tracking-tight text-white">Scaleva</span>
        </Link>

        <h1 className="font-heading text-2xl font-bold tracking-[-0.02em] text-white">Create your account</h1>
        <p className="mt-1.5 text-sm text-white/40">Free to start. No credit card required.</p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="mb-2 block text-xs font-medium text-white/40 uppercase tracking-wider">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setFieldError((p) => ({ ...p, email: undefined })); }}
              className={inputCls(!!fieldError.email)}
              placeholder="you@company.com"
            />
            {fieldError.email && <p className="mt-1.5 text-xs text-red-400">{fieldError.email}</p>}
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-xs font-medium text-white/40 uppercase tracking-wider">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setFieldError((p) => ({ ...p, password: undefined })); }}
              className={inputCls(!!fieldError.password)}
              placeholder="Min. 8 characters"
            />
            {fieldError.password && <p className="mt-1.5 text-xs text-red-400">{fieldError.password}</p>}
          </div>

          {error && (
            <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-xs text-red-400">{error}</p>
          )}

          {message && (
            <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5 text-xs text-emerald-400">{message}</p>
          )}

          <button
            type="submit"
            disabled={loading || !!message}
            className="btn-glow mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden />
                Creating account…
              </>
            ) : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white/30">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-400 transition-colors hover:text-blue-300">Log in</Link>
        </p>

        <p className="mt-4 text-center text-xs text-white/20">
          By signing up you agree to our{" "}
          <Link href="/terms" className="hover:text-white/40 transition-colors">Terms of Service</Link>
          {" "}and{" "}
          <Link href="/privacy" className="hover:text-white/40 transition-colors">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
