"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Business, BusinessConfig, Subscription } from "@/utils/database.types";
import { VOICES, CADENCES } from "@/app/onboarding/types";
import { parseCustomersCsv } from "@/lib/import/csv";

const SEND_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const SEND_TIMES = ["8 AM", "9 AM", "12 PM", "3 PM", "6 PM"];
const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
];

const PLAN_LIMITS: Record<string, { customers: number; messages: number }> = {
  starter: { customers: 500, messages: 2000 },
  growth: { customers: 1500, messages: 6000 },
  pro: { customers: 5000, messages: 25000 },
};

interface SettingsClientProps {
  business: Business;
  subscription: Subscription | null;
  userEmail: string;
}

const inputClass =
  "w-full rounded-btn border border-line bg-base px-3 py-2.5 text-sm text-content placeholder:text-content-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors";
const labelClass = "mb-1.5 block text-xs font-medium text-content-muted";
const sectionClass = "rounded-card border border-line bg-surface p-6";
const sectionHeaderClass = "mb-4 font-heading text-sm font-semibold text-content";

export function SettingsClient({ business, subscription, userEmail }: SettingsClientProps) {
  const router = useRouter();
  const config: BusinessConfig = business.config ?? {};
  const integrations = config.integrations ?? {};

  const [name, setName] = useState(business.name);
  const [industry, setIndustry] = useState(business.industry ?? "");
  const [voice, setVoice] = useState(business.voice ?? "");
  const [goals, setGoals] = useState(business.goals ?? "");
  const [monthlyRevenueGoal, setMonthlyRevenueGoal] = useState(
    String((config.monthlyRevenueGoal as number | undefined) ?? "")
  );
  const [cadence, setCadence] = useState(config.cadence ?? "Weekly");
  const [sendDay, setSendDay] = useState(config.autopilotSendDay ?? "Monday");
  const [sendTime, setSendTime] = useState(config.autopilotSendTime ?? "9 AM");
  const [timezone, setTimezone] = useState(config.autopilotTimezone ?? "America/New_York");
  const [customInstructions, setCustomInstructions] = useState(config.customInstructions ?? "");
  const [emailReply, setEmailReply] = useState(config.emailNotifyReply !== false);
  const [emailFailed, setEmailFailed] = useState(config.emailNotifyFailed !== false);
  const [emailSummary, setEmailSummary] = useState(config.emailNotifyDailySummary !== false);
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(config.autoReplyEnabled === true);
  const [reviewRequestEnabled, setReviewRequestEnabled] = useState(config.reviewRequestEnabled === true);
  const [reviewLink, setReviewLink] = useState((config.reviewLink as string) ?? "");
  const [sequenceEnabled, setSequenceEnabled] = useState(config.sequenceEnabled === true);

  // Track initial saved values to detect unsaved changes
  const [savedState, setSavedState] = useState({
    name, industry, voice, goals, monthlyRevenueGoal, cadence, sendDay, sendTime, timezone,
    customInstructions, emailReply, emailFailed, emailSummary,
    autoReplyEnabled, reviewRequestEnabled, reviewLink, sequenceEnabled,
  });

  const isDirty =
    name !== savedState.name || industry !== savedState.industry ||
    voice !== savedState.voice || goals !== savedState.goals ||
    monthlyRevenueGoal !== savedState.monthlyRevenueGoal ||
    cadence !== savedState.cadence || sendDay !== savedState.sendDay ||
    sendTime !== savedState.sendTime || timezone !== savedState.timezone ||
    customInstructions !== savedState.customInstructions ||
    emailReply !== savedState.emailReply || emailFailed !== savedState.emailFailed ||
    emailSummary !== savedState.emailSummary ||
    autoReplyEnabled !== savedState.autoReplyEnabled ||
    reviewRequestEnabled !== savedState.reviewRequestEnabled ||
    reviewLink !== savedState.reviewLink ||
    sequenceEnabled !== savedState.sequenceEnabled;

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  function confirmNavAway(): boolean {
    if (!isDirty) return true;
    return window.confirm("You have unsaved changes. Leave anyway?");
  }

  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [aiSaving, setAiSaving] = useState(false);
  const [aiSaved, setAiSaved] = useState(false);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleSaved, setScheduleSaved] = useState(false);
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifSaved, setNotifSaved] = useState(false);
  const [featuresSaving, setFeaturesSaving] = useState(false);
  const [featuresSaved, setFeaturesSaved] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // CSV import
  type CsvRow = { name: string; phone: string; email: string };
  const [csvRows, setCsvRows] = useState<CsvRow[]>([]);
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvDone, setCsvDone] = useState<number | null>(null);
  const [csvErr, setCsvErr] = useState<string | null>(null);
  const [deleteText, setDeleteText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isEnterprise = subscription?.plan === "enterprise";
  const limits = isEnterprise ? null : PLAN_LIMITS[subscription?.plan ?? "starter"];
  const msgUsed = subscription?.message_count_this_period ?? 0;
  const msgPct = limits ? Math.min((msgUsed / limits.messages) * 100, 100) : 0;

  function barColor(pct: number) {
    if (pct >= 90) return "bg-red-500";
    if (pct >= 70) return "bg-yellow-400";
    return "bg-green-500";
  }

  async function saveProfile() {
    setProfileSaving(true);
    setProfileSaved(false);
    const goal = monthlyRevenueGoal ? Number.parseFloat(monthlyRevenueGoal) : undefined;
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        industry,
        voice,
        goals,
        config: { monthlyRevenueGoal: goal },
      }),
    });
    setProfileSaving(false);
    setProfileSaved(true);
    setSavedState((prev) => ({ ...prev, name, industry, voice, goals, monthlyRevenueGoal }));
    setTimeout(() => setProfileSaved(false), 2000);
  }

  async function saveAi() {
    setAiSaving(true);
    setAiSaved(false);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customInstructions }),
    });
    setAiSaving(false);
    setAiSaved(true);
    setSavedState((prev) => ({ ...prev, customInstructions }));
    setTimeout(() => setAiSaved(false), 2000);
  }

  async function saveSchedule() {
    setScheduleSaving(true);
    setScheduleSaved(false);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        config: { cadence, autopilotSendDay: sendDay, autopilotSendTime: sendTime, autopilotTimezone: timezone },
      }),
    });
    setScheduleSaving(false);
    setScheduleSaved(true);
    setSavedState((prev) => ({ ...prev, cadence, sendDay, sendTime, timezone }));
    setTimeout(() => setScheduleSaved(false), 2000);
  }

  async function saveNotifications() {
    setNotifSaving(true);
    setNotifSaved(false);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        config: { emailNotifyReply: emailReply, emailNotifyFailed: emailFailed, emailNotifyDailySummary: emailSummary },
      }),
    });
    setNotifSaving(false);
    setNotifSaved(true);
    setSavedState((prev) => ({ ...prev, emailReply, emailFailed, emailSummary }));
    setTimeout(() => setNotifSaved(false), 2000);
  }

  async function saveFeatures() {
    setFeaturesSaving(true);
    setFeaturesSaved(false);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        config: {
          autoReplyEnabled,
          reviewRequestEnabled,
          reviewLink: reviewLink.trim() || undefined,
          sequenceEnabled,
        },
      }),
    });
    setFeaturesSaving(false);
    setFeaturesSaved(true);
    setSavedState((prev) => ({ ...prev, autoReplyEnabled, reviewRequestEnabled, reviewLink, sequenceEnabled }));
    setTimeout(() => setFeaturesSaved(false), 2000);
  }

  async function openBillingPortal() {
    setPortalLoading(true);
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await res.json() as { url?: string; error?: string };
    setPortalLoading(false);
    if (data.url) {
      window.location.href = data.url;
    }
  }

  async function deleteAccount() {
    if (deleteText !== "DELETE") return;
    setDeleteLoading(true);
    setErrorMsg(null);
    const res = await fetch("/api/settings", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: "DELETE" }),
    });
    setDeleteLoading(false);
    if (res.ok) {
      router.push("/");
    } else {
      const d = await res.json() as { error?: string };
      setErrorMsg(d.error ?? "Failed to delete account");
    }
  }

  function handleCsvFile(file: File) {
    setCsvErr(null);
    setCsvDone(null);
    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) ?? "";
      const firstLine = text.split("\n")[0] ?? "";
      const rawHeaders = firstLine.split(",").map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase());

      const isSquareFormat =
        rawHeaders.includes("given name") ||
        rawHeaders.includes("first name") ||
        rawHeaders.includes("email address") ||
        rawHeaders.includes("phone number");

      if (isSquareFormat) {
        // Square / POS format — build compatible CSV with our column names
        const lines = text.split("\n").filter((l) => l.trim());
        const givenIdx = rawHeaders.indexOf("given name") !== -1 ? rawHeaders.indexOf("given name") : rawHeaders.indexOf("first name");
        const familyIdx = rawHeaders.indexOf("family name") !== -1 ? rawHeaders.indexOf("family name") : rawHeaders.indexOf("last name");
        const emailIdx = rawHeaders.indexOf("email address") !== -1 ? rawHeaders.indexOf("email address") : rawHeaders.indexOf("email");
        const phoneIdx = rawHeaders.indexOf("phone number") !== -1 ? rawHeaders.indexOf("phone number") : rawHeaders.indexOf("phone");

        const rows: CsvRow[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cells = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
          const given = givenIdx >= 0 ? (cells[givenIdx] ?? "") : "";
          const family = familyIdx >= 0 ? (cells[familyIdx] ?? "") : "";
          const name = [given, family].filter(Boolean).join(" ").trim();
          if (!name) continue;
          rows.push({
            name,
            phone: phoneIdx >= 0 ? (cells[phoneIdx] ?? "") : "",
            email: emailIdx >= 0 ? (cells[emailIdx] ?? "") : "",
          });
        }
        setCsvRows(rows);
      } else {
        const parsed = parseCustomersCsv(text);
        setCsvRows(parsed.map((c) => ({ name: c.name, phone: c.phone, email: c.email })));
      }
    };
    reader.readAsText(file);
  }

  async function importCsv() {
    if (csvRows.length === 0) return;
    setCsvImporting(true);
    setCsvErr(null);
    let count = 0;
    for (const row of csvRows) {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: row.name, phone: row.phone || undefined, email: row.email || undefined, consent_given: true }),
      });
      if (res.ok) count++;
    }
    setCsvImporting(false);
    setCsvDone(count);
    setCsvRows([]);
    setCsvFileName(null);
  }

  const selectClass = inputClass;

  return (
    <div className="min-h-screen bg-base">
      {/* Topbar */}
      <div className="flex h-14 items-center border-b border-line bg-surface px-6">
        <button
          type="button"
          onClick={() => { if (confirmNavAway()) router.push("/dashboard"); }}
          className="flex items-center gap-2 text-sm text-content-muted hover:text-content"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Dashboard{isDirty && <span className="ml-1 h-1.5 w-1.5 rounded-full bg-yellow-400" title="Unsaved changes" />}
        </button>
        <span className="mx-3 text-line">|</span>
        <span className="text-sm font-medium text-content">Settings</span>
        <span className="ml-auto text-xs text-content-muted">{userEmail}</span>
      </div>

      <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">

        {/* Business profile */}
        <div className={sectionClass}>
          <h2 className={sectionHeaderClass}>Business profile</h2>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Business name</label>
              <input className={inputClass} value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Industry</label>
                <div className={`${inputClass} cursor-default select-none opacity-60`}>Restaurant</div>
              </div>
              <div>
                <label className={labelClass}>Voice</label>
                <select className={selectClass} value={voice} onChange={e => setVoice(e.target.value)}>
                  {VOICES.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass}>Goals (comma separated)</label>
              <input className={inputClass} value={goals} onChange={e => setGoals(e.target.value)} placeholder="e.g. Drive repeat visits, Fill slow nights, Increase average check" />
            </div>
            <div>
              <label className={labelClass}>Monthly revenue recovery goal ($)</label>
              <input
                className={inputClass}
                type="number"
                min={0}
                step={100}
                value={monthlyRevenueGoal}
                onChange={e => setMonthlyRevenueGoal(e.target.value)}
                placeholder="e.g. 2000"
              />
              <p className="mt-1 text-xs text-content-muted">
                Scaleva will track your progress toward this goal on the dashboard.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={saveProfile}
            disabled={profileSaving}
            className="mt-4 h-9 rounded-btn bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
          >
            {profileSaving ? "Saving…" : profileSaved ? "Saved!" : "Save profile"}
          </button>
        </div>

        {/* Autopilot scheduling */}
        <div className={sectionClass}>
          <h2 className={sectionHeaderClass}>Autopilot scheduling</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Cadence</label>
              <select className={selectClass} value={cadence} onChange={e => setCadence(e.target.value)}>
                {CADENCES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Send day</label>
              <select className={selectClass} value={sendDay} onChange={e => setSendDay(e.target.value)}>
                {SEND_DAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Send time</label>
              <select className={selectClass} value={sendTime} onChange={e => setSendTime(e.target.value)}>
                {SEND_TIMES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Timezone</label>
              <select className={selectClass} value={timezone} onChange={e => setTimezone(e.target.value)}>
                {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            </div>
          </div>
          <button
            type="button"
            onClick={saveSchedule}
            disabled={scheduleSaving}
            className="mt-4 h-9 rounded-btn bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
          >
            {scheduleSaving ? "Saving…" : scheduleSaved ? "Saved!" : "Save schedule"}
          </button>
        </div>

        {/* AI instructions */}
        <div id="ai-instructions" className={sectionClass}>
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 className={sectionHeaderClass}>AI instructions</h2>
              <p className="text-xs text-content-muted">
                Tell the AI your brand rules, active offers, and tone. Every message will incorporate this context — the more detail you give, the more personalized the outreach.
              </p>
            </div>
            {customInstructions.trim() && (
              <span className="flex-shrink-0 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-400">
                Customized
              </span>
            )}
          </div>
          <textarea
            rows={5}
            className={`${inputClass} resize-none`}
            value={customInstructions}
            onChange={e => setCustomInstructions(e.target.value)}
            placeholder={"Examples:\n• Always mention our Tuesday happy hour\n• We never use the word 'cheap' — say 'great value' instead\n• We're running a summer loyalty promotion through August\n• Always sign off with our tagline: 'See you soon!'"}
          />
          {!customInstructions.trim() && (
            <p className="mt-2 text-xs text-yellow-500/70">
              Businesses that customize AI instructions see higher reply rates — add yours to unlock better messages.
            </p>
          )}
          <button
            type="button"
            onClick={saveAi}
            disabled={aiSaving}
            className="mt-3 h-9 rounded-btn bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
          >
            {aiSaving ? "Saving…" : aiSaved ? "Saved!" : "Save instructions"}
          </button>
        </div>

        {/* AI Features */}
        <div id="ai-features" className={sectionClass}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className={sectionHeaderClass} style={{ marginBottom: 0 }}>AI features</h2>
            {(!autoReplyEnabled || !sequenceEnabled || !reviewRequestEnabled) && (
              <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-[10px] font-semibold text-accent">
                {[!autoReplyEnabled, !sequenceEnabled, !reviewRequestEnabled].filter(Boolean).length} not enabled
              </span>
            )}
          </div>
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-content">Autonomous AI replies</p>
                <p className="mt-0.5 text-xs text-content-muted">
                  When a customer replies, Claude reads the conversation and sends a response automatically — no action needed from you. You can still jump in anytime.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={autoReplyEnabled}
                onClick={() => setAutoReplyEnabled(!autoReplyEnabled)}
                className="relative mt-0.5 inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none"
                style={{ backgroundColor: autoReplyEnabled ? "#3B82F6" : "#2A2D35" }}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                    autoReplyEnabled ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            <div id="win-back" className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-content">Win-back sequences</p>
                <p className="mt-0.5 text-xs text-content-muted">
                  After you message a customer, Scaleva automatically follows up at 7, 21, and 45 days if they haven't returned. Each message is AI-generated with a different angle.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={sequenceEnabled}
                onClick={() => setSequenceEnabled(!sequenceEnabled)}
                className="relative mt-0.5 inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none"
                style={{ backgroundColor: sequenceEnabled ? "#3B82F6" : "#2A2D35" }}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                    sequenceEnabled ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            <div id="reviews">
              <div className="mb-3 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-content">Google review requests</p>
                  <p className="mt-0.5 text-xs text-content-muted">
                    Automatically ask customers for a Google review when they return — at most once every 60 days per customer.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={reviewRequestEnabled}
                  onClick={() => setReviewRequestEnabled(!reviewRequestEnabled)}
                  className="relative mt-0.5 inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none"
                  style={{ backgroundColor: reviewRequestEnabled ? "#3B82F6" : "#2A2D35" }}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                      reviewRequestEnabled ? "translate-x-4" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
              {reviewRequestEnabled && (
                <div>
                  <label className={labelClass}>Your Google review link</label>
                  <input
                    className={inputClass}
                    value={reviewLink}
                    onChange={(e) => setReviewLink(e.target.value)}
                    placeholder="https://g.page/r/your-business/review"
                    type="url"
                  />
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={saveFeatures}
            disabled={featuresSaving}
            className="mt-4 h-9 rounded-btn bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
          >
            {featuresSaving ? "Saving…" : featuresSaved ? "Saved!" : "Save AI features"}
          </button>
        </div>

        {/* Notifications */}
        <div className={sectionClass}>
          <h2 className={sectionHeaderClass}>Notifications</h2>
          <div className="space-y-3">
            {(
              [
                { label: "Email me when a customer replies", val: emailReply, set: setEmailReply },
                { label: "Email me when a message fails to send", val: emailFailed, set: setEmailFailed },
                { label: "Daily activity summary email", val: emailSummary, set: setEmailSummary },
              ] as { label: string; val: boolean; set: (v: boolean) => void }[]
            ).map(({ label, val, set }) => (
              <label key={label} className="flex items-center gap-3 cursor-pointer">
                <button
                  type="button"
                  role="switch"
                  aria-checked={val}
                  onClick={() => set(!val)}
                  className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none"
                  style={{ backgroundColor: val ? "#3B82F6" : "#2A2D35" }}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                      val ? "translate-x-4" : "translate-x-0.5"
                    }`}
                  />
                </button>
                <span className="text-sm text-content">{label}</span>
              </label>
            ))}
          </div>
          <button
            type="button"
            onClick={saveNotifications}
            disabled={notifSaving}
            className="mt-4 h-9 rounded-btn bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
          >
            {notifSaving ? "Saving…" : notifSaved ? "Saved!" : "Save notifications"}
          </button>
        </div>

        {/* Integrations */}
        <div id="integrations" className={sectionClass}>
          <h2 className={sectionHeaderClass}>Integrations</h2>
          {Object.keys(integrations).length === 0 ? (
            <p className="text-sm text-content-muted">No integrations connected yet.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(integrations).map(([provider, info]) => (
                <div key={provider} className="flex items-start justify-between rounded-btn border border-line px-4 py-3">
                  <div>
                    <span className="text-sm font-medium capitalize text-content">{provider}</span>
                    <p className="text-xs text-content-muted">
                      {info.customersSynced !== undefined
                        ? `${info.customersSynced} guests synced`
                        : info.lastSync
                        ? `Last synced ${new Date(info.lastSync).toLocaleString()}`
                        : "Connected"}
                    </p>
                    {info.menuItemsSynced !== undefined && info.menuItemsSynced > 0 && (
                      <p className="mt-0.5 text-xs text-content-muted">
                        Menu synced: {info.menuItemsSynced} items
                        {info.menuCategories && info.menuCategories > 0
                          ? ` across ${info.menuCategories} categories`
                          : ""}
                      </p>
                    )}
                    {info.lastSync && (
                      <p className="mt-0.5 text-[10px] text-content-muted/60">
                        Last sync {new Date(info.lastSync).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-400">
                    Connected
                  </span>
                </div>
              ))}
            </div>
          )}
          {/* CSV walkthrough card */}
          <div className="mt-4 rounded-btn border border-line bg-base p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-accent/10">
                  <svg className="h-4 w-4 text-accent" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-content">Import via CSV</p>
                  <p className="text-xs text-content-muted">3-minute setup · works with Square, Toast, any POS</p>
                </div>
              </div>
              <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">Quick</span>
            </div>

            <div className="mt-4 space-y-3">
              {/* Step 1 */}
              <div className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-accent/15 text-[10px] font-bold text-accent">1</span>
                <div>
                  <p className="text-xs font-semibold text-content">Export your customers from Square</p>
                  <p className="mt-0.5 text-xs text-content-muted leading-relaxed">
                    Go to <span className="font-medium text-content">squareup.com</span> → sign in → click <span className="font-medium text-content">Customers</span> in the left menu → click the <span className="font-medium text-content">Export</span> button (top right) → save the CSV file to your computer.
                  </p>
                  <p className="mt-1 text-[10px] text-content-muted/70">Using Toast, Olo, or another POS? Export any CSV with Name, Phone, and Email columns.</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-accent/15 text-[10px] font-bold text-accent">2</span>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-content">Upload it here</p>
                  <p className="mt-0.5 mb-2 text-xs text-content-muted">We automatically map Square&apos;s column names — no formatting needed.</p>

                  {csvDone !== null ? (
                    <div className="flex items-center gap-2 rounded-btn border border-green-500/20 bg-green-500/10 px-3 py-2">
                      <svg className="h-4 w-4 text-green-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      <p className="text-xs font-semibold text-green-400">{csvDone} customers imported successfully</p>
                      <button type="button" onClick={() => setCsvDone(null)} className="ml-auto text-[10px] text-green-400/70 hover:text-green-400">Import another</button>
                    </div>
                  ) : csvRows.length > 0 ? (
                    <div className="rounded-btn border border-accent/20 bg-accent/5 px-3 py-2.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-content">{csvFileName}</p>
                          <p className="text-xs text-content-muted">{csvRows.length} customers ready to import</p>
                        </div>
                        <button type="button" onClick={() => { setCsvRows([]); setCsvFileName(null); }} className="text-[10px] text-content-muted/60 hover:text-content-muted">✕</button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex cursor-pointer flex-col items-center gap-1.5 rounded-btn border border-dashed border-line px-4 py-4 text-center transition-colors hover:border-accent/50 hover:bg-accent/5">
                      <svg className="h-5 w-5 text-content-muted/50" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                      <span className="text-xs font-medium text-content-muted">Drop CSV here or click to browse</span>
                      <span className="text-[10px] text-content-muted/60">.csv files only</span>
                      <input
                        type="file"
                        accept=".csv"
                        className="sr-only"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCsvFile(f); }}
                      />
                    </label>
                  )}
                  {csvErr && <p className="mt-1.5 text-xs text-danger">{csvErr}</p>}
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-accent/15 text-[10px] font-bold text-accent">3</span>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-content">Import and you&apos;re done</p>
                  <p className="mt-0.5 mb-2 text-xs text-content-muted">Customers appear on your dashboard instantly. Scaleva starts building outreach plans right away.</p>
                  {csvRows.length > 0 && (
                    <button
                      type="button"
                      onClick={() => void importCsv()}
                      disabled={csvImporting}
                      className="inline-flex h-8 items-center gap-2 rounded-btn bg-accent px-4 text-xs font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
                    >
                      {csvImporting ? (
                        <><span className="h-3 w-3 animate-spin rounded-full border border-white/30 border-t-white" />Importing…</>
                      ) : (
                        `Import ${csvRows.length} customer${csvRows.length !== 1 ? "s" : ""}`
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Direct integrations */}
          <div className="mt-3 flex flex-wrap gap-2">
            {!integrations["square"]?.connected && (
              <a
                href="/api/oauth/square"
                className="inline-flex h-8 items-center gap-1.5 rounded-btn border border-line px-3 text-xs font-medium text-content-muted hover:text-content hover:border-content-muted transition-colors"
              >
                <span>◼️</span>
                Connect Square
              </a>
            )}
          </div>
        </div>

        {/* Billing */}
        <div className={sectionClass}>
          <h2 className={sectionHeaderClass}>Billing</h2>
          {subscription ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium capitalize text-content">
                    {subscription.plan} plan
                  </span>
                  <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${
                    subscription.status === "active"
                      ? "bg-green-500/10 text-green-400"
                      : "bg-yellow-500/10 text-yellow-400"
                  }`}>
                    {subscription.status}
                  </span>
                </div>
                {subscription.current_period_end && (
                  <span className="text-xs text-content-muted">
                    Renews {new Date(subscription.current_period_end).toLocaleDateString()}
                  </span>
                )}
              </div>
              <p className="rounded-btn border border-line bg-base px-4 py-2.5 text-xs text-content-muted">
                Scaleva is working to recover revenue that exceeds your subscription cost — check your dashboard to see your ROI.
              </p>

              {/* Usage bar */}
              {limits !== null ? (
                <div>
                  <div className="mb-1 flex justify-between text-xs text-content-muted">
                    <span>Messages this month</span>
                    <span>{msgUsed.toLocaleString()} / {limits.messages.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-line">
                    <div
                      className={`h-1.5 rounded-full transition-all ${barColor(msgPct)}`}
                      style={{ width: `${msgPct}%` }}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-xs text-content-muted">
                  Messages sent this month: {msgUsed.toLocaleString()} (unlimited)
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={openBillingPortal}
                  disabled={portalLoading}
                  className="h-9 rounded-btn border border-line px-4 text-sm font-medium text-content-muted hover:border-content-muted hover:text-content transition-colors disabled:opacity-60"
                >
                  {portalLoading ? "Loading…" : "Manage subscription"}
                </button>
                {subscription.plan !== "enterprise" && (
                  <a
                    href="/pricing"
                    className="inline-flex h-9 items-center rounded-btn border border-accent/40 px-4 text-sm font-medium text-accent hover:bg-accent/5 transition-colors"
                  >
                    Upgrade / change plan
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div>
              <p className="mb-3 text-sm text-content-muted">No active subscription.</p>
              <a
                href="/pricing"
                className="inline-flex h-9 items-center rounded-btn bg-accent px-4 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
              >
                View plans
              </a>
            </div>
          )}
        </div>

        {/* Danger zone */}
        <div className="rounded-card border border-danger/30 bg-surface p-6">
          <h2 className="mb-2 font-heading text-sm font-semibold text-danger">Danger zone</h2>
          <p className="mb-4 text-xs text-content-muted">
            Permanently delete your account and all data. This cannot be undone.
          </p>
          {!deleteConfirm ? (
            <button
              type="button"
              onClick={() => setDeleteConfirm(true)}
              className="h-9 rounded-btn border border-danger/40 px-4 text-sm font-medium text-danger hover:bg-danger/5 transition-colors"
            >
              Delete account
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-content-muted">
                Type <strong className="text-content">DELETE</strong> to confirm.
              </p>
              <input
                className={inputClass}
                value={deleteText}
                onChange={e => setDeleteText(e.target.value)}
                placeholder="DELETE"
              />
              {errorMsg && <p className="text-xs text-danger">{errorMsg}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setDeleteConfirm(false); setDeleteText(""); }}
                  className="h-9 rounded-btn border border-line px-4 text-sm font-medium text-content-muted hover:text-content transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={deleteAccount}
                  disabled={deleteText !== "DELETE" || deleteLoading}
                  className="h-9 rounded-btn bg-danger px-4 text-sm font-medium text-white hover:bg-danger/80 transition-colors disabled:opacity-60"
                >
                  {deleteLoading ? "Deleting…" : "Confirm delete"}
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
