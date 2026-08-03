import { X } from "lucide-react";

interface ChangelogEntry {
  version: string;
  date: string;
  items: string[];
}

const CHANGELOG: ChangelogEntry[] = [
  {
    version: "v2.1.1",
    date: "2026-08-03",
    items: [
      "🐛 adb.rs: list_apps pakai db_path() langsung — fix init_db ganda yang buka koneksi SQLite baru setiap scan",
      "🐛 adb.rs: force_stop_package cek exit code saja — stderr check dihapus (beberapa HP kirim stderr walau sukses)",
      "🐛 safety-tags.ts: com.android.* catch-all sekarang cek tags dict dulu — package yang sudah di-map tidak di-override",
      "🐛 App.tsx: useEffect lang change hanya update static tags — AI re-translate dihapus (penyebab infinite loop)",
      "🐛 vite.config.ts: base './' — fix CSS/JS tidak load di Tauri production build (absolute path tidak resolve)",
      "🐛 db.rs: hapus dead code update_safety + fix lifetime warning — Rust 0 warnings",
      "✨ AppTable: tombol Scan Device di empty state — user tidak perlu cari refresh icon di sidebar",
      "✨ ConfirmDialog: custom confirm dialog menggantikan window.confirm() — sesuai design system",
      "✨ Sidebar: placeholder text saat belum ada device — bukan kosong melompong",
      "✨ AI Chat: default position bottom-right — tidak lagi menutupi sidebar",
      "✨ AI Chat: max-height 380px pada messages — scroll proper di chat panjang",
      "🌐 i18n: semua label hardcoded sekarang pakai t() — search placeholder, filter, counter, log, sidebar hint",
      "🌐 i18n: 'tampil/dipilih' → 'shown/selected' saat lang=EN",
      "🌐 Sidebar: fix duplikasi model name 'Infinix Infinix X6788' → 'Infinix X6788'",
      "🎨 CSS: table-layout auto — kolom SAFETY/TIPE/STATUS/UKURAN tidak lagi terpotong ellipsis",
      "🎨 CSS: light theme contrast boost — text-dim, text-faint, btn-ghost, sidebar, scrollbar semua lebih readable",
      "🎨 CSS: dark theme text-faint dinaikkan ke #6b7d9e — sidebar placeholder text lebih jelas",
      "🎨 Toaster dipindah bottom-right — tidak overlap topbar buttons",
      "🎨 SearchBar: onChange masuk useEffect deps — fix stale closure pada debounce",
      "🔒 tauri.conf.json: CSP null — CSP ketat memblokir CSS di Tauri WebView production",
    ],
  },
  {
    version: "v2.1.0",
    date: "2026-08-03",
    items: [
      "🐛 db.rs: update_safety sekarang filter per device_id — tidak lagi overwrite data device lain",
      "🐛 ai.rs: hapus init_db duplikat yang menyebabkan SQLite lock conflict",
      "🐛 adb.rs: timeout 30 detik pada semua perintah ADB — tidak lagi hang selamanya",
      "🐛 adb.rs: disable/enable/force_stop cek output string, bukan hanya exit code",
      "🐛 App.tsx: runBatch await loadApps sebelum setBusy(false) — fix race condition",
      "🐛 App.tsx: autoAnalyzeUnknown sekarang proses SEMUA package unknown, bukan hanya 50 pertama",
      "🐛 App.tsx: undo stack sekarang track disable juga, bukan hanya uninstall",
      "✨ AppTable: kolom label app (nama readable) + package name sebagai subtitle",
      "✨ AppTable: sort ukuran numerik yang benar (bukan string comparison)",
      "✨ AppTable: skeleton loading per-kolom proporsional",
      "✨ Sidebar: statistik breakdown safe / risky / kritis / unknown dengan warna",
      "✨ DetailPanel: tombol copy package name",
      "✨ DetailPanel: semua label aksi ikut bahasa UI (i18n)",
      "✨ SettingsDialog: toggle tema Dark/Light langsung di Settings",
      "✨ LogDrawer: auto-scroll ke log terbaru + tombol export ke file .txt",
      "✨ SearchBar: debounce 200ms — tidak lag saat mengetik cepat",
      "✨ AIChat: support drag via sentuhan (tablet/layar sentuh)",
      "✨ AIChat: window minimized bisa di-drag",
      "✨ AIChat: tombol clear history",
      "🌐 safety-tags.ts: semua reason static tags punya versi Bahasa Indonesia",
      "🌐 ai.rs: prompt AI batch kirim instruksi bahasa dari settings",
      "🌐 App.tsx: ganti bahasa → reason package langsung berubah otomatis",
      "🔒 tauri.conf.json: CSP dinonaktifkan — CSP ketat memblokir CSS di Tauri WebView",
      "🗄️ db.rs: WAL mode aktif untuk performa SQLite lebih baik",
    ],
  },
  {
    version: "v2.0.0",
    date: "2026-07-23",
    items: [
      "🎉 Rilis v2 penuh — rebuild dari scaffold Tauri v2 + React + Rust",
      "📱 Deteksi device ADB (USB / Wi-Fi) + auto-select",
      "📋 List apps dengan tab: Semua, System, User, Disabled, Running",
      "🔍 Search bar + tombol clear",
      "⚡ Aksi per-app & batch: Uninstall, Disable, Enable, Force Stop, Clear Data",
      "↩️ Undo / restore package yang di-uninstall",
      "🛡️ Klasifikasi keamanan 4 level: safe / risky / critical / unknown",
      "🤖 Auto AI untuk package unknown (batch 50/call)",
      "💬 AI Chat floating: drag, minimize, history persist",
      "🌙 Dark / Light theme",
      "🌐 i18n Bahasa Indonesia / English",
      "📊 Progress bar scan + status message",
      "🗄️ Local SQLite cache (~/.config/adb-uninstaller/cache.db)",
      "📤 Export preset debloat (JSON) + debloat presets bawaan",
      "📝 Log drawer + toast notification",
      "📱 Info device: model, Android, battery, storage, RAM",
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
          <div className="modal-title">📜 {lang === "en" ? "Release Notes" : "Catatan Rilis"}</div>
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
