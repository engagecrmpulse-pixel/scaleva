"use client";

import { useState, useEffect, useCallback } from "react";

const SCENARIOS = [
  {
    label: "Fine Dining",
    business: "Rosario's",
    initial: "M",
    customer: "Maria S. · 47 days · $1,240 lifetime",
    message:
      "Hey Maria! It's been a bit — miss having you at Rosario's. We just added a truffle tagliatelle that has your name on it. Come in this week and your first glass of the new Barolo is on us.",
    outTime: "6:12 PM",
    reply: "Oh my gosh we were JUST talking about coming back! Booking for Friday 😍",
    replyTime: "6:18 PM",
  },
  {
    label: "Neighborhood Bistro",
    business: "The Local",
    initial: "D",
    customer: "David R. · 22 days · $490 lifetime",
    message:
      "David! Tuesday is our slow night and we're doing $8 craft drafts + the short rib special. Perfect excuse to come back — it's been 3 weeks since your last visit. See you Tuesday?",
    outTime: "4:30 PM",
    reply: "You got me. We'll be there at 7, can you hold a table for 4?",
    replyTime: "4:44 PM",
  },
  {
    label: "Cocktail Bar",
    business: "Vault & Rye",
    initial: "S",
    customer: "Sophie L. · 31 days · $620 lifetime",
    message:
      "Sophie — our new seasonal menu dropped tonight and the smoked negroni has your name all over it. Happy hour runs till 7 PM. You in?",
    outTime: "5:02 PM",
    reply: "Omg leaving work NOW. See you in 20",
    replyTime: "5:08 PM",
  },
  {
    label: "Brunch Cafe",
    business: "Sunday Press",
    initial: "A",
    customer: "Alex M. · 18 days · $310 lifetime",
    message:
      "Alex! This Sunday we're doing a bottomless brunch special — $38/person, 10 AM–1 PM. You brought friends last time so thought you'd want to know first. Reserve a table?",
    outTime: "9:15 AM",
    reply: "Yes!! Can we get the patio? Party of 6",
    replyTime: "9:22 AM",
  },
];

export default function HeroPhone() {
  const [active, setActive] = useState(0);
  const [visible, setVisible] = useState(true);

  const goTo = useCallback(
    (idx: number) => {
      if (idx === active) return;
      setVisible(false);
      setTimeout(() => {
        setActive(idx);
        setVisible(true);
      }, 160);
    },
    [active]
  );

  useEffect(() => {
    const t = setInterval(
      () => goTo((active + 1) % SCENARIOS.length),
      4800
    );
    return () => clearInterval(t);
  }, [active, goTo]);

  const s = SCENARIOS[active];

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Phone */}
      <div
        style={{ opacity: visible ? 1 : 0, transition: "opacity 0.16s ease" }}
        className="w-full"
        aria-live="polite"
      >
        {/* Shell */}
        <div className="overflow-hidden rounded-[44px] border-[7px] border-content/[0.13] bg-base shadow-[0_32px_80px_rgba(0,0,0,0.22)]">
          {/* Status bar */}
          <div className="relative flex items-center justify-between bg-base px-6 pb-1 pt-3">
            <span className="text-[12px] font-semibold text-content">9:41</span>
            {/* Dynamic island */}
            <div className="absolute left-1/2 top-[14px] h-[18px] w-[96px] -translate-x-1/2 rounded-full bg-black" />
            {/* Battery + signal */}
            <div className="flex items-center gap-[6px]">
              <svg className="h-3 w-3.5 fill-content" viewBox="0 0 18 12">
                <rect x="0" y="8" width="3" height="4" rx="0.6" />
                <rect x="5" y="5.5" width="3" height="6.5" rx="0.6" />
                <rect x="10" y="2.5" width="3" height="9.5" rx="0.6" />
                <rect x="15" y="0" width="3" height="12" rx="0.6" opacity="0.35" />
              </svg>
              <div className="flex h-3 w-[22px] items-center">
                <div className="relative flex h-full w-[19px] items-center rounded-[2.5px] border border-content/50 p-[2px]">
                  <div className="h-full w-[11px] rounded-[1px] bg-content" />
                </div>
                <div className="ml-[1px] h-[6px] w-[2px] rounded-r-[1px] bg-content/50" />
              </div>
            </div>
          </div>

          {/* Contact header */}
          <div className="flex items-center gap-2.5 border-b border-line bg-base px-4 pb-3 pt-2">
            <button className="flex-shrink-0 text-[#0A7AFF]">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-accent/10 text-[12px] font-bold text-accent">
              {s.initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-content">
                {s.business}
              </p>
              <p className="text-[10px] text-content-muted">via Scaleva</p>
            </div>
            <button className="flex-shrink-0 text-[#0A7AFF]">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </button>
          </div>

          {/* Customer context pill */}
          <div className="flex justify-center bg-base pt-3 pb-1">
            <span className="rounded-full bg-surface border border-line px-3 py-1 text-[10px] text-content-muted">
              {s.customer}
            </span>
          </div>

          {/* Chat */}
          <div className="min-h-[300px] space-y-4 bg-base px-3 py-4">
            {/* Timestamp */}
            <div className="flex justify-center">
              <span className="text-[10px] text-content-muted">
                Today {s.outTime}
              </span>
            </div>

            {/* Outbound */}
            <div className="flex justify-end">
              <div className="max-w-[84%]">
                <div
                  className="rounded-[18px] rounded-br-[4px] px-4 py-2.5"
                  style={{ background: "#0A7AFF" }}
                >
                  <p className="text-[13px] leading-[1.45] text-white">
                    {s.message}
                  </p>
                </div>
                <p className="mt-1 pr-1 text-right text-[10px] text-content-muted">
                  Delivered
                </p>
              </div>
            </div>

            {/* Reply */}
            <div className="flex items-end gap-2">
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-accent/10 text-[10px] font-bold text-accent">
                {s.initial}
              </div>
              <div className="max-w-[78%]">
                <div className="rounded-[18px] rounded-bl-[4px] border border-line bg-surface px-4 py-2.5">
                  <p className="text-[13px] leading-[1.45] text-content">
                    {s.reply}
                  </p>
                </div>
                <p className="mt-1 pl-1 text-[10px] text-content-muted">
                  {s.replyTime}
                </p>
              </div>
            </div>
          </div>

          {/* Input bar */}
          <div className="flex items-center gap-2 border-t border-line bg-base px-3 py-2.5">
            <button className="flex-shrink-0 text-[#0A7AFF]">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <div className="flex-1 rounded-full border border-line bg-surface px-4 py-1.5">
              <span className="text-[12px] text-content-muted">iMessage</span>
            </div>
            <button className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#0A7AFF]">
              <svg className="h-3.5 w-3.5 fill-white" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>

          {/* Home bar */}
          <div className="flex justify-center bg-base pb-2 pt-1.5">
            <div className="h-1 w-16 rounded-full bg-content/20" />
          </div>
        </div>
      </div>

      {/* Scenario pills / dots */}
      <div className="flex items-center gap-2">
        {SCENARIOS.map((sc, i) => (
          <button
            key={sc.label}
            onClick={() => goTo(i)}
            className={`rounded-full px-3 py-1 text-[11px] font-medium transition-all ${
              i === active
                ? "bg-accent text-white"
                : "border border-line bg-surface text-content-muted hover:text-content"
            }`}
          >
            {sc.label}
          </button>
        ))}
      </div>
    </div>
  );
}
