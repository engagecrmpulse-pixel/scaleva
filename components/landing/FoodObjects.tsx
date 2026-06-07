"use client";

import { motion, AnimatePresence } from "framer-motion";

interface FoodObjectsProps {
  active: boolean;
}

export default function FoodObjects({ active }: FoodObjectsProps) {
  return (
    <AnimatePresence>
      {active && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 90,
            pointerEvents: "none",
            zIndex: 0,
          }}
        >
          {/* Pasta bowl — flies in from left */}
          <motion.div
            initial={{ x: -120, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -120, opacity: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 20 }}
            style={{
              position: "absolute",
              left: 24,
              top: 16,
              animation: "foodFloat 3.2s ease-in-out infinite",
            }}
          >
            {/* Bowl shape */}
            <div
              style={{
                width: 58,
                height: 34,
                background: "linear-gradient(180deg, #3a2a1a 0%, #2a1a0a 100%)",
                borderRadius: "0 0 30px 30px",
                border: "2px solid #4a3a2a",
                position: "relative",
                boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
              }}
            >
              {/* Pasta squiggles */}
              <div style={{ position: "absolute", inset: 6, display: "flex", flexDirection: "column", gap: 3 }}>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      height: 3,
                      borderRadius: 4,
                      background: "#c8a070",
                      opacity: 0.85,
                      marginLeft: i % 2 === 0 ? 0 : 4,
                      marginRight: i % 2 === 0 ? 4 : 0,
                    }}
                  />
                ))}
              </div>
              {/* Bowl rim */}
              <div
                style={{
                  position: "absolute",
                  top: -8,
                  left: -6,
                  right: -6,
                  height: 12,
                  background: "#3a2a1a",
                  borderRadius: 8,
                  border: "1.5px solid #4a3a2a",
                }}
              />
            </div>
            <div style={{ fontSize: 9, color: "#555", textAlign: "center", marginTop: 4 }}>Truffle Pasta</div>
          </motion.div>

          {/* Wine glass — flies in from right */}
          <motion.div
            initial={{ x: 120, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 120, opacity: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 20, delay: 0.08 }}
            style={{
              position: "absolute",
              right: 24,
              top: 8,
              animation: "foodFloat 4s ease-in-out 0.5s infinite",
            }}
          >
            {/* Wine glass */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
              {/* Bowl */}
              <div
                style={{
                  width: 28,
                  height: 36,
                  background: "linear-gradient(180deg, rgba(140,20,30,0.7) 0%, rgba(100,10,20,0.85) 100%)",
                  clipPath: "polygon(10% 0%, 90% 0%, 100% 80%, 80% 100%, 20% 100%, 0% 80%)",
                  border: "1.5px solid rgba(180,60,60,0.4)",
                }}
              />
              {/* Stem */}
              <div style={{ width: 2.5, height: 18, background: "rgba(160,160,160,0.4)" }} />
              {/* Base */}
              <div style={{ width: 22, height: 4, background: "rgba(140,140,140,0.3)", borderRadius: 2 }} />
            </div>
            <div style={{ fontSize: 9, color: "#555", textAlign: "center", marginTop: 2 }}>Barolo</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
