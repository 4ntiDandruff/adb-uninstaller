import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import type { AppInfo } from "../types";

export interface PresetExport {
  name: string;
  description: string;
  created_at: string;
  device_model?: string;
  packages: {
    package_name: string;
    action: "uninstall" | "disable" | "skip";
    safety_level: string;
    reason?: string;
  }[];
}

export async function exportPreset(apps: AppInfo[], selected: Set<string>, deviceModel?: string): Promise<void> {
  const packages = [...selected].map((pkg) => {
    const app = apps.find((a) => a.package_name === pkg);
    return {
      package_name: pkg,
      action: "uninstall" as const,
      safety_level: app?.safety_level ?? "unknown",
      reason: app?.safety_reason ?? undefined,
    };
  });

  const preset: PresetExport = {
    name: `Preset ${new Date().toLocaleDateString("id-ID")}`,
    description: `Debloat preset dari ADB Uninstaller`,
    created_at: new Date().toISOString(),
    device_model: deviceModel,
    packages,
  };

  const json = JSON.stringify(preset, null, 2);
  const fileName = `debloat-preset-${Date.now()}.json`;

  try {
    const filePath = await save({
      filters: [{ name: "JSON", extensions: ["json"] }],
      defaultPath: fileName,
    });
    if (filePath) {
      await writeTextFile(filePath, json);
      return;
    }
  } catch {
    // Fallback: browser download
  }

  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importPreset(filePath: string): Promise<PresetExport> {
  const { readTextFile } = await import("@tauri-apps/plugin-fs");
  const raw = await readTextFile(filePath);
  return JSON.parse(raw) as PresetExport;
}
