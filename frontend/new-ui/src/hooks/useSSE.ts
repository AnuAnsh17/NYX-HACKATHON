"use client";

import { useSSEContext } from "@/providers/SSEProvider";

export function useSSE() {
  return useSSEContext();
}
