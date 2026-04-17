"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getChain,
  verify,
  type Block,
  type VerifyResponse,
} from "@/lib/api";

type Options = {
  pollMs?: number | false;
};

const DEFAULT_POLL_MS = 5000;

export function useChainStatus(options?: Options) {
  const pollMs =
    options?.pollMs === false
      ? null
      : options?.pollMs ?? DEFAULT_POLL_MS;

  const [chain, setChain] = useState<Block[]>([]);
  const [verification, setVerification] = useState<VerifyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [c, v] = await Promise.all([getChain(), verify()]);
      setChain(c);
      setVerification(v);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load chain");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    if (!pollMs) return;
    const id = setInterval(refresh, pollMs);
    return () => clearInterval(id);
  }, [refresh, pollMs]);

  return { chain, verification, loading, error, refresh };
}
