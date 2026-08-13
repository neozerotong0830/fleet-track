"use client";

import { useEffect, useMemo, useState } from "react";
import { ImagePlus, MapPin, Search, X } from "lucide-react";
import { SessionTimeline } from "@/components/maintenance/SessionTimeline";
import { assets, maintenanceStaff } from "@/lib/mock-data";
import { calcHours, DAILY_HOUR_CAP } from "@/lib/constants";
import { findFilledOpenJob, isFilledOpenJob } from "@/lib/maintenance";
import type { Asset, MaintenanceRecord, MaintenanceStatus, MaintenanceType } from "@/lib/types";

const categories = [
  { id: "machinery", label: "機械設備" },
  { id: "drilling_tool", label: "鑽具設備" },
  { id: "site_tool", label: "地盤工具" },
  { id: "electrical", label: "電器設備" },
] as const;

export type MaintenanceSubmitPayload = {
  assetCode: string;
  date: string;
  technicians: string[];
  type: MaintenanceType;
  reason: string;
  parts: string;
  description: string;
  startTime: string;
  endTime: string;
  hours: number;
  overtime: boolean;
  status: MaintenanceStatus;
  photos: string[];
  continueFromId?: string;
};

export function NewMaintenanceModal({
  open,
  onClose,
  onSubmit,
  records,
  continueFrom,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: MaintenanceSubmitPayload) => void;
  records: MaintenanceRecord[];
  continueFrom?: MaintenanceRecord | null;
}) {
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState<string>("machinery");
  const [selected, setSelected] = useState<Asset | null>(null);
  const [q, setQ] = useState("");
  const [date, setDate] = useState("");
  const [technicians, setTechnicians] = useState<string[]>([]);
  const [staffOpen, setStaffOpen] = useState(false);
  const [type, setType] = useState<MaintenanceType>("突發維修");
  const [reason, setReason] = useState("");
  const [parts, setParts] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("12:00");
  const [status, setStatus] = useState<MaintenanceStatus>("未完成");
  const [photos, setPhotos] = useState<string[]>([]);
  const [linkedJob, setLinkedJob] = useState<MaintenanceRecord | null>(null);

  const hours = calcHours(startTime, endTime);
  const overtime = hours > DAILY_HOUR_CAP;

  const list = useMemo(() => {
    return assets.filter((a) => {
      if (a.category !== category) return false;
      const s = q.toLowerCase();
      return !s || a.code.toLowerCase().includes(s) || a.name.toLowerCase().includes(s);
    });
  }, [category, q]);

  useEffect(() => {
    if (!open) return;
    if (continueFrom && isFilledOpenJob(continueFrom)) {
      const asset = assets.find((a) => a.code === continueFrom.assetCode) ?? null;
      setSelected(asset);
      setStep(3);
      setCategory(asset?.category ?? "machinery");
      setType(continueFrom.type);
      setReason(continueFrom.reason ?? "");
      setParts(continueFrom.parts ?? "");
      setDescription(continueFrom.description);
      setTechnicians(continueFrom.technicians);
      setLinkedJob(continueFrom);
      setStatus("未完成");
      setDate(new Date().toISOString().slice(0, 10));
      setStartTime("08:00");
      setEndTime("12:00");
      setPhotos([]);
    }
  }, [open, continueFrom]);

  useEffect(() => {
    if (!selected) {
      setLinkedJob(continueFrom ?? null);
      return;
    }
    if (continueFrom && continueFrom.assetCode === selected.code && isFilledOpenJob(continueFrom)) {
      setLinkedJob(continueFrom);
      return;
    }
    setLinkedJob(findFilledOpenJob(records, selected.code));
  }, [selected, records, continueFrom]);

  if (!open) return null;

  function reset() {
    setStep(1);
    setSelected(null);
    setQ("");
    setTechnicians([]);
    setReason("");
    setParts("");
    setDescription("");
    setPhotos([]);
    setLinkedJob(null);
    setStatus("未完成");
    setDate("");
    setStartTime("08:00");
    setEndTime("12:00");
    onClose();
  }

  function toggleTech(name: string) {
    setTechnicians((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]));
  }

  function onPickFiles(files: FileList | null) {
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setPhotos((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  }

  const canSubmit = selected && technicians.length > 0 && date && startTime && endTime && hours > 0;
  const accumulated = (linkedJob?.totalHours ?? 0) + hours;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(17,24,39,0.6)] p-6">
      <div className="flex max-h-[90vh] w-[560px] flex-col overflow-hidden rounded-2xl bg-white p-8 shadow-[0_10px_25px_rgba(0,0,0,0.1)]">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <div className="text-[11px] font-bold tracking-[0.09em] text-[#16a34a]">
              MAINTENANCE RECORD
            </div>
            <div className="text-[22px] font-extrabold">
              {linkedJob ? "接續維修紀錄" : "新增維修紀錄"}
            </div>
          </div>
          <button type="button" onClick={reset} className="rounded-full bg-[#f3f4f6] p-2">
            <X size={16} />
          </button>
        </div>

        <div className="mb-5 grid grid-cols-3 gap-2">
          {["1. 選擇類型", "2. 選擇編號", "3. 填寫維修資料"].map((label, i) => (
            <div key={label}>
              <div
                className={`text-[13px] ${step >= i + 1 ? "font-bold text-[#16a34a]" : "text-[#9ca3af]"}`}
              >
                {label}
              </div>
              <div className={`mt-1.5 h-[3px] rounded-full ${step >= i + 1 ? "bg-[#16a34a]" : "bg-[#e5e7eb]"}`} />
            </div>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          {step === 1 && (
            <>
              <p className="mb-3 text-sm font-semibold text-[#374151]">
                請選擇紀錄的維修設備的資產類型：
              </p>
              <div className="grid grid-cols-2 gap-3">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setCategory(c.id);
                      setStep(2);
                    }}
                    className="rounded-xl border border-[#e5e7eb] p-4 text-left hover:border-[#16a34a] hover:shadow-[0_4px_12px_rgba(22,163,74,0.15)]"
                  >
                    <div className="mb-2 text-base font-bold">{c.label}</div>
                    <div className="text-[13px] font-semibold text-[#16a34a]">選擇此類型 →</div>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="mb-2 flex items-center justify-between">
                <div className="text-base font-extrabold">選擇機械編號</div>
                <button type="button" className="text-[13px] font-bold text-[#16a34a]" onClick={() => setStep(1)}>
                  更改類型
                </button>
              </div>
              <p className="mb-3 text-[13px] text-[#6b7280]">請選擇需要記錄維修的資產。</p>
              <div className="mb-3 flex h-10 items-center gap-2 rounded-lg border border-[#dedede] bg-[#f5f5f5] px-3">
                <Search size={16} className="text-[#999]" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="搜尋設備編號或名稱..."
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>
              <div className="flex max-h-[360px] flex-col gap-2">
                {list.map((a) => {
                  const openJob = findFilledOpenJob(records, a.code);
                  return (
                    <button
                      key={a.code}
                      type="button"
                      onClick={() => {
                        setSelected(a);
                        setStep(3);
                        if (!date) setDate(new Date().toISOString().slice(0, 10));
                      }}
                      className="flex items-center justify-between rounded-lg border-l-4 border-[#16a34a] bg-[#f3f4f6] px-4 py-3 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="rounded-md bg-[#e0f2fe] px-2.5 py-1 text-[13px] font-bold text-[#0369a1]">
                          {a.code}
                        </span>
                        <span className="text-sm font-bold">{a.name}</span>
                        {openJob && (
                          <span className="rounded-full bg-[#fef3c7] px-2 py-0.5 text-[10px] font-bold text-[#d97706]">
                            未完成 · 累計 {openJob.totalHours}h
                          </span>
                        )}
                      </div>
                      <span className="flex items-center gap-1 text-[13px] text-[#6b7280]">
                        <MapPin size={14} />
                        {a.location}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {step === 3 && selected && (
            <>
              <div className="mb-4 flex items-center justify-between rounded-lg border border-[#c8e6c9] bg-[#e8f5e9] p-3.5">
                <div className="flex items-center gap-3">
                  <span className="rounded-md bg-[#16a34a] px-2.5 py-1 text-[13px] font-bold text-white">
                    {selected.code}
                  </span>
                  <div>
                    <div className="text-sm font-bold">{selected.name}</div>
                    <div className="text-xs text-[#6b7280]">{selected.location}</div>
                  </div>
                </div>
                <button
                  type="button"
                  className="text-[13px] font-bold text-[#16a34a]"
                  onClick={() => setStep(2)}
                >
                  更換設備
                </button>
              </div>

              {linkedJob && (
                <div className="mb-4 rounded-lg border border-[#fde68a] bg-[#fff7ed] px-3.5 py-3 text-[13px]">
                  <div className="font-bold text-[#92400e]">
                    接續未完成任務 {linkedJob.recordNo}
                  </div>
                  <div className="mt-1 text-[#6b7280]">
                    以下為既有累加時段，本次工時會自動加總，直至標記為已完成。
                  </div>
                  <SessionTimeline sessions={linkedJob.sessions} totalHours={linkedJob.totalHours} compact />
                </div>
              )}

              <label className="block text-[13px] font-semibold">
                維修日期
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-2 h-10 w-full rounded-lg border border-[#dedede] bg-[#f5f5f5] px-3 text-sm"
                />
              </label>

              <div className="relative mt-3">
                <div className="text-[13px] font-semibold">負責人員（可複選）</div>
                <button
                  type="button"
                  onClick={() => setStaffOpen((v) => !v)}
                  className="mt-2 flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-lg border border-[#dedede] bg-[#f5f5f5] px-3 py-2 text-left text-sm"
                >
                  {technicians.length === 0 ? (
                    <span className="text-[#999]">從維修組選擇維修員</span>
                  ) : (
                    technicians.map((name) => (
                      <span
                        key={name}
                        className="inline-flex items-center gap-1 rounded-full bg-[#dcfce7] px-2 py-0.5 text-xs font-semibold text-[#15803d]"
                      >
                        {name}
                        <span
                          role="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTech(name);
                          }}
                        >
                          <X size={10} />
                        </span>
                      </span>
                    ))
                  )}
                </button>
                {staffOpen && (
                  <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-[#e5e7eb] bg-white shadow-lg">
                    {maintenanceStaff.map((s) => {
                      const checked = technicians.includes(s.name);
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => toggleTech(s.name)}
                          className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-[#f9fafb]"
                        >
                          <span
                            className={`flex h-4 w-4 items-center justify-center rounded border ${
                              checked ? "border-[#16a34a] bg-[#16a34a] text-white" : "border-[#d1d5db]"
                            }`}
                          >
                            {checked ? "✓" : ""}
                          </span>
                          <img src={s.avatar} alt="" className="h-7 w-7 rounded-full object-cover" />
                          <span>
                            <span className="block text-sm font-semibold">{s.name}</span>
                            <span className="block text-[11px] text-[#6b7280]">{s.title}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <label className="mt-3 block text-[13px] font-semibold">
                維修類型
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as MaintenanceType)}
                  className="mt-2 h-10 w-full rounded-lg border border-[#dedede] bg-[#f5f5f5] px-3 text-sm"
                >
                  <option>突發維修</option>
                  <option>定期保養</option>
                  <option>預防性維修</option>
                </select>
              </label>
              <label className="mt-3 block text-[13px] font-semibold">
                故障/維修原因
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-2 h-10 w-full rounded-lg border border-[#dedede] bg-[#f5f5f5] px-3 text-sm"
                />
              </label>
              <label className="mt-3 block text-[13px] font-semibold">
                更換零件
                <input
                  value={parts}
                  onChange={(e) => setParts(e.target.value)}
                  className="mt-2 h-10 w-full rounded-lg border border-[#dedede] bg-[#f5f5f5] px-3 text-sm"
                />
              </label>
              <label className="mt-3 block text-[13px] font-semibold">
                維修內容
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-2 h-20 w-full rounded-lg border border-[#dedede] bg-[#f5f5f5] px-3 py-2 text-sm"
                />
              </label>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <label className="text-[13px] font-semibold">
                  開始時間
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="mt-2 h-10 w-full rounded-lg border border-[#dedede] bg-[#f5f5f5] px-3 text-sm"
                  />
                </label>
                <label className="text-[13px] font-semibold">
                  完成時間
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="mt-2 h-10 w-full rounded-lg border border-[#dedede] bg-[#f5f5f5] px-3 text-sm"
                  />
                </label>
              </div>
              <div className="mt-2 rounded-lg bg-[#f9fafb] px-3 py-2 text-[13px]">
                本次工時 <b>{hours}</b> 小時
                {overtime && (
                  <span className="ml-2 font-semibold text-[#d97706]">
                    （超過每日 {DAILY_HOUR_CAP} 小時，計為加班）
                  </span>
                )}
                {linkedJob && (
                  <span className="ml-2 text-[#6b7280]">
                    · 接續後累計 <b className="text-[#111827]">{accumulated}</b> 小時
                  </span>
                )}
              </div>

              <div className="mt-3 text-[13px] font-semibold">維修狀態</div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(["未完成", "已完成"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`rounded-lg border px-3 py-2.5 text-sm font-semibold ${
                      status === s
                        ? s === "已完成"
                          ? "border-[#16a34a] bg-[#f0fdf4] text-[#15803d]"
                          : "border-[#d97706] bg-[#fff7ed] text-[#d97706]"
                        : "border-[#e5e7eb] bg-white text-[#6b7280]"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {status === "未完成" && (
                <p className="mt-2 text-xs text-[#6b7280]">
                  標記為未完成後，隔日可從報表「接續」此任務，工時會跨日累加直至已完成。
                </p>
              )}

              <div className="mt-3 text-[13px] font-semibold">上傳圖片</div>
              <label className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[#d1d5db] bg-[#f9fafb] px-4 py-5 text-sm text-[#6b7280]">
                <ImagePlus size={20} className="mb-1 text-[#16a34a]" />
                點擊上傳維修現場照片
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => onPickFiles(e.target.files)}
                />
              </label>
              {photos.length > 0 && (
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {photos.map((src, i) => (
                    <div key={i} className="relative">
                      <img src={src} alt="" className="h-16 w-full rounded-md object-cover" />
                      <button
                        type="button"
                        onClick={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                        className="absolute -top-1 -right-1 rounded-full bg-white p-0.5 shadow"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {step > 1 && (
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="flex-1 rounded-lg border border-[#d1d5db] py-3 text-[15px] font-bold"
            >
              上一步
            </button>
            {step === 3 && (
              <button
                type="button"
                disabled={!canSubmit}
                onClick={() => {
                  if (!selected || !canSubmit) return;
                  onSubmit({
                    assetCode: selected.code,
                    date,
                    technicians,
                    type,
                    reason,
                    parts,
                    description,
                    startTime,
                    endTime,
                    hours,
                    overtime,
                    status,
                    photos,
                    continueFromId: linkedJob?.id,
                  });
                  reset();
                }}
                className="flex-1 rounded-lg bg-[#16a34a] py-3 text-[15px] font-bold text-white disabled:opacity-40"
              >
                {status === "已完成" ? "提交完成" : "儲存未完成"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
