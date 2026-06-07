"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const INTER = "var(--font-inter), Inter, system-ui, sans-serif";
const MONO = "var(--font-geist-mono), 'JetBrains Mono', ui-monospace, monospace";

export default function AutopilotSection() {
  const [on, setOn] = useState(true);

  return (
    <section
      style={{
        background: "#0c0c0c",
        padding: "100px 24px",
        fontFamily: INTER,
      }}
    >
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, amount: 0.3 }}
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
            Automation
          </p>
          <h2
            style={{
              fontSize: "clamp(28px,4vw,44px)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "#fff",
              marginBottom: 60,
            }}
          >
            Set it once. Revenue on autopilot.
          </h2>
        </motion.div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 48,
            alignItems: "center",
          }}
          className="grid-cols-1 md:grid-cols-2"
        >
          {/* Schedule card */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, amount: 0.3 }}
            style={{
              background: "#161616",
              border: "1px solid #222",
              borderRadius: 12,
              padding: 28,
              willChange: "transform",
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#555",
                marginBottom: 20,
              }}
            >
              Autopilot Schedule
            </div>
            {[
              ["Send day", "Monday"],
              ["Send time", "9:00 AM"],
              ["Cadence", "Weekly"],
              ["Target", "Overdue customers"],
            ].map(([label, val]) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "11px 0",
                  borderBottom: "1px solid #1a1a1a",
                }}
              >
                <span style={{ fontSize: 14, color: "#555" }}>{label}</span>
                <span
                  style={{
                    fontSize: 14,
                    color: "#fff",
                    fontWeight: 500,
                    fontFamily: MONO,
                  }}
                >
                  {val}
                </span>
              </div>
            ))}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: 20,
                paddingTop: 16,
              }}
            >
              <div>
                <span style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>
                  Autopilot
                </span>
                <div
                  style={{
                    fontSize: 12,
                    color: "#2563eb",
                    marginTop: 2,
                  }}
                >
                  Next send in 2 days
                </div>
              </div>
              <button
                onClick={() => setOn(!on)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                <div
                  style={{
                    position: "relative",
                    width: 44,
                    height: 24,
                    background: on ? "#2563eb" : "#333",
                    borderRadius: 12,
                    transition: "background 0.2s",
                    willChange: "transform",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      top: 2,
                      left: on ? "calc(100% - 22px)" : 2,
                      width: 20,
                      height: 20,
                      background: "#fff",
                      borderRadius: "50%",
                      transition: "left 0.2s",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: on ? "#2563eb" : "#555",
                    minWidth: 24,
                  }}
                >
                  {on ? "ON" : "OFF"}
                </span>
              </button>
            </div>
          </motion.div>

          {/* Stat */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            viewport={{ once: true, amount: 0.3 }}
            style={{ willChange: "transform" }}
          >
            <div
              style={{
                fontSize: "clamp(56px, 8vw, 80px)",
                fontWeight: 700,
                letterSpacing: "-0.04em",
                color: "#fff",
                lineHeight: 1,
                fontFamily: MONO,
              }}
            >
              2,400
            </div>
            <div
              style={{ fontSize: 18, color: "#888", marginTop: 8, lineHeight: 1.5 }}
            >
              messages sent per month by the average Scaleva business.
            </div>
            <div
              style={{
                marginTop: 20,
                fontSize: 15,
                fontWeight: 600,
                color: "#2563eb",
              }}
            >
              Zero sent manually.
            </div>
            <p
              style={{
                marginTop: 16,
                fontSize: 15,
                color: "#555",
                lineHeight: 1.6,
                maxWidth: 380,
              }}
            >
              You run your business. Scaleva handles every follow-up — written
              personally, sent at the right time.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
