"use client";

import { useEffect, useRef, useState } from "react";
import { API_BASE, type Block } from "@/lib/api";

const RECONNECT_DELAY_MS = 3000;

export function useSSE() {
  const [events, setEvents] = useState<Block[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const esRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const connect = () => {
      if (cancelled) return;

      let es: EventSource;
      try {
        es = new EventSource(`${API_BASE}/events`);
      } catch (err) {
        setConnected(false);
        setError(
          err instanceof Error ? err.message : "Failed to open event stream"
        );
        reconnectTimerRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
        return;
      }

      esRef.current = es;

      es.onopen = () => {
        if (cancelled) return;
        setConnected(true);
        setError(null);
      };

      es.onmessage = (ev) => {
        if (cancelled) return;
        try {
          const block = JSON.parse(ev.data) as Block;
          setEvents((prev) => [...prev, block]);
        } catch {
          // malformed frame — drop silently
        }
      };

      es.onerror = () => {
        if (cancelled) return;
        setConnected(false);
        setError("Backend not connected");
        es.close();
        esRef.current = null;
        reconnectTimerRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
      };
    };

    connect();

    return () => {
      cancelled = true;
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };
  }, []);

  return { events, connected, error };
}
