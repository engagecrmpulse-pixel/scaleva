import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "./DashboardClient";
import type { Customer, Message, MenuItem, MenuItemMention, Notification, Subscription } from "@/utils/database.types";

export default async function DashboardPage() {
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

  const business = businesses?.[0];

  if (!business) {
    redirect("/onboarding");
  }

  const [
    { data: customers },
    { data: messages },
    { data: notifications },
    { data: subscriptionData },
    { data: menuItemsData },
    { data: menuMentionsData },
  ] = await Promise.all([
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
    supabase
      .from("notifications")
      .select("*")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })
      .limit(15),
    supabase
      .from("subscriptions")
      .select("*")
      .eq("business_id", business.id)
      .maybeSingle(),
    supabase
      .from("menu_items")
      .select("*")
      .eq("business_id", business.id)
      .eq("active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("menu_item_mentions")
      .select("*")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })
      .limit(500),
  ]);

  const subscription = (subscriptionData ?? null) as Subscription | null;
  const isPastDue = subscription?.status === "past_due";

  return (
    <DashboardClient
      businessId={business.id}
      businessName={business.name}
      industry={business.industry}
      voice={business.voice}
      userEmail={user.email}
      initialAutopilot={business.config?.autopilot ?? false}
      config={business.config ?? {}}
      initialCustomers={(customers ?? []) as Customer[]}
      initialMessages={(messages ?? []) as Message[]}
      initialNotifications={(notifications ?? []) as Notification[]}
      initialMenuItems={(menuItemsData ?? []) as MenuItem[]}
      initialMenuMentions={(menuMentionsData ?? []) as MenuItemMention[]}
      subscription={subscription}
      isPastDue={isPastDue}
    />
  );
}
