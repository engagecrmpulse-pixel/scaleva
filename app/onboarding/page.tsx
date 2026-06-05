"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card";

const INDUSTRIES = [
  "Retail",
  "Restaurant / Food",
  "Health & Wellness",
  "Beauty & Salon",
  "Professional Services",
  "Fitness",
  "Home Services",
  "Other",
];

const VOICES = ["Friendly", "Professional", "Playful", "Concise", "Warm"];

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [industry, setIndustry] = useState(INDUSTRIES[0]);
  const [voice, setVoice] = useState(VOICES[0]);
  const [goals, setGoals] = useState("");
  const [dataSource, setDataSource] = useState("manual");

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

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { error } = await supabase.from("businesses").insert({
      owner_id: user.id,
      name,
      industry,
      voice,
      goals,
      data_source: dataSource,
      config: { autopilot: false },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">Loading…</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Set up your business</CardTitle>
          <p className="mt-1 text-sm text-gray-500">
            Tell Scaleva about your business so it can write outreach that sounds
            like you.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Business name"
              name="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                Industry
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
              >
                {INDUSTRIES.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                Brand voice
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                value={voice}
                onChange={(e) => setVoice(e.target.value)}
              >
                {VOICES.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="goals"
                className="text-sm font-medium text-gray-700"
              >
                Outreach goals
              </label>
              <textarea
                id="goals"
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                placeholder="e.g. Re-engage customers who haven't purchased in 60 days and promote our loyalty program."
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                Customer data source
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                value={dataSource}
                onChange={(e) => setDataSource(e.target.value)}
              >
                <option value="manual">Manual entry</option>
                <option value="csv">CSV upload</option>
                <option value="square">Square</option>
                <option value="shopify">Shopify</option>
              </select>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" disabled={loading} className="mt-2 w-full">
              {loading ? "Saving…" : "Finish setup"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
