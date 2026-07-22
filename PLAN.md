# PLAN — ADB Uninstaller v2

## Informasi Dasar

| Item | Nilai |
|------|-------|
| Nama Proyek | ADB Uninstaller - By Teknisi Megapass Sidoarjo |
| Versi | 2.0.0 |
| Repo | github.com/4ntiDandruff/adb-uninstaller |
| Target OS | Linux (Kubuntu 24.04+) |
| Stack | Tauri v2 + React 18 + Tailwind CSS 4 + shadcn/ui |
| Bahasa | TypeScript (frontend), Rust (backend) |
| Build Target | .deb + .AppImage |

## Status

**FASE: BUILD DARI NOL** — v2.0.0 baru, v1 diarsipkan ke branch `v1-archive`.

## Tujuan

ADB Uninstaller v2 adalah aplikasi desktop untuk teknisi HP yang membutuhkan tool cepat, aman, dan cerdas untuk mengelola aplikasi Android via ADB. Aplikasi ini menggabungkan kecepatan native Tauri dengan kecerdasan AI untuk analisis keamanan aplikasi secara batch.

## Stack Teknologi

### Frontend

| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| React | 18.x | UI framework |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.x | Utility-first styling |
| shadcn/ui | latest | Komponen UI accessible |
| Vite | 6.x | Build tool & dev server |
| TanStack Table | 8.x | Tabel aplikasi dengan sort/filter |
| Lucide React | latest | Ikon |
| Sonner | latest | Toast notifications |

### Backend (Rust)

| Crate | Versi | Fungsi |
|-------|-------|--------|
| tauri | 2.x | Desktop framework |
| tauri-plugin-shell | 2.x | Eksekusi ADB commands |
| serde | 1.x | Serialisasi JSON |
| serde_json | 1.x | Parsing JSON |
| reqwest | 0.12.x | HTTP client untuk AI API |
| tokio | 1.x | Async runtime |
| rusqlite | 0.31.x | Database log/riwayat |

### AI Integration

| Item | Nilai |
|------|-------|
| Provider | OpenAI-compatible (ZevaiRouter) |
| Endpoint | User-configurable (Base URL + API Key + Model) |
| Fitur | Batch analysis 50 apps/call, per-app analysis, auto-tag unknown |
| Fallback | Offline safety tags via static JSON |

### System Dependencies

| Package | Fungsi |
|---------|--------|
| adb (android-tools-adb) | Komunikasi dengan perangkat Android |
| libwebkit2gtk-4.1-dev | WebView untuk Tauri |
| libgtk-3-dev | GTK untuk Tauri window |

## Arsitektur

```
┌─────────────────────────────────────────────────┐
│                  Tauri Window                    │
│  ┌───────────────────────────────────────────┐  │
│  │            React Frontend                  │  │
│  │  ┌─────────┐ ┌──────────┐ ┌───────────┐  │  │
│  │  │ App List │ │ AI Panel │ │ Settings   │  │  │
│  │  │ (Tabs)   │ │ (Batch +  │ │ (API Key,  │  │  │
│  │  │          │ │  Chat)    │ │  Theme)    │  │  │
│  │  └─────────┘ └──────────┘ └───────────┘  │  │
│  │  ┌──────────────────────────────────────┐ │  │
│  │  │         Log Panel (bottom)            │ │  │
│  │  └──────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────┐  │
│  │            Rust Backend                    │  │
│  │  ┌────────┐ ┌────────┐ ┌───────────────┐ │  │
│  │  │ ADB    │ │ AI     │ │ Device Info   │ │  │
│  │  │ Module │ │ Module │ │ Module         │ │  │
│  │  └────────┘ └────────┘ └───────────────┘ │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### Alur Data

1. **Scan Device** → `adb devices` → parse output → return device list
2. **List Apps** → `adb shell pm list packages` → parse → enrich dengan safety tags + AI
3. **Operasi App** → `adb shell pm uninstall/disable/enable` → capture output → log
4. **AI Analysis** → batch 50 package names → POST ke OpenAI API → parse response → update safety tags

### Tauri Commands (Rust → Frontend)

```
scan_devices() -> Vec<Device>
list_apps(device_id: String) -> Vec<AppInfo>
uninstall_package(device_id: String, package: String) -> CommandResult
disable_package(device_id: String, package: String) -> CommandResult
enable_package(device_id: String, package: String) -> CommandResult
force_stop_package(device_id: String, package: String) -> CommandResult
clear_app_data(device_id: String, package: String) -> CommandResult
get_device_info(device_id: String) -> DeviceInfo
analyze_apps_batch(packages: Vec<String>) -> Vec<SafetyAnalysis>
chat_with_ai(message: String, context: String) -> String
get_app_size(device_id: String, package: String) -> String
test_ai_connection(base_url: String, api_key: String, model: String) -> ConnectionTest
save_settings(settings: AppSettings) -> ()
load_settings() -> AppSettings
```

## Fitur dengan Kriteria Penerimaan

### Tier 1 — Core (WAJIB)

| # | Fitur | Kriteria Penerimaan |
|---|-------|-------------------|
| 1 | **Deteksi Perangkat** | Tampilkan semua device ADB (USB + wireless). Status connected/disconnected real-time. Refresh manual + auto-detect. |
| 2 | **Daftar Aplikasi** | Tabs: Semua / System / User / Disabled / Running. Sort ASC/DESC per kolom. Sticky header. Loading skeleton. |
| 3 | **Operasi Aplikasi** | Uninstall, Disable, Enable, Force Stop, Clear Data+Cache. Konfirmasi sebelum eksekusi. Progress indicator. |
| 4 | **Search + Filter** | Search real-time dengan clear button (X). Filter lanjutan: safety level, package name pattern, ukuran. Redo button untuk reset. |
| 5 | **Klasifikasi Keamanan** | 4 level: 🟢 Safe, 🟡 Risky, 🔴 Critical, ⚪ Unknown. Unknown → auto-process AI. Tag berbasis JSON statis + AI fallback. |
| 6 | **AI Batch Analysis** | Kirim max 50 package names per API call. Token optimization: kirim nama package saja, bukan metadata lengkap. 24x lebih cepat dari per-app. |

### Tier 2 — Killer Features

| # | Fitur | Kriteria Penerimaan |
|---|-------|-------------------|
| 7 | **Debloat Presets** | Preset per brand: Xiaomi/POCO/Redmi, Samsung, OPPO/Realme, Vivo, Infinix, Tecno, itel, Generic AOSP. Centang pilih package, execute batch. |
| 8 | **Undo/Restore** | Per-session RAM only. Tutup app = hilang. Reinstall package yang baru saja di-uninstall. |
| 9 | **App Size Info** | Tampilkan ukuran APK + data tiap aplikasi. Sorting by size. |
| 10 | **Chat Bot AI** | Side panel chat. Natural language → command execution. Session-based context. Toggle on/off. |

### Tier 3 — UI/UX

| # | Fitur | Kriteria Penerimaan |
|---|-------|-------------------|
| 11 | **Search Clear X** | Tombol X di search bar untuk clear input + reset filter. |
| 12 | **Sticky Header** | Header tabel tetap di atas saat scroll. |
| 13 | **Toast Notifikasi** | Sonner toast untuk sukses/gagal/progress. Stackable, dismissible. |
| 14 | **Log/Riwayat** | Panel collapsible di bawah. ADB command, output, timing, error detail, AI response. Color-coded. Filter by level. Copy & clear. |
| 15 | **Dark/Light Theme** | Default dark. Toggle di settings. Color palette: Primary #3B82F6, Success #22C55E, Warning #F59E0B, Danger #EF4444, BG Dark #0F172A. |

### Tier 4 — Utils

| # | Fitur | Kriteria Penerimaan |
|---|-------|-------------------|
| 16 | **Info Perangkat** | Model, manufacturer, Android version, SDK level, battery, storage, RAM. |
| 17 | **Detail Package Modal** | Klik app → modal: package name, version, size, install date, safety tag, AI insight. |
| 18 | **Pengaturan AI** | Base URL + API Key + Model + Test Connection + bahasa (ID/EN) + system prompt. |

## Prinsip Desain

1. **Offline-first** — Semua operasi ADB tetap berfungsi tanpa AI. AI adalah enhancement, bukan dependency.
2. **Safety by default** — Konfirmasi sebelum uninstall/disable. Highlight merah untuk package critical.
3. **Batch efficiency** — AI analysis dalam batch 50 apps, bukan per-app. Hemat token 60%.
4. **Transparency** — Semua command ADB + output ditampilkan di log panel. Tidak ada operasi tersembunyi.
5. **Responsive feedback** — Setiap aksi memberikan feedback visual (toast, spinner, progress).
6. **Bahasa Indonesia** — Default UI Bahasa Indonesia, opsi English.

## Kriteria Keberhasilan

- [ ] Aplikasi mendeteksi device ADB dalam <3 detik
- [ ] List 200+ aplikasi dalam <5 detik
- [ ] AI batch analysis 50 apps dalam <30 detik
- [ ] Uninstall/disable/enable operasi <5 detik
- [ ] Build .deb (<10MB) + .AppImage (<100MB)
- [ ] Desktop shortcut otomatis terpasang
- [ ] Semua 18 fitur berfungsi tanpa error

## Catatan

- Repo existing: github.com/4ntiDandruff/adb-uninstaller — backup v1 ke branch `v1-archive` sebelum overwrite master.
- ADB harus terinstall di sistem. Aplikasi mengecek keberadaan `adb` saat startup.
- AI endpoint ZevaiRouter: http://43.163.100.241:1997/v1 (WAJIB /v1 suffix).
- Preset debloat diperbarui secara berkala via update JSON dari repo.
- Semua error menggunakan kode [ADB-XXXX] untuk memudahkan debugging ke Hermes.
