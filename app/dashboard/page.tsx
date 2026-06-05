import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { formatCurrency, formatDate, totalSpend } from "@/utils/helpers";
import type { Customer, Message } from "@/utils/database.types";

export default async function DashboardPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!business) {
    redirect("/onboarding");
  }

  const [{ data: customers }, { data: messages }] = await Promise.all([
    supabase
      .from("customers")
      .select("*")
      .eq("business_id", business.id)
      .order("next_contact_date", { ascending: true }),
    supabase
      .from("messages")
      .select("*")
      .eq("business_id", business.id)
      .order("sent_at", { ascending: false })
      .limit(10),
  ]);

  const customerList = (customers ?? []) as Customer[];
  const messageList = (messages ?? []) as Message[];

  const totalCustomers = customerList.length;
  const messagesSent = messageList.filter(
    (m) => m.direction === "outbound"
  ).length;
  const lifetimeValue = customerList.reduce(
    (sum, c) => sum + totalSpend(c.spend_history),
    0
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar email={user.email} />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {business.name}
            </h1>
            <p className="text-sm text-gray-500">
              {business.industry} · {business.voice} voice
            </p>
          </div>
          <Badge tone={business.config?.autopilot ? "green" : "gray"}>
            {business.config?.autopilot ? "Autopilot on" : "Autopilot off"}
          </Badge>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <StatCard label="Customers" value={String(totalCustomers)} />
          <StatCard label="Messages sent" value={String(messagesSent)} />
          <StatCard
            label="Lifetime value"
            value={formatCurrency(lifetimeValue)}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Customers</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {customerList.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-gray-500">
                  No customers yet. Connect a data source or add customers to get
                  started.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-400">
                      <th className="px-5 py-2 font-medium">Name</th>
                      <th className="px-5 py-2 font-medium">Spend</th>
                      <th className="px-5 py-2 font-medium">Last purchase</th>
                      <th className="px-5 py-2 font-medium">Next contact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerList.map((customer) => (
                      <tr
                        key={customer.id}
                        className="border-b border-gray-50 last:border-0"
                      >
                        <td className="px-5 py-3">
                          <div className="font-medium text-gray-900">
                            {customer.name}
                          </div>
                          <div className="text-xs text-gray-400">
                            {customer.phone ?? "no phone"}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-gray-700">
                          {formatCurrency(totalSpend(customer.spend_history))}
                        </td>
                        <td className="px-5 py-3 text-gray-700">
                          {formatDate(customer.last_purchase)}
                        </td>
                        <td className="px-5 py-3 text-gray-700">
                          {formatDate(customer.next_contact_date)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent messages</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {messageList.length === 0 ? (
                <p className="text-sm text-gray-500">No messages sent yet.</p>
              ) : (
                messageList.map((message) => (
                  <div
                    key={message.id}
                    className="rounded-lg border border-gray-100 p-3"
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <Badge
                        tone={
                          message.direction === "inbound" ? "brand" : "gray"
                        }
                      >
                        {message.direction}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {formatDate(message.sent_at)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{message.content}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      </CardContent>
    </Card>
  );
}
