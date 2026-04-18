"use client";

import { useEffect, useRef, useState } from "react";
import { useSSE } from "@/hooks/useSSE";
import type { Block } from "@/lib/api";

function fmtTs(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
  } catch { return iso; }
}

type EventMeta = { code: string; color: string; bgColor: string };

function parseEventMeta(data: string): EventMeta {
  const lower = data.toLowerCase();
  const pipe = data.indexOf("|");
  if (pipe > 0) {
    const name = lower.slice(0, pipe);
    if (name.includes("loan_disb") || name.includes("disburs"))
      return { code: "LOAN_DISB", color: "#C9A84C", bgColor: "rgba(201,168,76,0.08)" };
    if (name.includes("loan"))
      return { code: "LOAN",      color: "#C9A84C", bgColor: "rgba(201,168,76,0.08)" };
    if (name.includes("kyc"))
      return { code: "KYC",       color: "#D4A843", bgColor: "rgba(212,168,67,0.08)" };
    if (name.includes("fraud") || name.includes("frozen"))
      return { code: "FRAUD",     color: "#E03050", bgColor: "rgba(224,48,80,0.10)" };
    if (name.includes("repay"))
      return { code: "REPAY",     color: "#27C97F", bgColor: "rgba(39,201,127,0.08)" };
    if (name.includes("consent"))
      return { code: "CONSENT",   color: "#A78BFA", bgColor: "rgba(167,139,250,0.08)" };
    if (name.includes("cred"))
      return { code: "CREDIT",    color: "#7C3AED", bgColor: "rgba(124,58,237,0.10)" };
    if (name.includes("reg") || name.includes("report"))
      return { code: "REG_RPT",   color: "#D4A843", bgColor: "rgba(212,168,67,0.08)" };
    if (name.includes("data_access"))
      return { code: "DAR",       color: "#9A94C0", bgColor: "transparent" };
  }
  const colon = data.indexOf(":");
  if (colon > 0) {
    const type = data.slice(0, colon).toUpperCase();
    const map: Record<string, EventMeta> = {
      TXN:    { code: "TXN",    color: "#C9A84C", bgColor: "rgba(201,168,76,0.08)" },
      KYC:    { code: "KYC",    color: "#D4A843", bgColor: "rgba(212,168,67,0.08)" },
      LOGIN:  { code: "LOGIN",  color: "#7C3AED", bgColor: "rgba(124,58,237,0.10)" },
      ALERT:  { code: "ALERT",  color: "#E03050", bgColor: "rgba(224,48,80,0.10)" },
      CUSTOM: { code: "CUSTOM", color: "#9A94C0", bgColor: "transparent" },
    };
    return map[type] ?? { code: type.slice(0, 8), color: "#625D90", bgColor: "transparent" };
  }
  return { code: "EVT", color: "#3C3868", bgColor: "transparent" };
}

function EventRow({ block, flash }: { block: Block; flash: boolean }) {
  const meta = parseEventMeta(block.data);
  const displayData = (() => {
    const pipe = block.data.indexOf("|");
    if (pipe > 0) {
      try {
        const obj = JSON.parse(block.data.slice(pipe + 1));
        const parts: string[] = [];
        if (obj.actor_id) parts.push(obj.actor_id);
        if (obj.user_id)  parts.push(obj.user_id);
        if (obj.ref)      parts.push(obj.ref);
        if (obj.amount)   parts.push(`₹${Number(obj.amount).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`);
        if (obj.risk)     parts.push(`RISK:${obj.risk}`);
        return parts.slice(0, 4).join(" · ");
      } catch {
        return block.data.slice(pipe + 1, pipe + 80);
      }
    }
    return block.data;
  })();

  return (
    <div
      className="animate-feed-in flex items-center gap-3 sm:gap-4 px-4 py-2.5 transition-colors duration-200"
      style={{
        background: flash ? "rgba(201,168,76,0.05)" : "transparent",
        borderBottom: "1px solid rgba(28,24,56,0.5)",
      }}
    >
      <span className="mono-label text-nyx-dim w-16 flex-shrink-0">{fmtTs(block.timestamp)}</span>
      <span className="mono-label text-nyx-silver/70 w-16 flex-shrink-0">
        BLK-{String(block.index).padStart(4, "0")}
      </span>
      <span
        className="mono-label px-1.5 py-0.5 rounded-sm flex-shrink-0 w-24 text-center"
        style={{ color: meta.color, background: meta.bgColor }}
      >
        {meta.code}
      </span>
      <span className="font-mono text-xs text-nyx-silver/80 flex-1 truncate min-w-0">
        {displayData}
      </span>
      <span className="mono-label text-nyx-wire/60 flex-shrink-0 hidden lg:block">
        {block.hash.slice(0, 10)}…
      </span>
    </div>
  );
}

export function EventLog() {
  const { events, connected } = useSSE();
  const [flashIndex, setFlashIndex] = useState<number | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevLenRef    = useRef(0);
  const logRef        = useRef<HTMLDivElement>(null);
  const sorted        = [...events].reverse();

  useEffect(() => {
    if (events.length > prevLenRef.current) {
      const newest = events[events.length - 1];
      setFlashIndex(newest.index);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      flashTimerRef.current = setTimeout(() => setFlashIndex(null), 700);
      if (logRef.current) logRef.current.scrollTop = 0;
    }
    prevLenRef.current = events.length;
  }, [events]);

  return (
    <section
      id="events"
      className="py-14 pb-20"
      style={{
        background:
          "radial-gradient(ellipse 55% 40% at 50% 100%, rgba(124,58,237,0.06) 0%, transparent 55%)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <span className="mono-label text-nyx-accent">MISSION FEED</span>
          <div
            className="flex-1 h-px"
            style={{ background: "linear-gradient(90deg, rgba(201,168,76,0.25), transparent)" }}
          />
          <div className="flex items-center gap-2">
            <span
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${connected ? "bg-nyx-valid pulse-valid" : "bg-nyx-broken pulse-broken"}`}
            />
            <span className={`mono-label ${connected ? "text-nyx-valid" : "text-nyx-broken"}`}>
              {connected ? "SSE LIVE" : "RECONNECTING"}
            </span>
          </div>
          <span className="mono-label text-nyx-dim">{events.length.toLocaleString()} EVENTS</span>
        </div>

        <div
          className="rounded-sm overflow-hidden"
          style={{
            background: "rgba(9,7,28,0.70)",
            border: "1px solid rgba(44,40,80,0.8)",
            backdropFilter: "blur(24px)",
          }}
        >
          {/* Column headers */}
          <div
            className="flex items-center gap-3 sm:gap-4 px-4 py-2.5"
            style={{
              borderBottom: "1px solid rgba(44,40,80,0.9)",
              background: "rgba(13,10,36,0.5)",
            }}
          >
            <span className="mono-label text-nyx-wire w-16 flex-shrink-0">TIME</span>
            <span className="mono-label text-nyx-wire w-16 flex-shrink-0">BLOCK</span>
            <span className="mono-label text-nyx-wire w-24 flex-shrink-0">TYPE</span>
            <span className="mono-label text-nyx-wire flex-1 min-w-0">PAYLOAD</span>
            <span className="mono-label text-nyx-wire flex-shrink-0 hidden lg:block">HASH</span>
          </div>

          {/* Log body */}
          <div ref={logRef} className="max-h-[420px] overflow-y-auto">
            {sorted.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="mono-label text-nyx-dim">
                  {connected ? "AWAITING EVENTS" : "CONNECTING TO STREAM…"}
                </div>
                <p className="text-xs text-nyx-muted/40 text-center max-w-xs">
                  {connected
                    ? "Start the Python simulator to begin live event ingestion."
                    : "Ensure the Go backend is running on port 8080."}
                </p>
              </div>
            ) : (
              sorted.map((block) => (
                <EventRow key={block.index} block={block} flash={flashIndex === block.index} />
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
