/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'DM Sans'", "system-ui", "sans-serif"],
        mono: ["'Space Mono'", "'Courier New'", "monospace"],
      },
      fontSize: {
        "xs":   ["0.8125rem", { lineHeight: "1.25rem" }],   // 13px  (was 12)
        "sm":   ["0.9375rem", { lineHeight: "1.5rem" }],    // 15px  (was 14)
        "base": ["1.0625rem", { lineHeight: "1.625rem" }],  // 17px  (was 16)
        "lg":   ["1.125rem",  { lineHeight: "1.75rem" }],   // 18px
        "xl":   ["1.25rem",   { lineHeight: "1.75rem" }],   // 20px
        "2xl":  ["1.5rem",    { lineHeight: "2rem" }],
      },
      colors: {
        green: {
          DEFAULT: "#22c55e",
          50:  "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
        },
        // Dark theme palette
        dark: {
          base:      "#0a0f0a",
          secondary: "#111b11",
          card:      "#162016",
          hover:     "#1c2e1c",
          border:    "#1e3a1e",
          bright:    "#2d5c2d",
        },
      },
      boxShadow: {
        "green-glow": "0 0 20px rgba(34,197,94,0.18)",
        "green-glow-lg": "0 0 40px rgba(34,197,94,0.25)",
      },
    },
  },
  plugins: [],
};
