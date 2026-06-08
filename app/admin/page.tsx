import { redirect } from "next/navigation";
import { createClient as createAuthClient } from "@/lib/supabase/server";
import { createClient as createServiceSupabase } from "@supabase/supabase-js";
import { Navbar } from "@/components/Navbar";
import { formatCurrency } from "@/utils/helpers";
import type { Business } from "@/utils/database.types";
import { AdminClient } from "./AdminClient";

function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
}

const PLAN_PRICE: Record<string, number> = {
  starter: 199,
  growth: 399,
  pro: 699,
};

function serviceClient() {
  return createServiceSupabase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export default async function AdminPage() {
  const supabase = createAuthClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const adminEmails = getAdminEmails();
  const isAdmin = adminEmails.length > 0 && !!user.email && adminEmails.includes(user.email.toLowerCase());

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

  const sc = serviceClient();

  const [
    { data: businesses },
    { data: allCustomers },
    { data: allMessages },
    { data: allSubscriptions },
    { data: recentMessagesRaw },
  ] = await Promise.all([
    sc.from("businesses").select("*").order("created_at", { ascending: false }),
    sc.from("customers").select("id, business_id"),
    sc.from("messages").select("id, business_id, customer_id, sent_at, direction, content, status"),
    sc.from("subscriptions").select("*"),
    sc.from("messages").select("id, business_id, customer_id, content, sent_at, direction, status")
      .order("sent_at", { ascending: false }).limit(20),
  ]);

  const businessList = (businesses ?? []) as Business[];

  // Customer counts
  const customerCountByBiz = new Map<string, number>();
  for (const c of allCustomers ?? []) {
    customerCountByBiz.set(c.business_id, (customerCountByBiz.get(c.business_id) ?? 0) + 1);
  }

  // Messages this month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const msgThisMonthByBiz = new Map<string, number>();
  for (const m of allMessages ?? []) {
    if (m.direction === "outbound" && m.sent_at && m.sent_at >= startOfMonth) {
      msgThisMonthByBiz.set(m.business_id, (msgThisMonthByBiz.get(m.business_id) ?? 0) + 1);
    }
  }

  // Reply rate per biz
  const outboundByBiz = new Map<string, number>();
  const inboundByBiz = new Map<string, number>();
  for (const m of allMessages ?? []) {
    if (m.direction === "outbound") outboundByBiz.set(m.business_id, (outboundByBiz.get(m.business_id) ?? 0) + 1);
    else inboundByBiz.set(m.business_id, (inboundByBiz.get(m.business_id) ?? 0) + 1);
  }
  const replyRateByBiz = new Map<string, number>();
  for (const [bizId, out] of Array.from(outboundByBiz.entries())) {
    const inb = inboundByBiz.get(bizId) ?? 0;
    replyRateByBiz.set(bizId, out > 0 ? Math.round((inb / out) * 100) : 0);
  }

  // Last activity per biz
  const lastActivityByBiz = new Map<string, string>();
  for (const m of allMessages ?? []) {
    if (m.direction === "outbound" && m.sent_at) {
      const cur = lastActivityByBiz.get(m.business_id);
      if (!cur || m.sent_at > cur) lastActivityByBiz.set(m.business_id, m.sent_at);
    }
  }

  // Subscription lookup
  const subByBiz = new Map<string, { plan: string; status: string; msgUsed: number; msgLimit: number | null }>();
  for (const s of allSubscriptions ?? []) {
    subByBiz.set(s.business_id, {
      plan: s.plan, status: s.status,
      msgUsed: s.message_count_this_period ?? 0,
      msgLimit: s.message_limit ?? null,
    });
  }

  // Build business rows for client
  const businessRows = businessList.map((b) => {
    const sub = subByBiz.get(b.id);
    return {
      id: b.id,
      name: b.name,
      industry: b.industry,
      created_at: b.created_at,
      plan: sub?.plan ?? null,
      planStatus: sub?.status ?? null,
      customers: customerCountByBiz.get(b.id) ?? 0,
      msgsThisMonth: msgThisMonthByBiz.get(b.id) ?? 0,
      replyRate: replyRateByBiz.get(b.id) ?? 0,
      lastActivity: lastActivityByBiz.get(b.id) ?? null,
      msgUsed: sub?.msgUsed ?? 0,
      msgLimit: sub?.msgLimit ?? null,
    };
  });

  // Totals
  const totalMrr = (allSubscriptions ?? [])
    .filter((s) => s.status === "active")
    .reduce((sum, s) => sum + (PLAN_PRICE[s.plan] ?? 0), 0);
  const totalCustomers = allCustomers?.length ?? 0;
  const totalMsgsThisMonth = Array.from(msgThisMonthByBiz.values()).reduce((a, b) => a + b, 0);
  const totalOut = allMessages?.filter((m) => m.direction === "outbound").length ?? 0;
  const totalIn = allMessages?.filter((m) => m.direction === "inbound").length ?? 0;
  const platformReplyRate = totalOut > 0 ? Math.round((totalIn / totalOut) * 100) : 0;

  // MRR by month (last 6)
  const mrrByMonth = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const mrr = (allSubscriptions ?? [])
      .filter((s) => s.created_at.slice(0, 7) <= monthStr && (s.status === "active" || s.status === "trialing"))
      .reduce((sum, s) => sum + (PLAN_PRICE[s.plan] ?? 0), 0);
    return { month: monthStr.slice(5), mrr };
  });

  // Revenue by plan (pie)
  const planMrr = new Map<string, number>();
  for (const s of allSubscriptions ?? []) {
    if (s.status === "active") planMrr.set(s.plan, (planMrr.get(s.plan) ?? 0) + (PLAN_PRICE[s.plan] ?? 0));
  }
  const revenueByPlan = Array.from(planMrr.entries()).map(([name, value]) => ({ name, value }));

  // Alerts
  const inactive7 = businessList
    .filter((b) => {
      const la = lastActivityByBiz.get(b.id);
      if (!la) return false;
      return Math.floor((Date.now() - new Date(la).getTime()) / 86400000) >= 7;
    })
    .map((b) => {
      const la = lastActivityByBiz.get(b.id)!;
      const days = Math.floor((Date.now() - new Date(la).getTime()) / 86400000);
      return { id: b.id, name: b.name, detail: `${days} days since last message` };
    });

  const nearLimit = businessList
    .filter((b) => {
      const sub = subByBiz.get(b.id);
      if (!sub?.msgLimit) return false;
      return sub.msgUsed / sub.msgLimit >= 0.8;
    })
    .map((b) => {
      const sub = subByBiz.get(b.id)!;
      const pct = Math.round((sub.msgUsed / sub.msgLimit!) * 100);
      return { id: b.id, name: b.name, detail: `${pct}% of message limit used` };
    });

  const failedPayments = businessList
    .filter((b) => {
      const sub = subByBiz.get(b.id);
      return sub?.status === "past_due" || sub?.status === "unpaid";
    })
    .map((b) => {
      const sub = subByBiz.get(b.id)!;
      return { id: b.id, name: b.name, detail: `Payment ${sub.status}` };
    });

  // Recent messages with business + customer names
  const recentBizIds = Array.from(new Set((recentMessagesRaw ?? []).map((m) => m.business_id)));
  const recentCustIds = Array.from(new Set((recentMessagesRaw ?? []).map((m) => m.customer_id)));
  const [{ data: recentBizNames }, { data: recentCustNames }] = await Promise.all([
    recentBizIds.length > 0 ? sc.from("businesses").select("id, name").in("id", recentBizIds) : Promise.resolve({ data: [] }),
    recentCustIds.length > 0 ? sc.from("customers").select("id, name").in("id", recentCustIds) : Promise.resolve({ data: [] }),
  ]);
  const bizNameMap = new Map((recentBizNames ?? []).map((b: { id: string; name: string }) => [b.id, b.name]));
  const custNameMap = new Map((recentCustNames ?? []).map((c: { id: string; name: string }) => [c.id, c.name]));
  const recentMessages = (recentMessagesRaw ?? []).map((m) => ({
    id: m.id,
    business_id: m.business_id,
    businessName: bizNameMap.get(m.business_id) ?? "Unknown",
    customerName: custNameMap.get(m.customer_id) ?? "Unknown",
    content: m.content,
    sent_at: m.sent_at,
    direction: m.direction,
    status: m.status,
  }));

  return (
    <div className="min-h-screen bg-base">
      <Navbar email={user.email} isAdmin />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-content">Admin overview</h1>
          <p className="text-xs text-content-muted">
            MRR: <span className="font-semibold text-content">{formatCurrency(totalMrr)}</span>
          </p>
        </div>
        <AdminClient
          businesses={businessRows}
          mrrByMonth={mrrByMonth}
          revenueByPlan={revenueByPlan}
          totalMrr={totalMrr}
          totalCustomers={totalCustomers}
          totalMsgsThisMonth={totalMsgsThisMonth}
          platformReplyRate={platformReplyRate}
          inactive7={inactive7}
          nearLimit={nearLimit}
          failedPayments={failedPayments}
          initialRecentMessages={recentMessages}
        />
      </main>
    </div>
  );
}
