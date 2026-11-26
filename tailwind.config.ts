import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        ink: "var(--ink)",
        "ink-2": "var(--ink-2)",
        "ink-3": "var(--ink-3)",
        divider: "var(--divider)",
        line: "var(--line)",
        brand: "var(--brand)",
        "on-brand": "var(--on-brand)",
        "brand-soft": "var(--brand-soft)",
        "brand-ink": "var(--brand-ink)",
        focus: "var(--focus)",
        danger: "var(--danger)",
        warn: "var(--warn)",
        save: "var(--save)",
        typical: "var(--typical)",
        plan: "var(--plan)",
      },
      borderRadius: {
        sm: "var(--r-sm)",
        md: "var(--r-md)",
        lg: "var(--r-lg)",
        pill: "var(--r-pill)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        num: ["var(--font-num)"],
      },
    },
  },
  plugins: [],
};

export default config;
