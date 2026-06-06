"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Wizard } from "./Wizard";

export default function OnboardingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  // If the business is already set up, skip onboarding.
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("businesses")
      .select("id")
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          router.replace("/dashboard");
        } else {
          setChecking(false);
        }
      });
  }, [router]);

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">Loading…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center px-4 py-3">
          <span className="text-lg font-bold text-brand-700">Scaleva</span>
        </div>
      </div>
      <Wizard />
    </main>
  );
}
