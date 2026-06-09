"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/Badge";
import { AccountHealthScore } from "@/components/AccountHealthScore";
import { SmartInsights } from "@/components/SmartInsights";
import { formatCurrency, formatDate, totalSpend } from "@/utils/helpers";
import type {
  BusinessConfig,
  Customer,
  Message,
  MessageStatus,
  MenuItem,
  MenuItemMention,
  Notification,
  Subscription,
} from "@/utils/database.types";

const PLAN_LIMITS: Record<string, number> = {
  starter: 2000,
  growth: 6000,
  pro: 25000,
};

interface Toast {
  id: string;
  message: string;
  variant: "success" | "error" | "milestone";
  title?: string;
}

interface MilestoneData {
  customerCount: number;
  messagesSent: number;
  repliesReceived: number;
  returnedCount: number;
  allTimeRevenue: number;
  autopilot: boolean;
}

const MILESTONES: Array<{
  id: string;
  title: string;
  message: string;
  check: (d: MilestoneData) => boolean;
}> = [
  {
    id: "first_customer",
    title: "First Customer Added",
    message: "Your customer list is live. Scaleva will now monitor their behavior and help bring them back.",
    check: (d) => d.customerCount >= 1,
  },
  {
    id: "first_message",
    title: "First Message Sent",
    message: "Your first AI-personalized message is out. Now watch the replies roll in.",
    check: (d) => d.messagesSent >= 1,
  },
  {
    id: "first_reply",
    title: "First Customer Reply",
    message: "A customer engaged — personal outreach is working. Keep the momentum going.",
    check: (d) => d.repliesReceived >= 1,
  },
  {
    id: "first_return",
    title: "First Customer Returned",
    message: "A customer came back because of Scaleva. This is exactly the ROI you subscribed for.",
    check: (d) => d.returnedCount >= 1,
  },
  {
    id: "autopilot_on",
    title: "Autopilot Activated",
    message: "Scaleva is now running on autopilot. Sit back — your customers are being taken care of.",
    check: (d) => d.autopilot === true,
  },
  {
    id: "revenue_100",
    title: "$100 Revenue Recovered",
    message: "Scaleva has officially paid for itself this month. And we're just getting started.",
    check: (d) => d.allTimeRevenue >= 100,
  },
  {
    id: "revenue_1000",
    title: "$1,000 Revenue Recovered",
    message: "Four-figure recovery. Your customers love hearing from you.",
    check: (d) => d.allTimeRevenue >= 1000,
  },
  {
    id: "revenue_5000",
    title: "$5,000 Revenue Recovered",
    message: "This is what retention looks like at scale. Outstanding.",
    check: (d) => d.allTimeRevenue >= 5000,
  },
];

function getTimeOfDayGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

interface DashboardClientProps {
  businessId: string;
  businessName: string;
  industry: string | null;
  voice: string | null;
  userEmail?: string | null;
  initialAutopilot: boolean;
  config: BusinessConfig;
  initialCustomers: Customer[];
  initialMessages: Message[];
  initialNotifications: Notification[];
  initialMenuItems: MenuItem[];
  initialMenuMentions: MenuItemMention[];
  subscription: Subscription | null;
  isPastDue: boolean;
}

const statusTone: Record<MessageStatus, "gray" | "green" | "yellow" | "red" | "brand"> = {
  queued: "yellow",
  queued_quiet_hours: "yellow",
  sent: "green",
  delivered: "green",
  failed: "red",
  received: "brand",
  test_sent: "gray",
};

interface CustomerDraft {
  name: string;
  phone: string;
  email: string;
  last_purchase: string;
  spend_amount: string;
}

const emptyDraft = (): CustomerDraft => ({ name: "", phone: "", email: "", last_purchase: "", spend_amount: "" });

function daysSinceDate(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

function visitFrequencyDays(history: { date: string }[]): number | null {
  if (history.length < 2) return null;
  const sorted = history.map((h) => new Date(h.date).getTime()).sort((a, b) => a - b);
  const spanDays = (sorted[sorted.length - 1] - sorted[0]) / 86400000;
  if (spanDays === 0) return null;
  return Math.round(spanDays / (history.length - 1));
}

type CustomerSegment = "champion" | "at_risk" | "new" | "almost_lapsed";

function computeSegment(customer: Customer, allCustomers: Customer[]): CustomerSegment | null {
  const daysSince = daysSinceDate(customer.last_purchase);
  const visits = customer.return_visit_count ?? 0;
  const history = customer.spend_history ?? [];

  // Champion: 3+ return visits AND top-20% LTV
  const sorted = allCustomers.map((c) => c.ltv ?? 0).sort((a, b) => b - a);
  const topIdx = Math.max(0, Math.floor(sorted.length * 0.2) - 1);
  const topLtv = sorted[topIdx] ?? 0;
  if (visits >= 3 && (customer.ltv ?? 0) >= topLtv && topLtv > 0) return "champion";

  // New: ≤1 purchase and last purchase within 30 days (or no purchase yet)
  if (history.length <= 1 && (daysSince === null || daysSince <= 30)) return "new";

  // At-risk / almost-lapsed: based on visit frequency vs elapsed days
  const freqDays = visitFrequencyDays(history);
  if (daysSince !== null) {
    const threshold = freqDays ?? 30;
    if (daysSince > threshold * 1.5) return "at_risk";
    if (daysSince > threshold) return "almost_lapsed";
  }

  return null;
}

const SEGMENT_LABELS: Record<CustomerSegment | "all", string> = {
  all: "All",
  champion: "Champions",
  new: "New",
  almost_lapsed: "At Risk",
  at_risk: "Lapsed",
};

function DaysBadge({ days }: { days: number | null }) {
  if (days === null) return <span className="text-xs text-content-muted">—</span>;
  const cls = days < 14 ? "text-green-400" : days < 30 ? "text-yellow-400" : "text-red-400";
  return <span className={`font-mono text-xs font-medium ${cls}`}>{days}d</span>;
}

function NotificationIcon({ type }: { type: string }) {
  if (type === "reply") {
    return (
      <svg className="h-3.5 w-3.5 text-accent" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
      </svg>
    );
  }
  if (type === "failed") {
    return (
      <svg className="h-3.5 w-3.5 text-danger" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
    );
  }
  return (
    <svg className="h-3.5 w-3.5 text-content-muted" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  );
}

function Sidebar({
  businessName, userEmail, autopilot, autopilotSaving, onToggleAutopilot,
  sendDay, sendTime, isOpen, onClose,
}: {
  businessName: string; userEmail?: string | null; autopilot: boolean;
  autopilotSaving: boolean; onToggleAutopilot: () => void;
  sendDay: string; sendTime: string; isOpen: boolean; onClose: () => void;
}) {
  const router = useRouter();
  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }
  return (
    <>
      {isOpen && <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={onClose} aria-hidden />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-shrink-0 flex-col border-r border-line bg-surface transition-transform duration-200 md:relative md:translate-x-0 md:z-auto ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-14 items-center border-b border-line px-5">
          <span className="font-heading text-sm font-semibold tracking-tight text-content">Scaleva</span>
        </div>
        <div className="border-b border-line px-5 py-4">
          <p className="mb-1 text-[10px] font-medium uppercase tracking-widest text-content-muted">Business</p>
          <p className="truncate text-sm font-medium text-content">{businessName}</p>
        </div>
        <nav className="flex-1 px-3 py-3 space-y-0.5">
          <Link href="/dashboard" className="flex items-center gap-3 rounded-btn bg-accent/10 px-3 py-2 text-sm font-medium text-accent">
            <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
            Dashboard
          </Link>
          <Link href="/settings" className="flex items-center gap-3 rounded-btn px-3 py-2 text-sm font-medium text-content-muted hover:bg-base hover:text-content transition-colors">
            <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </Link>
        </nav>
        <div className="border-t border-line px-5 py-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-content-muted">Autopilot</span>
            <button
              type="button" role="switch" aria-checked={autopilot}
              onClick={onToggleAutopilot} disabled={autopilotSaving}
              className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              style={{ backgroundColor: autopilot ? "#3B82F6" : "#2A2D35" }}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${autopilot ? "translate-x-4" : "translate-x-0.5"}`} />
            </button>
          </div>
          {autopilot
            ? <p className="mt-0.5 text-xs text-content-muted">Next send: {sendDay} {sendTime}</p>
            : <p className="mt-0.5 text-xs text-content-muted">Manual mode</p>
          }
        </div>
        <div className="border-t border-line px-5 py-4">
          {userEmail && <p className="mb-2 truncate text-xs text-content-muted">{userEmail}</p>}
          <button type="button" onClick={handleSignOut} className="flex items-center gap-2 text-xs font-medium text-content-muted transition-colors hover:text-content">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}

function StatCard({
  label,
  value,
  trend,
  trendLabel,
  accent,
}: {
  label: string;
  value: string;
  trend?: "up" | "neutral";
  trendLabel?: string;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-card border p-5 ${accent ? "border-accent/20 bg-accent/[0.04]" : "border-line bg-surface"}`}>
      <p className={`font-mono text-[28px] font-semibold leading-none tracking-tight ${accent ? "text-accent" : "text-content"}`}>
        {value}
      </p>
      <p className="mt-2 text-xs text-content-muted">{label}</p>
      {trendLabel && (
        <p className={`mt-1 text-[10px] font-medium ${trend === "up" ? "text-green-400" : "text-content-muted/60"}`}>
          {trendLabel}
        </p>
      )}
    </div>
  );
}

function RecoveryHero({
  allTimeRevenue,
  allTimeCustomers,
  thisMonthRevenue,
  thisMonthCustomers,
  atRiskCount,
  autopilot,
  monthlyGoal,
}: {
  allTimeRevenue: number;
  allTimeCustomers: number;
  thisMonthRevenue: number;
  thisMonthCustomers: number;
  atRiskCount: number;
  autopilot: boolean;
  monthlyGoal?: number;
}) {
  const hasProof = allTimeRevenue > 0 || allTimeCustomers > 0;
  if (!hasProof && atRiskCount === 0) return null;

  const goalPct = monthlyGoal && monthlyGoal > 0
    ? Math.min((thisMonthRevenue / monthlyGoal) * 100, 100)
    : null;

  return (
    <div className="mb-8 overflow-hidden rounded-card border border-accent/20 bg-gradient-to-br from-accent/[0.07] via-transparent to-transparent">
      <div className="px-6 py-6">
        {hasProof ? (
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-accent/60">Revenue recovered by Scaleva</p>
              <p className="mt-1.5 font-mono text-[44px] font-semibold leading-none tracking-tight text-content">
                {formatCurrency(allTimeRevenue)}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-content-muted">
                <span>{allTimeCustomers} customer{allTimeCustomers !== 1 ? "s" : ""} won back</span>
                {thisMonthRevenue > 0 && (
                  <>
                    <span className="opacity-30">·</span>
                    <span className="font-medium text-green-400">+{formatCurrency(thisMonthRevenue)} this month</span>
                    <span className="opacity-30">·</span>
                    <span>{thisMonthCustomers} this month</span>
                  </>
                )}
              </div>
            </div>
            {atRiskCount > 0 && (
              <div className="flex-shrink-0 rounded-btn border border-yellow-500/20 bg-yellow-500/5 px-5 py-4 text-center">
                <p className="font-mono text-3xl font-semibold text-yellow-400">{atRiskCount}</p>
                <p className="mt-1 text-xs text-content-muted">customers at risk</p>
                <p className="mt-0.5 text-[10px] text-content-muted/50">
                  {autopilot ? "autopilot will reach them" : "enable autopilot to recover"}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-yellow-500/60">Scaleva detected</p>
              <p className="mt-1.5 font-mono text-[44px] font-semibold leading-none tracking-tight text-content">
                {atRiskCount} <span className="text-2xl font-normal text-content-muted">at risk</span>
              </p>
              <p className="mt-3 text-sm text-content-muted">
                {autopilot
                  ? "Scaleva is monitoring and will automatically re-engage these customers."
                  : "Enable autopilot to start recovering these customers automatically."}
              </p>
            </div>
            <div className="flex-shrink-0 rounded-btn border border-accent/15 bg-accent/5 px-5 py-4">
              <p className="text-xs font-medium text-accent">When customers return after a message,</p>
              <p className="mt-0.5 text-xs text-content-muted">recovered revenue appears here.</p>
            </div>
          </div>
        )}

        {goalPct !== null && (
          <div className="mt-5 border-t border-accent/10 pt-4">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-accent/50">
                Monthly goal progress
              </span>
              <span className="text-xs font-medium text-content-muted">
                {formatCurrency(thisMonthRevenue)} of {formatCurrency(monthlyGoal!)} target
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent to-green-400 transition-all duration-700"
                style={{ width: `${goalPct}%` }}
              />
            </div>
            <p className="mt-1 text-[10px] text-content-muted/60">
              {goalPct >= 100
                ? "Goal reached this month!"
                : `${Math.round(100 - goalPct)}% to go — you're on track`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function NotificationBell({ notifications, onMarkRead, onMarkAll }: {
  notifications: Notification[]; onMarkRead: (id: string) => void; onMarkAll: () => void;
}) {
  const [open, setOpen] = useState(false);
  const unread = notifications.filter((n) => !n.read).length;
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)}
        className="relative flex h-8 w-8 items-center justify-center rounded-btn text-content-muted hover:bg-base hover:text-content transition-colors">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 font-mono text-[10px] font-semibold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-9 z-40 w-80 rounded-card border border-line bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <span className="text-xs font-semibold text-content">Notifications</span>
              {unread > 0 && (
                <button type="button" onClick={() => { onMarkAll(); setOpen(false); }} className="text-xs text-accent hover:underline">
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-line">
              {notifications.length === 0
                ? <p className="px-4 py-6 text-center text-xs text-content-muted">No notifications</p>
                : notifications.map((n) => (
                  <button key={n.id} type="button" onClick={() => onMarkRead(n.id)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-base transition-colors ${n.read ? "opacity-60" : ""}`}>
                    <span className="mt-0.5 flex-shrink-0"><NotificationIcon type={n.type} /></span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-content leading-snug">{n.content}</p>
                      <p className="mt-0.5 text-[10px] text-content-muted">{formatDate(n.created_at)}</p>
                    </div>
                    {!n.read && <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />}
                  </button>
                ))
              }
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function exportCustomersCsv(customers: Customer[]) {
  const headers = ["Name", "Phone", "Email", "Last Purchase", "Total Spend", "Return Visits", "Status", "Next Contact"];
  const rows = customers.map((c) => [
    c.name, c.phone ?? "", c.email ?? "", c.last_purchase ?? "",
    totalSpend(c.spend_history).toFixed(2), String(c.return_visit_count ?? 0),
    c.status ?? "active", c.next_contact_date ?? "",
  ]);
  const csv = [headers, ...rows].map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");
  downloadCsv(csv, "customers.csv");
}

function exportMessagesCsv(messages: Message[], customers: Customer[]) {
  const nameMap = new Map(customers.map((c) => [c.id, c.name]));
  const headers = ["Customer Name", "Message", "Sent At", "Status", "Direction"];
  const rows = messages.map((m) => [
    nameMap.get(m.customer_id) ?? "Unknown", m.content,
    m.sent_at ?? "", m.status, m.direction,
  ]);
  const csv = [headers, ...rows].map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");
  downloadCsv(csv, "messages.csv");
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function DashboardClient({
  businessId, businessName, industry, voice, userEmail,
  initialAutopilot, config, initialCustomers, initialMessages,
  initialNotifications, initialMenuItems, initialMenuMentions,
  subscription, isPastDue,
}: DashboardClientProps) {
  const [autopilot, setAutopilot] = useState(initialAutopilot);
  const [autopilotSaving, setAutopilotSaving] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [menuItems] = useState<MenuItem[]>(initialMenuItems);
  const [menuMentions] = useState<MenuItemMention[]>(initialMenuMentions);
  const [rowState, setRowState] = useState<Record<string, { loading: boolean; error: string | null; returning?: boolean }>>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();
  const achievedMilestones = useRef<Set<string>>(new Set());
  const milestoneStorageKey = `scaleva_milestones_${businessId}`;
  const [addOpen, setAddOpen] = useState(false);
  const [draft, setDraft] = useState<CustomerDraft>(emptyDraft());
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addDuplicateWarning, setAddDuplicateWarning] = useState<{ id: string; name: string } | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);
  const [sortByDays, setSortByDays] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  const [bulkSending, setBulkSending] = useState(false);
  const [messageSearch, setMessageSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "outbound" | "failed" | "queued" | "inbound">("all");
  const [segmentFilter, setSegmentFilter] = useState<CustomerSegment | "all">("all");
  const [consentChecked, setConsentChecked] = useState(false);

  const sendDay = config.autopilotSendDay ?? "Monday";
  const sendTime = config.autopilotSendTime ?? "9 AM";

  const addToast = useCallback((message: string, variant: "success" | "error" | "milestone", title?: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, variant, title }]);
    clearTimeout(toastTimer.current);
    const duration = variant === "milestone" ? 7000 : 4000;
    toastTimer.current = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  // Load previously achieved milestones from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(milestoneStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as string[];
        parsed.forEach((id) => achievedMilestones.current.add(id));
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const messagesSent = useMemo(() => messages.filter((m) => m.direction === "outbound").length, [messages]);
  const repliesReceived = useMemo(() => messages.filter((m) => m.direction === "inbound").length, [messages]);
  const revenueTracked = useMemo(() => customers.reduce((sum, c) => sum + totalSpend(c.spend_history), 0), [customers]);
  const thisMonthStart = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }, []);

  const recoveryStats = useMemo(() => {
    const attributed = messages.filter((m) => m.attributed);
    const thisMonth = attributed.filter((m) => m.sent_at != null && m.sent_at >= thisMonthStart);
    return {
      allTimeRevenue: attributed.reduce((s, m) => s + (m.attributed_revenue ?? 0), 0),
      allTimeCustomers: new Set(attributed.map((m) => m.customer_id)).size,
      thisMonthRevenue: thisMonth.reduce((s, m) => s + (m.attributed_revenue ?? 0), 0),
      thisMonthCustomers: new Set(thisMonth.map((m) => m.customer_id)).size,
    };
  }, [messages, thisMonthStart]);

  const returnedCount = useMemo(() => customers.filter((c) => (c.return_visit_count ?? 0) > 0).length, [customers]);

  // Milestone check — runs whenever key stats change
  useEffect(() => {
    const data: MilestoneData = {
      customerCount: customers.length,
      messagesSent: messages.filter((m) => m.direction === "outbound").length,
      repliesReceived: messages.filter((m) => m.direction === "inbound").length,
      returnedCount,
      allTimeRevenue: messages.filter((m) => m.attributed).reduce((s, m) => s + (m.attributed_revenue ?? 0), 0),
      autopilot,
    };
    let didAchieve = false;
    for (const milestone of MILESTONES) {
      if (!achievedMilestones.current.has(milestone.id) && milestone.check(data)) {
        achievedMilestones.current.add(milestone.id);
        addToast(milestone.message, "milestone", milestone.title);
        didAchieve = true;
      }
    }
    if (didAchieve) {
      try {
        localStorage.setItem(milestoneStorageKey, JSON.stringify(Array.from(achievedMilestones.current)));
      } catch {}
    }
  }, [customers, messages, returnedCount, autopilot, addToast, milestoneStorageKey]);
  const conversionRate = useMemo(() => {
    if (!messagesSent) return 0;
    return Math.round((returnedCount / customers.length) * 100);
  }, [returnedCount, customers.length, messagesSent]);
  const replyRate = useMemo(() => {
    if (!messagesSent) return 0;
    return Math.round((repliesReceived / messagesSent) * 100);
  }, [messagesSent, repliesReceived]);
  const returnVisitRate = useMemo(() => {
    if (!customers.length) return 0;
    return Math.round((returnedCount / customers.length) * 100);
  }, [returnedCount, customers.length]);

  const latestStatus = useMemo(() => {
    const map = new Map<string, MessageStatus>();
    for (const m of messages) {
      if (!map.has(m.customer_id)) map.set(m.customer_id, m.status);
    }
    return map;
  }, [messages]);

  const customerMessageMap = useMemo(() => {
    const map = new Map<string, Message[]>();
    for (const m of messages) {
      const arr = map.get(m.customer_id) ?? [];
      arr.push(m);
      map.set(m.customer_id, arr);
    }
    return map;
  }, [messages]);

  const segmentMap = useMemo(() => {
    const map = new Map<string, CustomerSegment | null>();
    for (const c of customers) {
      map.set(c.id, computeSegment(c, customers));
    }
    return map;
  }, [customers]);

  const atRiskCount = useMemo(
    () => customers.filter((c) => { const s = segmentMap.get(c.id); return s === "at_risk" || s === "almost_lapsed"; }).length,
    [customers, segmentMap]
  );

  const sortedCustomers = useMemo(() => {
    if (!sortByDays) return customers;
    return [...customers].sort((a, b) => {
      const da = daysSinceDate(a.last_purchase);
      const db = daysSinceDate(b.last_purchase);
      if (da === null) return 1;
      if (db === null) return -1;
      return db - da;
    });
  }, [customers, sortByDays]);

  const displayedCustomers = useMemo(() => {
    if (segmentFilter === "all") return sortedCustomers;
    return sortedCustomers.filter((c) => segmentMap.get(c.id) === segmentFilter);
  }, [sortedCustomers, segmentFilter, segmentMap]);

  const customerNameMap = useMemo(
    () => new Map(customers.map((c) => [c.id, c.name])),
    [customers]
  );

  const filteredMessages = useMemo(() => {
    let msgs = messages;
    if (statusFilter !== "all") {
      if (statusFilter === "inbound") msgs = msgs.filter((m) => m.direction === "inbound");
      else if (statusFilter === "outbound") msgs = msgs.filter((m) => m.direction === "outbound");
      else if (statusFilter === "failed") msgs = msgs.filter((m) => m.status === "failed");
      else if (statusFilter === "queued") msgs = msgs.filter((m) => m.status === "queued" || m.status === "queued_quiet_hours");
    }
    if (messageSearch.trim()) {
      const q = messageSearch.toLowerCase();
      msgs = msgs.filter(
        (m) =>
          m.content.toLowerCase().includes(q) ||
          (customerNameMap.get(m.customer_id) ?? "").toLowerCase().includes(q)
      );
    }
    return msgs;
  }, [messages, statusFilter, messageSearch, customerNameMap]);

  const messagesPerDay = useMemo(() => {
    const tempMap = new Map<string, { sent: number; replies: number }>();
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      tempMap.set(d.toISOString().slice(0, 10), { sent: 0, replies: 0 });
    }
    for (const m of messages) {
      if (!m.sent_at) continue;
      const key = m.sent_at.slice(0, 10);
      const day = tempMap.get(key);
      if (!day) continue;
      if (m.direction === "outbound") day.sent++;
      else day.replies++;
    }
    return Array.from(tempMap.entries()).map(([key, val]) => ({
      date: key.slice(5),
      sent: val.sent,
      rate: val.sent > 0 ? Math.round((val.replies / val.sent) * 100) : 0,
    }));
  }, [messages]);

  const revenueTimeline = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return { month: d.toLocaleString("default", { month: "short" }), recovered: 0 };
    });
    for (const m of messages) {
      if (!m.attributed || !m.sent_at) continue;
      const d = new Date(m.sent_at);
      const diff = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
      if (diff >= 0 && diff < 6) months[5 - diff].recovered += m.attributed_revenue ?? 0;
    }
    return months;
  }, [messages]);

  const replyHeatmap = useMemo(() => {
    const grid: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0));
    for (const m of messages) {
      if (m.direction !== "inbound" || !m.sent_at) continue;
      const d = new Date(m.sent_at);
      grid[d.getDay()][d.getHours()]++;
    }
    return grid;
  }, [messages]);

  const funnelData = useMemo(() => {
    const messaged = new Set(messages.filter((m) => m.direction === "outbound").map((m) => m.customer_id));
    const replied = new Set(messages.filter((m) => m.direction === "inbound").map((m) => m.customer_id));
    const returned = customers.filter((c) => (c.return_visit_count ?? 0) > 0).length;
    const attrSet = new Set(messages.filter((m) => m.attributed).map((m) => m.customer_id));
    const total = Math.max(customers.length, 1);
    return [
      { label: "Total Customers", count: customers.length, pct: 100, color: "#6B7280" },
      { label: "Messaged", count: messaged.size, pct: Math.round((messaged.size / total) * 100), color: "#3B82F6" },
      { label: "Replied", count: replied.size, pct: Math.round((replied.size / total) * 100), color: "#8B5CF6" },
      { label: "Returned", count: returned, pct: Math.round((returned / total) * 100), color: "#10B981" },
      { label: "Revenue Attributed", count: attrSet.size, pct: Math.round((attrSet.size / total) * 100), color: "#F59E0B" },
    ];
  }, [customers, messages]);

  const menuStats = useMemo(() => {
    return menuItems.map((item) => {
      const mentions = menuMentions.filter((m) => m.menu_item_id === item.id);
      const positive = mentions.filter((m) => m.sentiment === "positive").length;
      const negative = mentions.filter((m) => m.sentiment === "negative").length;
      const neutral = mentions.filter((m) => m.sentiment === "neutral").length;
      const total = mentions.length;
      const score = total === 0 ? 0 : (positive - negative) / total;
      return { ...item, positive, negative, neutral, total, score };
    }).sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
  }, [menuItems, menuMentions]);

  const msgLimit = subscription?.plan === "enterprise" ? null : (PLAN_LIMITS[subscription?.plan ?? "starter"] ?? 2000);
  const custLimit = subscription?.plan === "enterprise" ? null : (subscription?.customer_limit ?? null);
  const msgUsed = subscription?.message_count_this_period ?? 0;
  const msgPct = msgLimit ? Math.min((msgUsed / msgLimit) * 100, 100) : 0;
  const custPct = custLimit ? Math.min((customers.length / custLimit) * 100, 100) : 0;

  function barColor(pct: number) {
    if (pct >= 90) return "bg-red-500";
    if (pct >= 70) return "bg-yellow-400";
    return "bg-green-500";
  }

  async function toggleAutopilot() {
    const next = !autopilot;
    setAutopilot(next);
    setAutopilotSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("businesses").update({ config: { ...config, autopilot: next } }).eq("id", businessId);
    setAutopilotSaving(false);
    if (error) setAutopilot(!next);
  }

  async function generateAndSend(customer: Customer) {
    setRowState((s) => ({ ...s, [customer.id]: { loading: true, error: null } }));
    try {
      const segment = segmentMap.get(customer.id) ?? undefined;
      const genRes = await fetch("/api/messages/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: customer.id, segment }),
      });
      const genData = (await genRes.json()) as { message?: string; error?: string };
      if (!genRes.ok || !genData.message) throw new Error(genData.error ?? "Failed to generate");

      const sendRes = await fetch("/api/messages/send", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: customer.id, content: genData.message }),
      });
      const sendData = (await sendRes.json()) as { message?: Message; error?: string; detail?: string };
      if (!sendRes.ok || !sendData.message) {
        throw new Error(sendData.detail ? `${sendData.error}: ${sendData.detail}` : (sendData.error ?? "Failed to send"));
      }
      setMessages((prev) => [sendData.message as Message, ...prev]);
      setRowState((s) => ({ ...s, [customer.id]: { loading: false, error: null } }));
      addToast("Message sent!", "success");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setRowState((s) => ({ ...s, [customer.id]: { loading: false, error: msg } }));
      addToast(msg, "error");
    }
  }

  const markReturnVisit = useCallback(async (customer: Customer) => {
    setRowState((s) => ({ ...s, [customer.id]: { ...(s[customer.id] ?? { loading: false, error: null }), returning: true } }));
    const res = await fetch("/api/customers/return-visit", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId: customer.id }),
    });
    const data = (await res.json()) as { customer?: Customer; error?: string };
    if (res.ok && data.customer) {
      setCustomers((prev) => prev.map((c) => c.id === customer.id ? data.customer! : c));
    }
    setRowState((s) => ({ ...s, [customer.id]: { ...(s[customer.id] ?? { loading: false, error: null }), returning: false } }));
  }, []);

  async function markNotificationRead(id: string) {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    await fetch("/api/notifications", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  async function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await fetch("/api/notifications", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
  }

  async function addCustomer(force = false) {
    if (!draft.name.trim()) { setAddError("Name is required."); return; }
    if (!consentChecked) { setAddError("You must confirm customer consent before adding."); return; }
    setAddLoading(true); setAddError(null); setAddDuplicateWarning(null);
    const res = await fetch("/api/customers", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: draft.name.trim(), phone: draft.phone.trim() || undefined,
        email: draft.email.trim() || undefined, last_purchase: draft.last_purchase || undefined,
        spend_amount: Number.parseFloat(draft.spend_amount) || 0,
        consent_given: consentChecked,
        force,
      }),
    });
    const data = (await res.json()) as { customer?: Customer; error?: string; code?: string; existingCustomerId?: string; existingCustomerName?: string };
    setAddLoading(false);
    if (res.status === 409 && data.code === "DUPLICATE_PHONE") {
      setAddDuplicateWarning({ id: data.existingCustomerId!, name: data.existingCustomerName! });
      return;
    }
    if (!res.ok || !data.customer) { setAddError(data.error ?? "Failed to add customer."); return; }
    setCustomers((prev) => [...prev, data.customer!]);
    setAddOpen(false);
    setConsentChecked(false);
    addToast(`${draft.name} added!`, "success");
  }

  async function bulkGenerateAndSend() {
    if (selectedCustomers.size === 0) return;
    setBulkSending(true);
    const ids = Array.from(selectedCustomers);
    for (let i = 0; i < ids.length; i++) {
      if (i > 0) await new Promise((r) => setTimeout(r, 500));
      const customer = customers.find((c) => c.id === ids[i]);
      if (customer) await generateAndSend(customer);
    }
    setSelectedCustomers(new Set());
    setBulkSending(false);
  }

  const slideInputClass = "w-full rounded-btn border border-line bg-base px-3 py-2.5 text-sm text-content placeholder:text-content-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors";

  return (
    <>
      {isPastDue && (
        <div className="fixed inset-x-0 top-0 z-50 bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2 text-center">
          <p className="text-xs text-yellow-400">
            Your payment failed. Update your billing info to keep Scaleva running.{" "}
            <a href="/settings" className="font-semibold underline">Manage billing →</a>
          </p>
        </div>
      )}
      {!isPastDue && msgLimit !== null && msgPct >= 80 && (
        <div className="fixed inset-x-0 top-0 z-50 border-b border-yellow-500/20 bg-yellow-500/10 px-4 py-2 text-center">
          <p className="text-xs text-yellow-400">
            You have used {Math.round(msgPct)}% of your monthly messages.{" "}
            <a href="/pricing" className="font-semibold underline">Upgrade your plan to avoid interruptions →</a>
          </p>
        </div>
      )}
      {!isPastDue && custLimit !== null && custPct >= 80 && msgPct < 80 && (
        <div className="fixed inset-x-0 top-0 z-50 border-b border-yellow-500/20 bg-yellow-500/10 px-4 py-2 text-center">
          <p className="text-xs text-yellow-400">
            You have used {Math.round(custPct)}% of your customer limit.{" "}
            <a href="/pricing" className="font-semibold underline">Upgrade your plan to avoid interruptions →</a>
          </p>
        </div>
      )}
      <div className={`flex min-h-screen bg-base ${isPastDue || msgPct >= 80 || custPct >= 80 ? "pt-9" : ""}`}>
        <Sidebar
          businessName={businessName} userEmail={userEmail} autopilot={autopilot}
          autopilotSaving={autopilotSaving} onToggleAutopilot={toggleAutopilot}
          sendDay={sendDay} sendTime={sendTime} isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Topbar */}
          <div className="flex h-14 flex-shrink-0 items-center border-b border-line bg-surface px-4 md:px-6">
            <button type="button" onClick={() => setSidebarOpen((o) => !o)}
              className="mr-3 flex h-8 w-8 items-center justify-center rounded-btn text-content-muted hover:bg-base hover:text-content md:hidden" aria-label="Toggle menu">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            <div className="min-w-0">
              <span className="text-sm font-medium text-content">
                {getTimeOfDayGreeting()}, {businessName}
              </span>
              <span className="mx-2 hidden text-content-muted sm:inline">&middot;</span>
              <span className="hidden text-sm text-content-muted sm:inline">
                {atRiskCount > 0
                  ? `${atRiskCount} customer${atRiskCount !== 1 ? "s" : ""} need attention`
                  : autopilot
                  ? "Autopilot is running"
                  : `${industry ?? "Business"} · ${voice ?? "Friendly"} voice`}
              </span>
            </div>
            <div className="ml-auto flex items-center gap-3">
              {subscription && msgLimit !== null && (
                <div className="hidden items-center gap-3 sm:flex">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-content-muted">{msgUsed.toLocaleString()}/{msgLimit.toLocaleString()} msgs</span>
                    <div className="h-1.5 w-16 rounded-full bg-line">
                      <div className={`h-1.5 rounded-full transition-all ${barColor(msgPct)}`} style={{ width: `${msgPct}%` }} />
                    </div>
                  </div>
                  {custLimit !== null && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-content-muted">{customers.length}/{custLimit} customers</span>
                      <div className="h-1.5 w-16 rounded-full bg-line">
                        <div className={`h-1.5 rounded-full transition-all ${barColor(custPct)}`} style={{ width: `${custPct}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              )}
              <NotificationBell notifications={notifications} onMarkRead={markNotificationRead} onMarkAll={markAllRead} />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-5xl px-6 py-8">
              <AccountHealthScore
                config={config}
                autopilot={autopilot}
                customerCount={customers.length}
                messagesSent={messagesSent}
                onEnableAutopilot={toggleAutopilot}
              />

              <RecoveryHero
                allTimeRevenue={recoveryStats.allTimeRevenue}
                allTimeCustomers={recoveryStats.allTimeCustomers}
                thisMonthRevenue={recoveryStats.thisMonthRevenue}
                thisMonthCustomers={recoveryStats.thisMonthCustomers}
                atRiskCount={atRiskCount}
                autopilot={autopilot}
                monthlyGoal={(config.monthlyRevenueGoal as number | undefined)}
              />

              <SmartInsights
                customers={customers}
                messages={messages}
                config={config}
                autopilot={autopilot}
                subscription={subscription}
                atRiskCount={atRiskCount}
                onEnableAutopilot={toggleAutopilot}
              />

              {/* Stats */}
              <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard label="Total customers" value={String(customers.length)} />
                <StatCard
                  label="Revenue recovered"
                  value={formatCurrency(recoveryStats.allTimeRevenue)}
                  accent={recoveryStats.allTimeRevenue > 0}
                  trend={recoveryStats.thisMonthRevenue > 0 ? "up" : "neutral"}
                  trendLabel={recoveryStats.thisMonthRevenue > 0 ? `+${formatCurrency(recoveryStats.thisMonthRevenue)} this month` : undefined}
                />
                <StatCard
                  label="Customers returned"
                  value={String(returnedCount)}
                  trend={returnedCount > 0 ? "up" : "neutral"}
                  trendLabel={returnedCount > 0 ? `${returnVisitRate}% return rate` : undefined}
                />
                <StatCard
                  label="Reply rate"
                  value={`${replyRate}%`}
                  trend={replyRate > 10 ? "up" : "neutral"}
                  trendLabel={repliesReceived > 0 ? `${repliesReceived} total replies` : undefined}
                />
                <StatCard label="Messages sent" value={String(messagesSent)} />
                <StatCard label="Revenue tracked" value={formatCurrency(revenueTracked)} />
                <StatCard label="Conversion rate" value={`${conversionRate}%`} />
                <StatCard label="Return visit rate" value={`${returnVisitRate}%`} />
              </div>

              <div className="grid gap-5 lg:grid-cols-3">
                {/* Customers table */}
                <div className="overflow-hidden rounded-card border border-line bg-surface lg:col-span-2">
                  <div className="flex items-center justify-between border-b border-line px-6 py-4">
                    <h2 className="font-heading text-sm font-semibold text-content">Customers</h2>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <button type="button" onClick={() => setExportOpen((o) => !o)}
                          className="inline-flex h-8 items-center gap-1.5 rounded-btn border border-line px-3 text-xs font-medium text-content-muted transition-colors hover:border-content-muted hover:text-content">
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                          </svg>
                          Export
                        </button>
                        {exportOpen && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setExportOpen(false)} />
                            <div className="absolute right-0 top-9 z-20 w-52 rounded-card border border-line bg-surface shadow-xl">
                              <button type="button" className="flex w-full items-center gap-2 px-4 py-2.5 text-xs text-content hover:bg-base"
                                onClick={() => { exportCustomersCsv(customers); setExportOpen(false); }}>
                                Export customers CSV
                              </button>
                              <button type="button" className="flex w-full items-center gap-2 border-t border-line px-4 py-2.5 text-xs text-content hover:bg-base"
                                onClick={() => { exportMessagesCsv(messages, customers); setExportOpen(false); }}>
                                Export messages CSV
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                      <button type="button" onClick={() => { setDraft(emptyDraft()); setAddError(null); setAddDuplicateWarning(null); setConsentChecked(false); setAddOpen(true); }}
                        className="inline-flex h-8 items-center gap-1.5 rounded-btn border border-line px-3 text-xs font-medium text-content-muted transition-colors hover:border-content-muted hover:text-content">
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Add customer
                      </button>
                    </div>
                  </div>

                  {/* Segment filter tabs */}
                  <div className="flex flex-wrap gap-1 border-b border-line px-6 py-2.5">
                    {(["all", "champion", "new", "almost_lapsed", "at_risk"] as const).map((seg) => (
                      <button
                        key={seg}
                        type="button"
                        onClick={() => setSegmentFilter(seg)}
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                          segmentFilter === seg
                            ? "bg-accent text-white"
                            : "bg-line text-content-muted hover:text-content"
                        }`}
                      >
                        {SEGMENT_LABELS[seg]}
                        {seg !== "all" && (
                          <span className="ml-1 opacity-60">
                            {customers.filter((c) => segmentMap.get(c.id) === seg).length}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  {selectedCustomers.size > 0 && (
                    <div className="flex items-center gap-3 border-b border-line bg-accent/5 px-6 py-2.5">
                      <span className="text-xs text-content-muted">{selectedCustomers.size} selected</span>
                      <button
                        type="button"
                        onClick={bulkGenerateAndSend}
                        disabled={bulkSending}
                        className="inline-flex h-7 items-center gap-1.5 rounded-btn bg-accent px-3 text-xs font-medium text-white disabled:opacity-60"
                      >
                        {bulkSending ? (
                          <><span className="h-3 w-3 animate-spin rounded-full border border-white/30 border-t-white" />Sending...</>
                        ) : `Generate & Send to All (${selectedCustomers.size})`}
                      </button>
                      <button type="button" onClick={() => setSelectedCustomers(new Set())} className="text-xs text-content-muted hover:text-content">
                        Clear
                      </button>
                    </div>
                  )}
                  {customers.length === 0 ? (
                    <div className="px-6 py-14 text-center">
                      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-accent/30 bg-accent/5">
                        <svg className="h-6 w-6 text-accent/60" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                        </svg>
                      </div>
                      <p className="text-sm font-semibold text-content">Your customer list is ready</p>
                      <p className="mt-1.5 text-xs leading-relaxed text-content-muted">
                        Import from Square, Stripe, Shopify, or add manually.<br />
                        Most businesses see 15–25% of customers return after their first outreach.
                      </p>
                      <button
                        type="button"
                        onClick={() => { setDraft(emptyDraft()); setAddError(null); setAddDuplicateWarning(null); setConsentChecked(false); setAddOpen(true); }}
                        className="mt-4 inline-flex h-8 items-center gap-1.5 rounded-btn bg-accent px-4 text-xs font-medium text-white hover:bg-accent-hover transition-colors"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Add first customer
                      </button>
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-line text-left">
                          <th className="px-4 py-3">
                            <input
                              type="checkbox"
                              className="rounded border-line"
                              checked={selectedCustomers.size === displayedCustomers.length && displayedCustomers.length > 0}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedCustomers(new Set(displayedCustomers.map((c) => c.id)));
                                else setSelectedCustomers(new Set());
                              }}
                            />
                          </th>
                          <th className="px-6 py-3 text-xs font-medium uppercase tracking-wide text-content-muted">Name</th>
                          <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-content-muted">Phone</th>
                          <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-content-muted">Last purchase</th>
                          <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-content-muted">
                            <button type="button" onClick={() => setSortByDays(!sortByDays)}
                              className="flex items-center gap-1 hover:text-content transition-colors">
                              Days since
                              {sortByDays
                                ? <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                                : <svg className="h-3 w-3 opacity-40" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" /></svg>
                              }
                            </button>
                          </th>
                          <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-content-muted">Status</th>
                          <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-content-muted">Returned</th>
                          <th className="px-4 py-3" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {displayedCustomers.map((customer) => {
                          const status = latestStatus.get(customer.id);
                          const row = rowState[customer.id];
                          const customerStatus = customer.status;
                          const days = daysSinceDate(customer.last_purchase);
                          const expanded = expandedCustomer === customer.id;
                          const customerMessages = customerMessageMap.get(customer.id) ?? [];
                          return (
                            <Fragment key={customer.id}>
                              <tr className="group relative border-l-2 border-l-transparent align-top transition-colors hover:border-l-accent hover:bg-accent/5">
                                <td className="px-4 py-3.5">
                                  <input
                                    type="checkbox"
                                    className="rounded border-line"
                                    checked={selectedCustomers.has(customer.id)}
                                    onChange={(e) => {
                                      const next = new Set(selectedCustomers);
                                      if (e.target.checked) next.add(customer.id);
                                      else next.delete(customer.id);
                                      setSelectedCustomers(next);
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </td>
                                <td className="px-6 py-3.5">
                                  <button type="button" onClick={() => setExpandedCustomer(expanded ? null : customer.id)} className="text-left">
                                    <div className="font-medium text-content hover:text-accent transition-colors">
                                      {customer.name}
                                      {customerMessages.length > 0 && (
                                        <span className="ml-1.5 font-mono text-[10px] text-content-muted">
                                          {expanded ? "▲" : "▼"}
                                        </span>
                                      )}
                                    </div>
                                    <div className="font-mono text-xs text-content-muted">{formatCurrency(totalSpend(customer.spend_history))}</div>
                                  </button>
                                </td>
                                <td className="px-4 py-3.5 text-content-muted">{customer.phone ?? "—"}</td>
                                <td className="px-4 py-3.5 text-content-muted">{formatDate(customer.last_purchase)}</td>
                                <td className="px-4 py-3.5"><DaysBadge days={days} /></td>
                                <td className="px-4 py-3.5">
                                  {customerStatus === "replied" ? (
                                    <Badge tone="brand">replied</Badge>
                                  ) : status ? (
                                    <Badge tone={statusTone[status]}>{status}</Badge>
                                  ) : (
                                    <Badge tone="gray">not sent</Badge>
                                  )}
                                </td>
                                <td className="px-4 py-3.5">
                                  <span className="font-mono text-xs text-content-muted">{customer.return_visit_count ?? 0}</span>
                                </td>
                                <td className="px-4 py-3.5 text-right">
                                  <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button type="button" disabled={row?.returning} onClick={() => markReturnVisit(customer)}
                                      className="inline-flex h-7 items-center rounded-btn border border-line bg-surface px-2 text-xs font-medium text-content-muted hover:border-green-500/40 hover:text-green-400 disabled:opacity-40">
                                      {row?.returning ? "…" : "Returned"}
                                    </button>
                                    <button type="button" disabled={row?.loading} onClick={() => generateAndSend(customer)}
                                      className="inline-flex h-7 items-center rounded-btn border border-line bg-surface px-2.5 text-xs font-medium text-content-muted hover:border-content-muted hover:text-content disabled:cursor-not-allowed disabled:opacity-40">
                                      {row?.loading ? (
                                        <><span className="mr-1.5 h-3 w-3 animate-spin rounded-full border border-content-muted/40 border-t-content-muted" />Sending...</>
                                      ) : "Send"}
                                    </button>
                                  </div>
                                  {row?.error && <p className="mt-1 text-right text-xs text-danger">{row.error}</p>}
                                </td>
                              </tr>
                              {expanded && (
                                <tr>
                                  <td colSpan={8} className="bg-base px-6 py-3">
                                    {customerMessages.length === 0 ? (
                                      <p className="text-xs text-content-muted">No messages sent to {customer.name} yet.</p>
                                    ) : (
                                      <div className="space-y-2">
                                        {customerMessages.map((m) => (
                                          <div key={m.id} className="flex items-start gap-3">
                                            <Badge tone={m.direction === "inbound" ? "brand" : "gray"}>
                                              {m.direction === "inbound" ? "Reply" : "Sent"}
                                            </Badge>
                                            <span className="flex-1 text-xs text-content">{m.content}</span>
                                            <span className="flex-shrink-0 text-xs text-content-muted">{formatDate(m.sent_at)}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Message feed */}
                <div className="overflow-hidden rounded-card border border-line bg-surface">
                  <div className="border-b border-line px-4 py-3 space-y-2">
                    <h2 className="font-heading text-sm font-semibold text-content">Message history</h2>
                    <input
                      type="search"
                      placeholder="Search by customer or message…"
                      value={messageSearch}
                      onChange={(e) => setMessageSearch(e.target.value)}
                      className="w-full rounded-btn border border-line bg-base px-3 py-1.5 text-xs text-content placeholder:text-content-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                    <div className="flex flex-wrap gap-1">
                      {(["all", "outbound", "inbound", "failed", "queued"] as const).map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setStatusFilter(f)}
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                            statusFilter === f
                              ? "bg-accent text-white"
                              : "bg-line text-content-muted hover:text-content"
                          }`}
                        >
                          {f === "outbound" ? "Sent" : f === "inbound" ? "Replies" : f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="overflow-y-auto divide-y divide-line" style={{ maxHeight: "520px" }}>
                    {filteredMessages.length === 0 ? (
                      <div className="px-5 py-10 text-center">
                        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-line bg-base">
                          <svg className="h-5 w-5 text-content-muted/50" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-content">
                          {messageSearch || statusFilter !== "all" ? "No messages match this filter" : "No messages yet"}
                        </p>
                        <p className="mt-1 text-xs text-content-muted">
                          {messageSearch || statusFilter !== "all"
                            ? "Try adjusting your search or filter."
                            : customers.length > 0
                            ? "Select a customer and press Send to generate your first AI message."
                            : "Add customers first, then send your first message."}
                        </p>
                      </div>
                    ) : (
                      filteredMessages.map((message) => (
                        <div key={message.id} className="px-5 py-3.5">
                          <div className="mb-2 flex items-center justify-between">
                            <Badge tone={message.direction === "inbound" ? "brand" : "gray"}>
                              {message.direction === "inbound" ? "Reply" : "Outbound"}
                            </Badge>
                            <span className="text-xs text-content-muted">{formatDate(message.sent_at)}</span>
                          </div>
                          <div className={`inline-block max-w-full rounded-card px-3.5 py-2.5 text-xs leading-relaxed ${
                            message.direction === "inbound"
                              ? "rounded-tr-sm bg-blue-500/10 text-content border border-blue-500/20"
                              : "rounded-tl-sm bg-accent/10 text-content border border-accent/20"
                          }`}>
                            {message.content}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Analytics charts */}
              <div className="mt-6 grid gap-5 lg:grid-cols-2">
                <div className="rounded-card border border-line bg-surface p-5">
                  <h3 className="mb-4 font-heading text-sm font-semibold text-content">Messages sent — last 30 days</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={messagesPerDay} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2A2D35" vertical={false} />
                      <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 10 }} tickLine={false} axisLine={false}
                        interval={5} />
                      <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{ background: "#1a1d24", border: "1px solid #2A2D35", borderRadius: "8px", fontSize: "12px" }}
                        labelStyle={{ color: "#9ca3af" }} itemStyle={{ color: "#e5e7eb" }}
                      />
                      <Bar dataKey="sent" fill="#3B82F6" radius={[3, 3, 0, 0]} maxBarSize={24} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="rounded-card border border-line bg-surface p-5">
                  <h3 className="mb-4 font-heading text-sm font-semibold text-content">Reply rate % — last 30 days</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={messagesPerDay} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2A2D35" vertical={false} />
                      <XAxis dataKey="date" tick={{ fill: "#6b7280", fontSize: 10 }} tickLine={false} axisLine={false} interval={5} />
                      <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} tickLine={false} axisLine={false} domain={[0, 100]}
                        tickFormatter={(v: number) => `${v}%`} />
                      <Tooltip
                        contentStyle={{ background: "#1a1d24", border: "1px solid #2A2D35", borderRadius: "8px", fontSize: "12px" }}
                        labelStyle={{ color: "#9ca3af" }} itemStyle={{ color: "#e5e7eb" }}
                        formatter={(v: unknown) => [`${v as number}%`, "Reply rate"]}
                      />
                      <Line type="monotone" dataKey="rate" stroke="#3B82F6" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Revenue recovered timeline */}
              <div className="mt-5 rounded-card border border-line bg-surface p-5">
                <h3 className="mb-4 font-heading text-sm font-semibold text-content">Revenue recovered — last 6 months</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={revenueTimeline} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2A2D35" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} tickLine={false} axisLine={false}
                      tickFormatter={(v: number) => `$${v}`} />
                    <Tooltip
                      contentStyle={{ background: "#1a1d24", border: "1px solid #2A2D35", borderRadius: "8px", fontSize: "12px" }}
                      labelStyle={{ color: "#9ca3af" }} itemStyle={{ color: "#e5e7eb" }}
                      formatter={(v: unknown) => [`$${v as number}`, "Recovered"]}
                    />
                    <Area type="monotone" dataKey="recovered" stroke="#10B981" strokeWidth={2} fill="url(#revGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Reply heatmap */}
              <div className="mt-5 rounded-card border border-line bg-surface p-5">
                <h3 className="mb-4 font-heading text-sm font-semibold text-content">Reply heatmap — day × hour</h3>
                <div className="overflow-x-auto">
                  <div className="flex gap-1 min-w-max">
                    <div className="flex flex-col gap-1 pr-2 pt-5">
                      {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
                        <span key={d} className="h-4 text-[10px] leading-4 text-content-muted text-right">{d}</span>
                      ))}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex gap-0.5 mb-1">
                        {Array.from({ length: 24 }, (_, h) => (
                          <span key={h} className="w-4 text-center text-[8px] text-content-muted">{h % 6 === 0 ? h : ""}</span>
                        ))}
                      </div>
                      {replyHeatmap.map((row, day) => (
                        <div key={day} className="flex gap-0.5">
                          {row.map((count, hour) => {
                            const max = Math.max(...replyHeatmap.flat(), 1);
                            const intensity = count / max;
                            const bg = count === 0
                              ? "bg-white/5"
                              : intensity < 0.25 ? "bg-blue-900/60"
                              : intensity < 0.5 ? "bg-blue-700/70"
                              : intensity < 0.75 ? "bg-blue-500/80"
                              : "bg-blue-400";
                            return (
                              <div key={hour} title={`${["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][day]} ${hour}:00 — ${count} replies`}
                                className={`h-4 w-4 rounded-sm ${bg}`} />
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Engagement funnel */}
              <div className="mt-5 rounded-card border border-line bg-surface p-5">
                <h3 className="mb-4 font-heading text-sm font-semibold text-content">Engagement funnel</h3>
                <div className="space-y-3">
                  {funnelData.map((step) => (
                    <div key={step.label}>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs text-content-muted">{step.label}</span>
                        <span className="text-xs font-medium text-content">{step.count.toLocaleString()} <span className="text-content-muted">({step.pct}%)</span></span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${step.pct}%`, backgroundColor: step.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Menu / Service Intelligence — restaurants, salons, retail */}
              {menuStats.length > 0 && (
                <div className="mt-5 rounded-card border border-line bg-surface p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-heading text-sm font-semibold text-content">
                        {industry === "Restaurant" ? "Menu Intelligence" : industry === "Salon" ? "Service Intelligence" : "Product Intelligence"}
                      </h3>
                      <p className="mt-0.5 text-xs text-content-muted">
                        {menuMentions.length > 0
                          ? `Ranked by customer mentions — ${menuMentions.length} mention${menuMentions.length !== 1 ? "s" : ""} detected`
                          : "Mention data builds as customers reply to your messages"}
                      </p>
                    </div>
                  </div>

                  {/* Category group headers */}
                  {(() => {
                    const categories = Array.from(new Set(menuStats.map((i) => i.category ?? "Other")));
                    return categories.map((cat) => {
                      const items = menuStats.filter((i) => (i.category ?? "Other") === cat);
                      const maxTotal = Math.max(...menuStats.map((i) => i.total), 1);
                      return (
                        <div key={cat} className="mb-4">
                          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-content-muted/60">{cat}</p>
                          <div className="space-y-2">
                            {items.map((item) => {
                              const barWidth = item.total > 0 ? (item.total / maxTotal) * 100 : 0;
                              const sentiment =
                                item.total === 0 ? "none"
                                : item.score > 0.2 ? "positive"
                                : item.score < -0.2 ? "negative"
                                : "neutral";
                              const barColor =
                                sentiment === "positive" ? "#10B981"
                                : sentiment === "negative" ? "#EF4444"
                                : "#6B7280";
                              return (
                                <div key={item.id} className="grid grid-cols-[1fr_auto] items-center gap-3">
                                  <div>
                                    <div className="mb-1 flex items-center gap-2">
                                      <span className="text-xs font-medium text-content">{item.name}</span>
                                      {item.price && (
                                        <span className="text-[10px] text-content-muted">${item.price}</span>
                                      )}
                                      {item.total > 0 && (
                                        <span className={`ml-auto text-[10px] font-medium ${
                                          sentiment === "positive" ? "text-green-400"
                                          : sentiment === "negative" ? "text-red-400"
                                          : "text-content-muted"
                                        }`}>
                                          {sentiment === "positive" ? "Loved" : sentiment === "negative" ? "Issues" : "Neutral"}
                                        </span>
                                      )}
                                    </div>
                                    <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                                      <div
                                        className="h-full rounded-full transition-all duration-700"
                                        style={{ width: `${barWidth}%`, backgroundColor: barColor }}
                                      />
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-xs font-semibold text-content">
                                      {item.total > 0 ? item.total : "—"}
                                    </span>
                                    {item.total > 0 && (
                                      <span className="block text-[10px] text-content-muted">mentions</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    });
                  })()}

                  {menuMentions.length === 0 && (
                    <div className="mt-2 rounded-btn border border-dashed border-line p-4 text-center">
                      <p className="text-xs text-content-muted">
                        Mention data will appear here as customers reply to your messages and reference your {industry === "Restaurant" ? "dishes" : industry === "Salon" ? "services" : "products"}.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Customer slide-over */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={() => setAddOpen(false)} aria-hidden />
          <div className="flex w-full max-w-sm flex-col border-l border-line bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <h2 className="font-heading text-sm font-semibold text-content">Add customer</h2>
              <button type="button" onClick={() => setAddOpen(false)}
                className="rounded-btn p-1 text-content-muted transition-colors hover:bg-base hover:text-content">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 px-6 py-5">
              {(
                [
                  { label: "Name *", field: "name" as const, placeholder: "Jane Smith", type: "text" },
                  { label: "Phone", field: "phone" as const, placeholder: "+15551234567", type: "tel" },
                  { label: "Email", field: "email" as const, placeholder: "jane@example.com", type: "email" },
                  { label: "Last purchase", field: "last_purchase" as const, placeholder: "", type: "date" },
                  { label: "Lifetime spend ($)", field: "spend_amount" as const, placeholder: "0.00", type: "number" },
                ] as { label: string; field: keyof CustomerDraft; placeholder: string; type: string }[]
              ).map(({ label, field, placeholder, type }) => (
                <div key={field}>
                  <label className="mb-1.5 block text-xs font-medium text-content-muted">{label}</label>
                  <input type={type} value={draft[field]}
                    onChange={(e) => setDraft({ ...draft, [field]: e.target.value })}
                    placeholder={placeholder} min={type === "number" ? 0 : undefined}
                    step={type === "number" ? "0.01" : undefined} className={slideInputClass} />
                </div>
              ))}
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="mt-0.5 rounded border-line"
                />
                <span className="text-xs text-content-muted leading-relaxed">
                  This customer has consented to receive SMS messages from my business. <span className="text-danger">*</span>
                </span>
              </label>
              {addDuplicateWarning && (
                <div className="rounded-btn border border-yellow-500/30 bg-yellow-500/10 p-3 text-xs text-yellow-400">
                  <p className="font-medium mb-2">A customer with this phone number already exists: <strong>{addDuplicateWarning.name}</strong></p>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => addCustomer(true)}
                      className="rounded-btn bg-yellow-500/20 px-3 py-1.5 text-xs font-medium hover:bg-yellow-500/30">
                      Add anyway
                    </button>
                    <button type="button" onClick={() => setAddDuplicateWarning(null)}
                      className="rounded-btn px-3 py-1.5 text-xs font-medium text-content-muted hover:text-content">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              {addError && <p className="text-xs text-danger">{addError}</p>}
            </div>
            <div className="flex gap-2.5 border-t border-line px-6 py-4">
              <button type="button" onClick={() => { setAddOpen(false); setConsentChecked(false); setAddDuplicateWarning(null); }} disabled={addLoading}
                className="flex-1 h-9 rounded-btn border border-line text-sm font-medium text-content-muted transition-colors hover:border-content-muted hover:text-content disabled:opacity-60">
                Cancel
              </button>
              <button type="button" onClick={() => addCustomer()} disabled={addLoading}
                className="flex flex-1 h-9 items-center justify-center gap-2 rounded-btn bg-accent text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60">
                {addLoading ? (
                  <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden />Adding...</>
                ) : "Add customer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
        {toasts.map((t) => {
          if (t.variant === "milestone") {
            return (
              <div key={t.id} className="flex items-start gap-3 rounded-card border border-yellow-500/30 bg-yellow-500/10 px-4 py-3.5 shadow-2xl backdrop-blur-sm">
                <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-yellow-500/20 text-base">
                  🏆
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-yellow-300">{t.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-yellow-400/80">{t.message}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
                  className="mt-0.5 flex-shrink-0 opacity-50 hover:opacity-100"
                >
                  <svg className="h-3.5 w-3.5 text-yellow-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            );
          }
          return (
            <div key={t.id} className={`flex items-center gap-2.5 rounded-card border px-4 py-3 text-sm shadow-xl backdrop-blur-sm transition-all ${
              t.variant === "success" ? "border-green-500/30 bg-green-500/10 text-green-400" : "border-danger/30 bg-danger/10 text-danger"
            }`}>
              {t.variant === "success"
                ? <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                : <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
              }
              {t.message}
              <button type="button" onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))} className="ml-1 opacity-60 hover:opacity-100">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
