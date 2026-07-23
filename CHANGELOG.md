# Changelog

Semua perubahan penting dicatat di file ini.

Format mirip [Keep a Changelog](https://keepachangelog.com/).

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
