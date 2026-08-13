import type { ProjectType, Company } from "./types";

export const PROJECT_TYPES: { code: ProjectType; label: string; desc: string }[] = [
  { code: "BP", label: "BP", desc: "Bored Pile 基樁" },
  { code: "DTH", label: "DTH", desc: "Down-the-hole 潛孔鑽" },
  { code: "SI", label: "SI", desc: "Site Investigation 地質勘探" },
  { code: "General", label: "General", desc: "General 常用一般設備" },
];

export const COMPANIES: Company[] = ["建榮", "鑽達", "永峰"];

export const NAV_ITEMS = [
  { href: "/", label: "總覧", icon: "LayoutDashboard" },
  { href: "/machinery", label: "機械設備", icon: "Truck" },
  { href: "/drilling", label: "鑽具設備", icon: "Drill" },
  { href: "/tools", label: "地盤工具", icon: "Wrench" },
  { href: "/electrical", label: "電器設備", icon: "Zap" },
  { href: "/map", label: "設備分佈地圖", icon: "MapPin" },
  { href: "/maintenance", label: "維修報表", icon: "BarChart2" },
  { href: "/certificates", label: "證書及文件", icon: "FileText" },
  { href: "/inventory", label: "零件庫存", icon: "Package" },
  { href: "/org", label: "部門組織圖", icon: "Users" },
] as const;

export const ENGINE_HOST_TYPES = ["CC", "SC", "TD", "AC"] as const;

export const ASSET_STATUSES = ["使用中", "閒置", "維修中", "報廢"] as const;

export const DAILY_HOUR_CAP = 10;

/** Demo signed-in technician until Auth is wired. */
export const CURRENT_USER_NAME = "陳家俊";

export function calcHours(startTime: string, endTime: string): number {
  if (!startTime || !endTime) return 0;
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  let mins = eh * 60 + em - (sh * 60 + sm);
  if (mins <= 0) mins += 24 * 60;
  return Math.round((mins / 60) * 10) / 10;
}
