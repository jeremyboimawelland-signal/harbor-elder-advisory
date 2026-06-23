/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Harbor "Advisory Office" palette — ported 1:1 from the dashboard prototype's `T` token object.
        ink: "#1C2430",
        "ink-soft": "#3A4452",
        paper: "#FAF7F2",
        "paper-card": "#FFFFFF",
        "paper-line": "#E8E2D6",
        copper: "#B5651D",
        "copper-soft": "#F2E4D3",
        sage: "#5C7A6B",
        "sage-soft": "#E7EFE9",
        alert: "#A4342A",
        "alert-soft": "#F6E4E1",
        gold: "#C9A227",
        slate: "#6B7280",
      },
      fontFamily: {
        display: ["'Source Serif 4'", "Georgia", "serif"],
        body: ["'Inter'", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "'SF Mono'", "monospace"],
      },
      keyframes: {
        pulseOpacity: { "0%, 100%": { opacity: 0.4 }, "50%": { opacity: 1 } },
        spin: { from: { transform: "rotate(0deg)" }, to: { transform: "rotate(360deg)" } },
      },
      animation: {
        pulse: "pulseOpacity 1.2s ease-in-out infinite",
        spin: "spin 1s linear infinite",
      },
    },
  },
  plugins: [],
};
