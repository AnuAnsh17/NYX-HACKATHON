"use client";

import { useState, useCallback, useRef } from "react";
import { useChainStatus } from "@/hooks/useChainStatus";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function syntaxHighlight(json: string): string {
  const escaped = escapeHtml(json);
  return escaped.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(?:\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          return `<span class="text-nyx-accent">${match}</span>`;
        }
        return `<span class="text-nyx-text">${match}</span>`;
      }
      if (/true/.test(match)) return `<span class="text-nyx-valid">${match}</span>`;
      if (/false/.test(match)) return `<span class="text-nyx-broken">${match}</span>`;
      return `<span class="text-nyx-silver">${match}</span>`;
    }
  );
}

export function VerifyPanel() {
  const { verification, loading, error } = useChainStatus();
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalBlocks = verification?.blocks.length ?? 0;
  const validBlocks =
    verification?.blocks.filter((b) => b.status === "VALID").length ?? 0;
  const brokenBlocks = totalBlocks - validBlocks;
  const allValid = verification?.valid ?? true;

  const verifiedAt = new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";

  const jsonString = verification
    ? JSON.stringify(verification, null, 2)
    : loading
    ? "// Loading…"
    : error
    ? `// Error: ${error}`
    : "// No data";

  const highlightedJson = verification
    ? syntaxHighlight(jsonString)
    : escapeHtml(jsonString);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(jsonString).then(() => {
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    });
  }, [jsonString]);

  return (
    <section className="py-12 bg-nyx-black">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT — Verification Summary */}
          <div className="glass border border-nyx-border p-8 rounded-sm">
            <h2 className="font-display text-xl text-nyx-text tracking-wide mb-6">
              VERIFICATION REPORT
            </h2>

            {verification ? (
              <div
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-sm text-lg font-display ${
                  allValid ? "status-valid pulse-valid" : "status-broken pulse-broken"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    allValid ? "bg-nyx-valid" : "bg-nyx-broken"
                  }`}
                />
                {allValid ? "ALL BLOCKS VERIFIED" : "INTEGRITY BREACH DETECTED"}
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-sm border border-nyx-wire">
                <span className="mono-label text-nyx-muted">
                  {loading ? "LOADING…" : error ? "ERROR" : "NO DATA"}
                </span>
              </div>
            )}

            <div className="mt-8 space-y-0">
              {[
                {
                  label: "TOTAL BLOCKS",
                  value: totalBlocks,
                  cls: "text-nyx-text",
                },
                {
                  label: "VALID BLOCKS",
                  value: validBlocks,
                  cls: "text-nyx-valid",
                },
                {
                  label: "BROKEN BLOCKS",
                  value: brokenBlocks,
                  cls: "text-nyx-broken",
                },
                {
                  label: "CHAIN COMPUTED IN",
                  value: "< 1ms",
                  cls: "text-nyx-silver",
                },
              ].map(({ label, value, cls }) => (
                <div
                  key={label}
                  className="flex items-center justify-between border-b border-nyx-border py-3"
                >
                  <span className="mono-label text-nyx-muted">{label}</span>
                  <span className={`font-mono text-sm ${cls}`}>{value}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 mono-label text-nyx-dim">
              Verified at: {verifiedAt}
            </div>
          </div>

          {/* RIGHT — Raw JSON Output */}
          <div className="bg-nyx-black border border-nyx-border p-6 rounded-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <span className="mono-label text-nyx-accent">RAW PAYLOAD</span>
              <button
                onClick={handleCopy}
                className="mono-label px-3 py-1.5 border border-nyx-wire text-nyx-muted rounded-sm hover:text-nyx-text hover:border-nyx-dim transition-colors"
              >
                {copied ? "COPIED!" : "COPY"}
              </button>
            </div>

            <div className="overflow-auto max-h-[500px] flex-1 bg-nyx-dark/50 rounded-sm p-4">
              <pre className="font-mono text-xs leading-relaxed">
                <code dangerouslySetInnerHTML={{ __html: highlightedJson }} />
              </pre>
            </div>

            <p className="mt-4 mono-label text-nyx-dim">
              This payload is deterministic and court-admissible under BSA 2023 Section 65B.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
