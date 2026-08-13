import type { Asset } from "@/lib/types";

export type SiteTone = "green" | "orange" | "gray";

export type SiteCluster = {
  name: string;
  lat: number;
  lng: number;
  assets: Asset[];
  running: number;
  repairing: number;
  idle: number;
};

export function groupAssetsBySite(assets: Asset[]): SiteCluster[] {
  const buckets = new Map<string, Asset[]>();
  for (const a of assets) {
    const name = a.location.trim() || "未指定工地";
    const list = buckets.get(name) ?? [];
    list.push(a);
    buckets.set(name, list);
  }

  return [...buckets.entries()]
    .map(([name, list]) => {
      const lat = list.reduce((sum, a) => sum + a.lat, 0) / list.length;
      const lng = list.reduce((sum, a) => sum + a.lng, 0) / list.length;
      return {
        name,
        lat,
        lng,
        assets: [...list].sort(byRecent),
        running: list.filter((a) => a.status === "使用中").length,
        repairing: list.filter((a) => a.status === "維修中").length,
        idle: list.filter((a) => a.status === "閒置").length,
      };
    })
    .sort((a, b) => b.assets.length - a.assets.length);
}

export function siteTone(site: SiteCluster): SiteTone {
  if (site.repairing > 0) return "orange";
  if (site.running === 0 && site.idle > 0) return "gray";
  return "green";
}

export const SITE_TONE_COLOR: Record<SiteTone, { fill: string; halo: string }> = {
  green: { fill: "#16A34A", halo: "rgba(22, 163, 74, 0.25)" },
  orange: { fill: "#EA580C", halo: "rgba(234, 88, 12, 0.25)" },
  gray: { fill: "#6B7280", halo: "rgba(107, 114, 128, 0.25)" },
};

function byRecent(a: Asset, b: Asset) {
  return parseMaint(b.lastMaintenance) - parseMaint(a.lastMaintenance);
}

function parseMaint(value: string) {
  if (!value || value === "—") return 0;
  const t = Date.parse(value.replaceAll("/", "-"));
  return Number.isFinite(t) ? t : 0;
}
