"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

/* ─── Types ───────────────────────────────────────── */

interface Particle { id: number; left: string; size: number; duration: number; delay: number; opacity: number; }

/* ─── Industry data ───────────────────────────────── */

const INDUSTRIES = [
  {
    label: "Restaurant",
    customerName: "Maria",
    data: [
      ["Last order", "Truffle Pasta, $28"],
      ["Visit frequency", "Every 12 days"],
      ["Favorite items", "Pasta dishes, red wine"],
      ["Total spend", "$284"],
      ["Days since visit", "14 days"],
    ],
    message: "Hey Maria! It's been 14 days since your last visit. We just added the truffle pasta back to the menu. Come in this week and get 10% off. 🍝",
  },
  {
    label: "Salon",
    customerName: "James",
    data: [
      ["Last service", "Balayage highlights, $180"],
      ["Visit frequency", "Every 6 weeks"],
      ["Hair type", "Color-treated"],
      ["Total spend", "$890"],
      ["Days since visit", "45 days"],
    ],
    message: "Hi James! Your highlights were 6 weeks ago — time for a refresh? We have openings Thursday and Friday. Book now and mention this text for a free gloss treatment. 💇",
  },
  {
    label: "Construction",
    customerName: "Mike",
    data: [
      ["Last project", "Kitchen remodel, $12,400"],
      ["Project type", "Interior renovation"],
      ["Preferred contact", "Text message"],
      ["Total spend", "$18,600"],
      ["Days since contact", "62 days"],
    ],
    message: "Hey Mike, it's been a while since your kitchen remodel. Spring is a great time for deck work — want a free estimate this month? Just reply YES.",
  },
  {
    label: "Retail",
    customerName: "Emma",
    data: [
      ["Last purchase", "Nike Air Max, $120"],
      ["Category", "Athletic footwear"],
      ["Purchase frequency", "Monthly"],
      ["Total spend", "$640"],
      ["Days since visit", "21 days"],
    ],
    message: "Hi Emma! You picked up some great Nike Air Max last month. Our fall collection just dropped — stop by and we'll give you 15% off your next purchase. 🛍️",
  },
  {
    label: "Fitness",
    customerName: "Alex",
    data: [
      ["Membership type", "Premium"],
      ["Last check-in", "18 days ago"],
      ["Favorite class", "HIIT"],
      ["Total spend", "$480/yr"],
      ["Streak before gap", "22 days"],
    ],
    message: "Hey Alex! We've missed you at the gym — your 22-day streak was impressive. Come back this week and we'll give you a free personal training session. 💪",
  },
];

/* ─── Static data ─────────────────────────────────── */

const FAQS = [
  { q: "Do I need technical skills to use Scaleva?", a: "No — if you can send a text, you can use Scaleva. Setup takes about 10 minutes." },
  { q: "Do my customers need to opt in?", a: "Yes — you're responsible for obtaining SMS consent. We provide TCPA-compliant templates to make this easy." },
  { q: "How personalized are the messages really?", a: "Very — Claude reads each customer's purchase history and writes a unique message every time. No two messages are the same." },
  { q: "What happens if a customer replies?", a: "Their reply shows in your dashboard and you get an email notification. You can respond directly from Scaleva." },
  { q: "Can I cancel anytime?", a: "Yes — cancel anytime from your dashboard. No contracts, no cancellation fees." },
  { q: "What integrations do you support?", a: "Square, Stripe, Shopify, Toast, HubSpot, or any CSV export. More integrations coming soon." },
];

const STEPS = [
  {
    num: "01",
    title: "Connect your customers",
    desc: "Import from Square, Stripe, Shopify, or upload a CSV. Takes 2 minutes.",
    icon: (<svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>),
  },
  {
    num: "02",
    title: "Configure your AI",
    desc: "Tell Scaleva your industry, voice, and goals. It learns your business inside and out.",
    icon: (<svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>),
  },
  {
    num: "03",
    title: "Watch customers return",
    desc: "Scaleva writes and sends personal SMS on autopilot. You just count the revenue.",
    icon: (<svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>),
  },
];

const PROOF_ITEMS = [
  "Restaurant", "Hair Salon", "Auto Repair", "Retail Store", "Fitness Studio",
  "Medical Spa", "Food Truck", "Nail Salon", "Yoga Studio", "Contractor",
  "Pet Grooming", "Barbershop", "Massage Therapy", "Jewelry Store", "Bakery",
];

const INTEGRATIONS = [
  { name: "Square",   color: "#00C244", bg: "rgba(0,194,68,0.08)",   icon: "⬛", desc: "POS & customer data" },
  { name: "Stripe",   color: "#635BFF", bg: "rgba(99,91,255,0.08)",  icon: "💳", desc: "Transaction history" },
  { name: "Shopify",  color: "#96BF48", bg: "rgba(150,191,72,0.08)", icon: "🛍️", desc: "eCommerce purchases" },
  { name: "Toast",    color: "#FF4C00", bg: "rgba(255,76,0,0.08)",   icon: "🍽️", desc: "Restaurant POS" },
  { name: "HubSpot",  color: "#FF7A59", bg: "rgba(255,122,89,0.08)", icon: "🔗", desc: "CRM contacts" },
];

const PLANS = [
  { id: "starter", name: "Starter", price: 199, annualPrice: 159, limit: "500 customers · 2,000 msg/mo", features: ["CSV & manual entry", "AI-generated messages", "Basic analytics", "Email support"], highlight: false },
  { id: "growth",  name: "Growth",  price: 399, annualPrice: 319, limit: "1,500 customers · 6,000 msg/mo", features: ["All integrations (Square, Stripe…)", "Full analytics", "Autopilot scheduling", "Two-way SMS", "Priority support"], highlight: true },
  { id: "pro",     name: "Pro",     price: 699, annualPrice: 559, limit: "5,000 customers · 25,000 msg/mo", features: ["Everything in Growth", "Revenue tracking", "Data export", "Dedicated onboarding"], highlight: false },
];

/* ─── Sub-components ──────────────────────────────── */

function Word({ text, delay }: { text: string; delay: number }) {
  return (
    <span className="inline-block" style={{ animation: `wordReveal 0.6s ease both`, animationDelay: `${delay}s` }}>
      {text}&nbsp;
    </span>
  );
}

function CheckIcon({ color = "text-blue-400" }: { color?: string }) {
  return (
    <svg className={`mt-0.5 h-4 w-4 flex-shrink-0 ${color}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

/* Bento card with 3D mouse-tilt */
function BentoCard({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width  - 0.5;
    const y = (e.clientY - r.top)  / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateZ(10px)`;
    el.style.transition = "transform 0.08s ease";
    el.style.boxShadow = `${-x * 12}px ${-y * 12}px 40px rgba(0,0,0,0.18), 0 8px 32px rgba(0,0,0,0.12)`;
  }, []);

  const onLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "";
    el.style.transition = "transform 0.5s ease, box-shadow 0.5s ease";
    el.style.boxShadow = "";
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{ ...style, willChange: "transform" }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {children}
    </div>
  );
}

/* Phone mockup — strong 3D tilt + float + shine on hover */
function PhoneMockup() {
  const shineRef = useRef<HTMLDivElement>(null);

  function onHover() {
    const el = shineRef.current;
    if (!el) return;
    el.style.animation = "phoneShine 0.8s ease forwards";
  }
  function onLeave() {
    const el = shineRef.current;
    if (!el) return;
    el.style.animation = "none";
  }

  return (
    <div
      className="relative mx-auto w-[230px]"
      style={{ animation: "phoneFloat 4s ease-in-out infinite", willChange: "transform" }}
    >
      {/* Bottom glow */}
      <div
        className="absolute -bottom-10 left-1/2 h-20 w-48 -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: "radial-gradient(ellipse, rgba(99,102,241,0.5) 0%, transparent 70%)", animation: "pulseGlow 3s ease-in-out infinite" }}
      />
      {/* Side glow */}
      <div
        className="absolute -right-8 top-1/3 h-32 w-16 rounded-full blur-2xl opacity-40"
        style={{ background: "radial-gradient(ellipse, rgba(59,130,246,0.6) 0%, transparent 70%)" }}
      />
      {/* Phone shell */}
      <div
        className="relative overflow-hidden rounded-[36px] border border-white/15 bg-[#07090f]"
        onMouseEnter={onHover}
        onMouseLeave={onLeave}
        style={{
          boxShadow: "0 50px 100px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.06), inset 0 0 0 1px rgba(255,255,255,0.04), -20px 20px 60px rgba(99,102,241,0.15)",
        }}
      >
        {/* Shine overlay */}
        <div
          ref={shineRef}
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            background: "linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.18) 50%, transparent 65%)",
            transform: "translateX(-200%) skewX(-20deg)",
          }}
        />
        {/* Notch */}
        <div className="flex justify-center pt-4 pb-1">
          <div className="h-[18px] w-24 rounded-full bg-black" />
        </div>
        {/* Status bar */}
        <div className="flex items-center justify-between px-5 pb-2 text-[9px] text-white/40">
          <span>9:41</span>
          <div className="flex gap-1 items-center">
            <span>●●●</span>
            <span className="ml-1">WiFi</span>
          </div>
        </div>
        {/* Contact header */}
        <div className="border-b border-white/5 px-4 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)" }}>S</div>
            <div>
              <div className="text-[10px] font-semibold text-white">Sunrise Salon</div>
              <div className="flex items-center gap-1 text-[8px] text-green-400">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                Business SMS
              </div>
            </div>
          </div>
        </div>
        {/* Messages */}
        <div className="space-y-3 p-4">
          <div className="flex justify-end">
            <div className="max-w-[145px] rounded-[16px] rounded-tr-[4px] px-3 py-2 text-[9px] leading-relaxed text-white" style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)" }}>
              Hey Sarah! It&apos;s been 3 weeks since your last visit. We&apos;re holding a spot for you this Friday. 💙
            </div>
          </div>
          <div className="flex justify-start">
            <div className="max-w-[130px] rounded-[16px] rounded-tl-[4px] bg-white/10 px-3 py-2 text-[9px] leading-relaxed text-white">
              Oh wow, perfect timing! I was just thinking I needed a trim. Book me in!
            </div>
          </div>
          <div className="flex justify-end">
            <div className="max-w-[140px] rounded-[16px] rounded-tr-[4px] px-3 py-2 text-[9px] leading-relaxed text-white" style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)" }}>
              Done! Friday 2pm. See you then! 🎉
            </div>
          </div>
          <div className="flex justify-center">
            <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[8px] text-white/30">Delivered · 9:41 AM</span>
          </div>
        </div>
        {/* Input */}
        <div className="border-t border-white/5 p-3">
          <div className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5">
            <span className="flex-1 text-[9px] text-white/20">iMessage</span>
            <div className="h-4 w-4 rounded-full" style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)", opacity: 0.6 }} />
          </div>
        </div>
        {/* Home bar */}
        <div className="flex justify-center pb-3 pt-1">
          <div className="h-1 w-24 rounded-full bg-white/20" />
        </div>
      </div>
    </div>
  );
}

/* ─── Main component ──────────────────────────────── */

export default function LandingPage() {
  const [activeIndustry, setActiveIndustry] = useState(0);
  const [openFaq, setOpenFaq]     = useState<number | null>(null);
  const [annual, setAnnual]       = useState(false);
  const [tabKey, setTabKey]       = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);

  const observerRef  = useRef<IntersectionObserver | null>(null);
  const blobsRef     = useRef<HTMLDivElement>(null);
  const heroRef      = useRef<HTMLElement>(null);

  /* Intersection observer for scroll animations */
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("visible"); observerRef.current?.unobserve(e.target); } }),
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".aos").forEach((el) => observerRef.current?.observe(el));
    return () => observerRef.current?.disconnect();
  }, []);

  /* Parallax on hero blobs — moves opposite to scroll */
  useEffect(() => {
    function onScroll() {
      if (!blobsRef.current || !heroRef.current) return;
      const heroHeight = heroRef.current.offsetHeight;
      const scrollY    = window.scrollY;
      if (scrollY > heroHeight) return;
      blobsRef.current.style.transform = `translateY(${scrollY * 0.28}px)`;
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Generate particles client-side only (avoid hydration mismatch) */
  useEffect(() => {
    setParticles(
      Array.from({ length: 22 }, (_, i) => ({
        id: i,
        left: `${(i * 4.5 + Math.random() * 4) % 100}%`,
        size: Math.random() * 2.5 + 1,
        duration: Math.random() * 14 + 10,
        delay: Math.random() * 10,
        opacity: Math.random() * 0.22 + 0.04,
      }))
    );
  }, []);

  function switchIndustry(i: number) { setActiveIndustry(i); setTabKey((k) => k + 1); }

  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "#080b14", color: "#e8e9ec" }}>

      {/* ── Navbar ──────────────────────────────────────── */}
      <header
        className="fixed top-4 left-1/2 z-50 w-[min(1100px,calc(100vw-32px))] -translate-x-1/2 rounded-2xl border border-white/8 px-5 py-3"
        style={{ background: "rgba(8,11,20,0.75)", backdropFilter: "blur(20px)", animation: "navSlideIn 0.6s ease both", boxShadow: "0 4px 30px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)" }}
      >
        <div className="flex items-center justify-between">
          <span className="font-heading text-sm font-semibold tracking-tight text-white">Scaleva</span>
          <nav className="hidden items-center gap-6 md:flex">
            {[["#features","Features"],["#how-it-works","How it works"],["/pricing","Pricing"]].map(([href,label]) => (
              <a key={label} href={href} className="text-sm text-white/50 transition-colors hover:text-white">{label}</a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-white/50 transition-colors hover:text-white">Log in</Link>
            <Link href="/signup" className="btn-glow inline-flex h-9 items-center rounded-lg px-4 text-sm font-medium text-white">Get started free</Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────── */}
      <section ref={heroRef} className="relative flex min-h-screen items-center overflow-hidden pt-28 pb-20">
        {/* Gradient mesh — parallax container */}
        <div ref={blobsRef} className="pointer-events-none absolute inset-0" style={{ willChange: "transform" }}>
          <div className="grid-overlay absolute inset-0" />
          <div className="absolute h-[650px] w-[650px] rounded-full opacity-25" style={{ background: "radial-gradient(circle, rgba(99,102,241,0.65) 0%, transparent 70%)", top: "-120px", left: "-120px", animation: "blob1 18s ease-in-out infinite", filter: "blur(70px)" }} />
          <div className="absolute h-[500px] w-[500px] rounded-full opacity-20" style={{ background: "radial-gradient(circle, rgba(59,130,246,0.55) 0%, transparent 70%)", top: "15%", right: "-90px", animation: "blob2 22s ease-in-out infinite", filter: "blur(65px)" }} />
          <div className="absolute h-[420px] w-[420px] rounded-full opacity-15" style={{ background: "radial-gradient(circle, rgba(167,139,250,0.55) 0%, transparent 70%)", bottom: "8%", left: "32%", animation: "blob3 26s ease-in-out infinite", filter: "blur(65px)" }} />
          <div className="absolute bottom-0 left-0 right-0 h-56" style={{ background: "linear-gradient(to bottom, transparent, #080b14)" }} />
        </div>

        {/* Grain overlay */}
        <div className="grain" />

        {/* Floating particles */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute rounded-full"
              style={{
                left: p.left,
                bottom: "-20px",
                width: p.size,
                height: p.size,
                background: "rgba(99,102,241,0.7)",
                opacity: p.opacity,
                animation: `particleDrift ${p.duration}s linear ${p.delay}s infinite`,
                willChange: "transform, opacity",
                boxShadow: `0 0 ${p.size * 2}px rgba(99,102,241,0.5)`,
              }}
            />
          ))}
        </div>

        <div className="relative mx-auto w-full max-w-[1100px] px-6">
          <div className="grid gap-16 lg:grid-cols-[58fr_42fr] lg:items-center">
            {/* Left copy */}
            <div style={{ animation: "fadeInUp 0.8s ease both" }}>
              {/* Badge */}
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400" style={{ animation: "pulseGlow 1.8s ease infinite" }} />
                <span className="text-xs font-medium text-blue-300">AI-powered customer retention</span>
              </div>

              <h1 className="font-heading text-4xl font-bold leading-[1.08] tracking-[-0.04em] text-white sm:text-5xl lg:text-[64px]">
                {"Your customers forget you exist.".split(" ").map((w, i) => <Word key={i} text={w} delay={i * 0.07} />)}
                <br />
                <span className="gradient-text">
                  {"Scaleva fixes that.".split(" ").map((w, i) => <Word key={i} text={w} delay={0.5 + i * 0.08} />)}
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/55" style={{ animation: "fadeIn 1s ease 0.9s both" }}>
                AI writes a personal SMS for every customer based on what they bought, when they came, and what they need next. No templates. No blasting. Just revenue.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4" style={{ animation: "fadeIn 1s ease 1.1s both" }}>
                <Link href="/signup" className="btn-glow inline-flex h-12 items-center rounded-xl px-7 text-sm font-semibold text-white">Start for free</Link>
                <a href="#how-it-works" className="btn-ghost inline-flex h-12 items-center rounded-xl px-7 text-sm font-semibold">See how it works</a>
              </div>

              {/* Social proof — no fabricated numbers */}
              <div className="mt-8" style={{ animation: "fadeIn 1s ease 1.3s both" }}>
                <p className="text-sm text-white/35">Built for businesses that rely on repeat customers coming back.</p>
              </div>
            </div>

            {/* Right: 3D phone */}
            <div className="hidden lg:flex lg:justify-center" style={{ animation: "fadeIn 1s ease 0.6s both" }}>
              <PhoneMockup />
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-0 left-1/2 text-white/20" style={{ animation: "bounceArrow 2s ease-in-out infinite" }}>
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
        </div>
      </section>

      {/* ── Social proof bar ──────────────────────────────── */}
      <section className="overflow-hidden border-y border-white/5 bg-white/[0.02] py-5">
        <div className="scroll-track">
          {[...PROOF_ITEMS, ...PROOF_ITEMS].map((item, i) => (
            <div key={i} className="mx-8 flex items-center gap-2.5 whitespace-nowrap">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500/50" />
              <span className="text-sm font-medium text-white/30">{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────── */}
      <section id="how-it-works" className="py-24 lg:py-32" style={{ background: "#f8f9fc" }}>
        <div className="mx-auto max-w-[1100px] px-6">
          <div className="aos mb-16 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-600">How it works</p>
            <h2 className="font-heading text-3xl font-bold tracking-[-0.03em] text-gray-900 lg:text-4xl">Three steps to more revenue</h2>
          </div>
          <div className="relative grid gap-8 lg:grid-cols-3">
            {STEPS.map((step, i) => (
              <div key={i} className="aos" style={{ transitionDelay: `${i * 0.15}s` }}>
                <BentoCard className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100 h-full">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">{step.icon}</div>
                    <span className="font-mono text-4xl font-bold text-gray-100">{step.num}</span>
                  </div>
                  <h3 className="mb-2 font-heading text-lg font-semibold text-gray-900">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-gray-500">{step.desc}</p>
                </BentoCard>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features bento ────────────────────────────────── */}
      <section id="features" className="py-24 lg:py-32" style={{ background: "#f0f2f8" }}>
        <div className="mx-auto max-w-[1100px] px-6">
          <div className="aos mb-16 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-600">Features</p>
            <h2 className="font-heading text-3xl font-bold tracking-[-0.03em] text-gray-900 lg:text-4xl">Everything you need to keep customers coming back</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Large card — AI */}
            <BentoCard className="aos lg:col-span-2 lg:row-span-2 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
              </div>
              <h3 className="mb-2 font-heading text-xl font-bold text-gray-900">AI that knows your customers</h3>
              <p className="mb-8 max-w-md text-sm leading-relaxed text-gray-500">Every message is grounded in what that customer actually bought, when they last visited, and what they care about. Claude reads the context. You get revenue.</p>
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Customer context →</div>
                <div className="mb-4 grid grid-cols-2 gap-2 font-mono text-xs">
                  {[["name","Sarah M."],["last_visit","47 days ago"],["spent","$284.00"],["category","Color client"]].map(([k,v]) => (
                    <div key={k} className="rounded-lg bg-white px-3 py-2 ring-1 ring-gray-100">
                      <span className="text-indigo-400">{k}</span><span className="text-gray-400"> → </span><span className="text-gray-700">{v}</span>
                    </div>
                  ))}
                </div>
                <div className="mb-2 flex items-center gap-2 text-xs text-gray-400">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400" />
                  AI writing message…
                </div>
                <div className="rounded-lg bg-blue-600 px-4 py-3 text-xs leading-relaxed text-white shadow-sm">
                  &ldquo;Hey Sarah! It&apos;s been a little while — we just got in a new balayage formula we think you&apos;ll love. Come by this week and mention this text for 10% off.&rdquo;
                </div>
              </div>
            </BentoCard>

            <BentoCard className="aos rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100" style={{ transitionDelay: "0.1s" }}>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>
              </div>
              <h3 className="mb-1.5 font-heading text-base font-bold text-gray-900">Works with your tools</h3>
              <p className="mb-4 text-sm text-gray-500">Import from Square, Stripe, Shopify, Toast, or any CSV.</p>
              <div className="flex flex-wrap gap-2">
                {["Square","Stripe","Shopify","Toast","CSV"].map((t) => (
                  <span key={t} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">{t}</span>
                ))}
              </div>
            </BentoCard>

            <BentoCard className="aos rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100" style={{ transitionDelay: "0.2s" }}>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
              </div>
              <h3 className="mb-1.5 font-heading text-base font-bold text-gray-900">Autopilot mode</h3>
              <p className="mb-4 text-sm text-gray-500">Set your schedule once. Scaleva handles timing, throttling, and never double-sends.</p>
              <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-2">
                <div className="h-4 w-8 rounded-full bg-blue-500" />
                <span className="text-xs text-gray-500">Sending on autopilot</span>
              </div>
            </BentoCard>

            <BentoCard className="aos rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100" style={{ transitionDelay: "0.3s" }}>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" /></svg>
              </div>
              <h3 className="mb-1.5 font-heading text-base font-bold text-gray-900">Two-way conversations</h3>
              <p className="text-sm text-gray-500">Customer replies land in your dashboard. Respond instantly, build real relationships.</p>
            </BentoCard>

            <BentoCard className="aos lg:col-span-2 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100" style={{ transitionDelay: "0.35s" }}>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
              </div>
              <h3 className="mb-1.5 font-heading text-base font-bold text-gray-900">Real analytics</h3>
              <p className="mb-4 text-sm text-gray-500">Track delivery, reply rates, and which customers came back after a message.</p>
              <div className="flex h-12 items-end gap-1.5">
                {[40,65,55,80,70,90,75,95,85,100].map((h,i) => (
                  <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: `rgba(99,102,241,${0.3+(h/100)*0.5})` }} />
                ))}
              </div>
            </BentoCard>
          </div>
        </div>
      </section>

      {/* ── Integrations ──────────────────────────────────── */}
      <section className="py-20 lg:py-28" style={{ background: "#f8f9fc" }}>
        <div className="mx-auto max-w-[1100px] px-6">
          <div className="aos mb-12 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-600">Integrations</p>
            <h2 className="font-heading text-3xl font-bold tracking-[-0.03em] text-gray-900 lg:text-4xl">Works with the tools you already use</h2>
            <p className="mt-3 text-gray-500">Connect your existing data in minutes. No manual exports needed.</p>
          </div>
          <div className="aos flex flex-wrap justify-center gap-4">
            {INTEGRATIONS.map((int) => (
              <div
                key={int.name}
                className="int-card group flex w-44 flex-col items-center gap-3 rounded-2xl border bg-white p-6 shadow-sm"
                style={{
                  borderColor: `${int.color}25`,
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 32px ${int.color}30, 0 0 0 1px ${int.color}35`; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = ""; }}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl" style={{ background: int.bg, boxShadow: `0 0 20px ${int.color}25` }}>
                  {int.icon}
                </div>
                <div className="text-center">
                  <div className="font-heading text-sm font-bold text-gray-900">{int.name}</div>
                  <div className="mt-0.5 text-xs text-gray-400">{int.desc}</div>
                </div>
                <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold" style={{ background: `${int.color}15`, color: int.color }}>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: int.color }} />
                  Connected
                </div>
              </div>
            ))}
          </div>
          <div className="aos mt-8 text-center">
            <p className="text-sm text-gray-400">Or upload any <span className="font-medium text-gray-600">CSV file</span> — we handle the rest.</p>
          </div>
        </div>
      </section>

      {/* ── Industry showcase — data flow ─────────────────── */}
      <section className="py-24 lg:py-32" style={{ background: "#f0f2f8" }}>
        <div className="mx-auto max-w-[1100px] px-6">
          <div className="aos mb-12 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-600">Built for every business</p>
            <h2 className="font-heading text-3xl font-bold tracking-[-0.03em] text-gray-900 lg:text-4xl">See exactly how it works</h2>
            <p className="mt-3 text-gray-500">Real customer data in. Personalized message out. Every time.</p>
          </div>

          {/* Tabs */}
          <div className="aos mb-10 flex flex-wrap justify-center gap-2">
            {INDUSTRIES.map((ind, i) => (
              <button
                key={i}
                onClick={() => switchIndustry(i)}
                className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${activeIndustry === i ? "bg-blue-600 text-white shadow-md" : "bg-white text-gray-500 ring-1 ring-gray-200 hover:text-gray-800"}`}
              >
                {ind.label}
              </button>
            ))}
          </div>

          {/* Data flow panel */}
          <div
            key={tabKey}
            className="grid gap-4 lg:grid-cols-[1fr_auto_1fr]"
            style={{ animation: "tabFadeIn 0.4s ease both" }}
          >
            {/* Left — customer data */}
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100">
                  <svg className="h-3.5 w-3.5 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">What Scaleva knows</span>
              </div>
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white">
                  {INDUSTRIES[activeIndustry].customerName[0]}
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">{INDUSTRIES[activeIndustry].customerName}</div>
                  <div className="text-xs text-gray-400">{INDUSTRIES[activeIndustry].label} customer</div>
                </div>
              </div>
              <div className="space-y-2">
                {INDUSTRIES[activeIndustry].data.map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-2.5">
                    <span className="text-xs font-medium text-gray-400">{label}</span>
                    <span className="text-xs font-semibold text-gray-800">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Middle — animated arrow */}
            <div className="flex flex-col items-center justify-center gap-3 py-4 lg:py-0">
              <div className="hidden flex-col items-center gap-2 lg:flex">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">AI</div>
                {[0,1,2].map((i) => (
                  <svg key={i} className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
                    style={{ animation: `flowPulse 1.2s ease-in-out ${i * 0.3}s infinite` }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                ))}
                <div className="mt-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-600">Claude</div>
              </div>
              <svg className="h-6 w-6 rotate-90 text-blue-400 lg:hidden" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </div>

            {/* Right — generated message */}
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50">
                  <svg className="h-3.5 w-3.5 text-blue-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Message Scaleva sends</span>
              </div>

              {/* Simulated phone SMS */}
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-[10px] font-bold text-white">B</div>
                  <span className="text-xs font-medium text-gray-600">Your Business → {INDUSTRIES[activeIndustry].customerName}</span>
                </div>
                <div className="rounded-2xl rounded-tl-sm p-4 text-sm leading-relaxed text-white" style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)" }}>
                  &ldquo;{INDUSTRIES[activeIndustry].message}&rdquo;
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                <svg className="h-3.5 w-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
                Written by Claude · Unique every time · Ready to send
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────── */}
      <section id="pricing" className="py-24 lg:py-32" style={{ background: "#f8f9fc" }}>
        <div className="mx-auto max-w-[1100px] px-6">
          <div className="aos mb-4 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-600">Pricing</p>
            <h2 className="font-heading text-3xl font-bold tracking-[-0.03em] text-gray-900 lg:text-4xl">Simple, transparent pricing</h2>
            <p className="mt-3 text-gray-500">Start free for 14 days. No credit card required.</p>
          </div>
          <div className="aos mb-10 flex justify-center">
            <div className="flex items-center gap-3 rounded-full bg-white px-4 py-2 shadow-sm ring-1 ring-gray-200">
              <span className={`text-sm font-medium ${!annual ? "text-gray-900" : "text-gray-400"}`}>Monthly</span>
              <button onClick={() => setAnnual(!annual)} className={`relative h-6 w-11 rounded-full transition-colors ${annual ? "bg-blue-600" : "bg-gray-200"}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${annual ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
              <span className={`text-sm font-medium ${annual ? "text-gray-900" : "text-gray-400"}`}>
                Annual <span className="ml-1 rounded-full bg-green-100 px-1.5 py-0.5 text-xs font-semibold text-green-700">-20%</span>
              </span>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {PLANS.map((plan, i) => (
              <BentoCard
                key={plan.id}
                className={`aos relative flex flex-col rounded-2xl p-7 ${plan.highlight ? "text-white shadow-xl ring-2 ring-blue-500" : "bg-white shadow-sm ring-1 ring-gray-100"}`}
                style={{ transitionDelay: `${i * 0.12}s`, ...(plan.highlight ? { background: "linear-gradient(135deg,#3b82f6,#6366f1)" } : {}) }}
              >
                {plan.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-indigo-900 px-4 py-1 text-xs font-bold text-white shadow">Most Popular</div>
                )}
                <h3 className={`font-heading text-lg font-bold ${plan.highlight ? "text-white" : "text-gray-900"}`}>{plan.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className={`font-mono text-4xl font-bold ${plan.highlight ? "text-white" : "text-gray-900"}`}>${annual ? plan.annualPrice : plan.price}</span>
                  <span className={`text-sm ${plan.highlight ? "text-blue-200" : "text-gray-400"}`}>/mo</span>
                </div>
                <p className={`mt-1 text-xs ${plan.highlight ? "text-blue-200" : "text-gray-400"}`}>{plan.limit}</p>
                <ul className="my-6 flex-1 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckIcon color={plan.highlight ? "text-blue-200" : "text-blue-500"} />
                      <span className={plan.highlight ? "text-blue-100" : "text-gray-600"}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className={`flex h-11 items-center justify-center rounded-xl text-sm font-semibold transition-all ${plan.highlight ? "bg-white text-blue-600 hover:bg-blue-50" : "bg-blue-600 text-white hover:bg-blue-700"}`}>
                  Get started free
                </Link>
              </BentoCard>
            ))}
          </div>
          <div className="aos mt-6 rounded-2xl bg-white p-7 shadow-sm ring-1 ring-gray-100 md:flex md:items-center md:justify-between">
            <div>
              <h3 className="font-heading text-lg font-bold text-gray-900">Enterprise — Pay as you go</h3>
              <p className="mt-1 text-sm text-gray-500">No hard limits. Billed based on actual usage. Dedicated account manager.</p>
              <div className="mt-3 flex gap-6 text-sm">
                <span><span className="font-bold text-gray-900">$0.02</span> <span className="text-gray-400">/ message</span></span>
                <span><span className="font-bold text-gray-900">$0.01</span> <span className="text-gray-400">/ customer/mo</span></span>
              </div>
            </div>
            <a href="mailto:hello@scaleva.com?subject=Enterprise%20Plan" className="mt-5 inline-flex h-11 items-center rounded-xl bg-gray-900 px-7 text-sm font-semibold text-white hover:bg-gray-800 transition-colors md:mt-0">Contact us</a>
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────── */}
      <section className="py-24 lg:py-32" style={{ background: "#f0f2f8" }}>
        <div className="mx-auto max-w-2xl px-6">
          <div className="aos mb-12 text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-600">FAQ</p>
            <h2 className="font-heading text-3xl font-bold tracking-[-0.03em] text-gray-900">Common questions</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="aos rounded-xl bg-white shadow-sm ring-1 ring-gray-100" style={{ transitionDelay: `${i * 0.08}s` }}>
                <button className="flex w-full items-center justify-between p-5 text-left" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  <span className="pr-4 text-sm font-semibold text-gray-900">{faq.q}</span>
                  <svg className={`h-5 w-5 flex-shrink-0 text-gray-400 transition-transform ${openFaq === i ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="border-t border-gray-100 px-5 pb-5">
                    <p className="pt-4 text-sm leading-relaxed text-gray-500">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────── */}
      <section className="relative overflow-hidden py-28" style={{ background: "#080b14" }}>
        <div className="pointer-events-none absolute inset-0">
          <div className="grain" />
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(99,102,241,0.22) 0%, transparent 70%)" }} />
          <div className="grid-overlay absolute inset-0 opacity-50" />
        </div>
        <div className="aos relative mx-auto max-w-2xl px-6 text-center">
          <h2 className="font-heading text-4xl font-bold tracking-[-0.04em] text-white lg:text-5xl">Ready to stop losing customers?</h2>
          <p className="mt-5 text-lg text-white/45">The SMS tool built for businesses that depend on loyal customers returning.</p>
          <Link href="/signup" className="btn-glow mt-10 inline-flex h-14 items-center rounded-xl px-10 text-base font-bold text-white">
            Get started free
          </Link>
          <p className="mt-4 text-xs text-white/25">No credit card required · 14-day free trial · Cancel anytime</p>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-8" style={{ background: "#080b14" }}>
        <div className="mx-auto max-w-[1100px] px-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <span className="font-heading text-sm font-semibold text-white">Scaleva</span>
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-white/30 sm:justify-end">
              <a href="#features" className="transition-colors hover:text-white">Features</a>
              <a href="#pricing" className="transition-colors hover:text-white">Pricing</a>
              <Link href="/privacy" className="transition-colors hover:text-white">Privacy Policy</Link>
              <Link href="/terms" className="transition-colors hover:text-white">Terms of Service</Link>
              <span>&copy; {currentYear} Scaleva</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
