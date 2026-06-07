"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import HeroScene          from "@/components/landing/HeroScene";
import CustomerUniverse   from "@/components/landing/CustomerUniverse";
import DataToMessage      from "@/components/landing/DataToMessage";
import VerticalShowcase   from "@/components/landing/VerticalShowcase";
import IntegrationSection from "@/components/landing/IntegrationSection";
import AutopilotSection   from "@/components/landing/AutopilotSection";
import PricingSection     from "@/components/landing/PricingSection";
import FinalCTA           from "@/components/landing/FinalCTA";

const INTER = "var(--font-inter), Inter, system-ui, sans-serif";

export default function LandingPage() {
  const yr = new Date().getFullYear();

  return (
    <div
      style={{
        background: "#0c0c0c",
        color: "#fff",
        fontFamily: INTER,
        overflowX: "hidden",
      }}
    >
      {/* ── Navbar ─────────────────────────────────── */}
      <motion.header
        initial={{ y: -72, opacity: 0 }}
        animate={{ y: 0,   opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: 64,
          background: "rgba(12,12,12,0.80)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid #222",
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          padding: "0 28px",
          willChange: "transform",
        }}
      >
        <div
          style={{
            maxWidth: 1140,
            margin: "0 auto",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link
            href="/"
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "#fff",
              textDecoration: "none",
              letterSpacing: "-0.01em",
              fontFamily: INTER,
            }}
          >
            Scaleva
          </Link>
          <nav
            className="hidden md:flex"
            style={{ display: "flex", gap: 32, alignItems: "center" }}
          >
            {[["#how-it-works","How it works"],["#pricing","Pricing"]].map(([href, label]) => (
              <a
                key={label}
                href={href}
                style={{
                  fontSize: 15,
                  color: "#888",
                  textDecoration: "none",
                  fontFamily: INTER,
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#fff")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#888")}
              >
                {label}
              </a>
            ))}
          </nav>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href="/login" style={{ fontSize: 14, color: "#888", textDecoration: "none", fontFamily: INTER }}>
              Log in
            </Link>
            <Link
              href="/signup"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                height: 36,
                padding: "0 18px",
                background: "#fff",
                color: "#0c0c0c",
                fontFamily: INTER,
                fontSize: 14,
                fontWeight: 600,
                borderRadius: 6,
                textDecoration: "none",
              }}
            >
              Get started
            </Link>
          </div>
        </div>
      </motion.header>

      {/* Spacer for fixed navbar */}
      <div style={{ height: 64 }} />

      {/* Scene 1 — Three.js city */}
      <div id="how-it-works">
        <HeroScene />
      </div>

      {/* Scene 2 — Customer universe */}
      <CustomerUniverse />

      {/* Scene 3 — Data to message */}
      <DataToMessage />

      {/* Scene 4 — Vertical showcase */}
      <VerticalShowcase />

      {/* Scene 5A — Integrations */}
      <IntegrationSection />

      {/* Scene 5B — Autopilot */}
      <AutopilotSection />

      {/* Scene 6 — Pricing */}
      <div id="pricing">
        <PricingSection />
      </div>

      {/* Final CTA */}
      <FinalCTA />

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid #1a1a1a",
          padding: "32px 28px",
          background: "#0c0c0c",
          fontFamily: INTER,
        }}
      >
        <div
          style={{
            maxWidth: 1140,
            margin: "0 auto",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>Scaleva</div>
            <div style={{ fontSize: 12, color: "#444", marginTop: 4 }}>
              AI-powered customer retention
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "center" }}>
            {[["/privacy","Privacy Policy"],["/terms","Terms of Service"]].map(([href, label]) => (
              <Link key={label} href={href} style={{ fontSize: 13, color: "#444", textDecoration: "none" }}>
                {label}
              </Link>
            ))}
            <span style={{ fontSize: 13, color: "#2a2a2a" }}>
              © {yr} Scaleva. All rights reserved.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
