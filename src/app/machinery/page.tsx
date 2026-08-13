"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { ProjectTypeCards } from "@/components/ui/ProjectTypeCards";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TypeFormModal } from "@/components/assets/TypeFormModal";
import { listMachinery } from "@/lib/supabase/assets";
import { engineSummary } from "@/lib/supabase/engines";
import {
  createMachineryType,
  deleteMachineryType,
  listMachineryTypes,
  updateMachineryType,
  type MachineryTypeInput,
} from "@/lib/supabase/types-catalog";
import type { Asset, MachineryType } from "@/lib/types";

export default function MachineryPage() {
  const [project, setProject] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [machines, setMachines] = useState<Asset[]>([]);
  const [catalog, setCatalog] = useState<MachineryType[]>([]);
  const [engSum, setEngSum] = useState({ brands: 0, units: 0, mounted: 0 });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MachineryType | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function refresh() {
    const [m, t, s] = await Promise.all([
      listMachinery().catch(() => [] as Asset[]),
      listMachineryTypes().catch(() => [] as MachineryType[]),
      engineSummary().catch(() => ({ brands: 0, units: 0, mounted: 0 })),
    ]);
    setMachines(m);
    setCatalog(t);
    setEngSum(s);
  }

  useEffect(() => {
    void refresh();
  }, []);

  const types = useMemo(() => {
    return catalog
      .map((t) => {
        const ofType = machines.filter((a) => a.typeCode === t.code);
        return {
          ...t,
          stock: ofType.length,
          running: ofType.filter((a) => a.status === "使用中").length,
        };
      })
      .filter((t) => {
        if (q && !`${t.code}${t.name}${t.nameEn}`.toLowerCase().includes(q.toLowerCase())) {
          return false;
        }
        if (!project) return true;
        return machines.some((a) => a.typeCode === t.code && a.projectType === project);
      });
  }, [project, q, machines, catalog]);

  async function handleSubmit(input: MachineryTypeInput) {
    setSaving(true);
    setFormError(null);
    try {
      if (editing) await updateMachineryType(editing.code, input);
      else await createMachineryType(input);
      setFormOpen(false);
      setEditing(null);
      await refresh();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(t: MachineryType) {
    if (!window.confirm(`確定刪除類型 ${t.code} ${t.name}？此類型下不能還有設備。`)) return;
    try {
      await deleteMachineryType(t.code);
      await refresh();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "刪除失敗");
    }
  }

  return (
    <>
      <TopBar crumb="機械管理系統 /" title="機械設備" />
      <main className="flex-1 overflow-y-auto p-8">
        <ProjectTypeCards selected={project} onSelect={setProject} />

        <Link
          href="/machinery/engines"
          className="mt-6 flex items-center justify-between rounded-[10px] border border-[#2d5a3e] bg-[#1b3a2d] p-6"
        >
          <div>
            <div className="text-[11px] font-bold tracking-[0.08em] text-[#86efac]">ENGINE MANAGEMENT</div>
            <h2 className="mt-1 text-xl font-extrabold text-white">引擎管理</h2>
            <p className="mt-1 text-[13px] text-[#9ca3af]">品牌 → 型號 → 獨立編號 EN01；可掛載類型於類型設定勾選</p>
          </div>
          <div className="flex gap-8 text-white">
            <div>
              <div className="text-[11px] text-[#9ca3af]">品牌</div>
              <div className="text-2xl font-bold">{engSum.brands}</div>
            </div>
            <div>
              <div className="text-[11px] text-[#9ca3af]">引擎</div>
              <div className="text-2xl font-bold">{engSum.units}</div>
            </div>
            <div>
              <div className="text-[11px] text-[#9ca3af]">已掛載</div>
              <div className="text-2xl font-bold">{engSum.mounted}</div>
            </div>
          </div>
        </Link>

        <section className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold">所有機械設備類型 ({types.length})</h2>
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setFormError(null);
                setFormOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#16a34a] px-4 py-2 text-sm font-bold text-white"
            >
              <Plus size={16} />
              新增類型
            </button>
          </div>
          <div className="mb-5 flex h-[42px] items-center gap-2.5 rounded-lg border border-[#e0e0e0] bg-[#f5f5f5] px-3.5">
            <Search size={16} className="text-[#8c8c8c]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="搜尋設備類型、名稱或編號..."
              className="w-full bg-transparent text-sm font-bold outline-none placeholder:text-[#8c8c8c]"
            />
          </div>
          <div className="grid grid-cols-3 gap-5">
            {types.map((t) => (
              <div key={t.code} className="relative overflow-hidden rounded-xl border border-[#e5e7eb] bg-white">
                <Link href={`/machinery/${t.code}`}>
                  <div className="h-40 bg-cover bg-center" style={{ backgroundImage: `url(${t.photo})` }} />
                  <div className="p-[18px] pb-12">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold">{t.name}</h3>
                      <span className="rounded bg-[#f3f4f6] px-2 py-0.5 text-[11px] font-bold text-[#6b7280]">
                        {t.code}
                      </span>
                    </div>
                    <p className="mt-1 text-[13px] text-[#6b7280]">{t.nameEn}</p>
                    <div className="mt-3 flex items-center justify-between border-t border-[#f3f4f6] pt-3">
                      <div>
                        <div className="text-[11px] text-[#6b7280]">設備庫存</div>
                        <div className="text-sm font-bold">
                          {t.stock} <span className="text-[11px] font-normal text-[#6b7280]">台</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] text-[#6b7280]">運作中</div>
                        <div className="text-sm font-bold text-[#1b7a4f]">
                          {t.running} <span className="text-[11px] font-normal text-[#6b7280]">台</span>
                        </div>
                      </div>
                      <StatusBadge status="使用中" />
                    </div>
                  </div>
                </Link>
                <div className="absolute right-3 bottom-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(t);
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
                    onClick={() => void handleDelete(t)}
                    className="inline-flex items-center gap-1 rounded-md border border-[#fecaca] bg-[#fef2f2] px-2.5 py-1.5 text-[11px] font-bold text-[#dc2626]"
                  >
                    <Trash2 size={12} />
                    刪除
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <TypeFormModal
        open={formOpen}
        type={editing}
        saving={saving}
        error={formError}
        onClose={() => setFormOpen(false)}
        onSubmit={(input) => void handleSubmit(input)}
      />
    </>
  );
}
