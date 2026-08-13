"use client";

import type { ReactNode } from "react";
import { MapContainer } from "react-leaflet";
import { HK_CENTER } from "@/lib/landsd-map";
import { LandsDBasemap } from "./LandsDBasemap";
import { LandsDCredit } from "./LandsDCredit";
import "leaflet/dist/leaflet.css";

export function LandsMapCanvas({
  children,
  className,
  defaultCenter = HK_CENTER,
  defaultZoom = 11,
  interactive = true,
}: {
  children?: ReactNode;
  className?: string;
  defaultCenter?: { lat: number; lng: number };
  defaultZoom?: number;
  interactive?: boolean;
}) {
  return (
    <div className={`relative z-0 h-full w-full ${className ?? ""}`}>
      <MapContainer
        center={[defaultCenter.lat, defaultCenter.lng]}
        zoom={defaultZoom}
        minZoom={10}
        maxZoom={19}
        zoomControl={false}
        attributionControl={false}
        dragging={interactive}
        scrollWheelZoom={interactive}
        doubleClickZoom={interactive}
        touchZoom={interactive}
        style={{ height: "100%", width: "100%" }}
      >
        <LandsDBasemap />
        {children}
      </MapContainer>
      <LandsDCredit />
    </div>
  );
}
