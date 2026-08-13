"use client";

import dynamic from "next/dynamic";

const loading = () => <div className="h-full w-full bg-[#e5e7eb]" />;

export const LandsMapView = dynamic(
  () => import("./LandsMapCanvas").then((m) => m.LandsMapCanvas),
  { ssr: false, loading },
);

export const MapStage = dynamic(() => import("./MapStage").then((m) => m.MapStage), {
  ssr: false,
  loading,
});

export const AssetMiniMap = dynamic(
  () => import("./AssetMiniMap").then((m) => m.AssetMiniMap),
  { ssr: false, loading },
);
