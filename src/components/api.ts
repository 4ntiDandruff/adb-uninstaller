import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import type {
  AppInfo,
  AppSettings,
  CommandResult,
  Device,
  DeviceInfo,
  LogEntry,
  SafetyAnalysis,
} from "../types";

let logId = 0;
export function makeLog(partial: Omit<LogEntry, "id" | "ts">): LogEntry {
  logId += 1;
  return { id: `log-${logId}`, ts: new Date().toISOString(), ...partial };
}

export const api = {
  checkAdb: () => invoke<boolean>("check_adb_available"),
  scanDevices: () => invoke<Device[]>("scan_devices"),
  getDeviceInfo: (deviceId: string) =>
    invoke<DeviceInfo>("get_device_info", { deviceId }),
  listApps: (deviceId: string) => invoke<AppInfo[]>("list_apps", { deviceId }),
  getAppSize: (deviceId: string, pkg: string) =>
    invoke<string>("get_app_size", { deviceId, package: pkg }),
  uninstall: (deviceId: string, pkg: string) =>
    invoke<CommandResult>("uninstall_package", { deviceId, package: pkg }),
  disable: (deviceId: string, pkg: string) =>
    invoke<CommandResult>("disable_package", { deviceId, package: pkg }),
  enable: (deviceId: string, pkg: string) =>
    invoke<CommandResult>("enable_package", { deviceId, package: pkg }),
  restore: (deviceId: string, pkg: string) =>
    invoke<CommandResult>("restore_package", { deviceId, package: pkg }),
  forceStop: (deviceId: string, pkg: string) =>
    invoke<CommandResult>("force_stop_package", { deviceId, package: pkg }),
  clearData: (deviceId: string, pkg: string) =>
    invoke<CommandResult>("clear_app_data", { deviceId, package: pkg }),
  analyzeBatch: (packages: string[]) =>
    invoke<SafetyAnalysis[]>("analyze_apps_batch", { packages }),
  chat: (message: string, context: string) =>
    invoke<string>("chat_with_ai", { message, context }),
  getCachedApps: (deviceId: string) =>
    invoke<import("../types").CachedApp[]>("get_cached_apps", { deviceId }),
  getLastScanTime: (deviceId: string) =>
    invoke<string | null>("get_last_scan_time", { deviceId }),
  clearDeviceCache: (deviceId: string) =>
    invoke<number>("clear_device_cache", { deviceId }),
  loadSettings: () => invoke<AppSettings>("load_settings"),
  saveSettings: (settings: AppSettings) =>
    invoke<void>("save_settings", { settings }),
};

export { toast };
