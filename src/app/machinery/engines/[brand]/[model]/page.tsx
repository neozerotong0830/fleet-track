"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EngineFormModal } from "@/components/engines/EngineFormModal";
import {
  createEngine,
  deleteEngine,
  getEngineModel,
  listEngines,
  nextEngineCode,
  updateEngine,
  type EngineInput,
} from "@/lib/supabase/engines";
import type { Asset, EngineModel } from "@/lib/types";

export default function EngineUnitsPage() {
  const params = useParams<{ brand: string; model: string }>();
  const slug = String(params.brand);
  const modelParam = String(params.model);
  const [model, setModel] = useState<EngineModel | null>(null);
  const [units, setUnits] = useState<Asset[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Asset | null>(null);
  const [suggested, setSuggested] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const m = await getEngineModel(slug, modelParam);
    setModel(m);
    if (m) setUnits(await listEngines(m.id));
    else setUnits([]);
  }, [slug, modelParam]);

  useEffect(() => {
    void refresh().catch(() => setUnits([]));
  }, [refresh]);

  async function openCreate() {
    setEditing(null);
    setFormError(null);
    setSuggested(await nextEngineCode());
    setFormOpen(true);
  }

  async function handleSubmit(input: EngineInput) {
    if (!model) return;
    setSaving(true);
    setFormError(null);
    try {
      if (editing) await updateEngine(editing.id, input);
      else await createEngine(input);
      setFormOpen(false);
      await refresh();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(unit: Asset) {
    if (!window.confirm(`確定刪除 ${unit.code}？`)) return;
    try {
      await deleteEngine(unit.id);
      await refresh();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "刪除失敗");
    }
  }

  return (
    <>
      <TopBar
        crumb="機械管理系統 / 機械設備 / 引擎管理 /"
        title={`${model?.brandName ?? slug} ${model?.name ?? ""}`}
        showBack
      />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-[28px] font-extrabold">
              {model?.brandName} {model?.name}
            </h1>
            <p className="mt-1 text-sm text-[#4b5563]">獨立生命週期 · 專屬編號 EN</p>
          </div>
          <button
            type="button"
            onClick={() => void openCreate()}
            className="inline-flex items-center gap-2 rounded-lg bg-[#16a34a] px-5 py-3 text-sm font-bold text-white"
          >
            <Plus size={16} />
            新增引擎
          </button>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {units.map((a) => (
            <div key={a.id} className="relative overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white">
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
                  <div className="mt-2 text-[13px] text-[#4b5563]">
                    機鐘 {a.runningHours.toLocaleString()} 小時
                    {a.engine?.mountedHostCode ? ` · 掛載 ${a.engine.mountedHostCode}` : " · 未掛載"}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-[13px] text-[#4b5563]">
                    <MapPin size={14} />
                    {a.location || "—"}
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
        {units.length === 0 && (
          <div className="rounded-2xl border border-[#e5e7eb] bg-white p-10 text-center text-sm text-[#6b7280]">
            此型號尚無引擎，請新增。
          </div>
        )}
      </main>
      {model && (
        <EngineFormModal
          open={formOpen}
          model={model}
          asset={editing}
          suggestedCode={suggested}
          saving={saving}
          error={formError}
          onClose={() => setFormOpen(false)}
          onSubmit={(input) => void handleSubmit(input)}
        />
      )}
    </>
  );
}
