import { X } from "lucide-react";
import type { AppInfo } from "../types";
import { cn } from "../lib/utils";

interface Props {
  app: AppInfo | null;
  onClose: () => void;
  onUninstall: (app: AppInfo) => void;
  onDisable: (app: AppInfo) => void;
  onEnable: (app: AppInfo) => void;
  onForceStop: (app: AppInfo) => void;
  onClearData: (app: AppInfo) => void;
  busy: boolean;
}

const LEVEL_STYLE: Record<string, string> = {
  safe: "bg-emerald-500/20 text-emerald-300",
  risky: "bg-amber-500/20 text-amber-300",
  critical: "bg-red-500/20 text-red-300",
  unknown: "bg-slate-500/20 text-slate-300",
};

export function PackageDetail({
  app,
  onClose,
  onUninstall,
  onDisable,
  onEnable,
  onForceStop,
  onClearData,
  busy,
}: Props) {
  if (!app) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="card w-full max-w-lg p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h3 className="font-mono text-sm font-semibold text-slate-100">{app.package_name}</h3>
            <span className={cn("badge mt-1", LEVEL_STYLE[app.safety_level] ?? LEVEL_STYLE.unknown)}>
              {app.safety_level}
            </span>
          </div>
          <button className="rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-white" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <dl className="mb-4 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <dt className="text-slate-500">Type</dt>
          <dd>{app.is_system ? "System" : "User"}</dd>
          <dt className="text-slate-500">Status</dt>
          <dd>{app.is_disabled ? "Disabled" : app.is_running ? "Running" : "Stopped"}</dd>
          <dt className="text-slate-500">Size</dt>
          <dd>{app.size || "?"}</dd>
          <dt className="text-slate-500">Version</dt>
          <dd>{app.version || "?"}</dd>
          <dt className="text-slate-500">Reason</dt>
          <dd className="col-span-1">{app.safety_reason || "—"}</dd>
        </dl>

        <div className="grid grid-cols-3 gap-2">
          <button className="btn btn-danger" disabled={busy || app.is_disabled} onClick={() => onUninstall(app)}>
            Uninstall
          </button>
          {app.is_disabled ? (
            <button className="btn btn-success" disabled={busy} onClick={() => onEnable(app)}>
              Enable
            </button>
          ) : (
            <button className="btn btn-ghost" disabled={busy} onClick={() => onDisable(app)}>
              Disable
            </button>
          )}
          <button className="btn btn-ghost" disabled={busy} onClick={() => onForceStop(app)}>
            Force Stop
          </button>
          <button className="btn btn-ghost col-span-3" disabled={busy} onClick={() => onClearData(app)}>
            Clear Data + Cache
          </button>
        </div>
      </div>
    </div>
  );
}
