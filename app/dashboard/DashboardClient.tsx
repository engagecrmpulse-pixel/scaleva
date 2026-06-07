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
    <aside className="flex w-60 flex-shrink-0 flex-col border-r border-line bg-surface">
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-line px-5">
        <span className="font-heading text-sm font-semibold tracking-tight text-content">
          Scaleva
        </span>
      </div>

      {/* Business name */}
      <div className="border-b border-line px-5 py-4">
        <p className="mb-1 text-[10px] font-medium uppercase tracking-widest text-content-muted">
          Business
        </p>
        <p className="truncate text-sm font-medium text-content">{businessName}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 rounded-btn bg-accent/10 px-3 py-2 text-sm font-medium text-accent"
        >
          <svg
            className="h-4 w-4 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
            />
          </svg>
          Dashboard
        </Link>
      </nav>

      {/* Autopilot */}
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
        <p className="mt-0.5 text-xs text-content-muted">
          {autopilot ? "Sending automatically" : "Manual mode"}
        </p>
      </div>

      {/* User */}
      <div className="border-t border-line px-5 py-4">
        {userEmail && (
          <p className="mb-2 truncate text-xs text-content-muted">{userEmail}</p>
        )}
        <button
          type="button"
          onClick={handleSignOut}
          className="flex items-center gap-2 text-xs font-medium text-content-muted transition-colors hover:text-content"
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
            />
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
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-card border border-line bg-surface p-5">
      <p className="font-mono text-[28px] font-semibold leading-none tracking-tight text-content">
        {value}
      </p>
      <p className="mt-2 text-xs text-content-muted">{label}</p>
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
  const revenueTracked = useMemo(
    () =>
      customers.reduce(
        (sum, c) => sum + totalSpend(c.spend_history),
        0
      ),
    [customers]
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
    setRowState((s) => ({
      ...s,
      [customer.id]: { loading: true, error: null },
    }));

    try {
      const genRes = await fetch("/api/messages/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: customer.id }),
      });
      const genData = (await genRes.json()) as {
        message?: string;
        error?: string;
      };
      if (!genRes.ok || !genData.message) {
        throw new Error(genData.error ?? "Failed to generate message");
      }

      const sendRes = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customer.id,
          content: genData.message,
        }),
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
      setRowState((s) => ({
        ...s,
        [customer.id]: { loading: false, error: null },
      }));
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
        ? [
            {
              date: draft.last_purchase || new Date().toISOString(),
              amount: spendAmount,
            },
          ]
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

  const slideInputClass =
    "w-full rounded-btn border border-line bg-base px-3 py-2.5 text-sm text-content placeholder:text-content-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors";

  return (
    <>
      <div className="flex min-h-screen bg-base">
        {/* Sidebar */}
        <Sidebar
          businessName={businessName}
          userEmail={userEmail}
          autopilot={autopilot}
          autopilotSaving={autopilotSaving}
          onToggleAutopilot={toggleAutopilot}
        />

        {/* Main */}
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
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-5xl px-6 py-8">
              {/* Stats */}
              <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  label="Total customers"
                  value={String(customers.length)}
                />
                <StatCard
                  label="Messages sent"
                  value={String(messagesSent)}
                />
                <StatCard
                  label="Replies received"
                  value={String(repliesReceived)}
                />
                <StatCard
                  label="Revenue tracked"
                  value={formatCurrency(revenueTracked)}
                />
              </div>

              {/* Content grid */}
              <div className="grid gap-5 lg:grid-cols-3">
                {/* Customers table */}
                <div className="overflow-hidden rounded-card border border-line bg-surface lg:col-span-2">
                  <div className="flex items-center justify-between border-b border-line px-6 py-4">
                    <h2 className="font-heading text-sm font-semibold text-content">
                      Customers
                    </h2>
                    <button
                      type="button"
                      onClick={openAddSlider}
                      className="inline-flex h-8 items-center gap-1.5 rounded-btn border border-line px-3 text-xs font-medium text-content-muted transition-colors hover:border-content-muted hover:text-content"
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 4.5v15m7.5-7.5h-15"
                        />
                      </svg>
                      Add customer
                    </button>
                  </div>

                  {customers.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                      <p className="text-sm font-medium text-content">
                        No customers yet
                      </p>
                      <p className="mt-1 text-xs text-content-muted">
                        Add your first customer to get started.
                      </p>
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-line text-left">
                          <th className="px-6 py-3 text-xs font-medium uppercase tracking-wide text-content-muted">
                            Name
                          </th>
                          <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-content-muted">
                            Phone
                          </th>
                          <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-content-muted">
                            Last purchase
                          </th>
                          <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-content-muted">
                            Status
                          </th>
                          <th className="px-4 py-3" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {customers.map((customer) => {
                          const status = latestStatus.get(customer.id);
                          const row = rowState[customer.id];
                          return (
                            <tr
                              key={customer.id}
                              className="group relative border-l-2 border-l-transparent align-top transition-colors hover:border-l-accent hover:bg-accent/5"
                            >
                              <td className="px-6 py-3.5">
                                <div className="font-medium text-content">
                                  {customer.name}
                                </div>
                                <div className="font-mono text-xs text-content-muted">
                                  {formatCurrency(
                                    totalSpend(customer.spend_history)
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3.5 text-content-muted">
                                {customer.phone ?? "—"}
                              </td>
                              <td className="px-4 py-3.5 text-content-muted">
                                {formatDate(customer.last_purchase)}
                              </td>
                              <td className="px-4 py-3.5">
                                {status ? (
                                  <Badge tone={statusTone[status]}>
                                    {status}
                                  </Badge>
                                ) : (
                                  <Badge tone="gray">not sent</Badge>
                                )}
                              </td>
                              <td className="px-4 py-3.5 text-right">
                                <button
                                  type="button"
                                  disabled={row?.loading}
                                  onClick={() => generateAndSend(customer)}
                                  className="inline-flex h-7 items-center rounded-btn border border-line bg-surface px-2.5 text-xs font-medium text-content-muted opacity-0 transition-all hover:border-content-muted hover:text-content group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  {row?.loading ? (
                                    <>
                                      <span className="mr-1.5 h-3 w-3 animate-spin rounded-full border border-content-muted/40 border-t-content-muted" />
                                      Sending...
                                    </>
                                  ) : (
                                    "Send message"
                                  )}
                                </button>
                                {row?.error && (
                                  <p className="mt-1 text-right text-xs text-danger">
                                    {row.error}
                                  </p>
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
                    <h2 className="font-heading text-sm font-semibold text-content">
                      Message history
                    </h2>
                  </div>
                  <div
                    className="overflow-y-auto divide-y divide-line"
                    style={{ maxHeight: "520px" }}
                  >
                    {messages.length === 0 ? (
                      <div className="px-6 py-10 text-center">
                        <p className="text-sm font-medium text-content">
                          No messages yet
                        </p>
                        <p className="mt-1 text-xs text-content-muted">
                          Send a message to see it here.
                        </p>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div key={message.id} className="px-5 py-3.5">
                          <div className="mb-2 flex items-center justify-between">
                            <Badge
                              tone={
                                message.direction === "inbound"
                                  ? "brand"
                                  : "gray"
                              }
                            >
                              {message.direction === "inbound"
                                ? "Reply"
                                : "Outbound"}
                            </Badge>
                            <span className="text-xs text-content-muted">
                              {formatDate(message.sent_at)}
                            </span>
                          </div>
                          <div
                            className={`inline-block max-w-full rounded-card px-3.5 py-2.5 text-xs leading-relaxed ${
                              message.direction === "outbound"
                                ? "rounded-tl-sm bg-accent/10 text-content border border-accent/20"
                                : "rounded-tr-sm bg-line text-content"
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
          <div
            className="flex-1 bg-black/50 backdrop-blur-sm"
            onClick={() => setAddOpen(false)}
            aria-hidden
          />
          <div className="flex w-full max-w-sm flex-col border-l border-line bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <h2 className="font-heading text-sm font-semibold text-content">
                Add customer
              </h2>
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                className="rounded-btn p-1 text-content-muted transition-colors hover:bg-base hover:text-content"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 px-6 py-5">
              {[
                {
                  label: "Name *",
                  field: "name" as const,
                  placeholder: "Jane Smith",
                  type: "text",
                },
                {
                  label: "Phone",
                  field: "phone" as const,
                  placeholder: "+15551234567",
                  type: "tel",
                },
                {
                  label: "Email",
                  field: "email" as const,
                  placeholder: "jane@example.com",
                  type: "email",
                },
                {
                  label: "Last purchase",
                  field: "last_purchase" as const,
                  placeholder: "",
                  type: "date",
                },
                {
                  label: "Lifetime spend ($)",
                  field: "spend_amount" as const,
                  placeholder: "0.00",
                  type: "number",
                },
              ].map(({ label, field, placeholder, type }) => (
                <div key={field}>
                  <label className="mb-1.5 block text-xs font-medium text-content-muted">
                    {label}
                  </label>
                  <input
                    type={type}
                    value={draft[field]}
                    onChange={(e) =>
                      setDraft({ ...draft, [field]: e.target.value })
                    }
                    placeholder={placeholder}
                    min={type === "number" ? 0 : undefined}
                    step={type === "number" ? "0.01" : undefined}
                    className={slideInputClass}
                  />
                </div>
              ))}

              {addError && (
                <p className="text-xs text-danger">{addError}</p>
              )}
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
                    <span
                      className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                      aria-hidden
                    />
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
