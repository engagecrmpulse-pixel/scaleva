"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Wizard } from "./Wizard";

export default function OnboardingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    async function check() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!active) return;
        if (!user) {
          router.replace("/login");
          return;
        }

        const { data } = await supabase
          .from("businesses")
          .select("id")
          .eq("owner_id", user.id)
          .limit(1);

        if (!active) return;
        if (data && data.length > 0) {
          router.replace("/dashboard");
          return;
        }
      } catch {
        // fall through to wizard
      }
      if (active) setChecking(false);
    }

    const timeout = setTimeout(() => {
      if (active) setChecking(false);
    }, 5000);

    void check();

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [router]);

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-base">
        <span
          className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-accent"
          aria-hidden
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-base">
      <div className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-2xl items-center px-6 py-4">
          <span className="font-heading text-sm font-semibold tracking-tight text-content">
            Scaleva
          </span>
        </div>
      </div>
      <Wizard />
    </main>
  );
}
