"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const INTER = "var(--font-inter), Inter, system-ui, sans-serif";
const MONO  = "var(--font-geist-mono), 'JetBrains Mono', ui-monospace, monospace";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    monthly: 199,
    annual: 159,
    limit: "500 customers · 2,000 msg/mo",
    features: ["CSV & manual import", "AI message generation", "Basic analytics", "Email support"],
    highlight: false,
  },
  {
    id: "growth",
    name: "Growth",
    monthly: 399,
    annual: 319,
    limit: "1,500 customers · 6,000 msg/mo",
    features: ["All integrations", "Full analytics", "Autopilot scheduling", "Two-way SMS", "Priority support"],
    highlight: true,
  },
  {
    id: "pro",
    name: "Pro",
    monthly: 699,
    annual: 559,
    limit: "5,000 customers · 25,000 msg/mo",
    features: ["Everything in Growth", "Revenue tracking", "Data export", "Dedicated support"],
    highlight: false,
  },
];

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth={2.5} style={{ flexShrink: 0, marginTop: 2 }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

export default function PricingSection() {
  const [annual, setAnnual] = useState(false);

  return (
    <section
      id="pricing"
      style={{
        background: "#f8f8f8",
        padding: "120px 24px",
        fontFamily: INTER,
      }}
    >
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, amount: 0.3 }}
          style={{ textAlign: "center", marginBottom: 48 }}
        >
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#2563eb",
              marginBottom: 14,
            }}
          >
            Pricing
          </p>
          <h2
            style={{
              fontSize: "clamp(28px,4vw,48px)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "#111",
            }}
          >
            Simple pricing. Serious results.
          </h2>
          <p style={{ marginTop: 14, fontSize: 17, color: "#666" }}>
            Start free for 14 days. No credit card required.
          </p>
        </motion.div>

        {/* Toggle */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          viewport={{ once: true }}
          style={{ display: "flex", justifyContent: "center", marginBottom: 52 }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              background: "#eee",
              borderRadius: 40,
              padding: "8px 18px",
            }}
          >
            <span
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: annual ? "#999" : "#111",
                transition: "color 0.2s",
              }}
            >
              Monthly
            </span>
            <button
              onClick={() => setAnnual(!annual)}
              style={{
                position: "relative",
                width: 44,
                height: 24,
                background: annual ? "#2563eb" : "#bbb",
                borderRadius: 12,
                border: "none",
                cursor: "pointer",
                transition: "background 0.25s",
                willChange: "transform",
              }}
            >
              <motion.span
                layout
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                style={{
                  position: "absolute",
                  top: 2,
                  left: annual ? 22 : 2,
                  width: 20,
                  height: 20,
                  background: "#fff",
                  borderRadius: "50%",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
                  willChange: "transform",
                }}
              />
            </button>
            <span
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: annual ? "#111" : "#999",
                transition: "color 0.2s",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              Annual
              <span
                style={{
                  background: "#dcfce7",
                  color: "#16a34a",
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "2px 7px",
                  borderRadius: 20,
                }}
              >
                −20%
              </span>
            </span>
          </div>
        </motion.div>

        {/* Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 20,
            marginBottom: 24,
            alignItems: "stretch",
          }}
        >
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true, amount: 0.2 }}
              style={{
                position: "relative",
                background: "#fff",
                border: plan.highlight ? "2px solid #2563eb" : "1px solid #e5e5e5",
                borderRadius: 12,
                padding: 28,
                display: "flex",
                flexDirection: "column",
                willChange: "transform",
              }}
            >
              {plan.highlight && (
                <div
                  style={{
                    position: "absolute",
                    top: -13,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "#2563eb",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "4px 14px",
                    borderRadius: 20,
                    whiteSpace: "nowrap",
                  }}
                >
                  Most Popular
                </div>
              )}
              <div
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  color: "#111",
                  marginBottom: 12,
                }}
              >
                {plan.name}
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={annual ? "a" : "m"}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.2 }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 4,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 48,
                        fontWeight: 700,
                        color: "#111",
                        fontFamily: MONO,
                        lineHeight: 1,
                      }}
                    >
                      ${annual ? plan.annual : plan.monthly}
                    </span>
                    <span style={{ fontSize: 14, color: "#888" }}>/mo</span>
                  </div>
                </motion.div>
              </AnimatePresence>
              <div
                style={{ fontSize: 12, color: "#999", marginBottom: 24, marginTop: 4 }}
              >
                {plan.limit}
              </div>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: "0 0 28px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  flex: 1,
                }}
              >
                {plan.features.map((f) => (
                  <li
                    key={f}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                      fontSize: 14,
                      color: "#555",
                      lineHeight: 1.5,
                    }}
                  >
                    <CheckIcon />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 44,
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: "none",
                  background: plan.highlight ? "#2563eb" : "#111",
                  color: "#fff",
                  transition: "opacity 0.15s, filter 0.15s",
                  fontFamily: INTER,
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.filter = "brightness(1.15)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.filter = ""; }}
              >
                Start with {plan.name}
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Enterprise */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          viewport={{ once: true, amount: 0.2 }}
          style={{
            background: "#fff",
            border: "1px solid #e5e5e5",
            borderRadius: 12,
            padding: "24px 28px",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 20,
          }}
        >
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: "#111" }}>
              Enterprise — Custom pricing
            </div>
            <p style={{ fontSize: 14, color: "#888", marginTop: 4 }}>
              Unlimited customers & messages, custom AI training, SLA guarantee,
              white-label option
            </p>
          </div>
          <a
            href="mailto:engagecrmpulse@gmail.com?subject=Enterprise"
            style={{
              display: "inline-flex",
              alignItems: "center",
              height: 44,
              padding: "0 24px",
              background: "#111",
              color: "#fff",
              fontFamily: INTER,
              fontSize: 14,
              fontWeight: 600,
              borderRadius: 6,
              textDecoration: "none",
            }}
          >
            Contact us
          </a>
        </motion.div>
      </div>
    </section>
  );
}
