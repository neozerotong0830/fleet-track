"use client";

import { useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { DataGrid } from "@/components/ui/DataGrid";
import { inventoryItems, inventoryTxns } from "@/lib/mock-data";

export default function InventoryPage() {
  const [tab, setTab] = useState<"items" | "log">("items");
  const low = inventoryItems.filter((i) => i.quantity < i.minQuantity);

  return (
    <>
      <TopBar crumb="機械管理系統 / 零件庫存" title="零件及雜項庫存" showBack />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mb-5 grid grid-cols-3 gap-4">
          <div className="rounded-[10px] border border-[#e5e7eb] bg-white p-5">
            <div className="text-sm text-[#6b7280]">庫存品項</div>
            <div className="mt-2 text-[28px] font-bold">{inventoryItems.length}</div>
          </div>
          <div className="rounded-[10px] border border-[#e5e7eb] bg-white p-5">
            <div className="text-sm text-[#6b7280]">低於安全庫存</div>
            <div className="mt-2 text-[28px] font-bold text-[#dc2626]">{low.length}</div>
          </div>
          <div className="rounded-[10px] border border-[#e5e7eb] bg-white p-5">
            <div className="text-sm text-[#6b7280]">本月異動</div>
            <div className="mt-2 text-[28px] font-bold">{inventoryTxns.length}</div>
          </div>
        </div>

        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => setTab("items")}
            className={`rounded-lg px-4 py-2 text-sm ${tab === "items" ? "bg-[#16a34a] font-bold text-white" : "border border-[#e5e7eb] bg-white"}`}
          >
            庫存清單
          </button>
          <button
            type="button"
            onClick={() => setTab("log")}
            className={`rounded-lg px-4 py-2 text-sm ${tab === "log" ? "bg-[#16a34a] font-bold text-white" : "border border-[#e5e7eb] bg-white"}`}
          >
            異動日誌
          </button>
        </div>

        {tab === "items" ? (
          <DataGrid
            rows={inventoryItems}
            columns={[
              { key: "name", label: "名稱" },
              { key: "category", label: "分類", width: "120px" },
              { key: "sku", label: "SKU", width: "120px" },
              {
                key: "quantity",
                label: "數量",
                width: "100px",
                render: (r) => (
                  <span className={r.quantity < r.minQuantity ? "font-bold text-[#dc2626]" : "font-semibold"}>
                    {r.quantity} {r.unit}
                  </span>
                ),
              },
              { key: "minQuantity", label: "安全庫存", width: "100px" },
              { key: "location", label: "倉位" },
              {
                key: "kind",
                label: "類型",
                width: "90px",
                render: (r) => (r.kind === "part" ? "零件" : "雜項"),
              },
            ]}
          />
        ) : (
          <DataGrid
            rows={inventoryTxns}
            columns={[
              { key: "date", label: "日期", width: "120px" },
              { key: "itemName", label: "品項" },
              {
                key: "direction",
                label: "方向",
                width: "90px",
                render: (r) => (
                  <span className={r.direction === "in" ? "text-[#15803d]" : "text-[#dc2626]"}>
                    {r.direction === "in" ? "入庫" : "出庫"}
                  </span>
                ),
              },
              { key: "quantity", label: "數量", width: "90px" },
              { key: "note", label: "備註" },
            ]}
          />
        )}
      </main>
    </>
  );
}
