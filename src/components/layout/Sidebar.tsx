"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Truck,
  Drill,
  Wrench,
  Zap,
  MapPin,
  BarChart2,
  FileText,
  Package,
  Users,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { NAV_ITEMS } from "@/lib/constants";

const icons = {
  LayoutDashboard,
  Truck,
  Drill,
  Wrench,
  Zap,
  MapPin,
  BarChart2,
  FileText,
  Package,
  Users,
};

const STORAGE_KEY = "fleet-track-sidebar-collapsed";

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  return (
    <aside
      className={`flex h-screen shrink-0 flex-col border-r border-[#2d5a3e] bg-[#1b3a2a] py-6 transition-[width] duration-200 ${
        collapsed ? "w-[72px] px-2" : "w-[240px] px-4"
      }`}
    >
      <div className={`mb-6 ${collapsed ? "px-0 text-center" : "px-2"}`}>
        {collapsed ? (
          <div className="text-sm font-extrabold text-white" title="機械部 設備管理系統">
            機
          </div>
        ) : (
          <>
            <div className="text-lg font-extrabold text-white">機械部</div>
            <div className="text-xs font-medium text-white/85">設備管理系統</div>
          </>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto overflow-x-hidden">
        {NAV_ITEMS.map((item) => {
          const Icon = icons[item.icon];
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center rounded-lg text-sm ${
                collapsed ? "justify-center px-0 py-3" : "gap-3 px-4 py-3"
              } ${
                active
                  ? "bg-[#1e4a33] font-bold text-white"
                  : "font-medium text-white/80 hover:bg-white/5"
              }`}
            >
              <Icon size={18} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={toggle}
        title={collapsed ? "展開選單" : "收合選單"}
        className={`mt-3 flex items-center rounded-lg py-2.5 text-white/70 hover:bg-white/5 hover:text-white ${
          collapsed ? "justify-center" : "gap-2 px-4 text-[13px] font-medium"
        }`}
      >
        {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
        {!collapsed && <span>收合選單</span>}
      </button>

      <div
        className={`mt-3 flex items-center rounded-lg border border-white/10 bg-white/5 ${
          collapsed ? "justify-center px-0 py-2" : "gap-3 px-3 py-3"
        }`}
        title={collapsed ? "管理員 · 機械部後勤" : undefined}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#16a34a] text-xs font-bold text-white">
          管
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-white">管理員</div>
            <div className="text-[11px] text-white/60">機械部 · 後勤</div>
          </div>
        )}
      </div>
    </aside>
  );
}
