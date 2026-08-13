"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Clock,
  FileWarning,
  MapPin,
  Wrench,
} from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { assets, certificates, maintenanceRecords } from "@/lib/mock-data";

export default function DashboardPage() {
  const running = assets.filter((a) => a.status === "使用中").length;
  const repairing = assets.filter((a) => a.status === "維修中").length;
  const idle = assets.filter((a) => a.status === "閒置").length;
  const expiring = certificates.filter((c) => c.status !== "有效");
  const openJobs = maintenanceRecords.filter((m) => m.status === "未完成");

  return (
    <>
      <TopBar crumb="機械管理系統 /" title="總覧" />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mb-6 grid grid-cols-4 gap-4">
          {[
            { label: "資產總數", value: assets.length, unit: "台", color: "bg-[#111827]" },
            { label: "運作中", value: running, unit: "台", color: "bg-[#16a34a]" },
            { label: "維修中", value: repairing, unit: "台", color: "bg-[#d97706]" },
            { label: "閒置", value: idle, unit: "台", color: "bg-[#6b7280]" },
          ].map((m) => (
            <div key={m.label} className="rounded-[10px] border border-[#e5e7eb] bg-white p-5">
              <div className="flex items-center justify-between text-sm text-[#6b7280]">
                {m.label}
                <span className={`h-2 w-2 rounded-full ${m.color}`} />
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-[28px] font-bold">{m.value}</span>
                <span className="text-sm text-[#6b7280]">{m.unit}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <section className="col-span-2 rounded-[10px] border border-[#e5e7eb] bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold">未完成維修</h2>
              <Link href="/maintenance" className="text-sm font-semibold text-[#16a34a]">
                查看全部
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              {openJobs.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-3 py-2.5"
                >
                  <div className="flex items-center gap-3">
                    <span className="rounded bg-[#dcfce7] px-2 py-0.5 text-[11px] font-bold text-[#15803d]">
                      {m.assetCode}
                    </span>
                    <span className="text-[13px] font-bold">{m.description}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[#6b7280]">
                    <span className="flex items-center gap-1">
                      <MapPin size={12} />
                      {m.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {m.totalHours} 小時
                    </span>
                    <span className="font-bold text-[#d97706]">{m.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[10px] border border-[#e5e7eb] bg-white p-5">
            <h2 className="mb-4 text-base font-bold">證書警報</h2>
            <div className="flex flex-col gap-2">
              {expiring.map((c) => (
                <div
                  key={c.id}
                  className={`rounded-lg border px-3 py-2.5 ${
                    c.status === "已過期"
                      ? "border-[#fecaca] bg-[#fef2f2]"
                      : "border-[#fde68a] bg-[#fff7ed]"
                  }`}
                >
                  <div className="flex items-center gap-2 text-[13px] font-extrabold">
                    {c.status === "已過期" ? (
                      <AlertTriangle size={14} className="text-[#dc2626]" />
                    ) : (
                      <FileWarning size={14} className="text-[#d97706]" />
                    )}
                    {c.assetCode} · {c.name}
                  </div>
                  <div className="mt-1 text-xs text-[#6b7280]">到期日 {c.expiryDate}</div>
                </div>
              ))}
            </div>
            <Link
              href="/certificates"
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#16a34a]"
            >
              前往證書管理
            </Link>
          </section>
        </div>

        <section className="mt-4 rounded-[10px] border border-[#e5e7eb] bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold">近期資產動態</h2>
            <Link href="/machinery" className="text-sm font-semibold text-[#16a34a]">
              機械設備
            </Link>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {assets.slice(0, 4).map((a) => (
              <Link
                key={a.code}
                href={`/assets/${a.code}`}
                className="overflow-hidden rounded-xl border border-[#e5e7eb]"
              >
                <div
                  className="h-24 bg-cover bg-center"
                  style={{ backgroundImage: `url(${a.photo})` }}
                />
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">{a.code}</span>
                    <StatusBadge status={a.status} />
                  </div>
                  <div className="mt-1 truncate text-xs text-[#6b7280]">{a.name}</div>
                  <div className="mt-2 flex items-center gap-1 text-xs text-[#6b7280]">
                    <Wrench size={12} />
                    {a.lastMaintenance}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
