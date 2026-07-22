import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown } from "lucide-react";
import type { AppInfo, SafetyLevel } from "../types";
import { cn } from "../lib/utils";

export type TabKey = "all" | "system" | "user" | "disabled" | "running";
type SortKey = "package_name" | "safety_level" | "size";

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "system", label: "System" },
  { key: "user", label: "User" },
  { key: "disabled", label: "Disabled" },
  { key: "running", label: "Running" },
];

const LEVEL_STYLE: Record<string, string> = {
  safe: "bg-emerald-500/20 text-emerald-300",
  risky: "bg-amber-500/20 text-amber-300",
  critical: "bg-red-500/20 text-red-300",
  unknown: "bg-slate-500/20 text-slate-300",
};
const LEVEL_DOT: Record<string, string> = {
  safe: "🟢",
  risky: "🟡",
  critical: "🔴",
  unknown: "⚪",
};

interface Props {
  apps: AppInfo[];
  loading: boolean;
  query: string;
  levelFilter: SafetyLevel | "all";
  selected: Set<string>;
  onToggleSelect: (pkg: string) => void;
  onToggleAll: (visible: AppInfo[]) => void;
  onOpenDetail: (app: AppInfo) => void;
}

export function AppTable({
  apps,
  loading,
  query,
  levelFilter,
  selected,
  onToggleSelect,
  onToggleAll,
  onOpenDetail,
}: Props) {
  const [tab, setTab] = useState<TabKey>("all");
  const [sortKey, setSortKey] = useState<SortKey>("package_name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const filtered = useMemo(() => {
    let out = apps;
    if (tab === "system") out = out.filter((a) => a.is_system);
    if (tab === "user") out = out.filter((a) => !a.is_system);
    if (tab === "disabled") out = out.filter((a) => a.is_disabled);
    if (tab === "running") out = out.filter((a) => a.is_running);
    if (levelFilter !== "all") out = out.filter((a) => a.safety_level === levelFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      out = out.filter(
        (a) =>
          a.package_name.toLowerCase().includes(q) ||
          a.label.toLowerCase().includes(q),
      );
    }
    const dir = sortDir === "asc" ? 1 : -1;
    out = [...out].sort((a, b) => {
      const av = (a[sortKey] ?? "").toString();
      const bv = (b[sortKey] ?? "").toString();
      return av.localeCompare(bv) * dir;
    });
    return out;
  }, [apps, tab, levelFilter, query, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey !== k ? (
      <ChevronDown size={14} className="opacity-40" />
    ) : sortDir === "asc" ? (
      <ArrowUp size={14} />
    ) : (
      <ArrowDown size={14} />
    );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm",
              tab === t.key
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700",
            )}
          >
            {t.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-400">
          {filtered.length} / {apps.length} app · {selected.size} dipilih
        </span>
      </div>

      <div className="table-wrap min-h-0 flex-1">
        <table className="app-table">
          <thead>
            <tr>
              <th className="w-10">
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && filtered.every((a) => selected.has(a.package_name))}
                  onChange={() => onToggleAll(filtered)}
                />
              </th>
              <th className="cursor-pointer select-none" onClick={() => toggleSort("package_name")}>
                <span className="inline-flex items-center gap-1">
                  Package <SortIcon k="package_name" />
                </span>
              </th>
              <th className="cursor-pointer select-none w-32" onClick={() => toggleSort("safety_level")}>
                <span className="inline-flex items-center gap-1">
                  Safety <SortIcon k="safety_level" />
                </span>
              </th>
              <th className="w-24">Type</th>
              <th className="w-24">Status</th>
              <th className="cursor-pointer select-none w-24" onClick={() => toggleSort("size")}>
                <span className="inline-flex items-center gap-1">
                  Size <SortIcon k="size" />
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={`sk-${i}`}>
                  <td colSpan={6}>
                    <div className="skeleton h-5 w-full" />
                  </td>
                </tr>
              ))}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-500">
                  Tidak ada aplikasi. Scan device dulu.
                </td>
              </tr>
            )}
            {!loading &&
              filtered.map((a) => (
                <tr
                  key={a.package_name}
                  className="cursor-pointer"
                  onClick={() => onOpenDetail(a)}
                >
                  <td onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(a.package_name)}
                      onChange={() => onToggleSelect(a.package_name)}
                    />
                  </td>
                  <td className="font-mono text-xs">{a.package_name}</td>
                  <td>
                    <span className={cn("badge", LEVEL_STYLE[a.safety_level] ?? LEVEL_STYLE.unknown)}>
                      {LEVEL_DOT[a.safety_level] ?? "⚪"} {a.safety_level}
                    </span>
                  </td>
                  <td className="text-xs text-slate-400">
                    {a.is_system ? "system" : "user"}
                  </td>
                  <td className="text-xs text-slate-400">
                    {a.is_disabled ? "disabled" : a.is_running ? "running" : "—"}
                  </td>
                  <td className="text-xs text-slate-400">{a.size || "?"}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
