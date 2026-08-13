"use client";

import { Marker } from "react-leaflet";
import L from "leaflet";

const icon = L.divIcon({
  className: "asset-pin",
  html: `<div style="border-radius:999px;background:rgba(22,163,74,.25);padding:4px">
    <div style="height:16px;width:16px;border-radius:999px;border:2px solid #fff;background:#16a34a;box-shadow:0 4px 6px rgba(0,0,0,.15)"></div>
  </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

export function AssetPin({ lat, lng }: { lat: number; lng: number }) {
  return <Marker position={[lat, lng]} icon={icon} interactive={false} />;
}
