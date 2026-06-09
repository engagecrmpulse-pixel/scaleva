import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { BusinessConfig } from "@/utils/database.types";
import type { ExtractedCustomer } from "@/lib/oauth/types";

// Dev-only route — blocked in production.
// POST { provider: "square" | "stripe" | "hubspot" | "toast" }
// Simulates a completed OAuth sync with realistic fake customer data
// so you can test the full integration UI without real provider accounts.
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { provider } = (await request.json()) as { provider: string };

  const SUPPORTED = ["square", "clover", "stripe", "hubspot", "toast", "mindbody", "vagaro", "shopify", "jobber", "housecall"];
  if (!SUPPORTED.includes(provider)) {
    return NextResponse.json({ error: `Unknown provider. Supported: ${SUPPORTED.join(", ")}` }, { status: 400 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
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

  const customers = buildMockCustomers(provider);

  const existingConfig: BusinessConfig = (business.config as BusinessConfig) ?? {};
  const integrations = existingConfig.integrations ?? {};

  integrations[provider] = {
    connected: true,
    lastSync: new Date().toISOString(),
    customersSynced: customers.length,
  };

  await supabase
    .from("businesses")
    .update({ config: { ...existingConfig, integrations } })
    .eq("id", business.id);

  const rows = customers.map((c) => ({
    business_id: business.id,
    name: c.name,
    phone: c.phone,
    email: c.email,
    last_purchase: c.last_purchase,
    spend_history: c.spend_history,
    return_visit_count: c.return_visit_count,
    last_return_date: c.last_return_date,
    status: c.status,
    consent_given: true,
  }));

  for (let i = 0; i < rows.length; i += 100) {
    await supabase.from("customers").upsert(rows.slice(i, i + 100), {
      onConflict: "business_id,phone",
      ignoreDuplicates: false,
    });
  }

  return NextResponse.json({
    ok: true,
    provider,
    customersSynced: customers.length,
  });
}

// ─── Mock data per provider ────────────────────────────────────────────────

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toISOString();
}

function buildMockCustomers(provider: string): ExtractedCustomer[] {
  switch (provider) {
    case "square":
      return squareMockCustomers();
    case "clover":
      return cloverMockCustomers();
    case "stripe":
      return stripeMockCustomers();
    case "hubspot":
      return hubspotMockCustomers();
    case "toast":
      return toastMockCustomers();
    case "mindbody":
      return mindbodyMockCustomers();
    case "vagaro":
      return vagaroMockCustomers();
    case "shopify":
      return shopifyMockCustomers();
    case "jobber":
      return jobberMockCustomers();
    case "housecall":
      return housecallMockCustomers();
    default:
      return [];
  }
}

function squareMockCustomers(): ExtractedCustomer[] {
  return [
    {
      name: "Maria Santos",
      phone: "+15551110001",
      email: "maria.santos@example.com",
      last_purchase: daysAgo(8),
      spend_history: [
        { date: daysAgo(8), amount: 42.5, description: "Dinner for two" },
        { date: daysAgo(21), amount: 38.0, description: "Lunch special" },
        { date: daysAgo(47), amount: 55.75, description: "Birthday dinner" },
        { date: daysAgo(90), amount: 29.5, description: "Takeout order" },
      ],
      return_visit_count: 4,
      last_return_date: daysAgo(21),
      status: "active",
    },
    {
      name: "James Okafor",
      phone: "+15551110002",
      email: "james.okafor@example.com",
      last_purchase: daysAgo(52),
      spend_history: [
        { date: daysAgo(52), amount: 67.0, description: "Weekend brunch" },
        { date: daysAgo(88), amount: 31.5, description: "Quick lunch" },
        { date: daysAgo(140), amount: 44.25, description: "Date night" },
      ],
      return_visit_count: 3,
      last_return_date: daysAgo(88),
      status: "lapsed",
    },
    {
      name: "Priya Nair",
      phone: "+15551110003",
      email: "priya.nair@example.com",
      last_purchase: daysAgo(3),
      spend_history: [
        { date: daysAgo(3), amount: 22.0, description: "Coffee & pastry" },
      ],
      return_visit_count: 1,
      last_return_date: null,
      status: "active",
    },
    {
      name: "Carlos Mendez",
      phone: "+15551110004",
      email: "carlos.mendez@example.com",
      last_purchase: daysAgo(120),
      spend_history: [
        { date: daysAgo(120), amount: 88.0, description: "Group dinner" },
        { date: daysAgo(200), amount: 54.5, description: "Corporate lunch" },
        { date: daysAgo(280), amount: 61.0, description: "Team dinner" },
        { date: daysAgo(350), amount: 45.0, description: "Dinner" },
      ],
      return_visit_count: 4,
      last_return_date: daysAgo(200),
      status: "lapsed",
    },
    {
      name: "Aisha Williams",
      phone: "+15551110005",
      email: "aisha.w@example.com",
      last_purchase: daysAgo(15),
      spend_history: [
        { date: daysAgo(15), amount: 34.5, description: "Lunch" },
        { date: daysAgo(30), amount: 41.0, description: "Dinner" },
        { date: daysAgo(62), amount: 28.0, description: "Takeout" },
        { date: daysAgo(95), amount: 52.5, description: "Family dinner" },
        { date: daysAgo(128), amount: 39.0, description: "Dinner" },
      ],
      return_visit_count: 5,
      last_return_date: daysAgo(30),
      status: "active",
    },
    {
      name: "David Chen",
      phone: "+15551110006",
      email: "david.chen@example.com",
      last_purchase: daysAgo(75),
      spend_history: [
        { date: daysAgo(75), amount: 29.0, description: "Lunch" },
        { date: daysAgo(110), amount: 35.5, description: "Dinner" },
      ],
      return_visit_count: 2,
      last_return_date: daysAgo(110),
      status: "lapsed",
    },
    {
      name: "Sofia Rossi",
      phone: "+15551110007",
      email: "sofia.rossi@example.com",
      last_purchase: daysAgo(5),
      spend_history: [
        { date: daysAgo(5), amount: 18.5, description: "Breakfast" },
        { date: daysAgo(12), amount: 22.0, description: "Coffee" },
        { date: daysAgo(19), amount: 31.5, description: "Brunch" },
      ],
      return_visit_count: 3,
      last_return_date: daysAgo(12),
      status: "active",
    },
    {
      name: "Marcus Thompson",
      phone: "+15551110008",
      email: "marcus.t@example.com",
      last_purchase: daysAgo(180),
      spend_history: [
        { date: daysAgo(180), amount: 95.0, description: "Anniversary dinner" },
        { date: daysAgo(365), amount: 78.5, description: "Birthday dinner" },
      ],
      return_visit_count: 2,
      last_return_date: daysAgo(365),
      status: "lapsed",
    },
  ];
}

function stripeMockCustomers(): ExtractedCustomer[] {
  return [
    {
      name: "Emma Johnson",
      phone: "+15552220001",
      email: "emma.j@example.com",
      last_purchase: daysAgo(12),
      spend_history: [
        { date: daysAgo(12), amount: 149.0, description: "Monthly subscription" },
        { date: daysAgo(42), amount: 149.0, description: "Monthly subscription" },
        { date: daysAgo(72), amount: 149.0, description: "Monthly subscription" },
        { date: daysAgo(102), amount: 99.0, description: "One-time service" },
      ],
      return_visit_count: 4,
      last_return_date: daysAgo(42),
      status: "active",
    },
    {
      name: "Ryan Park",
      phone: "+15552220002",
      email: "ryan.park@example.com",
      last_purchase: daysAgo(95),
      spend_history: [
        { date: daysAgo(95), amount: 299.0, description: "Annual plan" },
        { date: daysAgo(460), amount: 249.0, description: "Annual plan" },
      ],
      return_visit_count: 2,
      last_return_date: daysAgo(460),
      status: "active",
    },
    {
      name: "Lena Schulz",
      phone: "+15552220003",
      email: "lena.schulz@example.com",
      last_purchase: daysAgo(7),
      spend_history: [
        { date: daysAgo(7), amount: 49.0, description: "Add-on purchase" },
        { date: daysAgo(37), amount: 149.0, description: "Monthly subscription" },
        { date: daysAgo(67), amount: 149.0, description: "Monthly subscription" },
        { date: daysAgo(97), amount: 149.0, description: "Monthly subscription" },
        { date: daysAgo(127), amount: 149.0, description: "Monthly subscription" },
        { date: daysAgo(157), amount: 149.0, description: "Monthly subscription" },
      ],
      return_visit_count: 6,
      last_return_date: daysAgo(37),
      status: "active",
    },
    {
      name: "Tom Bradley",
      phone: "+15552220004",
      email: "tom.b@example.com",
      last_purchase: daysAgo(200),
      spend_history: [
        { date: daysAgo(200), amount: 149.0, description: "Monthly subscription" },
        { date: daysAgo(230), amount: 149.0, description: "Monthly subscription" },
      ],
      return_visit_count: 2,
      last_return_date: daysAgo(230),
      status: "lapsed",
    },
    {
      name: "Naomi Adeyemi",
      phone: "+15552220005",
      email: "naomi.a@example.com",
      last_purchase: daysAgo(2),
      spend_history: [
        { date: daysAgo(2), amount: 79.0, description: "Starter plan" },
      ],
      return_visit_count: 1,
      last_return_date: null,
      status: "active",
    },
  ];
}

function hubspotMockCustomers(): ExtractedCustomer[] {
  return [
    {
      name: "Alex Rivera",
      phone: "+15553330001",
      email: "alex.rivera@acme.com",
      last_purchase: daysAgo(18),
      spend_history: [
        { date: daysAgo(18), amount: 4500.0, description: "Enterprise Q2 deal" },
        { date: daysAgo(200), amount: 3800.0, description: "Enterprise Q1 deal" },
        { date: daysAgo(380), amount: 3500.0, description: "Initial contract" },
      ],
      return_visit_count: 3,
      last_return_date: daysAgo(200),
      status: "active",
    },
    {
      name: "Jordan Kim",
      phone: "+15553330002",
      email: "jordan.kim@startup.io",
      last_purchase: daysAgo(65),
      spend_history: [
        { date: daysAgo(65), amount: 1200.0, description: "Growth plan deal" },
        { date: daysAgo(190), amount: 900.0, description: "Starter plan" },
      ],
      return_visit_count: 2,
      last_return_date: daysAgo(190),
      status: "active",
    },
    {
      name: "Patricia Moore",
      phone: "+15553330003",
      email: "p.moore@globalcorp.com",
      last_purchase: daysAgo(150),
      spend_history: [
        { date: daysAgo(150), amount: 8000.0, description: "Enterprise annual" },
        { date: daysAgo(520), amount: 6000.0, description: "Enterprise annual" },
      ],
      return_visit_count: 2,
      last_return_date: daysAgo(520),
      status: "lapsed",
    },
    {
      name: "Marcus Webb",
      phone: "+15553330004",
      email: "m.webb@techco.com",
      last_purchase: daysAgo(30),
      spend_history: [
        { date: daysAgo(30), amount: 2200.0, description: "Pro plan Q2" },
        { date: daysAgo(120), amount: 2000.0, description: "Pro plan Q1" },
        { date: daysAgo(210), amount: 1800.0, description: "Pro plan initial" },
      ],
      return_visit_count: 3,
      last_return_date: daysAgo(120),
      status: "active",
    },
    {
      name: "Sarah Okonkwo",
      phone: "+15553330005",
      email: "sarah.o@media.co",
      last_purchase: daysAgo(5),
      spend_history: [
        { date: daysAgo(5), amount: 500.0, description: "Pilot deal" },
      ],
      return_visit_count: 1,
      last_return_date: null,
      status: "active",
    },
  ];
}

function cloverMockCustomers(): ExtractedCustomer[] {
  // Clover is popular with small retail & quick-service restaurants
  return [
    {
      name: "Bianca Torres",
      phone: "+15555550001",
      email: "bianca.t@example.com",
      last_purchase: daysAgo(6),
      spend_history: [
        { date: daysAgo(6), amount: 34.0, description: "Retail purchase" },
        { date: daysAgo(20), amount: 27.5, description: "Retail purchase" },
        { date: daysAgo(50), amount: 41.0, description: "Retail purchase" },
      ],
      return_visit_count: 3,
      last_return_date: daysAgo(20),
      status: "active",
    },
    {
      name: "Derek Walsh",
      phone: "+15555550002",
      email: "derek.w@example.com",
      last_purchase: daysAgo(70),
      spend_history: [
        { date: daysAgo(70), amount: 58.0, description: "Weekend purchase" },
        { date: daysAgo(140), amount: 45.5, description: "Purchase" },
        { date: daysAgo(210), amount: 62.0, description: "Bulk order" },
      ],
      return_visit_count: 3,
      last_return_date: daysAgo(140),
      status: "lapsed",
    },
    {
      name: "Fatima Al-Hassan",
      phone: "+15555550003",
      email: "fatima.h@example.com",
      last_purchase: daysAgo(1),
      spend_history: [
        { date: daysAgo(1), amount: 19.0, description: "Quick purchase" },
        { date: daysAgo(8), amount: 23.5, description: "Purchase" },
        { date: daysAgo(15), amount: 18.0, description: "Purchase" },
        { date: daysAgo(22), amount: 25.0, description: "Weekend purchase" },
      ],
      return_visit_count: 4,
      last_return_date: daysAgo(8),
      status: "active",
    },
    {
      name: "Greg Patterson",
      phone: "+15555550004",
      email: "greg.p@example.com",
      last_purchase: daysAgo(160),
      spend_history: [
        { date: daysAgo(160), amount: 89.0, description: "Large order" },
        { date: daysAgo(320), amount: 76.5, description: "Large order" },
      ],
      return_visit_count: 2,
      last_return_date: daysAgo(320),
      status: "lapsed",
    },
    {
      name: "Helen Nakamura",
      phone: "+15555550005",
      email: "helen.n@example.com",
      last_purchase: daysAgo(10),
      spend_history: [
        { date: daysAgo(10), amount: 31.0, description: "Purchase" },
      ],
      return_visit_count: 1,
      last_return_date: null,
      status: "active",
    },
    {
      name: "Ivan Petrov",
      phone: "+15555550006",
      email: "ivan.p@example.com",
      last_purchase: daysAgo(35),
      spend_history: [
        { date: daysAgo(35), amount: 47.5, description: "Purchase" },
        { date: daysAgo(80), amount: 52.0, description: "Purchase" },
      ],
      return_visit_count: 2,
      last_return_date: daysAgo(80),
      status: "active",
    },
  ];
}

function toastMockCustomers(): ExtractedCustomer[] {
  // Toast is a restaurant POS — similar shape to Square but different menu items
  return [
    {
      name: "Rosa Hernandez",
      phone: "+15554440001",
      email: "rosa.h@example.com",
      last_purchase: daysAgo(4),
      spend_history: [
        { date: daysAgo(4), amount: 38.5, description: "Dinner — Table 5" },
        { date: daysAgo(11), amount: 24.0, description: "Lunch — Bar seating" },
        { date: daysAgo(25), amount: 52.0, description: "Dinner — Table 2" },
        { date: daysAgo(39), amount: 19.5, description: "Happy hour" },
        { date: daysAgo(60), amount: 44.0, description: "Dinner — Table 5" },
      ],
      return_visit_count: 5,
      last_return_date: daysAgo(11),
      status: "active",
    },
    {
      name: "Kevin O'Brien",
      phone: "+15554440002",
      email: "kevin.ob@example.com",
      last_purchase: daysAgo(88),
      spend_history: [
        { date: daysAgo(88), amount: 62.0, description: "Weekend dinner" },
        { date: daysAgo(130), amount: 41.5, description: "Dinner" },
        { date: daysAgo(185), amount: 55.0, description: "Birthday reservation" },
      ],
      return_visit_count: 3,
      last_return_date: daysAgo(130),
      status: "lapsed",
    },
    {
      name: "Yuki Tanaka",
      phone: "+15554440003",
      email: "yuki.t@example.com",
      last_purchase: daysAgo(2),
      spend_history: [
        { date: daysAgo(2), amount: 15.0, description: "Lunch special" },
        { date: daysAgo(9), amount: 18.5, description: "Lunch" },
        { date: daysAgo(16), amount: 22.0, description: "Lunch" },
        { date: daysAgo(23), amount: 17.5, description: "Lunch" },
        { date: daysAgo(30), amount: 14.0, description: "Lunch" },
        { date: daysAgo(37), amount: 20.0, description: "Lunch" },
      ],
      return_visit_count: 6,
      last_return_date: daysAgo(9),
      status: "active",
    },
    {
      name: "Denise Carter",
      phone: "+15554440004",
      email: "denise.c@example.com",
      last_purchase: daysAgo(45),
      spend_history: [
        { date: daysAgo(45), amount: 71.0, description: "Group dinner" },
        { date: daysAgo(90), amount: 48.5, description: "Dinner" },
      ],
      return_visit_count: 2,
      last_return_date: daysAgo(90),
      status: "lapsed",
    },
    {
      name: "Omar Al-Rashid",
      phone: "+15554440005",
      email: "omar.r@example.com",
      last_purchase: daysAgo(6),
      spend_history: [
        { date: daysAgo(6), amount: 27.5, description: "Dinner for one" },
      ],
      return_visit_count: 1,
      last_return_date: null,
      status: "active",
    },
  ];
}

function mindbodyMockCustomers(): ExtractedCustomer[] {
  // Mindbody: fitness studios, yoga, wellness
  return [
    {
      name: "Claire Anderson",
      phone: "+15556660001",
      email: "claire.a@example.com",
      last_purchase: daysAgo(5),
      spend_history: [
        { date: daysAgo(5), amount: 25.0, description: "Drop-in yoga class" },
        { date: daysAgo(35), amount: 120.0, description: "Monthly membership" },
        { date: daysAgo(65), amount: 120.0, description: "Monthly membership" },
        { date: daysAgo(95), amount: 120.0, description: "Monthly membership" },
      ],
      return_visit_count: 4,
      last_return_date: daysAgo(35),
      status: "active",
    },
    {
      name: "Brandon Lee",
      phone: "+15556660002",
      email: "brandon.l@example.com",
      last_purchase: daysAgo(80),
      spend_history: [
        { date: daysAgo(80), amount: 120.0, description: "Monthly membership" },
        { date: daysAgo(110), amount: 120.0, description: "Monthly membership" },
        { date: daysAgo(140), amount: 85.0, description: "10-class pack" },
      ],
      return_visit_count: 3,
      last_return_date: daysAgo(110),
      status: "lapsed",
    },
    {
      name: "Nina Patel",
      phone: "+15556660003",
      email: "nina.p@example.com",
      last_purchase: daysAgo(3),
      spend_history: [
        { date: daysAgo(3), amount: 150.0, description: "Personal training session" },
        { date: daysAgo(10), amount: 150.0, description: "Personal training session" },
        { date: daysAgo(17), amount: 150.0, description: "Personal training session" },
        { date: daysAgo(24), amount: 150.0, description: "Personal training session" },
        { date: daysAgo(31), amount: 500.0, description: "8-session PT package" },
      ],
      return_visit_count: 5,
      last_return_date: daysAgo(10),
      status: "active",
    },
    {
      name: "Marcus Young",
      phone: "+15556660004",
      email: "marcus.y@example.com",
      last_purchase: daysAgo(200),
      spend_history: [
        { date: daysAgo(200), amount: 120.0, description: "Monthly membership" },
        { date: daysAgo(230), amount: 120.0, description: "Monthly membership" },
      ],
      return_visit_count: 2,
      last_return_date: daysAgo(230),
      status: "lapsed",
    },
    {
      name: "Talia Green",
      phone: "+15556660005",
      email: "talia.g@example.com",
      last_purchase: daysAgo(7),
      spend_history: [
        { date: daysAgo(7), amount: 25.0, description: "Drop-in class" },
      ],
      return_visit_count: 1,
      last_return_date: null,
      status: "active",
    },
  ];
}

function vagaroMockCustomers(): ExtractedCustomer[] {
  // Vagaro: salons, spas, beauty services
  return [
    {
      name: "Jasmine Brooks",
      phone: "+15557770001",
      email: "jasmine.b@example.com",
      last_purchase: daysAgo(28),
      spend_history: [
        { date: daysAgo(28), amount: 85.0, description: "Haircut & color" },
        { date: daysAgo(56), amount: 90.0, description: "Full color treatment" },
        { date: daysAgo(84), amount: 75.0, description: "Haircut & style" },
        { date: daysAgo(112), amount: 110.0, description: "Highlights" },
      ],
      return_visit_count: 4,
      last_return_date: daysAgo(56),
      status: "active",
    },
    {
      name: "Tyler Reed",
      phone: "+15557770002",
      email: "tyler.r@example.com",
      last_purchase: daysAgo(95),
      spend_history: [
        { date: daysAgo(95), amount: 45.0, description: "Men's cut & style" },
        { date: daysAgo(160), amount: 45.0, description: "Men's cut & style" },
        { date: daysAgo(225), amount: 55.0, description: "Cut, style & beard" },
      ],
      return_visit_count: 3,
      last_return_date: daysAgo(160),
      status: "lapsed",
    },
    {
      name: "Monique Davis",
      phone: "+15557770003",
      email: "monique.d@example.com",
      last_purchase: daysAgo(14),
      spend_history: [
        { date: daysAgo(14), amount: 130.0, description: "Spa facial & massage" },
        { date: daysAgo(44), amount: 95.0, description: "Massage 60 min" },
        { date: daysAgo(74), amount: 145.0, description: "Full spa day" },
        { date: daysAgo(104), amount: 95.0, description: "Massage 60 min" },
        { date: daysAgo(134), amount: 130.0, description: "Facial & massage" },
      ],
      return_visit_count: 5,
      last_return_date: daysAgo(44),
      status: "active",
    },
    {
      name: "Amy Foster",
      phone: "+15557770004",
      email: "amy.f@example.com",
      last_purchase: daysAgo(4),
      spend_history: [
        { date: daysAgo(4), amount: 55.0, description: "Gel nails" },
        { date: daysAgo(18), amount: 60.0, description: "Full set & pedicure" },
        { date: daysAgo(32), amount: 50.0, description: "Gel fill" },
      ],
      return_visit_count: 3,
      last_return_date: daysAgo(18),
      status: "active",
    },
    {
      name: "Rafael Gomez",
      phone: "+15557770005",
      email: "rafael.g@example.com",
      last_purchase: daysAgo(150),
      spend_history: [
        { date: daysAgo(150), amount: 65.0, description: "Hair service" },
        { date: daysAgo(300), amount: 60.0, description: "Hair service" },
      ],
      return_visit_count: 2,
      last_return_date: daysAgo(300),
      status: "lapsed",
    },
  ];
}

function shopifyMockCustomers(): ExtractedCustomer[] {
  // Shopify: e-commerce, online retail
  return [
    {
      name: "Zoe Harrison",
      phone: "+15558880001",
      email: "zoe.h@example.com",
      last_purchase: daysAgo(9),
      spend_history: [
        { date: daysAgo(9), amount: 68.0, description: "Online order #1042" },
        { date: daysAgo(45), amount: 123.5, description: "Online order #987" },
        { date: daysAgo(90), amount: 54.0, description: "Online order #801" },
        { date: daysAgo(150), amount: 89.0, description: "Online order #634" },
      ],
      return_visit_count: 4,
      last_return_date: daysAgo(45),
      status: "active",
    },
    {
      name: "Paul Martinez",
      phone: "+15558880002",
      email: "paul.m@example.com",
      last_purchase: daysAgo(110),
      spend_history: [
        { date: daysAgo(110), amount: 245.0, description: "Online order #1102" },
        { date: daysAgo(280), amount: 189.0, description: "Online order #756" },
      ],
      return_visit_count: 2,
      last_return_date: daysAgo(280),
      status: "lapsed",
    },
    {
      name: "Sandra Kwon",
      phone: "+15558880003",
      email: "sandra.k@example.com",
      last_purchase: daysAgo(3),
      spend_history: [
        { date: daysAgo(3), amount: 37.0, description: "Online order #1189" },
        { date: daysAgo(21), amount: 42.5, description: "Online order #1150" },
        { date: daysAgo(39), amount: 55.0, description: "Online order #1098" },
        { date: daysAgo(57), amount: 31.0, description: "Online order #1055" },
        { date: daysAgo(75), amount: 48.0, description: "Online order #1002" },
        { date: daysAgo(93), amount: 62.0, description: "Online order #949" },
      ],
      return_visit_count: 6,
      last_return_date: daysAgo(21),
      status: "active",
    },
    {
      name: "Lucas Evans",
      phone: "+15558880004",
      email: "lucas.e@example.com",
      last_purchase: daysAgo(60),
      spend_history: [
        { date: daysAgo(60), amount: 78.0, description: "Online order #1022" },
        { date: daysAgo(120), amount: 91.5, description: "Online order #876" },
        { date: daysAgo(180), amount: 64.0, description: "Online order #720" },
      ],
      return_visit_count: 3,
      last_return_date: daysAgo(120),
      status: "active",
    },
    {
      name: "Diana Chu",
      phone: "+15558880005",
      email: "diana.c@example.com",
      last_purchase: daysAgo(14),
      spend_history: [
        { date: daysAgo(14), amount: 155.0, description: "Online order #1168" },
      ],
      return_visit_count: 1,
      last_return_date: null,
      status: "active",
    },
  ];
}

function jobberMockCustomers(): ExtractedCustomer[] {
  // Jobber: home services (landscaping, cleaning, HVAC, plumbing)
  return [
    {
      name: "Robert Simmons",
      phone: "+15559990001",
      email: "robert.s@example.com",
      last_purchase: daysAgo(22),
      spend_history: [
        { date: daysAgo(22), amount: 280.0, description: "Lawn maintenance" },
        { date: daysAgo(50), amount: 280.0, description: "Lawn maintenance" },
        { date: daysAgo(78), amount: 320.0, description: "Lawn + hedge trim" },
        { date: daysAgo(106), amount: 280.0, description: "Lawn maintenance" },
      ],
      return_visit_count: 4,
      last_return_date: daysAgo(50),
      status: "active",
    },
    {
      name: "Angela Price",
      phone: "+15559990002",
      email: "angela.p@example.com",
      last_purchase: daysAgo(130),
      spend_history: [
        { date: daysAgo(130), amount: 450.0, description: "HVAC tune-up" },
        { date: daysAgo(490), amount: 380.0, description: "HVAC annual service" },
      ],
      return_visit_count: 2,
      last_return_date: daysAgo(490),
      status: "lapsed",
    },
    {
      name: "Kevin Nguyen",
      phone: "+15559990003",
      email: "kevin.n@example.com",
      last_purchase: daysAgo(8),
      spend_history: [
        { date: daysAgo(8), amount: 195.0, description: "House cleaning" },
        { date: daysAgo(22), amount: 195.0, description: "House cleaning" },
        { date: daysAgo(36), amount: 195.0, description: "House cleaning" },
        { date: daysAgo(50), amount: 220.0, description: "Deep clean" },
        { date: daysAgo(78), amount: 195.0, description: "House cleaning" },
      ],
      return_visit_count: 5,
      last_return_date: daysAgo(22),
      status: "active",
    },
    {
      name: "Cheryl Adams",
      phone: "+15559990004",
      email: "cheryl.a@example.com",
      last_purchase: daysAgo(180),
      spend_history: [
        { date: daysAgo(180), amount: 850.0, description: "Fence installation" },
      ],
      return_visit_count: 1,
      last_return_date: null,
      status: "lapsed",
    },
    {
      name: "Mike Douglas",
      phone: "+15559990005",
      email: "mike.d@example.com",
      last_purchase: daysAgo(11),
      spend_history: [
        { date: daysAgo(11), amount: 340.0, description: "Plumbing repair" },
        { date: daysAgo(220), amount: 175.0, description: "Drain cleaning" },
      ],
      return_visit_count: 2,
      last_return_date: daysAgo(220),
      status: "active",
    },
  ];
}

function housecallMockCustomers(): ExtractedCustomer[] {
  // Housecall Pro: HVAC, electrical, plumbing, pest control
  return [
    {
      name: "Patricia Young",
      phone: "+15551110101",
      email: "patricia.y@example.com",
      last_purchase: daysAgo(17),
      spend_history: [
        { date: daysAgo(17), amount: 420.0, description: "AC service & repair" },
        { date: daysAgo(380), amount: 390.0, description: "AC annual tune-up" },
        { date: daysAgo(745), amount: 360.0, description: "AC service" },
      ],
      return_visit_count: 3,
      last_return_date: daysAgo(380),
      status: "active",
    },
    {
      name: "Frank Dixon",
      phone: "+15551110102",
      email: "frank.d@example.com",
      last_purchase: daysAgo(55),
      spend_history: [
        { date: daysAgo(55), amount: 275.0, description: "Electrical panel repair" },
        { date: daysAgo(400), amount: 185.0, description: "Outlet installation" },
      ],
      return_visit_count: 2,
      last_return_date: daysAgo(400),
      status: "active",
    },
    {
      name: "Grace Kim",
      phone: "+15551110103",
      email: "grace.k@example.com",
      last_purchase: daysAgo(92),
      spend_history: [
        { date: daysAgo(92), amount: 140.0, description: "Quarterly pest control" },
        { date: daysAgo(184), amount: 140.0, description: "Quarterly pest control" },
        { date: daysAgo(276), amount: 140.0, description: "Quarterly pest control" },
        { date: daysAgo(368), amount: 140.0, description: "Quarterly pest control" },
      ],
      return_visit_count: 4,
      last_return_date: daysAgo(184),
      status: "lapsed",
    },
    {
      name: "Harold Bell",
      phone: "+15551110104",
      email: "harold.b@example.com",
      last_purchase: daysAgo(5),
      spend_history: [
        { date: daysAgo(5), amount: 680.0, description: "Water heater replacement" },
      ],
      return_visit_count: 1,
      last_return_date: null,
      status: "active",
    },
    {
      name: "Iris Coleman",
      phone: "+15551110105",
      email: "iris.c@example.com",
      last_purchase: daysAgo(140),
      spend_history: [
        { date: daysAgo(140), amount: 310.0, description: "Furnace inspection" },
        { date: daysAgo(500), amount: 290.0, description: "Furnace tune-up" },
      ],
      return_visit_count: 2,
      last_return_date: daysAgo(500),
      status: "lapsed",
    },
  ];
}
