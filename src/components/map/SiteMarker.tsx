"use client";

import { Marker } from "react-leaflet";
import L from "leaflet";
import { SITE_TONE_COLOR, siteTone, type SiteCluster } from "@/lib/map-sites";

export function SiteMarker({
  site,
  selected,
  onSelect,
}: {
  site: SiteCluster;
  selected: boolean;
  onSelect: (name: string) => void;
}) {
  const tone = siteTone(site);
  const colors = SITE_TONE_COLOR[tone];
  const icon = L.divIcon({
    className: "site-marker",
    html: `<div style="display:flex;flex-direction:column;align-items:center;cursor:pointer">
      <div style="border-radius:999px;padding:4px;background:${colors.halo}">
        <div style="display:flex;height:28px;width:28px;align-items:center;justify-content:center;border-radius:999px;border:2px solid #fff;color:#fff;font-size:13px;font-weight:700;box-shadow:0 4px 6px rgba(0,0,0,.15);background:${colors.fill}">${site.assets.length}</div>
      </div>
      <div style="margin-top:4px;border-radius:4px;background:rgba(17,24,39,.85);padding:2px 8px;font-size:11px;font-weight:500;color:#fff;white-space:nowrap">${escapeHtml(site.name)}</div>
    </div>`,
    iconSize: [140, 64],
    iconAnchor: [70, 20],
  });

  return (
    <Marker
      position={[site.lat, site.lng]}
      icon={icon}
      zIndexOffset={selected ? 200 : 0}
      eventHandlers={{ click: () => onSelect(site.name) }}
    />
  );
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
