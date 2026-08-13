"use client";

import { Mail, Phone } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { staff } from "@/lib/mock-data";
import type { StaffMember } from "@/lib/types";

function PersonCard({
  person,
  size = "md",
}: {
  person: StaffMember;
  size?: "lg" | "md" | "sm";
}) {
  if (size === "lg") {
    return (
      <div className="w-[220px] overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
        <div className="h-1 bg-[#16a34a]" />
        <div className="flex flex-col items-center gap-3 p-4">
          <img src={person.avatar} alt="" className="h-12 w-12 rounded-full object-cover" />
          <div className="text-center">
            <div className="text-[15px] font-bold">{person.name}</div>
            <div className="text-xs font-medium text-[#6b7280]">{person.title}</div>
          </div>
          <div className="flex w-full justify-center gap-2 border-t border-[#e5e7eb] pt-3">
            <a href={`tel:${person.phone}`} className="rounded-md bg-[#f0fdf4] p-1.5">
              <Phone size={14} className="text-[#16a34a]" />
            </a>
            <a href={`mailto:${person.email}`} className="rounded-md bg-[#f0fdf4] p-1.5">
              <Mail size={14} className="text-[#16a34a]" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (size === "md") {
    return (
      <div className="flex w-[190px] overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        <div className="w-1 bg-[#16a34a]" />
        <div className="flex items-center gap-2.5 p-3">
          <img src={person.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
          <div>
            {person.team && (
              <span className="rounded bg-[#f0fdf4] px-1.5 py-0.5 text-[9px] font-bold text-[#1b7a4f]">
                {person.team}
              </span>
            )}
            <div className="text-sm font-bold">{person.name}</div>
            <div className="text-[11px] text-[#6b7280]">{person.title}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-[160px] items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white p-2.5 shadow-[0_1px_4px_rgba(0,0,0,0.01)]">
      <img src={person.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
      <div>
        <div className="text-[13px] font-bold">{person.name}</div>
        <div className="text-[11px] text-[#6b7280]">{person.title}</div>
      </div>
    </div>
  );
}

export default function OrgPage() {
  const root = staff.find((s) => !s.managerId)!;
  const managers = staff.filter((s) => s.managerId === root.id);
  const byManager = (id: string) => staff.filter((s) => s.managerId === id);

  return (
    <>
      <TopBar crumb="機械管理系統 / 系統設定 /" title="部門架構" showBack />
      <main className="flex-1 overflow-y-auto px-12 py-8">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold">部門架構圖</h1>
            <p className="mt-1.5 text-sm text-[#6b7280]">機械部組織架構・共 {staff.length} 人</p>
          </div>
          <div className="flex gap-3">
            <button type="button" className="rounded-lg border border-[#e5e7eb] px-4 py-2.5 text-sm font-semibold">
              編輯架構
            </button>
            <button type="button" className="rounded-lg bg-[#16a34a] px-4 py-2.5 text-sm font-semibold text-white">
              + 新增成員
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-[#e5e7eb] bg-white px-6 py-10">
          <div className="flex flex-col items-center">
            <PersonCard person={root} size="lg" />
            <div className="h-10 w-[1.5px] bg-[#cbd5e1]" />
            <div className="h-[1.5px] w-[1100px] max-w-full bg-[#cbd5e1]" />
            <div className="flex w-full justify-center gap-12">
              {managers.map((m) => {
                const reports = byManager(m.id);
                return (
                  <div key={m.id} className="flex flex-col items-center">
                    <div className="h-10 w-[1.5px] bg-[#cbd5e1]" />
                    <PersonCard person={m} size="md" />
                    <div className="h-10 w-[1.5px] bg-[#cbd5e1]" />
                    <div className="h-[1.5px] w-[344px] bg-[#cbd5e1]" />
                    <div className="flex gap-6 pt-10">
                      {reports.map((r) => (
                        <PersonCard key={r.id} person={r} size="sm" />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
