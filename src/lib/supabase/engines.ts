import { ENGINE_HOST_TYPES } from "@/lib/constants";
import type {
  Asset,
  AssetStatus,
  Company,
  EngineBrand,
  EngineInfo,
  EngineInstallEvent,
  EngineModel,
  MaintenanceRecord,
  MaintenanceStatus,
  MaintenanceType,
  ProjectType,
} from "@/lib/types";
import { getSupabase } from "./client";

export const ENGINE_PHOTO =
  "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=1200&q=80";

export type EngineInput = {
  code: string;
  name: string;
  modelId: string;
  serialNumber: string;
  year: number;
  company: Company;
  projectType: ProjectType;
  status: AssetStatus;
  location: string;
  weight: string;
  runningHours: number;
  photo: string;
};

function requireClient() {
  const sb = getSupabase();
  if (!sb) throw new Error("尚未設定 Supabase 連線");
  return sb;
}

function toDbProject(p: ProjectType): string {
  return p === "General" ? "general" : p;
}

function fromDbProject(p: string | null | undefined): ProjectType {
  if (p === "general" || p === "General") return "General";
  if (p === "BP" || p === "DTH" || p === "SI") return p;
  return "General";
}

function parseWeight(weight: string): number | null {
  const n = parseFloat(weight.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

type ModelEmbed = {
  id: string;
  name: string;
  horsepower: string | null;
  displacement: string | null;
  fuel_type: string | null;
  emission_standard: string | null;
  brand_id: string;
  engine_brands?: { id: string; name: string; slug: string } | { id: string; name: string; slug: string }[] | null;
};

function brandOf(m: ModelEmbed | null) {
  const b = m?.engine_brands;
  if (!b) return null;
  return Array.isArray(b) ? b[0] ?? null : b;
}

export async function listEngineHostTypes(): Promise<string[]> {
  const sb = requireClient();
  const { data, error } = await sb.from("engine_host_types").select("type_code");
  if (error || !data?.length) return [...ENGINE_HOST_TYPES];
  return data.map((r: { type_code: string }) => r.type_code);
}

export function isEngineHostType(typeCode: string, hosts: string[]) {
  return hosts.includes(typeCode.toUpperCase());
}

export async function listEngineBrands(): Promise<EngineBrand[]> {
  const sb = requireClient();
  const { data: brands, error } = await sb.from("engine_brands").select("*").order("name");
  if (error) throw error;
  const { data: models } = await sb.from("engine_models").select("id, brand_id");
  const { data: engines } = await sb.from("engines").select("model_id");
  const modelIdsByBrand = new Map<string, string[]>();
  for (const m of models ?? []) {
    const list = modelIdsByBrand.get(m.brand_id) ?? [];
    list.push(m.id);
    modelIdsByBrand.set(m.brand_id, list);
  }
  const countByModel = new Map<string, number>();
  for (const e of engines ?? []) {
    if (!e.model_id) continue;
    countByModel.set(e.model_id, (countByModel.get(e.model_id) ?? 0) + 1);
  }
  return (brands ?? []).map((b: { id: string; name: string; slug: string }) => {
    const mids = modelIdsByBrand.get(b.id) ?? [];
    return {
      id: b.id,
      name: b.name,
      slug: b.slug,
      modelCount: mids.length,
      unitCount: mids.reduce((s, id) => s + (countByModel.get(id) ?? 0), 0),
    };
  });
}

export async function getEngineBrand(slug: string): Promise<EngineBrand | null> {
  const all = await listEngineBrands();
  return all.find((b) => b.slug === slug) ?? null;
}

export async function listEngineModels(brandSlug: string): Promise<EngineModel[]> {
  const sb = requireClient();
  const { data: brand, error: bErr } = await sb.from("engine_brands").select("*").eq("slug", brandSlug).maybeSingle();
  if (bErr) throw bErr;
  if (!brand) return [];
  const { data: models, error } = await sb.from("engine_models").select("*").eq("brand_id", brand.id).order("name");
  if (error) throw error;
  const { data: engines } = await sb.from("engines").select("model_id");
  const countByModel = new Map<string, number>();
  for (const e of engines ?? []) {
    if (!e.model_id) continue;
    countByModel.set(e.model_id, (countByModel.get(e.model_id) ?? 0) + 1);
  }
  return (models ?? []).map((m) => ({
    id: String(m.id),
    brandId: brand.id as string,
    brandName: brand.name as string,
    brandSlug: brand.slug as string,
    name: String(m.name),
    horsepower: String(m.horsepower ?? ""),
    displacement: String(m.displacement ?? ""),
    fuelType: String(m.fuel_type ?? ""),
    emission: String(m.emission_standard ?? ""),
    unitCount: countByModel.get(String(m.id)) ?? 0,
  }));
}

export async function getEngineModel(brandSlug: string, modelName: string): Promise<EngineModel | null> {
  const models = await listEngineModels(brandSlug);
  const decoded = decodeURIComponent(modelName);
  return models.find((m) => m.name === decoded || m.name.toLowerCase() === decoded.toLowerCase()) ?? null;
}

export async function listAllEngineModels(): Promise<EngineModel[]> {
  const brands = await listEngineBrands();
  const groups = await Promise.all(brands.map((b) => listEngineModels(b.slug)));
  return groups.flat();
}

function mapEngineAsset(row: {
  id: string;
  code: string;
  name: string | null;
  company: string;
  status: string;
  location: string;
  lat: number | null;
  lng: number | null;
  photo_url: string | null;
  engineering_type: string;
  engines?: Record<string, unknown> | Record<string, unknown>[] | null;
}): Asset {
  const raw = row.engines;
  const e = (Array.isArray(raw) ? raw[0] : raw) as
    | {
        running_hours?: number;
        serial_number?: string;
        manufacture_year?: number;
        weight?: number;
        model?: string;
        horsepower?: string;
        displacement?: string;
        fuel_type?: string;
        emission_standard?: string;
        mounted_on?: string;
        model_id?: string;
        engine_models?: ModelEmbed | ModelEmbed[] | null;
      }
    | undefined;
  const modelEmbed = e?.engine_models
    ? Array.isArray(e.engine_models)
      ? e.engine_models[0]
      : e.engine_models
    : null;
  const brand = brandOf(modelEmbed ?? null);
  const photo = row.photo_url || ENGINE_PHOTO;
  const hours = Number(e?.running_hours ?? 0);
  const engine: EngineInfo = {
    id: row.id,
    code: row.code,
    model: modelEmbed?.name || e?.model || "",
    horsepower: modelEmbed?.horsepower || e?.horsepower || "",
    displacement: modelEmbed?.displacement || e?.displacement || "",
    fuelType: modelEmbed?.fuel_type || e?.fuel_type || "",
    emission: modelEmbed?.emission_standard || e?.emission_standard || "",
    hours,
    brand: brand?.name,
    brandSlug: brand?.slug,
    modelId: modelEmbed?.id || e?.model_id,
    mountedHostId: e?.mounted_on ?? undefined,
  };
  return {
    id: row.id,
    code: row.code,
    name: row.name ?? row.code,
    category: "engine",
    typeCode: "EN",
    typeLabel: "引擎",
    typeLabelEn: "Engine",
    model: engine.model,
    manufacturer: engine.brand ?? "",
    serialNumber: e?.serial_number ?? "",
    year: e?.manufacture_year ?? 0,
    projectType: fromDbProject(row.engineering_type),
    company: (row.company as Company) || "建榮",
    status: (row.status as AssetStatus) || "閒置",
    location: row.location ?? "",
    lat: row.lat ?? 22.3193,
    lng: row.lng ?? 114.1694,
    weight: e?.weight != null ? `${e.weight} t` : "",
    runningHours: hours,
    lastMaintenance: "—",
    photo,
    photos: [photo],
    specs: {},
    engine,
    accessories: [],
    monthlyHours: [],
  };
}

const ENGINE_SELECT =
  "*, engines!engines_asset_id_fkey(*, engine_models(*, engine_brands(*)))";

export async function listEngines(modelId?: string): Promise<Asset[]> {
  const sb = requireClient();
  const { data, error } = await sb
    .from("assets")
    .select(ENGINE_SELECT)
    .eq("category", "engine")
    .neq("status", "報廢")
    .order("code");
  if (error) throw error;
  let rows = ((data ?? []) as Parameters<typeof mapEngineAsset>[0][]).map(mapEngineAsset);
  if (modelId) rows = rows.filter((a) => a.engine?.modelId === modelId);
  const hostIds = rows.map((r) => r.engine?.mountedHostId).filter(Boolean) as string[];
  if (hostIds.length) {
    const { data: hosts } = await sb.from("assets").select("id, code").in("id", hostIds);
    const map = new Map((hosts ?? []).map((h: { id: string; code: string }) => [h.id, h.code]));
    rows = rows.map((r) => {
      const hid = r.engine?.mountedHostId;
      if (!hid || !r.engine) return r;
      return { ...r, engine: { ...r.engine, mountedHostCode: map.get(hid) } };
    });
  }
  return rows;
}

export async function getEngine(code: string): Promise<Asset | null> {
  const sb = requireClient();
  const { data, error } = await sb
    .from("assets")
    .select(ENGINE_SELECT)
    .eq("category", "engine")
    .ilike("code", code)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const asset = mapEngineAsset(data as Parameters<typeof mapEngineAsset>[0]);
  if (asset.engine?.mountedHostId) {
    const { data: host } = await sb.from("assets").select("code").eq("id", asset.engine.mountedHostId).maybeSingle();
    asset.engine.mountedHostCode = host?.code;
  }
  return asset;
}

export async function nextEngineCode(): Promise<string> {
  const rows = await listEngines();
  let max = 0;
  for (const r of rows) {
    const n = Number.parseInt(r.code.replace(/^EN/i, ""), 10);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return `EN${String(max + 1).padStart(2, "0")}`;
}

export async function createEngine(input: EngineInput): Promise<Asset> {
  const sb = requireClient();
  const { data: model, error: mErr } = await sb
    .from("engine_models")
    .select("*, engine_brands(*)")
    .eq("id", input.modelId)
    .single();
  if (mErr) throw mErr;
  const brand = Array.isArray(model.engine_brands) ? model.engine_brands[0] : model.engine_brands;
  const { data, error } = await sb
    .from("assets")
    .insert({
      code: input.code.trim().toUpperCase(),
      category: "engine",
      engineering_type: toDbProject(input.projectType),
      company: input.company,
      status: input.status,
      location: input.location,
      name: input.name || `${brand?.name ?? ""} ${model.name}`.trim(),
      photo_url: input.photo || ENGINE_PHOTO,
      type_code: "EN",
      type_label: "引擎",
      type_label_en: "Engine",
      lat: 22.3193,
      lng: 114.1694,
    })
    .select("id, code")
    .single();
  if (error) throw error;
  const { error: eErr } = await sb.from("engines").insert({
    asset_id: data.id,
    model_id: input.modelId,
    model: model.name,
    horsepower: model.horsepower,
    displacement: model.displacement,
    fuel_type: model.fuel_type,
    emission_standard: model.emission_standard,
    serial_number: input.serialNumber || null,
    manufacture_year: input.year || null,
    weight: parseWeight(input.weight),
    running_hours: input.runningHours || 0,
  });
  if (eErr) throw eErr;
  const created = await getEngine(data.code);
  if (!created) throw new Error("新增後讀取失敗");
  return created;
}

export async function updateEngine(id: string, input: EngineInput): Promise<Asset> {
  const sb = requireClient();
  const { error } = await sb
    .from("assets")
    .update({
      code: input.code.trim().toUpperCase(),
      name: input.name,
      company: input.company,
      status: input.status,
      location: input.location,
      photo_url: input.photo || ENGINE_PHOTO,
      engineering_type: toDbProject(input.projectType),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
  const { data: model } = await sb.from("engine_models").select("*").eq("id", input.modelId).single();
  const { error: eErr } = await sb
    .from("engines")
    .update({
      model_id: input.modelId,
      model: model?.name,
      horsepower: model?.horsepower,
      displacement: model?.displacement,
      fuel_type: model?.fuel_type,
      emission_standard: model?.emission_standard,
      serial_number: input.serialNumber || null,
      manufacture_year: input.year || null,
      weight: parseWeight(input.weight),
      running_hours: input.runningHours,
    })
    .eq("asset_id", id);
  if (eErr) throw eErr;
  const updated = await getEngine(input.code.trim().toUpperCase());
  if (!updated) throw new Error("更新後讀取失敗");
  return updated;
}

export async function deleteEngine(id: string): Promise<void> {
  const sb = requireClient();
  await sb.from("machinery").update({ engine_id: null }).eq("engine_id", id);
  await sb.from("engines").update({ mounted_on: null }).eq("asset_id", id);
  await sb.from("engine_installations").delete().eq("engine_id", id);
  const { error } = await sb.from("assets").delete().eq("id", id);
  if (error) throw error;
}

export async function listUnmountedEngines(): Promise<Asset[]> {
  const all = await listEngines();
  return all.filter((e) => !e.engine?.mountedHostId);
}

export async function getMountedEngine(hostAssetId: string): Promise<Asset | null> {
  const all = await listEngines();
  return all.find((e) => e.engine?.mountedHostId === hostAssetId) ?? null;
}

export async function mountEngine(engineId: string, hostId: string): Promise<void> {
  const sb = requireClient();
  const { error } = await sb.rpc("mount_engine", { p_engine: engineId, p_host: hostId });
  if (error) throw error;
}

export async function unmountEngine(engineId: string): Promise<void> {
  const sb = requireClient();
  const { error } = await sb.rpc("unmount_engine", { p_engine: engineId });
  if (error) throw error;
}

export async function listInstallHistory(engineId: string): Promise<EngineInstallEvent[]> {
  const sb = requireClient();
  const { data, error } = await sb
    .from("engine_installations")
    .select("id, action, hours_at_event, occurred_at, machinery_id")
    .eq("engine_id", engineId)
    .order("occurred_at", { ascending: false });
  if (error) throw error;
  const ids = [...new Set((data ?? []).map((r: { machinery_id: string }) => r.machinery_id).filter(Boolean))];
  const { data: hosts } = ids.length ? await sb.from("assets").select("id, code").in("id", ids) : { data: [] };
  const map = new Map((hosts ?? []).map((h: { id: string; code: string }) => [h.id, h.code]));
  return (data ?? []).map((r: { id: string; action: string; hours_at_event: number; occurred_at: string; machinery_id: string }) => ({
    id: r.id,
    action: r.action === "install" ? "安裝" : r.action === "uninstall" ? "拆卸" : r.action,
    hoursAtEvent: Number(r.hours_at_event ?? 0),
    occurredAt: r.occurred_at ? new Date(r.occurred_at).toLocaleString("zh-HK") : "",
    machineryCode: map.get(r.machinery_id) ?? "—",
  }));
}

function mapMaintStatus(s: string | null): MaintenanceStatus {
  if (s === "in_progress" || s === "未完成") return "未完成";
  return "已完成";
}

function toDbStatus(s: MaintenanceStatus): string {
  return s === "未完成" ? "in_progress" : "completed";
}

export async function listEngineMaintenance(engineAssetId: string): Promise<MaintenanceRecord[]> {
  const sb = requireClient();
  const { data, error } = await sb
    .from("maintenance_records")
    .select("*")
    .eq("asset_id", engineAssetId)
    .order("date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: String(r.id),
    recordNo: String(r.record_no ?? r.id),
    date: String(r.date ?? "").replaceAll("-", "/"),
    assetCode: "",
    location: String(r.location ?? ""),
    type: (r.type as MaintenanceType) || "突發維修",
    description: String(r.description ?? ""),
    hours: Number(r.hours ?? 0),
    totalHours: Number(r.hours ?? 0),
    startTime: "",
    endTime: "",
    overtime: Boolean(r.is_overtime),
    status: mapMaintStatus(r.status as string),
    technicians: [],
    photos: [],
    sessions: [],
  }));
}

export async function insertMaintenanceRecord(input: {
  assetCode: string;
  date: string;
  hours: number;
  overtime: boolean;
  description: string;
  type: MaintenanceType;
  location: string;
  status: MaintenanceStatus;
  parts?: string;
  reason?: string;
}): Promise<void> {
  const sb = requireClient();
  const { data: asset, error: aErr } = await sb.from("assets").select("id").ilike("code", input.assetCode).maybeSingle();
  if (aErr) throw aErr;
  if (!asset) return;
  const iso = input.date.replaceAll("/", "-");
  const { error } = await sb.from("maintenance_records").insert({
    asset_id: asset.id,
    date: iso,
    hours: input.hours,
    is_overtime: input.overtime,
    description: input.description,
    type: input.type,
    location: input.location,
    status: toDbStatus(input.status),
    parts_replaced: input.parts ?? null,
    reason: input.reason ?? null,
    record_no: `MR-${Date.now()}`,
  });
  if (error) throw error;
}

export async function engineSummary(): Promise<{ brands: number; units: number; mounted: number }> {
  const brands = await listEngineBrands();
  const units = await listEngines();
  return {
    brands: brands.length,
    units: units.length,
    mounted: units.filter((u) => u.engine?.mountedHostId).length,
  };
}
