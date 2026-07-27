import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark "PRISM AI" theme
        canvas: "#08080b", // page background
        panel: "#101014", // card background
        panel2: "#15151b", // nested surface (inputs, day-header strips)
        hairline: "rgba(255,255,255,0.08)", // borders
        ink: "#f2f2f5", // primary text (on dark)
        muted: "#8b8b96", // secondary text
        cyan: "#22d3ee",
        violet: "#a855f7",
        magenta: "#ec4899",
        lime: "#d7ff3d",
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
