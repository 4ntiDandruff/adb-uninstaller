import { ScrollText, X } from "lucide-react";

interface ChangelogEntry {
  version: string;
  date: string;
  items: string[];
}

const CHANGELOG: ChangelogEntry[] = [
  {
    version: "v2.3.0",
    date: "2026-09-16",
    items: [
      "[feat] Storage Doctor overhaul: scanner multi-vendor Telegram, crash dumps, logs, dan orphan zombie",
      "[feat] Floating Bottom Action Dock: dock melayang ergonomis untuk seleksi jempol dan bulk action",
      "[feat] Offline APK Extractor: backup APK mentah perangkat ke ~/Downloads/APK_Backup",
      "[feat] Multi-segment storage meter: visualisasi interaktif OS, ruang bebas, dan sampah terpulihkan",
      "[perf] Kernel fail-safe kill_on_drop: eliminasi total risiko zombie process ADB di background",
      "[ui] Micro-interaksi tactile: transisi pegas cubic-bezier, concentric card radii, dan category badges",
    ],
  },
  {
    version: "v2.2.5",
    date: "2026-08-07",
    items: [
      "[feat] Fitur About Me (Tentang): profil Hizam Nahari, Megapass Sidoarjo, link website & GitHub",
      "[feat] Integrasi Catatan Rilis ke dalam modal Tentang agar UI Topbar lebih rapi",
      "[ui] Generate icon desktop baru: rounded square biru modern + huruf A putih di tengah",
      "[ai] Optimasi prompt AI batch: definisi level eksplisit + few-shot example -> konsistensi Haiku naik",
      "[ai] Prompt analyze_device: konteks brand HP Indonesia (Xiaomi, Samsung, OPPO, Vivo, Realme, Infinix)",
      "[fix] pretty_label: deteksi compound generic word (globalbrowser, miniplayer)",
      "[fix] Batch op/undo: await loadApps agar tabel refresh sinkron",
      "[chat] AI Chat: kirim history lengkap, bukan cuma pesan terakhir",
    ],
  },
  {
    version: "v2.2.3",
    date: "2026-08-06",
    items: [
      "[feat] AI batch: minta app_name (nama asli app) -> label tabel jauh lebih akurat",
      "[feat] Label AI di-persist ke SQLite -> next scan load nama asli dari cache",
      "[fix] pretty_label fallback tetap ada sebelum AI jalan",
    ],
  },
  {
    version: "v2.2.2",
    date: "2026-08-06",
    items: [
      "[fix] App.tsx: runBatchOp await loadApps -> fix race condition busy state",
      "[fix] App.tsx: runOp await loadApps -> fix race condition busy state",
      "[fix] App.tsx: undoLast await loadApps -> fix race condition busy state",
      "[chat] AI Chat: kirim conversation history -> follow-up context tidak hilang",
      "[fix] Sidebar: fix versi hardcoded v2.2.0 -> v2.2.2",
      "[fix] adb.rs: list_apps pakai managed DbState -> hapus SQLite double-open",
      "[clean] exportPreset.ts: hapus dead code importPreset + unused import readTextFile",
    ],
  },
  {
    version: "v2.2.0",
    date: "2026-08-05",
    items: [
      "[feat] Tombol Layar: atur waktu layar mati via ADB -> tembus batas 10 menit UI bawaan HP",
      "[feat] set_screen_timeout baca ulang angka sebagai bukti kepasang -> deteksi Device Admin yang menolak",
      "[fix] App.tsx: undo disable pakai pm enable (bukan install-existing yang tak re-enable app)",
      "[fix] App.tsx: ganti bahasa tak lagi timpa alasan hasil AI",
      "[clean] adb.rs/ai.rs: 3 clippy lint bersih (next_back, replace gabung, split_once)",
    ],
  },
  {
    version: "v2.1.3",
    date: "2026-08-05",
    items: [
      "[fix] App.tsx: fix stale deviceId di AI save -> deps autoAnalyze/analyzeUnknown",
      "[fix] db.rs: batch_update_safety transaction + normalize level AI (Safe -> safe)",
      "[fix] App.tsx: normalizeSafety() saat apply AI result -> badge/filter konsisten",
      "[perf] save_app_size: ukuran APK di DetailPanel di-persist ke SQLite",
      "[perf] Next open device: safety + size load instant dari cache",
    ],
  },
  {
    version: "v2.1.2",
    date: "2026-08-03",
    items: [
      "[perf] AI results sekarang disimpan ke SQLite -> reconnect device load instant",
      "[clean] Hapus 4 dead npm deps (@tanstack/react-table, class-variance-authority, clsx, tailwind-merge)",
      "[clean] Hapus dead file lib/utils.ts",
      "[fix] ai.rs: strip_sse handle multi-line SSE (concat semua delta chunks)",
      "[i18n] DebloatPresets, SettingsDialog, ChangelogDialog -> semua label ikut bahasa aktif",
      "[i18n] Fix duplicate i18n key settings.save",
      "[fix] exportPreset: hapus hardcoded locale id-ID",
    ],
  },
  {
    version: "v2.1.1",
    date: "2026-08-03",
    items: [
      "[fix] adb.rs: list_apps pakai db_path() langsung -> fix init_db ganda",
      "[fix] adb.rs: force_stop_package cek exit code saja -> stderr check dihapus",
      "[fix] safety-tags.ts: com.android.* catch-all cek tags dict dulu",
      "[fix] App.tsx: useEffect lang change hanya update static tags",
      "[fix] vite.config.ts: base './' -> fix CSS/JS tidak load di Tauri production build",
      "[fix] db.rs: hapus dead code update_safety + fix lifetime warning",
      "[feat] AppTable: tombol Scan Device di empty state",
      "[feat] ConfirmDialog: custom confirm dialog menggantikan window.confirm()",
      "[feat] Sidebar: placeholder text saat belum ada device",
      "[chat] AI Chat: default position bottom-right -> tidak lagi menutupi sidebar",
      "[chat] AI Chat: max-height 380px pada messages -> scroll proper",
      "[i18n] i18n: semua label hardcoded sekarang pakai t()",
      "[i18n] i18n: 'tampil/dipilih' -> 'shown/selected' saat lang=EN",
      "[i18n] Sidebar: fix duplikasi model name 'Infinix Infinix X6788' -> 'Infinix X6788'",
      "[ui] CSS: table-layout auto -> kolom tidak terpotong",
      "[ui] CSS: light theme contrast boost -> text-dim, text-faint, btn-ghost",
      "[ui] CSS: dark theme text-faint dinaikkan ke #6b7d9e",
      "[ui] Toaster dipindah bottom-right -> tidak overlap topbar buttons",
      "[ui] SearchBar: onChange masuk useEffect deps -> fix stale closure",
      "[sec] tauri.conf.json: CSP null -> fix blocking CSS di production",
    ],
  },
  {
    version: "v2.1.0",
    date: "2026-08-03",
    items: [
      "[fix] db.rs: update_safety filter per device_id",
      "[fix] ai.rs: hapus init_db duplikat",
      "[fix] adb.rs: timeout 30 detik pada semua perintah ADB",
      "[fix] adb.rs: disable/enable/force_stop cek output string",
      "[fix] App.tsx: runBatch await loadApps sebelum setBusy(false)",
      "[fix] App.tsx: autoAnalyzeUnknown proses semua package unknown",
      "[fix] App.tsx: undo stack track disable juga",
      "[feat] AppTable: kolom label app + package name sebagai subtitle",
      "[feat] AppTable: sort ukuran numerik",
      "[feat] AppTable: skeleton loading proporsional",
      "[feat] Sidebar: statistik breakdown safe / risky / kritis / unknown",
      "[feat] DetailPanel: tombol copy package name",
      "[feat] DetailPanel: semua label aksi ikut bahasa UI (i18n)",
      "[feat] SettingsDialog: toggle tema Dark/Light langsung di Settings",
      "[feat] LogDrawer: auto-scroll ke log terbaru + tombol export .txt",
      "[feat] SearchBar: debounce 200ms",
      "[chat] AIChat: support drag via sentuhan",
      "[chat] AIChat: window minimized bisa di-drag",
      "[chat] AIChat: tombol clear history",
      "[i18n] safety-tags.ts: semua reason static tags punya versi Bahasa Indonesia",
      "[i18n] ai.rs: prompt AI batch kirim instruksi bahasa dari settings",
      "[i18n] App.tsx: ganti bahasa -> reason package langsung berubah otomatis",
      "[sec] tauri.conf.json: CSP dinonaktifkan",
      "[db] db.rs: WAL mode aktif untuk performa SQLite",
    ],
  },
  {
    version: "v2.0.0",
    date: "2026-07-23",
    items: [
      "[core] Rilis v2 penuh -> rebuild dari scaffold Tauri v2 + React + Rust",
      "[core] Deteksi device ADB (USB / Wi-Fi) + auto-select",
      "[core] List apps dengan tab: Semua, System, User, Disabled, Running",
      "[search] Search bar + tombol clear",
      "[core] Aksi per-app & batch: Uninstall, Disable, Enable, Force Stop, Clear Data",
      "[undo] Undo / restore package yang di-uninstall",
      "[sec] Klasifikasi keamanan 4 level: safe / risky / critical / unknown",
      "[ai] Auto AI untuk package unknown (batch 50/call)",
      "[chat] AI Chat floating: drag, minimize, history persist",
      "[theme] Dark / Light theme",
      "[i18n] i18n Bahasa Indonesia / English",
      "[scan] Progress bar scan + status message",
      "[db] Local SQLite cache (~/.config/adb-uninstaller/cache.db)",
      "[preset] Export preset debloat (JSON) + debloat presets bawaan",
      "[log] Log drawer + toast notification",
      "[core] Info device: model, Android, battery, storage, RAM",
    ],
  },
];

interface Props {
  open: boolean;
  onClose: () => void;
  lang?: string;
}

export function ChangelogDialog({ open, onClose, lang = "id" }: Props) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title flex items-center gap-2">
            <ScrollText size={16} className="text-primary" />
            <span>{lang === "en" ? "Release Notes" : "Catatan Rilis"}</span>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="modal-body" style={{ maxHeight: 420, overflowY: "auto" }}>
          {CHANGELOG.map((entry) => (
            <div key={entry.version} style={{ borderBottom: "1px solid var(--border)", paddingBottom: 12, marginBottom: 12 }}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono font-bold text-sm badge badge-safe" style={{ fontSize: 12 }}>
                  {entry.version}
                </span>
                <span className="text-xs text-faint font-mono">{entry.date}</span>
              </div>
              <ul style={{ paddingLeft: 16, margin: 0, listStyle: "disc" }}>
                {entry.items.map((item, i) => (
                  <li key={i} className="text-xs" style={{ marginBottom: 3, lineHeight: 1.5 }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="modal-foot">
          <button className="btn btn-primary" onClick={onClose}>{lang === "en" ? "Close" : "Tutup"}</button>
        </div>
      </div>
    </div>
  );
}
