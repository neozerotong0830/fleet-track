"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, AlertTriangle, FileWarning, Wrench } from "lucide-react";
import { notifications as seed } from "@/lib/mock-data";
import type { NotificationItem } from "@/lib/types";
import { getSupabase } from "@/lib/supabase/client";

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>(seed);
  const ref = useRef<HTMLDivElement>(null);
  const unread = items.filter((n) => !n.isRead).length;

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const row = payload.new as {
            id: string;
            title: string;
            body: string;
            type: NotificationItem["type"];
            is_read: boolean;
          };
          setItems((prev) => [
            {
              id: row.id,
              title: row.title,
              body: row.body,
              type: row.type,
              isRead: row.is_read,
              time: "剛剛",
            },
            ...prev,
          ]);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-full bg-[#f3f4f6] p-2"
        aria-label="通知中心"
      >
        <Bell size={16} className="text-[#111827]" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-[#de1f1f] px-1 text-[10px] font-bold leading-none text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[360px] overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-[0_10px_25px_rgba(0,0,0,0.1)]">
          <div className="flex items-center justify-between border-b border-[#e5e7eb] px-4 py-3">
            <div className="text-sm font-bold">通知中心</div>
            <button
              type="button"
              onClick={markAllRead}
              className="text-xs font-semibold text-[#16a34a]"
            >
              全部已讀
            </button>
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            {items.map((n) => (
              <div
                key={n.id}
                className={`flex gap-3 border-b border-[#f3f4f6] px-4 py-3 ${
                  n.isRead ? "bg-white" : "bg-[#f0fdf4]"
                }`}
              >
                <div
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    n.type === "fault"
                      ? "bg-[#fee2e2] text-[#dc2626]"
                      : n.type === "expiry"
                        ? "bg-[#fef3c7] text-[#d97706]"
                        : "bg-[#dcfce7] text-[#15803d]"
                  }`}
                >
                  {n.type === "fault" ? (
                    <AlertTriangle size={14} />
                  ) : n.type === "expiry" ? (
                    <FileWarning size={14} />
                  ) : (
                    <Wrench size={14} />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold">{n.title}</div>
                  <div className="mt-0.5 text-xs text-[#6b7280]">{n.body}</div>
                  <div className="mt-1 text-[11px] text-[#9ca3af]">{n.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
