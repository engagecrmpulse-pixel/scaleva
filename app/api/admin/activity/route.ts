import { NextResponse } from "next/server";
import { createClient as createServiceSupabase } from "@supabase/supabase-js";
import { createClient as createAuthClient } from "@/lib/supabase/server";

function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
}

function serviceClient() {
  return createServiceSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET() {
  const authClient = createAuthClient();
  const { data: { user } } = await authClient.auth.getUser();

  if (!user?.email || !getAdminEmails().includes(user.email.toLowerCase())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = serviceClient();

  const { data: messages } = await supabase
    .from("messages")
    .select("id, business_id, customer_id, content, sent_at, direction, status")
    .order("sent_at", { ascending: false })
    .limit(20);

  if (!messages?.length) {
    return NextResponse.json({ messages: [] });
  }

  const bizIds = Array.from(new Set(messages.map((m) => m.business_id)));
  const custIds = Array.from(new Set(messages.map((m) => m.customer_id)));

  const [{ data: businesses }, { data: customers }] = await Promise.all([
    supabase.from("businesses").select("id, name").in("id", bizIds),
    supabase.from("customers").select("id, name").in("id", custIds),
  ]);

  const bizMap = new Map((businesses ?? []).map((b: { id: string; name: string }) => [b.id, b.name]));
  const custMap = new Map((customers ?? []).map((c: { id: string; name: string }) => [c.id, c.name]));

  const enriched = messages.map((m) => ({
    id: m.id,
    business_id: m.business_id,
    businessName: bizMap.get(m.business_id) ?? "Unknown",
    customerName: custMap.get(m.customer_id) ?? "Unknown",
    content: m.content,
    sent_at: m.sent_at,
    direction: m.direction,
    status: m.status,
  }));

  return NextResponse.json({ messages: enriched });
}
