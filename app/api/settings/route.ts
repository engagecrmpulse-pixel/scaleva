import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { BusinessConfig } from "@/utils/database.types";

export async function PATCH(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    name?: string;
    industry?: string;
    voice?: string;
    goals?: string;
    customInstructions?: string;
    config?: Partial<BusinessConfig>;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, config")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);

  const business = businesses?.[0];
  if (!business) {
    return NextResponse.json({ error: "No business found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.industry !== undefined) updates.industry = body.industry;
  if (body.voice !== undefined) updates.voice = body.voice;
  if (body.goals !== undefined) updates.goals = body.goals;

  if (body.config !== undefined || body.customInstructions !== undefined) {
    const existingConfig: BusinessConfig = (business.config as BusinessConfig) ?? {};
    const newConfig: BusinessConfig = {
      ...existingConfig,
      ...body.config,
    };
    if (body.customInstructions !== undefined) {
      newConfig.customInstructions = body.customInstructions;
    }
    updates.config = newConfig;
  }

  const { data: updated, error } = await supabase
    .from("businesses")
    .update(updates)
    .eq("id", business.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ business: updated });
}

export async function DELETE(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({})) as { confirm?: string };
  if (body.confirm !== "DELETE") {
    return NextResponse.json(
      { error: "Send { confirm: 'DELETE' } to confirm" },
      { status: 400 }
    );
  }

  await supabase.from("businesses").delete().eq("owner_id", user.id);
  await supabase.auth.signOut();

  return NextResponse.json({ ok: true });
}
