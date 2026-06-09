import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function getBusinessId(supabase: ReturnType<typeof createClient>): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();
  return data?.id ?? null;
}

export async function GET() {
  const supabase = createClient();
  const businessId = await getBusinessId(supabase);
  if (!businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("menu_items")
    .select("*")
    .eq("business_id", businessId)
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const businessId = await getBusinessId(supabase);
  if (!businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as {
    name: string;
    category?: string;
    price?: number;
    description?: string;
    sort_order?: number;
  };

  if (!body.name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const { data, error } = await supabase
    .from("menu_items")
    .insert({
      business_id: businessId,
      name: body.name.trim(),
      category: body.category ?? null,
      price: body.price ?? null,
      description: body.description?.trim() ?? null,
      sort_order: body.sort_order ?? 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}

export async function PATCH(request: NextRequest) {
  const supabase = createClient();
  const businessId = await getBusinessId(supabase);
  if (!businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as {
    id: string;
    name?: string;
    category?: string;
    price?: number | null;
    description?: string | null;
    active?: boolean;
    sort_order?: number;
  };

  if (!body.id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const { data, error } = await supabase
    .from("menu_items")
    .update({
      ...(body.name !== undefined && { name: body.name.trim() }),
      ...(body.category !== undefined && { category: body.category }),
      ...(body.price !== undefined && { price: body.price }),
      ...(body.description !== undefined && { description: body.description?.trim() ?? null }),
      ...(body.active !== undefined && { active: body.active }),
      ...(body.sort_order !== undefined && { sort_order: body.sort_order }),
    })
    .eq("id", body.id)
    .eq("business_id", businessId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}

export async function DELETE(request: NextRequest) {
  const supabase = createClient();
  const businessId = await getBusinessId(supabase);
  if (!businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const { error } = await supabase
    .from("menu_items")
    .update({ active: false })
    .eq("id", id)
    .eq("business_id", businessId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
