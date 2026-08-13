"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { MapStage } from "@/components/map/LandsMapView";
import { SiteInfoCard } from "@/components/map/SiteInfoCard";
import { listMachinery } from "@/lib/supabase/assets";
import { listMachineryTypes } from "@/lib/supabase/types-catalog";
import { groupAssetsBySite } from "@/lib/map-sites";
import type { Asset, MachineryType } from "@/lib/types";

export default function MapPage() {
  return (
    <Suspense fallback={<MapShell />}>
      <MapPageInner />
    </Suspense>
  );
}

function MapShell({ children }: { children?: React.ReactNode }) {
  return (
    <>
      <TopBar crumb="機械管理系統 / 機械設備 /" title="設備地圖分布 (香港)" showBack />
      {children ?? <main className="flex-1 bg-white" />}
    </>
  );
}

function MapPageInner() {
  const searchParams = useSearchParams();
  const siteQuery = searchParams.get("site");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [types, setTypes] = useState<MachineryType[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedName, setSelectedName] = useState<string | null>(siteQuery);
  const [showAll, setShowAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listMachinery(), listMachineryTypes()])
      .then(([list, catalog]) => {
        if (cancelled) return;
        setAssets(list);
        setTypes(catalog);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "載入失敗");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (siteQuery) setSelectedName(siteQuery);
  }, [siteQuery]);

  const filtered = useMemo(
    () => (typeFilter === "all" ? assets : assets.filter((a) => a.typeCode === typeFilter)),
    [assets, typeFilter],
  );

  const sites = useMemo(() => groupAssetsBySite(filtered), [filtered]);
  const selected = sites.find((s) => s.name === selectedName) ?? null;

  const totals = useMemo(
    () => ({
      stock: filtered.length,
      running: filtered.filter((a) => a.status === "使用中").length,
      repairing: filtered.filter((a) => a.status === "維修中").length,
      idle: filtered.filter((a) => a.status === "閒置").length,
    }),
    [filtered],
  );

  function selectSite(name: string) {
    setSelectedName(name);
    setShowAll(false);
  }

  return (
    <MapShell>
      <main className="flex min-h-0 flex-1 overflow-hidden bg-white">
        <section className="relative min-w-0 flex-1 p-6">
          <div className="relative h-full overflow-hidden rounded-2xl border border-[#e5e7eb]">
            <MapStage
              sites={sites}
              selectedName={selectedName}
              selected={selected}
              onSelect={selectSite}
            />
            {selected && (
              <div className="pointer-events-none absolute inset-0 z-20 p-6">
                <div className="pointer-events-auto absolute top-6 right-16 max-h-[calc(100%-3rem)] overflow-auto">
                  <SiteInfoCard
                    site={selected}
                    showAll={showAll}
                    onToggleAll={() => setShowAll((v) => !v)}
                  />
                </div>
              </div>
            )}
            {error && (
              <div className="absolute top-4 left-4 rounded-lg bg-white px-3 py-2 text-sm text-red-600 shadow">
                {error}
              </div>
            )}
          </div>
        </section>

        <aside className="flex w-[480px] shrink-0 flex-col gap-6 overflow-auto border-l border-[#e5e7eb] p-6">
          <div>
            <h2 className="text-lg font-extrabold text-[#111827]">工地總覽</h2>
            <p className="text-[13px] text-[#6b7280]">
              目前共管理 {sites.length} 個地盤・{totals.running} 部運作中設備
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <StatBox label="總設備庫存" value={`${totals.stock} 台`} />
            <StatBox label="運作中" value={`${totals.running} 台`} valueClass="text-[#16a34a]" boxClass="bg-[#f0fdf4]" />
            <StatBox label="維修申報" value={`${totals.repairing} 台`} valueClass="text-[#ea580c]" boxClass="bg-[#fff7ed]" />
            <StatBox label="閒置停機" value={`${totals.idle} 台`} valueClass="text-[#6b7280]" boxClass="bg-[#f3f4f6]" />
          </div>

          <div className="h-px bg-[#e5e7eb]" />

          <div className="flex min-h-0 flex-1 flex-col gap-3">
            <h3 className="text-sm font-bold text-[#111827]">地盤分布列表</h3>
            <div className="flex flex-col">
              {sites.map((site) => {
                const active = site.name === selectedName;
                return (
                  <button
                    key={site.name}
                    type="button"
                    onClick={() => selectSite(site.name)}
                    className={`flex items-center justify-between border-b border-[#e5e7eb] px-4 py-4 text-left ${
                      active ? "border-l-4 border-l-[#16a34a] bg-[#f0fdf4]" : "border-l-4 border-l-transparent"
                    }`}
                  >
                    <div>
                      <div className="text-sm font-bold text-[#111827]">{site.name}</div>
                      <div className="mt-1 flex items-center gap-2">
                        <LegendDot color="#16a34a" label={`運作 ${site.running}`} />
                        {site.repairing > 0 && <LegendDot color="#ea580c" label={`維修 ${site.repairing}`} />}
                        {site.idle > 0 && <LegendDot color="#6b7280" label={`閒置 ${site.idle}`} />}
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[13px] font-bold ${
                        active ? "bg-[#16a34a] text-white" : "bg-[#f3f4f6] text-[#111827]"
                      }`}
                    >
                      {site.assets.length} 台
                    </span>
                  </button>
                );
              })}
              {sites.length === 0 && (
                <p className="px-4 py-8 text-center text-sm text-[#6b7280]">沒有符合條件的工地</p>
              )}
            </div>
          </div>

          <div className="h-px bg-[#e5e7eb]" />

          <div>
            <h3 className="mb-3 text-[13px] font-bold text-[#111827]">依設備種類過濾</h3>
            <div className="flex flex-wrap gap-2">
              <FilterChip active={typeFilter === "all"} onClick={() => setTypeFilter("all")}>
                全部
              </FilterChip>
              {types.map((t) => (
                <FilterChip key={t.code} active={typeFilter === t.code} onClick={() => setTypeFilter(t.code)}>
                  {t.name}
                </FilterChip>
              ))}
            </div>
          </div>
        </aside>
      </main>
    </MapShell>
  );
}

function StatBox({
  label,
  value,
  valueClass = "text-[#111827]",
  boxClass = "bg-white",
}: {
  label: string;
  value: string;
  valueClass?: string;
  boxClass?: string;
}) {
  return (
    <div className={`rounded-lg border border-[#e5e7eb] p-4 ${boxClass}`}>
      <div className="text-xs text-[#6b7280]">{label}</div>
      <div className={`mt-1 text-2xl font-extrabold ${valueClass}`}>{value}</div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-[#6b7280]">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md px-3.5 py-2 text-[13px] ${
        active
          ? "bg-[#16a34a] font-bold text-white"
          : "border border-[#e5e7eb] bg-[#f3f4f6] font-medium text-[#111827]"
      }`}
    >
      {children}
    </button>
  );
}
