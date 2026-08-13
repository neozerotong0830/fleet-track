import type { MaintenanceSession } from "@/lib/types";

export function SessionTimeline({
  sessions,
  totalHours,
  compact = false,
}: {
  sessions: MaintenanceSession[];
  totalHours?: number;
  compact?: boolean;
}) {
  const total = totalHours ?? sessions.reduce((s, x) => s + x.hours, 0);

  return (
    <div className={compact ? "mt-1.5 space-y-1" : "mt-2 space-y-1.5"}>
      {sessions.map((s, i) => (
        <div
          key={`${s.date}-${s.startTime}-${i}`}
          className={`flex flex-wrap items-center gap-x-3 gap-y-0.5 rounded-md ${
            compact ? "bg-transparent text-[12px]" : "bg-white/80 px-2.5 py-1.5 text-[12px]"
          } text-[#374151]`}
        >
          <span className="font-semibold text-[#111827]">
            第 {i + 1} 次 · {s.date}
          </span>
          <span>
            {s.startTime}–{s.endTime}
          </span>
          <span className="font-semibold">{s.hours} 小時</span>
          {s.technicians.length > 0 && (
            <span className="text-[#6b7280]">{s.technicians.join("、")}</span>
          )}
        </div>
      ))}
      <div className="text-[12px] font-bold text-[#92400e]">累計 {total} 小時 · {sessions.length} 日</div>
    </div>
  );
}
