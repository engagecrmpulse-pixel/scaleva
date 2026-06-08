"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Wizard } from "./Wizard";
import type { WizardState } from "./types";

function OnboardingInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [checking, setChecking] = useState(true);
  const [initialStep, setInitialStep] = useState(1);
  const [initialState, setInitialState] = useState<Partial<WizardState>>({});

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    async function check() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!active) return;
        if (!user) { router.replace("/login"); return; }

        const { data } = await supabase
          .from("businesses")
          .select("id")
          .eq("owner_id", user.id)
          .limit(1);

        if (!active) return;
        if (data && data.length > 0) { router.replace("/dashboard"); return; }

        const oauthConnected = searchParams.get("oauth_connected");
        if (oauthConnected) {
          try {
            const res = await fetch("/api/oauth/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ provider: oauthConnected }),
            });
            const data = (await res.json()) as { customers?: unknown[]; tokenValid?: boolean };
            if (active) {
              setInitialState({
                dataSource: oauthConnected as WizardState["dataSource"],
                connected: true,
                customers: (data.customers ?? []) as WizardState["customers"],
              });
              setInitialStep(3);
            }
          } catch {
            if (active) {
              setInitialState({ dataSource: oauthConnected as WizardState["dataSource"], connected: true });
              setInitialStep(3);
            }
          }
        }
      } catch {
        // fall through to wizard
      }
      if (active) setChecking(false);
    }

    const timeout = setTimeout(() => { if (active) setChecking(false); }, 5000);
    void check();
    return () => { active = false; clearTimeout(timeout); };
  }, [router, searchParams]);

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-base">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-accent" aria-hidden />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-base">
      <div className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-2xl items-center px-6 py-4">
          <span className="font-heading text-sm font-semibold tracking-tight text-content">Scaleva</span>
        </div>
      </div>
      <Wizard initialStep={initialStep} initialState={initialState} />
    </main>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-base">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-accent" aria-hidden />
        </main>
      }
    >
      <OnboardingInner />
    </Suspense>
  );
}
