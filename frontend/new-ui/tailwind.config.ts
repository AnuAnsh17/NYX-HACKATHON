import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        nyx: {
          black: "#060608",
          dark: "#0A0A0F",
          surface: "#0F0F14",
          card: "#12121A",
          border: "#1C1C28",
          wire: "#262636",
          dim: "#3A3A52",
          muted: "#6B6B84",
          silver: "#9090A8",
          text: "#E0E0EC",
          valid: "#22C55E",
          "valid-dim": "#166534",
          broken: "#EF4444",
          "broken-dim": "#7F1D1D",
          warning: "#F59E0B",
          accent: "#818CF8",
          "accent-dim": "#4F46E5",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Archivo", "sans-serif"],
        body: ["var(--font-body)", "Inter", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
    },
  },
};

export default config;
