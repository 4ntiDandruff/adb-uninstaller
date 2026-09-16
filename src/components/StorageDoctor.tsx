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
  Send,
  FileText,
  Search,
  CheckCheck,
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

type CategoryFilter = "all" | "whatsapp" | "telegram" | "orphan" | "apk" | "cache" | "logs";

const getCategoryBadgeClass = (cat: string) => {
  switch (cat) {
    case "whatsapp":
      return "badge-cat-whatsapp";
    case "telegram":
      return "badge-cat-telegram";
    case "orphan":
      return "badge-cat-orphan";
    case "apk":
      return "badge-cat-apk";
    case "cache":
      return "badge-cat-cache";
    case "logs":
      return "badge-cat-logs";
    default:
      return "badge-system";
  }
};

const getCategoryLabel = (cat: string) => {
  switch (cat) {
    case "whatsapp":
      return "WhatsApp";
    case "telegram":
      return "Telegram";
    case "orphan":
      return "Orphan";
    case "apk":
      return "APK";
    case "cache":
      return "Cache";
    case "logs":
      return "Logs";
    default:
      return cat.toUpperCase();
  }
};

export function StorageDoctor({ deviceId, deviceInfo, installedApps, t, lang }: Props) {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [items, setItems] = useState<TrashItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<CategoryFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
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
    setSearchQuery("");
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

  // Uji Speed eMMC / UFS
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
    let list = filter === "all" ? items : items.filter((i) => i.category === filter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (i) => i.name.toLowerCase().includes(q) || i.path.toLowerCase().includes(q)
      );
    }
    return list;
  }, [items, filter, searchQuery]);

  const toggleAllVisible = () => {
    const allChecked = filteredItems.length > 0 && filteredItems.every((i) => selectedIds.has(i.id));
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

  // 1-Click: Bersihkan Semua yang Berstatus Safe
  const cleanAllSafe = useCallback(() => {
    const safeItems = items.filter((i) => i.safety_level === "safe");
    if (safeItems.length === 0) {
      toast.info("Tidak ada item berstatus aman yang siap dibersihkan");
      return;
    }
    setSelectedIds(new Set(safeItems.map((i) => i.id)));
    setDryRunOpen(true);
  }, [items]);

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

  // Statistik per kategori untuk badge tab
  const categoryStats = useMemo(() => {
    const res: Record<string, { count: number; bytes: number }> = {
      all: { count: items.length, bytes: items.reduce((a, b) => a + b.size_bytes, 0) },
      whatsapp: { count: 0, bytes: 0 },
      telegram: { count: 0, bytes: 0 },
      orphan: { count: 0, bytes: 0 },
      apk: { count: 0, bytes: 0 },
      cache: { count: 0, bytes: 0 },
      logs: { count: 0, bytes: 0 },
    };
    for (const it of items) {
      if (res[it.category]) {
        res[it.category].count += 1;
        res[it.category].bytes += it.size_bytes;
      }
    }
    return res;
  }, [items]);

  // Multi-segment storage calculations
  const segmentStats = useMemo(() => {
    if (!stats || stats.total_bytes === 0) {
      return { systemAndAppsPct: 0, reclaimablePct: 0, freePct: 100, systemBytes: 0 };
    }
    const total = stats.total_bytes;
    const used = stats.used_bytes;
    const reclaimable = selectedSize;
    const free = stats.free_bytes;
    const systemBytes = used > reclaimable ? used - reclaimable : 0;

    const systemAndAppsPct = Math.max(0, (systemBytes / total) * 100);
    const reclaimablePct = Math.max(0, (reclaimable / total) * 100);
    const freePct = Math.max(0, (free / total) * 100);

    return { systemAndAppsPct, reclaimablePct, freePct, systemBytes };
  }, [stats, selectedSize]);

  // Salin Laporan WhatsApp
  const copyWaReport = useCallback(() => {
    const model = deviceInfo?.market_name || deviceInfo?.model || "Android Device";
    const freeBefore = stats?.free_formatted || "—";
    const speed = stats?.emmc_write_speed_mbps ? `${stats.emmc_write_speed_mbps} MB/s` : "Normal";
    const healthLabel =
      stats?.emmc_health === "good"
        ? "Sehat (Responsif)"
        : stats?.emmc_health === "warning"
        ? "Mulai Aus (Sedikit Lambat)"
        : stats?.emmc_health === "critical"
        ? "Kritis (Risiko Kerusakan Chip)"
        : "Normal";

    const reportLines = [
      `*LAPORAN DIAGNOSA PENYIMPANAN — MEGAPASS*`,
      `Perangkat: ${model}`,
      `• Kapasitas Total: ${stats?.total_formatted ?? "—"}`,
      `• Memori Bebas: ${freeBefore}`,
      `• Total Sampah Dibersihkan: ${formatBytesLocal(selectedSize)}`,
      `• Kondisi Chip Memori: ${healthLabel} (${speed})`,
      `• Status Pembersihan: Siap dieksekusi`,
    ];

    if (aiAdvice) {
      reportLines.push(``, `*Diagnosa Teknisi AI:*`, aiAdvice.trim());
    }

    reportLines.push(``, `_Megapass Intra Solusindo • Servis Transparan & Presisi_`);

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
      toast.success(`${targets.length} item sampah berhasil dibersihkan`);
      setDryRunOpen(false);
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

  const categoryMeta = [
    { key: "all" as const, label: t("storage.cat_all"), icon: HardDrive },
    { key: "whatsapp" as const, label: t("storage.cat_whatsapp"), icon: MessageSquare },
    { key: "telegram" as const, label: t("storage.cat_telegram"), icon: Send },
    { key: "orphan" as const, label: t("storage.cat_orphan"), icon: FolderMinus },
    { key: "apk" as const, label: t("storage.cat_apk"), icon: FileCode },
    { key: "cache" as const, label: t("storage.cat_cache"), icon: ShieldCheck },
    { key: "logs" as const, label: t("storage.cat_logs"), icon: FileText },
  ];

  return (
    <div className="flex flex-col gap-4 p-4 max-w-7xl mx-auto w-full">
      {/* Header Title & Subtitle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[var(--border)] pb-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <HardDrive className="text-primary" size={22} />
            {t("storage.title")}
          </h2>
          <p className="text-xs text-dim">{t("storage.subtitle")}</p>
        </div>

        {/* Global Action Group */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            className="btn btn-primary btn-sm text-xs"
            onClick={runScan}
            disabled={!deviceId || scanning}
          >
            {scanning ? <Loader2 size={13} className="animate-spin" /> : <HardDrive size={13} />}
            {t("storage.btn_scan")}
          </button>
          {items.length > 0 && (
            <button
              className="btn btn-success btn-sm text-xs"
              onClick={cleanAllSafe}
              disabled={!deviceId || deleting}
              title="Pilih semua sampah berstatus aman dan buka konfirmasi hapus"
            >
              <CheckCheck size={13} />
              {t("storage.btn_clean_safe")}
            </button>
          )}
          <button
            className="btn btn-ghost btn-sm text-xs"
            onClick={runTrim}
            disabled={!deviceId || trimming}
            title="Trim cache semua aplikasi secara global tanpa root"
          >
            {trimming ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
            {t("storage.btn_trim")}
          </button>
          <button
            className="btn btn-ghost btn-sm text-xs text-amber-400 hover:text-amber-300"
            onClick={runAiConsultation}
            disabled={!deviceId || aiConsulting}
            title="Konsultasi AI: Analisa kondisi storage & rekomendasi teknisi"
          >
            {aiConsulting ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
            {aiConsulting ? t("storage.ai_analyzing") : t("storage.btn_ai_advisor")}
          </button>
          <button
            className="btn btn-ghost btn-sm text-xs"
            onClick={copyWaReport}
            disabled={!deviceId}
            title="Salin ringkasan ke format chat WhatsApp pelanggan"
          >
            <Copy size={13} />
            {t("storage.btn_copy_report")}
          </button>
        </div>
      </div>

      {/* Bento Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Card 1: Multi-Segment Storage Meter */}
        <div className="card-bento">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-dim">{t("storage.card_capacity")}</span>
            <HardDrive size={16} className="text-dim" />
          </div>
          <div className="my-2.5">
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold tabular-nums tracking-tight">
                {stats?.free_formatted ?? "—"}{" "}
                <span className="text-xs font-normal text-dim">bebas</span>
              </div>
              <span className="text-xs font-semibold tabular-nums text-primary">
                {stats?.percent_used ?? 0}% terpakai
              </span>
            </div>
            <div className="text-xs text-dim mt-0.5">
              Total {stats?.total_formatted ?? "—"} · Terpakai {stats?.used_formatted ?? "—"}
            </div>

            {/* Multi-segment Interactive Progress Bar */}
            <div className="storage-meter mt-2.5">
              <div
                className="storage-segment storage-segment-system"
                style={{ width: `${segmentStats.systemAndAppsPct}%` }}
                title={`Sistem & Apps: ${formatBytesLocal(segmentStats.systemBytes)}`}
              />
              {selectedSize > 0 && (
                <div
                  className="storage-segment storage-segment-reclaimable"
                  style={{ width: `${segmentStats.reclaimablePct}%` }}
                  title={`Sampah Terpilih: ${formatBytesLocal(selectedSize)}`}
                />
              )}
              <div
                className="storage-segment storage-segment-free"
                style={{ width: `${segmentStats.freePct}%` }}
                title={`Ruang Bebas: ${stats?.free_formatted ?? "—"}`}
              />
            </div>

            {/* Legend Indicators */}
            <div className="flex items-center gap-3 mt-2 text-[11px] text-faint flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary/80" />
                <span>OS & App</span>
              </div>
              {selectedSize > 0 && (
                <div className="flex items-center gap-1.5 text-reclaimable font-semibold">
                  <span className="w-2 h-2 rounded-full bg-current" />
                  <span>+{formatBytesLocal(selectedSize)} pulih</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[var(--border-strong)]" />
                <span>Bebas</span>
              </div>
            </div>
          </div>
          <div className="text-[11px] text-faint border-t border-[var(--border)] pt-2 mt-1">
            {stats && stats.percent_used > 85
              ? "Peringatan: Memori hampir penuh (>85%), berisiko lag pada OS."
              : "Kapasitas partisi data dalam ambang batas aman."}
          </div>
        </div>

        {/* Card 2: eMMC / UFS Speed Benchmark */}
        <div className="card-bento">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-dim">{t("storage.card_emmc")}</span>
            <Activity size={16} className="text-dim" />
          </div>
          <div className="my-2.5">
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold tabular-nums tracking-tight">
                {stats?.emmc_write_speed_mbps ? `${stats.emmc_write_speed_mbps} MB/s` : "—"}
              </div>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
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
              Latensi: {stats?.emmc_latency_ms ? `${stats.emmc_latency_ms} ms` : "—"} · Micro-test 8MB dsync
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-[var(--border)] pt-2 mt-1">
            <div className="text-[11px] text-faint">
              {stats?.emmc_write_speed_mbps && stats.emmc_write_speed_mbps >= 45
                ? "Chip UFS berkinerja tinggi (sangat responsif)"
                : stats?.emmc_write_speed_mbps && stats.emmc_write_speed_mbps >= 15
                ? "Kondisi eMMC 5.1 standar (sehat)"
                : stats?.emmc_write_speed_mbps && stats.emmc_write_speed_mbps > 0
                ? "Kecepatan rendah, kemungkinan chip aus"
                : "Klik uji speed untuk diagnosa fisik"}
            </div>
            <button
              className="btn btn-ghost btn-sm text-xs shrink-0"
              onClick={runBenchmark}
              disabled={!deviceId || benchmarking}
              title="Uji kecepatan tulis fisik flash memory (dd oflag=dsync)"
            >
              {benchmarking ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <RotateCcw size={12} />
              )}
              {t("storage.btn_bench")}
            </button>
          </div>
        </div>

        {/* Card 3: Status Sampah & Eksekusi */}
        <div className="card-bento">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-dim">{t("storage.card_reclaimable")}</span>
            <Trash2 size={16} className="text-dim" />
          </div>
          <div className="my-2.5">
            <div className="text-2xl font-bold tabular-nums tracking-tight text-reclaimable">
              {formatBytesLocal(selectedSize)}
            </div>
            <div className="text-xs text-dim mt-1">
              {selectedIds.size} dari {items.length} item terpilih untuk dibersihkan
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-[var(--border)] pt-2 mt-1">
            <div className="text-[11px] text-faint">
              {selectedIds.size > 0
                ? "Siap dibersihkan secara aman"
                : "Pilih item untuk dibersihkan"}
            </div>
            <button
              className="btn btn-danger btn-sm text-xs"
              onClick={() => setDryRunOpen(true)}
              disabled={selectedIds.size === 0 || deleting}
            >
              <Trash2 size={12} />
              {t("storage.btn_clean")}
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

      {/* Category Tabs & Table Toolbar */}
      <div className="flex flex-col gap-2 mt-2">
        <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] pb-2 flex-wrap">
          {/* Segmented Category Filter */}
          <div className="segmented-pill overflow-x-auto max-w-full">
            {categoryMeta.map((cat) => {
              const Icon = cat.icon;
              const meta = categoryStats[cat.key] || { count: 0, bytes: 0 };
              return (
                <button
                  key={cat.key}
                  className={`segmented-tab ${filter === cat.key ? "active" : ""}`}
                  onClick={() => setFilter(cat.key)}
                >
                  <Icon size={13} />
                  <span>{cat.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full tabular-nums font-mono leading-none ${
                      filter === cat.key
                        ? "bg-black/15 text-inherit font-semibold"
                        : "bg-[var(--bg-active)] text-dim"
                    }`}
                  >
                    {meta.count}
                    {meta.bytes > 0 && ` · ${formatBytesLocal(meta.bytes)}`}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Search on Junk Items */}
          <div className="search-wrap-sm ml-auto">
            <Search size={13} className="search-icon" />
            <input
              type="text"
              placeholder="Cari folder sampah..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input"
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear"
                onClick={() => setSearchQuery("")}
                title="Hapus pencarian"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Junk Items Table */}
        <div className="table-scroll rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] overflow-hidden">
          <table className="app-table">
            <thead>
              <tr>
                <th className="cell-check w-10">
                  <input
                    type="checkbox"
                    checked={
                      filteredItems.length > 0 &&
                      filteredItems.every((i) => selectedIds.has(i.id))
                    }
                    onChange={toggleAllVisible}
                    disabled={filteredItems.length === 0}
                    aria-label="Pilih semua"
                  />
                </th>
                <th>Target Pembersihan</th>
                <th style={{ width: 120 }}>Kategori</th>
                <th style={{ width: 95 }}>Tingkat</th>
                <th style={{ width: 95, textAlign: "right" }}>Ukuran</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-dim text-xs">
                    {items.length === 0
                      ? t("storage.empty_scan")
                      : searchQuery
                      ? `Tidak ada sampah yang cocok dengan kata kunci "${searchQuery}".`
                      : "Tidak ada item pada kategori ini."}
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    className={`cursor-pointer ${selectedIds.has(item.id) ? "selected" : ""}`}
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
                        onChange={() => {}}
                        aria-label={`Pilih ${item.name}`}
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
                      <span className={`badge ${getCategoryBadgeClass(item.category)} font-medium text-[10px]`}>
                        {getCategoryLabel(item.category)}
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
          <div className="modal" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
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
                style={{ background: "var(--bg-card)", maxHeight: 200 }}
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
                <span className="font-bold text-sm text-reclaimable">
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
                {t("storage.dryrun_confirm")} ({formatBytesLocal(selectedSize)})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
