"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  LineChart, Line, BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { formatCurrency, formatDate } from "@/utils/helpers";

interface BusinessRow {
  id: string;
  name: string;
  industry: string | null;
  created_at: string;
  plan: string | null;
  planStatus: string | null;
  customers: number;
  msgsThisMonth: number;
  replyRate: number;
  lastActivity: string | null;
  msgUsed: number;
  msgLimit: number | null;
}

interface RecentMessage {
  id: string;
  business_id: string;
  businessName: string;
  customerName: string;
  content: string;
  sent_at: string | null;
  direction: string;
  status: string;
}

interface Alert {
  id: string;
  name: string;
  detail: string;
}

interface AdminClientProps {
  businesses: BusinessRow[];
  mrrByMonth: { month: string; mrr: number }[];
  revenueByPlan: { name: string; value: number }[];
  totalMrr: number;
  totalCustomers: number;
  totalMsgsThisMonth: number;
  platformReplyRate: number;
  inactive7: Alert[];
  nearLimit: Alert[];
  failedPayments: Alert[];
  initialRecentMessages: RecentMessage[];
}

const PLAN_COLORS: Record<string, string> = {
  starter: "#3B82F6",
  growth: "#22c55e",
  pro: "#a855f7",
  enterprise: "#f59e0b",
};

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-card border border-line bg-surface p-5">
      <p className="font-mono text-2xl font-semibold leading-none tracking-tight text-content">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-content-muted">{sub}</p>}
      <p className="mt-2 text-xs text-content-muted">{label}</p>
    </div>
  );
}

function AlertCard({ title, items, tone }: { title: string; items: Alert[]; tone: "yellow" | "red" | "orange" }) {
  if (items.length === 0) return null;
  const cls = tone === "red" ? "border-red-500/20 bg-red-500/5" : tone === "orange" ? "border-orange-500/20 bg-orange-500/5" : "border-yellow-500/20 bg-yellow-500/5";
  const titleCls = tone === "red" ? "text-red-400" : tone === "orange" ? "text-orange-400" : "text-yellow-400";
  return (
    <div className={`rounded-card border p-4 ${cls}`}>
      <h4 className={`mb-2 text-xs font-semibold uppercase tracking-wide ${titleCls}`}>{title}</h4>
      <div className="space-y-1.5">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-2">
            <div>
              <span className="text-sm font-medium text-content">{item.name}</span>
              <span className="ml-2 text-xs text-content-muted">{item.detail}</span>
            </div>
            <a href={`/dashboard?impersonate=${item.id}`} className="flex-shrink-0 text-xs text-accent hover:underline">
              View
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

type CustomerLight = { id: string; name: string; phone: string | null; last_purchase: string | null };

export function AdminClient({
  businesses,
  mrrByMonth,
  revenueByPlan,
  totalMrr,
  totalCustomers,
  totalMsgsThisMonth,
  platformReplyRate,
  inactive7,
  nearLimit,
  failedPayments,
  initialRecentMessages,
}: AdminClientProps) {
  // Simulation state
  const [simBizId, setSimBizId] = useState("");
  const [simCustomers, setSimCustomers] = useState<CustomerLight[]>([]);
  const [simCustomerId, setSimCustomerId] = useState("");
  const [simLoading, setSimLoading] = useState(false);
  const [simMessage, setSimMessage] = useState<string | null>(null);
  const [simCustomerContext, setSimCustomerContext] = useState<string | null>(null);
  const [simSending, setSimSending] = useState(false);
  const [simSent, setSimSent] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);

  // Activity feed
  const [activityMsgs, setActivityMsgs] = useState<RecentMessage[]>(initialRecentMessages);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const refreshActivity = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/activity");
      if (!res.ok) return;
      const data = (await res.json()) as { messages: RecentMessage[] };
      setActivityMsgs(data.messages ?? []);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    intervalRef.current = setInterval(() => void refreshActivity(), 60000);
    return () => clearInterval(intervalRef.current);
  }, [refreshActivity]);

  // Load customers when business selected
  useEffect(() => {
    setSimCustomerId("");
    setSimCustomers([]);
    setSimMessage(null);
    setSimError(null);
    setSimSent(false);
    if (!simBizId) return;
    fetch(`/api/admin/customers?businessId=${simBizId}`)
      .then((r) => r.json())
      .then((d: { customers?: CustomerLight[] }) => setSimCustomers(d.customers ?? []))
      .catch(() => setSimCustomers([]));
  }, [simBizId]);

  async function runSimulation() {
    if (!simBizId || !simCustomerId) return;
    setSimLoading(true);
    setSimMessage(null);
    setSimError(null);
    setSimSent(false);
    const customer = simCustomers.find((c) => c.id === simCustomerId);
    if (customer) {
      const days = customer.last_purchase
        ? Math.floor((Date.now() - new Date(customer.last_purchase).getTime()) / 86400000)
        : null;
      setSimCustomerContext(
        [
          customer.name,
          customer.phone ?? "no phone",
          customer.last_purchase ? `last visit ${days}d ago` : "no visit data",
        ].join(" · ")
      );
    }
    try {
      const res = await fetch("/api/admin/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: simBizId, customerId: simCustomerId }),
      });
      const data = (await res.json()) as { message?: string; error?: string };
      if (!res.ok || !data.message) throw new Error(data.error ?? "Generation failed");
      setSimMessage(data.message);
    } catch (e) {
      setSimError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSimLoading(false);
    }
  }

  async function sendForReal() {
    if (!simMessage || !simBizId || !simCustomerId) return;
    setSimSending(true);
    setSimError(null);
    try {
      const res = await fetch("/api/admin/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: simBizId, customerId: simCustomerId, content: simMessage }),
      });
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        throw new Error(d.error ?? "Send failed");
      }
      setSimSent(true);
    } catch (e) {
      setSimError(e instanceof Error ? e.message : "Send failed");
    } finally {
      setSimSending(false);
    }
  }

  const hasAlerts = inactive7.length > 0 || nearLimit.length > 0 || failedPayments.length > 0;

  return (
    <div className="space-y-8">
      {/* Top stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <StatCard label="Total businesses" value={String(businesses.length)} />
        <StatCard label="Total customers" value={totalCustomers.toLocaleString()} />
        <StatCard label="Monthly MRR" value={formatCurrency(totalMrr)} />
        <StatCard label="Messages this month" value={totalMsgsThisMonth.toLocaleString()} />
        <StatCard label="Platform reply rate" value={`${platformReplyRate}%`} />
      </div>

      {/* Charts */}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-card border border-line bg-surface p-5 lg:col-span-2">
          <h3 className="mb-4 font-heading text-sm font-semibold text-content">MRR — last 6 months</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={mrrByMonth} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2D35" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} tickLine={false} axisLine={false}
                tickFormatter={(v: number) => `$${v}`} />
              <Tooltip
                contentStyle={{ background: "#1a1d24", border: "1px solid #2A2D35", borderRadius: "8px", fontSize: "12px" }}
                labelStyle={{ color: "#9ca3af" }} itemStyle={{ color: "#e5e7eb" }}
                formatter={(v: unknown) => [formatCurrency(v as number), "MRR"]}
              />
              <Line type="monotone" dataKey="mrr" stroke="#3B82F6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-card border border-line bg-surface p-5">
          <h3 className="mb-4 font-heading text-sm font-semibold text-content">Revenue by plan</h3>
          {revenueByPlan.length === 0 ? (
            <p className="text-center text-xs text-content-muted py-10">No active subscriptions</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={revenueByPlan} dataKey="value" nameKey="name" cx="50%" cy="50%"
                    outerRadius={70} innerRadius={40} paddingAngle={3}>
                    {revenueByPlan.map((entry, i) => (
                      <Cell key={i} fill={PLAN_COLORS[entry.name] ?? "#6b7280"} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#1a1d24", border: "1px solid #2A2D35", borderRadius: "8px", fontSize: "12px" }}
                    formatter={(v: unknown, name: unknown) => [formatCurrency(v as number), name as string]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 flex flex-wrap justify-center gap-3">
                {revenueByPlan.map((e) => (
                  <div key={e.name} className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ background: PLAN_COLORS[e.name] ?? "#6b7280" }} />
                    <span className="text-xs capitalize text-content-muted">{e.name}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Businesses table */}
      <div className="rounded-card border border-line bg-surface overflow-hidden">
        <div className="border-b border-line px-6 py-4">
          <h2 className="font-heading text-sm font-semibold text-content">Businesses ({businesses.length})</h2>
        </div>
        {businesses.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-content-muted">No businesses yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-content-muted">
                  <th className="px-5 py-2 font-medium">Name</th>
                  <th className="px-5 py-2 font-medium">Industry</th>
                  <th className="px-5 py-2 font-medium">Plan</th>
                  <th className="px-5 py-2 font-medium">Customers</th>
                  <th className="px-5 py-2 font-medium">Msgs / mo</th>
                  <th className="px-5 py-2 font-medium">Reply rate</th>
                  <th className="px-5 py-2 font-medium">Last active</th>
                  <th className="px-5 py-2 font-medium">Status</th>
                  <th className="px-5 py-2 font-medium">Joined</th>
                  <th className="px-5 py-2" />
                </tr>
              </thead>
              <tbody>
                {businesses.map((biz) => {
                  const daysInactive = biz.lastActivity
                    ? Math.floor((Date.now() - new Date(biz.lastActivity).getTime()) / 86400000)
                    : null;
                  const statusColor =
                    biz.planStatus === "active"
                      ? "bg-green-500/10 text-green-400"
                      : biz.planStatus === "trialing"
                      ? "bg-yellow-500/10 text-yellow-400"
                      : biz.planStatus === "past_due" || biz.planStatus === "unpaid"
                      ? "bg-red-500/10 text-red-400"
                      : "bg-line text-content-muted";

                  return (
                    <tr key={biz.id} className="border-b border-line last:border-0 hover:bg-surface/50 transition-colors">
                      <td className="px-5 py-3 font-medium text-content">{biz.name}</td>
                      <td className="px-5 py-3 text-content-muted">{biz.industry ?? "—"}</td>
                      <td className="px-5 py-3 text-content-muted capitalize">{biz.plan ?? "—"}</td>
                      <td className="px-5 py-3 font-mono text-content-muted">{biz.customers}</td>
                      <td className="px-5 py-3 font-mono text-content-muted">{biz.msgsThisMonth}</td>
                      <td className="px-5 py-3">
                        <span className={`font-mono text-xs font-medium ${biz.replyRate >= 20 ? "text-green-400" : biz.replyRate >= 5 ? "text-yellow-400" : "text-content-muted"}`}>
                          {biz.replyRate}%
                        </span>
                      </td>
                      <td className="px-5 py-3 text-content-muted">
                        {daysInactive !== null
                          ? <span className={daysInactive >= 7 ? "text-yellow-400" : "text-content-muted"}>{daysInactive}d ago</span>
                          : "—"
                        }
                      </td>
                      <td className="px-5 py-3">
                        {biz.planStatus ? (
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor}`}>
                            {biz.planStatus}
                          </span>
                        ) : (
                          <span className="text-xs text-content-muted">none</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-content-muted">{formatDate(biz.created_at)}</td>
                      <td className="px-5 py-3">
                        <a href={`/dashboard?impersonate=${biz.id}`} className="text-xs text-accent hover:underline">View</a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Alerts */}
      {hasAlerts && (
        <div>
          <h2 className="mb-3 font-heading text-sm font-semibold text-content">Alerts</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <AlertCard title={`Inactive 7+ days (${inactive7.length})`} items={inactive7} tone="yellow" />
            <AlertCard title={`Near message limit (${nearLimit.length})`} items={nearLimit} tone="orange" />
            <AlertCard title={`Failed payments (${failedPayments.length})`} items={failedPayments} tone="red" />
          </div>
        </div>
      )}

      {/* Simulation */}
      <div className="rounded-card border border-line bg-surface p-6">
        <h2 className="mb-1 font-heading text-sm font-semibold text-content">Message simulation</h2>
        <p className="mb-5 text-xs text-content-muted">
          Preview what Claude generates for any business + customer combination.
        </p>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-content-muted">Business</label>
              <select
                className="w-full rounded-btn border border-line bg-base px-3 py-2 text-sm text-content focus:border-accent focus:outline-none"
                value={simBizId}
                onChange={(e) => setSimBizId(e.target.value)}
              >
                <option value="">Select a business…</option>
                {businesses.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-content-muted">Customer</label>
              <select
                className="w-full rounded-btn border border-line bg-base px-3 py-2 text-sm text-content focus:border-accent focus:outline-none disabled:opacity-50"
                value={simCustomerId}
                onChange={(e) => setSimCustomerId(e.target.value)}
                disabled={simCustomers.length === 0}
              >
                <option value="">
                  {simBizId && simCustomers.length === 0 ? "Loading…" : "Select a customer…"}
                </option>
                {simCustomers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => void runSimulation()}
              disabled={!simBizId || !simCustomerId || simLoading}
              className="inline-flex h-9 items-center gap-2 rounded-btn bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {simLoading ? (
                <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />Generating…</>
              ) : "Simulate message"}
            </button>
          </div>

          <div className="flex flex-col justify-between">
            {simCustomerContext && (
              <p className="mb-2 text-[10px] font-medium uppercase tracking-widest text-content-muted">
                {simCustomerContext}
              </p>
            )}
            <div className={`min-h-[80px] flex-1 rounded-card border p-4 text-sm ${simMessage ? "border-accent/30 bg-accent/5" : "border-line bg-base"}`}>
              {simLoading ? (
                <span className="text-xs text-content-muted">Generating…</span>
              ) : simMessage ? (
                <p className="text-content leading-relaxed">{simMessage}</p>
              ) : (
                <p className="text-xs text-content-muted">Generated message will appear here.</p>
              )}
            </div>
            {simError && <p className="mt-2 text-xs text-danger">{simError}</p>}
            {simMessage && !simSent && (
              <button
                type="button"
                onClick={() => void sendForReal()}
                disabled={simSending}
                className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-btn border border-danger/40 px-3 text-xs font-medium text-danger hover:bg-danger/5 transition-colors disabled:opacity-50"
              >
                {simSending ? "Sending…" : "Send for real"}
              </button>
            )}
            {simSent && (
              <p className="mt-2 text-xs text-green-400 font-medium">Sent successfully.</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="rounded-card border border-line bg-surface overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-6 py-4">
          <h2 className="font-heading text-sm font-semibold text-content">Recent activity</h2>
          <span className="text-[10px] text-content-muted">Refreshes every 60s</span>
        </div>
        {activityMsgs.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-content-muted">No messages yet.</p>
        ) : (
          <div className="divide-y divide-line">
            {activityMsgs.map((m) => (
              <div key={m.id} className="flex items-start gap-3 px-6 py-3">
                <span className={`mt-0.5 flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  m.direction === "inbound" ? "bg-accent/10 text-accent" : "bg-line text-content-muted"
                }`}>
                  {m.direction === "inbound" ? "reply" : "sent"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-content">
                    {m.businessName} → {m.customerName}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-content-muted">{m.content}</p>
                </div>
                <span className="flex-shrink-0 text-xs text-content-muted">{formatDate(m.sent_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
