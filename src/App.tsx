import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Sparkles,
  RotateCcw,
  Loader2,
  AlertTriangle,
  Package,
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
  MessageSquare,
} from "lucide-react";
import type { AppInfo, AppSettings, Device, DeviceInfo, LogEntry, SafetyLevel } from "./types";
import { api, makeLog, toast } from "./components/api";
import { Sidebar } from "./components/Sidebar";
import { SearchBar } from "./components/SearchBar";
import { AppTable } from "./components/AppTable";
import { DetailPanel } from "./components/DetailPanel";
import { LogDrawer } from "./components/LogDrawer";
import { SettingsDialog } from "./components/SettingsDialog";
import { AIChat } from "./components/AIChat";
import { DebloatPresets } from "./components/DebloatPresets";
import { enrichApps } from "./lib/safety-tags";

type OpKind = "uninstall" | "disable" | "enable" | "force_stop" | "clear_data";
type RightTab = "detail" | "ai";

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
  const [rightTab, setRightTab] = useState<RightTab>("detail");
  const [rightOpen, setRightOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [, setSettings] = useState<AppSettings | null>(null);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [analyzing, setAnalyzing] = useState(false);

  const log = useCallback((entry: Omit<LogEntry, "id" | "ts">) => {
    setLogs((l) => [...l.slice(-499), makeLog(entry)]);
  }, []);

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
      toast.error(`Scan device gagal`);
    } finally {
      setLoadingDevices(false);
    }
  }, [deviceId, log]);

  useEffect(() => {
    if (adbOk) scanDevices();
  }, [adbOk, scanDevices]);

  const loadApps = useCallback(
    async (id: string) => {
      setLoadingApps(true);
      const t0 = performance.now();
      try {
        const raw = await api.listApps(id);
        setApps(enrichApps(raw));
        log({
          level: "success",
          source: "adb",
          message: `List apps: ${raw.length} package`,
          duration_ms: Math.round(performance.now() - t0),
        });
        api.getDeviceInfo(id).then(setDeviceInfo).catch(() => setDeviceInfo(null));
      } catch (e) {
        log({ level: "error", source: "adb", message: `List apps gagal: ${e}` });
        toast.error(`List apps gagal`);
      } finally {
        setLoadingApps(false);
      }
    },
    [log],
  );

  useEffect(() => {
    if (deviceId) loadApps(deviceId);
  }, [deviceId, loadApps]);

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

  const openDetail = useCallback(
    (app: AppInfo) => {
      setDetail(app);
      setRightTab("detail");
      setRightOpen(true);
      // Lazy-fetch ukuran APK saat detail dibuka
      if (deviceId && (!app.size || app.size === "?")) {
        api
          .getAppSize(deviceId, app.package_name)
          .then((size) => {
            setApps((prev) =>
              prev.map((x) => (x.package_name === app.package_name ? { ...x, size } : x)),
            );
            setDetail((d) => (d && d.package_name === app.package_name ? { ...d, size } : d));
          })
          .catch(() => {});
      }
    },
    [deviceId],
  );

  const runOp = useCallback(
    async (kind: OpKind, pkg: string) => {
      if (!deviceId) return;
      const app = apps.find((a) => a.package_name === pkg);
      const label = kind.replace("_", " ");
      if (app?.safety_level === "critical") {
        toast.error(`Diblokir: ${pkg} CRITICAL`);
        log({ level: "warn", source: "ui", message: `Blokir op critical: ${label} ${pkg}` });
        return;
      }
      const ok = window.confirm(`Yakin mau ${label}?\n\n${pkg}\n\nSafety: ${app?.safety_level ?? "unknown"}`);
      if (!ok) return;
      setBusy(true);
      log({ level: "info", source: "adb", message: `Exec: ${label} ${pkg}` });
      try {
        const res = await api[
          kind === "force_stop" ? "forceStop" : kind === "clear_data" ? "clearData" : kind
        ](deviceId, pkg);
        if (res.success) {
          toast.success(`${label} OK`);
          log({ level: "success", source: "adb", message: `${label} sukses: ${pkg}`, detail: res.output, duration_ms: res.duration_ms });
          if (kind === "uninstall") setUndoStack((u) => [...u, pkg]);
          if (deviceId) loadApps(deviceId);
        } else {
          toast.error(`${label} gagal`);
          log({ level: "error", source: "adb", message: `${label} gagal: ${pkg}`, detail: res.error ?? res.output, duration_ms: res.duration_ms });
        }
      } catch (e) {
        toast.error(`${label} error`);
        log({ level: "error", source: "adb", message: `${label} exception: ${pkg}`, detail: String(e) });
      } finally {
        setBusy(false);
      }
    },
    [deviceId, apps, loadApps, log],
  );

  const runBatch = useCallback(
    async (packages: string[]) => {
      if (!deviceId || packages.length === 0) return;
      const ok = window.confirm(
        `UNINSTALL batch ${packages.length} package?\n\n${packages.slice(0, 8).join("\n")}${
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
      toast.success(`Batch: ${success} OK, ${fail} gagal`);
      setSelected(new Set());
      if (deviceId) loadApps(deviceId);
      setBusy(false);
    },
    [deviceId, apps, loadApps, log],
  );

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
      toast.error(`Undo gagal`);
      log({ level: "error", source: "adb", message: `undo gagal: ${pkg}`, detail: String(e) });
    } finally {
      setBusy(false);
    }
  }, [deviceId, undoStack, loadApps, log]);

  const analyzeUnknown = useCallback(async () => {
    const unknown = apps.filter((a) => a.safety_level === "unknown").slice(0, 50);
    if (unknown.length === 0) {
      toast.info("Tidak ada package unknown");
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
          return r ? { ...a, safety_level: r.level as AppInfo["safety_level"], safety_reason: r.reason } : a;
        }),
      );
      toast.success(`AI analysis: ${results.length} package`);
      log({ level: "success", source: "ai", message: `AI batch ${results.length} package`, duration_ms: Math.round(performance.now() - t0) });
    } catch (e) {
      toast.error(`AI analysis gagal`);
      log({ level: "error", source: "ai", message: `AI batch gagal`, detail: String(e) });
    } finally {
      setAnalyzing(false);
    }
  }, [apps, log]);

  const stats = useMemo(() => {
    const safe = apps.filter((a) => a.safety_level === "safe").length;
    const risky = apps.filter((a) => a.safety_level === "risky").length;
    const critical = apps.filter((a) => a.safety_level === "critical").length;
    const unknown = apps.filter((a) => a.safety_level === "unknown").length;
    return { safe, risky, critical, unknown };
  }, [apps]);

  const chatContext = useMemo(
    () =>
      `Device: ${deviceId ?? "-"}\nTotal apps: ${apps.length}\nSafe:${stats.safe} Risky:${stats.risky} Critical:${stats.critical} Unknown:${stats.unknown}\nSample: ${apps
        .slice(0, 15)
        .map((a) => a.package_name)
        .join(", ")}`,
    [deviceId, apps, stats],
  );

  if (adbOk === false) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
        <AlertTriangle size={52} className="text-warning" />
        <h1 className="text-xl font-bold">ADB tidak terdeteksi</h1>
        <p className="max-w-md text-sm text-dim">
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
    <div className="app-shell">
      <Sidebar
        devices={devices}
        deviceId={deviceId}
        onSelectDevice={setDeviceId}
        onRefresh={scanDevices}
        loadingDevices={loadingDevices}
        deviceInfo={deviceInfo}
        onOpenSettings={() => setSettingsOpen(true)}
        appCount={apps.length}
      />

      <div className="main">
        {/* Topbar */}
        <div className="topbar">
          <div className="topbar-title">Aplikasi</div>
          <div className="topbar-spacer" />
          <button
            className="btn btn-ghost btn-sm"
            onClick={analyzeUnknown}
            disabled={analyzing || stats.unknown === 0}
            title="AI analisis package unknown"
          >
            {analyzing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            AI ({stats.unknown})
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={undoLast}
            disabled={busy || undoStack.length === 0}
            title="Undo uninstall terakhir"
          >
            <RotateCcw size={14} />
            Undo ({undoStack.length})
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setRightTab("ai");
              setRightOpen((o) => rightTab === "ai" ? !o : true);
            }}
            title="AI Assistant"
          >
            <MessageSquare size={14} />
            AI Chat
          </button>
        </div>

        {/* Stat cards */}
        <div className="stat-grid">
          <StatCard icon={<Package size={17} />} color="var(--primary)" label="Total" value={String(apps.length)} />
          <StatCard icon={<ShieldCheck size={17} />} color="var(--success)" label="Safe" value={String(stats.safe)} />
          <StatCard icon={<ShieldAlert size={17} />} color="var(--warning)" label="Risky+Critical" value={String(stats.risky + stats.critical)} />
          <StatCard icon={<HelpCircle size={17} />} color="var(--text-dim)" label="Unknown" value={String(stats.unknown)} />
        </div>

        {/* Workbench */}
        <div className="workbench">
          <div className="content">
            <div className="toolbar">
              <SearchBar value={query} onChange={setQuery} onClear={() => setQuery("")} />
              <select
                className="select-dark"
                style={{ width: 150 }}
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value as SafetyLevel | "all")}
              >
                <option value="all">Semua level</option>
                <option value="safe">Safe</option>
                <option value="risky">Risky</option>
                <option value="critical">Critical</option>
                <option value="unknown">Unknown</option>
              </select>
              {(query || levelFilter !== "all") && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setQuery("");
                    setLevelFilter("all");
                  }}
                >
                  <RotateCcw size={13} /> Reset
                </button>
              )}
              {selected.size > 0 && (
                <button className="btn btn-danger btn-sm ml-auto" disabled={busy} onClick={() => runBatch([...selected])}>
                  Uninstall {selected.size}
                </button>
              )}
            </div>

            <AppTable
              apps={apps}
              loading={loadingApps}
              query={query}
              levelFilter={levelFilter}
              selected={selected}
              onToggleSelect={toggleSelect}
              onToggleAll={toggleAll}
              onOpenDetail={openDetail}
              activeApp={detail?.package_name ?? null}
            />

            <DebloatPresets installedApps={apps} onExecute={runBatch} busy={busy} />
            <LogDrawer logs={logs} onClear={() => setLogs([])} />
          </div>

          {/* Right panel: detail atau AI */}
          {rightOpen && (
            <div className="detail-panel">
              {rightTab === "detail" ? (
                <DetailPanel
                  app={detail}
                  onClose={() => setRightOpen(false)}
                  onUninstall={(a) => runOp("uninstall", a.package_name)}
                  onDisable={(a) => runOp("disable", a.package_name)}
                  onEnable={(a) => runOp("enable", a.package_name)}
                  onForceStop={(a) => runOp("force_stop", a.package_name)}
                  onClearData={(a) => runOp("clear_data", a.package_name)}
                  busy={busy}
                />
              ) : (
                <div className="flex h-full flex-col">
                  <div className="detail-head flex items-center justify-between">
                    <span className="font-semibold">AI Assistant</span>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setRightOpen(false)}>
                      ×
                    </button>
                  </div>
                  <AIChat context={chatContext} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} onSaved={setSettings} />
    </div>
  );
}

function StatCard({ icon, color, label, value }: { icon: React.ReactNode; color: string; label: string; value: string }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: `color-mix(in srgb, ${color} 18%, transparent)`, color }}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
      </div>
    </div>
  );
}
