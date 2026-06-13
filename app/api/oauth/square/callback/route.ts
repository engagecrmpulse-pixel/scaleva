import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { BusinessConfig } from "@/utils/database.types";

const SQUARE_VERSION = "2024-01-17";

interface SquareTokenResponse {
  access_token?: string;
  error?: string;
  message?: string;
}

interface SquareCustomer {
  id: string;
  given_name?: string;
  family_name?: string;
  phone_number?: string;
  email_address?: string;
  created_at?: string;
  birthday?: string;
}

interface SquareLineItem {
  name?: string;
  quantity?: string;
  total_money?: { amount?: number; currency?: string };
}

interface SquareOrder {
  id: string;
  customer_id?: string;
  created_at: string;
  total_money?: { amount?: number; currency?: string };
  line_items?: SquareLineItem[];
  location_id?: string;
}

interface SquareLocation {
  id: string;
  status?: string;
}

interface SquareCatalogObject {
  id: string;
  type: string;
  item_data?: {
    name?: string;
    category_id?: string;
    description?: string;
    variations?: Array<{
      item_variation_data?: {
        price_money?: { amount?: number; currency?: string };
      };
    }>;
  };
  category_data?: { name?: string };
}

function sanitizePhone(raw: string | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return raw;
}

function parseBirthday(raw: string | undefined): string | null {
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  if (/^\d{2}-\d{2}$/.test(raw)) return `2000-${raw}`;
  return null;
}

function cadenceDays(config: BusinessConfig): number {
  const c = (config.cadence as string | undefined) ?? "Weekly";
  if (c === "Daily") return 1;
  if (c.includes("3")) return 3;
  if (c === "Weekly") return 7;
  if (c.toLowerCase().includes("bi")) return 14;
  if (c === "Monthly") return 30;
  return 7;
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function fetchLocations(token: string): Promise<string[]> {
  try {
    const res = await fetch("https://connect.squareup.com/v2/locations", {
      headers: { Authorization: `Bearer ${token}`, "Square-Version": SQUARE_VERSION },
    });
    const data = await res.json();
    return ((data.locations as SquareLocation[]) ?? [])
      .filter((l) => l.status === "ACTIVE")
      .map((l) => l.id);
  } catch {
    return [];
  }
}

async function fetchAllCustomers(token: string): Promise<SquareCustomer[]> {
  const customers: SquareCustomer[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < 50; page++) {
    const url = new URL("https://connect.squareup.com/v2/customers");
    url.searchParams.set("limit", "100");
    if (cursor) url.searchParams.set("cursor", cursor);
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}`, "Square-Version": SQUARE_VERSION },
    });
    if (!res.ok) break;
    const data = await res.json();
    customers.push(...((data.customers as SquareCustomer[]) ?? []));
    if (!data.cursor) break;
    cursor = data.cursor as string;
  }
  return customers;
}

async function fetchOrdersForLocation(
  token: string,
  locationId: string,
  since: string
): Promise<SquareOrder[]> {
  const orders: SquareOrder[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < 50; page++) {
    if (page > 0) await sleep(200);
    const body: Record<string, unknown> = {
      location_ids: [locationId],
      query: {
        filter: {
          state_filter: { states: ["COMPLETED"] },
          date_time_filter: { created_at: { start_at: since } },
        },
        sort: { sort_field: "CREATED_AT", sort_order: "DESC" },
      },
      limit: 500,
    };
    if (cursor) body.cursor = cursor;
    const res = await fetch("https://connect.squareup.com/v2/orders/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Square-Version": SQUARE_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) break;
    const data = await res.json();
    orders.push(...((data.orders as SquareOrder[]) ?? []));
    if (!data.cursor) break;
    cursor = data.cursor as string;
  }
  return orders;
}

async function fetchSquareCatalog(token: string): Promise<SquareCatalogObject[]> {
  const objects: SquareCatalogObject[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < 20; page++) {
    const url = new URL("https://connect.squareup.com/v2/catalog/list");
    url.searchParams.set("types", "ITEM,CATEGORY");
    if (cursor) url.searchParams.set("cursor", cursor);
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}`, "Square-Version": SQUARE_VERSION },
    });
    if (!res.ok) break;
    const data = await res.json();
    objects.push(...((data.objects as SquareCatalogObject[]) ?? []));
    if (!data.cursor) break;
    cursor = data.cursor as string;
  }
  return objects;
}

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(new URL("/settings?oauth_error=square", request.url));
  }

  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, config")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);

  const business = businesses?.[0];
  if (!business) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://scaleva.vercel.app";
  let accessToken: string;
  try {
    const tokenRes = await fetch("https://connect.squareup.com/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Square-Version": SQUARE_VERSION },
      body: JSON.stringify({
        client_id: process.env.SQUARE_CLIENT_ID,
        client_secret: process.env.SQUARE_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: `${appUrl}/api/oauth/square/callback`,
      }),
    });
    const tokenData: SquareTokenResponse = await tokenRes.json();
    if (!tokenData.access_token) {
      return NextResponse.redirect(new URL("/settings?oauth_error=square_token", request.url));
    }
    accessToken = tokenData.access_token;
  } catch {
    return NextResponse.redirect(new URL("/settings?oauth_error=square_network", request.url));
  }

  const existingConfig: BusinessConfig = (business.config as BusinessConfig) ?? {};
  const since = new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000).toISOString();

  const [squareCustomers, locationIds] = await Promise.all([
    fetchAllCustomers(accessToken).catch(() => [] as SquareCustomer[]),
    fetchLocations(accessToken).catch(() => [] as string[]),
  ]);

  const allOrders: SquareOrder[] = [];
  for (const locId of locationIds) {
    const locOrders = await fetchOrdersForLocation(accessToken, locId, since).catch(() => []);
    allOrders.push(...locOrders);
  }

  // Group orders by customer_id
  const ordersByCustomer = new Map<string, SquareOrder[]>();
  for (const order of allOrders) {
    if (!order.customer_id) continue;
    const list = ordersByCustomer.get(order.customer_id) ?? [];
    list.push(order);
    ordersByCustomer.set(order.customer_id, list);
  }

  const nextContactDays = cadenceDays(existingConfig);
  const now = Date.now();
  let customersSynced = 0;

  const validCustomers = squareCustomers.filter(
    (c) => c.given_name || c.family_name || c.phone_number
  );

  for (let i = 0; i < validCustomers.length; i += 100) {
    const batch = validCustomers.slice(i, i + 100);
    const rows = batch.map((c) => {
      const custOrders = (ordersByCustomer.get(c.id) ?? []).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      const spend_history = custOrders.map((o) => ({
        date: o.created_at,
        amount: (o.total_money?.amount ?? 0) / 100,
        items: (o.line_items ?? []).map((li) => li.name ?? "").filter(Boolean),
      }));

      const visit_count = custOrders.length;
      const total_spend =
        Math.round(spend_history.reduce((sum, e) => sum + e.amount, 0) * 100) / 100;
      const avg_order_value =
        visit_count > 0 ? Math.round((total_spend / visit_count) * 100) / 100 : 0;

      const itemCounts = new Map<string, number>();
      for (const o of custOrders) {
        for (const li of o.line_items ?? []) {
          if (li.name) itemCounts.set(li.name, (itemCounts.get(li.name) ?? 0) + 1);
        }
      }
      const favorite_items = Array.from(itemCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name]) => name);

      const last_purchase = custOrders[0]?.created_at ?? null;
      const next_contact_date = new Date(now + nextContactDays * 86_400_000)
        .toISOString()
        .split("T")[0];

      return {
        business_id: business.id,
        name: [c.given_name, c.family_name].filter(Boolean).join(" ") || "Guest",
        phone: sanitizePhone(c.phone_number),
        email: c.email_address ?? null,
        last_purchase,
        spend_history,
        visit_count,
        total_spend,
        avg_order_value,
        favorite_items,
        birthday: parseBirthday(c.birthday),
        customer_since: c.created_at ?? null,
        next_contact_date,
      };
    });

    const { error: upsertError } = await supabase
      .from("customers")
      .upsert(rows, { onConflict: "business_id,phone", ignoreDuplicates: false });

    if (!upsertError) customersSynced += rows.length;
  }

  // ── Catalog sync ─────────────────────────────────────────────────────────
  // Build item-level analytics from all orders
  interface ItemStats {
    timesOrdered: number;
    totalRevenue: number;
    customerIds: string[];
    lastOrdered: string;
  }
  const itemStatsMap = new Map<string, ItemStats>();
  for (const order of allOrders) {
    for (const li of order.line_items ?? []) {
      if (!li.name) continue;
      const existing: ItemStats = itemStatsMap.get(li.name) ?? {
        timesOrdered: 0,
        totalRevenue: 0,
        customerIds: [],
        lastOrdered: order.created_at,
      };
      existing.timesOrdered += Math.max(1, parseInt(li.quantity ?? "1") || 1);
      existing.totalRevenue += (li.total_money?.amount ?? 0) / 100;
      if (order.customer_id) existing.customerIds.push(order.customer_id);
      if (new Date(order.created_at) > new Date(existing.lastOrdered)) {
        existing.lastOrdered = order.created_at;
      }
      itemStatsMap.set(li.name, existing);
    }
  }

  const catalogObjects = await fetchSquareCatalog(accessToken).catch(() => [] as SquareCatalogObject[]);

  // Category id → name
  const categoryMap = new Map<string, string>();
  for (const obj of catalogObjects) {
    if (obj.type === "CATEGORY" && obj.category_data?.name) {
      categoryMap.set(obj.id, obj.category_data.name);
    }
  }

  const menuItems = catalogObjects.filter(
    (obj) => obj.type === "ITEM" && obj.item_data?.name
  );

  let menuItemsSynced = 0;
  const categorySet = new Set<string>();

  for (let i = 0; i < menuItems.length; i += 50) {
    const batch = menuItems.slice(i, i + 50);
    const rows = batch.map((obj) => {
      const name = obj.item_data!.name!;
      const catId = obj.item_data?.category_id;
      const category = catId ? (categoryMap.get(catId) ?? null) : null;
      if (category) categorySet.add(category);
      const priceAmt = obj.item_data?.variations?.[0]?.item_variation_data?.price_money?.amount;
      const price = priceAmt !== undefined ? priceAmt / 100 : null;
      const stats = itemStatsMap.get(name);
      const uniqueCustCount = stats
        ? Array.from(new Set(stats.customerIds)).length
        : 0;

      return {
        business_id: business.id,
        square_item_id: obj.id,
        name,
        category,
        price,
        description: obj.item_data?.description ?? null,
        active: true,
        sort_order: 0,
        times_ordered: stats?.timesOrdered ?? 0,
        total_revenue: stats ? Math.round(stats.totalRevenue * 100) / 100 : 0,
        unique_customers: uniqueCustCount,
        last_ordered: stats?.lastOrdered ?? null,
      };
    });

    const { error: menuErr } = await supabase
      .from("menu_items")
      .upsert(rows, { onConflict: "business_id,square_item_id" });

    if (!menuErr) menuItemsSynced += rows.length;
  }

  // ── Update business config ────────────────────────────────────────────────
  const integrations = existingConfig.integrations ?? {};
  const oauthTokens = existingConfig.oauthTokens ?? {};
  oauthTokens.square = accessToken;
  integrations.square = {
    connected: true,
    lastSync: new Date().toISOString(),
    customersSynced,
    menuItemsSynced,
    menuCategories: categorySet.size,
  };

  await supabase
    .from("businesses")
    .update({ config: { ...existingConfig, oauthTokens, integrations } })
    .eq("id", business.id);

  return NextResponse.redirect(
    new URL(`/settings?oauth_connected=square&synced=${customersSynced}`, request.url)
  );
}
