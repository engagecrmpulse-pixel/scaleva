import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        heading: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        base: "#0F1117",
        surface: "#1A1D24",
        line: "#2A2D35",
        content: {
          DEFAULT: "#E8E9EC",
          muted: "#6B7180",
        },
        accent: {
          DEFAULT: "#3B82F6",
          hover: "#2563EB",
        },
        danger: "#EF4444",
      },
      borderRadius: {
        btn: "6px",
        card: "8px",
      },
    },
  },
  plugins: [],
};

export default config;
