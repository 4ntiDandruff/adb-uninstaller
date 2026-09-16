import { Copy, Sparkles, X, Trash2, Ban, CheckCircle2, PowerOff, Eraser, Download } from "lucide-react";
import type { AppInfo } from "../types";
import { toast } from "./api";

interface Props {
  app: AppInfo | null;
  onClose: () => void;
  onUninstall: (app: AppInfo) => void;
  onDisable: (app: AppInfo) => void;
  onEnable: (app: AppInfo) => void;
  onForceStop: (app: AppInfo) => void;
  onClearData: (app: AppInfo) => void;
  onExtractApk: (app: AppInfo) => void;
  onAskAi?: (app: AppInfo) => void;
  busy: boolean;
  t: (key: string) => string;
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
  onExtractApk,
  onAskAi,
  busy,
  t,
}: Props) {
  function copyPkg() {
    if (!app) return;
    navigator.clipboard.writeText(app.package_name);
    toast.success("Package name disalin");
  }

  return (
    <div className={`detail-panel ${app ? "" : "closed"}`}>
      {app && (
        <>
          <div className="detail-head">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <div className="detail-title truncate">{app.package_name}</div>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={copyPkg} title="Copy package name">
                    <Copy size={13} />
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className={LEVEL_BADGE[app.safety_level] ?? LEVEL_BADGE.unknown}>
                    {t(`safety.${app.safety_level}`)}
                  </span>
                  <span className={app.is_system ? "badge badge-system" : "badge badge-user"}>
                    {app.is_system ? t("table.system") : t("table.user")}
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
              <Row k="Status" v={app.is_disabled ? t("table.disabled") : app.is_running ? t("table.running") : "Stopped"} />
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
              <Trash2 size={13} />
              {t("detail.uninstall")}
            </button>
            {app.is_disabled ? (
              <button className="btn btn-success" disabled={busy} onClick={() => onEnable(app)}>
                <CheckCircle2 size={13} />
                {t("detail.enable")}
              </button>
            ) : (
              <button
                className="btn btn-ghost"
                disabled={busy || app.safety_level === "critical"}
                onClick={() => onDisable(app)}
              >
                <Ban size={13} />
                {t("detail.disable")}
              </button>
            )}
            <button className="btn btn-ghost" disabled={busy} onClick={() => onForceStop(app)}>
              <PowerOff size={13} />
              {t("detail.force_stop")}
            </button>
            <button className="btn btn-ghost" disabled={busy} onClick={() => onClearData(app)}>
              <Eraser size={13} />
              {t("detail.clear_data")}
            </button>
            <button
              className="btn btn-ghost text-cyan-400 hover:text-cyan-300"
              disabled={busy}
              onClick={() => onExtractApk(app)}
              title="Ekstraksi file APK mentah ke ~/Downloads/APK_Backup"
            >
              <Download size={13} />
              {t("detail.extract_apk")}
            </button>
            <button
              className="btn btn-ghost text-amber-400 hover:text-amber-300"
              disabled={busy}
              onClick={() => onAskAi?.(app)}
              title="Tanya rekomendasi teknisi AI untuk package ini"
            >
              <Sparkles size={13} />
              {t("detail.ask_ai")}
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
