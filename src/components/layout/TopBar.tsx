"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, LogOut } from "lucide-react";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { clearAuthSession, readAuthSession } from "@/lib/auth-session";

export function TopBar({
  crumb,
  title,
  showBack = false,
}: {
  crumb: string;
  title: string;
  showBack?: boolean;
}) {
  const router = useRouter();
  const [label, setLabel] = useState("管理員");

  useEffect(() => {
    const session = readAuthSession();
    setLabel(session?.email || "管理員");
  }, []);

  function logout() {
    clearAuthSession();
    router.replace("/login");
  }

  const initial = label.slice(0, 1).toUpperCase();

  return (
    <header className="flex items-center justify-between border-b border-[#e5e7eb] bg-white px-8 py-4">
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            type="button"
            onClick={() => router.back()}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-[#e5e7eb] bg-[#f9fafb]"
            aria-label="返回"
          >
            <ArrowLeft size={16} />
          </button>
        )}
        <div>
          <div className="text-[11px] text-[#6b7280]">{crumb}</div>
          <div className="text-xl font-extrabold text-[#111827]">{title}</div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <NotificationCenter />
        <div className="h-6 w-px bg-[#e5e7eb]" />
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-[#1b3a2a] text-center text-xs font-bold leading-8 text-white">
            {initial}
          </div>
          <span className="max-w-[160px] truncate text-sm font-semibold">{label}</span>
          <button
            type="button"
            onClick={logout}
            className="ml-1 rounded-md p-1.5 text-[#6b7280] hover:bg-[#f3f4f6]"
            aria-label="登出"
            title="登出"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
