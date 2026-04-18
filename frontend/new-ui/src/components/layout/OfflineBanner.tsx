"use client";

import { useEffect, useState } from "react";
import { healthCheck } from "@/lib/api";

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        await healthCheck();
        if (!cancelled) setOffline(false);
      } catch {
        if (!cancelled) setOffline(true);
      }
    };
    check();
    const id = setInterval(check, 5000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed top-14 inset-x-0 z-40 flex items-center justify-center gap-3 px-6 py-2.5 bg-nyx-broken-dim/60 border-b border-nyx-broken/30 backdrop-blur-md">
      {/* Pulsing dot */}
      <span className="w-1.5 h-1.5 rounded-full bg-nyx-broken flex-shrink-0 pulse-broken" />
      <span className="mono-label text-nyx-broken">
        BACKEND OFFLINE — start Go server on port 8080
      </span>
      <span className="mono-label text-nyx-broken/50 hidden sm:block">
        · go run main.go
      </span>
    </div>
  );
}
