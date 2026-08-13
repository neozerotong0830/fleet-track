"use client";

export function LandsDCredit() {
  return (
    <div className="pointer-events-none absolute bottom-2 left-2 z-[1000] flex items-center gap-2 rounded-md bg-white/90 px-2 py-1 shadow-sm">
      <img
        src="https://www.map.gov.hk/gm/res/logo/landsd.png"
        alt="地政總署"
        className="h-6 w-auto"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />
      <span className="text-[10px] font-medium text-[#374151]">Map from Lands Department</span>
    </div>
  );
}
