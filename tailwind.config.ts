import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1440px",
      },
    },
    extend: {
      colors: {
        // Brand
        primary: {
          DEFAULT: "#2563EB",
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
          800: "#1E40AF",
          900: "#1E3A8A",
        },
        sky: {
          DEFAULT: "#60A5FA",
        },
        emerald: {
          DEFAULT: "#10B981",
        },
        warning: "#F59E0B",
        danger: "#EF4444",
        // Neutral
        bg: "#F8FAFC",
        card: "#FFFFFF",
        border: "#E2E8F0",
        ink: {
          DEFAULT: "#0F172A",
          muted: "#64748B",
        },
        // Admin sidebar
        navy: {
          DEFAULT: "#0B1220",
          800: "#111A2E",
          700: "#1B2742",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      fontSize: {
        hero: ["48px", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        page: ["32px", { lineHeight: "1.2", letterSpacing: "-0.01em" }],
        section: ["24px", { lineHeight: "1.3" }],
        cardtitle: ["18px", { lineHeight: "1.4" }],
      },
      borderRadius: {
        xl2: "16px",
        "3xl": "24px",
        "4xl": "32px",
      },
      boxShadow: {
        soft: "0 4px 20px rgba(15, 23, 42, 0.08)",
        float: "0 10px 40px rgba(15, 23, 42, 0.12)",
        ring: "0 0 0 4px rgba(37, 99, 235, 0.12)",
      },
      backdropBlur: {
        xs: "8px",
      },
      gridTemplateColumns: {
        "14": "repeat(14, minmax(0, 1fr))",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s linear infinite",
        fadeIn: "fadeIn 240ms ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
