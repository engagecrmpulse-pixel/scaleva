import type { ExtractedCustomer } from "./types";

// Clover uses a merchant-token flow: after OAuth the token is tied to a merchant ID.
// Sandbox base URL differs from production.
const BASE =
  process.env.CLOVER_ENV === "sandbox"
    ? "https://sandbox.dev.clover.com"
    : "https://www.clover.com";

const API_BASE =
  process.env.CLOVER_ENV === "sandbox"
    ? "https://apisandbox.dev.clover.com"
    : "https://api.clover.com";

export async function exchangeCloverToken(
  code: string,
  _redirectUri: string
): Promise<string> {
  // Clover token exchange — returns merchant_id and access_token
  const res = await fetch(`${BASE}/oauth/token?client_id=${process.env.CLOVER_CLIENT_ID}&client_secret=${process.env.CLOVER_CLIENT_SECRET}&code=${code}`);
  const data = await res.json() as { access_token?: string; merchant_id?: string; error?: string };
  if (!data.access_token) {
    throw new Error(data.error ?? "Clover token exchange failed");
  }
  // Store both merchant_id and access_token together — encode as JSON string
  return JSON.stringify({ accessToken: data.access_token, merchantId: data.merchant_id });
}

interface CloverCustomer {
  id: string;
  firstName?: string;
  lastName?: string;
  emailAddresses?: { elements: Array<{ emailAddress: string }> };
  phoneNumbers?: { elements: Array<{ phoneNumber: string }> };
  marketingAllowed?: boolean;
}

interface CloverOrder {
  id: string;
  createdTime: number;
  total: number;
  state?: string;
  customers?: { elements: Array<{ id: string }> };
}

export async function extractCloverCustomers(
  tokenJson: string
): Promise<ExtractedCustomer[]> {
  let accessToken: string;
  let merchantId: string;

  try {
    const parsed = JSON.parse(tokenJson) as { accessToken: string; merchantId: string };
    accessToken = parsed.accessToken;
    merchantId = parsed.merchantId;
  } catch {
    throw new Error("Invalid Clover token format");
  }

  const headers = { Authorization: `Bearer ${accessToken}` };

  // Fetch all customers
  const customers: CloverCustomer[] = [];
  let offset = 0;
  const limit = 200;
  while (true) {
    const res = await fetch(
      `${API_BASE}/v3/merchants/${merchantId}/customers?limit=${limit}&offset=${offset}`,
      { headers }
    );
    const data = await res.json() as { elements?: CloverCustomer[] };
    const chunk = data.elements ?? [];
    customers.push(...chunk);
    if (chunk.length < limit) break;
    offset += limit;
  }

  // Fetch recent orders (last 2 years)
  const since = Date.now() - 2 * 365 * 24 * 60 * 60 * 1000;
  const orders: CloverOrder[] = [];
  let orderOffset = 0;
  while (true) {
    const res = await fetch(
      `${API_BASE}/v3/merchants/${merchantId}/orders?limit=200&offset=${orderOffset}&filter=createdTime>=${since}&expand=customers`,
      { headers }
    );
    const data = await res.json() as { elements?: CloverOrder[] };
    const chunk = (data.elements ?? []).filter((o) => o.state === "locked" || o.total > 0);
    orders.push(...chunk);
    if (chunk.length < 200) break;
    orderOffset += 200;
  }

  // Group orders by customer id
  const ordersByCustomer = new Map<string, CloverOrder[]>();
  for (const order of orders) {
    for (const c of order.customers?.elements ?? []) {
      const list = ordersByCustomer.get(c.id) ?? [];
      list.push(order);
      ordersByCustomer.set(c.id, list);
    }
  }

  return customers.map((c) => {
    const email = c.emailAddresses?.elements?.[0]?.emailAddress ?? null;
    const phone = c.phoneNumbers?.elements?.[0]?.phoneNumber ?? null;
    const name = [c.firstName, c.lastName].filter(Boolean).join(" ") || email || "Unknown";

    const custOrders = (ordersByCustomer.get(c.id) ?? []).sort(
      (a, b) => b.createdTime - a.createdTime
    );

    const spend_history = custOrders.map((o) => ({
      date: new Date(o.createdTime).toISOString(),
      amount: o.total / 100,
      description: "Purchase",
    }));

    const lastOrder = custOrders[0];
    const daysSince = lastOrder
      ? (Date.now() - lastOrder.createdTime) / 86_400_000
      : Infinity;

    return {
      name,
      phone,
      email,
      last_purchase: lastOrder ? new Date(lastOrder.createdTime).toISOString() : null,
      spend_history,
      return_visit_count: custOrders.length,
      last_return_date: custOrders[1] ? new Date(custOrders[1].createdTime).toISOString() : null,
      status: daysSince < 90 ? "active" : "lapsed",
    };
  });
}
