import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        nyx: {
          black:        "#060410",
          dark:         "#09071C",
          surface:      "#0D0A24",
          card:         "#130F2E",
          border:       "#1E1A3A",
          wire:         "#2C2850",
          dim:          "#403C6C",
          muted:        "#625D90",
          silver:       "#9A94C0",
          text:         "#EDE8F5",
          valid:        "#27C97F",
          "valid-dim":  "#071A10",
          broken:       "#E03050",
          "broken-dim": "#1E0610",
          warning:      "#D4A843",
          accent:       "#C9A84C",
          "accent-dim": "#18120A",
          gold:         "#C9A84C",
          "gold-bright":"#E8D06A",
          "gold-dim":   "#18120A",
          royal:        "#7C3AED",
          "royal-dim":  "#180A35",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Archivo", "sans-serif"],
        body:    ["var(--font-body)", "Inter", "sans-serif"],
        mono:    ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
    },
  },
};

export default config;
