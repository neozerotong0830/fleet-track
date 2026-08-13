import type { MachineryType, SpecField } from "@/lib/types";
import { getSupabase } from "./client";

export type MachineryTypeInput = {
  code: string;
  name: string;
  nameEn: string;
  photo: string;
  canHostEngine: boolean;
  specFields: SpecField[];
  accessoryCatalog: string[];
  sortOrder?: number;
};

function requireClient() {
  const sb = getSupabase();
  if (!sb) throw new Error("尚未設定 Supabase 連線");
  return sb;
}

function parseSpecFields(raw: unknown): SpecField[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((f) => ({
      key: String((f as SpecField).key ?? "").trim(),
      label: String((f as SpecField).label ?? "").trim(),
      unit: String((f as SpecField).unit ?? "").trim(),
    }))
    .filter((f) => f.key && f.label);
}

function parseAccessoryCatalog(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const names = raw.map((n) => String(n ?? "").trim()).filter(Boolean);
  return [...new Set(names)];
}

function mapType(row: {
  code: string;
  name: string;
  name_en: string;
  photo_url: string | null;
  sort_order: number;
  can_host_engine: boolean;
  spec_fields: unknown;
  accessory_catalog?: unknown;
}): MachineryType {
  return {
    code: row.code,
    name: row.name,
    nameEn: row.name_en ?? "",
    photo: row.photo_url ?? "",
    stock: 0,
    running: 0,
    status: "正常",
    sortOrder: row.sort_order ?? 0,
    canHostEngine: Boolean(row.can_host_engine),
    specFields: parseSpecFields(row.spec_fields),
    accessoryCatalog: parseAccessoryCatalog(row.accessory_catalog),
  };
}

export async function listMachineryTypes(): Promise<MachineryType[]> {
  const sb = requireClient();
  const { data, error } = await sb.from("machinery_types").select("*").order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapType);
}

export async function getMachineryType(code: string): Promise<MachineryType | null> {
  const sb = requireClient();
  const { data, error } = await sb.from("machinery_types").select("*").eq("code", code.toUpperCase()).maybeSingle();
  if (error) throw error;
  return data ? mapType(data) : null;
}

async function syncEngineHost(code: string, canHost: boolean) {
  const sb = requireClient();
  const upper = code.toUpperCase();
  if (canHost) {
    const { error } = await sb.from("engine_host_types").upsert({ type_code: upper });
    if (error) throw error;
  } else {
    const { error } = await sb.from("engine_host_types").delete().eq("type_code", upper);
    if (error) throw error;
  }
}

export async function createMachineryType(input: MachineryTypeInput): Promise<MachineryType> {
  const sb = requireClient();
  const code = input.code.trim().toUpperCase();
  if (!/^[A-Z]{2,4}$/.test(code)) throw new Error("類型編號須為 2–4 個英文字母");
  const existing = await listMachineryTypes();
  const sortOrder = input.sortOrder ?? (existing.reduce((m, t) => Math.max(m, t.sortOrder), 0) + 1);
  const { error } = await sb.from("machinery_types").insert({
    code,
    name: input.name.trim(),
    name_en: input.nameEn.trim(),
    photo_url: input.photo || null,
    sort_order: sortOrder,
    can_host_engine: input.canHostEngine,
    spec_fields: input.specFields,
    accessory_catalog: input.accessoryCatalog,
  });
  if (error) throw error;
  await syncEngineHost(code, input.canHostEngine);
  const created = await getMachineryType(code);
  if (!created) throw new Error("新增類型後讀取失敗");
  return created;
}

export async function updateMachineryType(code: string, input: MachineryTypeInput): Promise<MachineryType> {
  const sb = requireClient();
  const current = code.toUpperCase();
  const nextCode = input.code.trim().toUpperCase();
  if (!/^[A-Z]{2,4}$/.test(nextCode)) throw new Error("類型編號須為 2–4 個英文字母");
  if (nextCode !== current) {
    const { count } = await sb.from("assets").select("id", { count: "exact", head: true }).eq("type_code", current);
    if (count && count > 0) throw new Error(`已有 ${count} 部設備使用 ${current}，無法更改編號`);
  }
  const { error } = await sb
    .from("machinery_types")
    .update({
      code: nextCode,
      name: input.name.trim(),
      name_en: input.nameEn.trim(),
      photo_url: input.photo || null,
      can_host_engine: input.canHostEngine,
      spec_fields: input.specFields,
      accessory_catalog: input.accessoryCatalog,
    })
    .eq("code", current);
  if (error) throw error;
  if (nextCode !== current) {
    await sb.from("engine_host_types").delete().eq("type_code", current);
  }
  await syncEngineHost(nextCode, input.canHostEngine);
  const updated = await getMachineryType(nextCode);
  if (!updated) throw new Error("更新類型後讀取失敗");
  return updated;
}

export async function deleteMachineryType(code: string): Promise<void> {
  const sb = requireClient();
  const upper = code.toUpperCase();
  const { count } = await sb.from("assets").select("id", { count: "exact", head: true }).eq("type_code", upper);
  if (count && count > 0) throw new Error(`仍有 ${count} 部設備屬於此類型，請先移走或刪除設備`);
  await sb.from("engine_host_types").delete().eq("type_code", upper);
  const { error } = await sb.from("machinery_types").delete().eq("code", upper);
  if (error) throw error;
}
