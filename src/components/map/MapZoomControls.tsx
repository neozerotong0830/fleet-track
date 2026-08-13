"use client";

import { useMap } from "react-leaflet";

export function MapZoomControls() {
  const map = useMap();

  function bump(delta: number) {
    map.setZoom(map.getZoom() + delta);
  }

  return (
    <div className="absolute right-3 bottom-3 z-[1000] flex flex-col gap-2 rounded-lg border border-[#e5e7eb] bg-white p-2 shadow-[0_4px_10px_rgba(0,0,0,0.08)]">
      <button
        type="button"
        onClick={() => bump(1)}
        className="flex h-8 w-8 items-center justify-center rounded bg-[#f3f4f6] text-lg font-extrabold text-[#111827]"
        aria-label="放大"
      >
        +
      </button>
      <button
        type="button"
        onClick={() => bump(-1)}
        className="flex h-8 w-8 items-center justify-center rounded bg-[#f3f4f6] text-lg font-extrabold text-[#111827]"
        aria-label="縮小"
      >
        −
      </button>
    </div>
  );
}
