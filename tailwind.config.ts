import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#2C3627",
        inkDark: "#1F281B",
        paper: "#F7F6F3",
        muted: "#72706A",
      },
    },
  },
  plugins: [],
};

export default config;
