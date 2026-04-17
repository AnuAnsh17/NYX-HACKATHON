"use client";

import { useEffect, useState } from "react";

const STATS = [
  { value: "₹250 Cr", label: "Max penalty per breach" },
  { value: "9,500+", label: "NBFCs at risk" },
  { value: "₹5L–1Cr", label: "Per audit failure" },
];

const GRID_BG = {
  backgroundImage:
    "linear-gradient(to right, rgba(28,28,40,0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(28,28,40,0.3) 1px, transparent 1px)",
  backgroundSize: "60px 60px",
};

export function Hero() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fade = "transition-all duration-700 ease-out";
  const state = mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2";

  return (
    <section
      className="relative bg-nyx-black py-20 md:py-24 overflow-hidden"
      style={GRID_BG}
    >
      <div className="relative max-w-5xl mx-auto px-6">
        <div className={`mono-label text-nyx-accent ${fade} ${state}`}>
          HACKX 2.0 · CYBER DEFENCE &amp; DIGITAL TRUST
        </div>

        <h1
          className={`mt-4 font-display font-bold text-nyx-text text-4xl md:text-5xl lg:text-6xl leading-tight ${fade} ${state}`}
          style={{ transitionDelay: "100ms" }}
        >
          We don&apos;t store logs.
          <br />
          <span className="text-nyx-accent italic">We store proof.</span>
        </h1>

        <div
          className={`mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start ${fade} ${state}`}
          style={{ transitionDelay: "200ms" }}
        >
          <div className="grid grid-cols-3 gap-3">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="bg-nyx-surface border border-nyx-border rounded-sm p-4"
              >
                <div className="font-display text-xl text-nyx-text">
                  {s.value}
                </div>
                <div className="mono-label text-nyx-dim mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          <p className="font-body text-sm text-nyx-muted leading-relaxed">
            Traditional logging systems produce mutable logs. Under DPDP Act
            2023 and BSA 2023, these logs are legally inadmissible. DCL fixes
            this with a deterministic hash chain where any tampering instantly
            breaks every downstream block.
          </p>
        </div>

        <div
          className={`mt-8 ${fade} ${state}`}
          style={{ transitionDelay: "300ms" }}
        >
          <div className="glass rounded-sm py-3 px-6 text-center">
            <code className="font-mono text-nyx-accent text-sm md:text-base">
              H(i) = SHA256(index + data + prev_hash + timestamp)
            </code>
          </div>
          <div className="mono-label text-nyx-dim text-center mt-3">
            If one byte changes, every downstream hash breaks.
          </div>
        </div>
      </div>
    </section>
  );
}
