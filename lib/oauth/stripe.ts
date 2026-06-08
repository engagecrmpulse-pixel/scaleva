import type { ExtractedCustomer } from "./types";

export async function exchangeStripeToken(code: string): Promise<string> {
  const res = await fetch("https://connect.stripe.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_secret: process.env.STRIPE_SECRET_KEY ?? "",
      code,
      grant_type: "authorization_code",
    }),
  });
  const data = await res.json();
  if (!data.access_token) {
    throw new Error(
      (data.error_description as string) ?? "Stripe token exchange failed"
    );
  }
  return data.access_token as string;
}

interface StripeCustomer {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  created: number;
}

interface StripeCharge {
  id: string;
  created: number;
  amount: number;
  status: string;
  refunded: boolean;
  description?: string | null;
  statement_descriptor?: string | null;
}

export async function extractStripeCustomers(
  accessToken: string
): Promise<ExtractedCustomer[]> {
  // Paginate all customers
  const customers: StripeCustomer[] = [];
  let startingAfter: string | undefined;
  do {
    const params = new URLSearchParams({ limit: "100" });
    if (startingAfter) params.set("starting_after", startingAfter);
    const res = await fetch(`https://api.stripe.com/v1/customers?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    customers.push(...(data.data as StripeCustomer[]));
    startingAfter =
      data.has_more
        ? (data.data as StripeCustomer[]).at(-1)?.id
        : undefined;
  } while (startingAfter);

  // Fetch charges per customer (batched to avoid rate limits)
  const result: ExtractedCustomer[] = [];
  for (const customer of customers) {
    const chargesRes = await fetch(
      `https://api.stripe.com/v1/charges?customer=${customer.id}&limit=100`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const chargesData = await chargesRes.json();
    const charges = (chargesData.data as StripeCharge[]) ?? [];

    const successful = charges.filter(
      (c) => c.status === "succeeded" && !c.refunded
    );

    const spend_history = successful.map((c) => ({
      date: new Date(c.created * 1000).toISOString(),
      amount: c.amount / 100,
      description:
        c.description ?? c.statement_descriptor ?? "Payment",
    }));

    const last = successful[0];
    const daysSince = last
      ? (Date.now() - last.created * 1000) / 86_400_000
      : Infinity;

    result.push({
      name: customer.name ?? customer.email ?? "Unknown",
      phone: customer.phone ?? null,
      email: customer.email ?? null,
      last_purchase: last
        ? new Date(last.created * 1000).toISOString()
        : null,
      spend_history,
      return_visit_count: successful.length,
      last_return_date: successful[1]
        ? new Date(successful[1].created * 1000).toISOString()
        : null,
      status: daysSince < 90 ? "active" : "lapsed",
    });
  }

  return result;
}
