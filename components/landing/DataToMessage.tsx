"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

const INTER = "var(--font-inter), Inter, system-ui, sans-serif";
const MONO  = "var(--font-geist-mono), 'JetBrains Mono', ui-monospace, monospace";

const DATA_ROWS = [
  { label: "Last order",           value: "Truffle Pasta, Pinot Noir", highlight: false },
  { label: "Order total",          value: "$84.00",                    highlight: false },
  { label: "Visit frequency",      value: "Every 11 days",             highlight: false },
  { label: "Days since last visit", value: "14 days — overdue",         highlight: true  },
  { label: "Favorite items",       value: "Pasta, Italian reds",       highlight: false },
  { label: "Lifetime spend",       value: "$1,240",                    highlight: false },
];

const SMS_TEXT =
  "Hey Maria! It's been 14 days — longer than usual for you 😊 The truffle pasta is back on the menu this week, and we just got a new Barolo you'd love. Come in Thu or Fri and your first glass is on us. — Rosario's";

export default function DataToMessage() {
  const sectionRef  = useRef<HTMLElement>(null);
  const isInView    = useInView(sectionRef, { once: true, amount: 0.25 });
  const [typed, setTyped] = useState("");
  const [showTyping, setShowTyping] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const charRef  = useRef(0);

  useEffect(() => {
    if (!isInView) return;
    const t1 = setTimeout(() => setShowTyping(true), 600);
    const t2 = setTimeout(() => {
      setShowTyping(false);
      timerRef.current = setInterval(() => {
        charRef.current += 1;
        setTyped(SMS_TEXT.slice(0, charRef.current));
        if (charRef.current >= SMS_TEXT.length && timerRef.current) {
          clearInterval(timerRef.current);
        }
      }, 22);
    }, 2000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isInView]);

  const listVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.08 } },
  };
  const rowVariants = {
    hidden:  { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.45 } },
  };

  return (
    <section
      ref={sectionRef}
      style={{
        background: "#f8f8f8",
        padding: "120px 24px",
        fontFamily: INTER,
      }}
    >
      <div style={{ maxWidth: 1140, margin: "0 auto" }}>
        {/* Section heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, amount: 0.3 }}
          style={{ marginBottom: 56, textAlign: "center" }}
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
            Intelligence
          </p>
          <h2
            style={{
              fontSize: "clamp(28px,4vw,48px)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "#111",
              lineHeight: 1.1,
            }}
          >
            Not just their name. Everything.
          </h2>
          <p
            style={{
              marginTop: 16,
              fontSize: 17,
              color: "#666",
              maxWidth: 560,
              margin: "16px auto 0",
              lineHeight: 1.6,
            }}
          >
            Scaleva pulls real purchase data and builds a complete picture of
            every customer before writing a single word.
          </p>
        </motion.div>

        {/* Two columns */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 48,
            alignItems: "start",
          }}
          className="grid-cols-1 md:grid-cols-2"
        >
          {/* Left — data card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            style={{
              background: "#161616",
              border: "1px solid #222",
              borderRadius: 12,
              padding: 28,
              willChange: "transform",
            }}
          >
            {/* Customer header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                marginBottom: 20,
                paddingBottom: 20,
                borderBottom: "1px solid #222",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "#2563eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: 15,
                  color: "#fff",
                  flexShrink: 0,
                }}
              >
                M
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>
                  Maria Chen
                </div>
                <div style={{ fontSize: 12, color: "#555" }}>
                  Restaurant customer · 3 years
                </div>
              </div>
              <div
                style={{
                  marginLeft: "auto",
                  fontSize: 11,
                  color: "#f59e0b",
                  fontWeight: 600,
                  background: "rgba(245,158,11,0.1)",
                  padding: "3px 9px",
                  borderRadius: 5,
                  flexShrink: 0,
                }}
              >
                ⚠ Overdue
              </div>
            </div>
            {/* Rows */}
            <motion.ul
              variants={listVariants}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              style={{ listStyle: "none", padding: 0, margin: 0 }}
            >
              {DATA_ROWS.map((row) => (
                <motion.li
                  key={row.label}
                  variants={rowVariants}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "10px 0",
                    borderBottom: "1px solid #1a1a1a",
                    fontFamily: MONO,
                  }}
                >
                  <span style={{ fontSize: 13, color: "#555" }}>{row.label}</span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: row.highlight ? 700 : 500,
                      color: row.highlight ? "#2563eb" : "#ccc",
                      textAlign: "right",
                      flex: 1,
                      marginLeft: 12,
                    }}
                  >
                    {row.value}
                  </span>
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>

          {/* Right — iPhone */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
              style={{
                width: 260,
                background: "#0a0a0a",
                border: "3px solid #333",
                borderRadius: 36,
                overflow: "hidden",
                boxShadow:
                  "0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
                willChange: "transform",
              }}
            >
              {/* Notch */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  padding: "10px 0 4px",
                  background: "#0a0a0a",
                }}
              >
                <div
                  style={{
                    width: 80,
                    height: 16,
                    background: "#000",
                    borderRadius: 20,
                  }}
                />
              </div>
              {/* Status bar */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "2px 18px 6px",
                  fontSize: 10,
                  color: "#999",
                }}
              >
                <span>9:41</span>
                <span>●● WiFi ▮</span>
              </div>
              {/* Contact header */}
              <div
                style={{
                  padding: "8px 14px 10px",
                  borderBottom: "1px solid #1a1a1a",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    background: "#1a2855",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#2563eb",
                    flexShrink: 0,
                  }}
                >
                  R
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#fff" }}>
                    Rosario&apos;s
                  </div>
                  <div style={{ fontSize: 9, color: "#444" }}>Text Message</div>
                </div>
              </div>
              {/* Messages */}
              <div
                style={{
                  minHeight: 220,
                  padding: "14px 12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {/* Inbound bubble */}
                <div
                  style={{
                    alignSelf: "flex-start",
                    maxWidth: "78%",
                    background: "#2c2c2e",
                    borderRadius: "16px 16px 16px 4px",
                    padding: "9px 12px",
                    fontSize: 11,
                    lineHeight: 1.5,
                    color: "#ddd",
                  }}
                >
                  Hey! Just checking in 👋
                </div>
                {/* Typing indicator */}
                {showTyping && (
                  <div
                    style={{
                      alignSelf: "flex-end",
                      background: "#2563eb",
                      borderRadius: "16px 16px 4px 16px",
                      padding: "9px 16px",
                      display: "flex",
                      gap: 4,
                      alignItems: "center",
                    }}
                  >
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: "50%",
                          background: "rgba(255,255,255,0.8)",
                          animation: `dotPulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                        }}
                      />
                    ))}
                  </div>
                )}
                {/* Typed message */}
                {typed.length > 0 && (
                  <div
                    style={{
                      alignSelf: "flex-end",
                      maxWidth: "84%",
                      background: "#2563eb",
                      borderRadius: "16px 16px 4px 16px",
                      padding: "9px 12px",
                      fontSize: 11,
                      lineHeight: 1.55,
                      color: "#fff",
                    }}
                  >
                    {typed}
                    {typed.length < SMS_TEXT.length && (
                      <span style={{ opacity: 0.7 }}>|</span>
                    )}
                  </div>
                )}
              </div>
              {/* Input bar */}
              <div
                style={{
                  padding: "8px 12px 16px",
                  borderTop: "1px solid #1a1a1a",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    flex: 1,
                    height: 28,
                    background: "#1c1c1e",
                    borderRadius: 14,
                    padding: "0 12px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: 10, color: "#444" }}>iMessage</span>
                </div>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: "#2563eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="#fff">
                    <path d="M12 4L20 20H12L4 20L12 4Z" />
                  </svg>
                </div>
              </div>
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.8 }}
              style={{
                marginTop: 16,
                fontSize: 13,
                color: "#888",
                fontStyle: "italic",
                textAlign: "center",
              }}
            >
              Written by AI. Reads like you wrote it.
            </motion.p>
          </div>
        </div>
      </div>
    </section>
  );
}
