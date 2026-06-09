"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Answer {
  label: string;
  value: string;
  emoji?: string;
}

interface Question {
  id: string;
  text: string;
  subtext?: string;
  answers: Answer[];
  columns?: 1 | 2;
}

const QUESTIONS: Question[] = [
  {
    id: "industry",
    text: "What type of business do you run?",
    subtext: "We'll tailor everything — your AI voice, timing, and messaging style — to your industry.",
    columns: 2,
    answers: [
      { label: "Restaurant / Cafe / Bar", value: "Restaurant", emoji: "🍽️" },
      { label: "Salon / Spa / Barbershop", value: "Salon", emoji: "✂️" },
      { label: "Retail Store", value: "Retail", emoji: "🛍️" },
      { label: "Fitness / Gym / Studio", value: "Fitness", emoji: "💪" },
      { label: "Home Services / Construction", value: "Construction", emoji: "🔨" },
      { label: "Healthcare / Wellness", value: "Healthcare", emoji: "❤️" },
      { label: "Other Local Business", value: "Other", emoji: "🏪" },
    ],
  },
  {
    id: "size",
    text: "How many active customers do you have?",
    subtext: "An estimate is fine — this helps us set realistic goals for you.",
    columns: 2,
    answers: [
      { label: "Just starting out", value: "under_100", emoji: "🌱" },
      { label: "Growing — 100 to 500", value: "100_500", emoji: "📈" },
      { label: "Established — 500 to 2,000", value: "500_2000", emoji: "🏆" },
      { label: "Thriving — 2,000+", value: "over_2000", emoji: "🚀" },
    ],
  },
  {
    id: "challenge",
    text: "What's your biggest challenge right now?",
    subtext: "Be honest — this shapes what your AI focuses on first.",
    columns: 1,
    answers: [
      { label: "Getting customers to come back after their first visit", value: "retention" },
      { label: "Converting one-time visitors into regulars", value: "conversion" },
      { label: "Standing out against bigger competitors", value: "competition" },
      { label: "Growing word-of-mouth and referrals", value: "referrals" },
    ],
  },
  {
    id: "frequency",
    text: "How often do customers typically return?",
    subtext: "This tells us how urgently to reach out — and when.",
    columns: 2,
    answers: [
      { label: "Weekly or more", value: "weekly", emoji: "🔁" },
      { label: "Once or twice a month", value: "monthly", emoji: "📅" },
      { label: "Every few months", value: "quarterly", emoji: "🗓️" },
      { label: "Rarely — mostly one-time", value: "rarely", emoji: "⏳" },
    ],
  },
  {
    id: "current_followup",
    text: "How do you currently stay in touch with customers?",
    subtext: "No judgment — most business owners don't have time for this.",
    columns: 1,
    answers: [
      { label: "I don't — there's no system in place", value: "none" },
      { label: "Occasionally by phone or text", value: "manual_sms" },
      { label: "Email newsletters", value: "email" },
      { label: "Social media posts", value: "social" },
    ],
  },
  {
    id: "ltv",
    text: "What's a typical customer worth over their lifetime?",
    subtext: "This is how we calculate the revenue impact Scaleva can unlock for you.",
    columns: 2,
    answers: [
      { label: "Under $200", value: "under_200", emoji: "💵" },
      { label: "$200 – $1,000", value: "200_1000", emoji: "💰" },
      { label: "$1,000 – $5,000", value: "1000_5000", emoji: "💎" },
      { label: "$5,000+", value: "over_5000", emoji: "🏦" },
    ],
  },
  {
    id: "discovery",
    text: "How do most new customers find you?",
    subtext: "Understanding this helps us know what to say when we re-engage them.",
    columns: 2,
    answers: [
      { label: "Word of mouth / referrals", value: "referral", emoji: "🗣️" },
      { label: "Google / local search", value: "google", emoji: "🔍" },
      { label: "Social media", value: "social", emoji: "📱" },
      { label: "Walk-in / foot traffic", value: "walkin", emoji: "🚶" },
    ],
  },
  {
    id: "voice",
    text: "How do you want your messages to sound?",
    subtext: "Your customers will feel like you wrote every single one.",
    columns: 1,
    answers: [
      { label: "Warm and personal — like a message from a friend", value: "Friendly" },
      { label: "Professional and polished", value: "Professional" },
      { label: "Fun and a little playful", value: "Casual" },
      { label: "Short and direct — no fluff", value: "Witty" },
    ],
  },
  {
    id: "goal",
    text: "What result matters most to you in the next 90 days?",
    subtext: "This becomes your AI's primary mission.",
    columns: 1,
    answers: [
      { label: "More repeat visits from existing customers", value: "retention" },
      { label: "Higher average spend per visit", value: "upsell" },
      { label: "More 5-star reviews", value: "reviews" },
      { label: "Filling slow periods and dead hours", value: "slow_periods" },
    ],
  },
  {
    id: "loyalty",
    text: "Do you currently offer any loyalty rewards or promotions?",
    subtext: "Scaleva can weave these into every message automatically.",
    columns: 1,
    answers: [
      { label: "Not yet — but I'd like to", value: "want_to" },
      { label: "Yes, but informally — I make it up as I go", value: "informal" },
      { label: "Yes, I have a real loyalty program", value: "formal" },
      { label: "No — I don't do promotions", value: "none" },
    ],
  },
  {
    id: "send_time",
    text: "When are your customers most likely to engage?",
    subtext: "We'll automatically send messages when they're most likely to open them.",
    columns: 2,
    answers: [
      { label: "Morning", value: "morning", emoji: "☀️" },
      { label: "Midday", value: "midday", emoji: "🌤️" },
      { label: "Afternoon", value: "afternoon", emoji: "⛅" },
      { label: "Evening", value: "evening", emoji: "🌙" },
    ],
  },
  {
    id: "urgency",
    text: "How soon are you looking to start?",
    subtext: "Just so we know how to prioritize your setup.",
    columns: 2,
    answers: [
      { label: "Right now — I'm ready", value: "now", emoji: "⚡" },
      { label: "This week", value: "this_week", emoji: "📆" },
      { label: "Within a month", value: "month", emoji: "🗓️" },
      { label: "Just exploring", value: "exploring", emoji: "👀" },
    ],
  },
];

const INDUSTRY_LABELS: Record<string, string> = {
  Restaurant: "Restaurant / Cafe",
  Salon: "Salon / Spa",
  Retail: "Retail",
  Fitness: "Fitness",
  Construction: "Home Services",
  Healthcare: "Healthcare",
  Other: "Local Business",
};


const GOAL_LABELS: Record<string, string> = {
  retention: "More repeat visits",
  upsell: "Higher average spend",
  reviews: "More 5-star reviews",
  slow_periods: "Filling slow periods",
};

const VOICE_LABELS: Record<string, string> = {
  Friendly: "Warm & personal",
  Professional: "Professional",
  Casual: "Playful & casual",
  Witty: "Short & direct",
};

const TIME_LABELS: Record<string, string> = {
  morning: "Morning (8–11 AM)",
  midday: "Midday (12–2 PM)",
  afternoon: "Afternoon (3–5 PM)",
  evening: "Evening (6–9 PM)",
};

function ResultsScreen({ answers }: { answers: Record<string, string> }) {
  const router = useRouter();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 80);
    return () => clearTimeout(t);
  }, []);

  const industry = answers.industry ?? "Other";
  const goal = answers.goal ?? "retention";
  const voice = answers.voice ?? "Friendly";
  const sendTime = answers.send_time ?? "evening";

  function goSignup() {
    try {
      localStorage.setItem("scaleva_quiz_answers", JSON.stringify(answers));
    } catch {}
    router.push("/signup");
  }

  const profileItems = [
    { label: "Business type", value: INDUSTRY_LABELS[industry] ?? industry },
    { label: "AI voice", value: VOICE_LABELS[voice] ?? voice },
    { label: "Primary goal", value: GOAL_LABELS[goal] ?? goal },
    { label: "Best send time", value: TIME_LABELS[sendTime] ?? sendTime },
  ];

  return (
    <div
      className={`flex min-h-screen flex-col items-center justify-center px-6 py-16 transition-all duration-700 ${
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div className="w-full max-w-lg">
        {/* Top badge */}
        <div className="mb-6 flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-1.5 text-xs font-semibold text-green-400">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Your profile is ready
          </span>
        </div>

        <h1 className="text-center font-heading text-3xl font-semibold tracking-[-0.03em] text-content sm:text-4xl">
          Here&apos;s what Scaleva
          <br />
          <span className="text-accent">built for you</span>
        </h1>
        <p className="mt-3 text-center text-sm text-content-muted">
          Based on your answers, your AI is pre-configured and ready to go.
        </p>

        {/* Profile card */}
        <div className="mt-8 rounded-card border border-line bg-surface">
          <div className="border-b border-line px-5 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-content-muted/50">Your setup</p>
          </div>
          <div className="divide-y divide-line">
            {profileItems.map((item) => (
              <div key={item.label} className="flex items-center justify-between px-5 py-3">
                <span className="text-xs text-content-muted">{item.label}</span>
                <span className="text-xs font-semibold text-content">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-6">
          <button
            type="button"
            onClick={goSignup}
            className="flex h-12 w-full items-center justify-center rounded-btn bg-accent text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
          >
            Get started now — setup takes 3 minutes
            <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
          <p className="mt-2.5 text-center text-xs text-content-muted">
            Free to start · No credit card required
          </p>
        </div>

        {/* Social proof */}
        <div className="mt-6 flex items-center justify-center gap-6">
          <div className="text-center">
            <p className="font-heading text-lg font-bold text-content">23%</p>
            <p className="text-[10px] text-content-muted">avg win-back rate</p>
          </div>
          <div className="h-8 w-px bg-line" />
          <div className="text-center">
            <p className="font-heading text-lg font-bold text-content">4 min</p>
            <p className="text-[10px] text-content-muted">avg setup time</p>
          </div>
          <div className="h-8 w-px bg-line" />
          <div className="text-center">
            <p className="font-heading text-lg font-bold text-content">90 days</p>
            <p className="text-[10px] text-content-muted">to see ROI</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function BuildingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="text-center">
        <div className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-4 border-line border-t-accent" />
        <p className="font-heading text-lg font-semibold text-content">Building your profile…</p>
        <p className="mt-1 text-sm text-content-muted">Personalizing your setup based on your answers</p>
      </div>
    </div>
  );
}

export function QuizClient() {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [visible, setVisible] = useState(true);
  const [building, setBuilding] = useState(false);
  const [done, setDone] = useState(false);

  const total = QUESTIONS.length;
  const q = QUESTIONS[currentQ];
  const progress = ((currentQ) / total) * 100;
  const isLast = currentQ === total - 1;

  function selectAnswer(value: string) {
    if (selected) return; // prevent double-click
    setSelected(value);

    setTimeout(() => {
      const newAnswers = { ...answers, [q.id]: value };
      setAnswers(newAnswers);

      if (isLast) {
        setVisible(false);
        setTimeout(() => {
          setBuilding(true);
          setTimeout(() => {
            setBuilding(false);
            setDone(true);
          }, 1800);
        }, 300);
        return;
      }

      setDirection("forward");
      setVisible(false);
      setTimeout(() => {
        setCurrentQ((n) => n + 1);
        setSelected(null);
        setVisible(true);
      }, 280);
    }, 160);
  }

  function goBack() {
    if (currentQ === 0) return;
    setDirection("back");
    setVisible(false);
    setTimeout(() => {
      setCurrentQ((n) => n - 1);
      setSelected(null);
      setVisible(true);
    }, 280);
  }

  if (building) return <BuildingScreen />;
  if (done) return <ResultsScreen answers={answers} />;

  const slideClass = visible
    ? "opacity-100 translate-x-0"
    : direction === "forward"
    ? "opacity-0 -translate-x-4"
    : "opacity-0 translate-x-4";

  return (
    <div className="flex min-h-screen flex-col bg-base">
      {/* Header */}
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
          <Link href="/" className="font-heading text-sm font-semibold tracking-tight text-content">
            Scaleva
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-xs text-content-muted">
              {currentQ + 1} of {total}
            </span>
            <Link
              href="/"
              className="rounded-btn p-1.5 text-content-muted transition-colors hover:bg-surface hover:text-content"
              aria-label="Exit quiz"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Link>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-0.5 bg-line">
          <div
            className="h-full bg-accent transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* Question */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div
          className={`w-full max-w-lg transition-all duration-280 ease-out ${slideClass}`}
          style={{ transitionDuration: "280ms" }}
        >
          {/* Step indicator */}
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-accent/70">
            Question {currentQ + 1}
          </p>

          <h2 className="font-heading text-2xl font-semibold tracking-[-0.02em] text-content sm:text-3xl">
            {q.text}
          </h2>
          {q.subtext && (
            <p className="mt-2 text-sm leading-relaxed text-content-muted">{q.subtext}</p>
          )}

          <div
            className={`mt-8 ${
              q.columns === 2
                ? "grid grid-cols-2 gap-3"
                : "flex flex-col gap-3"
            }`}
          >
            {q.answers.map((ans) => {
              const isSelected = selected === ans.value;
              const isPrevious = answers[q.id] === ans.value && selected === null;
              return (
                <button
                  key={ans.value}
                  type="button"
                  onClick={() => selectAnswer(ans.value)}
                  disabled={!!selected}
                  className={`group flex items-center gap-3 rounded-card border px-4 py-3.5 text-left text-sm font-medium transition-all duration-150 disabled:cursor-default
                    ${isSelected
                      ? "border-accent bg-accent/10 text-content shadow-sm shadow-accent/10 scale-[0.98]"
                      : isPrevious
                      ? "border-accent/40 bg-accent/5 text-content"
                      : "border-line bg-surface text-content hover:border-accent/50 hover:bg-surface hover:shadow-sm"
                    }`}
                >
                  {ans.emoji && (
                    <span className="text-xl leading-none">{ans.emoji}</span>
                  )}
                  <span className="flex-1 leading-snug">{ans.label}</span>
                  {isSelected && (
                    <svg className="h-4 w-4 flex-shrink-0 text-accent" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  {isPrevious && !isSelected && (
                    <svg className="h-4 w-4 flex-shrink-0 text-accent/50" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          {/* Back button */}
          {currentQ > 0 && (
            <div className="mt-8 flex justify-start">
              <button
                type="button"
                onClick={goBack}
                className="inline-flex items-center gap-1.5 text-xs text-content-muted transition-colors hover:text-content"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                Back
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer progress dots */}
      <footer className="flex justify-center gap-1.5 py-6">
        {QUESTIONS.map((_, i) => (
          <div
            key={i}
            className={`rounded-full transition-all duration-300 ${
              i < currentQ
                ? "h-1.5 w-4 bg-accent"
                : i === currentQ
                ? "h-1.5 w-6 bg-accent"
                : "h-1.5 w-1.5 bg-line"
            }`}
          />
        ))}
      </footer>
    </div>
  );
}
