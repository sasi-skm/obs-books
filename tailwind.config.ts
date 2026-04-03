import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#f5f0e6",
        parchment: "#eee8d8",
        offwhite: "#FFFCF7",
        ink: { DEFAULT: "#2c2416", light: "#6b5e48", muted: "#8a7d65" },
        sage: { DEFAULT: "#6B7F5E", light: "#8BA37A", muted: "rgba(107,127,94,0.13)" },
        moss: "#4a6741",
        rose: "#B4636E",
        bark: "#6b5e48",
        sand: "#d6cdb8",
        line: "#d6cdb8",
      },
      fontFamily: {
        heading: ["var(--font-cormorant)", "serif"],
        cormorant: ["var(--font-cormorant)", "serif"],
        body: ["var(--font-jost)", "var(--font-noto-thai)", "sans-serif"],
        jost: ["var(--font-jost)", "sans-serif"],
        thai: ["var(--font-noto-thai)", "sans-serif"],
      },
      boxShadow: {
        soft: "0 6px 30px rgba(44,36,24,0.07)",
        card: "0 5px 18px rgba(44,36,24,0.07)",
        hover: "0 6px 22px rgba(44,36,24,0.1)",
      },
    },
  },
  plugins: [],
};
export default config;
