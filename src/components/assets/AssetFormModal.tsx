"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { ASSET_STATUSES, COMPANIES, PROJECT_TYPES } from "@/lib/constants";
import type { Asset, AssetStatus, Company, MachineryType, ProjectType } from "@/lib/types";
import type { MachineryInput } from "@/lib/supabase/assets";
import { getMachineryType } from "@/lib/supabase/types-catalog";

export function AssetFormModal({
  open,
  typeCode,
  asset,
  suggestedCode,
  saving,
  error,
  onClose,
  onSubmit,
}: {
  open: boolean;
  typeCode: string;
  asset?: Asset | null;
  suggestedCode?: string;
  saving?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (input: MachineryInput) => void;
}) {
  const [catalog, setCatalog] = useState<MachineryType | null>(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [model, setModel] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [projectType, setProjectType] = useState<ProjectType>("BP");
  const [company, setCompany] = useState<Company>("建榮");
  const [status, setStatus] = useState<AssetStatus>("使用中");
  const [location, setLocation] = useState("");
  const [weight, setWeight] = useState("");
  const [runningHours, setRunningHours] = useState(0);
  const [photo, setPhoto] = useState("");
  const [specValues, setSpecValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    void getMachineryType(typeCode).then(setCatalog).catch(() => setCatalog(null));
  }, [open, typeCode]);

  useEffect(() => {
    if (!open) return;
    if (asset) {
      setCode(asset.code);
      setName(asset.name);
      setModel(asset.model);
      setManufacturer(asset.manufacturer);
      setSerialNumber(asset.serialNumber);
      setYear(asset.year || new Date().getFullYear());
      setProjectType(asset.projectType);
      setCompany(asset.company);
      setStatus(asset.status);
      setLocation(asset.location);
      setWeight(asset.weight);
      setRunningHours(asset.runningHours);
      setPhoto(asset.photo);
      setSpecValues(asset.specs ?? {});
    } else {
      setCode(suggestedCode ?? "");
      setName("");
      setModel("");
      setManufacturer("");
      setSerialNumber("");
      setYear(new Date().getFullYear());
      setProjectType("BP");
      setCompany("建榮");
      setStatus("使用中");
      setLocation("");
      setWeight("");
      setRunningHours(0);
      setPhoto("");
      setSpecValues({});
    }
  }, [open, asset, suggestedCode]);

  if (!open) return null;

  const canSubmit = code.trim() && name.trim() && location.trim();

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(17,24,39,0.6)] p-6">
      <div className="flex max-h-[90vh] w-[560px] flex-col overflow-hidden rounded-2xl bg-white p-8 shadow-[0_10px_25px_rgba(0,0,0,0.1)]">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <div className="text-[11px] font-bold tracking-[0.09em] text-[#16a34a]">MACHINERY CARD</div>
            <div className="text-[22px] font-extrabold">{asset ? "編輯機械資訊" : "新增機械設備"}</div>
            <p className="mt-1 text-sm text-[#6b7280]">
              {catalog?.name ?? typeCode} · {typeCode.toUpperCase()}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full bg-[#f3f4f6] p-2">
            <X size={16} />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <label className="text-[13px] font-semibold">
              設備編號
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="mt-2 h-10 w-full rounded-lg border border-[#dedede] bg-[#f5f5f5] px-3 text-sm"
              />
            </label>
            <label className="text-[13px] font-semibold">
              狀態
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AssetStatus)}
                className="mt-2 h-10 w-full rounded-lg border border-[#dedede] bg-[#f5f5f5] px-3 text-sm"
              >
                {ASSET_STATUSES.filter((s) => s !== "報廢" || asset?.status === "報廢").map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="block text-[13px] font-semibold">
            名稱
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 h-10 w-full rounded-lg border border-[#dedede] bg-[#f5f5f5] px-3 text-sm"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-[13px] font-semibold">
              型號
              <input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="mt-2 h-10 w-full rounded-lg border border-[#dedede] bg-[#f5f5f5] px-3 text-sm"
              />
            </label>
            <label className="text-[13px] font-semibold">
              廠牌
              <input
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                className="mt-2 h-10 w-full rounded-lg border border-[#dedede] bg-[#f5f5f5] px-3 text-sm"
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-[13px] font-semibold">
              序號
              <input
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                className="mt-2 h-10 w-full rounded-lg border border-[#dedede] bg-[#f5f5f5] px-3 text-sm"
              />
            </label>
            <label className="text-[13px] font-semibold">
              年份
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="mt-2 h-10 w-full rounded-lg border border-[#dedede] bg-[#f5f5f5] px-3 text-sm"
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-[13px] font-semibold">
              工程類型
              <select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value as ProjectType)}
                className="mt-2 h-10 w-full rounded-lg border border-[#dedede] bg-[#f5f5f5] px-3 text-sm"
              >
                {PROJECT_TYPES.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.code}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[13px] font-semibold">
              公司
              <select
                value={company}
                onChange={(e) => setCompany(e.target.value as Company)}
                className="mt-2 h-10 w-full rounded-lg border border-[#dedede] bg-[#f5f5f5] px-3 text-sm"
              >
                {COMPANIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="block text-[13px] font-semibold">
            地點
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-2 h-10 w-full rounded-lg border border-[#dedede] bg-[#f5f5f5] px-3 text-sm"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-[13px] font-semibold">
              重量
              <input
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="例如 48 t"
                className="mt-2 h-10 w-full rounded-lg border border-[#dedede] bg-[#f5f5f5] px-3 text-sm"
              />
            </label>
            <label className="text-[13px] font-semibold">
              機鐘（小時）
              <input
                type="number"
                value={runningHours}
                onChange={(e) => setRunningHours(Number(e.target.value))}
                className="mt-2 h-10 w-full rounded-lg border border-[#dedede] bg-[#f5f5f5] px-3 text-sm"
              />
            </label>
          </div>
          {(catalog?.specFields ?? []).map((f) => (
            <label key={f.key} className="block text-[13px] font-semibold">
              {f.label}
              {f.unit ? ` (${f.unit})` : ""}
              <input
                value={specValues[f.key] ?? ""}
                onChange={(e) => setSpecValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
                className="mt-2 h-10 w-full rounded-lg border border-[#dedede] bg-[#f5f5f5] px-3 text-sm"
              />
            </label>
          ))}
          <label className="block text-[13px] font-semibold">
            照片 URL
            <input
              value={photo}
              onChange={(e) => setPhoto(e.target.value)}
              placeholder="https://..."
              className="mt-2 h-10 w-full rounded-lg border border-[#dedede] bg-[#f5f5f5] px-3 text-sm"
            />
          </label>
          {error && <p className="text-sm font-semibold text-[#dc2626]">{error}</p>}
        </div>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-[#d1d5db] py-3 text-[15px] font-bold"
          >
            取消
          </button>
          <button
            type="button"
            disabled={!canSubmit || saving}
            onClick={() =>
              onSubmit({
                code,
                name,
                typeCode: typeCode.toUpperCase(),
                model,
                manufacturer,
                serialNumber,
                year,
                projectType,
                company,
                status,
                location,
                lat: asset?.lat,
                lng: asset?.lng,
                weight,
                runningHours,
                photo,
                specs: specValues,
              })
            }
            className="flex-1 rounded-lg bg-[#16a34a] py-3 text-[15px] font-bold text-white disabled:opacity-40"
          >
            {saving ? "儲存中…" : asset ? "儲存變更" : "新增設備"}
          </button>
        </div>
      </div>
    </div>
  );
}
