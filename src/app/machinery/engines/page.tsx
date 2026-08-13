"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { ENGINE_PHOTO, listAllEngineModels, listEngineBrands, listEngines } from "@/lib/supabase/engines";
import type { Asset, EngineBrand, EngineModel } from "@/lib/types";

const BRAND_ZH: Record<string, string> = {
  cummins: "康明斯",
  caterpillar: "卡特彼勒",
  cat: "卡特彼勒",
  "volvo-penta": "沃爾沃",
  volvo: "沃爾沃",
  mitsubishi: "三菱",
  yanmar: "洋馬",
  deutz: "道依茨",
};

export default function EngineManagementPage() {
  return (
    <Suspense
      fallback={
        <>
          <TopBar crumb="機械管理系統 / 機械設備 /" title="引擎管理 Engine Management" showBack />
          <main className="p-8 text-sm text-[#6b7280]">載入引擎管理…</main>
        </>
      }
    >
      <EngineManagementInner />
    </Suspense>
  );
}

function EngineManagementInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const brandQ = searchParams.get("brand") ?? "all";
  const [brands, setBrands] = useState<EngineBrand[]>([]);
  const [models, setModels] = useState<EngineModel[]>([]);
  const [units, setUnits] = useState<Asset[]>([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([listEngineBrands(), listAllEngineModels(), listEngines()])
      .then(([b, m, u]) => {
        setBrands(b);
        setModels(m);
        setUnits(u);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "載入失敗"));
  }, []);

  const selectedSlug = brandQ === "all" || !brands.some((b) => b.slug === brandQ) ? "all" : brandQ;
  const selectedBrand = brands.find((b) => b.slug === selectedSlug) ?? null;
  const totalUnits = brands.reduce((s, b) => s + b.unitCount, 0);

  const visibleModels = useMemo(() => {
    const s = q.trim().toLowerCase();
    return models.filter((m) => {
      if (selectedSlug !== "all" && m.brandSlug !== selectedSlug) return false;
      if (!s) return true;
      const unitHit = units.some(
        (u) =>
          u.engine?.modelId === m.id &&
          (u.code.toLowerCase().includes(s) || u.name.toLowerCase().includes(s)),
      );
      return (
        m.name.toLowerCase().includes(s) ||
        m.brandName.toLowerCase().includes(s) ||
        m.brandSlug.toLowerCase().includes(s) ||
        unitHit
      );
    });
  }, [models, units, selectedSlug, q]);

  function setBrand(slug: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (slug === "all") next.delete("brand");
    else next.set("brand", slug);
    const qs = next.toString();
    router.replace(qs ? `/machinery/engines?${qs}` : "/machinery/engines");
  }

  function stats(modelId: string) {
    const of = units.filter((u) => u.engine?.modelId === modelId);
    return {
      photo: of.find((u) => u.photo)?.photo || ENGINE_PHOTO,
      running: of.filter((u) => u.status === "使用中").length,
      repairing: of.filter((u) => u.status === "維修中").length,
      idle: of.filter((u) => u.status === "閒置").length,
    };
  }

  const headerCount = selectedBrand
    ? `${selectedBrand.modelCount} 款型號, ${selectedBrand.unitCount} 台引擎`
    : `${models.length} 款型號, ${totalUnits} 台引擎`;

  return (
    <>
      <TopBar crumb="機械管理系統 / 機械設備 /" title="引擎管理 Engine Management" showBack />
      <main className="flex-1 overflow-y-auto px-8 py-8">
        {error && <p className="mb-4 text-sm font-semibold text-[#dc2626]">{error}</p>}

        <h2 className="mb-3 text-sm font-bold text-[#111827]">引擎品牌篩選 Brand Filters</h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
          <button
            type="button"
            onClick={() => setBrand("all")}
            className={`w-[160px] shrink-0 overflow-hidden rounded-xl border bg-white text-left ${
              selectedSlug === "all" ? "border-2 border-[#16a34a] shadow-[0_4px_10px_rgba(22,163,74,0.12)]" : "border-[#e5e7eb]"
            }`}
          >
            <div className="flex h-[70px] items-center justify-center border-b border-[#e5e7eb] bg-[#f3f4f6] text-lg font-extrabold text-[#111827]">
              ALL
            </div>
            <div className="p-3">
              <div className="text-[15px] font-extrabold">All</div>
              <div className="text-xs text-[#4b5563]">全部</div>
              <div className="mt-2 w-fit rounded-md bg-[#f3f4f6] px-2 py-1 text-[11px] font-bold text-[#6b7280]">
                {totalUnits} 台
              </div>
            </div>
          </button>
          {brands.map((b) => {
            const active = selectedSlug === b.slug;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => setBrand(b.slug)}
                className={`w-[160px] shrink-0 overflow-hidden rounded-xl border bg-white text-left ${
                  active ? "border-2 border-[#16a34a] shadow-[0_4px_10px_rgba(22,163,74,0.12)]" : "border-[#e5e7eb]"
                }`}
              >
                <div className="flex h-[70px] items-center justify-center border-b border-[#e5e7eb] bg-[#f3f4f6] px-3 text-center text-sm font-extrabold text-[#111827]">
                  {b.name}
                </div>
                <div className="p-3">
                  <div className="truncate text-[15px] font-extrabold">{b.name}</div>
                  <div className="text-xs text-[#4b5563]">{BRAND_ZH[b.slug] ?? "引擎品牌"}</div>
                  <div
                    className={`mt-2 w-fit rounded-md px-2 py-1 text-[11px] font-bold ${
                      active ? "bg-[#f0fdf4] text-[#15803d]" : "bg-[#f3f4f6] text-[#6b7280]"
                    }`}
                  >
                    {b.unitCount} 台
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex h-11 items-center gap-2.5 rounded-lg border border-[#e5e7eb] bg-white px-3.5">
          <Search size={16} className="text-[#9ca3af]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜尋引擎型號、編號或品牌..."
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>

        <div className="mt-6 flex items-center justify-between">
          <h2 className="text-base font-bold text-[#111827]">
            {selectedBrand ? `${BRAND_ZH[selectedBrand.slug] ?? ""} ${selectedBrand.name}`.trim() : "全部引擎"}
            <span className="ml-2 text-sm font-normal text-[#9ca3af]">({headerCount})</span>
          </h2>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-5">
          {visibleModels.map((m) => {
            const st = stats(m.id);
            return (
              <Link
                key={m.id}
                href={`/machinery/engines/${m.brandSlug}/${encodeURIComponent(m.name)}`}
                className="overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.03)]"
              >
                <div className="h-[180px] bg-cover bg-center" style={{ backgroundImage: `url(${st.photo})` }} />
                <div className="flex flex-col gap-3 p-[18px]">
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate text-base font-bold">{m.brandName} {m.name}</div>
                    <span className="shrink-0 rounded bg-[#f3f4f6] px-2 py-0.5 text-[11px] font-bold text-[#4b5563]">
                      {m.brandName}
                    </span>
                  </div>
                  <div className="h-px bg-[#f3f4f6]" />
                  <div className="flex flex-col gap-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#9ca3af]">馬力 Horsepower</span>
                      <span className="font-semibold text-[#4b5563]">{m.horsepower || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#9ca3af]">排氣量 Displacement</span>
                      <span className="font-semibold text-[#4b5563]">{m.displacement || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#9ca3af]">燃料類型 Fuel</span>
                      <span className="font-semibold text-[#4b5563]">{m.fuelType || "—"}</span>
                    </div>
                  </div>
                  <div className="h-px bg-[#f3f4f6]" />
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-[10px] text-[#9ca3af]">總數 Total</div>
                      <div className="text-base font-extrabold">
                        {m.unitCount} <span className="text-[11px] font-normal text-[#9ca3af]">台</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 text-xs text-[#4b5563]">
                      {st.running > 0 && (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#16a34a]" />
                          運作: <b className="text-[#15803d]">{st.running} 台</b>
                        </span>
                      )}
                      {st.repairing > 0 && (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#eab308]" />
                          維修: <b className="text-[#92400e]">{st.repairing} 台</b>
                        </span>
                      )}
                      {st.idle > 0 && (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#6b7280]" />
                          閒置: <b className="text-[#6b7280]">{st.idle} 台</b>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
          {visibleModels.length === 0 && (
            <div className="col-span-3 rounded-2xl border border-[#e5e7eb] bg-white p-10 text-center text-sm text-[#6b7280]">
              沒有符合的引擎型號
            </div>
          )}
        </div>
      </main>
    </>
  );
}
