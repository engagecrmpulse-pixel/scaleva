import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { customerId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.customerId) {
    return NextResponse.json({ error: "customerId is required" }, { status: 400 });
  }

  const { data: customer } = await supabase
    .from("customers")
    .select("id, business_id, return_visit_count, name")
    .eq("id", body.customerId)
    .maybeSingle();

  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("id", customer.business_id)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!business) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const newCount = (customer.return_visit_count ?? 0) + 1;
  const today = new Date().toISOString();

  const { data: updated, error } = await supabase
    .from("customers")
    .update({
      return_visit_count: newCount,
      last_return_date: today,
    })
    .eq("id", body.customerId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("interactions").insert({
    customer_id: body.customerId,
    type: "return_visit",
    notes: `Marked as returned (visit #${newCount})`,
  });

  return NextResponse.json({ customer: updated });
}
