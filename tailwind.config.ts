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
        base: "#080B14",
        surface: "#0F1420",
        line: "#1E2433",
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
