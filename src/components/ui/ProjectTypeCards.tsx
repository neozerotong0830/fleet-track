"use client";

import { PROJECT_TYPES } from "@/lib/constants";
import { projectTypeCounts } from "@/lib/mock-data";
import { Drill, Wrench } from "lucide-react";

export function ProjectTypeCards({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (code: string | null) => void;
}) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-bold">工程類型分類</h2>
      <div className="grid grid-cols-4 gap-4">
        {PROJECT_TYPES.map((p) => {
          const active = selected === p.code;
          return (
            <button
              key={p.code}
              type="button"
              onClick={() => onSelect(active ? null : p.code)}
              className={`rounded-xl bg-white p-[18px] text-left ${
                active
                  ? "border-2 border-[#16a34a] shadow-[0_4px_10px_rgba(22,163,74,0.12)]"
                  : "border border-[#e5e7eb]"
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <span
                  className={`rounded-md px-2 py-1 text-xs font-bold ${
                    active ? "bg-[#f0fdf4] text-[#1b7a4f]" : "bg-[#f3f4f6] text-[#6b7280]"
                  }`}
                >
                  {p.label}
                </span>
                {p.code === "General" ? (
                  <Wrench size={20} className="text-[#9ca3af]" />
                ) : (
                  <Drill size={20} className="text-[#9ca3af]" />
                )}
              </div>
              <div className="text-[13px] text-[#6b7280]">{p.desc}</div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-[28px] font-extrabold">{projectTypeCounts[p.code]}</span>
                <span className="text-[13px] text-[#6b7280]">台設備</span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
