"use client";

import { useMemo, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { DataGrid, FilterButton } from "@/components/ui/DataGrid";
import { CertBadge } from "@/components/ui/StatusBadge";
import { certificates } from "@/lib/mock-data";
import type { CertStatus } from "@/lib/types";

export default function CertificatesPage() {
  const [status, setStatus] = useState<"all" | CertStatus>("all");
  const [showFilter, setShowFilter] = useState(false);

  const rows = useMemo(
    () => certificates.filter((c) => status === "all" || c.status === status),
    [status],
  );

  const valid = certificates.filter((c) => c.status === "有效").length;
  const soon = certificates.filter((c) => c.status === "即將到期").length;
  const expired = certificates.filter((c) => c.status === "已過期").length;

  return (
    <>
      <TopBar crumb="機械管理系統 / 證書及文件" title="證書及文件" showBack />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mb-5 grid grid-cols-4 gap-4">
          {[
            ["全部證書", certificates.length, "bg-[#111827]"],
            ["有效", valid, "bg-[#16a34a]"],
            ["即將到期", soon, "bg-[#d97706]"],
            ["已過期", expired, "bg-[#ef4444]"],
          ].map(([label, value, color]) => (
            <div key={String(label)} className="rounded-[10px] border border-[#e5e7eb] bg-white p-5">
              <div className="flex items-center justify-between text-sm text-[#6b7280]">
                {label}
                <span className={`h-2 w-2 rounded-full ${color}`} />
              </div>
              <div className="mt-2 text-[28px] font-bold">{value}</div>
            </div>
          ))}
        </div>

        <div className="mb-4 flex items-center justify-between">
          <div className="flex gap-2">
            {(["all", "有效", "即將到期", "已過期"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`rounded-lg px-4 py-2 text-[13px] ${
                  status === s
                    ? "border-[1.5px] border-[#16a34a] font-bold text-[#15803d]"
                    : "border border-[#e5e7eb] bg-white"
                }`}
              >
                {s === "all" ? "全部" : s}
              </button>
            ))}
          </div>
          <FilterButton onClick={() => setShowFilter((v) => !v)} />
        </div>

        {showFilter && (
          <div className="mb-4 rounded-[10px] border border-[#e5e7eb] bg-white p-4 text-sm text-[#6b7280]">
            複合篩選對接 Supabase <code>eq()</code> / <code>in()</code> / <code>gte()</code>。每日掃描到期日，提前 30 天寫入通知並以 Realtime 推送。
          </div>
        )}

        <DataGrid
          rows={rows}
          columns={[
            { key: "name", label: "證書名稱" },
            { key: "assetCode", label: "設備編號", width: "110px" },
            { key: "assetType", label: "設備類型", width: "110px" },
            { key: "type", label: "文件類型", width: "120px" },
            { key: "issueDate", label: "簽發日期", width: "120px" },
            { key: "expiryDate", label: "到期日", width: "120px" },
            { key: "reminder", label: "提醒", width: "120px" },
            {
              key: "status",
              label: "狀態",
              width: "110px",
              render: (r) => <CertBadge status={r.status} />,
            },
          ]}
        />
      </main>
    </>
  );
}
