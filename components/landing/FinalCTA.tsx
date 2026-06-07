"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const INTER = "var(--font-inter), Inter, system-ui, sans-serif";

export default function FinalCTA() {
  return (
    <section
      style={{
        background: "#0c0c0c",
        borderTop: "1px solid #222",
        padding: "140px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        fontFamily: INTER,
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        viewport={{ once: true, amount: 0.4 }}
        style={{ maxWidth: 680, textAlign: "center" }}
      >
        <h2
          style={{
            fontSize: "clamp(36px, 5vw, 60px)",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            color: "#fff",
            margin: 0,
          }}
        >
          Stop losing customers
          <br />
          to silence.
        </h2>
        <p
          style={{
            marginTop: 24,
            fontSize: 18,
            color: "#888",
            lineHeight: 1.7,
            maxWidth: 540,
            margin: "24px auto 0",
          }}
        >
          Most businesses lose repeat customers simply because they never
          followed up. Scaleva fixes that automatically.
        </p>
        <div style={{ marginTop: 44 }}>
          <Link
            href="/signup"
            className="btn-primary-land"
            style={{ height: 52, padding: "0 40px", fontSize: 16, fontFamily: INTER }}
          >
            Get started free
          </Link>
        </div>
        <p style={{ marginTop: 16, fontSize: 13, color: "#666" }}>
          No credit card required · Cancel anytime
        </p>
      </motion.div>
    </section>
  );
}
