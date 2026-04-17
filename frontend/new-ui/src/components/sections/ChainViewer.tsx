"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { tamperBlock, type VerifyResult } from "@/lib/api";
import { useChainStatus } from "@/hooks/useChainStatus";
import { useSSE } from "@/hooks/useSSE";

const CASCADE_STEP_MS = 150;

function truncHash(h: string): string {
  if (!h) return "";
  return h.length <= 16 ? h : h.slice(0, 16) + "…";
}

export function ChainViewer() {
  const { chain, verification, loading, error, refresh } = useChainStatus();
  const { events: sseEvents } = useSSE();

  const [renderBroken, setRenderBroken] = useState<Set<number>>(new Set());
  const [verifying, setVerifying] = useState(false);

  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevChainLenRef = useRef(0);
  const prevBrokenRef = useRef<Set<number>>(new Set());
  const hasChainLoadedRef = useRef(false);
  const hasVerificationLoadedRef = useRef(false);

  // SSE fires → pull chain + verify immediately
  useEffect(() => {
    if (sseEvents.length > 0) {
      refresh();
    }
  }, [sseEvents.length, refresh]);

  // New block animation (slide-in from right + green glow)
  useEffect(() => {
    if (!hasChainLoadedRef.current && chain.length > 0) {
      hasChainLoadedRef.current = true;
      prevChainLenRef.current = chain.length;
      return;
    }
    if (chain.length > prevChainLenRef.current) {
      for (let i = prevChainLenRef.current; i < chain.length; i++) {
        const block = chain[i];
        const el = cardRefs.current.get(block.index);
        if (!el) continue;
        gsap.fromTo(
          el,
          { x: 80, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.5, ease: "power2.out" }
        );
        gsap.fromTo(
          el,
          { boxShadow: "0 0 24px 6px rgba(34,197,94,0.55)" },
          {
            boxShadow: "0 0 0 0 rgba(34,197,94,0)",
            duration: 1.4,
            delay: 0.25,
            ease: "power2.out",
          }
        );
      }
      const sc = scrollContainerRef.current;
      if (sc) sc.scrollTo({ left: sc.scrollWidth, behavior: "smooth" });
    }
    prevChainLenRef.current = chain.length;
  }, [chain]);

  // Cascade: stagger broken-state application + shake per card
  useEffect(() => {
    if (!verification) return;

    const brokenNow = new Set<number>();
    verification.blocks.forEach((b) => {
      if (b.status === "BROKEN") brokenNow.add(b.index);
    });

    if (!hasVerificationLoadedRef.current) {
      hasVerificationLoadedRef.current = true;
      prevBrokenRef.current = brokenNow;
      setRenderBroken(brokenNow);
      return;
    }

    const newlyBroken = [...brokenNow]
      .filter((i) => !prevBrokenRef.current.has(i))
      .sort((a, b) => a - b);
    const noLongerBroken = [...prevBrokenRef.current].filter(
      (i) => !brokenNow.has(i)
    );

    if (noLongerBroken.length > 0) {
      setRenderBroken((prev) => {
        const next = new Set(prev);
        noLongerBroken.forEach((i) => next.delete(i));
        return next;
      });
    }

    prevBrokenRef.current = brokenNow;

    if (newlyBroken.length === 0) return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    newlyBroken.forEach((idx, i) => {
      const t = setTimeout(() => {
        setRenderBroken((prev) => {
          const next = new Set(prev);
          next.add(idx);
          return next;
        });
        const el = cardRefs.current.get(idx);
        if (el) {
          gsap.fromTo(
            el,
            { x: 0 },
            {
              keyframes: { x: [-6, 6, -4, 4, 0] },
              duration: 0.36,
              ease: "power1.inOut",
            }
          );
        }
      }, i * CASCADE_STEP_MS);
      timers.push(t);
    });

    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, [verification]);

  const handleTamper = useCallback(
    async (index: number) => {
      if (!window.confirm(`This will corrupt Block #${index}. Continue?`))
        return;
      try {
        await tamperBlock(index);
        await refresh();
      } catch (e) {
        alert(e instanceof Error ? e.message : "Tamper failed");
      }
    },
    [refresh]
  );

  const handleVerify = useCallback(async () => {
    setVerifying(true);
    try {
      await refresh();
    } finally {
      setVerifying(false);
    }
  }, [refresh]);

  const verifyResultFor = (index: number): VerifyResult | null =>
    verification?.blocks.find((b) => b.index === index) ?? null;

  const allValid = renderBroken.size === 0;

  return (
    <section className="py-12 bg-nyx-dark">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <span className="mono-label text-nyx-accent">CHAIN EXPLORER</span>

          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-sm ${
              allValid ? "status-valid" : "status-broken pulse-broken"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                allValid ? "bg-nyx-valid" : "bg-nyx-broken"
              }`}
            />
            <span className="mono-label">
              {allValid
                ? "CHAIN INTEGRITY: VALID"
                : "INTEGRITY BREACH DETECTED"}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => refresh()}
              disabled={loading}
              className="mono-label px-3 py-1.5 border border-nyx-wire text-nyx-muted rounded-sm hover:text-nyx-text hover:border-nyx-dim transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              REFRESH
            </button>
            <button
              onClick={handleVerify}
              disabled={verifying}
              className="mono-label px-3 py-1.5 border border-nyx-wire text-nyx-muted rounded-sm hover:text-nyx-text hover:border-nyx-dim transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {verifying ? "VERIFYING…" : "VERIFY"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 px-4 py-3 border border-nyx-broken/30 bg-nyx-broken-dim/10 text-nyx-broken text-sm rounded-sm">
            {error}
          </div>
        )}

        <div
          ref={scrollContainerRef}
          className="mt-8 flex gap-4 overflow-x-auto pb-4"
        >
          {chain.length === 0 && !loading && (
            <div className="mono-label text-nyx-dim py-8">
              No blocks yet. Append an event to ingest.
            </div>
          )}

          {chain.map((block) => {
            const isBroken = renderBroken.has(block.index);
            const vr = verifyResultFor(block.index);
            return (
              <div
                key={block.index}
                ref={(el) => {
                  if (el) cardRefs.current.set(block.index, el);
                  else cardRefs.current.delete(block.index);
                }}
                className={`w-72 flex-shrink-0 rounded-sm p-5 relative transition-colors duration-300 ${
                  isBroken
                    ? "bg-nyx-broken-dim/10 border border-nyx-broken/40"
                    : "bg-nyx-card border border-nyx-valid/20"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="mono-label text-nyx-silver">
                    BLOCK #{block.index}
                  </span>
                  <span
                    className={`mono-label px-2 py-0.5 rounded-sm ${
                      isBroken
                        ? "bg-nyx-broken/20 text-nyx-broken"
                        : "bg-nyx-valid/20 text-nyx-valid"
                    }`}
                  >
                    {isBroken ? "BROKEN" : "VALID"}
                  </span>
                </div>

                <div className="mono-label text-nyx-dim mt-2 truncate">
                  {block.timestamp}
                </div>

                <div className="font-mono text-xs text-nyx-text mt-3 p-3 bg-nyx-black/50 rounded-sm break-all">
                  {block.data}
                </div>

                <div className="mono-label text-nyx-dim mt-3 truncate">
                  HASH: {truncHash(block.hash)}
                </div>
                <div className="mono-label text-nyx-dim mt-1 truncate">
                  PREV: {truncHash(block.prev_hash)}
                </div>

                {isBroken && vr && (
                  <div className="mt-3 pt-3 border-t border-nyx-broken/20 space-y-1">
                    <div className="font-mono text-[10px] break-all">
                      <span className="text-nyx-dim">EXPECTED: </span>
                      <span className="text-nyx-valid">
                        {truncHash(vr.expected_hash)}
                      </span>
                    </div>
                    <div className="font-mono text-[10px] break-all">
                      <span className="text-nyx-dim">STORED: </span>
                      <span className="text-nyx-broken">
                        {truncHash(vr.stored_hash)}
                      </span>
                    </div>
                  </div>
                )}

                {block.index !== 0 && (
                  <button
                    onClick={() => handleTamper(block.index)}
                    className="mt-4 w-full text-nyx-broken/60 text-[10px] mono-label border border-nyx-broken/20 rounded-sm py-1.5 hover:bg-nyx-broken/10 hover:text-nyx-broken transition-colors"
                  >
                    ⚠ TAMPER
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
