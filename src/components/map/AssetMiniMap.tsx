"use client";

import { LandsMapCanvas } from "./LandsMapCanvas";
import { AssetPin } from "./AssetPin";

export function AssetMiniMap({ lat, lng }: { lat: number; lng: number }) {
  return (
    <LandsMapCanvas
      className="h-full w-full"
      defaultCenter={{ lat, lng }}
      defaultZoom={14}
      interactive={false}
    >
      <AssetPin lat={lat} lng={lng} />
    </LandsMapCanvas>
  );
}
