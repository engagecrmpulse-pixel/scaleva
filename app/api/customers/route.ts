import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sanitizePhone, sanitizeText, sanitizeEmail } from "@/lib/sanitize";
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
    consent_given?: boolean;
    force?: boolean; // allow update even if duplicate
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

  // ── Sanitize inputs ───────────────────────────────────────────────────────
  const cleanName = sanitizeText(body.name.trim()).slice(0, 100);
  const cleanPhone = body.phone ? sanitizePhone(body.phone) : null;
  const cleanEmail = body.email ? sanitizeEmail(body.email) : null;

  // ── Duplicate phone check ─────────────────────────────────────────────────
  if (cleanPhone && !body.force) {
    const digits = cleanPhone.replace(/\D/g, "");
    const { data: existingCustomers } = await supabase
      .from("customers")
      .select("id, name, phone")
      .eq("business_id", businessId)
      .not("phone", "is", null);

    const duplicate = existingCustomers?.find((c) => {
      if (!c.phone) return false;
      const existingDigits = c.phone.replace(/\D/g, "");
      return existingDigits === digits || existingDigits === digits.replace(/^1/, "");
    });

    if (duplicate) {
      return NextResponse.json(
        {
          error: `A customer with this phone number already exists: ${duplicate.name}. Do you want to update their record instead?`,
          code: "DUPLICATE_PHONE",
          existingCustomerId: duplicate.id,
          existingCustomerName: duplicate.name,
        },
        { status: 409 }
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
      name: cleanName,
      phone: cleanPhone,
      email: cleanEmail,
      last_purchase: body.last_purchase || null,
      spend_history: spendHistory,
      consent_given: body.consent_given ?? false,
      consent_date: body.consent_given ? new Date().toISOString() : null,
      ltv: spendAmount,
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
