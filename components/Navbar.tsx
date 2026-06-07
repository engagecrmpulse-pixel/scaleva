"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface NavbarProps {
  email?: string | null;
  isAdmin?: boolean;
}

export function Navbar({ email, isAdmin }: NavbarProps) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="font-heading text-sm font-semibold tracking-tight text-content"
          >
            Scaleva
          </Link>
          <nav className="hidden items-center gap-4 text-sm text-content-muted sm:flex">
            <Link href="/dashboard" className="transition-colors hover:text-content">
              Dashboard
            </Link>
            {isAdmin && (
              <Link href="/admin" className="transition-colors hover:text-content">
                Admin
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {email && (
            <span className="hidden text-xs text-content-muted sm:inline">{email}</span>
          )}
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex h-8 items-center rounded-btn border border-line px-3 text-xs font-medium text-content-muted transition-colors hover:border-content-muted hover:text-content"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
