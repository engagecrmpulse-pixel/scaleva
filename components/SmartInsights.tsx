"use client";

import Link from "next/link";
import type { BusinessConfig, Customer, Message, Subscription } from "@/utils/database.types";

interface SmartInsightsProps {
  customers: Customer[];
  messages: Message[];
  config: BusinessConfig;
  autopilot: boolean;
  subscription: Subscription | null;
  atRiskCount: number;
  onEnableAutopilot?: () => void;
}

interface Insight {
  id: string;
  type: "opportunity" | "warning" | "win" | "tip";
  title: string;
  body: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

const typeConfig = {
  opportunity: {
    border: "border-accent/20",
    bg: "bg-accent/[0.04]",
    dot: "bg-accent",
    label: "text-accent/70",
    labelText: "Opportunity",
  },
  warning: {
    border: "border-yellow-500/25",
    bg: "bg-yellow-500/[0.04]",
    dot: "bg-yellow-400",
    label: "text-yellow-500/70",
    labelText: "Attention",
  },
  win: {
    border: "border-green-500/20",
    bg: "bg-green-500/[0.04]",
    dot: "bg-green-400",
    label: "text-green-500/70",
    labelText: "Win",
  },
  tip: {
    border: "border-line",
    bg: "bg-surface",
    dot: "bg-content-muted/60",
    label: "text-content-muted/70",
    labelText: "Tip",
  },
};

export function SmartInsights({
  customers,
  messages,
  config,
  autopilot,
  subscription,
  atRiskCount,
  onEnableAutopilot,
}: SmartInsightsProps) {
  const messagedIds = new Set(
    messages.filter((m) => m.direction === "outbound").map((m) => m.customer_id)
  );
  const uncontactedCount = customers.filter((c) => !messagedIds.has(c.id)).length;
  const returnedCount = customers.filter((c) => (c.return_visit_count ?? 0) > 0).length;

  const msgLimit =
    subscription?.plan === "enterprise" ? null : (subscription?.message_limit ?? 2000);
  const msgUsed = subscription?.message_count_this_period ?? 0;
  const msgPct = msgLimit ? (msgUsed / msgLimit) * 100 : 0;

  const hasWinBack = config.sequenceEnabled === true;
  const hasReview =
    config.reviewRequestEnabled === true && !!(config.reviewLink as string | undefined);
  const hasAutoReply = config.autoReplyEnabled === true;
  const hasInstructions = !!(config.customInstructions?.trim());

  const insights: Insight[] = [];

  if (uncontactedCount > 0 && customers.length > 0) {
    insights.push({
      id: "uncontacted",
      type: "opportunity",
      title: `${uncontactedCount} customer${uncontactedCount !== 1 ? "s" : ""} haven't been reached`,
      body: "Activate Scaleva's retention engine — most businesses see 15–25% of messaged customers return within 30 days.",
      actionLabel: "View customers",
      actionHref: "/dashboard",
    });
  }

  if (atRiskCount > 0 && !autopilot) {
    insights.push({
      id: "at_risk_no_autopilot",
      type: "warning",
      title: `${atRiskCount} customer${atRiskCount !== 1 ? "s" : ""} are drifting away`,
      body: "Enable autopilot to reach at-risk customers automatically before they stop coming back.",
      actionLabel: "Enable autopilot",
      onAction: onEnableAutopilot,
    });
  }

  if (!hasWinBack && customers.length >= 5) {
    insights.push({
      id: "win_back",
      type: "tip",
      title: "Win-back sequences are off",
      body: "Businesses with sequences recover 3× more lapsed customers automatically — enable in 10 seconds.",
      actionLabel: "Enable sequences",
      actionHref: "/settings",
    });
  }

  if (!hasReview && returnedCount > 0) {
    insights.push({
      id: "review_requests",
      type: "opportunity",
      title: `${returnedCount} returning customer${returnedCount !== 1 ? "s" : ""} could become reviewers`,
      body: "Set up automated review requests to turn happy returning customers into 5-star Google reviews.",
      actionLabel: "Configure reviews",
      actionHref: "/settings",
    });
  }

  if (!hasAutoReply && subscription?.plan !== "starter" && messages.length > 5) {
    insights.push({
      id: "auto_reply",
      type: "tip",
      title: "AI auto-reply is disabled",
      body: "Respond to customers 24/7 automatically. Faster replies = higher satisfaction and more return visits.",
      actionLabel: "Enable auto-reply",
      actionHref: "/settings",
    });
  }

  if (msgPct >= 70 && msgPct < 80 && msgLimit !== null) {
    insights.push({
      id: "msg_limit",
      type: "warning",
      title: `${Math.round(msgPct)}% of monthly messages used`,
      body: `You've used ${msgUsed.toLocaleString()} of ${msgLimit.toLocaleString()} messages. Upgrade now to avoid disruption.`,
      actionLabel: "See plans",
      actionHref: "/pricing",
    });
  }

  if (!hasInstructions && messages.length > 15) {
    insights.push({
      id: "custom_instructions",
      type: "tip",
      title: "Your AI could sound more like you",
      body: "Add custom instructions — current offers, brand rules, or seasonal context — to make every message feel hand-crafted.",
      actionLabel: "Customize AI",
      actionHref: "/settings",
    });
  }

  const ordered = [
    ...insights.filter((i) => i.type === "warning"),
    ...insights.filter((i) => i.type === "opportunity"),
    ...insights.filter((i) => i.type === "win"),
    ...insights.filter((i) => i.type === "tip"),
  ].slice(0, 3);

  if (ordered.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center gap-2">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
        <p className="text-[10px] font-semibold uppercase tracking-widest text-content-muted">
          Your opportunities
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ordered.map((insight) => {
          const tc = typeConfig[insight.type];
          return (
            <div
              key={insight.id}
              className={`flex flex-col gap-2.5 rounded-card border p-4 ${tc.border} ${tc.bg}`}
            >
              <div className="flex items-center gap-2">
                <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${tc.dot}`} />
                <span className={`text-[9px] font-bold uppercase tracking-widest ${tc.label}`}>
                  {tc.labelText}
                </span>
              </div>
              <p className="text-xs font-semibold leading-snug text-content">{insight.title}</p>
              <p className="text-xs leading-relaxed text-content-muted">{insight.body}</p>
              {insight.actionLabel && (
                <div className="mt-auto">
                  {insight.onAction ? (
                    <button
                      type="button"
                      onClick={insight.onAction}
                      className="text-xs font-semibold text-accent hover:underline"
                    >
                      {insight.actionLabel} →
                    </button>
                  ) : insight.actionHref ? (
                    <Link
                      href={insight.actionHref}
                      className="text-xs font-semibold text-accent hover:underline"
                    >
                      {insight.actionLabel} →
                    </Link>
                  ) : null}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
