"use client";

import Link from "next/link";
import type { AssetStatus } from "@/lib/types";
import type { SiteCluster } from "@/lib/map-sites";

const statusPill: Record<AssetStatus, { bg: string; text: string; label: string }> = {
  使用中: { bg: "bg-[#f0fdf4]", text: "text-[#16a34a]", label: "運作中" },
  維修中: { bg: "bg-[#fff7ed]", text: "text-[#ea580c]", label: "維修中" },
  閒置: { bg: "bg-[#f3f4f6]", text: "text-[#6b7280]", label: "閒置中" },
  報廢: { bg: "bg-[#fee2e2]", text: "text-[#dc2626]", label: "報廢" },
};

export function SiteInfoCard({
  site,
  showAll,
  onToggleAll,
}: {
  site: SiteCluster;
  showAll: boolean;
  onToggleAll: () => void;
}) {
  const rows = showAll ? site.assets : site.assets.slice(0, 2);

  return (
    <div className="w-[360px] rounded-xl border-[1.5px] border-[#16a34a] bg-white p-5 shadow-[0_8px_20px_rgba(17,24,39,0.15)]">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-extrabold text-[#111827]">{site.name}</h3>
        <span className="rounded bg-[#f0fdf4] px-2 py-0.5 text-xs font-bold text-[#1b7a4f]">選中站點</span>
      </div>
      <p className="mt-0.5 text-[13px] text-[#6b7280]">目前部署設備 {site.assets.length} 部</p>

      <div className="my-4 h-px bg-[#e5e7eb]" />

      <div className="flex justify-between">
        <Stat label="運作中" value={`${site.running} 台`} color="text-[#16a34a]" />
        <Stat label="維修中" value={`${site.repairing} 台`} color="text-[#ea580c]" />
        <Stat label="閒置中" value={`${site.idle} 台`} color="text-[#6b7280]" />
      </div>

      <div className="my-4 h-px bg-[#e5e7eb]" />

      <div className="text-xs font-bold text-[#111827]">
        設備抽樣清單 {showAll ? "" : "(最近異動)"}
      </div>
      <div className="mt-2.5 flex max-h-48 flex-col gap-2 overflow-auto">
        {rows.map((a) => {
          const pill = statusPill[a.status];
          return (
            <Link
              key={a.id}
              href={`/assets/${a.code}`}
              className="flex items-center justify-between gap-3"
            >
              <span className="w-[180px] truncate text-[13px] text-[#111827]">
                {a.code} {a.manufacturer} {a.model}
              </span>
              <span className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-semibold ${pill.bg} ${pill.text}`}>
                {pill.label}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={onToggleAll}
          className="text-[13px] font-bold text-[#16a34a]"
        >
          {showAll ? "收合清單" : `查看全部 ${site.assets.length} 台設備 →`}
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <div className="text-[11px] text-[#6b7280]">{label}</div>
      <div className={`text-base font-extrabold ${color}`}>{value}</div>
    </div>
  );
}
