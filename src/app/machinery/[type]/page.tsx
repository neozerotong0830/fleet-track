"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { MapPin, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AssetFormModal } from "@/components/assets/AssetFormModal";
import {
  createMachinery,
  deleteMachinery,
  listMachinery,
  nextMachineryCode,
  updateMachinery,
  type MachineryInput,
} from "@/lib/supabase/assets";
import { getMachineryType } from "@/lib/supabase/types-catalog";
import type { Asset, AssetStatus, MachineryType } from "@/lib/types";

export default function MachineryTypePage() {
  const params = useParams<{ type: string }>();
  const type = String(params.type).toUpperCase();
  const [meta, setMeta] = useState<MachineryType | null>(null);
  const [all, setAll] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [status, setStatus] = useState<"all" | AssetStatus>("all");
  const [q, setQ] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Asset | null>(null);
  const [suggestedCode, setSuggestedCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [rows, t] = await Promise.all([listMachinery(type), getMachineryType(type)]);
      setAll(rows);
      setMeta(t);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "載入失敗");
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const list = useMemo(() => {
    return all.filter((a) => {
      if (status !== "all" && a.status !== status) return false;
      const s = q.toLowerCase();
      return !s || a.code.toLowerCase().includes(s) || a.name.toLowerCase().includes(s) || a.location.includes(q);
    });
  }, [all, status, q]);

  const counts = {
    all: all.length,
    使用中: all.filter((a) => a.status === "使用中").length,
    維修中: all.filter((a) => a.status === "維修中").length,
    閒置: all.filter((a) => a.status === "閒置").length,
  };

  async function openCreate() {
    setEditing(null);
    setFormError(null);
    try {
      setSuggestedCode(await nextMachineryCode(type));
    } catch {
      setSuggestedCode(`${type}01`);
    }
    setFormOpen(true);
  }

  async function handleSubmit(input: MachineryInput) {
    setSaving(true);
    setFormError(null);
    try {
      if (editing) await updateMachinery(editing.id, { ...input, lat: editing.lat, lng: editing.lng });
      else await createMachinery({ ...input, photo: input.photo || meta?.photo || "" });
      setFormOpen(false);
      setEditing(null);
      await refresh();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(asset: Asset) {
    if (!window.confirm(`確定刪除 ${asset.code} ${asset.name}？此操作無法復原。`)) return;
    try {
      await deleteMachinery(asset.id);
      await refresh();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "刪除失敗");
    }
  }

  return (
    <>
      <TopBar crumb="機械管理系統 / 機械設備 /" title={`${meta?.name ?? type} ${meta?.nameEn ?? ""}`} showBack />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-[28px] font-extrabold">
              {meta?.name} {meta?.nameEn}
            </h1>
            <p className="mt-1 text-sm text-[#4b5563]">
              類別總覽：共 <b className="text-[#15803d]">{all.length}</b> 部設備，目前 {counts.使用中} 部處於正常運作狀態
            </p>
            {loadError && <p className="mt-1 text-sm font-semibold text-[#dc2626]">{loadError}</p>}
          </div>
          <button
            type="button"
            onClick={() => void openCreate()}
            className="inline-flex items-center gap-2 rounded-lg bg-[#16a34a] px-5 py-3 text-sm font-bold text-white"
          >
            <Plus size={16} />
            新增設備
          </button>
        </div>

        <div className="mb-4 flex gap-3">
          {(
            [
              ["all", `全部設備 (${counts.all})`],
              ["使用中", `運作中 (${counts.使用中})`],
              ["維修中", `維修中 (${counts.維修中})`],
              ["閒置", `閒置 (${counts.閒置})`],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatus(key as typeof status)}
              className={`rounded-lg px-4 py-2 text-[13px] ${
                status === key
                  ? "border-[1.5px] border-[#16a34a] bg-white font-bold text-[#15803d]"
                  : "border border-[#e5e7eb] bg-white text-[#4b5563]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mb-6 flex h-[42px] items-center gap-2.5 rounded-lg border border-[#e0e0e0] bg-[#f5f5f5] px-3.5">
          <Search size={16} className="text-[#8c8c8c]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜尋設備編號、名稱或地點..."
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>

        {loading ? (
          <div className="rounded-2xl border border-[#e5e7eb] bg-white p-10 text-center text-sm text-[#6b7280]">
            載入機械資料…
          </div>
        ) : list.length === 0 ? (
          <div className="rounded-2xl border border-[#e5e7eb] bg-white p-10 text-center text-sm text-[#6b7280]">
            此類型尚無設備，請按「新增設備」。
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {list.map((a) => (
              <div
                key={a.id}
                className="relative overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_4px_12px_rgba(0,0,0,0.02)]"
              >
                <Link href={`/assets/${a.code}`}>
                  <div className="h-[120px] bg-cover bg-center" style={{ backgroundImage: `url(${a.photo})` }} />
                  <div className="p-4 pb-12">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="rounded bg-[#f0fdf4] px-2 py-0.5 text-[11px] font-bold text-[#15803d]">
                        {a.code}
                      </span>
                      <StatusBadge status={a.status} />
                    </div>
                    <div className="text-base font-bold">{a.name}</div>
                    <div className="mt-2.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-[13px] text-[#4b5563]">
                        <MapPin size={14} />
                        {a.location}
                      </span>
                      <div className="text-right">
                        <div className="text-[11px] text-[#9ca3af]">上次維修</div>
                        <div className="text-[13px] font-semibold text-[#4b5563]">{a.lastMaintenance}</div>
                      </div>
                    </div>
                  </div>
                </Link>
                <div className="absolute right-3 bottom-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(a);
                      setFormError(null);
                      setFormOpen(true);
                    }}
                    className="inline-flex items-center gap-1 rounded-md border border-[#bbf7d0] bg-[#f0fdf4] px-2.5 py-1.5 text-[11px] font-bold text-[#15803d]"
                  >
                    <Pencil size={12} />
                    編輯
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(a)}
                    className="inline-flex items-center gap-1 rounded-md border border-[#fecaca] bg-[#fef2f2] px-2.5 py-1.5 text-[11px] font-bold text-[#dc2626]"
                  >
                    <Trash2 size={12} />
                    刪除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <AssetFormModal
        open={formOpen}
        typeCode={type}
        asset={editing}
        suggestedCode={suggestedCode}
        saving={saving}
        error={formError}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSubmit={(input) => void handleSubmit(input)}
      />
    </>
  );
}
