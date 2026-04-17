"use client";

import { useEffect, useRef, useState } from "react";
import { useSSE } from "@/hooks/useSSE";

function fmtTs(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  } catch {
    return iso;
  }
}

export function EventLog() {
  const { events, connected } = useSSE();
  const [flashIndex, setFlashIndex] = useState<number | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevLenRef = useRef(0);
  const logRef = useRef<HTMLDivElement>(null);

  const sorted = [...events].reverse();

  useEffect(() => {
    if (events.length > prevLenRef.current) {
      const newest = events[events.length - 1];
      setFlashIndex(newest.index);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      flashTimerRef.current = setTimeout(() => setFlashIndex(null), 600);
      if (logRef.current) logRef.current.scrollTop = 0;
    }
    prevLenRef.current = events.length;
  }, [events]);

  return (
    <section className="py-8 pb-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="glass border border-nyx-border rounded-sm p-6">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <span className="mono-label text-nyx-accent">EVENT STREAM</span>

            <div className="flex items-center gap-2">
              <span
                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  connected ? "bg-nyx-valid pulse-valid" : "bg-nyx-broken animate-pulse"
                }`}
              />
              <span
                className={`mono-label ${
                  connected ? "text-nyx-valid" : "text-nyx-broken"
                }`}
              >
                {connected ? "SSE CONNECTED" : "CONNECTING..."}
              </span>
            </div>

            <span className="mono-label text-nyx-muted">
              EVENTS: {events.length}
            </span>
          </div>

          {/* Log body */}
          <div
            ref={logRef}
            className="max-h-[400px] overflow-y-auto space-y-px"
          >
            {sorted.length === 0 ? (
              <p className="text-nyx-muted text-center text-sm py-12">
                {connected
                  ? "Waiting for events from backend... Start the Python simulator to begin."
                  : "Connecting to event stream..."}
              </p>
            ) : (
              sorted.map((block) => (
                <div
                  key={block.index}
                  className={`flex items-center gap-2 sm:gap-4 px-3 py-2 rounded-sm transition-colors duration-300 ${
                    flashIndex === block.index
                      ? "bg-nyx-valid/10"
                      : "hover:bg-nyx-surface/50"
                  }`}
                >
                  <span className="mono-label text-nyx-dim w-16 sm:w-24 flex-shrink-0 truncate">
                    {fmtTs(block.timestamp)}
                  </span>
                  <span className="mono-label text-nyx-accent w-16 sm:w-20 flex-shrink-0">
                    BLK-{block.index}
                  </span>
                  <span className="font-mono text-xs text-nyx-text flex-1 truncate min-w-0">
                    {block.data}
                  </span>
                  <span className="mono-label text-nyx-dim flex-shrink-0 hidden sm:block">
                    {block.hash.slice(0, 12)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
