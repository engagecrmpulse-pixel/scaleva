import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: businesses } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);

  const businessId = businesses?.[0]?.id;
  if (!businessId) {
    return NextResponse.json({ notifications: [] });
  }

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(15);

  return NextResponse.json({ notifications: notifications ?? [] });
}

export async function PATCH(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { id?: string; markAll?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
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

  if (body.markAll) {
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("business_id", businessId);
    return NextResponse.json({ ok: true });
  }

  if (body.id) {
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", body.id)
      .eq("business_id", businessId);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "id or markAll required" }, { status: 400 });
}
