import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown, PackageSearch } from "lucide-react";
import type { AppInfo, SafetyLevel } from "../types";

export type TabKey = "all" | "system" | "user" | "disabled" | "running";
type SortKey = "package_name" | "safety_level" | "size";

const TABS: { key: TabKey; labelKey: string }[] = [
  { key: "all", labelKey: "table.all" },
  { key: "system", labelKey: "table.system" },
  { key: "user", labelKey: "table.user" },
  { key: "disabled", labelKey: "table.disabled" },
  { key: "running", labelKey: "table.running" },
];

const LEVEL_BADGE: Record<string, string> = {
  safe: "badge badge-safe",
  risky: "badge badge-risky",
  critical: "badge badge-critical",
  unknown: "badge badge-unknown",
};
const LEVEL_DOT: Record<string, string> = {
  safe: "●",
  risky: "●",
  critical: "●",
  unknown: "●",
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
  activeApp: string | null;
  onTabChange?: (tab: TabKey) => void;
  t: (key: string) => string;
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
  activeApp,
  onTabChange,
  t,
}: Props) {
  const [tab, setTab] = useState<TabKey>("all");
  const [sortKey, setSortKey] = useState<SortKey>("package_name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const counts = useMemo(() => {
    return {
      all: apps.length,
      system: apps.filter((a) => a.is_system).length,
      user: apps.filter((a) => !a.is_system).length,
      disabled: apps.filter((a) => a.is_disabled).length,
      running: apps.filter((a) => a.is_running).length,
    };
  }, [apps]);

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
        (a) => a.package_name.toLowerCase().includes(q) || a.label.toLowerCase().includes(q),
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

  function changeTab(t: TabKey) {
    setTab(t);
    onTabChange?.(t);
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ChevronsUpDown size={13} className="text-faint" />;
    return sortDir === "asc" ? <ArrowUp size={13} /> : <ArrowDown size={13} />;
  }

  const allChecked = filtered.length > 0 && filtered.every((a) => selected.has(a.package_name));

  return (
    <>
      <div className="tabs">
        {TABS.map((tabItem) => (
          <button
            key={tabItem.key}
            className={`tab ${tab === tabItem.key ? "active" : ""}`}
            onClick={() => changeTab(tabItem.key)}
          >
            {t(tabItem.labelKey)}
            <span className="tab-count">{counts[tabItem.key]}</span>
          </button>
        ))}
        <div className="ml-auto flex items-center pb-1 text-xs text-dim">
          {filtered.length} tampil · {selected.size} dipilih
        </div>
      </div>

      <div className="table-scroll">
        <table className="app-table">
          <thead>
            <tr>
              <th className="w-10">
                <input type="checkbox" checked={allChecked} onChange={() => onToggleAll(filtered)} />
              </th>
              <th onClick={() => toggleSort("package_name")} className="cursor-pointer select-none">
                <span className="inline-flex items-center gap-1.5">
                  {t("table.package")} <SortIcon k="package_name" />
                </span>
              </th>
              <th onClick={() => toggleSort("safety_level")} className="cursor-pointer select-none w-28">
                <span className="inline-flex items-center gap-1.5">
                  {t("table.safety")} <SortIcon k="safety_level" />
                </span>
              </th>
              <th className="w-24">{t("table.type")}</th>
              <th className="w-24">{t("table.status")}</th>
              <th onClick={() => toggleSort("size")} className="cursor-pointer select-none w-20">
                <span className="inline-flex items-center gap-1.5">
                  {t("table.size")} <SortIcon k="size" />
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 10 }).map((_, i) => (
                <tr key={`sk-${i}`}>
                  <td colSpan={6}>
                    <div className="skeleton h-5 w-full" />
                  </td>
                </tr>
              ))}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={6}>
                  <div className="empty">
                    <PackageSearch size={36} className="text-faint" />
                    <div className="text-sm">
                      {apps.length === 0 ? t("table.empty") : t("table.no_result")}
                    </div>
                  </div>
                </td>
              </tr>
            )}
            {!loading &&
              filtered.map((a) => (
                <tr
                  key={a.package_name}
                  className={activeApp === a.package_name ? "selected" : ""}
                  onClick={() => onOpenDetail(a)}
                >
                  <td onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(a.package_name)}
                      onChange={() => onToggleSelect(a.package_name)}
                    />
                  </td>
                  <td>
                    <div className="mono">{a.package_name}</div>
                    {a.safety_reason && (
                      <div className="text-xs text-faint">{a.safety_reason}</div>
                    )}
                  </td>
                  <td>
                    <span className={LEVEL_BADGE[a.safety_level] ?? LEVEL_BADGE.unknown}>
                      <span>{LEVEL_DOT[a.safety_level] ?? "●"}</span>
                      {t(`safety.${a.safety_level}`)}
                    </span>
                  </td>
                  <td>
                    <span className={a.is_system ? "badge badge-system" : "badge badge-user"}>
                      {a.is_system ? t("table.system") : t("table.user")}
                    </span>
                  </td>
                  <td className="text-dim text-xs">
                    {a.is_disabled ? t("table.disabled") : a.is_running ? t("table.running") : "—"}
                  </td>
                  <td className="text-dim text-xs">{a.size || "?"}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
