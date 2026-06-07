"use client";

import { motion } from "framer-motion";

const INTER = "var(--font-inter), Inter, system-ui, sans-serif";

const INTEGRATIONS = [
  { name: "Square",  color: "#34D399", desc: "Payments & customers" },
  { name: "Stripe",  color: "#8B5CF6", desc: "Subscriptions" },
  { name: "Shopify", color: "#22C55E", desc: "eCommerce orders" },
  { name: "Toast",   color: "#F97316", desc: "Restaurant POS" },
  { name: "HubSpot", color: "#FB923C", desc: "CRM contacts" },
];

export default function IntegrationSection() {
  return (
    <section
      style={{
        background: "#0c0c0c",
        padding: "100px 24px",
        fontFamily: INTER,
        borderTop: "1px solid #1a1a1a",
      }}
    >
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, amount: 0.3 }}
          style={{ marginBottom: 48 }}
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
            Integrations
          </p>
          <h2
            style={{
              fontSize: "clamp(28px,4vw,44px)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "#fff",
            }}
          >
            Works with the tools you already use.
          </h2>
        </motion.div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
            marginBottom: 32,
          }}
        >
          {INTEGRATIONS.map((int, i) => (
            <motion.div
              key={int.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -4 }}
              transition={{
                default: { duration: 0.5, delay: i * 0.07 },
                y: { type: "spring", stiffness: 300, damping: 20 },
              }}
              viewport={{ once: true, amount: 0.4 }}
              style={{
                width: 180,
                height: 72,
                background: "#161616",
                border: `1px solid #222`,
                borderLeft: `3px solid ${int.color}`,
                borderRadius: 8,
                padding: "0 18px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                cursor: "default",
                willChange: "transform",
                transition: "box-shadow 0.2s",
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>
                {int.name}
              </div>
              <div style={{ fontSize: 12, color: "#555", marginTop: 3 }}>
                {int.desc}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: int.color,
                  fontWeight: 600,
                  marginTop: 3,
                }}
              >
                ● Connect
              </div>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true }}
          style={{ fontSize: 14, color: "#444" }}
        >
          Or upload any{" "}
          <span style={{ color: "#888", fontWeight: 500 }}>CSV file</span>.
          2 minutes to import.
        </motion.p>
      </div>
    </section>
  );
}
