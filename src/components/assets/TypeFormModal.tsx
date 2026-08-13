"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import type { MachineryType, SpecField } from "@/lib/types";
import type { MachineryTypeInput } from "@/lib/supabase/types-catalog";

export function TypeFormModal({
  open,
  type,
  saving,
  error,
  onClose,
  onSubmit,
}: {
  open: boolean;
  type?: MachineryType | null;
  saving?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (input: MachineryTypeInput) => void;
}) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [photo, setPhoto] = useState("");
  const [canHostEngine, setCanHostEngine] = useState(false);
  const [specFields, setSpecFields] = useState<SpecField[]>([]);
  const [accessoryCatalog, setAccessoryCatalog] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    if (type) {
      setCode(type.code);
      setName(type.name);
      setNameEn(type.nameEn);
      setPhoto(type.photo);
      setCanHostEngine(type.canHostEngine);
      setSpecFields(type.specFields.length ? type.specFields : []);
      setAccessoryCatalog(type.accessoryCatalog.length ? type.accessoryCatalog : []);
    } else {
      setCode("");
      setName("");
      setNameEn("");
      setPhoto("");
      setCanHostEngine(false);
      setSpecFields([]);
      setAccessoryCatalog([]);
    }
  }, [open, type]);

  if (!open) return null;

  function updateField(i: number, patch: Partial<SpecField>) {
    setSpecFields((prev) => prev.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  }

  const canSubmit = /^[A-Za-z]{2,4}$/.test(code.trim()) && name.trim();

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(17,24,39,0.6)] p-6">
      <div className="flex max-h-[90vh] w-[560px] flex-col overflow-hidden rounded-2xl bg-white p-8 shadow-[0_10px_25px_rgba(0,0,0,0.1)]">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <div className="text-[11px] font-bold tracking-[0.09em] text-[#16a34a]">MACHINERY TYPE</div>
            <div className="text-[22px] font-extrabold">{type ? "編輯機械類型" : "新增機械類型"}</div>
          </div>
          <button type="button" onClick={onClose} className="rounded-full bg-[#f3f4f6] p-2">
            <X size={16} />
          </button>
        </div>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <label className="text-[13px] font-semibold">
              類型編號
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="例如 SD"
                maxLength={4}
                className="mt-2 h-10 w-full rounded-lg border border-[#dedede] bg-[#f5f5f5] px-3 text-sm"
              />
            </label>
            <label className="flex items-end gap-2 pb-1 text-[13px] font-semibold">
              <input
                type="checkbox"
                checked={canHostEngine}
                onChange={(e) => setCanHostEngine(e.target.checked)}
                className="h-4 w-4"
              />
              可掛載獨立引擎
            </label>
          </div>
          <label className="block text-[13px] font-semibold">
            中文名稱
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="鑽探機"
              className="mt-2 h-10 w-full rounded-lg border border-[#dedede] bg-[#f5f5f5] px-3 text-sm"
            />
          </label>
          <label className="block text-[13px] font-semibold">
            英文名稱
            <input
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              className="mt-2 h-10 w-full rounded-lg border border-[#dedede] bg-[#f5f5f5] px-3 text-sm"
            />
          </label>
          <label className="block text-[13px] font-semibold">
            封面圖片 URL
            <input
              value={photo}
              onChange={(e) => setPhoto(e.target.value)}
              className="mt-2 h-10 w-full rounded-lg border border-[#dedede] bg-[#f5f5f5] px-3 text-sm"
            />
          </label>
          <div>
            <div className="mb-2 flex items-center justify-between text-[13px] font-semibold">
              規格欄位
              <button
                type="button"
                onClick={() => setSpecFields((p) => [...p, { key: "", label: "", unit: "" }])}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#16a34a]"
              >
                <Plus size={12} />
                加一列
              </button>
            </div>
            {specFields.map((f, i) => (
              <div key={i} className="mb-2 grid grid-cols-[1fr_1fr_80px_32px] gap-2">
                <input
                  value={f.key}
                  onChange={(e) => updateField(i, { key: e.target.value })}
                  placeholder="key 如 drilling_depth"
                  className="h-9 rounded-lg border border-[#dedede] bg-[#f5f5f5] px-2 text-xs"
                />
                <input
                  value={f.label}
                  onChange={(e) => updateField(i, { label: e.target.value })}
                  placeholder="顯示名稱"
                  className="h-9 rounded-lg border border-[#dedede] bg-[#f5f5f5] px-2 text-xs"
                />
                <input
                  value={f.unit}
                  onChange={(e) => updateField(i, { unit: e.target.value })}
                  placeholder="單位"
                  className="h-9 rounded-lg border border-[#dedede] bg-[#f5f5f5] px-2 text-xs"
                />
                <button type="button" onClick={() => setSpecFields((p) => p.filter((_, idx) => idx !== i))} className="text-[#dc2626]">
                  <X size={14} />
                </button>
              </div>
            ))}
            {specFields.length === 0 && <p className="text-xs text-[#9ca3af]">可選。例如吊重能力、出風量、最大鑽深。</p>}
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between text-[13px] font-semibold">
              可安裝配件
              <button
                type="button"
                onClick={() => setAccessoryCatalog((p) => [...p, ""])}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#16a34a]"
              >
                <Plus size={12} />
                加一列
              </button>
            </div>
            {accessoryCatalog.map((name, i) => (
              <div key={i} className="mb-2 flex gap-2">
                <input
                  value={name}
                  onChange={(e) =>
                    setAccessoryCatalog((prev) => prev.map((n, idx) => (idx === i ? e.target.value : n)))
                  }
                  placeholder="配件名稱，例如 GPS 定位模組"
                  className="h-9 flex-1 rounded-lg border border-[#dedede] bg-[#f5f5f5] px-2 text-xs"
                />
                <button
                  type="button"
                  onClick={() => setAccessoryCatalog((p) => p.filter((_, idx) => idx !== i))}
                  className="text-[#dc2626]"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            {accessoryCatalog.length === 0 && (
              <p className="text-xs text-[#9ca3af]">此類型機械在詳情頁可勾選安裝的預設配件。</p>
            )}
          </div>
          {error && <p className="text-sm font-semibold text-[#dc2626]">{error}</p>}
        </div>
        <div className="mt-5 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-[#d1d5db] py-3 text-[15px] font-bold">
            取消
          </button>
          <button
            type="button"
            disabled={!canSubmit || saving}
            onClick={() =>
              onSubmit({
                code,
                name,
                nameEn,
                photo,
                canHostEngine,
                specFields: specFields.filter((f) => f.key && f.label),
                accessoryCatalog: [...new Set(accessoryCatalog.map((n) => n.trim()).filter(Boolean))],
              })
            }
            className="flex-1 rounded-lg bg-[#16a34a] py-3 text-[15px] font-bold text-white disabled:opacity-40"
          >
            {saving ? "儲存中…" : type ? "儲存類型" : "新增類型"}
          </button>
        </div>
      </div>
    </div>
  );
}
