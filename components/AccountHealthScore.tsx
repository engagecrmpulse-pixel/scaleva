"use client";

import { useState } from "react";
import Link from "next/link";
import type { BusinessConfig } from "@/utils/database.types";

interface AccountHealthScoreProps {
  config: BusinessConfig;
  autopilot: boolean;
  customerCount: number;
  messagesSent: number;
  onEnableAutopilot?: () => void;
  onAddCustomer?: () => void;
  onSendFirstMessage?: () => void;
}

interface HealthItem {
  label: string;
  description: string;
  done: boolean;
  points: number;
  actionLabel: string;
  actionHref?: string;
  onAction?: () => void;
}

export function AccountHealthScore({
  config,
  autopilot,
  customerCount,
  messagesSent,
  onEnableAutopilot,
  onAddCustomer,
  onSendFirstMessage,
}: AccountHealthScoreProps) {
  const [expanded, setExpanded] = useState(false);

  const integrations = config.integrations ?? {};
  const hasIntegration = Object.values(integrations).some((i) => i.connected);

  const items: HealthItem[] = [
    {
      label: "Customers imported",
      description: "Your customer list is the foundation of retention — import from a spreadsheet or connect an integration.",
      done: customerCount > 0,
      points: 20,
      actionLabel: "Add customers",
      onAction: onAddCustomer,
    },
    {
      label: "Autopilot enabled",
      description: "Reach customers automatically on your schedule — no manual work required.",
      done: autopilot,
      points: 20,
      actionLabel: "Enable autopilot",
      onAction: onEnableAutopilot,
    },
    {
      label: "First message sent",
      description: "Select any customer and hit Send to generate and send your first AI-personalized message.",
      done: messagesSent > 0,
      points: 15,
      actionLabel: "Go to customers",
      onAction: onSendFirstMessage,
    },
    {
      label: "Integration connected",
      description: "Sync customers automatically from Square, Clover, Stripe, or HubSpot — no manual imports.",
      done: hasIntegration,
      points: 15,
      actionLabel: "Connect an integration",
      actionHref: "/settings#integrations",
    },
    {
      label: "Win-back sequences enabled",
      description: "Auto-follow up at 7, 21, and 45 days to recover lapsed customers hands-free.",
      done: config.sequenceEnabled === true,
      points: 15,
      actionLabel: "Enable sequences",
      actionHref: "/settings#win-back",
    },
    {
      label: "AI instructions customized",
      description: "Tell the AI your brand rules, active offers, and voice for better messages.",
      done: !!(config.customInstructions?.trim()),
      points: 10,
      actionLabel: "Customize AI",
      actionHref: "/settings#ai-instructions",
    },
    {
      label: "Review requests configured",
      description: "Automatically ask returning customers for a Google review.",
      done: config.reviewRequestEnabled === true && !!(config.reviewLink as string | undefined),
      points: 5,
      actionLabel: "Set up reviews",
      actionHref: "/settings#reviews",
    },
  ];

  const totalPoints = items.reduce((sum, i) => sum + i.points, 0);
  const earnedPoints = items.filter((i) => i.done).reduce((sum, i) => sum + i.points, 0);
  const score = Math.round((earnedPoints / totalPoints) * 100);
  const pendingItems = items.filter((i) => !i.done);

  if (score === 100) return null;

  const circumference = 2 * Math.PI * 16;
  const scoreColor = score >= 80 ? "#10B981" : score >= 50 ? "#3B82F6" : "#F59E0B";

  return (
    <div className="mb-6 overflow-hidden rounded-card border border-line bg-surface">
      <button
        type="button"
        onClick={() => setExpanded((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-4 transition-colors hover:bg-base/50"
      >
        <div className="flex items-center gap-4">
          <div className="relative flex h-11 w-11 flex-shrink-0 items-center justify-center">
            <svg className="h-11 w-11 -rotate-90" viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="16" fill="none" stroke="#2A2D35" strokeWidth="3.5" />
              <circle
                cx="20" cy="20" r="16" fill="none" stroke={scoreColor}
                strokeWidth="3.5" strokeDasharray={circumference}
                strokeDashoffset={circumference - (score / 100) * circumference}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 0.8s ease" }}
              />
            </svg>
            <span className="absolute font-mono text-[11px] font-bold text-content">{score}</span>
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-content">Setup score — {score}%</p>
            <p className="mt-0.5 text-xs text-content-muted">
              {pendingItems.length === 1
                ? "1 step left to maximize your results"
                : `${pendingItems.length} steps left to maximize your results`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden gap-1 sm:flex">
            {items.map((item) => (
              <span
                key={item.label}
                title={item.label}
                className={`h-1 w-3 rounded-full transition-colors ${item.done ? "bg-green-500" : "bg-line"}`}
              />
            ))}
          </div>
          <svg
            className={`h-4 w-4 text-content-muted transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-line px-5 pb-5 pt-3">
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.label}
                className={`flex items-start gap-3 transition-opacity ${item.done ? "opacity-40" : ""}`}
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${
                    item.done ? "bg-green-500/15" : "border border-line bg-base"
                  }`}
                >
                  {item.done ? (
                    <svg className="h-3 w-3 text-green-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-content-muted/30" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-medium ${item.done ? "text-content-muted" : "text-content"}`}>
                    {item.label}
                  </p>
                  {!item.done && (
                    <p className="mt-0.5 text-xs text-content-muted">{item.description}</p>
                  )}
                </div>
                {!item.done && (
                  <div className="flex-shrink-0 pt-0.5">
                    {item.onAction ? (
                      <button
                        type="button"
                        onClick={item.onAction}
                        className="inline-flex items-center gap-1 rounded-btn border border-accent/30 bg-accent/5 px-2.5 py-1 text-xs font-medium text-accent hover:bg-accent/10 transition-colors"
                      >
                        {item.actionLabel}
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                      </button>
                    ) : item.actionHref ? (
                      <Link
                        href={item.actionHref}
                        className="inline-flex items-center gap-1 rounded-btn border border-accent/30 bg-accent/5 px-2.5 py-1 text-xs font-medium text-accent hover:bg-accent/10 transition-colors"
                      >
                        {item.actionLabel}
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                      </Link>
                    ) : null}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
