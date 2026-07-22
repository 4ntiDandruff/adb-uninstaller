import type { DeviceInfo } from "../types";
import { Battery, Cpu, HardDrive, Smartphone } from "lucide-react";

interface Props {
  info: DeviceInfo | null;
}

export function DeviceInfoCard({ info }: Props) {
  if (!info) return null;
  const items = [
    { icon: Smartphone, label: "Model", value: `${info.manufacturer} ${info.model}` },
    { icon: Cpu, label: "Android", value: `${info.android_version} (SDK ${info.sdk_level})` },
    { icon: Battery, label: "Battery", value: info.battery_level >= 0 ? `${info.battery_level}%` : "?" },
    { icon: HardDrive, label: "Storage", value: `${info.storage_free} free / ${info.storage_total}` },
  ];
  return (
    <div className="card grid grid-cols-2 gap-2 p-3 text-sm md:grid-cols-4">
      {items.map((it) => (
        <div key={it.label} className="flex items-center gap-2">
          <it.icon size={16} className="text-blue-400" />
          <div className="min-w-0">
            <div className="text-xs text-slate-500">{it.label}</div>
            <div className="truncate font-medium text-slate-200">{it.value}</div>
          </div>
        </div>
      ))}
      <div className="col-span-2 text-xs text-slate-500 md:col-span-4">RAM: {info.ram_total}</div>
    </div>
  );
}
