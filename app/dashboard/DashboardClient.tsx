"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card";
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

export function DashboardClient({
  businessId,
  businessName,
  industry,
  voice,
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

  // Add-customer slide-over state
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
    if (error) {
      setAutopilot(!next);
    }
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
      };
      if (!sendRes.ok || !sendData.message) {
        throw new Error(sendData.error ?? "Failed to send message");
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
      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Header + autopilot */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {businessName}
            </h1>
            <p className="text-sm text-gray-500">
              {industry ?? "Business"} · {voice ?? "friendly"} voice
            </p>
          </div>
          <button
            type="button"
            onClick={toggleAutopilot}
            disabled={autopilotSaving}
            className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-60"
          >
            <span className="text-sm font-medium text-gray-700">Autopilot</span>
            <span
              className={
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors " +
                (autopilot ? "bg-brand-600" : "bg-gray-300")
              }
            >
              <span
                className={
                  "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform " +
                  (autopilot ? "translate-x-5" : "translate-x-0.5")
                }
              />
            </span>
            <Badge tone={autopilot ? "green" : "gray"}>
              {autopilot ? "On" : "Off"}
            </Badge>
          </button>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <StatCard label="Total customers" value={String(customers.length)} />
          <StatCard label="Messages sent" value={String(messagesSent)} />
          <StatCard label="Replies received" value={String(repliesReceived)} />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Customers */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Customers</CardTitle>
                <Button size="sm" onClick={openAddSlider}>
                  + Add Customer
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {customers.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-gray-500">
                  No customers yet. Add one above.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-400">
                      <th className="px-5 py-2 font-medium">Name</th>
                      <th className="px-5 py-2 font-medium">Phone</th>
                      <th className="px-5 py-2 font-medium">Last purchase</th>
                      <th className="px-5 py-2 font-medium">Next contact</th>
                      <th className="px-5 py-2 font-medium">Status</th>
                      <th className="px-5 py-2 font-medium" />
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((customer) => {
                      const status = latestStatus.get(customer.id);
                      const row = rowState[customer.id];
                      return (
                        <tr
                          key={customer.id}
                          className="border-b border-gray-50 last:border-0 align-top"
                        >
                          <td className="px-5 py-3">
                            <div className="font-medium text-gray-900">
                              {customer.name}
                            </div>
                            <div className="text-xs text-gray-400">
                              {formatCurrency(totalSpend(customer.spend_history))}
                            </div>
                          </td>
                          <td className="px-5 py-3 text-gray-700">
                            {customer.phone ?? "—"}
                          </td>
                          <td className="px-5 py-3 text-gray-700">
                            {formatDate(customer.last_purchase)}
                          </td>
                          <td className="px-5 py-3 text-gray-700">
                            {formatDate(customer.next_contact_date)}
                          </td>
                          <td className="px-5 py-3">
                            {status ? (
                              <Badge tone={statusTone[status]}>{status}</Badge>
                            ) : (
                              <Badge tone="gray">not contacted</Badge>
                            )}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={row?.loading}
                              onClick={() => generateAndSend(customer)}
                            >
                              {row?.loading ? "Sending…" : "Generate & Send"}
                            </Button>
                            {row?.error && (
                              <p className="mt-1 text-xs text-red-600">
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
            </CardContent>
          </Card>

          {/* Message feed */}
          <Card>
            <CardHeader>
              <CardTitle>Message history</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {messages.length === 0 ? (
                <p className="text-sm text-gray-500">No messages yet.</p>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className="rounded-lg border border-gray-100 p-3"
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <Badge
                        tone={message.direction === "inbound" ? "brand" : "gray"}
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

      {/* Add Customer slide-over */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="flex-1 bg-black/40"
            onClick={() => setAddOpen(false)}
            aria-hidden
          />
          <div className="flex w-full max-w-md flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Add Customer</h2>
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="flex flex-col gap-4">
                <Input
                  label="Name *"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="Jane Smith"
                />
                <Input
                  label="Phone"
                  value={draft.phone}
                  onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
                  placeholder="+15551234567"
                />
                <Input
                  label="Email"
                  type="email"
                  value={draft.email}
                  onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                  placeholder="jane@example.com"
                />
                <Input
                  label="Last purchase date"
                  type="date"
                  value={draft.last_purchase}
                  onChange={(e) =>
                    setDraft({ ...draft, last_purchase: e.target.value })
                  }
                />
                <Input
                  label="Lifetime spend ($)"
                  type="number"
                  min={0}
                  step="0.01"
                  value={draft.spend_amount}
                  onChange={(e) =>
                    setDraft({ ...draft, spend_amount: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>

              {addError && (
                <p className="mt-4 text-sm text-red-600">{addError}</p>
              )}
            </div>

            <div className="flex gap-3 border-t border-gray-200 px-6 py-4">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setAddOpen(false)}
                disabled={addLoading}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={addCustomer}
                disabled={addLoading}
              >
                {addLoading ? "Adding…" : "Add Customer"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
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
