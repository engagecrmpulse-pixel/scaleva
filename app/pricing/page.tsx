import { createClient } from "@/lib/supabase/server";
import { PricingClient } from "./PricingClient";

export default async function PricingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let currentPlan: string | null = null;
  let isPastDue = false;

  if (user) {
    const { data: businesses } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);

    const businessId = businesses?.[0]?.id;
    if (businessId) {
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("plan, status")
        .eq("business_id", businessId)
        .maybeSingle();

      if (sub) {
        currentPlan = sub.plan;
        isPastDue = sub.status === "past_due";
      }
    }
  }

  return (
    <PricingClient currentPlan={currentPlan} isPastDue={isPastDue} />
  );
}
