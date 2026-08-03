# Changelog

Semua perubahan penting dicatat di file ini.

Format mirip [Keep a Changelog](https://keepachangelog.com/).

## [2.1.0] — 2026-08-03

Patch besar: bug fixes kritis + UI/UX overhaul + dukungan penuh Bahasa Indonesia.

### Fixed (Bug Kritis)
- `db.rs` — `update_safety` sekarang filter per `device_id` (sebelumnya bisa overwrite data device lain)
- `ai.rs` — hapus `init_db()` duplikat yang menyebabkan SQLite lock conflict
- `adb.rs` — tambah timeout 30s pada semua ADB command (sebelumnya bisa hang selamanya)
- `adb.rs` — `disable_package` cek output `"disabled"` bukan hanya exit code
- `adb.rs` — `enable_package` cek output `"enabled"` bukan hanya exit code
- `adb.rs` — `force_stop` cek stderr kosong (am force-stop selalu return 0)
- `App.tsx` — `runBatch` sekarang `await loadApps` sebelum `setBusy(false)` (race condition)
- `App.tsx` — `autoAnalyzeUnknown` queue semua unknown dalam batch 50, bukan hanya 50 pertama
- `App.tsx` — undo stack sekarang track `disable` juga, bukan hanya `uninstall`

### Added (UI/UX)
- `AppTable` — kolom label app (nama readable) + package name sebagai subtitle
- `AppTable` — sort size numeric yang benar (bukan string comparison)
- `AppTable` — skeleton loading per-kolom proporsional
- `Sidebar` — statistik breakdown: safe / risky / kritis / unknown dengan warna
- `DetailPanel` — tombol copy package name
- `DetailPanel` — semua label aksi sekarang mengikuti bahasa UI (i18n)
- `DetailPanel` — safety badge translated sesuai bahasa
- `SettingsDialog` — toggle tema Dark/Light langsung di Settings (tidak hanya dari topbar)
- `LogDrawer` — auto-scroll ke log entry terbaru
- `LogDrawer` — tombol export log ke file `.txt`
- `SearchBar` — debounce 200ms (tidak lag saat mengetik cepat)
- `AIChat` — support drag via touch (tablet/layar sentuh)
- `AIChat` — minimized window bisa di-drag
- `AIChat` — tombol clear history

### Changed
- `App.css` — hapus scaffold Tauri default yang tidak terpakai
- `tauri.conf.json` — Content Security Policy aktif (sebelumnya `null`)
- `db.rs` — WAL mode aktif (`PRAGMA journal_mode=WAL`) untuk performa SQLite lebih baik

### Internasionalisasi (i18n)
- `safety-tags.ts` — semua `reason` static tags sekarang punya versi Bahasa Indonesia
- `ai.rs` — prompt AI batch kirim instruksi bahasa dari settings (reason AI ikut bahasa UI)
- `App.tsx` — `enrichApps` pass `lang` ke semua call site
- `App.tsx` — `useEffect` re-enrich otomatis saat bahasa diubah di Settings

---

## [2.0.0] — 2026-07-23

Rilis v2 penuh (rebuild dari scaffold Tauri v2 + React + Rust). Target: Linux teknisi Megapass Sidoarjo.

### Added
- Deteksi device ADB (USB / Wi‑Fi) + auto-select
- List apps dengan tab: Semua, System, User, Disabled, Running
- Sort package / safety / size (asc/desc)
- Search bar + tombol clear
- Sticky header tabel
- Aksi per-app & batch: Uninstall, Disable, Enable, Force Stop, Clear Data
- Undo / restore package
- Klasifikasi keamanan 4 level (safe / risky / critical / unknown)
- Static offline safety tags (Android, Google, Xiaomi, Samsung, OPPO, Vivo, analytics)
- **Auto AI** untuk package `unknown` (batch 50/call) — spek senjata utama v2
- Tombol AI manual untuk sisa unknown
- AI Settings: Base URL (`/v1`), API Key, Model, Temperature, Max Tokens, System Prompt
- Tombol **Test Koneksi** AI + daftar model
- AI Chat floating: drag, minimize, history tetap saat tutup panel
- Dark / Light theme (light mode GitHub-style)
- i18n Bahasa Indonesia / English
- Progress bar scan (persen + status message)
- Local SQLite cache (`~/.config/adb-uninstaller/cache.db`)
- Export preset debloat (JSON) + fallback download
- Debloat presets bawaan
- Humanized error messages (kode teknis → bahasa teknisi)
- Bundle release: `.deb` + `.AppImage`
- Log drawer + toast notification
- Info device: model, Android/SDK, battery, storage, RAM

### Fixed
- `normalize_base_url` tidak double `/v1`
- Deteksi `is_running` exact match dari `ProcessRecord{...}`
- `get_app_size` fallback portable (`wc -c` / path)
- `api.restore` konsisten di undo flow
- Refresh device: reset selection jika device hilang, auto-select ulang
- AI chat auto-scroll ke pesan terbaru
- Checkbox alignment center di tabel
- Cache merge: hasil AI/safety tidak di-overwrite scan ulang
- `enrichApps` tidak menimpa safety yang sudah known
- Label cepat tanpa N+1 dumpsys (scan 200+ app tetap wajar)
- `analyze_apps_batch` strip SSE + extract JSON array
- Hasil AI disimpan ke SQLite
- Permission Tauri dialog/fs untuk export
- AI response parse toleran (SSE / markdown fence)

### Changed
- UI rombak total: sidebar + workbench dashboard teknisi
- AI Chat tidak lagi nempel di panel kanan (jadi floating)
- Light theme soft (tidak silau)
- Default model / settings mengikuti config lokal teknisi

### Security / Safety
- Critical package di-skip pada batch uninstall/disable
- Konfirmasi dialog sebelum aksi batch
- API key disimpan lokal di config user (tidak di-commit)

### Notes
- Branch `v1-archive` menyimpan versi lama
- Repo: https://github.com/4ntiDandruff/adb-uninstaller
- Dev node: Kubuntu `hizam`

---

## [1.x] — archive

Lihat branch `v1-archive`.
