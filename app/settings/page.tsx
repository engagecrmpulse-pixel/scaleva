import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SettingsClient } from "./SettingsClient";
import type { Business, Subscription } from "@/utils/database.types";

export default async function SettingsPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: businesses } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);

  const business = businesses?.[0] as Business | undefined;

  if (!business) {
    redirect("/onboarding");
  }

  const { data: subscriptionData } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("business_id", business.id)
    .maybeSingle();

  const subscription = subscriptionData as Subscription | null;

  return (
    <SettingsClient
      business={business}
      subscription={subscription}
      userEmail={user.email ?? ""}
    />
  );
}
