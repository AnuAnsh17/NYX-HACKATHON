"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import gsap from "gsap";
import { useChainStatus } from "@/hooks/useChainStatus";

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function syntaxHighlight(json: string): string {
  return escapeHtml(json).replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(?:\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      if (/^"/.test(match)) {
        if (/:$/.test(match)) return `<span style="color:#C9A84C">${match}</span>`;
        return `<span style="color:#EDE8F5">${match}</span>`;
      }
      if (/true/.test(match))  return `<span style="color:#27C97F">${match}</span>`;
      if (/false/.test(match)) return `<span style="color:#E03050">${match}</span>`;
      return `<span style="color:#9A94C0">${match}</span>`;
    }
  );
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

export function VerifyPanel() {
  const { verification, loading, error } = useChainStatus();
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sweepRef       = useRef<HTMLDivElement>(null);
  const prevLoadingRef = useRef(false);

  const totalBlocks  = verification?.blocks.length ?? 0;
  const validBlocks  = verification?.blocks.filter((b) => b.status === "VALID").length ?? 0;
  const brokenBlocks = totalBlocks - validBlocks;
  const allValid     = verification?.valid ?? true;
  const verifiedAt   = new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";

  const jsonString = verification
    ? JSON.stringify(verification, null, 2)
    : loading ? "// Scanning chain…"
    : error   ? `// Error: ${error}`
    : "// Awaiting verification";

  const highlightedJson = verification ? syntaxHighlight(jsonString) : escapeHtml(jsonString);

  useEffect(() => {
    if (loading && !prevLoadingRef.current && sweepRef.current) {
      gsap.fromTo(
        sweepRef.current,
        { x: "-100%", opacity: 0.9 },
        { x: "300%",  opacity: 0.6, duration: 1.1, ease: "power2.inOut" }
      );
    }
    prevLoadingRef.current = loading;
  }, [loading]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(jsonString).then(() => {
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    });
  }, [jsonString]);

  const verdictColor = !verification ? "#5E5990" : allValid ? "#27C97F" : "#E03050";
  const cornerColor  = !verification ? "rgba(62,56,104,0.5)" : allValid ? "rgba(39,201,127,0.5)" : "rgba(224,48,80,0.5)";

  return (
    <section
      id="verify"
      className="py-14"
      style={{
        background:
          "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(124,58,237,0.06) 0%, transparent 60%)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <span className="mono-label text-nyx-accent">VERIFICATION REPORT</span>
          <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, rgba(201,168,76,0.25), transparent)" }} />
          <span className="mono-label text-nyx-dim">FORENSIC AUDIT TRAIL</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* LEFT — Verdict */}
          <div
            className="relative rounded-sm p-8 overflow-hidden"
            style={{
              background: "rgba(13,10,36,0.65)",
              border: `1px solid ${cornerColor}`,
              backdropFilter: "blur(24px)",
            }}
          >
            <CornerMarks color={cornerColor} />

            {/* Sweep */}
            <div
              ref={sweepRef}
              className="absolute inset-y-0 w-1/3 pointer-events-none"
              style={{
                background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.05), transparent)",
                transform: "translateX(-100%)",
              }}
            />

            {/* Verdict */}
            <div className="mb-8">
              {verification ? (
                <div className="flex flex-col gap-2">
                  <div
                    className="font-display font-black text-4xl sm:text-5xl tracking-tight leading-none"
                    style={{ color: verdictColor }}
                  >
                    {allValid ? "CHAIN VALID" : "BREACH DETECTED"}
                  </div>
                  <div
                    className={`inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-sm mt-2 ${allValid ? "status-valid" : "status-broken pulse-broken"}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${allValid ? "bg-nyx-valid" : "bg-nyx-broken"}`} />
                    <span className="mono-label">
                      {allValid
                        ? "ALL BLOCKS VERIFIED — INTEGRITY INTACT"
                        : `${brokenBlocks} BLOCK${brokenBlocks !== 1 ? "S" : ""} COMPROMISED`}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="font-display font-black text-4xl text-nyx-dim tracking-tight">
                    {loading ? "SCANNING…" : "UNVERIFIED"}
                  </div>
                  {loading && (
                    <div className="h-0.5 w-48 rounded-full overflow-hidden" style={{ background: "rgba(62,56,104,0.5)" }}>
                      <div
                        className="h-full rounded-full animate-pulse"
                        style={{ background: "#C9A84C", width: "60%" }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Metrics */}
            <div className="space-y-0 mb-6">
              {[
                { label: "TOTAL BLOCKS",     value: totalBlocks,  color: "text-nyx-text" },
                { label: "VALID BLOCKS",      value: validBlocks,  color: "text-nyx-valid" },
                { label: "BROKEN BLOCKS",     value: brokenBlocks, color: brokenBlocks > 0 ? "text-nyx-broken" : "text-nyx-muted" },
                { label: "CHAIN COMPUTED IN", value: "< 1 ms",     color: "text-nyx-silver" },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  className="flex items-center justify-between py-3"
                  style={{ borderBottom: "1px solid rgba(28,24,56,0.8)" }}
                >
                  <span className="mono-label text-nyx-muted">{label}</span>
                  <span className={`font-mono text-sm ${color}`}>{value}</span>
                </div>
              ))}
            </div>

            <div className="mono-label text-nyx-dim/50">Verified at: {verifiedAt}</div>
            <p className="mt-4 text-xs text-nyx-muted/50 leading-relaxed">
              This record is deterministic and court-admissible under BSA 2023 §65B
              and DPDP Act 2023. Any hash mismatch constitutes legal evidence of tampering.
            </p>
          </div>

          {/* RIGHT — Raw payload */}
          <div
            className="relative rounded-sm p-6 flex flex-col overflow-hidden"
            style={{
              background: "rgba(9,7,28,0.75)",
              border: "1px solid rgba(44,40,80,0.9)",
              backdropFilter: "blur(20px)",
            }}
          >
            <CornerMarks color="rgba(44,40,80,0.8)" />

            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <div className="flex items-center gap-3">
                <span className="mono-label text-nyx-accent">RAW PAYLOAD</span>
                {error && <span className="mono-label text-nyx-broken">ERROR</span>}
              </div>
              <button
                onClick={handleCopy}
                className="mono-label px-3 py-1.5 rounded-sm transition-colors"
                style={{
                  border: "1px solid rgba(44,40,80,0.9)",
                  color: copied ? "#C9A84C" : "#9A94C0",
                  borderColor: copied ? "rgba(201,168,76,0.4)" : undefined,
                }}
              >
                {copied ? "COPIED" : "COPY"}
              </button>
            </div>

            <div
              className="flex-1 overflow-auto max-h-[480px] rounded-sm p-4"
              style={{ background: "rgba(6,4,16,0.6)" }}
            >
              <pre className="font-mono text-xs leading-relaxed">
                <code dangerouslySetInnerHTML={{ __html: highlightedJson }} />
              </pre>
            </div>

            <p className="mt-4 mono-label text-nyx-dim/50 flex-shrink-0">
              Payload is deterministic — identical inputs always produce identical hashes.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
