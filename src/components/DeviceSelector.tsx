import { RefreshCw, Smartphone, Wifi, Usb } from "lucide-react";
import type { Device } from "../types";

interface Props {
  devices: Device[];
  selected: string | null;
  onSelect: (id: string) => void;
  onRefresh: () => void;
  loading: boolean;
}

export function DeviceSelector({ devices, selected, onSelect, onRefresh, loading }: Props) {
  return (
    <div className="flex items-center gap-2">
      <select
        className="select-dark w-64"
        value={selected ?? ""}
        onChange={(e) => onSelect(e.target.value)}
      >
        <option value="">— Pilih device —</option>
        {devices.map((d) => (
          <option key={d.id} value={d.id}>
            {d.model !== "unknown" ? `${d.model} ` : ""}({d.id.slice(-8)}) · {d.status}
          </option>
        ))}
      </select>
      <button className="btn btn-ghost" onClick={onRefresh} disabled={loading} title="Refresh devices">
        <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        Refresh
      </button>
      <span className="flex items-center gap-1 text-xs text-slate-400">
        <Smartphone size={14} />
        {devices.length} device
        {devices.some((d) => d.transport === "usb") ? (
          <Usb size={14} className="text-blue-400" />
        ) : devices.length > 0 ? (
          <Wifi size={14} className="text-emerald-400" />
        ) : null}
      </span>
    </div>
  );
}
