"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

const PROOF_POINTS = [
  "Tamper on any block — every downstream hash breaks instantly",
  "Live event ingestion via SSE at 4,200+ events / second",
  "Deterministic SHA-256 chain · admissible under DPDP Act 2023",
];

const STATS = [
  { value: "₹250 Cr",  label: "Max penalty per breach" },
  { value: "9,500+",   label: "NBFCs at compliance risk" },
  { value: "< 1 ms",   label: "Verification latency" },
];

const DEMO_CHAIN = [
  { index: 0, label: "GENESIS",  hash: "a3f2b9c1d4e5", broken: false },
  { index: 1, label: "BLOCK 01", hash: "7e4d2a3fb6c1", broken: false },
  { index: 2, label: "BLOCK 02", hash: "b6c19f2e3a4d", broken: false },
  { index: 3, label: "BLOCK 03", hash: "HASH MISMATCH", broken: true },
];

function CornerMarks({ color }: { color: string }) {
  const s = { borderColor: color };
  return (
    <>
      <span className="corner-mark-tl" style={s} />
      <span className="corner-mark-tr" style={s} />
      <span className="corner-mark-bl" style={s} />
      <span className="corner-mark-br" style={s} />
    </>
  );
}

function ChainViz() {
  return (
    <div className="flex flex-col gap-0">
      <div className="mono-label text-nyx-dim mb-5 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-nyx-accent pulse-gold inline-block" />
        PROOF CHAIN — LIVE DEMO
      </div>

      {DEMO_CHAIN.map((b, i) => (
        <div key={b.index} className="flex flex-col items-stretch">
          <div
            className={`chain-block ${b.broken ? "chain-block-broken" : ""} relative rounded-sm p-4 transition-all duration-300 ${
              b.broken
                ? "border"
                : "border hover:scale-[1.01]"
            }`}
            style={
              b.broken
                ? { background: "rgba(30,6,16,0.7)", borderColor: "rgba(224,48,80,0.35)", backdropFilter: "blur(16px)" }
                : { background: "rgba(13,10,36,0.7)", borderColor: "rgba(201,168,76,0.18)", backdropFilter: "blur(16px)" }
            }
          >
            <CornerMarks color={b.broken ? "#E03050" : "#C9A84C"} />
            <div className="flex items-center justify-between mb-2">
              <span className="mono-label text-nyx-silver">{b.label}</span>
              <span
                className="mono-label px-1.5 py-0.5 rounded-sm"
                style={
                  b.broken
                    ? { background: "rgba(224,48,80,0.15)", color: "#E03050" }
                    : { background: "rgba(39,201,127,0.10)", color: "#27C97F" }
                }
              >
                {b.broken ? "BROKEN" : "VALID"}
              </span>
            </div>
            <div
              className="font-mono text-[11px] truncate"
              style={{ color: b.broken ? "rgba(224,48,80,0.65)" : "rgba(154,148,192,0.8)" }}
            >
              {b.hash}
            </div>
          </div>

          {i < DEMO_CHAIN.length - 1 && (
            <div className="chain-conn self-center flex flex-col items-center" style={{ height: "28px" }}>
              <div
                className="relative overflow-hidden flex-1"
                style={{
                  width: "1px",
                  background: b.broken ? "rgba(224,48,80,0.22)" : "rgba(201,168,76,0.2)",
                }}
              >
                {!b.broken && (
                  <div
                    className="absolute w-full nyx-flow-dot-v"
                    style={{ height: "8px", background: "rgba(201,168,76,0.65)" }}
                  />
                )}
              </div>
              <svg width="8" height="5" viewBox="0 0 8 5" fill="none">
                <path
                  d="M0 0 L4 5 L8 0"
                  stroke={b.broken ? "rgba(224,48,80,0.3)" : "rgba(201,168,76,0.4)"}
                  strokeWidth="1"
                />
              </svg>
            </div>
          )}
        </div>
      ))}

      <div className="mt-4 mono-label text-nyx-muted/50 text-center">
        One tampered byte · full cascade · instant detection
      </div>
    </div>
  );
}

export function Hero() {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(".hero-tag",     { y: 10, opacity: 0, duration: 0.45 })
        .from(".hero-line",    { y: 32, opacity: 0, stagger: 0.1, duration: 0.6 }, "-=0.2")
        .from(".hero-proof",   { x: -14, opacity: 0, stagger: 0.08, duration: 0.4 }, "-=0.3")
        .from(".hero-cta",     { y: 14, opacity: 0, stagger: 0.07, duration: 0.35 }, "-=0.2")
        .from(".hero-formula", { y: 10, opacity: 0, duration: 0.35 }, "-=0.2")
        .from(".chain-block",  { scale: 0.93, y: 8, opacity: 0, stagger: 0.12, duration: 0.4, ease: "back.out(1.4)" }, "-=0.5")
        .from(".chain-conn",   { scaleY: 0, opacity: 0, stagger: 0.12, duration: 0.22, transformOrigin: "top center" }, "-=0.3");

      gsap.to(".chain-block-broken", {
        boxShadow: "0 0 32px 10px rgba(224,48,80,0.38)",
        duration: 1.3,
        repeat: -1,
        yoyo: true,
        ease: "power2.inOut",
        delay: 1.2,
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <section
      ref={containerRef}
      id="hero"
      className="relative min-h-screen flex flex-col overflow-hidden"
      style={{
        backgroundImage:
          "linear-gradient(to right, rgba(28,24,56,0.25) 1px, transparent 1px), linear-gradient(to bottom, rgba(28,24,56,0.25) 1px, transparent 1px)",
        backgroundSize: "56px 56px",
      }}
    >
      {/* Colored halos */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 10% 45%, rgba(124,58,237,0.09) 0%, transparent 65%), " +
            "radial-gradient(ellipse 50% 40% at 90% 20%, rgba(155,28,53,0.07) 0%, transparent 55%)",
        }}
      />

      <div className="nyx-scan-line" />

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col justify-center max-w-7xl mx-auto w-full px-6 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-14 lg:gap-20 items-center">

          {/* Left 3/5 */}
          <div className="lg:col-span-3 flex flex-col">
            <div className="hero-tag mono-label text-nyx-accent mb-7 flex items-center gap-2.5">
              <span
                className="w-1.5 h-1.5 rounded-full inline-block"
                style={{ background: "#C9A84C", animation: "nyx-pulse-gold 2.5s ease-in-out infinite" }}
              />
              HACKX 2.0 &nbsp;·&nbsp; CYBER DEFENCE &amp; DIGITAL TRUST
            </div>

            <h1 className="font-display font-black leading-none tracking-tight text-5xl sm:text-6xl lg:text-7xl">
              <span className="hero-line block text-nyx-text">WE DON&apos;T</span>
              <span className="hero-line block text-nyx-text">STORE LOGS.</span>
              <span className="hero-line block mt-1 gold-shimmer">
                WE STORE PROOF.
              </span>
            </h1>

            <ul className="mt-10 space-y-3.5">
              {PROOF_POINTS.map((p, i) => (
                <li key={i} className="hero-proof flex items-start gap-3">
                  <span
                    className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0"
                    style={{ background: "rgba(201,168,76,0.7)" }}
                  />
                  <span className="text-sm text-nyx-silver leading-relaxed">{p}</span>
                </li>
              ))}
            </ul>

            <div className="mt-10 flex flex-wrap gap-3">
              <button
                onClick={() => scrollTo("chain")}
                className="hero-cta mono-label px-6 py-3 rounded-sm font-bold transition-all duration-200 hover:scale-105 active:scale-95 glow-gold"
                style={{
                  background: "linear-gradient(135deg, #C9A84C, #A07830)",
                  color: "#060410",
                }}
              >
                START LIVE DEMO →
              </button>
              <button
                onClick={() => scrollTo("verify")}
                className="hero-cta mono-label px-6 py-3 rounded-sm text-nyx-silver transition-all duration-200 hover:text-nyx-accent"
                style={{ border: "1px solid rgba(201,168,76,0.25)" }}
              >
                VIEW INTEGRITY REPORT
              </button>
            </div>

            <div
              className="hero-formula mt-10 self-start px-5 py-3 rounded-sm"
              style={{
                background: "rgba(13,10,36,0.7)",
                border: "1px solid rgba(201,168,76,0.14)",
                backdropFilter: "blur(20px)",
              }}
            >
              <code className="font-mono text-xs sm:text-sm" style={{ color: "#C9A84C" }}>
                H(i) = SHA256( i &nbsp;‖&nbsp; data &nbsp;‖&nbsp; H(i-1) &nbsp;‖&nbsp; ts )
              </code>
            </div>
          </div>

          {/* Right 2/5 */}
          <div className="lg:col-span-2">
            <ChainViz />
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div
        className="relative z-10"
        style={{ borderTop: "1px solid rgba(201,168,76,0.12)" }}
      >
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-3">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className={`py-6 ${i > 0 ? "pl-8" : ""}`}
              style={i > 0 ? { borderLeft: "1px solid rgba(201,168,76,0.10)" } : {}}
            >
              <div className="font-display font-black text-2xl sm:text-3xl gold-shimmer">
                {s.value}
              </div>
              <div className="mono-label text-nyx-muted mt-1.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
