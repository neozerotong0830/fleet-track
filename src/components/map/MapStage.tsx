"use client";

import { LandsMapCanvas } from "./LandsMapCanvas";
import { MapZoomControls } from "./MapZoomControls";
import { PanToSite } from "./PanToSite";
import { SiteMarker } from "./SiteMarker";
import type { SiteCluster } from "@/lib/map-sites";

export function MapStage({
  sites,
  selectedName,
  selected,
  onSelect,
}: {
  sites: SiteCluster[];
  selectedName: string | null;
  selected: SiteCluster | null;
  onSelect: (name: string) => void;
}) {
  return (
    <LandsMapCanvas className="h-full w-full">
      {sites.map((site) => (
        <SiteMarker
          key={site.name}
          site={site}
          selected={site.name === selectedName}
          onSelect={onSelect}
        />
      ))}
      <PanToSite site={selected} />
      <MapZoomControls />
    </LandsMapCanvas>
  );
}
