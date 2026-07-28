import type { Config } from "tailwindcss";
// Relative import (not the "@/" alias) — Tailwind's own config loader doesn't
// necessarily resolve tsconfig path aliases, but it does resolve plain relative paths.
import { PALETTE } from "./src/lib/theme";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark "PRISM AI" theme — canonical values live in src/lib/theme.ts
        canvas: PALETTE.canvas,
        panel: PALETTE.panel,
        panel2: PALETTE.panel2,
        hairline: PALETTE.hairline,
        ink: PALETTE.ink,
        muted: PALETTE.muted,
        cyan: PALETTE.cyan,
        violet: PALETTE.violet,
        magenta: PALETTE.magenta,
        lime: PALETTE.lime,
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        display: ["var(--font-space-grotesk)", "sans-serif"],
        mono: ["var(--font-ibm-plex-mono)", "monospace"],
      },
      borderRadius: {
        panel: "16px",
      },
    },
  },
  plugins: [],
};

export default config;
