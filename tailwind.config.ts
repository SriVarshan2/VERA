import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "#6366f1", // indigo-600
          hover: "#4f46e5",
          light: "#818cf8",
        },
        secondary: {
          DEFAULT: "#06b6d4", // cyan-500
          hover: "#0891b2",
        },
        accent: {
          amber: "#f59e0b",
          emerald: "#10b981",
          rose: "#f43f5e",
          purple: "#8b5cf6",
        },
        dark: {
          900: "#090d16",
          800: "#0f172a",
          700: "#1e293b",
          600: "#334155",
        }
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        display: ["var(--font-outfit)", "sans-serif"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 15px rgba(99, 102, 241, 0.3)" },
          "100%": { boxShadow: "0 0 30px rgba(99, 102, 241, 0.7)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
