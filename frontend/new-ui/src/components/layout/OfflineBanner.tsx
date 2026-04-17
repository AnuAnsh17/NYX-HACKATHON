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
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="status-broken border-b border-nyx-broken/30 px-6 py-2.5 text-center mono-label">
      Backend not connected. Start the Go server on port 8080.
    </div>
  );
}
