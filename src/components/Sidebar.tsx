import { Smartphone, RefreshCw, Usb, Wifi, Settings as SettingsIcon, Cpu, Sparkles, Loader2 } from "lucide-react";
import type { AppInfo, Device, DeviceInfo } from "../types";

interface Props {
  devices: Device[];
  deviceId: string | null;
  onSelectDevice: (id: string) => void;
  onRefresh: () => void;
  loadingDevices: boolean;
  deviceInfo: DeviceInfo | null;
  onOpenSettings: () => void;
  apps: AppInfo[];
  onAnalyzeDevice: () => void;
  deviceAnalysis: string | null;
  analyzingDevice: boolean;
  t: (key: string) => string;
}

export function Sidebar({
  devices, deviceId, onSelectDevice, onRefresh, loadingDevices,
  deviceInfo, onOpenSettings, apps,
  onAnalyzeDevice, deviceAnalysis, analyzingDevice, t,
}: Props) {
  const stats = {
    total: apps.length,
    safe: apps.filter((a) => a.safety_level === "safe").length,
    risky: apps.filter((a) => a.safety_level === "risky").length,
    critical: apps.filter((a) => a.safety_level === "critical").length,
    unknown: apps.filter((a) => a.safety_level === "unknown").length,
  };

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-logo">A</div>
        <div className="min-w-0">
          <div className="brand-name">ADB Uninstaller</div>
          <div className="brand-sub">Megapass Sidoarjo · v2.2.0</div>
        </div>
      </div>

      <div className="side-section">
        <div className="side-label">{t("sidebar.devices")}</div>
        <div className="flex gap-2">
          <select
            className="select-dark"
            value={deviceId ?? ""}
            onChange={(e) => onSelectDevice(e.target.value)}
          >
            <option value="">{t("sidebar.select_device")}</option>
            {devices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.model !== "unknown" ? d.model : d.id}
              </option>
            ))}
          </select>
          <button
            className="btn btn-ghost btn-icon"
            onClick={onRefresh}
            disabled={loadingDevices}
            title={t("sidebar.refresh")}
          >
            <RefreshCw size={15} className={loadingDevices ? "animate-spin" : ""} />
          </button>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-dim">
          <Smartphone size={13} />
          <span>{devices.length} device</span>
          {devices.some((d) => d.transport === "usb") ? (
            <Usb size={13} className="text-primary" />
          ) : devices.length > 0 ? (
            <Wifi size={13} className="text-success" />
          ) : null}
          {deviceId && <span className="text-success">· online</span>}
        </div>
      </div>

      {deviceInfo && (
        <div className="side-section">
          <div className="side-label">{t("sidebar.device_info")}</div>
          <div className="space-y-1.5 text-xs">
            <InfoRow k={t("sidebar.model")} v={deviceInfo.model.toLowerCase().startsWith(deviceInfo.manufacturer.toLowerCase()) ? deviceInfo.model : `${deviceInfo.manufacturer} ${deviceInfo.model}`} />
            {deviceInfo.market_name && deviceInfo.model_code && deviceInfo.market_name !== deviceInfo.model_code && (
              <InfoRow k="Kode" v={deviceInfo.model_code} />
            )}
            {deviceInfo.chipset && <InfoRow k="Chipset" v={deviceInfo.chipset} />}
            <InfoRow k={t("sidebar.android")} v={`${deviceInfo.android_version} (SDK ${deviceInfo.sdk_level})`} />
            <InfoRow k={t("sidebar.battery")} v={deviceInfo.battery_level >= 0 ? `${deviceInfo.battery_level}%` : "?"} />
            <InfoRow k={t("sidebar.storage")} v={`${deviceInfo.storage_free} / ${deviceInfo.storage_total}`} />
            <InfoRow k={t("sidebar.ram")} v={deviceInfo.ram_total} />
          </div>
          <button
            className="btn btn-ghost btn-sm w-full mt-2"
            onClick={onAnalyzeDevice}
            disabled={analyzingDevice}
            title="AI: brief spek + tips servis untuk device ini"
          >
            {analyzingDevice ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
            {analyzingDevice ? "Menganalisa..." : "Analisa Device (AI)"}
          </button>
          {deviceAnalysis && (
            <div className="mt-2 text-xs" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
              <div className="flex items-center gap-1.5 mb-1 text-primary" style={{ fontWeight: 600 }}>
                <Cpu size={12} /> Brief Teknisi
              </div>
              {deviceAnalysis}
            </div>
          )}
        </div>
      )}

      {apps.length > 0 ? (
        <div className="side-section">
          <div className="side-label">{t("sidebar.stats")}</div>
          <div className="text-xs font-medium mb-2">{stats.total} {t("sidebar.total_apps").toLowerCase()}</div>
          <div className="stat-bars">
            <StatBar label={t("stats.safe")} count={stats.safe} total={stats.total} color="var(--success)" />
            <StatBar label={t("stats.risky")} count={stats.risky} total={stats.total} color="var(--warning)" />
            <StatBar label={t("stats.critical")} count={stats.critical} total={stats.total} color="var(--danger)" />
            <StatBar label={t("stats.unknown")} count={stats.unknown} total={stats.total} color="var(--text-faint)" />
          </div>
        </div>
      ) : (
        <div className="side-section">
          <div className="side-label">{t("sidebar.stats")}</div>
          <div className="text-xs text-faint" style={{ padding: "8px 0" }}>
            {t("sidebar.connect_hint")}
          </div>
        </div>
      )}

      <div className="mt-auto p-3">
        <button className="btn btn-ghost w-full" onClick={onOpenSettings}>
          <SettingsIcon size={15} />
          {t("sidebar.settings")}
        </button>
      </div>
    </aside>
  );
}

function StatBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 py-0.5">
      <span className="w-12 text-faint text-xs">{label}</span>
      <div className="flex-1 h-1.5 rounded-full" style={{ background: "var(--bg-card)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color, minWidth: count > 0 ? 4 : 0 }} />
      </div>
      <span className="w-8 text-right text-xs font-mono" style={{ color }}>{count}</span>
    </div>
  );
}

function InfoRow({ k, v, color }: { k: string; v: string; color?: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-faint">{k}</span>
      <span className={`truncate text-right font-medium ${color ?? ""}`}>{v}</span>
    </div>
  );
}
