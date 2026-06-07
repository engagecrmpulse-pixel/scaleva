"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Wizard } from "./Wizard";

export default function OnboardingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  // If the business is already set up, skip straight to the dashboard.
  // This must never hang: any error (or a slow request) falls through to
  // showing the wizard so the user is never stuck on a loading screen.
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
          return; // keep showing "Loading…" while we navigate away
        }
      } catch {
        // Ignore and fall through to the wizard.
      }
      if (active) setChecking(false);
    }

    // Safety net: never leave the user stuck on the loading screen.
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
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-indigo-600" aria-hidden />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center px-6 py-4">
          <span className="text-sm font-semibold text-gray-900">Scaleva</span>
        </div>
      </div>
      <Wizard />
    </main>
  );
}
