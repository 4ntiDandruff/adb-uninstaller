export type DeviceStatus = "online" | "offline" | "unauthorized";
export type Transport = "usb" | "wireless";
export type SafetyLevel = "safe" | "risky" | "critical" | "unknown";

export interface Device {
  id: string;
  model: string;
  status: DeviceStatus | string;
  transport: Transport | string;
}

export interface AppInfo {
  package_name: string;
  label: string;
  is_system: boolean;
  is_disabled: boolean;
  is_running: boolean;
  safety_level: SafetyLevel | string;
  safety_reason: string;
  size: string;
  version: string;
}

export interface CommandResult {
  success: boolean;
  output: string;
  error: string | null;
  duration_ms: number;
}

export interface DeviceInfo {
  model: string;
  manufacturer: string;
  android_version: string;
  sdk_level: number;
  battery_level: number;
  storage_total: string;
  storage_free: string;
  ram_total: string;
}

export interface SafetyAnalysis {
  package_name: string;
  level: SafetyLevel | string;
  reason: string;
  can_remove: boolean;
}

export interface ConnectionTest {
  success: boolean;
  message: string;
  models: string[];
}

export interface AppSettings {
  ai_base_url: string;
  ai_api_key: string;
  ai_model: string;
  ai_system_prompt: string;
  language: "id" | "en" | string;
  theme: "dark" | "light" | string;
  temperature: number;
  max_tokens: number;
}

export interface CachedApp {
  package_name: string;
  label: string;
  is_system: boolean;
  is_disabled: boolean;
  safety_level: string;
  safety_reason: string;
  size: string;
  version: string;
  device_id: string;
  scanned_at: string;
}

export interface LogEntry {
  id: string;
  ts: string;
  level: "info" | "success" | "warn" | "error";
  source: "adb" | "ai" | "ui" | "system" | "cache";
  message: string;
  detail?: string;
  duration_ms?: number;
}
