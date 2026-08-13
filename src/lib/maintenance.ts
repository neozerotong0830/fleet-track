import type { MaintenanceRecord } from "@/lib/types";

export function isFilledOpenJob(r: MaintenanceRecord): boolean {
  if (r.status !== "未完成") return false;
  const hasContent = Boolean(r.description?.trim() || r.reason?.trim());
  const hasWork = r.totalHours > 0 || r.sessions.some((s) => s.hours > 0);
  return hasContent && hasWork;
}

export function findFilledOpenJob(records: MaintenanceRecord[], assetCode: string) {
  return records.find((r) => r.assetCode === assetCode && isFilledOpenJob(r)) ?? null;
}
