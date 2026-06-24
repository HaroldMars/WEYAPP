/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0E0E10",
          900: "#16161A",
          800: "#1E1E24",
          700: "#2A2A32",
          600: "#3D3D47",
        },
        signal: {
          500: "#6C5CE7",
          400: "#8478F0",
          300: "#A89FF5",
        },
        paper: {
          50: "#FAFAF8",
          100: "#F2F1ED",
        },
        coral: {
          500: "#FF6B5B",
        },
        mint: {
          500: "#2DD4A7",
        },
      },
      fontFamily: {
        display: ["'Sora'", "system-ui", "sans-serif"],
        body: ["'Inter'", "system-ui", "sans-serif"],
      },
      boxShadow: {
        bubble: "0 1px 2px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.08)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      keyframes: {
        "pop-in": {
          "0%": { opacity: 0, transform: "translateY(6px) scale(0.98)" },
          "100%": { opacity: 1, transform: "translateY(0) scale(1)" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.3 },
        },
      },
      animation: {
        "pop-in": "pop-in 0.18s ease-out",
        "pulse-dot": "pulse-dot 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
