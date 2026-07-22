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

  const installed = useMemo(
    () => new Set(installedApps.map((a) => a.package_name)),
    [installedApps],
  );

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
    <div className="card p-3">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold">Debloat Presets</span>
        <select className="input w-56" value={brand} onChange={(e) => setBrand(parseInt(e.target.value))}>
          {DEBLOAT_PRESETS.map((p, i) => (
            <option key={p.brand} value={i}>
              {p.brand}
            </option>
          ))}
        </select>
        <button className="btn btn-ghost text-xs" onClick={selectInstalled}>
          Pilih yang terinstall (aman)
        </button>
        <button
          className="btn btn-danger ml-auto text-xs"
          disabled={busy || chosen.length === 0}
          onClick={() => onExecute(chosen)}
        >
          Eksekusi {chosen.length} package
        </button>
      </div>
      <div className="max-h-44 overflow-auto">
        {rows.map((r) => (
          <label
            key={r.name}
            className={`flex items-center gap-2 rounded px-2 py-1 text-sm ${
              r.installed ? "text-slate-200" : "text-slate-600 line-through"
            }`}
          >
            <input
              type="checkbox"
              disabled={!r.installed}
              checked={checked.has(r.name)}
              onChange={() => toggle(r.name)}
            />
            <span className="font-mono text-xs">{r.name}</span>
            <span className="ml-auto text-xs text-slate-500">{r.description}</span>
            {!r.safe_to_remove && <span className="badge bg-red-500/20 text-red-300">hati-hati</span>}
          </label>
        ))}
      </div>
    </div>
  );
}
