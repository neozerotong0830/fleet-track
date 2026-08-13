import type { AssetStatus, CertStatus, MaintenanceStatus } from "@/lib/types";

const assetMap: Record<AssetStatus, { bg: string; dot: string; text: string; label: string }> = {
  使用中: { bg: "bg-[#f0fdf4]", dot: "bg-[#16a34a]", text: "text-[#15803d]", label: "運作中" },
  閒置: { bg: "bg-[#f3f4f6]", dot: "bg-[#6b7280]", text: "text-[#374151]", label: "閒置" },
  維修中: { bg: "bg-[#fefce8]", dot: "bg-[#eab308]", text: "text-[#854d0e]", label: "維修中" },
  報廢: { bg: "bg-[#fee2e2]", dot: "bg-[#ef4444]", text: "text-[#dc2626]", label: "報廢" },
};

const maintMap: Record<MaintenanceStatus, { bg: string; text: string }> = {
  已完成: { bg: "bg-[#dcfce7]", text: "text-[#15803d]" },
  未完成: { bg: "bg-[#fef3c7]", text: "text-[#d97706]" },
};

const certMap: Record<CertStatus, { bg: string; text: string }> = {
  有效: { bg: "bg-[#dcfce7]", text: "text-[#15803d]" },
  即將到期: { bg: "bg-[#fef3c7]", text: "text-[#d97706]" },
  已過期: { bg: "bg-[#fee2e2]", text: "text-[#dc2626]" },
};

export function StatusBadge({ status }: { status: AssetStatus }) {
  const s = assetMap[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${s.bg}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      <span className={`text-xs font-bold ${s.text}`}>{s.label}</span>
    </span>
  );
}

export function MaintenanceBadge({ status }: { status: MaintenanceStatus }) {
  const s = maintMap[status];
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${s.bg} ${s.text}`}>
      {status}
    </span>
  );
}

export function CertBadge({ status }: { status: CertStatus }) {
  const s = certMap[status];
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${s.bg} ${s.text}`}>
      {status}
    </span>
  );
}
