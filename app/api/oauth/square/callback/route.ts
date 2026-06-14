import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { BusinessConfig } from "@/utils/database.types";

// Increment this when Square releases a new stable version to pick up new fields.
const SQUARE_VERSION = "2024-05-15";

// ── Square API type definitions ───────────────────────────────────────────────

interface SquareTokenResponse {
  access_token?: string;
  token_type?: string;
  expires_at?: string;      // ISO 8601 — when access_token expires
  merchant_id?: string;
  refresh_token?: string;   // Long-lived; use to refresh access_token
  short_lived?: boolean;    // true when token expires in 24h instead of 30d
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
  // Square returns birthday as YYYY-MM-DD, MM-DD, or --MM-DD (unknown year)
  birthday?: string;
}

interface SquareLineItem {
  name?: string;
  // Square stores quantities as decimal strings e.g. "1.000", "2.000"
  quantity?: string;
  total_money?: { amount?: number; currency?: string };
  // Links this line item to a CatalogItemVariation (not the CatalogItem itself)
  catalog_object_id?: string;
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
  // Square soft-deletes objects rather than removing them from list responses
  is_deleted?: boolean;
  item_data?: {
    name?: string;
    // The category_id references a CATEGORY CatalogObject's id
    category_id?: string;
    description?: string;
    variations?: Array<{
      id?: string;
      item_variation_data?: {
        price_money?: { amount?: number; currency?: string };
      };
    }>;
  };
  category_data?: { name?: string };
}

// ── Pure helper functions ─────────────────────────────────────────────────────

function sanitizePhone(raw: string | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  // Keep international numbers as-is; they're already in a usable format
  if (raw.startsWith("+") && digits.length > 8) return raw;
  return null; // Discard unrecognisable formats rather than storing garbage
}

function parseBirthday(raw: string | undefined): string | null {
  if (!raw) return null;
  // Full date: 1990-06-14
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  // Month-day only (month-day without year): 06-14 — Square legacy format
  if (/^\d{2}-\d{2}$/.test(raw)) return `2000-${raw}`;
  // Square canonical unknown-year format: --06-14
  if (/^--\d{2}-\d{2}$/.test(raw)) return `2000-${raw.slice(2)}`;
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

// ── Square API fetch helpers ──────────────────────────────────────────────────

async function fetchLocations(token: string): Promise<string[]> {
  try {
    const res = await fetch("https://connect.squareup.com/v2/locations", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Square-Version": SQUARE_VERSION,
      },
    });
    if (!res.ok) {
      console.error(`[square/callback] fetchLocations HTTP ${res.status}`);
      return [];
    }
    const data = await res.json();
    return ((data.locations as SquareLocation[]) ?? [])
      .filter((l) => l.status === "ACTIVE")
      .map((l) => l.id);
  } catch (err) {
    console.error("[square/callback] fetchLocations error:", err);
    return [];
  }
}

async function fetchAllCustomers(token: string): Promise<SquareCustomer[]> {
  const customers: SquareCustomer[] = [];
  let cursor: string | undefined;
  // Square max page size for customers is 100
  for (let page = 0; page < 200; page++) {
    const url = new URL("https://connect.squareup.com/v2/customers");
    url.searchParams.set("limit", "100");
    if (cursor) url.searchParams.set("cursor", cursor);

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        "Square-Version": SQUARE_VERSION,
      },
    });
    if (!res.ok) {
      console.error(`[square/callback] fetchAllCustomers HTTP ${res.status} on page ${page}`);
      break;
    }
    const data = await res.json();
    const page_customers = (data.customers as SquareCustomer[]) ?? [];
    customers.push(...page_customers);
    if (!data.cursor || page_customers.length === 0) break;
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
  // Square max page size for SearchOrders is 500
  for (let page = 0; page < 200; page++) {
    // Rate-limit: 200ms between pages to stay within Square's limits
    if (page > 0) await sleep(200);

    const body: Record<string, unknown> = {
      location_ids: [locationId],
      query: {
        filter: {
          state_filter: { states: ["COMPLETED"] },
          date_time_filter: {
            created_at: { start_at: since },
          },
        },
        sort: { sort_field: "CREATED_AT", sort_order: "DESC" },
      },
      limit: 500,
    };
    // cursor goes at root level per Square SearchOrders spec
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
    if (!res.ok) {
      console.error(
        `[square/callback] fetchOrdersForLocation HTTP ${res.status} on page ${page} for location ${locationId}`
      );
      break;
    }
    const data = await res.json();
    const page_orders = (data.orders as SquareOrder[]) ?? [];
    orders.push(...page_orders);
    if (!data.cursor || page_orders.length === 0) break;
    cursor = data.cursor as string;
  }
  return orders;
}

async function fetchSquareCatalog(token: string): Promise<SquareCatalogObject[]> {
  const objects: SquareCatalogObject[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < 50; page++) {
    const url = new URL("https://connect.squareup.com/v2/catalog/list");
    url.searchParams.set("types", "ITEM,CATEGORY");
    if (cursor) url.searchParams.set("cursor", cursor);

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        "Square-Version": SQUARE_VERSION,
      },
    });
    if (!res.ok) {
      console.error(`[square/callback] fetchSquareCatalog HTTP ${res.status} on page ${page}`);
      break;
    }
    const data = await res.json();
    const page_objects = (data.objects as SquareCatalogObject[]) ?? [];
    // Filter out soft-deleted objects Square includes in list responses
    objects.push(...page_objects.filter((o) => !o.is_deleted));
    if (!data.cursor || page_objects.length === 0) break;
    cursor = data.cursor as string;
  }
  return objects;
}

// ── Main OAuth callback handler ───────────────────────────────────────────────

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
    console.error("[square/callback] OAuth denied or missing code:", error);
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

  // ── Step 1: Exchange code for access token ────────────────────────────────
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://scaleva.vercel.app";
  let accessToken: string;
  let refreshToken: string | undefined;
  let tokenExpiresAt: string | undefined;

  try {
    const tokenRes = await fetch("https://connect.squareup.com/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Square-Version": SQUARE_VERSION,
      },
      body: JSON.stringify({
        client_id: process.env.SQUARE_CLIENT_ID,
        client_secret: process.env.SQUARE_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: `${appUrl}/api/oauth/square/callback`,
      }),
    });

    if (!tokenRes.ok) {
      console.error(`[square/callback] Token exchange HTTP ${tokenRes.status}`);
      return NextResponse.redirect(new URL("/settings?oauth_error=square_token", request.url));
    }

    const tokenData: SquareTokenResponse = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error("[square/callback] Token exchange error:", tokenData.error, tokenData.message);
      return NextResponse.redirect(new URL("/settings?oauth_error=square_token", request.url));
    }

    accessToken = tokenData.access_token;
    refreshToken = tokenData.refresh_token;
    tokenExpiresAt = tokenData.expires_at;
  } catch (err) {
    console.error("[square/callback] Token exchange exception:", err);
    return NextResponse.redirect(new URL("/settings?oauth_error=square_network", request.url));
  }

  // ── Step 2: Fetch customers + locations in parallel ───────────────────────
  const existingConfig: BusinessConfig = (business.config as BusinessConfig) ?? {};
  // 3 years of order history
  const since = new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000).toISOString();

  const [squareCustomers, locationIds] = await Promise.all([
    fetchAllCustomers(accessToken).catch((err) => {
      console.error("[square/callback] fetchAllCustomers failed:", err);
      return [] as SquareCustomer[];
    }),
    fetchLocations(accessToken).catch((err) => {
      console.error("[square/callback] fetchLocations failed:", err);
      return [] as string[];
    }),
  ]);

  // ── Step 3: Fetch orders for every location ───────────────────────────────
  const allOrders: SquareOrder[] = [];
  for (const locId of locationIds) {
    const locOrders = await fetchOrdersForLocation(accessToken, locId, since).catch((err) => {
      console.error(`[square/callback] fetchOrdersForLocation failed for ${locId}:`, err);
      return [] as SquareOrder[];
    });
    allOrders.push(...locOrders);
  }

  // ── Step 4: Group orders by customer_id ──────────────────────────────────
  const ordersByCustomer = new Map<string, SquareOrder[]>();
  for (const order of allOrders) {
    if (!order.customer_id) continue;
    const list = ordersByCustomer.get(order.customer_id) ?? [];
    list.push(order);
    ordersByCustomer.set(order.customer_id, list);
  }

  // ── Step 5: Upsert customers ──────────────────────────────────────────────
  const nextContactDays = cadenceDays(existingConfig);
  const now = Date.now();
  let customersSynced = 0;

  // Only sync customers that have a phone number.
  // Rationale: (a) this is an SMS platform so phone-less customers can't be contacted,
  // (b) our unique constraint is on (business_id, phone) — NULL values are distinct in
  //     PostgreSQL unique indexes, so phone-less rows would duplicate on every re-sync.
  const validCustomers = squareCustomers.filter((c) => c.phone_number);

  for (let i = 0; i < validCustomers.length; i += 100) {
    const batch = validCustomers.slice(i, i + 100);
    const rows = batch.map((c) => {
      const custOrders = (ordersByCustomer.get(c.id) ?? []).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      const spend_history = custOrders.map((o) => ({
        date: o.created_at,
        amount: (o.total_money?.amount ?? 0) / 100,
        // Collect all non-empty line item names for this order
        items: (o.line_items ?? []).flatMap((li) => (li.name ? [li.name] : [])),
      }));

      const visit_count = custOrders.length;
      const total_spend =
        Math.round(spend_history.reduce((sum, e) => sum + e.amount, 0) * 100) / 100;
      const avg_order_value =
        visit_count > 0 ? Math.round((total_spend / visit_count) * 100) / 100 : 0;

      // Count how many times each item was ordered (use quantity, not just order count)
      const itemCounts = new Map<string, number>();
      for (const o of custOrders) {
        for (const li of o.line_items ?? []) {
          if (!li.name) continue;
          // Square quantities are decimal strings like "1.000" — use parseFloat then round
          const qty = Math.round(parseFloat(li.quantity ?? "1") || 1);
          itemCounts.set(li.name, (itemCounts.get(li.name) ?? 0) + qty);
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

    // Filter again after sanitizePhone — a phone might render unstorable
    const validRows = rows.filter((r) => r.phone !== null);

    if (validRows.length === 0) continue;

    const { error: upsertError } = await supabase
      .from("customers")
      .upsert(validRows, { onConflict: "business_id,phone", ignoreDuplicates: false });

    if (upsertError) {
      console.error("[square/callback] customer upsert error:", upsertError.message);
    } else {
      customersSynced += validRows.length;
    }
  }

  // ── Step 6: Build item-level analytics from order history ─────────────────
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
      // Square quantities are decimal strings — round to nearest integer
      existing.timesOrdered += Math.round(parseFloat(li.quantity ?? "1") || 1);
      existing.totalRevenue += (li.total_money?.amount ?? 0) / 100;
      if (order.customer_id) existing.customerIds.push(order.customer_id);
      if (new Date(order.created_at) > new Date(existing.lastOrdered)) {
        existing.lastOrdered = order.created_at;
      }
      itemStatsMap.set(li.name, existing);
    }
  }

  // ── Step 7: Fetch and sync catalog (requires ITEMS_READ scope) ────────────
  const catalogObjects = await fetchSquareCatalog(accessToken).catch((err) => {
    console.error("[square/callback] fetchSquareCatalog failed:", err);
    return [] as SquareCatalogObject[];
  });

  // Category CatalogObject id → display name
  const categoryMap = new Map<string, string>();
  for (const obj of catalogObjects) {
    if (obj.type === "CATEGORY" && obj.category_data?.name) {
      categoryMap.set(obj.id, obj.category_data.name);
    }
  }

  const catalogItems = catalogObjects.filter(
    (obj) => obj.type === "ITEM" && obj.item_data?.name
  );

  let menuItemsSynced = 0;
  const categorySet = new Set<string>();

  for (let i = 0; i < catalogItems.length; i += 50) {
    const batch = catalogItems.slice(i, i + 50);
    const rows = batch.map((obj) => {
      const name = obj.item_data!.name!;
      const catId = obj.item_data?.category_id;
      const category = catId ? (categoryMap.get(catId) ?? null) : null;
      if (category) categorySet.add(category);

      // Price comes from the first variation's price_money (in cents)
      const priceAmt =
        obj.item_data?.variations?.[0]?.item_variation_data?.price_money?.amount;
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

    if (menuErr) {
      console.error("[square/callback] menu_items upsert error:", menuErr.message);
    } else {
      menuItemsSynced += rows.length;
    }
  }

  // ── Step 8: Persist token + integration metadata in business config ────────
  const integrations = existingConfig.integrations ?? {};
  const oauthTokens = existingConfig.oauthTokens ?? {};

  // Store access token AND refresh token so we can refresh when access_token expires
  oauthTokens.square = accessToken;
  if (refreshToken) oauthTokens.square_refresh = refreshToken;
  if (tokenExpiresAt) oauthTokens.square_expires_at = tokenExpiresAt;

  integrations.square = {
    connected: true,
    lastSync: new Date().toISOString(),
    customersSynced,
    menuItemsSynced,
    menuCategories: categorySet.size,
  };

  const { error: configErr } = await supabase
    .from("businesses")
    .update({ config: { ...existingConfig, oauthTokens, integrations } })
    .eq("id", business.id);

  if (configErr) {
    console.error("[square/callback] business config update error:", configErr.message);
  }

  return NextResponse.redirect(
    new URL(`/settings?oauth_connected=square&synced=${customersSynced}`, request.url)
  );
}
