"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

/* ─── Types ───────────────────────────────────────── */

interface BuildingDef {
  id: number;
  left: string;
  w: number;
  h: number;
  opacity: number;
  glow?: boolean;
}

interface HeroCardDef {
  name: string;
  biz: string;
  last: string;
  days: number;
  spend: string;
  anim: string;
}

/* ─── City data ───────────────────────────────────── */

const BUILDINGS: BuildingDef[] = [
  { id: 0,  left: "1%",  w: 40, h: 72,  opacity: 0.40 },
  { id: 1,  left: "5%",  w: 30, h: 52,  opacity: 0.38 },
  { id: 2,  left: "9%",  w: 48, h: 105, opacity: 0.48 },
  { id: 3,  left: "14%", w: 38, h: 132, opacity: 0.56 },
  { id: 4,  left: "19%", w: 34, h: 86,  opacity: 0.58 },
  { id: 5,  left: "23%", w: 55, h: 158, opacity: 0.65 },
  { id: 6,  left: "29%", w: 43, h: 118, opacity: 0.70 },
  { id: 7,  left: "34%", w: 36, h: 144, opacity: 0.72 },
  { id: 8,  left: "40%", w: 36, h: 190, opacity: 0.76 },
  // hero building
  { id: 9,  left: "44%", w: 82, h: 262, opacity: 1.00, glow: true },
  { id: 10, left: "52%", w: 40, h: 178, opacity: 0.78 },
  { id: 11, left: "57%", w: 48, h: 138, opacity: 0.73 },
  { id: 12, left: "62%", w: 35, h: 106, opacity: 0.68 },
  { id: 13, left: "66%", w: 52, h: 152, opacity: 0.65 },
  { id: 14, left: "72%", w: 40, h: 115, opacity: 0.60 },
  { id: 15, left: "77%", w: 36, h: 80,  opacity: 0.54 },
  { id: 16, left: "82%", w: 44, h: 96,  opacity: 0.50 },
  { id: 17, left: "88%", w: 30, h: 64,  opacity: 0.44 },
  { id: 18, left: "92%", w: 38, h: 70,  opacity: 0.40 },
];

const WINDOW_GRID = [
  "repeating-linear-gradient(0deg, transparent 0 12px, rgba(255,248,200,0.055) 12px 13.5px)",
  "repeating-linear-gradient(90deg, transparent 0 9px, rgba(255,248,200,0.055) 9px 10.5px)",
  "#1c1c1c",
].join(",");

const HERO_WINDOW_GRID = [
  "repeating-linear-gradient(0deg, transparent 0 12px, rgba(147,197,253,0.10) 12px 13.5px)",
  "repeating-linear-gradient(90deg, transparent 0 9px, rgba(147,197,253,0.10) 9px 10.5px)",
  "#141822",
].join(",");

/* ─── Hero floating cards ─────────────────────────── */

const HERO_CARDS: HeroCardDef[] = [
  { name: "Maria Chen",   biz: "Rosario's",      last: "Truffle Pasta — $84",       days: 14, spend: "$1,240", anim: "floatA 7s ease-in-out infinite" },
  { name: "James Park",   biz: "Studio 9 Salon",  last: "Balayage — $180",           days: 42, spend: "$890",   anim: "floatB 9s ease-in-out 0.5s infinite" },
  { name: "Sarah Kim",    biz: "Fleet Foot",      last: "Nike Air Max 97 — $120",    days: 21, spend: "$640",   anim: "floatC 6.5s ease-in-out 1.2s infinite" },
  { name: "David Torres", biz: "Apex Fitness",    last: "Membership renewal — $149", days: 19, spend: "$480",   anim: "floatD 8s ease-in-out 0.8s infinite" },
];

/* ─── SMS showcase ────────────────────────────────── */

const SMS_GRID = [
  { name: "Maria C.", biz: "Restaurant", icon: "🍽", msg: "Hey Maria! It's been 14 days — longer than usual. The truffle pasta is back and we just got a Barolo you'd love. First glass on us Thursday. — Rosario's" },
  { name: "James P.", biz: "Salon",      icon: "✂", msg: "Hi James! Your balayage was 6 weeks ago — prime time for a toner refresh. Thursday 2pm or Friday 11am are open. Want me to hold one? — Studio 9" },
  { name: "Mike T.",  biz: "Contractor", icon: "🔨", msg: "Hey Mike, your kitchen remodel wrapped 8 months ago. Spring's perfect for deck work — we'd love to give you a free estimate. Reply YES and I'll call this week." },
  { name: "Sarah K.", biz: "Retail",     icon: "👟", msg: "Sarah! Your Air Max 97s are 3 weeks old — hope they're holding up. Our fall running line just landed. Stop by and we'll give you 15% off as a returning customer." },
  { name: "David T.", biz: "Fitness",    icon: "💪", msg: "David — 19 days since your last check-in. Your HIIT streak was impressive at 22 days. Come back this week and your next month is half off. You've got this." },
  { name: "Lisa M.",  biz: "Med Spa",    icon: "✦",  msg: "Hi Lisa! It's been 10 weeks since your last facial — right on schedule for a follow-up. We have openings next Tuesday and Wednesday. Want me to hold a slot?" },
];

/* ─── Integrations ────────────────────────────────── */

const INTEGRATIONS = [
  { name: "Square",  color: "#00C244", desc: "Point of sale & customers" },
  { name: "Stripe",  color: "#635BFF", desc: "Payments & subscriptions" },
  { name: "Shopify", color: "#96BF48", desc: "eCommerce orders" },
  { name: "Toast",   color: "#FF4C00", desc: "Restaurant POS" },
  { name: "HubSpot", color: "#FF7A59", desc: "CRM contacts" },
];

/* ─── Plans ───────────────────────────────────────── */

const PLANS = [
  {
    id: "starter", name: "Starter", price: 199, annual: 159,
    limit: "500 customers · 2,000 msg/mo",
    features: ["CSV & manual entry", "AI message generation", "Basic analytics", "Email support"],
    highlight: false,
  },
  {
    id: "growth", name: "Growth", price: 399, annual: 319,
    limit: "1,500 customers · 6,000 msg/mo",
    features: ["Square, Stripe, Shopify, Toast", "Autopilot scheduling", "Two-way SMS", "Full analytics", "Priority support"],
    highlight: true,
  },
  {
    id: "pro", name: "Pro", price: 699, annual: 559,
    limit: "5,000 customers · 25,000 msg/mo",
    features: ["Everything in Growth", "Revenue tracking", "Data export", "Dedicated onboarding"],
    highlight: false,
  },
];

const FAQS = [
  { q: "Do I need technical skills?", a: "No. If you can send a text, you can run Scaleva. Setup takes about 10 minutes." },
  { q: "Do customers need to opt in?", a: "Yes. You're responsible for SMS consent. We provide TCPA-compliant templates." },
  { q: "How personalized are the messages?", a: "Completely. Claude reads each customer's history and writes a unique message every single time. No templates are ever reused." },
  { q: "What happens when a customer replies?", a: "The reply appears in your dashboard and you get an email alert. You can respond directly from Scaleva." },
  { q: "Can I cancel anytime?", a: "Yes. Cancel from your dashboard at any time. No contracts, no cancellation fees." },
  { q: "What integrations do you support?", a: "Square, Stripe, Shopify, Toast, HubSpot — or any CSV export. New integrations ship regularly." },
];

/* ─── Sub-components ──────────────────────────────── */

function Building({ left, w, h, opacity, glow }: BuildingDef) {
  return (
    <div
      style={{
        position: "absolute",
        left,
        bottom: 0,
        width: w,
        height: h,
        opacity,
        background: glow ? HERO_WINDOW_GRID : WINDOW_GRID,
        border: glow
          ? "1px solid rgba(37,99,235,0.25)"
          : "1px solid rgba(255,255,255,0.04)",
        animation: glow ? "heroBldgGlow 3s ease-in-out infinite" : undefined,
        willChange: glow ? "box-shadow" : undefined,
      }}
    />
  );
}

function HeroCard({ card }: { card: HeroCardDef }) {
  return (
    <div
      style={{
        position: "absolute",
        width: 188,
        animation: card.anim,
        willChange: "transform",
        background: "rgba(20,20,20,0.92)",
        border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: 12,
        padding: "14px 16px",
        backdropFilter: "blur(16px)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 600, color: "#888", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {card.biz}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 10 }}>{card.name}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {[
          ["Last purchase", card.last],
          ["Days since visit", `${card.days} days`],
          ["Lifetime spend", card.spend],
        ].map(([label, val]) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <span style={{ fontSize: 11, color: "#555" }}>{label}</span>
            <span style={{ fontSize: 11, color: "#aaa", textAlign: "right", flex: 1 }}>{val}</span>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, paddingTop: 8, borderTop: "1px solid #222" }}>
          <span style={{ fontSize: 11, color: "#555" }}>Status</span>
          <span style={{ fontSize: 11, color: "#f59e0b", fontWeight: 600 }}>⚠ Overdue</span>
        </div>
      </div>
    </div>
  );
}

function Check() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

/* ─── Main page ───────────────────────────────────── */

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [annual, setAnnual]   = useState(false);
  const observerRef           = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("visible"); observerRef.current?.unobserve(e.target); } }),
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".reveal").forEach((el) => observerRef.current?.observe(el));
    return () => observerRef.current?.disconnect();
  }, []);

  const D = (bg: string) => ({ background: bg, color: "#fff" });
  const yr = new Date().getFullYear();

  /* shared section heading */
  function Heading({ eyebrow, title, sub, light }: { eyebrow: string; title: string; sub?: string; light?: boolean }) {
    return (
      <div className="reveal mb-14 text-center">
        <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: light ? "#2563eb" : "#2563eb", marginBottom: 12 }}>{eyebrow}</p>
        <h2 style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.1, color: light ? "#111" : "#fff" }}>{title}</h2>
        {sub && <p style={{ marginTop: 14, fontSize: 16, color: light ? "#555" : "#666", maxWidth: 520, margin: "14px auto 0" }}>{sub}</p>}
      </div>
    );
  }

  return (
    <div style={{ background: "#111111", color: "#fff", fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>

      {/* ── Navbar ─────────────────────────────────── */}
      <header style={{
        position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)",
        width: "min(1080px, calc(100vw - 32px))", zIndex: 50,
        background: "rgba(10,10,10,0.85)", backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 14, padding: "12px 20px",
        animation: "navDown 0.5s ease both",
        boxShadow: "0 4px 32px rgba(0,0,0,0.6)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em" }}>Scaleva</span>
          <nav style={{ display: "flex", gap: 28, alignItems: "center" }} className="hidden md:flex">
            {[["#how-it-works","How it works"],["#pricing","Pricing"]].map(([h,l]) => (
              <a key={l} href={h} style={{ fontSize: 14, color: "#666", textDecoration: "none", transition: "color 0.15s" }}
                onMouseEnter={(e) => ((e.target as HTMLElement).style.color = "#fff")}
                onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "#666")}>
                {l}
              </a>
            ))}
          </nav>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Link href="/login" style={{ fontSize: 14, color: "#666", textDecoration: "none" }}>Log in</Link>
            <Link href="/signup" style={{
              fontSize: 14, fontWeight: 600, color: "#111", background: "#fff",
              borderRadius: 8, padding: "8px 18px", textDecoration: "none",
              transition: "background 0.15s",
            }}>Get started</Link>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────── */}
      <section style={{ position: "relative", minHeight: "100vh", overflow: "hidden", background: "#111" }}>

        {/* City — zooms in then fades */}
        <div
          className="hidden md:block"
          style={{
            position: "absolute", inset: 0, overflow: "hidden",
            animation: "cityZoom 3.2s cubic-bezier(0.16,1,0.3,1) forwards, cityFade 0.9s ease 3.1s forwards",
            willChange: "transform, opacity",
          }}
        >
          {/* Ground grid */}
          <div style={{
            position: "absolute", bottom: 0, left: "-60%", right: "-60%", height: "48%",
            backgroundImage: [
              "linear-gradient(rgba(37,99,235,0.07) 1px, transparent 1px)",
              "linear-gradient(90deg, rgba(37,99,235,0.07) 1px, transparent 1px)",
            ].join(","),
            backgroundSize: "80px 55px",
            transform: "perspective(700px) rotateX(65deg)",
            transformOrigin: "bottom center",
            maskImage: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 80%)",
          }} />
          {/* Skyline */}
          <div style={{ position: "absolute", bottom: "27%", left: 0, right: 0 }}>
            {BUILDINGS.map((b) => <Building key={b.id} {...b} />)}
          </div>
          {/* Horizon glow */}
          <div style={{
            position: "absolute", bottom: "26%", left: "30%", right: "30%", height: 1,
            background: "linear-gradient(to right, transparent, rgba(37,99,235,0.3), transparent)",
            filter: "blur(2px)",
          }} />
          {/* Sky fade */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "40%", background: "linear-gradient(to bottom, #111, transparent)" }} />
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "25%", background: "linear-gradient(to top, #111, transparent)" }} />
        </div>

        {/* Floating customer cards — appear after city fades */}
        <div
          className="hidden md:block"
          style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            animation: "fadeIn 1s ease 3.4s both",
            perspective: 900,
          }}
        >
          {HERO_CARDS.map((c) => <HeroCard key={c.name} card={c} />)}
        </div>

        {/* Hero text — fades in a beat before city finishes */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 10,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "0 24px", textAlign: "center",
          animation: "fadeInUp 0.9s ease 2.2s both",
        }}>
          <h1 style={{ fontSize: "clamp(44px,7vw,88px)", fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1.0, marginBottom: 0 }}>
            Every customer.
          </h1>
          <h1 style={{ fontSize: "clamp(44px,7vw,88px)", fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1.0, color: "#2563eb", marginTop: 4 }}>
            Personally remembered.
          </h1>
          <p style={{ marginTop: 24, fontSize: "clamp(16px,2vw,20px)", color: "#555", maxWidth: 560, lineHeight: 1.6 }}>
            Scaleva reads your customer data and writes a personal SMS for every single person — what they ordered, what they like, when they should come back. Automatically.
          </p>
          <div style={{ marginTop: 36, display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
            <Link href="/signup" style={{
              fontSize: 15, fontWeight: 600, color: "#111", background: "#fff",
              borderRadius: 8, padding: "14px 28px", textDecoration: "none",
              transition: "background 0.15s, transform 0.15s",
            }}>Get started free</Link>
            <a href="#how-it-works" style={{
              fontSize: 15, fontWeight: 500, color: "#fff",
              border: "1px solid rgba(255,255,255,0.18)", background: "transparent",
              borderRadius: 8, padding: "14px 28px", textDecoration: "none",
              transition: "border-color 0.15s",
            }}>See how it works</a>
          </div>
        </div>

        {/* Scroll hint */}
        <div style={{
          position: "absolute", bottom: 28, left: "50%", transform: "translateX(-50%)",
          animation: "fadeIn 1s ease 4s both",
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </section>

      {/* ── Section 1: It knows your customers ──────── */}
      <section id="how-it-works" style={{ padding: "120px 24px", background: "#111" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <Heading eyebrow="Intelligence" title="Not just their name. Everything." />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }} className="grid-cols-1 lg:grid-cols-2">
            {/* Customer data card */}
            <div className="reveal" style={{
              background: "#161616", border: "1px solid #222",
              borderRadius: 16, padding: 28,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid #222" }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700 }}>M</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>Maria Chen</div>
                  <div style={{ fontSize: 13, color: "#555" }}>Rosario's · Regular customer</div>
                </div>
                <div style={{ marginLeft: "auto", fontSize: 11, color: "#f59e0b", fontWeight: 600, background: "rgba(245,158,11,0.1)", padding: "4px 10px", borderRadius: 6 }}>⚠ Overdue</div>
              </div>
              {[
                ["Last order", "Truffle Pasta, Pinot Noir — $84"],
                ["Visit frequency", "Every 11 days"],
                ["Favorite items", "Pasta dishes, Italian reds"],
                ["Days since last visit", "14 days"],
                ["Predicted next visit", "3 days overdue"],
                ["Lifetime spend", "$1,240"],
              ].map(([label, val]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #1a1a1a" }}>
                  <span style={{ fontSize: 13, color: "#555" }}>{label}</span>
                  <span style={{ fontSize: 13, color: "#ccc", fontWeight: 500 }}>{val}</span>
                </div>
              ))}
            </div>

            {/* Phone + SMS */}
            <div className="reveal reveal-d1" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Phone frame */}
              <div style={{
                background: "#0a0a0a", border: "1px solid #222", borderRadius: 36,
                padding: "12px 0 8px", maxWidth: 300, margin: "0 auto",
                boxShadow: "0 40px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)",
              }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
                  <div style={{ width: 90, height: 18, background: "#000", borderRadius: 20 }} />
                </div>
                <div style={{ padding: "0 16px 12px", borderBottom: "1px solid #1a1a1a" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#1a1a2e", border: "1px solid #2563eb22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#2563eb" }}>R</div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600 }}>Rosario's</div>
                      <div style={{ fontSize: 9, color: "#444" }}>Business</div>
                    </div>
                  </div>
                </div>
                <div style={{ padding: "16px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ alignSelf: "flex-end", maxWidth: "82%", background: "#2563eb", borderRadius: "16px 16px 4px 16px", padding: "10px 12px", fontSize: 11, lineHeight: 1.5, color: "#fff" }}>
                    Hey Maria! It&apos;s been 14 days — longer than usual for you. The truffle pasta is back and we just got a Barolo you&apos;d love. First glass on us Thursday. — Rosario&apos;s
                  </div>
                  <div style={{ alignSelf: "flex-start", maxWidth: "75%", background: "#1c1c1c", borderRadius: "16px 16px 16px 4px", padding: "10px 12px", fontSize: 11, lineHeight: 1.5, color: "#ccc" }}>
                    Oh wow, yes! Thursday works perfectly 🙌
                  </div>
                  <div style={{ textAlign: "center", fontSize: 9, color: "#333" }}>Delivered</div>
                </div>
              </div>
              <p style={{ textAlign: "center", fontSize: 14, color: "#444", fontStyle: "italic" }}>Written by AI. Feels written by you.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 2: Unique for every person ──────── */}
      <section style={{ padding: "120px 24px", background: "#0d0d0d" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <Heading
            eyebrow="Personalization"
            title={`One thousand customers.\nOne thousand different messages.`}
            sub="No templates. No blasting. Every message is written from scratch."
          />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {SMS_GRID.map((s, i) => (
              <div
                key={i}
                className="reveal"
                style={{
                  background: "#161616", border: "1px solid #222", borderRadius: 14,
                  padding: 20,
                  transitionDelay: `${i * 0.07}s`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <span style={{ fontSize: 20 }}>{s.icon}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: "#555" }}>{s.biz}</div>
                  </div>
                </div>
                <div style={{
                  background: "#2563eb", borderRadius: "14px 14px 4px 14px",
                  padding: "12px 14px", fontSize: 12, lineHeight: 1.6, color: "#fff",
                }}>
                  {s.msg}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 3: Gets smarter ──────────────────── */}
      <section style={{ padding: "120px 24px", background: "#111" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <Heading
            eyebrow="Intelligence"
            title="The longer you use it, the better it gets."
            sub="Scaleva learns what works for your customers and doubles down on it."
          />
          <div style={{ position: "relative" }}>
            {/* Connecting line */}
            <div className="hidden md:block" style={{ position: "absolute", top: 24, left: "16.5%", right: "16.5%", height: 1, background: "linear-gradient(to right, #222, #2563eb33, #222)" }} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
              {[
                {
                  month: "Month 1",
                  label: "Basic personalization",
                  msg: `"Hey Maria! It's been 14 days. Come visit us soon."`,
                  note: "Name + last visit date",
                },
                {
                  month: "Month 2",
                  label: "Pattern recognition",
                  msg: `"Maria — you usually visit every 11 days and you're overdue. The truffle pasta is back."`,
                  note: "Frequency + preferences",
                },
                {
                  month: "Month 3",
                  label: "Predictive retention",
                  msg: `"Maria, based on your pattern we think you're about to go elsewhere. First Barolo glass is on us tonight — just for you."`,
                  note: "Churn prediction + proactive save",
                },
              ].map((step, i) => (
                <div key={i} className="reveal" style={{ transitionDelay: `${i * 0.15}s` }}>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: "50%",
                      border: "2px solid #2563eb", background: "#111",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, fontWeight: 700, color: "#2563eb",
                      animation: "dotPulse 3s ease-in-out infinite",
                      animationDelay: `${i * 0.8}s`,
                    }}>
                      {i + 1}
                    </div>
                  </div>
                  <div style={{ textAlign: "center", marginBottom: 16 }}>
                    <div style={{ fontSize: 12, color: "#2563eb", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>{step.month}</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>{step.label}</div>
                  </div>
                  <div style={{ background: "#161616", border: "1px solid #222", borderRadius: 12, padding: 16 }}>
                    <div style={{ background: "#2563eb", borderRadius: "12px 12px 4px 12px", padding: "10px 12px", fontSize: 12, lineHeight: 1.55, color: "#fff", marginBottom: 10 }}>
                      {step.msg}
                    </div>
                    <div style={{ fontSize: 11, color: "#444", textAlign: "right" }}>{step.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 4: Autopilot ─────────────────────── */}
      <section style={{ padding: "120px 24px", background: "#0d0d0d" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <Heading eyebrow="Automation" title="Set it once. Revenue forever." />
          <div className="reveal" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "center" }}>
            {/* Schedule UI */}
            <div style={{ background: "#161616", border: "1px solid #222", borderRadius: 16, padding: 28 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#888", marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.08em" }}>Autopilot Schedule</div>
              {[
                ["Send day", "Monday"],
                ["Send time", "9:00 AM"],
                ["Cadence", "Weekly"],
                ["Target", "Overdue customers"],
              ].map(([label, val]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #1a1a1a" }}>
                  <span style={{ fontSize: 13, color: "#555" }}>{label}</span>
                  <span style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>{val}</span>
                </div>
              ))}
              <div style={{ marginTop: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>Autopilot</span>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ position: "relative", width: 48, height: 26, background: "#2563eb", borderRadius: 13, cursor: "pointer" }}>
                    <div style={{ position: "absolute", top: 3, right: 3, width: 20, height: 20, background: "#fff", borderRadius: "50%" }} />
                  </div>
                  <span style={{ fontSize: 12, color: "#2563eb", fontWeight: 600 }}>ON</span>
                </div>
              </div>
            </div>
            {/* Stat */}
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "clamp(48px,6vw,72px)", fontWeight: 700, letterSpacing: "-0.04em", color: "#fff", lineHeight: 1 }}>2,400</div>
              <div style={{ fontSize: 16, color: "#555", marginTop: 8 }}>messages sent per month</div>
              <div style={{ fontSize: 13, color: "#333", marginTop: 4 }}>by the average Scaleva business</div>
              <div style={{ marginTop: 24, fontSize: 14, color: "#2563eb", fontWeight: 600 }}>Zero sent manually.</div>
              <p style={{ marginTop: 16, fontSize: 14, color: "#444", lineHeight: 1.6 }}>You run your business. Scaleva handles the follow-up.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Integrations ─────────────────────────────── */}
      <section style={{ padding: "100px 24px", background: "#111" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <Heading eyebrow="Integrations" title="Works with the tools you already use" />
          <div className="reveal" style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center", marginBottom: 32 }}>
            {INTEGRATIONS.map((int) => (
              <div
                key={int.name}
                style={{
                  background: "#161616", borderRadius: 12,
                  borderLeft: `3px solid ${int.color}`,
                  border: `1px solid #222`,
                  borderLeftColor: int.color,
                  padding: "18px 22px",
                  minWidth: 180,
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  cursor: "default",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.transform = "translateY(-4px)";
                  el.style.borderLeftColor = int.color;
                  el.style.boxShadow = `0 12px 40px rgba(0,0,0,0.4), 0 0 0 1px ${int.color}40`;
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.transform = "";
                  el.style.boxShadow = "";
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{int.name}</div>
                <div style={{ fontSize: 12, color: "#555" }}>{int.desc}</div>
                <div style={{ marginTop: 12, fontSize: 12, color: int.color, fontWeight: 600 }}>Connected ●</div>
              </div>
            ))}
          </div>
          <p className="reveal" style={{ textAlign: "center", fontSize: 14, color: "#444" }}>
            Or upload any <span style={{ color: "#888", fontWeight: 500 }}>CSV file</span>. Takes 2 minutes.
          </p>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────── */}
      <section id="pricing" style={{ padding: "120px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <Heading eyebrow="Pricing" title="Simple pricing. Serious results." light />

          {/* Annual toggle */}
          <div className="reveal" style={{ display: "flex", justifyContent: "center", marginBottom: 48 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#f5f5f5", borderRadius: 40, padding: "8px 16px" }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: annual ? "#999" : "#111" }}>Monthly</span>
              <button
                onClick={() => setAnnual(!annual)}
                style={{
                  position: "relative", width: 44, height: 24,
                  background: annual ? "#2563eb" : "#d1d5db",
                  borderRadius: 12, border: "none", cursor: "pointer",
                  transition: "background 0.2s",
                }}
              >
                <span style={{
                  position: "absolute", top: 2,
                  left: annual ? "calc(100% - 22px)" : 2,
                  width: 20, height: 20, background: "#fff",
                  borderRadius: "50%", transition: "left 0.2s",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                }} />
              </button>
              <span style={{ fontSize: 14, fontWeight: 500, color: annual ? "#111" : "#999" }}>
                Annual <span style={{ background: "#dcfce7", color: "#16a34a", fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 20 }}>−20%</span>
              </span>
            </div>
          </div>

          {/* Plan cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20, marginBottom: 20 }}>
            {PLANS.map((plan, i) => (
              <div
                key={plan.id}
                className="reveal"
                style={{
                  position: "relative",
                  background: "#fff",
                  border: plan.highlight ? "2px solid #2563eb" : "1px solid #e5e7eb",
                  borderRadius: 16, padding: 28,
                  display: "flex", flexDirection: "column",
                  transitionDelay: `${i * 0.1}s`,
                }}
              >
                {plan.highlight && (
                  <div style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)", background: "#2563eb", color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 14px", borderRadius: 20, whiteSpace: "nowrap" }}>
                    Most Popular
                  </div>
                )}
                <div style={{ fontSize: 16, fontWeight: 700, color: "#111", marginBottom: 12 }}>{plan.name}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                  <span style={{ fontSize: 40, fontWeight: 700, color: "#111", fontVariantNumeric: "tabular-nums" }}>${annual ? plan.annual : plan.price}</span>
                  <span style={{ fontSize: 14, color: "#888" }}>/mo</span>
                </div>
                <div style={{ fontSize: 12, color: "#999", marginBottom: 24 }}>{plan.limit}</div>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 14, color: "#444" }}>
                      <span style={{ color: "#2563eb", marginTop: 2, flexShrink: 0 }}><Check /></span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup" style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  height: 44, borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: "none",
                  background: plan.highlight ? "#2563eb" : "#111",
                  color: "#fff",
                  transition: "opacity 0.15s",
                }}>
                  {plan.highlight ? "Start with Growth" : `Start with ${plan.name}`}
                </Link>
              </div>
            ))}
          </div>

          {/* Enterprise */}
          <div className="reveal" style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 28, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#111", marginBottom: 6 }}>Enterprise — Pay as you go</div>
              <div style={{ fontSize: 14, color: "#666", marginBottom: 12 }}>No hard limits. Billed based on actual usage.</div>
              <div style={{ display: "flex", gap: 24 }}>
                <span style={{ fontSize: 14, color: "#111" }}><strong>$0.02</strong> <span style={{ color: "#888" }}>/ message</span></span>
                <span style={{ fontSize: 14, color: "#111" }}><strong>$0.01</strong> <span style={{ color: "#888" }}>/ customer/mo</span></span>
              </div>
            </div>
            <a href="mailto:hello@scaleva.com?subject=Enterprise" style={{ background: "#111", color: "#fff", borderRadius: 8, padding: "12px 24px", fontSize: 14, fontWeight: 600, textDecoration: "none" }}>Contact us</a>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────── */}
      <section style={{ padding: "100px 24px", background: "#0d0d0d" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <Heading eyebrow="FAQ" title="Common questions" />
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {FAQS.map((faq, i) => (
              <div key={i} className="reveal" style={{ background: "#161616", border: "1px solid #1e1e1e", borderRadius: 12, overflow: "hidden", transitionDelay: `${i * 0.06}s` }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center",
                    justifyContent: "space-between", padding: "18px 22px",
                    background: "none", border: "none", cursor: "pointer",
                    color: "#fff", textAlign: "left",
                  }}
                >
                  <span style={{ fontSize: 15, fontWeight: 600 }}>{faq.q}</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth={2}
                    style={{ transform: openFaq === i ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0, marginLeft: 16 }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div style={{ padding: "0 22px 18px", fontSize: 14, lineHeight: 1.7, color: "#666", borderTop: "1px solid #1e1e1e", paddingTop: 14 }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────── */}
      <section style={{ padding: "140px 24px", background: "#111", textAlign: "center" }}>
        <div className="reveal" style={{ maxWidth: 680, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(36px,5vw,60px)", fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1.1 }}>
            Stop losing customers to silence.
          </h2>
          <p style={{ marginTop: 20, fontSize: 18, color: "#555", lineHeight: 1.6 }}>
            Most businesses lose customers simply because they never followed up. Scaleva fixes that — automatically, personally, at scale.
          </p>
          <Link href="/signup" style={{
            display: "inline-flex", alignItems: "center", marginTop: 40,
            background: "#fff", color: "#111", fontWeight: 700, fontSize: 16,
            borderRadius: 8, padding: "16px 36px", textDecoration: "none",
            transition: "opacity 0.15s",
          }}>
            Start for free
          </Link>
          <p style={{ marginTop: 14, fontSize: 13, color: "#333" }}>No credit card required · Cancel anytime</p>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────── */}
      <footer style={{ padding: "28px 24px", borderTop: "1px solid #1a1a1a", background: "#111" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em" }}>Scaleva</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "center" }}>
            {[["#pricing","Pricing"],["/privacy","Privacy"],["/terms","Terms"]].map(([h,l]) => (
              <Link key={l} href={h} style={{ fontSize: 13, color: "#444", textDecoration: "none" }}>{l}</Link>
            ))}
            <span style={{ fontSize: 13, color: "#333" }}>&copy; {yr} Scaleva</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
