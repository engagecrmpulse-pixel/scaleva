"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/Badge";
import { formatCurrency, formatDate, totalSpend } from "@/utils/helpers";
import type {
  BusinessConfig,
  Customer,
  Message,
  MessageStatus,
  Notification,
  Subscription,
} from "@/utils/database.types";

const PLAN_LIMITS: Record<string, number> = {
  starter: 2000,
  growth: 6000,
  pro: 25000,
};

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
  subscription: Subscription | null;
}

const statusTone: Record<
  MessageStatus,
  "gray" | "green" | "yellow" | "red" | "brand"
> = {
  queued: "yellow",
  sent: "green",
  delivered: "green",
  failed: "red",
  received: "brand",
};

interface CustomerDraft {
  name: string;
  phone: string;
  email: string;
  last_purchase: string;
  spend_amount: string;
}

const emptyDraft = (): CustomerDraft => ({
  name: "",
  phone: "",
  email: "",
  last_purchase: "",
  spend_amount: "",
});

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
  businessName,
  userEmail,
  autopilot,
  autopilotSaving,
  onToggleAutopilot,
  sendDay,
  sendTime,
}: {
  businessName: string;
  userEmail?: string | null;
  autopilot: boolean;
  autopilotSaving: boolean;
  onToggleAutopilot: () => void;
  sendDay: string;
  sendTime: string;
}) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex w-60 flex-shrink-0 flex-col border-r border-line bg-surface">
      <div className="flex h-14 items-center border-b border-line px-5">
        <span className="font-heading text-sm font-semibold tracking-tight text-content">
          Scaleva
        </span>
      </div>

      <div className="border-b border-line px-5 py-4">
        <p className="mb-1 text-[10px] font-medium uppercase tracking-widest text-content-muted">
          Business
        </p>
        <p className="truncate text-sm font-medium text-content">{businessName}</p>
      </div>

      <nav className="flex-1 px-3 py-3 space-y-0.5">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 rounded-btn bg-accent/10 px-3 py-2 text-sm font-medium text-accent"
        >
          <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
          </svg>
          Dashboard
        </Link>
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-btn px-3 py-2 text-sm font-medium text-content-muted hover:bg-base hover:text-content transition-colors"
        >
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
            type="button"
            role="switch"
            aria-checked={autopilot}
            onClick={onToggleAutopilot}
            disabled={autopilotSaving}
            className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            style={{ backgroundColor: autopilot ? "#3B82F6" : "#2A2D35" }}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                autopilot ? "translate-x-4" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
        {autopilot ? (
          <p className="mt-0.5 text-xs text-content-muted">
            Next send: {sendDay} {sendTime}
          </p>
        ) : (
          <p className="mt-0.5 text-xs text-content-muted">Manual mode</p>
        )}
      </div>

      <div className="border-t border-line px-5 py-4">
        {userEmail && (
          <p className="mb-2 truncate text-xs text-content-muted">{userEmail}</p>
        )}
        <button
          type="button"
          onClick={handleSignOut}
          className="flex items-center gap-2 text-xs font-medium text-content-muted transition-colors hover:text-content"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
          </svg>
          Sign out
        </button>
      </div>
    </aside>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-card border border-line bg-surface p-5">
      <p className="font-mono text-[28px] font-semibold leading-none tracking-tight text-content">
        {value}
      </p>
      <p className="mt-2 text-xs text-content-muted">{label}</p>
    </div>
  );
}

function NotificationBell({
  notifications,
  onMarkRead,
  onMarkAll,
}: {
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onMarkAll: () => void;
}) {
  const [open, setOpen] = useState(false);
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-8 w-8 items-center justify-center rounded-btn text-content-muted hover:bg-base hover:text-content transition-colors"
      >
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
                <button
                  type="button"
                  onClick={() => { onMarkAll(); setOpen(false); }}
                  className="text-xs text-accent hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-line">
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-center text-xs text-content-muted">No notifications</p>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => onMarkRead(n.id)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-base transition-colors ${
                      n.read ? "opacity-60" : ""
                    }`}
                  >
                    <span className="mt-0.5 flex-shrink-0">
                      <NotificationIcon type={n.type} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-content leading-snug">{n.content}</p>
                      <p className="mt-0.5 text-[10px] text-content-muted">
                        {formatDate(n.created_at)}
                      </p>
                    </div>
                    {!n.read && (
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
                    )}
                  </button>
                ))
              )}
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
    c.name,
    c.phone ?? "",
    c.email ?? "",
    c.last_purchase ?? "",
    totalSpend(c.spend_history).toFixed(2),
    String(c.return_visit_count ?? 0),
    c.status ?? "active",
    c.next_contact_date ?? "",
  ]);
  const csv = [headers, ...rows].map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");
  downloadCsv(csv, "customers.csv");
}

function exportMessagesCsv(messages: Message[], customers: Customer[]) {
  const nameMap = new Map(customers.map((c) => [c.id, c.name]));
  const headers = ["Customer Name", "Message", "Sent At", "Status", "Direction", "Reply Received"];
  const rows = messages.map((m) => [
    nameMap.get(m.customer_id) ?? "Unknown",
    m.content,
    m.sent_at ?? "",
    m.status,
    m.direction,
    m.direction === "inbound" ? "Yes" : "No",
  ]);
  const csv = [headers, ...rows].map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");
  downloadCsv(csv, "messages.csv");
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function DashboardClient({
  businessId,
  businessName,
  industry,
  voice,
  userEmail,
  initialAutopilot,
  config,
  initialCustomers,
  initialMessages,
  initialNotifications,
  subscription,
}: DashboardClientProps) {
  const [autopilot, setAutopilot] = useState(initialAutopilot);
  const [autopilotSaving, setAutopilotSaving] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [rowState, setRowState] = useState<
    Record<string, { loading: boolean; error: string | null; returning?: boolean }>
  >({});

  const [addOpen, setAddOpen] = useState(false);
  const [draft, setDraft] = useState<CustomerDraft>(emptyDraft());
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  const sendDay = config.autopilotSendDay ?? "Monday";
  const sendTime = config.autopilotSendTime ?? "9 AM";

  const messagesSent = useMemo(
    () => messages.filter((m) => m.direction === "outbound").length,
    [messages]
  );
  const repliesReceived = useMemo(
    () => messages.filter((m) => m.direction === "inbound").length,
    [messages]
  );
  const revenueTracked = useMemo(
    () => customers.reduce((sum, c) => sum + totalSpend(c.spend_history), 0),
    [customers]
  );
  const returnedCount = useMemo(
    () => customers.filter((c) => (c.return_visit_count ?? 0) > 0).length,
    [customers]
  );
  const conversionRate = useMemo(() => {
    if (!messagesSent) return 0;
    return Math.round((returnedCount / customers.length) * 100);
  }, [returnedCount, customers.length, messagesSent]);

  const latestStatus = useMemo(() => {
    const map = new Map<string, MessageStatus>();
    for (const m of messages) {
      if (!map.has(m.customer_id)) map.set(m.customer_id, m.status);
    }
    return map;
  }, [messages]);

  const msgLimit = PLAN_LIMITS[subscription?.plan ?? "starter"] ?? 2000;
  const msgUsed = subscription?.message_count_this_period ?? 0;
  const msgPct = Math.min((msgUsed / msgLimit) * 100, 100);

  async function toggleAutopilot() {
    const next = !autopilot;
    setAutopilot(next);
    setAutopilotSaving(true);
    const supabase = createClient();
    const nextConfig: BusinessConfig = { ...config, autopilot: next };
    const { error } = await supabase
      .from("businesses")
      .update({ config: nextConfig })
      .eq("id", businessId);
    setAutopilotSaving(false);
    if (error) setAutopilot(!next);
  }

  async function generateAndSend(customer: Customer) {
    setRowState((s) => ({ ...s, [customer.id]: { loading: true, error: null } }));

    try {
      const genRes = await fetch("/api/messages/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: customer.id }),
      });
      const genData = (await genRes.json()) as { message?: string; error?: string };
      if (!genRes.ok || !genData.message) throw new Error(genData.error ?? "Failed to generate");

      const sendRes = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: customer.id, content: genData.message }),
      });
      const sendData = (await sendRes.json()) as { message?: Message; error?: string; detail?: string };
      if (!sendRes.ok || !sendData.message) {
        throw new Error(sendData.detail ? `${sendData.error}: ${sendData.detail}` : (sendData.error ?? "Failed to send"));
      }

      setMessages((prev) => [sendData.message as Message, ...prev]);
      setRowState((s) => ({ ...s, [customer.id]: { loading: false, error: null } }));
    } catch (e) {
      setRowState((s) => ({
        ...s,
        [customer.id]: { loading: false, error: e instanceof Error ? e.message : "Something went wrong" },
      }));
    }
  }

  const markReturnVisit = useCallback(async (customer: Customer) => {
    setRowState((s) => ({ ...s, [customer.id]: { ...(s[customer.id] ?? { loading: false, error: null }), returning: true } }));
    const res = await fetch("/api/customers/return-visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  async function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
  }

  function openAddSlider() {
    setDraft(emptyDraft());
    setAddError(null);
    setAddOpen(true);
  }

  async function addCustomer() {
    if (!draft.name.trim()) { setAddError("Name is required."); return; }
    setAddLoading(true);
    setAddError(null);

    const supabase = createClient();
    const spendAmount = Number.parseFloat(draft.spend_amount) || 0;
    const spendHistory =
      spendAmount > 0
        ? [{ date: draft.last_purchase || new Date().toISOString(), amount: spendAmount }]
        : [];

    const { data: newCustomer, error } = await supabase
      .from("customers")
      .insert({
        business_id: businessId,
        name: draft.name.trim(),
        phone: draft.phone.trim() || null,
        email: draft.email.trim() || null,
        last_purchase: draft.last_purchase || null,
        spend_history: spendHistory,
      })
      .select()
      .single();

    setAddLoading(false);
    if (error || !newCustomer) { setAddError(error?.message ?? "Failed to add customer."); return; }
    setCustomers((prev) => [...prev, newCustomer]);
    setAddOpen(false);
  }

  const slideInputClass =
    "w-full rounded-btn border border-line bg-base px-3 py-2.5 text-sm text-content placeholder:text-content-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors";

  return (
    <>
      <div className="flex min-h-screen bg-base">
        <Sidebar
          businessName={businessName}
          userEmail={userEmail}
          autopilot={autopilot}
          autopilotSaving={autopilotSaving}
          onToggleAutopilot={toggleAutopilot}
          sendDay={sendDay}
          sendTime={sendTime}
        />

        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Topbar */}
          <div className="flex h-14 flex-shrink-0 items-center border-b border-line bg-surface px-6">
            <div>
              <span className="text-sm font-medium text-content">Dashboard</span>
              <span className="mx-2 text-content-muted">&middot;</span>
              <span className="text-sm text-content-muted">
                {industry ?? "Business"} &middot; {voice ?? "Friendly"} voice
              </span>
            </div>
            <div className="ml-auto flex items-center gap-3">
              {/* Usage bar */}
              {subscription && (
                <div className="hidden items-center gap-2 sm:flex">
                  <span className="text-xs text-content-muted">
                    {msgUsed.toLocaleString()} / {msgLimit.toLocaleString()} msgs
                  </span>
                  <div className="h-1 w-20 rounded-full bg-line">
                    <div className="h-1 rounded-full bg-accent" style={{ width: `${msgPct}%` }} />
                  </div>
                </div>
              )}
              <NotificationBell
                notifications={notifications}
                onMarkRead={markNotificationRead}
                onMarkAll={markAllRead}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-5xl px-6 py-8">
              {/* Stats */}
              <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <StatCard label="Total customers" value={String(customers.length)} />
                <StatCard label="Messages sent" value={String(messagesSent)} />
                <StatCard label="Replies received" value={String(repliesReceived)} />
                <StatCard label="Revenue tracked" value={formatCurrency(revenueTracked)} />
                <StatCard label="Customers returned" value={String(returnedCount)} />
                <StatCard label="Conversion rate" value={`${conversionRate}%`} />
              </div>

              <div className="grid gap-5 lg:grid-cols-3">
                {/* Customers table */}
                <div className="overflow-hidden rounded-card border border-line bg-surface lg:col-span-2">
                  <div className="flex items-center justify-between border-b border-line px-6 py-4">
                    <h2 className="font-heading text-sm font-semibold text-content">Customers</h2>
                    <div className="flex items-center gap-2">
                      {/* Export dropdown */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setExportOpen((o) => !o)}
                          className="inline-flex h-8 items-center gap-1.5 rounded-btn border border-line px-3 text-xs font-medium text-content-muted transition-colors hover:border-content-muted hover:text-content"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                          </svg>
                          Export
                        </button>
                        {exportOpen && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setExportOpen(false)} />
                            <div className="absolute right-0 top-9 z-20 w-52 rounded-card border border-line bg-surface shadow-xl">
                              <button
                                type="button"
                                className="flex w-full items-center gap-2 px-4 py-2.5 text-xs text-content hover:bg-base"
                                onClick={() => { exportCustomersCsv(customers); setExportOpen(false); }}
                              >
                                Export customers CSV
                              </button>
                              <button
                                type="button"
                                className="flex w-full items-center gap-2 border-t border-line px-4 py-2.5 text-xs text-content hover:bg-base"
                                onClick={() => { exportMessagesCsv(messages, customers); setExportOpen(false); }}
                              >
                                Export messages CSV
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={openAddSlider}
                        className="inline-flex h-8 items-center gap-1.5 rounded-btn border border-line px-3 text-xs font-medium text-content-muted transition-colors hover:border-content-muted hover:text-content"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Add customer
                      </button>
                    </div>
                  </div>

                  {customers.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                      <p className="text-sm font-medium text-content">No customers yet</p>
                      <p className="mt-1 text-xs text-content-muted">Add your first customer to get started.</p>
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-line text-left">
                          <th className="px-6 py-3 text-xs font-medium uppercase tracking-wide text-content-muted">Name</th>
                          <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-content-muted">Phone</th>
                          <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-content-muted">Last purchase</th>
                          <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-content-muted">Status</th>
                          <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-content-muted">Returned</th>
                          <th className="px-4 py-3" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {customers.map((customer) => {
                          const status = latestStatus.get(customer.id);
                          const row = rowState[customer.id];
                          const customerStatus = customer.status;
                          return (
                            <tr
                              key={customer.id}
                              className="group relative border-l-2 border-l-transparent align-top transition-colors hover:border-l-accent hover:bg-accent/5"
                            >
                              <td className="px-6 py-3.5">
                                <div className="font-medium text-content">{customer.name}</div>
                                <div className="font-mono text-xs text-content-muted">
                                  {formatCurrency(totalSpend(customer.spend_history))}
                                </div>
                              </td>
                              <td className="px-4 py-3.5 text-content-muted">{customer.phone ?? "—"}</td>
                              <td className="px-4 py-3.5 text-content-muted">{formatDate(customer.last_purchase)}</td>
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
                                <span className="font-mono text-xs text-content-muted">
                                  {customer.return_visit_count ?? 0}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-right">
                                <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    type="button"
                                    disabled={row?.returning}
                                    onClick={() => markReturnVisit(customer)}
                                    className="inline-flex h-7 items-center rounded-btn border border-line bg-surface px-2 text-xs font-medium text-content-muted hover:border-green-500/40 hover:text-green-400 disabled:opacity-40"
                                  >
                                    {row?.returning ? "…" : "Returned"}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={row?.loading}
                                    onClick={() => generateAndSend(customer)}
                                    className="inline-flex h-7 items-center rounded-btn border border-line bg-surface px-2.5 text-xs font-medium text-content-muted hover:border-content-muted hover:text-content disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    {row?.loading ? (
                                      <>
                                        <span className="mr-1.5 h-3 w-3 animate-spin rounded-full border border-content-muted/40 border-t-content-muted" />
                                        Sending...
                                      </>
                                    ) : (
                                      "Send"
                                    )}
                                  </button>
                                </div>
                                {row?.error && (
                                  <p className="mt-1 text-right text-xs text-danger">{row.error}</p>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Message feed */}
                <div className="overflow-hidden rounded-card border border-line bg-surface">
                  <div className="border-b border-line px-6 py-4">
                    <h2 className="font-heading text-sm font-semibold text-content">Message history</h2>
                  </div>
                  <div className="overflow-y-auto divide-y divide-line" style={{ maxHeight: "520px" }}>
                    {messages.length === 0 ? (
                      <div className="px-6 py-10 text-center">
                        <p className="text-sm font-medium text-content">No messages yet</p>
                        <p className="mt-1 text-xs text-content-muted">Send a message to see it here.</p>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div key={message.id} className="px-5 py-3.5">
                          <div className="mb-2 flex items-center justify-between">
                            <Badge tone={message.direction === "inbound" ? "brand" : "gray"}>
                              {message.direction === "inbound" ? "Reply" : "Outbound"}
                            </Badge>
                            <span className="text-xs text-content-muted">{formatDate(message.sent_at)}</span>
                          </div>
                          <div
                            className={`inline-block max-w-full rounded-card px-3.5 py-2.5 text-xs leading-relaxed ${
                              message.direction === "inbound"
                                ? "rounded-tr-sm bg-blue-500/10 text-content border border-blue-500/20"
                                : "rounded-tl-sm bg-accent/10 text-content border border-accent/20"
                            }`}
                          >
                            {message.content}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
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
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                className="rounded-btn p-1 text-content-muted transition-colors hover:bg-base hover:text-content"
              >
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
                  <input
                    type={type}
                    value={draft[field]}
                    onChange={(e) => setDraft({ ...draft, [field]: e.target.value })}
                    placeholder={placeholder}
                    min={type === "number" ? 0 : undefined}
                    step={type === "number" ? "0.01" : undefined}
                    className={slideInputClass}
                  />
                </div>
              ))}
              {addError && <p className="text-xs text-danger">{addError}</p>}
            </div>

            <div className="flex gap-2.5 border-t border-line px-6 py-4">
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                disabled={addLoading}
                className="flex-1 h-9 rounded-btn border border-line text-sm font-medium text-content-muted transition-colors hover:border-content-muted hover:text-content disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={addCustomer}
                disabled={addLoading}
                className="flex flex-1 h-9 items-center justify-center gap-2 rounded-btn bg-accent text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
              >
                {addLoading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden />
                    Adding...
                  </>
                ) : (
                  "Add customer"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
