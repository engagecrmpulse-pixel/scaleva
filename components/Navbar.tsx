"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/Button";

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
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-base font-semibold tracking-tight text-gray-900">
            Scaleva
          </Link>
          <nav className="hidden items-center gap-4 text-sm text-gray-500 sm:flex">
            <Link href="/dashboard" className="transition-colors hover:text-gray-900">
              Dashboard
            </Link>
            {isAdmin && (
              <Link href="/admin" className="transition-colors hover:text-gray-900">
                Admin
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {email && (
            <span className="hidden text-xs text-gray-400 sm:inline">{email}</span>
          )}
          <Button variant="secondary" size="sm" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}
