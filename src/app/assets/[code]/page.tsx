"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ExternalLink,
  Eye,
  MapPin,
  Pencil,
  QrCode,
  Trash2,
  X,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TopBar } from "@/components/layout/TopBar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AssetFormModal } from "@/components/assets/AssetFormModal";
import { EngineFormModal } from "@/components/engines/EngineFormModal";
import { maintenanceRecords } from "@/lib/mock-data";
import { deleteMachinery, getMachinery, updateMachinery, addAssetAccessories, listPhotoAlbums, createPhotoAlbum, deletePhotoAlbum, type MachineryInput } from "@/lib/supabase/assets";
import {
  deleteEngine,
  getEngine,
  getEngineModel,
  getMountedEngine,
  insertMaintenanceRecord,
  isEngineHostType,
  listEngineHostTypes,
  listEngineMaintenance,
  listEngines,
  listInstallHistory,
  listUnmountedEngines,
  mountEngine,
  unmountEngine,
  updateEngine,
  type EngineInput,
} from "@/lib/supabase/engines";
import { listMachinery } from "@/lib/supabase/assets";
import { getMachineryType } from "@/lib/supabase/types-catalog";
import { AssetMiniMap } from "@/components/map/LandsMapView";
import type { Asset, EngineInstallEvent, EngineModel, MachineryType, MaintenanceRecord, PhotoAlbum } from "@/lib/types";

const tabs = ["總覽", "維修紀錄", "保養紀錄", "證書文件", "圖片庫"] as const;

export default function AssetDetailPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const code = String(params.code);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [isEngine, setIsEngine] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<(typeof tabs)[number]>("總覽");
  const [photo, setPhoto] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [mounted, setMounted] = useState<Asset | null>(null);
  const [hostTypes, setHostTypes] = useState<string[]>([]);
  const [idleEngines, setIdleEngines] = useState<Asset[]>([]);
  const [history, setHistory] = useState<EngineInstallEvent[]>([]);
  const [engineMaint, setEngineMaint] = useState<MaintenanceRecord[]>([]);
  const [engineModel, setEngineModel] = useState<EngineModel | null>(null);
  const [hostPick, setHostPick] = useState("");
  const [enginePick, setEnginePick] = useState("");
  const [hostOptions, setHostOptions] = useState<Asset[]>([]);
  const [hostMachine, setHostMachine] = useState<Asset | null>(null);
  const [typeCatalog, setTypeCatalog] = useState<MachineryType | null>(null);
  const [accOpen, setAccOpen] = useState(false);
  const [accDate, setAccDate] = useState("");
  const [accPicked, setAccPicked] = useState<string[]>([]);
  const [accCustom, setAccCustom] = useState("");
  const [accSaving, setAccSaving] = useState(false);
  const [accError, setAccError] = useState<string | null>(null);
  const [albums, setAlbums] = useState<PhotoAlbum[]>([]);
  const [albumOpen, setAlbumOpen] = useState(false);
  const [albumNote, setAlbumNote] = useState("");
  const [albumFiles, setAlbumFiles] = useState<File[]>([]);
  const [albumSaving, setAlbumSaving] = useState(false);
  const [albumError, setAlbumError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ urls: string[]; index: number } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const machine = await getMachinery(code);
      if (machine) {
        setIsEngine(false);
        setAsset(machine);
        setTypeCatalog(await getMachineryType(machine.typeCode));
        const hosts = await listEngineHostTypes();
        setHostTypes(hosts);
        if (isEngineHostType(machine.typeCode, hosts)) {
          setMounted(await getMountedEngine(machine.id));
          setIdleEngines(await listUnmountedEngines());
        } else {
          setMounted(null);
        }
        setAlbums(await listPhotoAlbums(machine.id));
      } else {
        const eng = await getEngine(code);
        setIsEngine(Boolean(eng));
        setAsset(eng);
        setTypeCatalog(null);
        setAlbums([]);
        if (eng) {
          setHistory(await listInstallHistory(eng.id));
          setEngineMaint(await listEngineMaintenance(eng.id));
          if (eng.engine?.brandSlug && eng.engine.model) {
            setEngineModel(await getEngineModel(eng.engine.brandSlug, eng.engine.model));
          }
          const hosts = await listEngineHostTypes();
          const machines = await listMachinery();
          const allUnits = await listEngines();
          const taken = new Set(allUnits.map((u) => u.engine?.mountedHostId).filter(Boolean));
          setHostOptions(
            machines.filter((m) => isEngineHostType(m.typeCode, hosts) && !taken.has(m.id)),
          );
          if (eng.engine?.mountedHostCode) {
            setHostMachine(await getMachinery(eng.engine.mountedHostCode));
          } else {
            setHostMachine(null);
          }
        }
      }
    } catch {
      setAsset(null);
      setAlbums([]);
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    void load();
  }, [load]);

  const records = useMemo(
    () => maintenanceRecords.filter((m) => m.assetCode === asset?.code),
    [asset],
  );

  async function handleSubmit(input: MachineryInput) {
    if (!asset || isEngine) return;
    setSaving(true);
    setFormError(null);
    try {
      const next = await updateMachinery(asset.id, { ...input, lat: asset.lat, lng: asset.lng });
      setAsset(next);
      setTypeCatalog(await getMachineryType(next.typeCode));
      setFormOpen(false);
      if (next.code !== code) router.replace(`/assets/${next.code}`);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  }

  async function handleEngineSubmit(input: EngineInput) {
    if (!asset || !isEngine) return;
    setSaving(true);
    setFormError(null);
    try {
      const next = await updateEngine(asset.id, input);
      setAsset(next);
      setFormOpen(false);
      if (next.code !== code) router.replace(`/assets/${next.code}`);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!asset) return;
    if (!window.confirm(`確定刪除 ${asset.code} ${asset.name}？此操作無法復原。`)) return;
    try {
      if (isEngine) {
        await deleteEngine(asset.id);
        router.push("/machinery/engines");
      } else {
        await deleteMachinery(asset.id);
        router.push(`/machinery/${asset.typeCode}`);
      }
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "刪除失敗");
    }
  }

  function openAccForm() {
    setAccError(null);
    setAccPicked([]);
    setAccCustom("");
    setAccDate(new Date().toISOString().slice(0, 10));
    setAccOpen(true);
  }

  async function handleAddAccessories() {
    if (!asset || isEngine) return;
    const names = [
      ...accPicked,
      ...accCustom
        .split(/[,，]/)
        .map((n) => n.trim())
        .filter(Boolean),
    ];
    if (names.length === 0) {
      setAccError("請勾選預設配件或輸入其他名稱");
      return;
    }
    setAccSaving(true);
    setAccError(null);
    try {
      await addAssetAccessories(
        asset.id,
        names.map((name) => ({ name, installedAt: accDate })),
      );
      setAccOpen(false);
      await load();
    } catch (e) {
      setAccError(e instanceof Error ? e.message : "新增失敗");
    } finally {
      setAccSaving(false);
    }
  }

  function openAlbumForm() {
    setAlbumError(null);
    setAlbumNote("");
    setAlbumFiles([]);
    setAlbumOpen(true);
  }

  async function handleCreateAlbum() {
    if (!asset || isEngine) return;
    setAlbumSaving(true);
    setAlbumError(null);
    try {
      const created = await createPhotoAlbum(asset.id, { note: albumNote, files: albumFiles });
      setAlbums((prev) => [created, ...prev]);
      setAlbumOpen(false);
    } catch (e) {
      setAlbumError(e instanceof Error ? e.message : "上傳失敗");
    } finally {
      setAlbumSaving(false);
    }
  }

  async function handleDeleteAlbum(album: PhotoAlbum) {
    if (!window.confirm("確定刪除此相片組？")) return;
    try {
      await deletePhotoAlbum(album);
      setAlbums((prev) => prev.filter((a) => a.id !== album.id));
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "刪除失敗");
    }
  }

  if (loading) {
    return (
      <>
        <TopBar crumb="機械設備管理 / 詳細資訊" title="載入中" showBack />
        <main className="p-8 text-sm text-[#6b7280]">載入機械資訊…</main>
      </>
    );
  }

  if (!asset) {
    return (
      <>
        <TopBar crumb="機械設備管理 / 詳細資訊" title="找不到設備" showBack />
        <main className="p-8">設備不存在</main>
      </>
    );
  }

  const gallery = asset.photos.length > 0 ? asset.photos : asset.photo ? [asset.photo] : [];
  const chart = (asset.monthlyHours.length ? asset.monthlyHours : [0]).map((h, i) => ({
    month: `${i + 1}月`,
    hours: h,
  }));

  const canHost = !isEngine && isEngineHostType(asset.typeCode, hostTypes);
  const displayTabs = isEngine
    ? ([
        ["總覽", "總覽"],
        ["維修紀錄", `維修記錄 (${engineMaint.length})`],
        ["保養紀錄", `安裝記錄 (${history.length})`],
      ] as const)
    : tabs.map((t) => [t, t] as const);
  const lastInstall = [...history]
    .filter((h) => h.action === "安裝")
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))[0];
  const installDate =
    asset.engine?.mountedHostCode && lastInstall?.occurredAt
      ? lastInstall.occurredAt.slice(0, 10)
      : "—";
  const nextMaint = nextMaintenanceDate(asset.lastMaintenance);
  const installedNames = new Set(asset.accessories.map((a) => a.name.toLowerCase()));
  const unusedCatalog = (typeCatalog?.accessoryCatalog ?? []).filter(
    (n) => !installedNames.has(n.toLowerCase()),
  );

  return (
    <>
      <TopBar
        crumb={isEngine ? "機械管理系統 / 機械設備 / 引擎管理" : "機械設備管理 / 詳細資訊"}
        title={isEngine ? `${asset.code} 引擎詳細資訊` : `${asset.code} 機械資訊`}
        showBack
      />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mb-5 flex overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white">
          <div className="relative h-[360px] w-[600px] shrink-0">
            <div
              className="h-full w-full bg-cover bg-center"
              style={{ backgroundImage: `url(${gallery[photo] ?? asset.photo})` }}
            />
            {gallery.length > 1 && (
              <>
            <button
              type="button"
              onClick={() => setPhoto((p) => (p + gallery.length - 1) % gallery.length)}
              className="absolute top-1/2 left-3 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-[rgba(15,23,42,0.4)] text-lg text-white backdrop-blur"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => setPhoto((p) => (p + 1) % gallery.length)}
              className="absolute top-1/2 right-3 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-[rgba(15,23,42,0.4)] text-lg text-white backdrop-blur"
            >
              ›
            </button>
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2.5 rounded-full border border-white/10 bg-[rgba(15,23,42,0.4)] px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur">
              {gallery.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 w-1.5 rounded-full ${i === photo ? "bg-white" : "bg-white/35"}`}
                />
              ))}
              {gallery.length ? `${photo + 1} / ${gallery.length}` : "0 / 0"}
            </div>
              </>
            )}
          </div>
          <div className="flex flex-1 flex-col justify-between p-7">
            <div>
              <div className="text-base font-bold text-[#16a34a]">
                {isEngine ? "Engine 引擎" : `${asset.typeLabelEn} ${asset.typeLabel}`}
              </div>
              <div className={`${isEngine ? "text-[32px] font-extrabold" : "text-[28px] font-extrabold"} leading-tight`}>
                {isEngine ? (
                  `${asset.code} ${asset.manufacturer || asset.engine?.brand || ""} ${asset.model}`.trim()
                ) : (
                  <>
                    {asset.code}
                    <br />
                    {asset.name}
                  </>
                )}
              </div>
              {!isEngine && (
              <div className="mt-4 flex gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-md border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-1.5 text-xs font-semibold text-[#16a34a]"
              >
                <QrCode size={14} />
                顯示 QR 碼
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormError(null);
                  setFormOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-md border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-1.5 text-xs font-semibold text-[#16a34a]"
              >
                <Pencil size={14} />
                編輯
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                className="inline-flex items-center gap-1.5 rounded-md border border-[#fecaca] bg-[#fef2f2] px-3 py-1.5 text-xs font-semibold text-[#dc2626]"
              >
                <Trash2 size={14} />
                刪除設備
              </button>
              </div>
              )}
            </div>
            <div className="flex items-center gap-5 border-t border-[#e5e7eb] pt-5">
              {!isEngine && (
                <>
              <div>
                <div className="text-[10px] font-medium tracking-wide text-[#9ca3af] uppercase">
                  工程類型
                </div>
                <div className="text-[15px] font-bold">{asset.projectType}</div>
              </div>
              <div className="h-8 w-px bg-[#e5e7eb]" />
              <div>
                <div className="text-[10px] font-medium tracking-wide text-[#9ca3af] uppercase">
                  公司
                </div>
                <div className="text-[15px] font-bold">{asset.company}</div>
              </div>
              <div className="h-8 w-px bg-[#e5e7eb]" />
                </>
              )}
              <div>
                <div className="text-[10px] font-medium tracking-wide text-[#9ca3af] uppercase">
                  {isEngine ? "當前狀態 Status" : "狀態"}
                </div>
                <StatusBadge status={asset.status} />
              </div>
              {isEngine && (
                <>
                  <div className="ml-auto flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFormError(null);
                        setFormOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-md border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-1.5 text-xs font-semibold text-[#16a34a]"
                    >
                      <Pencil size={14} />
                      編輯
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete()}
                      className="inline-flex items-center gap-1.5 rounded-md border border-[#fecaca] bg-[#fef2f2] px-3 py-1.5 text-xs font-semibold text-[#dc2626]"
                    >
                      <Trash2 size={14} />
                      刪除
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
          {!isEngine && (
          <div className="flex w-[217px] shrink-0 flex-col justify-between border-l border-[#e5e7eb] p-5">
            <div className="flex items-center justify-between border-b border-[#f3f4f6] pb-2.5">
              <span className="text-sm font-bold">當前位置</span>
              <Link
                href={`/map?site=${encodeURIComponent(asset.location)}`}
                className="inline-flex items-center gap-1 rounded-md border border-[#e5e7eb] bg-[#f9fafb] px-2.5 py-1 text-xs font-semibold"
              >
                查看完整地圖
                <ExternalLink size={12} />
              </Link>
            </div>
            <div className="relative h-[180px] overflow-hidden rounded-lg bg-[#e5e7eb]">
              <AssetMiniMap lat={asset.lat} lng={asset.lng} />
            </div>
            <div className="flex items-start gap-1.5 text-xs font-medium text-[#374151]">
              <MapPin size={14} className="mt-0.5 shrink-0" />
              {asset.location}
            </div>
          </div>
          )}
        </div>

        <div className="mb-5 flex rounded-lg border border-[#e5e7eb] bg-white">
          {displayTabs.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id as (typeof tabs)[number])}
              className={`px-6 py-3.5 text-[13px] ${
                tab === id
                  ? "border-b-2 border-[#16a34a] font-semibold text-[#16a34a]"
                  : "text-[#6b7280]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "總覽" && (
          isEngine ? (
          <div className="grid grid-cols-3 gap-4">
            <InfoCard
              title="基本資訊"
              onEdit={() => {
                setFormError(null);
                setFormOpen(true);
              }}
              fields={[
                ["編號 Equipment ID", asset.code],
                ["機械類型 Category Type", "Engine (引擎)"],
                ["型號 Model Number", asset.model || "—"],
                ["製造商 Manufacturer", asset.manufacturer || asset.engine?.brand || "—"],
                [
                  "馬力/排量 Horsepower / Displacement",
                  `${asset.engine?.horsepower || "—"} / ${asset.engine?.displacement || "—"}`,
                ],
                ["燃料類型 Fuel Type", asset.engine?.fuelType || "—"],
                ["排放標準 Emission Standard", asset.engine?.emission || "—"],
              ]}
            />
            <div className="rounded-[10px] border border-[#e5e7eb] bg-white p-5">
              <div className="mb-3.5 border-b border-[#f3f4f6] pb-2.5 text-sm font-bold">安裝機械</div>
              <div className="flex flex-col gap-3.5">
                <div>
                  <div className="mb-1 text-[11px] text-[#6b7280]">目前安裝 Current Installation</div>
                  {asset.engine?.mountedHostCode ? (
                    <Link
                      href={`/assets/${asset.engine.mountedHostCode}`}
                      className="inline-flex rounded-md border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-1.5 text-[13px] font-bold text-[#15803d]"
                    >
                      {asset.engine.mountedHostCode}
                    </Link>
                  ) : (
                    <div className="rounded-md border border-[#e5e7eb] bg-[#f9fafb] px-3 py-2 text-[13px] text-[#6b7280]">
                      未掛載
                    </div>
                  )}
                </div>
                <Field label="機械類型 Installation Category" value={hostMachine ? `${hostMachine.typeLabel} ${hostMachine.typeLabelEn}` : "—"} />
                <Field label="安裝日期 Installation Date" value={installDate} />
                <div>
                  <div className="mb-1 text-[11px] text-[#6b7280]">狀態 Active Status</div>
                  {asset.engine?.mountedHostCode ? (
                    <span className="inline-flex items-center gap-2 rounded-md border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-1.5 text-[13px] font-semibold text-[#15803d]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#16a34a]" />
                      運作中
                    </span>
                  ) : (
                    <span className="text-[13px] text-[#6b7280]">閒置</span>
                  )}
                </div>
                {asset.engine?.mountedHostId ? (
                  <button
                    type="button"
                    className="rounded-md bg-[#fef2f2] px-3 py-1.5 text-xs font-bold text-[#dc2626]"
                    onClick={async () => {
                      await unmountEngine(asset.id);
                      await load();
                    }}
                  >
                    拆卸引擎
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <select
                      value={hostPick}
                      onChange={(e) => setHostPick(e.target.value)}
                      className="h-9 flex-1 rounded-md border border-[#e5e7eb] bg-[#f9fafb] px-2 text-sm"
                    >
                      <option value="">選擇 CC / SC / TD / AC</option>
                      {hostOptions.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.code} {h.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={!hostPick}
                      className="rounded-md bg-[#16a34a] px-3 text-xs font-bold text-white disabled:opacity-40"
                      onClick={async () => {
                        await mountEngine(asset.id, hostPick);
                        setHostPick("");
                        await load();
                      }}
                    >
                      安裝
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div>
            <InfoCard
              title="運行數據"
              fields={[
                ["總運行時數 Cumulative Hours", `${asset.runningHours.toLocaleString()} 小時`],
                ["上次保養 Last Maintenance Date", asset.lastMaintenance || "—"],
                ["下次保養 Next Maintenance Date", nextMaint],
                ["機油更換週期 Oil Change Interval", "每 500 小時"],
              ]}
            />
            {nextMaint !== "—" && nextMaint <= new Date().toISOString().slice(0, 10) && (
              <div className="mt-3 rounded-lg border border-[#fde68a] bg-[#fffbeb] px-3 py-2.5 text-xs font-semibold text-[#92400e]">
                保養提醒：已到達或超過下次保養日期
              </div>
            )}
            </div>
          </div>
          ) : (
          <div className="grid grid-cols-4 gap-4">
            <InfoCard
              title="基本資訊"
              onEdit={() => {
                setFormError(null);
                setFormOpen(true);
              }}
              fields={[
                ["編號 Equipment ID", asset.code],
                ["機械類型 Category Type", `${asset.typeLabelEn} (${asset.typeLabel})`],
                ["型號 Model Number", asset.model],
                ["廠牌 Manufacturer", asset.manufacturer],
                ...(typeCatalog?.specFields ?? []).map((f) => {
                  const raw = asset.specs[f.key] ?? asset.specs[f.label] ?? "";
                  const value = raw
                    ? f.unit && !String(raw).includes(f.unit)
                      ? `${raw} ${f.unit}`
                      : String(raw)
                    : "未填寫";
                  return [f.unit ? `${f.label} (${f.unit})` : f.label, value] as [string, string];
                }),
                ["機鐘 operation hour", `${asset.runningHours.toLocaleString()} 小時`],
              ]}
            />
            <div className="rounded-[10px] border border-[#e5e7eb] bg-white p-5">
              <div className="mb-3.5 flex items-center justify-between border-b border-[#f3f4f6] pb-2.5">
                <span className="text-sm font-bold">引擎配置</span>
              </div>
              {canHost ? (
                <div className="space-y-3 text-[13px]">
                  {mounted ? (
                    <>
                      <div className="flex flex-col gap-2.5">
                        {(
                          [
                            ["編號 Equipment ID", mounted.code],
                            ["名稱", mounted.name],
                            ["廠牌 Manufacturer", mounted.manufacturer || mounted.engine?.brand || "—"],
                            ["型號 Model Number", mounted.engine?.model || mounted.model || "—"],
                            [
                              "馬力 / 排氣",
                              `${mounted.engine?.horsepower || "—"} · ${mounted.engine?.displacement || "—"}`,
                            ],
                            [
                              "燃料 / 排放",
                              `${mounted.engine?.fuelType || "—"} · ${mounted.engine?.emission || "—"}`,
                            ],
                            ["機鐘 operation hour", `${mounted.runningHours.toLocaleString()} 小時`],
                            ["序號 Serial", mounted.serialNumber || "—"],
                            ["狀態", mounted.status],
                          ] as [string, string][]
                        ).map(([label, value]) => (
                          <div key={label}>
                            <div className="mb-1 text-[11px] text-[#6b7280]">{label}</div>
                            <div className="rounded-md border border-[#e5e7eb] bg-[#f9fafb] px-2.5 py-2 text-[13px] font-semibold">
                              {label === "編號 Equipment ID" ? (
                                <Link href={`/assets/${mounted.code}`} className="text-[#15803d]">
                                  {value}
                                </Link>
                              ) : (
                                value
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        className="rounded-md bg-[#fef2f2] px-3 py-1.5 text-xs font-bold text-[#dc2626]"
                        onClick={async () => {
                          await unmountEngine(mounted.id);
                          await load();
                        }}
                      >
                        拆卸
                      </button>
                    </>
                  ) : (
                    <div className="flex gap-2">
                      <select
                        value={enginePick}
                        onChange={(e) => setEnginePick(e.target.value)}
                        className="h-9 flex-1 rounded-md border border-[#e5e7eb] bg-[#f9fafb] px-2 text-sm"
                      >
                        <option value="">選擇未掛載引擎</option>
                        {idleEngines.map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.code} {e.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        disabled={!enginePick}
                        className="rounded-md bg-[#16a34a] px-3 text-xs font-bold text-white disabled:opacity-40"
                        onClick={async () => {
                          await mountEngine(enginePick, asset.id);
                          setEnginePick("");
                          await load();
                        }}
                      >
                        安裝
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-[13px] text-[#6b7280]">此類型未掛載獨立引擎</div>
              )}
            </div>
            <div className="rounded-[10px] border border-[#e5e7eb] bg-white p-5">
              <div className="mb-3.5 flex items-center justify-between border-b border-[#f3f4f6] pb-2.5">
                <span className="text-sm font-bold">其他配件安裝</span>
                <button
                  type="button"
                  onClick={openAccForm}
                  className="rounded-md bg-[#1b7a4f] px-3 py-1.5 text-xs font-semibold text-white"
                >
                  + 新增配件
                </button>
              </div>
              <div className="overflow-hidden rounded-lg border border-[#e5e7eb]">
                <div className="grid grid-cols-[1fr_140px_100px] bg-[#f9fafb] px-3.5 py-2.5 text-[11px] font-semibold tracking-wide text-[#6b7280] uppercase">
                  <span>配件名稱</span>
                  <span>安裝日期</span>
                  <span>狀態</span>
                </div>
                {asset.accessories.map((acc) => (
                  <div
                    key={acc.name}
                    className="grid grid-cols-[1fr_140px_100px] items-center border-t border-[#f3f4f6] px-3.5 py-3.5 text-[13px]"
                  >
                    <span className="font-medium text-[#374151]">{acc.name}</span>
                    <span className="text-[#6b7280]">{acc.installedAt}</span>
                    <span
                      className={`w-fit rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        acc.status === "正常"
                          ? "bg-[#dcfce7] text-[#15803d]"
                          : "bg-[#fef3c7] text-[#92400e]"
                      }`}
                    >
                      {acc.status}
                    </span>
                  </div>
                ))}
                {asset.accessories.length === 0 && (
                  <div className="px-3.5 py-6 text-center text-sm text-[#9ca3af]">尚無配件</div>
                )}
              </div>
            </div>
            <div className="rounded-[10px] border border-[#e5e7eb] bg-white p-5">
              <div className="mb-3.5 border-b border-[#f3f4f6] pb-2.5 text-sm font-bold">每月機鐘表</div>
              <div className="h-[220px] rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chart}>
                    <CartesianGrid stroke="#e5e7eb" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6b7280" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="hours" stroke="#228B22" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          )
        )}

        {tab === "維修紀錄" && (
          <div className="rounded-[10px] border border-[#e5e7eb] bg-white p-5">
            <div className="mb-3.5 flex items-center justify-between border-b border-[#f3f4f6] pb-2.5">
              <span className="text-sm font-bold">{isEngine ? "引擎獨立維修紀錄" : "維修紀錄歷史"}</span>
              <Link href="/maintenance" className="rounded-md bg-[#1b7a4f] px-3 py-1.5 text-xs font-semibold text-white">
                + 新增紀錄
              </Link>
            </div>
            <div className="overflow-hidden rounded-lg border border-[#e5e7eb]">
              <div className="grid grid-cols-[160px_1fr_80px] bg-[#f9fafb] px-3.5 py-2.5 text-[11px] font-semibold tracking-wide text-[#6b7280] uppercase">
                <span>維修日期</span>
                <span>維修內容</span>
                <span>小時</span>
              </div>
              {(isEngine ? engineMaint : records).map((r) => (
                <div
                  key={r.id}
                  className="grid grid-cols-[160px_1fr_80px] items-center border-t border-[#f3f4f6] px-3.5 py-3.5 text-[13px]"
                >
                  <span className="font-medium">{r.date}</span>
                  <span>{r.description}</span>
                  <span>{r.hours}</span>
                </div>
              ))}
              {(isEngine ? engineMaint : records).length === 0 && (
                <div className="px-3.5 py-8 text-center text-sm text-[#9ca3af]">尚無維修紀錄</div>
              )}
            </div>
          </div>
        )}

        {tab === "保養紀錄" && (
          <div className="rounded-[10px] border border-[#e5e7eb] bg-white p-5">
            {isEngine ? (
              <>
                <div className="mb-3.5 border-b border-[#f3f4f6] pb-2.5 text-sm font-bold">安裝／拆卸軌跡</div>
                {history.map((h) => (
                  <div key={h.id} className="flex justify-between border-t border-[#f3f4f6] py-3 text-[13px]">
                    <span className="font-semibold">{h.action}</span>
                    <span>{h.machineryCode}</span>
                    <span>{h.hoursAtEvent} 小時</span>
                    <span className="text-[#6b7280]">{h.occurredAt}</span>
                  </div>
                ))}
                {history.length === 0 && <div className="py-6 text-center text-sm text-[#9ca3af]">尚無軌跡</div>}
              </>
            ) : (
              <div className="p-3 text-sm text-[#6b7280]">
                定期保養紀錄與特別安裝/更換紀錄將顯示於此。引擎掛載於 {mounted?.code ?? "—"}
                ，主機維修工時會自動同步至掛載引擎機鐘。
              </div>
            )}
          </div>
        )}

        {tab === "證書文件" && (
          <div className="rounded-[10px] border border-[#e5e7eb] bg-white p-8 text-sm text-[#6b7280]">
            產品冊、說明書、油路/電路圖與證書 PDF 儲存於 Supabase Storage。請至「證書及文件」模組管理過期提醒。
          </div>
        )}

        {tab === "圖片庫" && (
          <div className="rounded-[10px] border border-[#e5e7eb] bg-white p-5">
            <div className="mb-3.5 flex items-center justify-between border-b border-[#f3f4f6] pb-2.5">
              <span className="text-sm font-bold">圖片庫</span>
              <button
                type="button"
                onClick={openAlbumForm}
                className="rounded-md bg-[#1b7a4f] px-3 py-1.5 text-xs font-semibold text-white"
              >
                + 新增照片
              </button>
            </div>
            <div className="overflow-hidden rounded-lg border border-[#e5e7eb]">
              <div className="grid grid-cols-[280px_1fr_120px_60px] items-center bg-[#f9fafb] px-3.5 py-2 text-[11px] font-semibold tracking-wide text-[#6b7280] uppercase">
                <span>相片</span>
                <span>備註</span>
                <span>建立時間</span>
                <span className="text-right">操作</span>
              </div>
              {albums.map((album) => {
                const shown = album.urls.slice(0, 4);
                const extra = album.urls.length - shown.length;
                return (
                  <div
                    key={album.id}
                    className="grid grid-cols-[280px_1fr_120px_60px] items-center gap-4 border-t border-[#e5e7eb] px-3 py-3"
                  >
                    <div className="flex h-[52px] w-[280px] gap-1.5">
                      {shown.map((url, i) => (
                        <button
                          key={url + i}
                          type="button"
                          onClick={() => setLightbox({ urls: album.urls, index: i })}
                          className="h-[52px] w-[70px] shrink-0 overflow-hidden rounded-md bg-cover bg-center"
                          style={{ backgroundImage: `url(${url})` }}
                        />
                      ))}
                      {extra > 0 && (
                        <button
                          type="button"
                          onClick={() => setLightbox({ urls: album.urls, index: 4 })}
                          className="flex h-[52px] w-[70px] shrink-0 items-center justify-center rounded-md bg-[#f3f4f6] text-xs font-bold text-[#6b7280]"
                        >
                          +{extra}
                        </button>
                      )}
                    </div>
                    <div className="text-[13px] text-[#111827]">{album.note || "—"}</div>
                    <div className="text-[13px] text-[#6b7280]">{album.createdAt}</div>
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setLightbox({ urls: album.urls, index: 0 })}
                        className="flex h-[30px] w-[30px] items-center justify-center rounded-md border border-[#e5e7eb] bg-[#f9fafb]"
                        aria-label="檢視"
                      >
                        <Eye size={14} className="text-[#6b7280]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteAlbum(album)}
                        className="flex h-[30px] w-[30px] items-center justify-center rounded-md border border-[#fecaca] bg-[#fef2f2]"
                        aria-label="刪除"
                      >
                        <Trash2 size={14} className="text-[#dc2626]" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {albums.length === 0 && (
                <div className="px-3.5 py-8 text-center text-sm text-[#9ca3af]">尚無相片組</div>
              )}
            </div>
          </div>
        )}
      </main>

      {!isEngine && (
      <AssetFormModal
        open={formOpen}
        typeCode={asset.typeCode}
        asset={asset}
        saving={saving}
        error={formError}
        onClose={() => setFormOpen(false)}
        onSubmit={(input) => void handleSubmit(input)}
      />
      )}
      {isEngine && engineModel && (
        <EngineFormModal
          open={formOpen}
          model={engineModel}
          asset={asset}
          saving={saving}
          error={formError}
          onClose={() => setFormOpen(false)}
          onSubmit={(input) => void handleEngineSubmit(input)}
        />
      )}
      {accOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(17,24,39,0.6)] p-6">
          <div className="w-[440px] rounded-2xl bg-white p-7 shadow-[0_10px_25px_rgba(0,0,0,0.1)]">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <div className="text-[11px] font-bold tracking-[0.09em] text-[#16a34a]">ACCESSORY</div>
                <div className="text-[20px] font-extrabold">新增配件安裝</div>
              </div>
              <button type="button" onClick={() => setAccOpen(false)} className="rounded-full bg-[#f3f4f6] p-2">
                <X size={16} />
              </button>
            </div>
            <label className="mb-4 block text-[13px] font-semibold">
              安裝日期
              <input
                type="date"
                value={accDate}
                onChange={(e) => setAccDate(e.target.value)}
                className="mt-2 h-10 w-full rounded-lg border border-[#dedede] bg-[#f5f5f5] px-3 text-sm"
              />
            </label>
            <div className="mb-4">
              <div className="mb-2 text-[13px] font-semibold">此類型預設配件</div>
              {unusedCatalog.length === 0 ? (
                <p className="text-xs text-[#9ca3af]">沒有可勾選的預設配件（已全部安裝或尚未在類型中設定）。</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {unusedCatalog.map((name) => {
                    const checked = accPicked.includes(name);
                    return (
                      <label key={name} className="flex items-center gap-2 text-[13px]">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setAccPicked((prev) =>
                              checked ? prev.filter((n) => n !== name) : [...prev, name],
                            )
                          }
                          className="h-4 w-4"
                        />
                        {name}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
            <label className="mb-4 block text-[13px] font-semibold">
              其他（自訂名稱）
              <input
                value={accCustom}
                onChange={(e) => setAccCustom(e.target.value)}
                placeholder="可輸入一個名稱，或以逗號分隔多個"
                className="mt-2 h-10 w-full rounded-lg border border-[#dedede] bg-[#f5f5f5] px-3 text-sm"
              />
            </label>
            {accError && <p className="mb-3 text-sm font-semibold text-[#dc2626]">{accError}</p>}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setAccOpen(false)}
                className="flex-1 rounded-lg border border-[#d1d5db] py-3 text-[15px] font-bold"
              >
                取消
              </button>
              <button
                type="button"
                disabled={accSaving}
                onClick={() => void handleAddAccessories()}
                className="flex-1 rounded-lg bg-[#16a34a] py-3 text-[15px] font-bold text-white disabled:opacity-40"
              >
                {accSaving ? "儲存中…" : "新增"}
              </button>
            </div>
          </div>
        </div>
      )}
      {albumOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(17,24,39,0.6)] p-6">
          <div className="w-[440px] rounded-2xl bg-white p-7 shadow-[0_10px_25px_rgba(0,0,0,0.1)]">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <div className="text-[11px] font-bold tracking-[0.09em] text-[#16a34a]">PHOTO ALBUM</div>
                <div className="text-[20px] font-extrabold">新增照片</div>
              </div>
              <button type="button" onClick={() => setAlbumOpen(false)} className="rounded-full bg-[#f3f4f6] p-2">
                <X size={16} />
              </button>
            </div>
            <label className="mb-4 block text-[13px] font-semibold">
              相片（可多選）
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setAlbumFiles(Array.from(e.target.files ?? []))}
                className="mt-2 w-full text-sm"
              />
              {albumFiles.length > 0 && (
                <p className="mt-1 text-xs font-normal text-[#6b7280]">已選 {albumFiles.length} 張</p>
              )}
            </label>
            <label className="mb-4 block text-[13px] font-semibold">
              備註
              <input
                value={albumNote}
                onChange={(e) => setAlbumNote(e.target.value)}
                placeholder="例如：工地現場 — 主機組裝完成"
                className="mt-2 h-10 w-full rounded-lg border border-[#dedede] bg-[#f5f5f5] px-3 text-sm font-normal"
              />
            </label>
            {albumError && <p className="mb-3 text-sm font-semibold text-[#dc2626]">{albumError}</p>}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setAlbumOpen(false)}
                className="flex-1 rounded-lg border border-[#d1d5db] py-3 text-[15px] font-bold"
              >
                取消
              </button>
              <button
                type="button"
                disabled={albumSaving || albumFiles.length === 0}
                onClick={() => void handleCreateAlbum()}
                className="flex-1 rounded-lg bg-[#16a34a] py-3 text-[15px] font-bold text-white disabled:opacity-40"
              >
                {albumSaving ? "上傳中…" : "新增"}
              </button>
            </div>
          </div>
        </div>
      )}
      {lightbox && lightbox.urls.length > 0 && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-[rgba(17,24,39,0.85)] p-8"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute top-5 right-5 rounded-full bg-white/10 p-2 text-white"
          >
            <X size={18} />
          </button>
          {lightbox.urls.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightbox((cur) =>
                  cur
                    ? { ...cur, index: (cur.index + cur.urls.length - 1) % cur.urls.length }
                    : cur,
                );
              }}
              className="absolute left-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-2xl text-white"
            >
              ‹
            </button>
          )}
          <img
            src={lightbox.urls[lightbox.index]}
            alt=""
            className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {lightbox.urls.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightbox((cur) =>
                  cur ? { ...cur, index: (cur.index + 1) % cur.urls.length } : cur,
                );
              }}
              className="absolute right-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-2xl text-white"
            >
              ›
            </button>
          )}
          <div className="absolute bottom-6 rounded-full bg-black/40 px-3 py-1 text-xs font-semibold text-white">
            {lightbox.index + 1} / {lightbox.urls.length}
          </div>
        </div>
      )}
    </>
  );
}

function InfoCard({
  title,
  fields,
  onEdit,
}: {
  title: string;
  fields: [string, string][];
  onEdit?: () => void;
}) {
  return (
    <div className="rounded-[10px] border border-[#e5e7eb] bg-white p-5">
      <div className="mb-3.5 flex items-center justify-between border-b border-[#f3f4f6] pb-2.5">
        <span className="text-sm font-bold">{title}</span>
        {onEdit && (
          <button type="button" onClick={onEdit} className="rounded-md bg-[#f0fdf4] p-1.5">
            <Pencil size={14} className="text-[#16a34a]" />
          </button>
        )}
      </div>
      <div className="flex flex-col gap-2.5">
        {fields.map(([label, value]) => (
          <div key={label}>
            <div className="mb-1 text-[11px] text-[#6b7280]">{label}</div>
            <div className="rounded-md border border-[#e5e7eb] bg-[#f9fafb] px-2.5 py-2 text-[13px] font-semibold">
              {value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mb-1 text-[11px] text-[#6b7280]">{label}</div>
      <div className="rounded-md border border-[#e5e7eb] bg-[#f9fafb] px-2.5 py-2 text-[13px] font-semibold">
        {value}
      </div>
    </div>
  );
}

function nextMaintenanceDate(last: string | undefined) {
  if (!last) return "—";
  const d = new Date(last);
  if (Number.isNaN(d.getTime())) return "—";
  d.setMonth(d.getMonth() + 3);
  return d.toISOString().slice(0, 10);
}
