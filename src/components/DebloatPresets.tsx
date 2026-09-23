import { useEffect, useMemo, useState } from "react";
import { Trash2, X, Ban, CheckCircle2 } from "lucide-react";
import { DEBLOAT_PRESETS } from "../lib/presets-data";
import type { AppInfo } from "../types";

interface Props {
  installedApps: AppInfo[];
  onExecute: (packages: string[], op: "uninstall" | "disable" | "enable", isOta?: boolean) => void;
  onClose?: () => void;
  busy: boolean;
  t: (key: string) => string;
}

export function DebloatPresets({ installedApps, onExecute, onClose, busy, t }: Props) {
  const [brand, setBrand] = useState(0);
  const [checked, setChecked] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!onClose) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const installed = useMemo(() => new Set(installedApps.map((a) => a.package_name)), [installedApps]);
  const preset = DEBLOAT_PRESETS[brand];
  const rows = preset.packages.map((p) => ({ ...p, installed: installed.has(p.name) }));
  const isOtaPreset = preset.brand.toLowerCase().includes("ota");

  function toggle(name: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function selectInstalled() {
    setChecked(new Set(rows.filter((r) => (isOtaPreset || r.installed) && r.safe_to_remove).map((r) => r.name)));
  }

  // Untuk pemulihan/enable: seluruh item terpilih bisa dipulihkan via dual-stage recovery
  const chosenForEnable = [...checked];
  // Untuk copot/bekukan: hanya paket yang sedang aktif terpasang
  const chosenForDisableOrUninstall = isOtaPreset ? [...checked] : [...checked].filter((c) => installed.has(c));

  return (
    <div className="flex flex-col">
      <div className="modal-head">
        <div className="modal-title flex items-center gap-2">
          <Trash2 size={16} className="text-primary" />
          <span>{t("presets.title")}</span>
        </div>
        {onClose && (
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose} title="Tutup">
            <X size={16} />
          </button>
        )}
      </div>

      <div className="modal-body flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="select-dark"
            style={{ minWidth: 260 }}
            value={brand}
            onChange={(e) => {
              setBrand(parseInt(e.target.value));
              setChecked(new Set());
            }}
          >
            {DEBLOAT_PRESETS.map((p, i) => (
              <option key={p.brand} value={i}>
                {p.brand}
              </option>
            ))}
          </select>

          <button className="btn btn-ghost btn-sm" onClick={selectInstalled}>
            {isOtaPreset ? t("presets.select_ota") : t("presets.select_safe")}
          </button>

          <div className="flex items-center gap-2 ml-auto">
            <button
              className="btn btn-ghost btn-sm flex items-center gap-1 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 hover:border-emerald-500/50"
              disabled={busy || chosenForEnable.length === 0}
              onClick={() => onExecute(chosenForEnable, "enable", isOtaPreset)}
              title="Aktifkan kembali aplikasi (dual-stage restore via pm enable / cmd package install-existing)"
            >
              <CheckCircle2 size={13} /> Aktifkan ({chosenForEnable.length})
            </button>
            <button
              className="btn btn-warning btn-sm flex items-center gap-1"
              disabled={busy || chosenForDisableOrUninstall.length === 0}
              onClick={() => onExecute(chosenForDisableOrUninstall, "disable", isOtaPreset)}
              title="Bekukan aplikasi tanpa menghapus APK mentah (Sangat aman & mudah dipulihkan)"
            >
              <Ban size={13} /> Nonaktifkan ({chosenForDisableOrUninstall.length})
            </button>
            <button
              className="btn btn-danger btn-sm flex items-center gap-1"
              disabled={busy || chosenForDisableOrUninstall.length === 0}
              onClick={() => onExecute(chosenForDisableOrUninstall, "uninstall", isOtaPreset)}
              title="Copot pemasangan aplikasi dari user 0"
            >
              <Trash2 size={13} /> {t("presets.execute")} ({chosenForDisableOrUninstall.length})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 overflow-auto" style={{ maxHeight: 320 }}>
          {rows.map((r) => (
            <label
              key={r.name}
              className={`preset-item flex items-start gap-2.5 p-2 rounded cursor-pointer transition-colors ${
                checked.has(r.name) ? "bg-primary/10 border-primary/40" : "hover:bg-card-hover"
              }`}
            >
              <input
                type="checkbox"
                className="mt-0.5"
                checked={checked.has(r.name)}
                onChange={() => toggle(r.name)}
              />
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="mono text-xs truncate font-medium">{r.name}</span>
                  {!r.safe_to_remove && <span className="badge badge-critical text-[10px]">!</span>}
                  {r.installed ? (
                    <span className="badge badge-safe text-[10px]">Terpasang</span>
                  ) : (
                    <span className="badge badge-unknown text-[10px]">Nonaktif / Dicopot</span>
                  )}
                </div>
                {r.description && (
                  <span className="text-[11px] text-muted truncate mt-0.5">{r.description}</span>
                )}
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
