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

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <header className="glass fixed top-0 inset-x-0 z-50 h-14 flex items-center justify-between px-5">
      <div className="flex items-center">
        <span className="font-display font-bold text-nyx-text tracking-wider text-base">
          NYX
        </span>
        <span className="mx-1.5 text-nyx-dim">/</span>
        <span className="font-mono text-nyx-accent text-xs">DCL</span>
        <span className="w-px h-4 bg-nyx-wire mx-3" aria-hidden />
        <span className="mono-label text-nyx-dim">Clean Room v1</span>
      </div>

      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              connected
                ? "bg-nyx-valid pulse-valid"
                : "bg-nyx-broken pulse-broken"
            }`}
            aria-hidden
          />
          <span
            className={`mono-label ${
              connected ? "text-nyx-valid" : "text-nyx-broken"
            }`}
          >
            {connected ? "CONNECTED" : "OFFLINE"}
          </span>
        </div>

        <span className="mono-label text-nyx-silver">
          BLOCKS: {blocks ?? "—"}
        </span>
      </div>
    </header>
  );
}
