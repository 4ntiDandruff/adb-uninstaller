import { useCallback, useEffect, useMemo, useState } from "react";
import { Settings, Sparkles, RotateCcw, Loader2, AlertTriangle } from "lucide-react";
import type {
  AppInfo,
  AppSettings,
  Device,
  DeviceInfo,
  LogEntry,
  SafetyLevel,
} from "./types";
import { api, makeLog, toast } from "./components/api";
import { SearchBar } from "./components/SearchBar";
import { DeviceSelector } from "./components/DeviceSelector";
import { AppTable } from "./components/AppTable";
import { LogPanel } from "./components/LogPanel";
import { PackageDetail } from "./components/PackageDetail";
import { DeviceInfoCard } from "./components/DeviceInfoCard";
import { SettingsDialog } from "./components/SettingsDialog";
import { AIPanel } from "./components/AIPanel";
import { DebloatPresets } from "./components/DebloatPresets";
import { enrichApps } from "./lib/safety-tags";

type OpKind = "uninstall" | "disable" | "enable" | "force_stop" | "clear_data";

export default function App() {
  const [adbOk, setAdbOk] = useState<boolean | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [loadingApps, setLoadingApps] = useState(false);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<SafetyLevel | "all">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detail, setDetail] = useState<AppInfo | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [analyzing, setAnalyzing] = useState(false);

  const log = useCallback((entry: Omit<LogEntry, "id" | "ts">) => {
    setLogs((l) => [...l.slice(-499), makeLog(entry)]);
  }, []);

  // --- initial: adb check + settings
  useEffect(() => {
    api.checkAdb().then((ok) => {
      setAdbOk(ok);
      log({
        level: ok ? "success" : "error",
        source: "system",
        message: ok ? "ADB terdeteksi" : "[ADB-1001] ADB tidak terinstall",
      });
    });
    api
      .loadSettings()
      .then((s) => {
        setSettings(s);
        log({ level: "info", source: "system", message: "Settings dimuat" });
      })
      .catch((e) => log({ level: "warn", source: "system", message: `Settings: ${e}` }));
  }, [log]);

  // --- scan devices
  const scanDevices = useCallback(async () => {
    setLoadingDevices(true);
    const t0 = performance.now();
    try {
      const devs = await api.scanDevices();
      setDevices(devs);
      log({
        level: "success",
        source: "adb",
        message: `Scan devices: ${devs.length} ditemukan`,
        detail: devs.map((d) => `${d.id} [${d.status}] ${d.model}`).join("\n"),
        duration_ms: Math.round(performance.now() - t0),
      });
      if (devs.length > 0 && !deviceId) {
        const online = devs.find((d) => d.status === "online") ?? devs[0];
        setDeviceId(online.id);
      }
    } catch (e) {
      log({ level: "error", source: "adb", message: `Scan gagal: ${e}` });
      toast.error(`Scan device gagal: ${e}`);
    } finally {
      setLoadingDevices(false);
    }
  }, [deviceId, log]);

  useEffect(() => {
    if (adbOk) scanDevices();
  }, [adbOk, scanDevices]);

  // --- load apps for device
  const loadApps = useCallback(
    async (id: string) => {
      setLoadingApps(true);
      setApps([]);
      const t0 = performance.now();
      try {
        const raw = await api.listApps(id);
        const enriched = enrichApps(raw);
        setApps(enriched);
        log({
          level: "success",
          source: "adb",
          message: `List apps: ${raw.length} package`,
          duration_ms: Math.round(performance.now() - t0),
        });
        // device info in parallel (non-blocking)
        api
          .getDeviceInfo(id)
          .then(setDeviceInfo)
          .catch(() => setDeviceInfo(null));
      } catch (e) {
        log({ level: "error", source: "adb", message: `List apps gagal: ${e}` });
        toast.error(`List apps gagal: ${e}`);
      } finally {
        setLoadingApps(false);
      }
    },
    [log],
  );

  useEffect(() => {
    if (deviceId) loadApps(deviceId);
  }, [deviceId, loadApps]);

  // --- selection
  const toggleSelect = useCallback((pkg: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(pkg)) next.delete(pkg);
      else next.add(pkg);
      return next;
    });
  }, []);

  const toggleAll = useCallback((visible: AppInfo[]) => {
    setSelected((prev) => {
      const allSelected = visible.every((a) => prev.has(a.package_name));
      const next = new Set(prev);
      if (allSelected) visible.forEach((a) => next.delete(a.package_name));
      else visible.forEach((a) => next.add(a.package_name));
      return next;
    });
  }, []);

  // --- generic op runner with confirm + log + toast
  const runOp = useCallback(
    async (kind: OpKind, pkg: string) => {
      if (!deviceId) return;
      const app = apps.find((a) => a.package_name === pkg);
      const label = kind.replace("_", " ");
      if (app?.safety_level === "critical") {
        toast.error(`Dibatalkan: ${pkg} adalah package CRITICAL`);
        log({ level: "warn", source: "ui", message: `Blokir op critical: ${label} ${pkg}` });
        return;
      }
      const ok = window.confirm(
        `Yakin mau ${label} ini?\n\n${pkg}\n\nSafety: ${app?.safety_level ?? "unknown"} (${app?.safety_reason || "-"})`,
      );
      if (!ok) return;

      setBusy(true);
      const t0 = performance.now();
      log({ level: "info", source: "adb", message: `Exec: ${label} ${pkg}` });
      try {
        const res = await api[kind === "force_stop" ? "forceStop" : kind === "clear_data" ? "clearData" : kind](
          deviceId,
          pkg,
        );
        if (res.success) {
          toast.success(`${label} OK: ${pkg}`);
          log({
            level: "success",
            source: "adb",
            message: `${label} sukses: ${pkg}`,
            detail: res.output,
            duration_ms: res.duration_ms,
          });
          if (kind === "uninstall") setUndoStack((u) => [...u, pkg]);
          if (deviceId) loadApps(deviceId);
        } else {
          toast.error(`${label} gagal: ${pkg}`);
          log({
            level: "error",
            source: "adb",
            message: `${label} gagal: ${pkg}`,
            detail: res.error ?? res.output,
            duration_ms: res.duration_ms,
          });
        }
      } catch (e) {
        toast.error(`${label} error: ${e}`);
        log({
          level: "error",
          source: "adb",
          message: `${label} exception: ${pkg}`,
          detail: String(e),
          duration_ms: Math.round(performance.now() - t0),
        });
      } finally {
        setBusy(false);
      }
    },
    [deviceId, apps, loadApps, log],
  );

  // --- batch uninstall (debloat presets + selection)
  const runBatch = useCallback(
    async (packages: string[]) => {
      if (!deviceId || packages.length === 0) return;
      const ok = window.confirm(
        `Eksekusi UNINSTALL batch ${packages.length} package?\n\n${packages.slice(0, 8).join("\n")}${
          packages.length > 8 ? `\n… +${packages.length - 8} lagi` : ""
        }`,
      );
      if (!ok) return;
      setBusy(true);
      let success = 0;
      let fail = 0;
      for (const pkg of packages) {
        const app = apps.find((a) => a.package_name === pkg);
        if (app?.safety_level === "critical") {
          log({ level: "warn", source: "adb", message: `Skip critical: ${pkg}` });
          fail++;
          continue;
        }
        try {
          const res = await api.uninstall(deviceId, pkg);
          if (res.success) {
            success++;
            setUndoStack((u) => [...u, pkg]);
            log({ level: "success", source: "adb", message: `uninstall OK: ${pkg}`, duration_ms: res.duration_ms });
          } else {
            fail++;
            log({ level: "error", source: "adb", message: `uninstall gagal: ${pkg}`, detail: res.error ?? res.output });
          }
        } catch (e) {
          fail++;
          log({ level: "error", source: "adb", message: `uninstall exception: ${pkg}`, detail: String(e) });
        }
      }
      toast.success(`Batch selesai: ${success} sukses, ${fail} gagal`);
      setSelected(new Set());
      if (deviceId) loadApps(deviceId);
      setBusy(false);
    },
    [deviceId, apps, loadApps, log],
  );

  // --- undo (reinstall via cmd package install-existing)
  const undoLast = useCallback(async () => {
    if (!deviceId || undoStack.length === 0) return;
    const pkg = undoStack[undoStack.length - 1];
    setBusy(true);
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("restore_package", { deviceId, package: pkg });
      setUndoStack((u) => u.slice(0, -1));
      toast.success(`Undo: ${pkg} dikembalikan`);
      log({ level: "success", source: "adb", message: `undo: restore ${pkg}` });
      loadApps(deviceId);
    } catch (e) {
      toast.error(`Undo gagal: ${e}`);
    } finally {
      setBusy(false);
    }
  }, [deviceId, undoStack, loadApps, log]);

  // --- AI batch analysis for unknown apps
  const analyzeUnknown = useCallback(async () => {
    const unknown = apps.filter((a) => a.safety_level === "unknown").slice(0, 50);
    if (unknown.length === 0) {
      toast.info("Tidak ada package unknown untuk dianalisis");
      return;
    }
    setAnalyzing(true);
    const t0 = performance.now();
    try {
      const results = await api.analyzeBatch(unknown.map((a) => a.package_name));
      const map = new Map(results.map((r) => [r.package_name, r]));
      setApps((prev) =>
        prev.map((a) => {
          const r = map.get(a.package_name);
          return r
            ? { ...a, safety_level: r.level as AppInfo["safety_level"], safety_reason: r.reason }
            : a;
        }),
      );
      toast.success(`AI analysis: ${results.length} package`);
      log({
        level: "success",
        source: "ai",
        message: `AI batch analysis ${results.length} package`,
        duration_ms: Math.round(performance.now() - t0),
      });
    } catch (e) {
      toast.error(`AI analysis gagal: ${e}`);
      log({ level: "error", source: "ai", message: `AI batch gagal`, detail: String(e) });
    } finally {
      setAnalyzing(false);
    }
  }, [apps, log]);

  const unknownCount = useMemo(
    () => apps.filter((a) => a.safety_level === "unknown").length,
    [apps],
  );

  const chatContext = useMemo(
    () =>
      `Device: ${deviceId ?? "-"}\nTotal apps: ${apps.length}\nUnknown: ${unknownCount}\nSample: ${apps
        .slice(0, 20)
        .map((a) => a.package_name)
        .join(", ")}`,
    [deviceId, apps, unknownCount],
  );

  if (adbOk === false) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <AlertTriangle size={48} className="text-amber-400" />
        <h1 className="text-xl font-bold">ADB tidak terdeteksi</h1>
        <p className="max-w-md text-sm text-slate-400">
          Install dulu: <code className="rounded bg-slate-800 px-2 py-0.5">sudo apt install adb</code> lalu restart
          aplikasi.
        </p>
        <button className="btn btn-primary" onClick={() => api.checkAdb().then(setAdbOk)}>
          Cek Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 p-3">
      {/* Header */}
      <header className="flex flex-wrap items-center gap-2">
        <h1 className="mr-2 text-lg font-bold">
          ADB Uninstaller <span className="text-xs font-normal text-slate-500">v2.0.0 · Megapass Sidoarjo</span>
        </h1>
        <DeviceSelector
          devices={devices}
          selected={deviceId}
          onSelect={setDeviceId}
          onRefresh={scanDevices}
          loading={loadingDevices}
        />
        <div className="ml-auto flex items-center gap-2">
          <button
            className="btn btn-ghost"
            onClick={analyzeUnknown}
            disabled={analyzing || unknownCount === 0}
            title="AI analisis package unknown"
          >
            {analyzing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            AI ({unknownCount})
          </button>
          <button className="btn btn-ghost" onClick={undoLast} disabled={busy || undoStack.length === 0} title="Undo uninstall terakhir">
            <RotateCcw size={16} />
            Undo ({undoStack.length})
          </button>
          <button className="btn btn-ghost" onClick={() => setSettingsOpen(true)}>
            <Settings size={16} />
            Settings
          </button>
        </div>
      </header>

      {/* Device info */}
      <DeviceInfoCard info={deviceInfo} />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <SearchBar value={query} onChange={setQuery} onClear={() => setQuery("")} />
        <select
          className="input w-40"
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value as SafetyLevel | "all")}
        >
          <option value="all">Semua level</option>
          <option value="safe">🟢 Safe</option>
          <option value="risky">🟡 Risky</option>
          <option value="critical">🔴 Critical</option>
          <option value="unknown">⚪ Unknown</option>
        </select>
        {(query || levelFilter !== "all") && (
          <button
            className="btn btn-ghost text-xs"
            onClick={() => {
              setQuery("");
              setLevelFilter("all");
            }}
          >
            <RotateCcw size={14} /> Reset filter
          </button>
        )}
        {selected.size > 0 && (
          <button className="btn btn-danger ml-auto text-xs" disabled={busy} onClick={() => runBatch([...selected])}>
            Uninstall {selected.size} dipilih
          </button>
        )}
      </div>

      {/* Table */}
      <AppTable
        apps={apps}
        loading={loadingApps}
        query={query}
        levelFilter={levelFilter}
        selected={selected}
        onToggleSelect={toggleSelect}
        onToggleAll={toggleAll}
        onOpenDetail={setDetail}
      />

      {/* Debloat presets */}
      <DebloatPresets installedApps={apps} onExecute={runBatch} busy={busy} />

      {/* Log */}
      <LogPanel logs={logs} onClear={() => setLogs([])} />

      {/* Modals / panels */}
      <PackageDetail
        app={detail}
        onClose={() => setDetail(null)}
        onUninstall={(a) => runOp("uninstall", a.package_name)}
        onDisable={(a) => runOp("disable", a.package_name)}
        onEnable={(a) => runOp("enable", a.package_name)}
        onForceStop={(a) => runOp("force_stop", a.package_name)}
        onClearData={(a) => runOp("clear_data", a.package_name)}
        busy={busy}
      />
      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSaved={setSettings}
      />
      <AIPanel open={chatOpen} onToggle={() => setChatOpen((o) => !o)} context={chatContext} />
      {busy && (
        <div className="fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden bg-slate-800">
          <div className="h-full w-1/3 animate-pulse bg-blue-500" />
        </div>
      )}
      {settings?.language === "en" ? null : null}
    </div>
  );
}
