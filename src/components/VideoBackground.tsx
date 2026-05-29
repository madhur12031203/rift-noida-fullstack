export default function VideoBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-[#0a0f1a]">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(2,6,23,0.98))]" />
        <div 
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(148,163,184,0.24) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.24) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        <div className="absolute inset-x-0 top-0 h-px bg-white/10" />
      </div>
    </div>
  );
}
