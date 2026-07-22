import { Smartphone, RefreshCw, Usb, Wifi, Settings as SettingsIcon } from "lucide-react";
import type { Device, DeviceInfo } from "../types";

interface Props {
  devices: Device[];
  deviceId: string | null;
  onSelectDevice: (id: string) => void;
  onRefresh: () => void;
  loadingDevices: boolean;
  deviceInfo: DeviceInfo | null;
  onOpenSettings: () => void;
  appCount: number;
}

export function Sidebar({
  devices,
  deviceId,
  onSelectDevice,
  onRefresh,
  loadingDevices,
  deviceInfo,
  onOpenSettings,
  appCount,
}: Props) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-logo">A</div>
        <div className="min-w-0">
          <div className="brand-name">ADB Uninstaller</div>
          <div className="brand-sub">Megapass Sidoarjo · v2.0.0</div>
        </div>
      </div>

      <div className="side-section">
        <div className="side-label">Perangkat</div>
        <div className="flex gap-2">
          <select
            className="select-dark"
            value={deviceId ?? ""}
            onChange={(e) => onSelectDevice(e.target.value)}
          >
            <option value="">— Pilih device —</option>
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
            title="Refresh"
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
          <div className="side-label">Info Perangkat</div>
          <div className="space-y-1.5 text-xs">
            <InfoRow k="Model" v={`${deviceInfo.manufacturer} ${deviceInfo.model}`} />
            <InfoRow k="Android" v={`${deviceInfo.android_version} (SDK ${deviceInfo.sdk_level})`} />
            <InfoRow k="Baterai" v={deviceInfo.battery_level >= 0 ? `${deviceInfo.battery_level}%` : "?"} />
            <InfoRow k="Storage" v={`${deviceInfo.storage_free} / ${deviceInfo.storage_total}`} />
            <InfoRow k="RAM" v={deviceInfo.ram_total} />
          </div>
        </div>
      )}

      <div className="side-section">
        <div className="side-label">Statistik</div>
        <div className="space-y-1.5 text-xs">
          <InfoRow k="Total aplikasi" v={String(appCount)} />
        </div>
      </div>

      <div className="mt-auto p-3">
        <button className="btn btn-ghost w-full" onClick={onOpenSettings}>
          <SettingsIcon size={15} />
          Pengaturan
        </button>
      </div>
    </aside>
  );
}

function InfoRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-faint">{k}</span>
      <span className="truncate text-right font-medium">{v}</span>
    </div>
  );
}
