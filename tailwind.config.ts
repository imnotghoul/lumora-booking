import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#172033",
        muted: "#657085",
        canvas: "#f7f8fc",
        surface: "#ffffff",
        line: "#e7e9f1",
        accent: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#5653e7",
          700: "#4744c5",
          800: "#3937a0",
          900: "#302f7e"
        },
        success: "#16855b",
        warning: "#b76812",
        danger: "#c93d4b"
      },
      boxShadow: {
        soft: "0 16px 50px -24px rgba(31, 42, 72, .24)",
        card: "0 8px 30px -18px rgba(31, 42, 72, .20)"
      },
      borderRadius: {
        "2xl": "1.25rem",
        "3xl": "1.75rem"
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" }
        }
      },
      animation: {
        "fade-up": "fade-up .35s ease-out both"
      }
    }
  },
  plugins: []
};

export default config;
