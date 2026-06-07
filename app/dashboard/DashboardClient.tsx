"use client";

import { useMemo, useState } from "react";
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
} from "@/utils/database.types";

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
}

const statusTone: Record<MessageStatus, "gray" | "green" | "yellow" | "red" | "brand"> = {
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

// ── Sidebar ────────────────────────────────────────────────────────────────

function Sidebar({
  businessName,
  userEmail,
  autopilot,
  autopilotSaving,
  onToggleAutopilot,
}: {
  businessName: string;
  userEmail?: string | null;
  autopilot: boolean;
  autopilotSaving: boolean;
  onToggleAutopilot: () => void;
}) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex w-60 flex-shrink-0 flex-col bg-slate-900">
      {/* Logo */}
      <div className="flex h-16 items-center px-5 border-b border-white/5">
        <span className="text-sm font-semibold text-white">Scaleva</span>
      </div>

      {/* Business name */}
      <div className="px-5 py-4 border-b border-white/5">
        <p className="text-xs text-slate-500 uppercase tracking-widest font-medium mb-1">Business</p>
        <p className="text-sm font-medium text-slate-300 truncate">{businessName}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white"
        >
          <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
          </svg>
          Dashboard
        </Link>
      </nav>

      {/* Autopilot toggle */}
      <div className="px-5 py-4 border-t border-white/5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Autopilot</span>
          <button
            type="button"
            onClick={onToggleAutopilot}
            disabled={autopilotSaving}
            className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 focus:outline-none"
            style={{ backgroundColor: autopilot ? "#4f46e5" : "#334155" }}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${autopilot ? "translate-x-4" : "translate-x-0.5"}`}
            />
          </button>
        </div>
        <p className="mt-0.5 text-xs text-slate-500">
          {autopilot ? "Sending automatically" : "Manual mode"}
        </p>
      </div>

      {/* User */}
      <div className="border-t border-white/5 px-5 py-4">
        {userEmail && (
          <p className="mb-2 text-xs text-slate-500 truncate">{userEmail}</p>
        )}
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center gap-2 text-xs font-medium text-slate-400 transition-colors hover:text-white"
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

// ── Stat card ──────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: "indigo" | "emerald" | "violet";
}) {
  const iconBg = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    violet: "bg-violet-50 text-violet-600",
  }[color];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg ${iconBg}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold tracking-tight text-gray-900">{value}</p>
      <p className="mt-0.5 text-xs text-gray-500">{label}</p>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

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
}: DashboardClientProps) {
  const [autopilot, setAutopilot] = useState(initialAutopilot);
  const [autopilotSaving, setAutopilotSaving] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [rowState, setRowState] = useState<
    Record<string, { loading: boolean; error: string | null }>
  >({});

  const [addOpen, setAddOpen] = useState(false);
  const [draft, setDraft] = useState<CustomerDraft>(emptyDraft());
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const messagesSent = useMemo(
    () => messages.filter((m) => m.direction === "outbound").length,
    [messages]
  );
  const repliesReceived = useMemo(
    () => messages.filter((m) => m.direction === "inbound").length,
    [messages]
  );

  const latestStatus = useMemo(() => {
    const map = new Map<string, MessageStatus>();
    for (const m of messages) {
      if (!map.has(m.customer_id)) map.set(m.customer_id, m.status);
    }
    return map;
  }, [messages]);

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
      if (!genRes.ok || !genData.message) {
        throw new Error(genData.error ?? "Failed to generate message");
      }

      const sendRes = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: customer.id, content: genData.message }),
      });
      const sendData = (await sendRes.json()) as {
        message?: Message;
        error?: string;
        detail?: string;
      };
      if (!sendRes.ok || !sendData.message) {
        const msg = sendData.detail
          ? `${sendData.error}: ${sendData.detail}`
          : (sendData.error ?? "Failed to send message");
        throw new Error(msg);
      }

      setMessages((prev) => [sendData.message as Message, ...prev]);
      setRowState((s) => ({ ...s, [customer.id]: { loading: false, error: null } }));
    } catch (e) {
      setRowState((s) => ({
        ...s,
        [customer.id]: {
          loading: false,
          error: e instanceof Error ? e.message : "Something went wrong",
        },
      }));
    }
  }

  function openAddSlider() {
    setDraft(emptyDraft());
    setAddError(null);
    setAddOpen(true);
  }

  async function addCustomer() {
    if (!draft.name.trim()) {
      setAddError("Name is required.");
      return;
    }
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

    if (error || !newCustomer) {
      setAddError(error?.message ?? "Failed to add customer.");
      return;
    }

    setCustomers((prev) => [...prev, newCustomer]);
    setAddOpen(false);
  }

  return (
    <>
      <div className="flex min-h-screen bg-gray-50">
        {/* Sidebar */}
        <Sidebar
          businessName={businessName}
          userEmail={userEmail}
          autopilot={autopilot}
          autopilotSaving={autopilotSaving}
          onToggleAutopilot={toggleAutopilot}
        />

        {/* Main content */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-5xl px-6 py-8">

            {/* Page header */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {industry ?? "Business"} &middot; {voice ?? "Friendly"} voice
              </p>
            </div>

            {/* Stats */}
            <div className="mb-8 grid gap-4 sm:grid-cols-3">
              <StatCard
                label="Total customers"
                value={String(customers.length)}
                color="indigo"
                icon={
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                }
              />
              <StatCard
                label="Messages sent"
                value={String(messagesSent)}
                color="emerald"
                icon={
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                }
              />
              <StatCard
                label="Replies received"
                value={String(repliesReceived)}
                color="violet"
                icon={
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                  </svg>
                }
              />
            </div>

            {/* Content grid */}
            <div className="grid gap-5 lg:grid-cols-3">
              {/* Customers table */}
              <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                  <h2 className="text-sm font-semibold text-gray-900">Customers</h2>
                  <button
                    type="button"
                    onClick={openAddSlider}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Add customer
                  </button>
                </div>

                {customers.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-900">No customers yet</p>
                    <p className="mt-1 text-xs text-gray-500">Add your first customer to get started.</p>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-left">
                        <th className="px-6 py-3 text-xs font-medium uppercase tracking-wide text-gray-400">Name</th>
                        <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-gray-400">Phone</th>
                        <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-gray-400">Last purchase</th>
                        <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-gray-400">Status</th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {customers.map((customer) => {
                        const status = latestStatus.get(customer.id);
                        const row = rowState[customer.id];
                        return (
                          <tr key={customer.id} className="group hover:bg-gray-50/60 align-top">
                            <td className="px-6 py-3.5">
                              <div className="font-medium text-gray-900">{customer.name}</div>
                              <div className="text-xs text-gray-400">
                                {formatCurrency(totalSpend(customer.spend_history))}
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-gray-600">
                              {customer.phone ?? "—"}
                            </td>
                            <td className="px-4 py-3.5 text-gray-600">
                              {formatDate(customer.last_purchase)}
                            </td>
                            <td className="px-4 py-3.5">
                              {status ? (
                                <Badge tone={statusTone[status]}>{status}</Badge>
                              ) : (
                                <Badge tone="gray">not sent</Badge>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <button
                                type="button"
                                disabled={row?.loading}
                                onClick={() => generateAndSend(customer)}
                                className="inline-flex h-7 items-center rounded-md border border-gray-300 bg-white px-2.5 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {row?.loading ? (
                                  <>
                                    <span className="mr-1.5 h-3 w-3 animate-spin rounded-full border border-gray-400 border-t-gray-700" />
                                    Sending…
                                  </>
                                ) : (
                                  "Send message"
                                )}
                              </button>
                              {row?.error && (
                                <p className="mt-1 text-right text-xs text-red-600">{row.error}</p>
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
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                <div className="border-b border-gray-100 px-6 py-4">
                  <h2 className="text-sm font-semibold text-gray-900">Message history</h2>
                </div>
                <div className="divide-y divide-gray-50 overflow-y-auto" style={{ maxHeight: "520px" }}>
                  {messages.length === 0 ? (
                    <div className="px-6 py-10 text-center">
                      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                        </svg>
                      </div>
                      <p className="text-sm font-medium text-gray-900">No messages yet</p>
                      <p className="mt-1 text-xs text-gray-500">Send a message to see it here.</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div key={message.id} className="px-5 py-3.5">
                        <div className="mb-2 flex items-center justify-between">
                          <Badge
                            tone={message.direction === "inbound" ? "brand" : "gray"}
                          >
                            {message.direction === "inbound" ? "Reply" : "Outbound"}
                          </Badge>
                          <span className="text-xs text-gray-400">
                            {formatDate(message.sent_at)}
                          </span>
                        </div>
                        <div
                          className={`inline-block max-w-full rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                            message.direction === "outbound"
                              ? "rounded-tl-sm bg-indigo-600 text-white"
                              : "rounded-tr-sm bg-gray-100 text-gray-800"
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

      {/* Add Customer slide-over */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="flex-1 bg-black/30 backdrop-blur-sm"
            onClick={() => setAddOpen(false)}
            aria-hidden
          />
          <div className="flex w-full max-w-sm flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-sm font-semibold text-gray-900">Add customer</h2>
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {[
                { label: "Name *", field: "name" as const, placeholder: "Jane Smith", type: "text" },
                { label: "Phone", field: "phone" as const, placeholder: "+15551234567", type: "tel" },
                { label: "Email", field: "email" as const, placeholder: "jane@example.com", type: "email" },
                { label: "Last purchase", field: "last_purchase" as const, placeholder: "", type: "date" },
                { label: "Lifetime spend ($)", field: "spend_amount" as const, placeholder: "0.00", type: "number" },
              ].map(({ label, field, placeholder, type }) => (
                <div key={field}>
                  <label className="mb-1.5 block text-xs font-medium text-gray-700">{label}</label>
                  <input
                    type={type}
                    value={draft[field]}
                    onChange={(e) => setDraft({ ...draft, [field]: e.target.value })}
                    placeholder={placeholder}
                    min={type === "number" ? 0 : undefined}
                    step={type === "number" ? "0.01" : undefined}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              ))}

              {addError && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  <p className="text-xs text-red-700">{addError}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2.5 border-t border-gray-200 px-6 py-4">
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                disabled={addLoading}
                className="flex-1 h-9 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={addCustomer}
                disabled={addLoading}
                className="flex-1 flex h-9 items-center justify-center gap-2 rounded-lg bg-indigo-600 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-60"
              >
                {addLoading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden />
                    Adding…
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
