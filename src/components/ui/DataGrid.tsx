"use client";

import { Fragment, useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Filter } from "lucide-react";

export function DataGrid<T extends object>({
  columns,
  rows,
  onRowClick,
  getRowKey,
  renderExpanded,
}: {
  columns: { key: keyof T | string; label: string; width?: string; render?: (row: T) => ReactNode }[];
  rows: T[];
  onRowClick?: (row: T) => void;
  getRowKey?: (row: T, index: number) => string;
  renderExpanded?: (row: T) => ReactNode;
}) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [dir, setDir] = useState<"asc" | "desc">("asc");

  const sorted = useMemo(() => {
    if (!sortKey) return rows;
    return [...rows].sort((a, b) => {
      const av = String((a as Record<string, unknown>)[sortKey] ?? "");
      const bv = String((b as Record<string, unknown>)[sortKey] ?? "");
      return dir === "asc" ? av.localeCompare(bv, "zh-Hant") : bv.localeCompare(av, "zh-Hant");
    });
  }, [rows, sortKey, dir]);

  function toggle(key: string) {
    if (sortKey === key) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setDir("asc");
    }
  }

  return (
    <div className="overflow-hidden rounded-[10px] border border-[#e5e7eb] bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-left">
          <thead>
            <tr className="border-b border-[#e5e7eb] bg-[#f3f4f6]">
              {columns.map((c) => (
                <th
                  key={String(c.key)}
                  style={{ width: c.width }}
                  className="px-6 py-3.5 text-[13px] font-bold text-[#6b7280]"
                >
                  <button
                    type="button"
                    onClick={() => toggle(String(c.key))}
                    className="inline-flex items-center gap-1"
                  >
                    {c.label}
                    <span className="inline-flex flex-col leading-none">
                      <ArrowUp
                        size={8}
                        className={sortKey === c.key && dir === "asc" ? "text-[#16a34a]" : "text-[#b2b8c2]"}
                      />
                      <ArrowDown
                        size={8}
                        className={sortKey === c.key && dir === "desc" ? "text-[#16a34a]" : "text-[#b2b8c2]"}
                      />
                    </span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => {
              const expanded = renderExpanded?.(row);
              return (
                <Fragment key={getRowKey?.(row, i) ?? i}>
                  <tr
                    onClick={() => onRowClick?.(row)}
                    className={`border-b border-[#e5e7eb] ${onRowClick ? "cursor-pointer hover:bg-[#f9fafb]" : ""} ${
                      expanded ? "border-b-0" : "last:border-0"
                    }`}
                  >
                    {columns.map((c) => (
                      <td key={String(c.key)} className="px-6 py-3.5 text-[13px] text-[#374151]">
                        {c.render ? c.render(row) : String((row as Record<string, unknown>)[String(c.key)] ?? "")}
                      </td>
                    ))}
                  </tr>
                  {expanded ? (
                    <tr className="border-b border-[#e5e7eb] last:border-0 bg-[#fffbeb]">
                      <td colSpan={columns.length} className="px-6 pb-3.5 pt-0">
                        {expanded}
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function FilterButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[#d1d6de] bg-white px-3.5 text-sm font-medium text-[#374151]"
    >
      <Filter size={14} />
      進階篩選
    </button>
  );
}
