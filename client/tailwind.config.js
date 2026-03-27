/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        base: "#0f0f0f",
        surface: "#1a1a1a",
        raised: "#222222",
        border: "#2e2e2e",
        blue: {
          400: "#7DD3FC",
          500: "#38BDF8",
          600: "#0EA5E9",
          700: "#0284C7",
          glow: "rgba(56,189,248,0.15)",
        },
      },
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
        display: ["Cormorant Garamond", "Georgia", "serif"],
        mono: ["DM Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
