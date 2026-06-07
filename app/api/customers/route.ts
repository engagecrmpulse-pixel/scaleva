import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { SpendHistoryEntry } from "@/utils/database.types";

export async function POST(request: NextRequest) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    name?: string;
    phone?: string;
    email?: string;
    last_purchase?: string;
    spend_amount?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const { data: businesses } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);

  const businessId = businesses?.[0]?.id;
  if (!businessId) {
    return NextResponse.json({ error: "No business found" }, { status: 404 });
  }

  // ── Enforce customer limit ────────────────────────────────────────────────
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("customer_limit")
    .eq("business_id", businessId)
    .maybeSingle();

  if (sub?.customer_limit !== null && sub?.customer_limit !== undefined) {
    const { count } = await supabase
      .from("customers")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId);

    if ((count ?? 0) >= sub.customer_limit) {
      return NextResponse.json(
        { error: "Customer limit reached. Upgrade your plan." },
        { status: 429 }
      );
    }
  }

  const spendAmount = body.spend_amount ?? 0;
  const spendHistory: SpendHistoryEntry[] =
    spendAmount > 0
      ? [{ date: body.last_purchase || new Date().toISOString(), amount: spendAmount }]
      : [];

  const { data: customer, error } = await supabase
    .from("customers")
    .insert({
      business_id: businessId,
      name: body.name.trim(),
      phone: body.phone?.trim() || null,
      email: body.email?.trim() || null,
      last_purchase: body.last_purchase || null,
      spend_history: spendHistory,
    })
    .select()
    .single();

  if (error || !customer) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to add customer" },
      { status: 500 }
    );
  }

  return NextResponse.json({ customer });
}
