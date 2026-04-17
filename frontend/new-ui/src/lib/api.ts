export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export type Block = {
  index: number;
  timestamp: string;
  data: string;
  prev_hash: string;
  hash: string;
};

export type VerifyResult = {
  index: number;
  status: "VALID" | "BROKEN";
  expected_hash: string;
  stored_hash: string;
};

export type VerifyResponse = {
  valid: boolean;
  blocks: VerifyResult[];
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, init);
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(`Backend not connected (${detail})`);
  }
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = (await res.json()) as { error?: string };
      if (body && typeof body.error === "string") message = body.error;
    } catch {
      // body wasn't JSON — fall through with statusText
    }
    throw new Error(`HTTP ${res.status}: ${message}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function getChain(): Promise<Block[]> {
  return request<Block[]>("/chain");
}

export async function verify(): Promise<VerifyResponse> {
  return request<VerifyResponse>("/verify");
}

export async function tamperBlock(index: number): Promise<void> {
  await request<unknown>("/tamper", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ index }),
  });
}

export async function ingestEvent(data: string): Promise<Block> {
  return request<Block>("/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data }),
  });
}

export async function healthCheck(): Promise<{ chain_length: number }> {
  return request<{ chain_length: number }>("/healthz");
}
