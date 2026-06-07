import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card";
import { formatCurrency, formatDate } from "@/utils/helpers";
import type { Business } from "@/utils/database.types";

function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

const PLAN_PRICE: Record<string, number> = {
  starter: 199,
  growth: 399,
  pro: 699,
};

export default async function AdminPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const adminEmails = getAdminEmails();
  const isAdmin =
    adminEmails.length > 0 &&
    !!user.email &&
    adminEmails.includes(user.email.toLowerCase());

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-base">
        <Navbar email={user.email} />
        <main className="mx-auto max-w-3xl px-4 py-16 text-center">
          <h1 className="font-heading text-xl font-semibold text-content">Admin access required</h1>
          <p className="mt-2 text-sm text-content-muted">
            Your account isn&apos;t on the admin allowlist. Add your email to the{" "}
            <code className="mx-1 rounded border border-line bg-surface px-1 font-mono text-xs text-content">
              ADMIN_EMAILS
            </code>{" "}
            environment variable to view this page.
          </p>
        </main>
      </div>
    );
  }

  const [
    { data: businesses },
    { data: allCustomers },
    { data: allMessages },
    { data: allSubscriptions },
  ] = await Promise.all([
    supabase.from("businesses").select("*").order("created_at", { ascending: false }),
    supabase.from("customers").select("id, business_id"),
    supabase.from("messages").select("id, business_id, sent_at, direction").eq("direction", "outbound"),
    supabase.from("subscriptions").select("*"),
  ]);

  const businessList = (businesses ?? []) as Business[];

  const customerCountByBiz = new Map<string, number>();
  for (const c of allCustomers ?? []) {
    customerCountByBiz.set(c.business_id, (customerCountByBiz.get(c.business_id) ?? 0) + 1);
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const msgThisMonthByBiz = new Map<string, number>();
  for (const m of allMessages ?? []) {
    if (m.sent_at && m.sent_at >= startOfMonth) {
      msgThisMonthByBiz.set(m.business_id, (msgThisMonthByBiz.get(m.business_id) ?? 0) + 1);
    }
  }

  const subByBiz = new Map<string, { plan: string; status: string }>();
  for (const s of allSubscriptions ?? []) {
    subByBiz.set(s.business_id, { plan: s.plan, status: s.status });
  }

  const totalCustomers = allCustomers?.length ?? 0;
  const totalMessages = allMessages?.length ?? 0;
  const totalMrr = (allSubscriptions ?? [])
    .filter((s) => s.status === "active")
    .reduce((sum, s) => sum + (PLAN_PRICE[s.plan] ?? 0), 0);

  return (
    <div className="min-h-screen bg-base">
      <Navbar email={user.email} isAdmin />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-6 font-heading text-2xl font-semibold tracking-tight text-content">
          Admin overview
        </h1>

        {/* Platform stats */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Total businesses", value: String(businessList.length) },
            { label: "Total customers", value: String(totalCustomers) },
            { label: "Total messages sent", value: String(totalMessages) },
            { label: "Monthly MRR", value: formatCurrency(totalMrr) },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-card border border-line bg-surface p-4">
              <p className="font-mono text-2xl font-semibold text-content">{value}</p>
              <p className="mt-1 text-xs text-content-muted">{label}</p>
            </div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Businesses ({businessList.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {businessList.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-content-muted">
                No businesses have signed up yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-content-muted">
                      <th className="px-5 py-2 font-medium">Name</th>
                      <th className="px-5 py-2 font-medium">Industry</th>
                      <th className="px-5 py-2 font-medium">Plan</th>
                      <th className="px-5 py-2 font-medium">Customers</th>
                      <th className="px-5 py-2 font-medium">Msgs this mo</th>
                      <th className="px-5 py-2 font-medium">Sub status</th>
                      <th className="px-5 py-2 font-medium">Joined</th>
                      <th className="px-5 py-2 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {businessList.map((business) => {
                      const sub = subByBiz.get(business.id);
                      return (
                        <tr
                          key={business.id}
                          className="border-b border-line last:border-0 transition-colors hover:bg-surface/50"
                        >
                          <td className="px-5 py-3 font-medium text-content">{business.name}</td>
                          <td className="px-5 py-3 text-content-muted">{business.industry ?? "—"}</td>
                          <td className="px-5 py-3 text-content-muted capitalize">{sub?.plan ?? "—"}</td>
                          <td className="px-5 py-3 font-mono text-content-muted">
                            {customerCountByBiz.get(business.id) ?? 0}
                          </td>
                          <td className="px-5 py-3 font-mono text-content-muted">
                            {msgThisMonthByBiz.get(business.id) ?? 0}
                          </td>
                          <td className="px-5 py-3">
                            {sub ? (
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                  sub.status === "active"
                                    ? "bg-green-500/10 text-green-400"
                                    : "bg-yellow-500/10 text-yellow-400"
                                }`}
                              >
                                {sub.status}
                              </span>
                            ) : (
                              <span className="text-xs text-content-muted">none</span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-content-muted">{formatDate(business.created_at)}</td>
                          <td className="px-5 py-3">
                            <a
                              href={`/dashboard?impersonate=${business.id}`}
                              className="text-xs text-accent hover:underline"
                            >
                              View dashboard
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
