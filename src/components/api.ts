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
  getScreenTimeout: (deviceId: string) =>
    invoke<number>("get_screen_timeout", { deviceId }),
  setScreenTimeout: (deviceId: string, ms: number) =>
    invoke<CommandResult>("set_screen_timeout", { deviceId, ms }),
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
  chat: (messages: { role: string; content: string }[], context: string) =>
    invoke<string>("chat_with_ai", { messages, context }),
  analyzeDevice: (model: string, chipset: string, android: string) =>
    invoke<string>("analyze_device", { model, chipset, android }),
  getCachedApps: (deviceId: string) =>
    invoke<import("../types").CachedApp[]>("get_cached_apps", { deviceId }),
  getLastScanTime: (deviceId: string) =>
    invoke<string | null>("get_last_scan_time", { deviceId }),
  clearDeviceCache: (deviceId: string) =>
    invoke<number>("clear_device_cache", { deviceId }),
  saveAiResults: (deviceId: string, results: { package_name: string; app_name: string; level: string; reason: string }[]) =>
    invoke<number>("save_ai_results", { deviceId, results }),
  saveAppSize: (deviceId: string, pkg: string, size: string) =>
    invoke<number>("save_app_size", { deviceId, package: pkg, size }),
  loadSettings: () => invoke<AppSettings>("load_settings"),
  saveSettings: (settings: AppSettings) =>
    invoke<void>("save_settings", { settings }),
};

export { toast };
