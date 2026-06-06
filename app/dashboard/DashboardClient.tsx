"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/Button";
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
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [rowState, setRowState] = useState<
    Record<string, { loading: boolean; error: string | null }>
  >({});

  const customers = initialCustomers;

  // Stats derived from the live message list.
  const messagesSent = useMemo(
    () => messages.filter((m) => m.direction === "outbound").length,
    [messages]
  );
  const repliesReceived = useMemo(
    () => messages.filter((m) => m.direction === "inbound").length,
    [messages]
  );

  // Latest message status per customer (messages are newest-first).
  const latestStatus = useMemo(() => {
    const map = new Map<string, MessageStatus>();
    for (const m of messages) {
      if (!map.has(m.customer_id)) map.set(m.customer_id, m.status);
    }
    return map;
  }, [messages]);

  async function toggleAutopilot() {
    const next = !autopilot;
    setAutopilot(next); // optimistic
    setAutopilotSaving(true);

    // TODO: Turning autopilot on only persists the preference. Actually sending
    // messages automatically on the configured cadence requires a scheduled
    // backend job (cron / Supabase Edge Function), which is not yet wired up.
    const supabase = createClient();
    const nextConfig: BusinessConfig = { ...config, autopilot: next };
    const { error } = await supabase
      .from("businesses")
      .update({ config: nextConfig })
      .eq("id", businessId);

    setAutopilotSaving(false);
    if (error) {
      setAutopilot(!next); // revert on failure
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

  return (
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
            <CardTitle>Customers</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {customers.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-gray-500">
                No customers yet.
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
