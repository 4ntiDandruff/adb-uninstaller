import { X } from "lucide-react";

interface ChangelogEntry {
  version: string;
  date: string;
  items: string[];
}

const CHANGELOG: ChangelogEntry[] = [
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
      "🔒 tauri.conf.json: Content Security Policy aktif (sebelumnya null)",
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
}

export function ChangelogDialog({ open, onClose }: Props) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">📜 Catatan Rilis</div>
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
          <button className="btn btn-primary" onClick={onClose}>Tutup</button>
        </div>
      </div>
    </div>
  );
}
