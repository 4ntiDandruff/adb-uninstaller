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
  Sparkles,
  X,
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
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [aiConsulting, setAiConsulting] = useState(false);

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
    setAiAdvice(null);
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

    const reportLines = [
      `*LAPORAN SERVIS MEMORI — MEGAPASS*`,
      `Perangkat: ${model}`,
      `• Memori Tersedia: ${freeBefore}`,
      `• Total Sampah Terdeteksi: ${formatBytesLocal(selectedSize)}`,
      `• Kondisi Flash Memory: ${healthLabel} (${speed})`,
      `• Status: Siap dibersihkan`,
    ];

    if (aiAdvice) {
      reportLines.push(``, `*Diagnosa AI Teknisi:*`, aiAdvice.trim());
    }

    reportLines.push(``, `_Megapass Intra Solusindo — Servis Cepat & Transparan_`);

    navigator.clipboard.writeText(reportLines.join("\n")).then(() => {
      toast.success(t("storage.report_copied"));
    });
  }, [deviceInfo, stats, selectedSize, aiAdvice, t]);

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

  // Konsultasi AI Storage Advisor
  const runAiConsultation = useCallback(async () => {
    if (!deviceId) return;
    setAiConsulting(true);
    try {
      const junkSummary = items.reduce((acc, it) => {
        acc[it.category] = (acc[it.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const junkSummaryStr =
        Object.entries(junkSummary)
          .map(([k, v]) => `${k}: ${v} item`)
          .join(", ") || "Belum scan sampah";

      const devName = deviceInfo
        ? `${deviceInfo.manufacturer} ${deviceInfo.market_name || deviceInfo.model}`
        : deviceId;

      const prompt = `Sebagai teknisi servis HP meja kerja ruko, berikan diagnosa singkat 3 poin untuk kondisi penyimpanan HP ini:
Perangkat: ${devName}
Kapasitas: Terpakai ${stats?.used_formatted ?? "?"} dari ${stats?.total_formatted ?? "?"} (${stats?.percent_used ?? 0}%), Sisa Bebas: ${stats?.free_formatted ?? "?"}
Flash eMMC/UFS: Kecepatan Tulis ${stats?.emmc_write_speed_mbps ?? "?"} MB/s, Status: ${stats?.emmc_health ?? "belum diuji"}
Sampah Terdeteksi: ${items.length} item (Kategori: ${junkSummaryStr})

Format output persis (maksimal 15 kata per poin, tanpa markdown tebal):
• STATUS FLASH: <kondisi chip eMMC/UFS & risiko keausan>
• SUMBER BEBAN: <penyebab utama ruang penyimpanan menipis>
• SOLUSI SERVIS: <langkah rekomendasi teknisi>`;

      const reply = await api.chat(
        [{ role: "user", content: prompt }],
        `Device Storage Context for ${devName}`
      );
      setAiAdvice(reply);
      toast.success("Diagnosa AI Storage siap");
    } catch (e) {
      toast.error(`Konsultasi AI gagal: ${e}`);
    } finally {
      setAiConsulting(false);
    }
  }, [deviceId, deviceInfo, stats, items]);

  if (!deviceId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[460px] p-8 text-center text-dim gap-3 w-full max-w-lg mx-auto">
        <div className="empty-icon-wrap">
          <HardDrive size={30} />
        </div>
        <div className="font-semibold text-lg text-[var(--text)]">{t("storage.title")}</div>
        <p className="text-xs text-dim text-pretty max-w-md">
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
        <div className="card-bento">
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
                className={`h-full transition-all duration-300 ${
                  (stats?.percent_used ?? 0) > 90
                    ? "bg-red-500"
                    : (stats?.percent_used ?? 0) > 75
                    ? "bg-amber-500"
                    : "bg-primary"
                }`}
                style={{ width: `${stats?.percent_used ?? 0}%` }}
              />
            </div>
          </div>
          <div className="text-[11px] text-faint">
            {stats && stats.percent_used > 85
              ? "Penyimpanan hampir penuh. Bersihkan cache & sampah."
              : "Kapasitas ruang internal dalam batas aman."}
          </div>
        </div>

        {/* Card 2: eMMC / UFS Health */}
        <div className="card-bento">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-dim">{t("storage.card_emmc")}</span>
            <Activity size={16} className="text-dim" />
          </div>
          <div className="my-3">
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold tabular-nums tracking-tight">
                {stats?.emmc_write_speed_mbps ? `${stats.emmc_write_speed_mbps} MB/s` : "—"}
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  stats?.emmc_health === "good"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : stats?.emmc_health === "warning"
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    : stats?.emmc_health === "critical"
                    ? "bg-red-500/10 text-red-400 border border-red-500/20"
                    : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
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
              Latensi: {stats?.emmc_latency_ms ? `${stats.emmc_latency_ms} ms` : "—"}
            </div>
          </div>
          <button
            className="btn btn-ghost btn-sm text-xs self-start"
            onClick={runBenchmark}
            disabled={!deviceId || benchmarking}
            title="Benchmark eMMC write speed dengan dd dsync micro-test"
          >
            {benchmarking ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <RotateCcw size={12} />
            )}
            {t("storage.btn_bench")}
          </button>
        </div>

        {/* Card 3: Aksi Cepat & Sampah */}
        <div className="card-bento">
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
              className="btn btn-ghost btn-sm text-xs text-amber-400 hover:text-amber-300"
              onClick={runAiConsultation}
              disabled={!deviceId || aiConsulting}
              title="Konsultasi AI: Analisa kondisi storage & rekomendasi teknisi"
            >
              {aiConsulting ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              {aiConsulting ? t("storage.ai_analyzing") : t("storage.btn_ai_advisor")}
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

      {/* AI Storage Advisor Diagnosis Card */}
      {aiAdvice && (
        <div className="bg-[var(--bg-card)] border border-amber-500/30 rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
              <Sparkles size={14} />
              <span>{t("storage.ai_advisor_title")}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                className="btn btn-ghost btn-sm text-xs"
                onClick={() => {
                  navigator.clipboard.writeText(aiAdvice);
                  toast.success(t("storage.ai_copy_success"));
                }}
                title="Salin saran ke clipboard"
              >
                <Copy size={12} />
                <span>{t("storage.ai_copy")}</span>
              </button>
              <button
                className="btn btn-ghost btn-icon btn-sm"
                onClick={() => setAiAdvice(null)}
                title="Tutup"
              >
                <X size={14} />
              </button>
            </div>
          </div>
          <div className="text-xs text-[var(--text-main)] whitespace-pre-line leading-relaxed font-sans">
            {aiAdvice}
          </div>
        </div>
      )}

      {/* Category Tabs & Table Header */}
      <div className="flex flex-col gap-2 mt-2">
        <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2 flex-wrap">
          <div className="segmented-pill">
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
                  className={`segmented-tab ${filter === cat.key ? "active" : ""}`}
                  onClick={() => setFilter(cat.key)}
                >
                  <Icon size={13} />
                  <span>{cat.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full tabular-nums ${
                      filter === cat.key
                        ? "bg-white/20 text-white"
                        : "bg-[var(--bg-active)] text-dim"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="ml-auto flex items-center gap-2">
            {selectedIds.size > 0 && (
              <button
                className="btn btn-danger btn-sm text-xs"
                onClick={() => setDryRunOpen(true)}
                disabled={deleting}
              >
                <Trash2 size={12} />
                {t("storage.btn_clean")} ({formatBytesLocal(selectedSize)})
              </button>
            )}
          </div>
        </div>

        {/* Junk Items Table */}
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 36 }}>
                  <input
                    type="checkbox"
                    checked={
                      filteredItems.length > 0 &&
                      filteredItems.every((i) => selectedIds.has(i.id))
                    }
                    onChange={toggleAllVisible}
                    disabled={filteredItems.length === 0}
                  />
                </th>
                <th>Target Pembersihan</th>
                <th style={{ width: 100 }}>Kategori</th>
                <th style={{ width: 90 }}>Tingkat</th>
                <th style={{ width: 90, textAlign: "right" }}>Ukuran</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-dim text-xs">
                    {items.length === 0 ? t("storage.empty_scan") : "Tidak ada item pada kategori ini."}
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} onClick={() => toggleItem(item.id)} className="cursor-pointer">
                    <td onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item.id)}
                        onChange={() => toggleItem(item.id)}
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
                      <span className="badge badge-system uppercase text-[10px]">
                        {item.category}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          item.safety_level === "safe"
                            ? "badge-safe"
                            : item.safety_level === "review"
                            ? "badge-risky"
                            : "badge-critical"
                        }`}
                      >
                        {item.safety_level === "safe"
                          ? "Aman"
                          : item.safety_level === "review"
                          ? "Periksa"
                          : "Hati-hati"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }} className="tabular-nums font-mono text-xs">
                      {item.size_formatted}
                    </td>
                  </tr>
                ))
              )}
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
