"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { tamperBlock, type VerifyResult } from "@/lib/api";
import { useChainStatus } from "@/hooks/useChainStatus";
import { useSSE } from "@/hooks/useSSE";

const CASCADE_STEP_MS = 160;
const REFRESH_DEBOUNCE_MS = 1000;

function truncHash(h: string): string {
  if (!h) return "";
  return h.length <= 18 ? h : h.slice(0, 10) + "…" + h.slice(-6);
}

function fmtTs(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return (
      d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) +
      " · " +
      d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })
    );
  } catch {
    return iso;
  }
}

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

function BlockConnector({ targetBroken }: { targetBroken: boolean }) {
  return (
    <div
      className="flex-shrink-0 flex items-center mt-10"
      style={{ width: "40px" }}
    >
      {/* Line */}
      <div
        className="relative flex-1 overflow-hidden"
        style={{
          height: "1px",
          background: targetBroken
            ? "rgba(255,45,85,0.3)"
            : "rgba(0,212,176,0.2)",
        }}
      >
        {!targetBroken && (
          <div
            className="absolute nyx-flow-dot-h"
            style={{
              top: "-2px",
              width: "10px",
              height: "5px",
              borderRadius: "999px",
              background: "rgba(0,212,176,0.7)",
            }}
          />
        )}
      </div>
      {/* Arrow tip */}
      <svg width="6" height="10" viewBox="0 0 6 10" fill="none" style={{ flexShrink: 0 }}>
        <path
          d="M0 0 L6 5 L0 10"
          stroke={targetBroken ? "rgba(255,45,85,0.3)" : "rgba(0,212,176,0.35)"}
          strokeWidth="1.2"
        />
      </svg>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="w-72 flex-shrink-0 rounded-sm p-5 bg-nyx-card border border-nyx-border animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-2 bg-nyx-wire rounded w-20" />
        <div className="h-2 bg-nyx-wire rounded w-12" />
      </div>
      <div className="h-1.5 bg-nyx-wire rounded w-36 mb-4" />
      <div className="h-12 bg-nyx-wire/50 rounded mb-3" />
      <div className="h-1.5 bg-nyx-wire rounded w-40 mb-2" />
      <div className="h-1.5 bg-nyx-wire rounded w-28" />
    </div>
  );
}

export function ChainViewer() {
  const { chain, verification, loading, error, refresh } = useChainStatus();
  const { events: sseEvents } = useSSE();

  const [renderBroken, setRenderBroken] = useState<Set<number>>(new Set());
  const [verifying, setVerifying] = useState(false);

  const refreshDebounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRefs            = useRef<Map<number, HTMLDivElement>>(new Map());
  const scrollContainerRef  = useRef<HTMLDivElement>(null);
  const prevChainLenRef     = useRef(0);
  const prevBrokenRef       = useRef<Set<number>>(new Set());
  const hasChainLoadedRef   = useRef(false);
  const hasVerifLoadedRef   = useRef(false);

  // SSE → debounced refresh (max once per second)
  useEffect(() => {
    if (sseEvents.length === 0) return;
    if (refreshDebounceRef.current) clearTimeout(refreshDebounceRef.current);
    refreshDebounceRef.current = setTimeout(() => { refresh(); }, REFRESH_DEBOUNCE_MS);
  }, [sseEvents.length, refresh]);

  // New block: slide in from right + brief green glow
  useEffect(() => {
    if (!hasChainLoadedRef.current && chain.length > 0) {
      hasChainLoadedRef.current = true;
      prevChainLenRef.current = chain.length;
      return;
    }
    if (chain.length > prevChainLenRef.current) {
      for (let i = prevChainLenRef.current; i < chain.length; i++) {
        const el = cardRefs.current.get(chain[i].index);
        if (!el) continue;
        gsap.fromTo(el, { x: 60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.45, ease: "power2.out" });
        gsap.fromTo(
          el,
          { boxShadow: "0 0 0 0 rgba(0,224,127,0)" },
          { boxShadow: "0 0 28px 8px rgba(0,224,127,0.45)", duration: 0.35, delay: 0.1, ease: "power3.out",
            onComplete: () => gsap.to(el, { boxShadow: "0 0 0 0 rgba(0,224,127,0)", duration: 0.8, ease: "power2.out" }) }
        );
      }
      const sc = scrollContainerRef.current;
      if (sc) sc.scrollTo({ left: sc.scrollWidth, behavior: "smooth" });
    }
    prevChainLenRef.current = chain.length;
  }, [chain]);

  // Cascade: stagger broken state + dramatic glow+shake per card
  useEffect(() => {
    if (!verification) return;

    const brokenNow = new Set<number>();
    verification.blocks.forEach((b) => { if (b.status === "BROKEN") brokenNow.add(b.index); });

    if (!hasVerifLoadedRef.current) {
      hasVerifLoadedRef.current = true;
      prevBrokenRef.current = brokenNow;
      setRenderBroken(brokenNow);
      return;
    }

    const newlyBroken    = [...brokenNow].filter((i) => !prevBrokenRef.current.has(i)).sort((a, b) => a - b);
    const noLongerBroken = [...prevBrokenRef.current].filter((i) => !brokenNow.has(i));

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
        setRenderBroken((prev) => { const next = new Set(prev); next.add(idx); return next; });
        const el = cardRefs.current.get(idx);
        if (el) {
          // Dramatic: glow expansion + shake
          const tl = gsap.timeline();
          tl.fromTo(el,
            { boxShadow: "0 0 0 0 rgba(255,45,85,0)" },
            { boxShadow: "0 0 48px 16px rgba(255,45,85,0.55)", duration: 0.22, ease: "power3.out" }
          )
          .to(el, { keyframes: { x: [-7, 7, -5, 5, -3, 3, 0] }, duration: 0.4, ease: "power1.inOut" }, "<0.05")
          .to(el, { boxShadow: "0 0 16px 4px rgba(255,45,85,0.15)", duration: 0.7, ease: "power2.out" });
        }
      }, i * CASCADE_STEP_MS);
      timers.push(t);
    });

    return () => timers.forEach(clearTimeout);
  }, [verification]);

  const handleTamper = useCallback(async (index: number) => {
    if (!window.confirm(`Corrupt Block #${index}? This demonstrates tamper detection.`)) return;
    try {
      await tamperBlock(index);
      await refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Tamper failed");
    }
  }, [refresh]);

  const handleVerify = useCallback(async () => {
    setVerifying(true);
    try { await refresh(); } finally { setVerifying(false); }
  }, [refresh]);

  const verifyResultFor = (index: number): VerifyResult | null =>
    verification?.blocks.find((b) => b.index === index) ?? null;

  const allValid   = renderBroken.size === 0;
  const showSkeleton = loading && chain.length === 0;

  return (
    <section
      id="chain"
      className="py-14"
      style={{
        background:
          "radial-gradient(ellipse 70% 50% at 50% 50%, rgba(13,10,36,0.95) 0%, rgba(6,4,16,0.98) 100%)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6">

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 flex-wrap mb-8">
          <div className="flex items-center gap-4">
            <span className="mono-label text-nyx-accent">CHAIN EXPLORER</span>
            <span className="mono-label text-nyx-dim">
              {chain.length.toLocaleString()} BLOCKS
            </span>
          </div>

          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-sm ${
              allValid ? "status-valid" : "status-broken pulse-broken"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${allValid ? "bg-nyx-valid" : "bg-nyx-broken"}`} />
            <span className="mono-label">
              {allValid ? "CHAIN INTEGRITY: VALID" : "INTEGRITY BREACH DETECTED"}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => refresh()}
              disabled={loading}
              className="mono-label px-3 py-1.5 border border-nyx-wire text-nyx-muted rounded-sm hover:text-nyx-text hover:border-nyx-dim transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              REFRESH
            </button>
            <button
              onClick={handleVerify}
              disabled={verifying}
              className="mono-label px-3 py-1.5 border border-nyx-wire text-nyx-muted rounded-sm hover:text-nyx-accent hover:border-nyx-accent/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
            >
              {verifying && (
                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {verifying ? "VERIFYING…" : "VERIFY CHAIN"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 border border-nyx-broken/30 bg-nyx-broken-dim/10 text-nyx-broken text-xs font-mono rounded-sm">
            {error}
          </div>
        )}

        {/* Block scroll area */}
        <div
          ref={scrollContainerRef}
          className="flex items-start overflow-x-auto pb-4"
          style={{ scrollbarWidth: "thin", gap: 0 }}
        >
          {showSkeleton && (
            <>
              <SkeletonCard />
              <div style={{ width: 40 }} className="flex-shrink-0" />
              <SkeletonCard />
              <div style={{ width: 40 }} className="flex-shrink-0" />
              <SkeletonCard />
            </>
          )}

          {!showSkeleton && chain.length === 0 && (
            <div className="flex flex-col items-center justify-center w-full py-20 gap-3">
              <div className="mono-label text-nyx-dim">NO BLOCKS IN CHAIN</div>
              <p className="text-sm text-nyx-muted/60">
                Run the simulator or append an event to begin.
              </p>
            </div>
          )}

          {chain.map((block, i) => {
            const isBroken = renderBroken.has(block.index);
            const vr       = verifyResultFor(block.index);
            const isGenesis = block.index === 0;
            const nextBroken = i < chain.length - 1 && renderBroken.has(chain[i + 1].index);

            return (
              <div key={block.index} className="flex items-start flex-shrink-0">
                {/* Evidence card */}
                <div
                  ref={(el) => {
                    if (el) cardRefs.current.set(block.index, el);
                    else cardRefs.current.delete(block.index);
                  }}
                  className="relative w-72 flex-shrink-0 rounded-sm p-5 transition-all duration-300"
                  style={
                    isBroken
                      ? { background: "rgba(30,6,16,0.75)", border: "1px solid rgba(224,48,80,0.38)", backdropFilter: "blur(20px)" }
                      : { background: "rgba(13,10,36,0.70)", border: "1px solid rgba(201,168,76,0.16)", backdropFilter: "blur(20px)" }
                  }
                >
                  <CornerMarks color={isBroken ? "#E03050" : "#C9A84C"} />

                  {/* Header */}
                  <div className="flex items-center justify-between mb-1">
                    <span className="mono-label text-nyx-silver">
                      {isGenesis ? "GENESIS" : `BLOCK #${String(block.index).padStart(3, "0")}`}
                    </span>
                    <span
                      className={`mono-label px-2 py-0.5 rounded-sm ${
                        isBroken ? "bg-nyx-broken/15 text-nyx-broken" : "bg-nyx-valid/10 text-nyx-valid"
                      }`}
                    >
                      {isBroken ? "BROKEN" : "VALID"}
                    </span>
                  </div>

                  <div className="mono-label text-nyx-dim mb-3 truncate">
                    {fmtTs(block.timestamp)}
                  </div>

                  {/* Data payload */}
                  <div className="font-mono text-xs text-nyx-text bg-nyx-black/60 rounded-sm p-3 break-all leading-relaxed mb-3">
                    {block.data}
                  </div>

                  {/* Hashes */}
                  <div className="space-y-1">
                    <div className="font-mono text-[10px] text-nyx-dim truncate">
                      <span className="text-nyx-wire">HASH&nbsp;</span>
                      {truncHash(block.hash)}
                    </div>
                    <div className="font-mono text-[10px] text-nyx-dim truncate">
                      <span className="text-nyx-wire">PREV&nbsp;</span>
                      {isGenesis ? "0000000000000000" : truncHash(block.prev_hash)}
                    </div>
                  </div>

                  {/* Forensic evidence — hash mismatch detail */}
                  {isBroken && vr && (
                    <div className="mt-3 pt-3 border-t border-nyx-broken/20 space-y-1.5">
                      <div className="mono-label text-nyx-broken/70 mb-1.5">HASH MISMATCH</div>
                      <div className="font-mono text-[10px] break-all">
                        <span className="text-nyx-dim">EXPECTED&nbsp;</span>
                        <span className="text-nyx-valid">{truncHash(vr.expected_hash)}</span>
                      </div>
                      <div className="font-mono text-[10px] break-all">
                        <span className="text-nyx-dim">STORED&nbsp;&nbsp;&nbsp;</span>
                        <span className="text-nyx-broken">{truncHash(vr.stored_hash)}</span>
                      </div>
                    </div>
                  )}

                  {/* Tamper button */}
                  {!isGenesis && (
                    <button
                      onClick={() => handleTamper(block.index)}
                      className="mt-4 w-full mono-label py-1.5 border border-nyx-broken/20 text-nyx-broken/50 rounded-sm hover:bg-nyx-broken/8 hover:text-nyx-broken hover:border-nyx-broken/40 transition-colors duration-200"
                    >
                      TAMPER BLOCK
                    </button>
                  )}
                </div>

                {/* Connector to next block */}
                {i < chain.length - 1 && (
                  <BlockConnector targetBroken={nextBroken} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
