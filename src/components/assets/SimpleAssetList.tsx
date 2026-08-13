"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { FilterButton, DataGrid } from "@/components/ui/DataGrid";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { assetsByCategory } from "@/lib/mock-data";
import type { Asset } from "@/lib/types";

export function SimpleAssetList({
  title,
  crumb,
  category,
}: {
  title: string;
  crumb: string;
  category: Asset["category"];
}) {
  const all = assetsByCategory(category);
  const [q, setQ] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [status, setStatus] = useState("全部");
  const [company, setCompany] = useState("全部");

  const rows = useMemo(() => {
    return all.filter((a) => {
      if (status !== "全部" && a.status !== status) return false;
      if (company !== "全部" && a.company !== company) return false;
      const s = q.toLowerCase();
      return !s || a.code.toLowerCase().includes(s) || a.name.toLowerCase().includes(s) || a.location.includes(q);
    });
  }, [all, q, status, company]);

  return (
    <>
      <TopBar crumb={crumb} title={title} showBack />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mb-6 flex items-center justify-between rounded-[10px] border border-[#e5e7eb] bg-white p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-[280px] items-center gap-2 rounded-lg border border-[#e5e7eb] bg-[#f3f4f6] px-3.5">
              <Search size={16} className="text-[#6b7280]" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="搜尋編號、名稱或地點"
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
            <FilterButton onClick={() => setShowFilter((v) => !v)} />
          </div>
          <div className="text-sm text-[#6b7280]">共 {rows.length} 項 · 支援批量勾選</div>
        </div>

        {showFilter && (
          <div className="mb-4 grid grid-cols-3 gap-3 rounded-[10px] border border-[#e5e7eb] bg-white p-4">
            <label className="text-xs font-semibold text-[#6b7280]">
              狀態
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-[#e5e7eb] bg-[#f3f4f6] px-3 text-sm"
              >
                <option>全部</option>
                <option>使用中</option>
                <option>維修中</option>
                <option>閒置</option>
              </select>
            </label>
            <label className="text-xs font-semibold text-[#6b7280]">
              所屬公司
              <select
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-[#e5e7eb] bg-[#f3f4f6] px-3 text-sm"
              >
                <option>全部</option>
                <option>建榮</option>
                <option>鑽達</option>
                <option>永峰</option>
              </select>
            </label>
          </div>
        )}

        <DataGrid
          rows={rows}
          onRowClick={(row) => {
            window.location.href = `/assets/${row.code}`;
          }}
          columns={[
            {
              key: "code",
              label: "編號",
              width: "120px",
              render: (r) => (
                <Link href={`/assets/${r.code}`} className="font-semibold text-[#111827]">
                  {r.code}
                </Link>
              ),
            },
            { key: "name", label: "名稱" },
            { key: "model", label: "型號", width: "140px" },
            { key: "company", label: "公司", width: "100px" },
            { key: "location", label: "地點", width: "160px" },
            {
              key: "status",
              label: "狀態",
              width: "120px",
              render: (r) => <StatusBadge status={r.status} />,
            },
          ]}
        />
      </main>
    </>
  );
}
