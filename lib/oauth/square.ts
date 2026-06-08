import type { ExtractedCustomer } from "./types";

const SQUARE_VERSION = "2024-01-17";

export async function exchangeSquareToken(
  code: string,
  redirectUri: string
): Promise<string> {
  const res = await fetch("https://connect.squareup.com/oauth2/token", {
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
      redirect_uri: redirectUri,
    }),
  });
  const data = await res.json();
  if (!data.access_token) {
    throw new Error(data.message ?? "Square token exchange failed");
  }
  return data.access_token as string;
}

async function squarePaginated<T>(
  url: string,
  token: string,
  key: string
): Promise<T[]> {
  const items: T[] = [];
  let cursor: string | undefined;
  do {
    const fullUrl = cursor ? `${url}?cursor=${cursor}` : url;
    const res = await fetch(fullUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Square-Version": SQUARE_VERSION,
      },
    });
    const data = await res.json();
    items.push(...((data[key] as T[]) ?? []));
    cursor = data.cursor as string | undefined;
  } while (cursor);
  return items;
}

interface SquareCustomer {
  id: string;
  given_name?: string;
  family_name?: string;
  company_name?: string;
  email_address?: string;
  phone_number?: string;
  created_at?: string;
  birthday?: string;
  note?: string;
}

interface SquareOrder {
  id: string;
  customer_id?: string;
  created_at: string;
  total_money?: { amount: number; currency: string };
  line_items?: Array<{ name: string }>;
}

export async function extractSquareCustomers(
  token: string
): Promise<ExtractedCustomer[]> {
  const customers = await squarePaginated<SquareCustomer>(
    "https://connect.squareup.com/v2/customers",
    token,
    "customers"
  );

  // Pull up to 3 years of completed orders
  const since = new Date(
    Date.now() - 3 * 365 * 24 * 60 * 60 * 1000
  ).toISOString();

  let allOrders: SquareOrder[] = [];
  let orderCursor: string | undefined;
  do {
    const body: Record<string, unknown> = {
      query: {
        filter: {
          state_filter: { states: ["COMPLETED"] },
          date_time_filter: { created_at: { start_at: since } },
        },
        sort: { sort_field: "CREATED_AT", sort_order: "DESC" },
      },
      limit: 500,
    };
    if (orderCursor) body.cursor = orderCursor;

    const res = await fetch("https://connect.squareup.com/v2/orders/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Square-Version": SQUARE_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    allOrders = allOrders.concat((data.orders as SquareOrder[]) ?? []);
    orderCursor = data.cursor as string | undefined;
  } while (orderCursor);

  // Group orders by customer_id
  const ordersByCustomer = new Map<string, SquareOrder[]>();
  for (const order of allOrders) {
    if (!order.customer_id) continue;
    const list = ordersByCustomer.get(order.customer_id) ?? [];
    list.push(order);
    ordersByCustomer.set(order.customer_id, list);
  }

  return customers.map((c) => {
    const custOrders = (ordersByCustomer.get(c.id) ?? []).sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const spend_history = custOrders.map((o) => ({
      date: o.created_at,
      amount: (o.total_money?.amount ?? 0) / 100,
      description: o.line_items?.[0]?.name ?? "Purchase",
    }));

    const lastOrder = custOrders[0];
    const daysSince = lastOrder
      ? (Date.now() - new Date(lastOrder.created_at).getTime()) /
        86_400_000
      : Infinity;

    return {
      name:
        [c.given_name, c.family_name].filter(Boolean).join(" ") ||
        c.company_name ||
        "Unknown",
      phone: c.phone_number ?? null,
      email: c.email_address ?? null,
      last_purchase: lastOrder?.created_at ?? c.created_at ?? null,
      spend_history,
      return_visit_count: custOrders.length,
      last_return_date: custOrders[1]?.created_at ?? null,
      status: daysSince < 90 ? "active" : "lapsed",
    };
  });
}
