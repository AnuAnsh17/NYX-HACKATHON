const STEPS = [
  {
    num: "01",
    title: "EVENT INGESTED",
    body: "Any event — loan, KYC, consent, fraud flag — arrives with actor metadata and is SHA-256 hashed against its predecessor. No event exists outside the chain.",
    detail: "H(i) = SHA256( i ‖ data ‖ H(i-1) ‖ ts )",
    accentColor: "#00D4B0",
  },
  {
    num: "02",
    title: "CHAIN LINKED",
    body: "Each block is cryptographically bound to the one before. The structure is append-only: no insertion, no deletion, no backdating. Every event is permanent.",
    detail: "Immutable · Append-only · Deterministic",
    accentColor: "#00D4B0",
  },
  {
    num: "03",
    title: "TAMPER DETECTED",
    body: "Re-compute every hash at verify time. A single changed byte causes a hash mismatch that cascades through every downstream block — the chain breaks visibly.",
    detail: "One breach → full cascade → instant verdict",
    accentColor: "#FF2D55",
  },
];

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

export function HowItWorks() {
  return (
    <section className="py-16 bg-nyx-dark border-y border-nyx-border">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center gap-4 mb-10">
          <span className="mono-label text-nyx-accent">HOW IT WORKS</span>
          <div className="flex-1 h-px bg-nyx-border" />
          <span className="mono-label text-nyx-dim">3-STEP PROOF PIPELINE</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
          {STEPS.map((step, i) => (
            <div key={step.num} className="flex flex-col md:flex-row">
              {/* Card */}
              <div className="relative flex-1 p-7 bg-nyx-card border border-nyx-border hover:border-nyx-accent/20 transition-colors duration-300 group">
                <CornerMarks color={step.accentColor} />

                {/* Step number — large background */}
                <div
                  className="absolute top-4 right-6 font-display font-black text-7xl pointer-events-none select-none"
                  style={{ color: step.accentColor, opacity: 0.04 }}
                  aria-hidden
                >
                  {step.num}
                </div>

                <span
                  className="mono-label font-bold text-sm"
                  style={{ color: step.accentColor }}
                >
                  {step.num}
                </span>

                <h3 className="font-display font-black text-nyx-text text-lg mt-3 mb-3 tracking-wide">
                  {step.title}
                </h3>

                <p className="text-sm text-nyx-muted leading-relaxed mb-5">
                  {step.body}
                </p>

                <div className="glass rounded-sm px-3 py-2 self-start inline-block">
                  <code className="font-mono text-[10px] text-nyx-silver">
                    {step.detail}
                  </code>
                </div>
              </div>

              {/* Arrow connector between steps */}
              {i < STEPS.length - 1 && (
                <div className="hidden md:flex items-center justify-center w-0 relative z-10">
                  <div className="absolute flex items-center justify-center w-7 h-7 rounded-full bg-nyx-dark border border-nyx-wire">
                    <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
                      <path
                        d="M0 0 L8 6 L0 12"
                        stroke="rgba(0,212,176,0.5)"
                        strokeWidth="1.5"
                      />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom label */}
        <div className="mt-8 text-center mono-label text-nyx-dim">
          If one byte changes anywhere — the entire chain breaks. That&apos;s the proof.
        </div>
      </div>
    </section>
  );
}
