import { useMemo, useState } from "react";
import { DEBLOAT_PRESETS } from "../lib/presets-data";
import type { AppInfo } from "../types";

interface Props {
  installedApps: AppInfo[];
  onExecute: (packages: string[]) => void;
  busy: boolean;
}

export function DebloatPresets({ installedApps, onExecute, busy }: Props) {
  const [brand, setBrand] = useState(0);
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const installed = useMemo(() => new Set(installedApps.map((a) => a.package_name)), [installedApps]);
  const preset = DEBLOAT_PRESETS[brand];
  const rows = preset.packages.map((p) => ({ ...p, installed: installed.has(p.name) }));

  function toggle(name: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function selectInstalled() {
    setChecked(new Set(rows.filter((r) => r.installed && r.safe_to_remove).map((r) => r.name)));
  }

  const chosen = [...checked].filter((c) => installed.has(c));

  return (
    <div className="flex flex-col gap-2 p-3" style={{ borderTop: "1px solid var(--border)" }}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold">Debloat Presets</span>
        <select className="select-dark" style={{ width: 220 }} value={brand} onChange={(e) => setBrand(parseInt(e.target.value))}>
          {DEBLOAT_PRESETS.map((p, i) => (
            <option key={p.brand} value={i}>
              {p.brand}
            </option>
          ))}
        </select>
        <button className="btn btn-ghost btn-sm" onClick={selectInstalled}>
          Pilih terinstall (aman)
        </button>
        <button
          className="btn btn-danger btn-sm ml-auto"
          disabled={busy || chosen.length === 0}
          onClick={() => onExecute(chosen)}
        >
          Eksekusi {chosen.length}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-x-3 overflow-auto" style={{ maxHeight: 120 }}>
        {rows.map((r) => (
          <label key={r.name} className={`preset-item ${r.installed ? "" : "disabled"}`}>
            <input type="checkbox" disabled={!r.installed} checked={checked.has(r.name)} onChange={() => toggle(r.name)} />
            <span className="mono truncate">{r.name}</span>
            {!r.safe_to_remove && <span className="badge badge-critical">!</span>}
          </label>
        ))}
      </div>
    </div>
  );
}
