"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FoodObjects from "./FoodObjects";

const INTER = "var(--font-inter), Inter, system-ui, sans-serif";
const MONO  = "var(--font-geist-mono), 'JetBrains Mono', ui-monospace, monospace";

interface TabData {
  id: string;
  label: string;
  rows: { label: string; value: string; blue?: boolean }[];
  sms: string;
  bizName: string;
  customerName: string;
}

const TABS: TabData[] = [
  {
    id: "restaurant",
    label: "Restaurant",
    customerName: "Maria Chen",
    bizName: "Rosario's",
    rows: [
      { label: "Last order",      value: "Truffle Pasta — $84" },
      { label: "Visit frequency", value: "Every 11 days" },
      { label: "Favorite items",  value: "Pasta, Italian reds" },
      { label: "Days since visit", value: "14 days", blue: true },
      { label: "Lifetime spend",  value: "$1,240" },
    ],
    sms: "Hey Maria! It's been 14 days — the truffle pasta is back and we got a new Barolo you'd love. Come Thu/Fri, first glass on us. — Rosario's",
  },
  {
    id: "salon",
    label: "Salon",
    customerName: "James Park",
    bizName: "Luxe Studio",
    rows: [
      { label: "Last service",    value: "Balayage — $180" },
      { label: "Frequency",       value: "Every 6 weeks" },
      { label: "Hair type",       value: "Color-treated" },
      { label: "Days since visit", value: "45 days", blue: true },
      { label: "Lifetime spend",  value: "$890" },
    ],
    sms: "Hi James! Your highlights were 6 weeks ago — time for a refresh? We have Thu/Fri openings. Book now, mention this text for a free gloss. 💇 — Luxe Studio",
  },
  {
    id: "construction",
    label: "Construction",
    customerName: "Mike Torres",
    bizName: "BuildRight",
    rows: [
      { label: "Last project",    value: "Kitchen remodel" },
      { label: "Project value",   value: "$12,400" },
      { label: "Project type",    value: "Interior" },
      { label: "Days since close", value: "62 days", blue: true },
      { label: "Total spend",     value: "$18,600" },
    ],
    sms: "Hey Mike, been a while since the kitchen remodel. Spring is perfect for deck work — want a free estimate this month? Just reply YES. — BuildRight",
  },
  {
    id: "retail",
    label: "Retail",
    customerName: "Sarah Kim",
    bizName: "Fleet Feet",
    rows: [
      { label: "Last purchase",   value: "Nike Air Max — $120" },
      { label: "Category",        value: "Athletic footwear" },
      { label: "Frequency",       value: "Monthly" },
      { label: "Days since visit", value: "21 days", blue: true },
      { label: "Lifetime spend",  value: "$640" },
    ],
    sms: "Hey Sarah! Your Air Max are 3 weeks old — the new colorway just dropped and it's exactly your style. Want first access? — Fleet Feet",
  },
  {
    id: "fitness",
    label: "Fitness",
    customerName: "David Torres",
    bizName: "Iron Club",
    rows: [
      { label: "Membership",      value: "Premium" },
      { label: "Favorite class",  value: "HIIT" },
      { label: "Longest streak",  value: "22 days" },
      { label: "Days since visit", value: "18 days", blue: true },
      { label: "Annual spend",    value: "$480" },
    ],
    sms: "David! Your 22-day streak was impressive. It's been 18 days — your body misses HIIT 😤 Come back this week, we saved your spot. — Iron Club",
  },
];

function PhoneMockup({ sms, bizName }: { sms: string; bizName: string }) {
  return (
    <div
      style={{
        width: 240,
        background: "#0a0a0a",
        border: "3px solid #333",
        borderRadius: 32,
        overflow: "hidden",
        boxShadow: "0 30px 70px rgba(0,0,0,0.6)",
        willChange: "transform",
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 4px" }}>
        <div style={{ width: 72, height: 14, background: "#000", borderRadius: 20 }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 16px 6px", fontSize: 10, color: "#888" }}>
        <span>9:41</span>
        <span>●● WiFi</span>
      </div>
      <div
        style={{
          padding: "8px 12px 10px",
          borderBottom: "1px solid #1a1a1a",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "#1a2855",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 700,
            color: "#2563eb",
            flexShrink: 0,
          }}
        >
          {bizName[0]}
        </div>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#fff" }}>{bizName}</div>
      </div>
      <div style={{ padding: "14px 12px 10px", minHeight: 180 }}>
        <div
          style={{
            alignSelf: "flex-end",
            background: "#2563eb",
            borderRadius: "14px 14px 4px 14px",
            padding: "9px 11px",
            fontSize: 10.5,
            lineHeight: 1.55,
            color: "#fff",
          }}
        >
          {sms}
        </div>
      </div>
      <div
        style={{
          padding: "6px 12px 14px",
          borderTop: "1px solid #1a1a1a",
          display: "flex",
          gap: 8,
          alignItems: "center",
        }}
      >
        <div
          style={{
            flex: 1,
            height: 26,
            background: "#1c1c1e",
            borderRadius: 13,
            padding: "0 10px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 9, color: "#666" }}>iMessage</span>
        </div>
      </div>
    </div>
  );
}

export default function VerticalShowcase() {
  const [active, setActive] = useState(0);
  const tab = TABS[active];

  return (
    <section
      style={{
        background: "#0c0c0c",
        padding: "120px 24px",
        fontFamily: INTER,
        borderTop: "1px solid #1a1a1a",
      }}
    >
      <div style={{ maxWidth: 1140, margin: "0 auto" }}>
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, amount: 0.3 }}
          style={{ marginBottom: 48, textAlign: "center" }}
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
            Personalization
          </p>
          <h2
            style={{
              fontSize: "clamp(26px,3.5vw,44px)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "#fff",
              lineHeight: 1.15,
            }}
          >
            One thousand customers.
            <br />
            One thousand different messages.
          </h2>
          <p style={{ marginTop: 14, fontSize: 16, color: "#888" }}>
            No templates. Every message written from scratch.
          </p>
        </motion.div>

        {/* Tab bar */}
        <div
          style={{
            display: "flex",
            gap: 0,
            background: "#161616",
            border: "1px solid #222",
            borderRadius: 8,
            padding: 4,
            marginBottom: 36,
            width: "fit-content",
          }}
        >
          {TABS.map((t, i) => (
            <button
              key={t.id}
              onClick={() => setActive(i)}
              style={{
                padding: "9px 18px",
                fontSize: 14,
                fontWeight: active === i ? 600 : 400,
                color: active === i ? "#fff" : "#555",
                background: active === i ? "#222" : "transparent",
                border: "none",
                borderRadius: 6,
                borderBottom: active === i ? "2px solid #2563eb" : "2px solid transparent",
                cursor: "pointer",
                transition: "all 0.15s",
                fontFamily: INTER,
                whiteSpace: "nowrap",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 40,
              alignItems: "start",
            }}
          >
            {/* Left — data card */}
            <div style={{ position: "relative" }}>
              {/* Food objects (restaurant only) */}
              <FoodObjects active={tab.id === "restaurant"} />

              <div
                style={{
                  background: "#161616",
                  border: "1px solid #222",
                  borderRadius: 12,
                  padding: 28,
                  position: "relative",
                  zIndex: 1,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "#888",
                    marginBottom: 16,
                  }}
                >
                  What Scaleva knows
                </div>
                {/* Customer header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 18,
                    paddingBottom: 16,
                    borderBottom: "1px solid #222",
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: "#2563eb",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: 14,
                      color: "#fff",
                      flexShrink: 0,
                    }}
                  >
                    {tab.customerName[0]}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "#fff" }}>
                      {tab.customerName}
                    </div>
                    <div style={{ fontSize: 12, color: "#888" }}>{tab.label} customer</div>
                  </div>
                </div>
                {/* Rows */}
                {tab.rows.map((row) => (
                  <div
                    key={row.label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "9px 0",
                      borderBottom: "1px solid #1a1a1a",
                    }}
                  >
                    <span style={{ fontSize: 13, color: "#888" }}>{row.label}</span>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: row.blue ? 700 : 500,
                        color: row.blue ? "#2563eb" : "#ccc",
                        fontFamily: MONO,
                        textAlign: "right",
                        flex: 1,
                        marginLeft: 12,
                      }}
                    >
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — phone */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
              }}
            >
              <PhoneMockup sms={tab.sms} bizName={tab.bizName} />
              <p style={{ fontSize: 13, color: "#666", fontStyle: "italic" }}>
                Written for {tab.customerName} specifically.
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
