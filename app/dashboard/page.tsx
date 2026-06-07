import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "./DashboardClient";
import type { Customer, Message } from "@/utils/database.types";

export default async function DashboardPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Pick the most recent business. We intentionally avoid .maybeSingle() here:
  // it throws when more than one row matches, which (if an account ever ends up
  // with multiple businesses) would make this redirect to /onboarding and cause
  // a /dashboard <-> /onboarding redirect loop.
  const { data: businesses } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);

  const business = businesses?.[0];

  if (!business) {
    redirect("/onboarding");
  }

  const [{ data: customers }, { data: messages }] = await Promise.all([
    supabase
      .from("customers")
      .select("*")
      .eq("business_id", business.id)
      .order("next_contact_date", { ascending: true }),
    supabase
      .from("messages")
      .select("*")
      .eq("business_id", business.id)
      .order("sent_at", { ascending: false })
      .limit(50),
  ]);

  const customerList: Customer[] = customers ?? [];
  const messageList: Message[] = messages ?? [];

  return (
    <DashboardClient
      businessId={business.id}
      businessName={business.name}
      industry={business.industry}
      voice={business.voice}
      userEmail={user.email}
      initialAutopilot={business.config?.autopilot ?? false}
      config={business.config ?? {}}
      initialCustomers={customerList}
      initialMessages={messageList}
    />
  );
}
