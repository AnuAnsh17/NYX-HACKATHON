export default function Loading() {
  return (
    <div className="min-h-screen bg-nyx-black flex items-center justify-center">
      <div className="text-center">
        <div className="font-display font-bold text-nyx-text text-3xl tracking-widest animate-pulse">
          NYX<span className="text-nyx-accent">/</span>DCL
        </div>
        <div className="mono-label text-nyx-dim mt-3">INITIALIZING...</div>
      </div>
    </div>
  );
}
