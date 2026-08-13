import type {
  Accessory,
  Asset,
  AssetStatus,
  Company,
  PhotoAlbum,
  ProjectType,
} from "@/lib/types";
import { getMachineryType } from "./types-catalog";
import { getSupabase } from "./client";

export type MachineryInput = {
  code: string;
  name: string;
  typeCode: string;
  model: string;
  manufacturer: string;
  serialNumber: string;
  year: number;
  projectType: ProjectType;
  company: Company;
  status: AssetStatus;
  location: string;
  lat?: number;
  lng?: number;
  weight: string;
  runningHours: number;
  photo: string;
  specs?: Record<string, string>;
};

type MachineryRow = {
  machinery_type?: string | null;
  type_label?: string | null;
  type_label_en?: string | null;
  model?: string | null;
  serial_number?: string | null;
  manufacturer?: string | null;
  manufacture_year?: number | null;
  weight?: number | string | null;
  running_hours?: number | string | null;
  lifting_capacity?: number | string | null;
  air_flow?: number | string | null;
};

type AssetRow = {
  id: string;
  code: string;
  category: string;
  engineering_type: string;
  company: string;
  status: string;
  location: string;
  lat: number | null;
  lng: number | null;
  name: string | null;
  photo_url: string | null;
  specs: Record<string, string> | null;
  last_maintenance_date: string | null;
  type_code: string | null;
  type_label: string | null;
  type_label_en: string | null;
  machinery?: MachineryRow | MachineryRow[] | null;
  asset_accessories?: { name: string; installed_at: string; status: string }[] | null;
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

async function typeMeta(code: string) {
  const t = await getMachineryType(code);
  return { name: t?.name ?? code, nameEn: t?.nameEn ?? code };
}

function firstMachinery(row: AssetRow): MachineryRow | null {
  const m = row.machinery;
  if (!m) return null;
  return Array.isArray(m) ? (m[0] ?? null) : m;
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return value.replaceAll("-", "/");
}

function parseWeight(weight: string): number | null {
  const n = parseFloat(weight.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function mapRow(row: AssetRow): Asset {
  const m = firstMachinery(row);
  const typeCode = (row.type_code || m?.machinery_type || "").toUpperCase();
  const photo = row.photo_url ?? "";
  const weightNum = m?.weight != null ? Number(m.weight) : null;
  return {
    id: row.id,
    code: row.code,
    name: row.name ?? row.code,
    category: "machinery",
    typeCode,
    typeLabel: row.type_label || m?.type_label || typeCode,
    typeLabelEn: row.type_label_en || m?.type_label_en || typeCode,
    model: m?.model ?? "",
    manufacturer: m?.manufacturer ?? "",
    serialNumber: m?.serial_number ?? "",
    year: m?.manufacture_year ?? 0,
    projectType: fromDbProject(row.engineering_type),
    company: (row.company as Company) || "建榮",
    status: (row.status as AssetStatus) || "閒置",
    location: row.location ?? "",
    lat: row.lat ?? 22.3193,
    lng: row.lng ?? 114.1694,
    weight: weightNum != null && !Number.isNaN(weightNum) ? `${weightNum} t` : "",
    runningHours: Number(m?.running_hours ?? 0),
    lastMaintenance: formatDate(row.last_maintenance_date),
    photo,
    photos: photo ? [photo] : [],
    specs: {
      ...(row.specs ?? {}),
      ...(m?.lifting_capacity != null && m.lifting_capacity !== ""
        ? { lifting_capacity: String(m.lifting_capacity) }
        : {}),
      ...(m?.air_flow != null && m.air_flow !== "" ? { air_flow: String(m.air_flow) } : {}),
    },
    accessories: mapAccessories(row.asset_accessories),
    monthlyHours: [],
  };
}

function mapAccessories(
  rows: { name: string; installed_at: string; status: string }[] | null | undefined,
): Accessory[] {
  return (rows ?? []).map((r) => ({
    name: r.name,
    installedAt: formatDate(r.installed_at),
    status: r.status === "維修中" ? "維修中" : "正常",
  }));
}

const SELECT = "*, machinery!machinery_asset_id_fkey(*), asset_accessories(*)";

export async function listMachinery(typeCode?: string): Promise<Asset[]> {
  const sb = requireClient();
  let q = sb.from("assets").select(SELECT).eq("category", "machinery").neq("status", "報廢");
  if (typeCode) q = q.eq("type_code", typeCode.toUpperCase());
  const { data, error } = await q.order("code");
  if (error) throw error;
  let rows = ((data ?? []) as AssetRow[]).map(mapRow);
  if (typeCode) {
    const code = typeCode.toUpperCase();
    rows = rows.filter((a) => a.typeCode === code);
  }
  return rows;
}

export async function getMachinery(code: string): Promise<Asset | null> {
  const sb = requireClient();
  const { data, error } = await sb
    .from("assets")
    .select(SELECT)
    .eq("category", "machinery")
    .ilike("code", code)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return mapRow(data as AssetRow);
}

export async function nextMachineryCode(typeCode: string): Promise<string> {
  const rows = await listMachinery(typeCode);
  const prefix = typeCode.toUpperCase();
  let max = 0;
  for (const r of rows) {
    const n = Number.parseInt(r.code.replace(prefix, ""), 10);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return `${prefix}${String(max + 1).padStart(2, "0")}`;
}

async function upsertMachineryRow(assetId: string, input: MachineryInput) {
  const sb = requireClient();
  const meta = await typeMeta(input.typeCode);
  const specs = input.specs ?? {};
  const lift = parseWeight(specs.lifting_capacity ?? "");
  const flow = parseWeight(specs.air_flow ?? "");
  const payload = {
    asset_id: assetId,
    machinery_type: input.typeCode.toUpperCase(),
    type_label: meta.name,
    type_label_en: meta.nameEn,
    model: input.model || null,
    serial_number: input.serialNumber || null,
    manufacturer: input.manufacturer || null,
    manufacture_year: input.year || null,
    weight: parseWeight(input.weight),
    running_hours: input.runningHours || 0,
    lifting_capacity: lift,
    air_flow: flow,
  };
  const { error } = await sb.from("machinery").upsert(payload, { onConflict: "asset_id" });
  if (error) throw error;
}

export async function createMachinery(input: MachineryInput): Promise<Asset> {
  const sb = requireClient();
  const meta = await typeMeta(input.typeCode);
  const { data, error } = await sb
    .from("assets")
    .insert({
      code: input.code.trim().toUpperCase(),
      category: "machinery",
      engineering_type: toDbProject(input.projectType),
      company: input.company,
      status: input.status,
      location: input.location,
      lat: input.lat ?? 22.3193,
      lng: input.lng ?? 114.1694,
      name: input.name,
      photo_url: input.photo || null,
      specs: input.specs ?? {},
      type_code: input.typeCode.toUpperCase(),
      type_label: meta.name,
      type_label_en: meta.nameEn,
    })
    .select("id, code")
    .single();
  if (error) throw error;
  await upsertMachineryRow(data.id, input);
  const created = await getMachinery(data.code);
  if (!created) throw new Error("新增後讀取失敗");
  return created;
}

export async function updateMachinery(id: string, input: MachineryInput): Promise<Asset> {
  const sb = requireClient();
  const meta = await typeMeta(input.typeCode);
  const { error } = await sb
    .from("assets")
    .update({
      code: input.code.trim().toUpperCase(),
      engineering_type: toDbProject(input.projectType),
      company: input.company,
      status: input.status,
      location: input.location,
      lat: input.lat,
      lng: input.lng,
      name: input.name,
      photo_url: input.photo || null,
      specs: input.specs ?? {},
      type_code: input.typeCode.toUpperCase(),
      type_label: meta.name,
      type_label_en: meta.nameEn,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
  await upsertMachineryRow(id, input);
  const updated = await getMachinery(input.code.trim().toUpperCase());
  if (!updated) throw new Error("更新後讀取失敗");
  return updated;
}

export async function addAssetAccessories(
  assetId: string,
  items: { name: string; installedAt: string }[],
): Promise<void> {
  const sb = requireClient();
  const rows = items
    .map((item) => ({
      asset_id: assetId,
      name: item.name.trim(),
      installed_at: item.installedAt || new Date().toISOString().slice(0, 10),
      status: "正常",
    }))
    .filter((r) => r.name);
  if (rows.length === 0) throw new Error("請選擇或輸入配件名稱");
  const seen = new Set<string>();
  for (const r of rows) {
    const key = r.name.toLowerCase();
    if (seen.has(key)) throw new Error(`配件「${r.name}」重複`);
    seen.add(key);
  }
  const { error } = await sb.from("asset_accessories").insert(rows);
  if (error) {
    if (error.code === "23505") throw new Error("已安裝相同名稱的配件");
    throw error;
  }
}

export async function deleteMachinery(id: string): Promise<void> {
  const sb = requireClient();
  const { error } = await sb.from("assets").delete().eq("id", id);
  if (error) throw error;
}

const PHOTO_BUCKET = "asset-photos";

type AlbumRow = {
  id: string;
  note: string | null;
  created_at: string;
  asset_photo_images?: { url: string; path: string; sort_order: number }[] | null;
};

function mapAlbum(row: AlbumRow): PhotoAlbum {
  const images = [...(row.asset_photo_images ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  return {
    id: row.id,
    note: row.note ?? "",
    createdAt: formatDate(row.created_at.slice(0, 10)),
    urls: images.map((i) => i.url),
    paths: images.map((i) => i.path),
  };
}

export async function listPhotoAlbums(assetId: string): Promise<PhotoAlbum[]> {
  const sb = requireClient();
  const { data, error } = await sb
    .from("asset_photo_albums")
    .select("id, note, created_at, asset_photo_images(url, path, sort_order)")
    .eq("asset_id", assetId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as AlbumRow[]).map(mapAlbum);
}

export async function createPhotoAlbum(
  assetId: string,
  input: { note: string; files: File[] },
): Promise<PhotoAlbum> {
  const sb = requireClient();
  const files = input.files.filter((f) => f.type.startsWith("image/"));
  if (files.length === 0) throw new Error("請選擇至少一張圖片");

  const { data: album, error: aErr } = await sb
    .from("asset_photo_albums")
    .insert({ asset_id: assetId, note: input.note.trim() })
    .select("id, note, created_at")
    .single();
  if (aErr) throw aErr;

  const uploaded: { url: string; path: string; sort_order: number }[] = [];
  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      const path = `${assetId}/${album.id}/${crypto.randomUUID()}.${ext}`;
      const { error: uErr } = await sb.storage.from(PHOTO_BUCKET).upload(path, file, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });
      if (uErr) throw uErr;
      const { data: pub } = sb.storage.from(PHOTO_BUCKET).getPublicUrl(path);
      uploaded.push({ url: pub.publicUrl, path, sort_order: i });
    }
    const { error: iErr } = await sb.from("asset_photo_images").insert(
      uploaded.map((row) => ({ album_id: album.id, ...row })),
    );
    if (iErr) throw iErr;
  } catch (e) {
    if (uploaded.length) await sb.storage.from(PHOTO_BUCKET).remove(uploaded.map((u) => u.path));
    await sb.from("asset_photo_albums").delete().eq("id", album.id);
    throw e;
  }

  return mapAlbum({ ...album, asset_photo_images: uploaded });
}

export async function deletePhotoAlbum(album: PhotoAlbum): Promise<void> {
  const sb = requireClient();
  if (album.paths.length) {
    await sb.storage.from(PHOTO_BUCKET).remove(album.paths);
  }
  const { error } = await sb.from("asset_photo_albums").delete().eq("id", album.id);
  if (error) throw error;
}
