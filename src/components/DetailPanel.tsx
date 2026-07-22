import { X } from "lucide-react";
import type { AppInfo } from "../types";

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

const LEVEL_BADGE: Record<string, string> = {
  safe: "badge badge-safe",
  risky: "badge badge-risky",
  critical: "badge badge-critical",
  unknown: "badge badge-unknown",
};

export function DetailPanel({
  app,
  onClose,
  onUninstall,
  onDisable,
  onEnable,
  onForceStop,
  onClearData,
  busy,
}: Props) {
  return (
    <div className={`detail-panel ${app ? "" : "closed"}`}>
      {app && (
        <>
          <div className="detail-head">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="detail-title">{app.package_name}</div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className={LEVEL_BADGE[app.safety_level] ?? LEVEL_BADGE.unknown}>
                    {app.safety_level}
                  </span>
                  <span className={app.is_system ? "badge badge-system" : "badge badge-user"}>
                    {app.is_system ? "system" : "user"}
                  </span>
                </div>
              </div>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose} title="Tutup">
                <X size={15} />
              </button>
            </div>
          </div>

          <div className="detail-body">
            <dl>
              <Row k="Status" v={app.is_disabled ? "Disabled" : app.is_running ? "Running" : "Stopped"} />
              <Row k="Ukuran" v={app.size || "?"} />
              <Row k="Versi" v={app.version || "?"} />
              <Row k="Alasan safety" v={app.safety_reason || "—"} />
            </dl>
            {app.safety_level === "critical" && (
              <div className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">
                Package CRITICAL — operasi uninstall/disable diblokir demi keamanan sistem.
              </div>
            )}
          </div>

          <div className="detail-actions">
            <button
              className="btn btn-danger"
              disabled={busy || app.safety_level === "critical"}
              onClick={() => onUninstall(app)}
            >
              Uninstall
            </button>
            {app.is_disabled ? (
              <button className="btn btn-success" disabled={busy} onClick={() => onEnable(app)}>
                Enable
              </button>
            ) : (
              <button
                className="btn btn-ghost"
                disabled={busy || app.safety_level === "critical"}
                onClick={() => onDisable(app)}
              >
                Disable
              </button>
            )}
            <button className="btn btn-ghost" disabled={busy} onClick={() => onForceStop(app)}>
              Force Stop
            </button>
            <button className="btn btn-ghost" disabled={busy} onClick={() => onClearData(app)}>
              Clear Data
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="detail-row">
      <dt>{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}
