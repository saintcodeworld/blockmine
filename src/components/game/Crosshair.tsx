export function Crosshair() {
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-50">
      <div className="relative w-6 h-6">
        {/* Horizontal line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/80 -translate-y-1/2" />
        {/* Vertical line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/80 -translate-x-1/2" />
        {/* Center dot */}
        <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-primary rounded-full -translate-x-1/2 -translate-y-1/2" />
      </div>
    </div>
  );
}
