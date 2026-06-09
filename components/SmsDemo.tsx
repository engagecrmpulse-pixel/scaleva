"use client";

import { useState, useEffect, useCallback } from "react";

const SCENARIOS = [
  {
    tab: "Restaurant",
    icon: "🍽️",
    business: "Bella Cucina",
    customer: {
      name: "Maria S.",
      initial: "M",
      lastVisit: "47 days ago",
      totalSpend: "$284",
      visits: 6,
    },
    triggerReasons: [
      "47 days since last visit — lapse threshold hit",
      "6-visit regular, avg $47/visit — high-value",
      "Historically dines on Fridays with husband",
    ],
    message:
      "Hey Maria! It's been a bit — miss having you at Bella Cucina 🍝 We just added a truffle tagliatelle that has your name on it. Come in this week and we'll take care of you.",
    outTime: "6:12 PM",
    reply:
      "Oh my gosh we were JUST talking about coming back! Booking for Friday 😍",
    replyTime: "6:18 PM",
    result: "Reservation made · $96 visit 3 days later",
    resultSub: "6-minute response time",
    resultColor: "border-orange-400/30 bg-orange-400/5",
    dotColor: "bg-orange-400",
  },
  {
    tab: "Salon",
    icon: "✂️",
    business: "Gloss Studio",
    customer: {
      name: "Jennifer K.",
      initial: "J",
      lastVisit: "8 weeks ago",
      totalSpend: "$610",
      visits: 9,
    },
    triggerReasons: [
      "8 weeks since balayage — typical refresh cycle",
      "Top 10% spender · 9 visits · $68 avg",
      "Summer color window — pre-heat damage timing",
    ],
    message:
      "Hi Jennifer! Your balayage is probably due for a refresh about now 💇‍♀️ We just got in Olaplex Bond Builder — perfect timing for summer. Want me to grab you a spot this week?",
    outTime: "10:04 AM",
    reply:
      "Yes please! Do you have anything Thursday afternoon? My ends are SO dry lol",
    replyTime: "10:09 AM",
    result: "Appointment booked · $135 service",
    resultSub: "5-minute response time",
    resultColor: "border-pink-400/30 bg-pink-400/5",
    dotColor: "bg-pink-400",
  },
  {
    tab: "HVAC",
    icon: "🔧",
    business: "ProComfort HVAC",
    customer: {
      name: "Robert D.",
      initial: "R",
      lastVisit: "11 months ago",
      totalSpend: "$820",
      visits: 3,
    },
    triggerReasons: [
      "Annual maintenance window — 11 months elapsed",
      "Pre-summer inspection timing · AC unit is 6 yrs old",
      "3-visit loyal customer — knows the tech by name",
    ],
    message:
      "Hey Robert, this is ProComfort — your AC tune-up from last year is coming up on its annual. Best time to catch anything before the summer heat hits. Want us to schedule your 21-point inspection? Same tech as last time.",
    outTime: "9:30 AM",
    reply:
      "Good timing actually — yes please. Can you do next Tuesday morning?",
    replyTime: "9:47 AM",
    result: "Inspection booked · $189 · prevented $1,400 repair",
    resultSub: "17-minute response time",
    resultColor: "border-blue-400/30 bg-blue-400/5",
    dotColor: "bg-blue-400",
  },
  {
    tab: "Boutique",
    icon: "🛍️",
    business: "Blue Pine Co.",
    customer: {
      name: "Ashley M.",
      initial: "A",
      lastVisit: "6 weeks ago",
      totalSpend: "$340",
      visits: 4,
    },
    triggerReasons: [
      "6-week lapse + spring drop just restocked",
      "3 of 4 purchases were athleisure — sage / neutral palette",
      "Referred a friend on her last visit",
    ],
    message:
      "Ashley! Our spring drop just landed and I immediately thought of you — new modal joggers in sage with a matching boxy tee. Your exact vibe 🌿 Free shipping through Sunday if you want to grab them.",
    outTime: "2:15 PM",
    reply:
      "Already in my cart 😂 sending to my friend too she'll love these",
    replyTime: "2:19 PM",
    result: "$128 order placed · 1 new customer referred",
    resultSub: "4-minute response time",
    resultColor: "border-emerald-400/30 bg-emerald-400/5",
    dotColor: "bg-emerald-400",
  },
];

type Scenario = (typeof SCENARIOS)[0];

export default function SmsDemo() {
  const [active, setActive] = useState(0);
  const [visible, setVisible] = useState(true);

  const goTo = useCallback(
    (idx: number) => {
      if (idx === active) return;
      setVisible(false);
      setTimeout(() => {
        setActive(idx);
        setVisible(true);
      }, 180);
    },
    [active]
  );

  useEffect(() => {
    const t = setInterval(() => {
      goTo((active + 1) % SCENARIOS.length);
    }, 5500);
    return () => clearInterval(t);
  }, [active, goTo]);

  const s = SCENARIOS[active];

  return (
    <section className="border-t border-line">
      <div className="mx-auto max-w-[1200px] px-6 py-24">
        {/* Header */}
        <div className="mb-12 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/5 px-3 py-1 text-xs font-medium text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Live demo
          </span>
          <h2 className="mt-4 font-heading text-2xl font-semibold tracking-[-0.03em] text-content sm:text-3xl">
            Every message feels like it was written just for them
          </h2>
          <p className="mt-3 text-base text-content-muted">
            Because it was. Scaleva reads your customer history and writes
            something they&apos;ll actually respond to.
          </p>
        </div>

        {/* Scenario tabs */}
        <div className="mb-10 flex flex-wrap justify-center gap-2">
          {SCENARIOS.map((sc, i) => (
            <button
              key={sc.tab}
              onClick={() => goTo(i)}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                i === active
                  ? "bg-accent text-white shadow-sm"
                  : "border border-line bg-surface text-content-muted hover:text-content"
              }`}
            >
              <span>{sc.icon}</span>
              {sc.tab}
            </button>
          ))}
        </div>

        {/* Demo grid */}
        <div
          style={{
            opacity: visible ? 1 : 0,
            transition: "opacity 0.18s ease",
          }}
          className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start"
        >
          {/* Left panel */}
          <div className="flex flex-col gap-4">
            {/* Customer profile */}
            <div className="rounded-card border border-line bg-surface p-6">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-content-muted">
                Customer profile
              </p>
              <div className="mb-5 flex items-center gap-4">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-accent/10 font-heading text-base font-bold text-accent">
                  {s.customer.initial}
                </div>
                <div>
                  <p className="font-semibold text-content">
                    {s.customer.name}
                  </p>
                  <p className="text-sm text-content-muted">{s.business}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 border-t border-line pt-4">
                <div>
                  <p className="mb-1 text-[11px] text-content-muted">
                    Last visit
                  </p>
                  <p className="text-sm font-semibold text-content">
                    {s.customer.lastVisit}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-[11px] text-content-muted">
                    Total spend
                  </p>
                  <p className="text-sm font-semibold text-content">
                    {s.customer.totalSpend}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-[11px] text-content-muted">
                    Visits
                  </p>
                  <p className="text-sm font-semibold text-content">
                    {s.customer.visits}×
                  </p>
                </div>
              </div>
            </div>

            {/* Why Scaleva chose this message */}
            <div className="rounded-card border border-line bg-surface p-6">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-content-muted">
                Why Scaleva sent this
              </p>
              <div className="space-y-3">
                {s.triggerReasons.map((reason, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-accent/10 text-[10px] font-bold text-accent">
                      {i + 1}
                    </span>
                    <p className="text-sm leading-snug text-content-muted">
                      {reason}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Result */}
            <div
              className={`rounded-card border p-5 ${s.resultColor}`}
            >
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs text-emerald-500">
                  ✓
                </span>
                <div>
                  <p className="text-sm font-semibold text-content">
                    {s.result}
                  </p>
                  <p className="mt-0.5 text-xs text-content-muted">
                    {s.resultSub}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right panel: phone */}
          <div className="flex justify-center lg:justify-end">
            <PhoneMockup s={s} />
          </div>
        </div>

        {/* Progress dots */}
        <div className="mt-10 flex justify-center gap-2">
          {SCENARIOS.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === active ? "w-6 bg-accent" : "w-1.5 bg-line hover:bg-content-muted"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function PhoneMockup({ s }: { s: Scenario }) {
  return (
    <div className="relative w-full" style={{ maxWidth: 320 }}>
      {/* Outer shell */}
      <div className="overflow-hidden rounded-[44px] border-[7px] border-content/[0.12] bg-base shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
        {/* Status bar */}
        <div className="flex items-center justify-between bg-base px-6 pb-1 pt-3">
          <span className="text-[12px] font-semibold text-content">9:41</span>
          {/* Dynamic island */}
          <div className="absolute left-1/2 top-[14px] h-[18px] w-[100px] -translate-x-1/2 rounded-full bg-[#000]" />
          <div className="flex items-center gap-[5px]">
            {/* Signal bars */}
            <svg
              className="h-3 w-3 fill-content"
              viewBox="0 0 16 12"
            >
              <rect x="0" y="7" width="2.5" height="5" rx="0.5" />
              <rect x="4" y="5" width="2.5" height="7" rx="0.5" />
              <rect x="8" y="2.5" width="2.5" height="9.5" rx="0.5" />
              <rect x="12" y="0" width="2.5" height="12" rx="0.5" opacity="0.4" />
            </svg>
            {/* Battery */}
            <div className="relative flex h-3 w-5 items-center">
              <div className="flex h-full w-[17px] items-center rounded-[2px] border border-content/50 p-[1.5px]">
                <div className="h-full w-[10px] rounded-[1px] bg-content" />
              </div>
              <div className="absolute -right-[2px] top-1/2 h-1.5 w-[2px] -translate-y-1/2 rounded-r-[1px] bg-content/50" />
            </div>
          </div>
        </div>

        {/* Contact header */}
        <div className="flex items-center gap-2.5 border-b border-line bg-base px-4 pb-3 pt-2">
          <button className="flex-shrink-0 text-accent">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
            {s.customer.initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-content">
              {s.business}
            </p>
            <p className="text-[10px] text-content-muted">via Scaleva</p>
          </div>
          <button className="flex-shrink-0 text-accent">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </button>
        </div>

        {/* Chat area */}
        <div className="min-h-[310px] space-y-4 bg-base px-3 py-5">
          {/* Date separator */}
          <div className="flex justify-center">
            <span className="rounded-full px-2 py-0.5 text-[10px] text-content-muted">
              Today {s.outTime}
            </span>
          </div>

          {/* Outbound bubble (right, blue iOS) */}
          <div className="flex justify-end">
            <div className="max-w-[82%]">
              <div
                className="rounded-[18px] rounded-br-[4px] px-4 py-2.5"
                style={{ background: "#0A7AFF" }}
              >
                <p className="text-[13px] leading-[1.45] text-white">
                  {s.message}
                </p>
              </div>
              <p className="mt-1 text-right text-[10px] text-content-muted">
                Delivered
              </p>
            </div>
          </div>

          {/* Inbound reply (left, gray) */}
          <div className="flex items-end gap-2">
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-accent/10 text-[10px] font-bold text-accent">
              {s.customer.initial}
            </div>
            <div className="max-w-[78%]">
              <div className="rounded-[18px] rounded-bl-[4px] border border-line bg-surface px-4 py-2.5">
                <p className="text-[13px] leading-[1.45] text-content">
                  {s.reply}
                </p>
              </div>
              <p className="mt-1 text-[10px] text-content-muted">
                {s.replyTime}
              </p>
            </div>
          </div>
        </div>

        {/* Input bar */}
        <div className="flex items-center gap-2 border-t border-line bg-base px-3 py-2.5">
          <button className="flex-shrink-0 text-accent">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <div className="flex-1 rounded-full border border-line bg-surface px-4 py-1.5">
            <span className="text-[12px] text-content-muted">iMessage</span>
          </div>
          <button className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-accent">
            <svg className="h-3.5 w-3.5 fill-white" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>

        {/* Home indicator */}
        <div className="flex justify-center bg-base pb-2 pt-1">
          <div className="h-1 w-16 rounded-full bg-content/20" />
        </div>
      </div>
    </div>
  );
}
