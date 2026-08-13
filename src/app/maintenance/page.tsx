"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { DataGrid } from "@/components/ui/DataGrid";
import { MaintenanceBadge } from "@/components/ui/StatusBadge";
import { NewMaintenanceModal } from "@/components/maintenance/NewMaintenanceModal";
import { SessionTimeline } from "@/components/maintenance/SessionTimeline";
import { CURRENT_USER_NAME } from "@/lib/constants";
import { isFilledOpenJob } from "@/lib/maintenance";
import { assets, maintenanceRecords as seed } from "@/lib/mock-data";
import { insertMaintenanceRecord } from "@/lib/supabase/engines";
import type { MaintenanceRecord } from "@/lib/types";

function todaySlash() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}/${m}/${day}`;
}

export default function MaintenancePage() {
  const [open, setOpen] = useState(false);
  const [continueFrom, setContinueFrom] = useState<MaintenanceRecord | null>(null);
  const [rows, setRows] = useState<MaintenanceRecord[]>(seed);
  const [type, setType] = useState("全部");
  const [status, setStatus] = useState("全部");
  const [scope, setScope] = useState<"all" | "mine">("all");
  const [page, setPage] = useState(1);

  const scopedRows = useMemo(() => {
    if (scope === "all") return rows;
    return rows.filter(
      (r) =>
        r.technicians.includes(CURRENT_USER_NAME) ||
        r.sessions.some((s) => s.technicians.includes(CURRENT_USER_NAME)),
    );
  }, [rows, scope]);

  const filtered = useMemo(() => {
    return scopedRows.filter((r) => {
      if (type !== "全部" && r.type !== type) return false;
      if (status !== "全部" && r.status !== status) return false;
      return true;
    });
  }, [scopedRows, type, status]);

  const hours = filtered.reduce((s, r) => s + r.totalHours, 0);
  const done = filtered.filter((r) => r.status === "已完成").length;
  const openCount = filtered.filter((r) => r.status === "未完成").length;

  const pageSize = 10;
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));

  function openContinue(job: MaintenanceRecord) {
    setContinueFrom(job);
    setOpen(true);
  }

  return (
    <>
      <TopBar crumb="機械管理系統 / 維修報表" title="維修報表" showBack />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mb-5 flex items-center justify-between rounded-[10px] border border-[#2d5a3e] bg-[#1b3a2d] p-6">
          <div>
            <span className="rounded-full bg-[#16a34a] px-2.5 py-1.5 text-xs font-extrabold text-white">
              🔧 FIELD REPAIR FLOW
            </span>
            <h2 className="mt-2.5 text-xl font-extrabold text-white">把報修寫成一個清晰的工作流程</h2>
            <p className="mt-1 text-[13px] text-[#9ca3af]">
              未完成任務可隔日接續，工時跨日自動累加直至標記已完成。
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setContinueFrom(null);
              setOpen(true);
            }}
            className="rounded-[10px] bg-[#16a34a] px-[22px] py-3.5 text-base font-extrabold text-white"
          >
            + 新增報修
          </button>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-2 rounded-[10px] border border-[#e5e7eb] bg-white p-1.5">
          {(
            [
              ["all", "全部維修紀錄"],
              ["mine", "個人維修紀錄"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setScope(id);
                setPage(1);
              }}
              className={`rounded-lg py-3 text-sm font-bold ${
                scope === id ? "bg-[#16a34a] text-white" : "bg-transparent text-[#6b7280] hover:bg-[#f3f4f6]"
              }`}
            >
              {label}
              {id === "mine" ? ` · ${CURRENT_USER_NAME}` : ""}
            </button>
          ))}
        </div>

        {scope === "mine" && scopedRows.some(isFilledOpenJob) && (
          <div className="mb-5 rounded-[10px] border border-[#fde68a] bg-[#fff7ed] p-4">
            <div className="mb-2 text-sm font-bold text-[#92400e]">未完成任務卡片 · 可接續</div>
            <div className="flex flex-col gap-3">
              {scopedRows
                .filter(isFilledOpenJob)
                .map((job) => (
                  <div key={job.id} className="rounded-lg border border-[#fde68a] bg-white px-3 py-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-[13px]">
                        <b>{job.recordNo}</b> · {job.assetCode}
                        <span className="ml-2 text-[#6b7280]">{job.description}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => openContinue(job)}
                        className="shrink-0 rounded-md bg-[#d97706] px-3 py-1.5 text-xs font-bold text-white"
                      >
                        接續
                      </button>
                    </div>
                    <SessionTimeline sessions={job.sessions} totalHours={job.totalHours} />
                  </div>
                ))}
            </div>
          </div>
        )}

        <div className="mb-5 rounded-[10px] border border-[#e5e7eb] bg-white p-5">
          <div className="grid grid-cols-4 gap-4">
            {[
              ["日期範圍", "2026/01/01 - 2026/01/20"],
              ["設備類別", "全部"],
              ["維修類型", type],
              ["狀態", status],
            ].map(([label, value], i) => (
              <label key={label} className="text-xs font-semibold text-[#6b7280]">
                {label}
                {i === 2 ? (
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="mt-1.5 flex h-10 w-full items-center justify-between rounded-lg border border-[#e5e7eb] bg-[#f3f4f6] px-3.5 text-sm font-normal text-[#374151]"
                  >
                    <option>全部</option>
                    <option>突發維修</option>
                    <option>定期保養</option>
                    <option>預防性維修</option>
                  </select>
                ) : i === 3 ? (
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="mt-1.5 flex h-10 w-full items-center justify-between rounded-lg border border-[#e5e7eb] bg-[#f3f4f6] px-3.5 text-sm font-normal text-[#374151]"
                  >
                    <option>全部</option>
                    <option>已完成</option>
                    <option>未完成</option>
                  </select>
                ) : (
                  <div className="mt-1.5 flex h-10 items-center rounded-lg border border-[#e5e7eb] bg-[#f3f4f6] px-3.5 text-sm font-normal text-[#374151]">
                    {value}
                  </div>
                )}
              </label>
            ))}
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-lg border border-[#e5e7eb] bg-[#f3f4f6] px-4 py-2.5 text-sm font-semibold"
            >
              <Download size={14} />
              匯出報表
            </button>
            <button type="button" className="rounded-lg bg-[#16a34a] px-6 py-2.5 text-sm font-semibold text-white">
              搜尋
            </button>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-3 gap-4">
          {[
            ["本月總維修小時", hours.toFixed(1), "小時", "bg-[#111827]"],
            ["已完成", String(done), "次", "bg-[#16a34a]"],
            ["未完成", String(openCount), "次", "bg-[#d97706]"],
          ].map(([label, value, unit, color]) => (
            <div key={label} className="rounded-[10px] border border-[#e5e7eb] bg-white p-5">
              <div className="flex items-center justify-between text-sm text-[#6b7280]">
                {label}
                <span className={`h-2 w-2 rounded-full ${color}`} />
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-[28px] font-bold">{value}</span>
                <span className="text-sm text-[#6b7280]">{unit}</span>
              </div>
            </div>
          ))}
        </div>

        <DataGrid
          rows={pageRows}
          getRowKey={(r) => r.id}
          renderExpanded={(r) =>
            r.status === "未完成" ? (
              <SessionTimeline sessions={r.sessions} totalHours={r.totalHours} compact />
            ) : null
          }
          columns={[
            {
              key: "recordNo",
              label: "維修編號",
              width: "140px",
              render: (r) => <span className="font-semibold text-[#111827]">{r.recordNo}</span>,
            },
            { key: "date", label: "最近日期", width: "110px" },
            {
              key: "assetCode",
              label: "設備編號",
              width: "110px",
              render: (r) => <span className="font-semibold">{r.assetCode}</span>,
            },
            { key: "location", label: "地點", width: "130px" },
            {
              key: "technicians",
              label: "維修人員",
              width: "140px",
              render: (r) => r.technicians.join("、"),
            },
            { key: "description", label: "維修內容" },
            {
              key: "totalHours",
              label: "累計小時",
              width: "120px",
              render: (r) =>
                `${r.totalHours} 小時${r.sessions.length > 1 ? ` / ${r.sessions.length} 日` : ""}${
                  r.overtime ? " · 加班" : ""
                }`,
            },
            {
              key: "status",
              label: "狀態",
              width: "140px",
              render: (r) => (
                <div className="flex items-center gap-2">
                  <MaintenanceBadge status={r.status} />
                  {isFilledOpenJob(r) && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openContinue(r);
                      }}
                      className="text-[11px] font-bold text-[#d97706]"
                    >
                      接續
                    </button>
                  )}
                </div>
              ),
            },
          ]}
        />

        <div className="mt-4 flex items-center justify-between rounded-[10px] border border-[#e5e7eb] bg-white px-6 py-3">
          <span className="text-[13px] text-[#6b7280]">
            顯示 {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filtered.length)} / 共 {filtered.length} 項
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-md border border-[#e5e7eb] px-2 py-2"
            >
              ‹
            </button>
            {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPage(n)}
                className={`rounded-md px-3 py-1.5 text-[13px] ${
                  n === page ? "bg-[#16a34a] font-bold text-white" : "border border-[#e5e7eb]"
                }`}
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              className="rounded-md border border-[#e5e7eb] px-2 py-2"
            >
              ›
            </button>
          </div>
        </div>
      </main>

      <NewMaintenanceModal
        open={open}
        continueFrom={continueFrom}
        records={rows}
        onClose={() => {
          setOpen(false);
          setContinueFrom(null);
        }}
        onSubmit={(payload) => {
          const date = payload.date.replaceAll("-", "/") || todaySlash();
          const location = assets.find((a) => a.code === payload.assetCode)?.location ?? "前線填報";
          const session = {
            date,
            startTime: payload.startTime,
            endTime: payload.endTime,
            hours: payload.hours,
            technicians: payload.technicians,
            photos: payload.photos,
          };

          void insertMaintenanceRecord({
            assetCode: payload.assetCode,
            date,
            hours: payload.hours,
            overtime: payload.overtime,
            description: payload.description || payload.reason,
            type: payload.type,
            location,
            status: payload.status,
            parts: payload.parts,
            reason: payload.reason,
          }).catch(() => undefined);

          if (payload.continueFromId) {
            setRows((prev) =>
              prev.map((r) => {
                if (r.id !== payload.continueFromId) return r;
                const allTechs = Array.from(new Set([...r.technicians, ...payload.technicians]));
                return {
                  ...r,
                  date,
                  description: payload.description || r.description,
                  reason: payload.reason || r.reason,
                  parts: payload.parts || r.parts,
                  hours: payload.hours,
                  totalHours: r.totalHours + payload.hours,
                  startTime: payload.startTime,
                  endTime: payload.endTime,
                  overtime: r.overtime || payload.overtime,
                  status: payload.status,
                  technicians: allTechs,
                  photos: [...r.photos, ...payload.photos],
                  sessions: [...r.sessions, session],
                };
              }),
            );
            return;
          }

          const next: MaintenanceRecord = {
            id: String(Date.now()),
            recordNo: `MR-2026-${String(156 + rows.length).padStart(4, "0")}`,
            date,
            assetCode: payload.assetCode,
            location,
            type: payload.type,
            description: payload.description || payload.reason,
            hours: payload.hours,
            totalHours: payload.hours,
            startTime: payload.startTime,
            endTime: payload.endTime,
            overtime: payload.overtime,
            status: payload.status,
            technicians: payload.technicians,
            reason: payload.reason,
            parts: payload.parts,
            photos: payload.photos,
            sessions: [session],
          };
          setRows((prev) => [next, ...prev]);
        }}
      />
    </>
  );
}
