"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import type { SiteCluster } from "@/lib/map-sites";

export function PanToSite({ site }: { site: SiteCluster | null }) {
  const map = useMap();

  useEffect(() => {
    if (!site) return;
    map.panTo([site.lat, site.lng]);
  }, [map, site]);

  return null;
}
