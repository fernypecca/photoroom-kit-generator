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
        // ── shadcn system tokens ───────────────────────────────────────────────
        background: "var(--background)",
        foreground: "var(--foreground)",
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },

        // ── Photoroom brand tokens ─────────────────────────────────────────────
        // Usage: bg-brand, text-brand, border-brand-soft, etc.
        brand: {
          DEFAULT: "#410CD9",   // primary purple
          hover: "#3409B8",     // for hover states
          soft: "#EDE8FD",      // light tint — chips, tags, highlights
        },
        "accent-purple": "#F5F0FF",   // very light — subtle section tints
        "background-soft": "#F8F7FC", // off-white — alternating sections
        surface: "#F2EEF9",           // card surfaces, input backgrounds
        fg: {
          DEFAULT: "#1A1A2E",   // body text
          muted: "#6B7280",     // secondary text, captions
        },
        "border-subtle": "#E5E0F0",   // dividers, input borders
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};

export default config;
