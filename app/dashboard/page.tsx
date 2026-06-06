import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/Navbar";
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

  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();

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
    <div className="min-h-screen bg-gray-50">
      <Navbar email={user.email} />
      <DashboardClient
        businessId={business.id}
        businessName={business.name}
        industry={business.industry}
        voice={business.voice}
        initialAutopilot={business.config?.autopilot ?? false}
        config={business.config}
        initialCustomers={customerList}
        initialMessages={messageList}
      />
    </div>
  );
}
