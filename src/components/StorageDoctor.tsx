import { useCallback, useEffect, useMemo, useState } from "react";
import {
  HardDrive,
  Activity,
  Trash2,
  Zap,
  RotateCcw,
  Copy,
  
  AlertTriangle,
  FileCode,
  FolderMinus,
  MessageSquare,
  ShieldCheck,
  Loader2,
  Smartphone,
} from "lucide-react";
import { api, toast } from "./api";
import type { AppInfo, DeviceInfo, StorageStats, TrashItem } from "../types";

interface Props {
  deviceId: string | null;
  deviceInfo: DeviceInfo | null;
  installedApps: AppInfo[];
  t: (key: string) => string;
  lang: string;
}

type CategoryFilter = "all" | "whatsapp" | "orphan" | "apk" | "cache";

export function StorageDoctor({ deviceId, deviceInfo, installedApps, t, lang }: Props) {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [items, setItems] = useState<TrashItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<CategoryFilter>("all");
  const [scanning, setScanning] = useState(false);
  const [trimming, setTrimming] = useState(false);
  const [benchmarking, setBenchmarking] = useState(false);
  const [dryRunOpen, setDryRunOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Load storage capacity saat device aktif
  const loadStats = useCallback(async () => {
    if (!deviceId) return;
    try {
      const s = await api.getStorageStats(deviceId);
      setStats(s);
    } catch {
      // Fallback
    }
  }, [deviceId]);

  useEffect(() => {
    setItems([]);
    setSelectedIds(new Set());
    loadStats();
  }, [deviceId, loadStats]);

  // Scan junk items
  const runScan = useCallback(async () => {
    if (!deviceId) return;
    setScanning(true);
    try {
      const pkgs = installedApps.map((a) => a.package_name);
      const res = await api.scanStorageJunk(deviceId, pkgs);
      setItems(res);
      // Auto-check item safe, biarkan item review unchecked
      const safeIds = new Set(res.filter((i) => i.safety_level === "safe").map((i) => i.id));
      setSelectedIds(safeIds);
      toast.success(`${res.length} item sampah terdeteksi`);
    } catch (e) {
      toast.error(`Scan storage gagal: ${e}`);
    } finally {
      setScanning(false);
    }
  }, [deviceId, installedApps]);

  // Fast Global Trim
  const runTrim = useCallback(async () => {
    if (!deviceId) return;
    setTrimming(true);
    try {
      const res = await api.trimCaches(deviceId);
      if (res.success) {
        toast.success(t("storage.trim_success"));
        await loadStats();
      } else {
        toast.error(res.error || "Trim cache gagal");
      }
    } catch (e) {
      toast.error(`Trim gagal: ${e}`);
    } finally {
      setTrimming(false);
    }
  }, [deviceId, loadStats, t]);

  // Uji Speed eMMC
  const runBenchmark = useCallback(async () => {
    if (!deviceId) return;
    setBenchmarking(true);
    try {
      const s = await api.benchmarkStorage(deviceId);
      setStats(s);
      toast.success(`Speed: ${s.emmc_write_speed_mbps} MB/s (${s.emmc_health})`);
    } catch (e) {
      toast.error(`Benchmark gagal: ${e}`);
    } finally {
      setBenchmarking(false);
    }
  }, [deviceId]);

  // Toggle selection
  const toggleItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredItems = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((i) => i.category === filter);
  }, [items, filter]);

  const toggleAllVisible = () => {
    const allChecked = filteredItems.every((i) => selectedIds.has(i.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allChecked) {
        filteredItems.forEach((i) => next.delete(i.id));
      } else {
        filteredItems.forEach((i) => next.add(i.id));
      }
      return next;
    });
  };

  // Hitung total size yang terpilih
  const selectedSize = useMemo(() => {
    return items
      .filter((i) => selectedIds.has(i.id))
      .reduce((acc, curr) => acc + curr.size_bytes, 0);
  }, [items, selectedIds]);

  const formatBytesLocal = (bytes: number) => {
    if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
    if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${bytes} B`;
  };

  // Salin Laporan WhatsApp
  const copyWaReport = useCallback(() => {
    const model = deviceInfo?.model || "Android Device";
    const freeBefore = stats?.free_formatted || "—";
    const speed = stats?.emmc_write_speed_mbps ? `${stats.emmc_write_speed_mbps} MB/s` : "Normal";
    const healthLabel =
      stats?.emmc_health === "good"
        ? "Sehat"
        : stats?.emmc_health === "warning"
        ? "Mulai Lambat"
        : stats?.emmc_health === "critical"
        ? "Kritis"
        : "Normal";

    const report = [
      `*LAPORAN SERVIS MEMORI — MEGAPASS*`,
      `Perangkat: ${model}`,
      `• Memori Tersedia: ${freeBefore}`,
      `• Total Sampah Terdeteksi: ${formatBytesLocal(selectedSize)}`,
      `• Kondisi Flash Memory: ${healthLabel} (${speed})`,
      `• Status: Siap dibersihkan`,
      ``,
      `_Megapass Intra Solusindo — Servis Cepat & Transparan_`,
    ].join("\n");

    navigator.clipboard.writeText(report).then(() => {
      toast.success(t("storage.report_copied"));
    });
  }, [deviceInfo, stats, selectedSize, t]);

  // Eksekusi Hapus dari Dry-Run Modal
  const executeDelete = async () => {
    if (!deviceId) return;
    const targets = items.filter((i) => selectedIds.has(i.id)).map((i) => i.path);
    if (targets.length === 0) return;

    setDeleting(true);
    try {
      await api.deleteJunkItems(deviceId, targets);
      toast.success(`${targets.length} item berhasil dibersihkan`);
      setDryRunOpen(false);
      // Hapus item dari list lokal
      setItems((prev) => prev.filter((i) => !selectedIds.has(i.id)));
      setSelectedIds(new Set());
      await loadStats();
    } catch (e) {
      toast.error(`Hapus gagal: ${e}`);
    } finally {
      setDeleting(false);
    }
  };

  if (!deviceId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[460px] p-8 text-center text-dim gap-3 w-full max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center text-primary shadow-sm">
          <Smartphone size={32} />
        </div>
        <div className="font-semibold text-base text-[var(--text)]">{t("storage.title")}</div>
        <p className="text-xs text-dim text-pretty">
          {t("sidebar.connect_hint")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 max-w-7xl mx-auto w-full">
      {/* Header Title */}
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <HardDrive className="text-primary" size={22} />
          {t("storage.title")}
        </h2>
        <p className="text-xs text-dim">{t("storage.subtitle")}</p>
      </div>

      {/* Bento Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Card 1: Kapasitas Internal */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-dim">{t("storage.card_capacity")}</span>
            <HardDrive size={16} className="text-dim" />
          </div>
          <div className="my-3">
            <div className="text-2xl font-bold tabular-nums tracking-tight">
              {stats?.free_formatted ?? "—"}{" "}
              <span className="text-xs font-normal text-dim">tersedia</span>
            </div>
            <div className="text-xs text-dim mt-1">
              Total {stats?.total_formatted ?? "—"} · Terpakai {stats?.used_formatted ?? "—"} (
              {stats?.percent_used ?? 0}%)
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-[var(--bg-active)] h-2 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  (stats?.percent_used ?? 0) > 90
                    ? "bg-red-500"
                    : (stats?.percent_used ?? 0) > 75
                    ? "bg-amber-500"
                    : "bg-emerald-500"
                }`}
                style={{ width: `${stats?.percent_used ?? 0}%` }}
              />
            </div>
          </div>
          <button
            className="btn btn-ghost btn-sm text-xs self-start"
            onClick={loadStats}
            disabled={!deviceId}
          >
            <RotateCcw size={12} /> Refresh Kapasitas
          </button>
        </div>

        {/* Card 2: Kesehatan Flash eMMC */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-dim">{t("storage.card_emmc")}</span>
            <Activity size={16} className="text-dim" />
          </div>
          <div className="my-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold tabular-nums tracking-tight">
                {stats?.emmc_write_speed_mbps ? `${stats.emmc_write_speed_mbps} MB/s` : "—"}
              </span>
              <span
                className={`badge ${
                  stats?.emmc_health === "good"
                    ? "badge-safe"
                    : stats?.emmc_health === "warning"
                    ? "badge-risky"
                    : stats?.emmc_health === "critical"
                    ? "badge-critical"
                    : "badge-unknown"
                }`}
              >
                {stats?.emmc_health === "good"
                  ? t("storage.health_good")
                  : stats?.emmc_health === "warning"
                  ? t("storage.health_warning")
                  : stats?.emmc_health === "critical"
                  ? t("storage.health_critical")
                  : t("storage.health_unknown")}
              </span>
            </div>
            <div className="text-xs text-dim mt-1">
              Latensi Write: {stats?.emmc_latency_ms ? `${stats.emmc_latency_ms} ms` : "—"}
            </div>
          </div>
          <button
            className="btn btn-ghost btn-sm text-xs self-start"
            onClick={runBenchmark}
            disabled={!deviceId || benchmarking}
          >
            {benchmarking ? <Loader2 size={12} className="animate-spin" /> : <Activity size={12} />}
            {t("storage.btn_bench")}
          </button>
        </div>

        {/* Card 3: Aksi Cepat & Sampah */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-dim">{t("storage.card_reclaimable")}</span>
            <Trash2 size={16} className="text-dim" />
          </div>
          <div className="my-3">
            <div className="text-2xl font-bold tabular-nums tracking-tight text-emerald-400">
              {formatBytesLocal(selectedSize)}
            </div>
            <div className="text-xs text-dim mt-1">
              {selectedIds.size} dari {items.length} item sampah terpilih
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              className="btn btn-primary btn-sm text-xs"
              onClick={runScan}
              disabled={!deviceId || scanning}
            >
              {scanning ? <Loader2 size={12} className="animate-spin" /> : <HardDrive size={12} />}
              {t("storage.btn_scan")}
            </button>
            <button
              className="btn btn-ghost btn-sm text-xs"
              onClick={runTrim}
              disabled={!deviceId || trimming}
              title="Trim cache semua aplikasi secara global tanpa root"
            >
              {trimming ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
              {t("storage.btn_trim")}
            </button>
            <button
              className="btn btn-ghost btn-sm text-xs"
              onClick={copyWaReport}
              disabled={!deviceId}
              title="Salin ringkasan ke WhatsApp"
            >
              <Copy size={12} />
              {t("storage.btn_copy_report")}
            </button>
          </div>
        </div>
      </div>

      {/* Category Tabs & Table Header */}
      <div className="flex flex-col gap-2 mt-2">
        <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2 flex-wrap">
          {(
            [
              { key: "all", label: t("storage.cat_all"), icon: HardDrive },
              { key: "whatsapp", label: t("storage.cat_whatsapp"), icon: MessageSquare },
              { key: "orphan", label: t("storage.cat_orphan"), icon: FolderMinus },
              { key: "apk", label: t("storage.cat_apk"), icon: FileCode },
              { key: "cache", label: t("storage.cat_cache"), icon: ShieldCheck },
            ] as const
          ).map((cat) => {
            const Icon = cat.icon;
            const count =
              cat.key === "all" ? items.length : items.filter((i) => i.category === cat.key).length;
            return (
              <button
                key={cat.key}
                className={`btn btn-sm text-xs ${
                  filter === cat.key ? "btn-primary" : "btn-ghost"
                }`}
                onClick={() => setFilter(cat.key)}
              >
                <Icon size={13} />
                {cat.label}
                <span className="tab-count ml-1">{count}</span>
              </button>
            );
          })}

          <div className="ml-auto flex items-center gap-2">
            <button
              className="btn btn-danger btn-sm"
              disabled={selectedIds.size === 0 || deleting}
              onClick={() => setDryRunOpen(true)}
            >
              <Trash2 size={14} />
              {t("storage.btn_clean")} ({selectedIds.size})
            </button>
          </div>
        </div>

        {/* Tabel Temuan Sampah */}
        <div className="table-scroll border border-[var(--border)] rounded-xl overflow-hidden">
          <table className="app-table">
            <thead>
              <tr>
                <th className="w-10">
                  <input
                    type="checkbox"
                    checked={
                      filteredItems.length > 0 &&
                      filteredItems.every((i) => selectedIds.has(i.id))
                    }
                    onChange={toggleAllVisible}
                  />
                </th>
                <th>Item / Folder</th>
                <th className="w-28">Kategori</th>
                <th className="w-24">Keamanan</th>
                <th className="w-28 text-right">Ukuran</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-dim text-xs">
                    {scanning ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 size={16} className="animate-spin" />
                        Scanning partisi storage...
                      </div>
                    ) : (
                      t("storage.empty_scan")
                    )}
                  </td>
                </tr>
              )}
              {filteredItems.map((item) => (
                <tr
                  key={item.id}
                  className={`cursor-pointer transition-colors duration-100 hover:bg-[var(--bg-hover)] ${selectedIds.has(item.id) ? "selected" : ""}`}
                  onClick={() => toggleItem(item.id)}
                >
                  <td
                    className="cell-check"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleItem(item.id);
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(item.id)}
                      onChange={() => toggleItem(item.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td>
                    <div className="font-medium text-sm">{item.name}</div>
                    <div className="text-xs text-dim">
                      {lang === "id" ? item.description_id : item.description_en}
                    </div>
                    <div className="mono text-[11px] text-faint truncate max-w-lg mt-0.5">
                      {item.path}
                    </div>
                  </td>
                  <td>
                    <span
                      className={`badge capitalize ${
                        item.category === "whatsapp"
                          ? "badge-safe"
                          : item.category === "orphan"
                          ? "badge-system"
                          : item.category === "apk"
                          ? "badge-risky"
                          : "badge-user"
                      }`}
                    >
                      {item.category}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        item.safety_level === "safe" ? "badge-safe" : "badge-risky"
                      }`}
                    >
                      {item.safety_level === "safe" ? "Aman" : "Tinjau"}
                    </span>
                  </td>
                  <td className="text-right font-medium text-xs mono">
                    {item.size_formatted}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Dry-Run Konfirmasi Sebelum Hapus */}
      {dryRunOpen && (
        <div className="modal-overlay" onClick={() => setDryRunOpen(false)}>
          <div className="modal" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-danger" />
                <div className="modal-title">{t("storage.dryrun_title")}</div>
              </div>
            </div>
            <div className="modal-body flex flex-col gap-2">
              <p className="text-sm">{t("storage.dryrun_desc")}</p>
              <div
                className="rounded-lg p-2 text-xs mono flex flex-col gap-1 border border-[var(--border)] overflow-y-auto"
                style={{ background: "var(--bg-card)", maxHeight: 180 }}
              >
                {items
                  .filter((i) => selectedIds.has(i.id))
                  .map((item) => (
                    <div key={item.id} className="flex justify-between items-center gap-2">
                      <span className="truncate">{item.path}</span>
                      <span className="text-dim shrink-0">{item.size_formatted}</span>
                    </div>
                  ))}
              </div>
              <div className="flex justify-between items-center text-xs mt-2 pt-2 border-t border-[var(--border)]">
                <span className="text-dim">Total Ruang Dibebaskan:</span>
                <span className="font-bold text-sm text-emerald-400">
                  {formatBytesLocal(selectedSize)}
                </span>
              </div>
            </div>
            <div className="modal-foot">
              <button
                className="btn btn-ghost"
                onClick={() => setDryRunOpen(false)}
                disabled={deleting}
              >
                Batal
              </button>
              <button
                className="btn btn-danger"
                onClick={executeDelete}
                disabled={deleting}
              >
                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                {t("storage.dryrun_confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
