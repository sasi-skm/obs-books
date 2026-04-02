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
        cream: "#FAF6F0",
        parchment: "#F0EAE0",
        offwhite: "#FFFCF7",
        ink: { DEFAULT: "#2C2418", light: "#5C5243", muted: "#8A7E6F" },
        sage: { DEFAULT: "#6B7F5E", light: "#8BA37A", muted: "rgba(107,127,94,0.13)" },
        rose: "#B4636E",
        bark: "#7A6048",
        line: "#E8E2D8",
      },
      fontFamily: {
        heading: ["var(--font-cormorant)", "serif"],
        body: ["var(--font-crimson)", "var(--font-noto-thai)", "serif"],
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
