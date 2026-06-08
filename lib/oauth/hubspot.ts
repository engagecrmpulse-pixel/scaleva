import type { ExtractedCustomer } from "./types";

export async function exchangeHubSpotToken(
  code: string,
  redirectUri: string
): Promise<string> {
  const res = await fetch("https://api.hubapi.com/oauth/v1/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: process.env.HUBSPOT_CLIENT_ID ?? "",
      client_secret: process.env.HUBSPOT_CLIENT_SECRET ?? "",
      redirect_uri: redirectUri,
      code,
    }),
  });
  const data = await res.json();
  if (!data.access_token) {
    throw new Error("HubSpot token exchange failed");
  }
  return data.access_token as string;
}

const CONTACT_PROPERTIES = [
  "firstname",
  "lastname",
  "email",
  "phone",
  "mobilephone",
  "company",
  "lifecyclestage",
  "hs_lead_status",
  "createdate",
  "lastmodifieddate",
  "last_activity_date",
  "total_revenue",
  "num_associated_deals",
  "city",
  "state",
  "country",
  "jobtitle",
  "notes_last_contacted",
].join(",");

interface HubSpotContact {
  id: string;
  properties: Record<string, string | null>;
}

interface HubSpotDeal {
  id: string;
  properties: Record<string, string | null>;
  associations?: { contacts?: { results: Array<{ id: string }> } };
}

async function hubspotPaginate<T>(
  url: string,
  token: string
): Promise<T[]> {
  const items: T[] = [];
  let after: string | undefined;
  do {
    const params = new URLSearchParams({ limit: "100" });
    if (after) params.set("after", after);
    const res = await fetch(`${url}?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    items.push(...(data.results as T[]));
    after = data.paging?.next?.after as string | undefined;
  } while (after);
  return items;
}

export async function extractHubSpotCustomers(
  token: string
): Promise<ExtractedCustomer[]> {
  const [contacts, deals] = await Promise.all([
    fetch(
      `https://api.hubapi.com/crm/v3/objects/contacts?limit=100&properties=${CONTACT_PROPERTIES}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then((r) => r.json())
      .then(async (data) => {
        const results: HubSpotContact[] = data.results ?? [];
        let after = data.paging?.next?.after as string | undefined;
        while (after) {
          const r = await fetch(
            `https://api.hubapi.com/crm/v3/objects/contacts?limit=100&properties=${CONTACT_PROPERTIES}&after=${after}`,
            { headers: { Authorization: `Bearer ${token}` } }
          ).then((x) => x.json());
          results.push(...((r.results as HubSpotContact[]) ?? []));
          after = r.paging?.next?.after as string | undefined;
        }
        return results;
      }),
    fetch(
      "https://api.hubapi.com/crm/v3/objects/deals?limit=100&properties=amount,closedate,dealstage,dealname&associations=contacts",
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then((r) => r.json())
      .then(async (data) => {
        const results: HubSpotDeal[] = data.results ?? [];
        let after = data.paging?.next?.after as string | undefined;
        while (after) {
          const r = await fetch(
            `https://api.hubapi.com/crm/v3/objects/deals?limit=100&properties=amount,closedate,dealstage,dealname&associations=contacts&after=${after}`,
            { headers: { Authorization: `Bearer ${token}` } }
          ).then((x) => x.json());
          results.push(...((r.results as HubSpotDeal[]) ?? []));
          after = r.paging?.next?.after as string | undefined;
        }
        return results;
      }),
  ]);

  // Map deals → contacts
  const dealsByContact = new Map<string, HubSpotDeal[]>();
  for (const deal of deals) {
    for (const contact of deal.associations?.contacts?.results ?? []) {
      const list = dealsByContact.get(contact.id) ?? [];
      list.push(deal);
      dealsByContact.set(contact.id, list);
    }
  }

  return contacts.map((c) => {
    const p = c.properties;
    const contactDeals = dealsByContact.get(c.id) ?? [];

    const spend_history = contactDeals
      .filter((d) => d.properties.amount && d.properties.closedate)
      .map((d) => ({
        date: d.properties.closedate!,
        amount: parseFloat(d.properties.amount ?? "0") || 0,
        description: d.properties.dealname ?? "Deal",
      }))
      .sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

    const lastDeal = spend_history[0];
    const lastActivity =
      lastDeal?.date ?? p.last_activity_date ?? p.lastmodifieddate ?? null;
    const daysSince = lastActivity
      ? (Date.now() - new Date(lastActivity).getTime()) / 86_400_000
      : Infinity;

    return {
      name:
        [p.firstname, p.lastname].filter(Boolean).join(" ") ||
        p.email ||
        "Unknown",
      phone: p.mobilephone ?? p.phone ?? null,
      email: p.email ?? null,
      last_purchase: lastDeal?.date ?? null,
      spend_history,
      return_visit_count: contactDeals.length,
      last_return_date: spend_history[1]?.date ?? null,
      status: daysSince < 90 ? "active" : p.lifecyclestage ?? "lapsed",
    };
  });
}
