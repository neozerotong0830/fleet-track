export type ProjectType = "BP" | "DTH" | "SI" | "General";
export type Company = "建榮" | "鑽達" | "永峰";
export type AssetCategory = "machinery" | "drilling_tool" | "site_tool" | "electrical" | "engine";
export type AssetStatus = "使用中" | "閒置" | "維修中" | "報廢";
export type MaintenanceStatus = "已完成" | "未完成";
export type MaintenanceType = "突發維修" | "定期保養" | "預防性維修";
export type CertStatus = "有效" | "即將到期" | "已過期";

export type MachineryTypeCode = string;

export interface SpecField {
  key: string;
  label: string;
  unit: string;
}

export interface MachineryType {
  code: string;
  name: string;
  nameEn: string;
  photo: string;
  stock: number;
  running: number;
  status: "正常" | "注意";
  sortOrder: number;
  canHostEngine: boolean;
  specFields: SpecField[];
  accessoryCatalog: string[];
}

export interface Asset {
  id: string;
  code: string;
  name: string;
  category: AssetCategory;
  typeCode: string;
  typeLabel: string;
  typeLabelEn: string;
  model: string;
  manufacturer: string;
  serialNumber: string;
  year: number;
  projectType: ProjectType;
  company: Company;
  status: AssetStatus;
  location: string;
  lat: number;
  lng: number;
  weight: string;
  runningHours: number;
  lastMaintenance: string;
  photo: string;
  photos: string[];
  specs: Record<string, string>;
  engine?: EngineInfo;
  accessories: Accessory[];
  monthlyHours: number[];
}

export interface EngineInfo {
  id?: string;
  code: string;
  model: string;
  horsepower: string;
  displacement: string;
  fuelType: string;
  emission: string;
  hours: number;
  brand?: string;
  brandSlug?: string;
  modelId?: string;
  mountedHostId?: string;
  mountedHostCode?: string;
}

export interface EngineBrand {
  id: string;
  name: string;
  slug: string;
  modelCount: number;
  unitCount: number;
}

export interface EngineModel {
  id: string;
  brandId: string;
  brandName: string;
  brandSlug: string;
  name: string;
  horsepower: string;
  displacement: string;
  fuelType: string;
  emission: string;
  unitCount: number;
}

export interface EngineInstallEvent {
  id: string;
  action: string;
  hoursAtEvent: number;
  occurredAt: string;
  machineryCode: string;
}

export interface Accessory {
  name: string;
  installedAt: string;
  status: "正常" | "維修中";
}

export interface PhotoAlbum {
  id: string;
  note: string;
  createdAt: string;
  urls: string[];
  paths: string[];
}

export interface MaintenanceSession {
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
  technicians: string[];
  photos: string[];
}

export interface MaintenanceRecord {
  id: string;
  recordNo: string;
  date: string;
  assetCode: string;
  location: string;
  type: MaintenanceType;
  description: string;
  hours: number;
  totalHours: number;
  startTime: string;
  endTime: string;
  overtime: boolean;
  status: MaintenanceStatus;
  technicians: string[];
  reason?: string;
  parts?: string;
  photos: string[];
  sessions: MaintenanceSession[];
}

export interface Certificate {
  id: string;
  name: string;
  assetCode: string;
  assetType: string;
  type: string;
  issueDate: string;
  expiryDate: string;
  status: CertStatus;
  reminder: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: "expiry" | "fault" | "maintenance" | "info";
  isRead: boolean;
  time: string;
}

export interface StaffMember {
  id: string;
  name: string;
  title: string;
  team?: string;
  phone: string;
  email: string;
  managerId: string | null;
  avatar: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  sku?: string;
  quantity: number;
  minQuantity: number;
  unit: string;
  location: string;
  kind: "part" | "misc";
}

export interface InventoryTxn {
  id: string;
  itemName: string;
  direction: "in" | "out";
  quantity: number;
  note: string;
  date: string;
}
