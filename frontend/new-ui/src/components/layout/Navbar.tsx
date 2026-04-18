"use client";

import { useEffect, useState } from "react";
import { healthCheck } from "@/lib/api";

export function Navbar() {
  const [connected, setConnected] = useState(false);
  const [blocks, setBlocks] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const res = await healthCheck();
        if (cancelled) return;
        setConnected(true);
        setBlocks(res.chain_length);
      } catch {
        if (cancelled) return;
        setConnected(false);
      }
    };
    check();
    const id = setInterval(check, 5000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <header
      className="glass fixed top-0 inset-x-0 z-50 h-14 flex items-center justify-between px-6"
      style={{ borderBottom: "1px solid rgba(201,168,76,0.15)" }}
    >
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="font-display font-black text-sm tracking-[0.2em] gold-shimmer">
            NYX
          </span>
          <span className="text-nyx-dim/50 text-xs">/</span>
          <span className="font-mono text-nyx-silver text-xs tracking-wider">DCL</span>
        </div>

        <span className="hidden sm:block w-px h-3.5 bg-nyx-wire/60" aria-hidden />

        <nav className="hidden sm:flex items-center gap-0.5">
          {[
            { label: "CHAIN",  id: "chain"  },
            { label: "VERIFY", id: "verify" },
            { label: "EVENTS", id: "events" },
          ].map(({ label, id }) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className="mono-label px-3 py-1.5 text-nyx-muted hover:text-nyx-accent transition-colors rounded-sm hover:bg-nyx-accent/6 cursor-pointer"
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${connected ? "bg-nyx-valid pulse-valid" : "bg-nyx-broken pulse-broken"}`}
            aria-hidden
          />
          <span className={`mono-label ${connected ? "text-nyx-valid" : "text-nyx-broken"}`}>
            {connected ? "CONNECTED" : "OFFLINE"}
          </span>
        </div>

        <div
          className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-sm"
          style={{ background: "rgba(201,168,76,0.07)", border: "1px solid rgba(201,168,76,0.16)" }}
        >
          <span className="mono-label" style={{ color: "#C9A84C" }}>
            {blocks !== null ? blocks.toLocaleString() : "—"}
          </span>
          <span className="mono-label text-nyx-dim">BLOCKS</span>
        </div>
      </div>
    </header>
  );
}
