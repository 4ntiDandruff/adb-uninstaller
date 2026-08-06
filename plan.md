# ADB Uninstaller — Full Rebuild Blueprint (plan.md)

> **Dokumen ini adalah prompt lengkap untuk AI LLM agar bisa membangun ulang aplikasi ADB Uninstaller dari nol.**
> Dibuat oleh: Hizam Nahari — Megapass Intra Solusindo, Sidoarjo
> Versi referensi: v2.2.4 | Stack: Tauri v2 + React 19 + Rust | Target: Linux desktop

---

## IDENTITAS PROYEK

- **Nama**: ADB Uninstaller
- **Pembuat**: Hizam Nahari — Megapass Intra Solusindo, Sidoarjo (teknisi servis HP)
- **Tujuan**: Desktop app Linux untuk debloat HP Android via ADB. Dipakai teknisi servis HP sehari-hari.
- **Tagline**: "Debloat Android tanpa ribet"
- **Repo**: https://github.com/4ntiDandruff/adb-uninstaller
- **Lisensi**: Private
- **Bahasa default**: Bahasa Indonesia (bilingual ID/EN)

---

## TECH STACK (WAJIB PERSIS)

| Layer | Teknologi | Versi |
|-------|-----------|-------|
| Framework desktop | Tauri v2 | 2.11.x |
| Frontend | React 19 + TypeScript 5.8 | |
| Bundler | Vite 7 | |
| CSS | Tailwind CSS 4 + custom CSS vars | |
| Icons | lucide-react | |
| Toast | sonner | |
| Backend | Rust (stable) | |
| HTTP client | reqwest 0.12 (rustls-tls) | |
| Database | rusqlite 0.31 (bundled SQLite) | |
| Async | tokio (full) | |
| Serialization | serde + serde_json | |
| File paths | dirs 5 | |
| Date | chrono 0.4 | |
| Tauri plugins | opener, shell, dialog, fs | |

### Config Kunci
- `vite.config.ts`: **`base: "./"` WAJIB** (tanpa ini CSS/JS tidak load di Tauri production build)
- `tauri.conf.json`: **`"csp": null`** (CSP ketat memblokir style di WebView production)
- `frontendDist`: `"../dist"`
- `devUrl`: `"http://localhost:1420"`
- SQLite: WAL mode + `synchronous=NORMAL`
- Settings file: `~/.config/adb-uninstaller/settings.json` (atomic write, unix 0600)
- Cache DB: `~/.config/adb-uninstaller/cache.db`

---

## ARSITEKTUR

```
┌──────────────────────────────────────────────┐
│                 TAURI SHELL                  │
│  ┌────────────────────┬───────────────────┐  │
│  │   React Frontend   │   Rust Backend    │  │
│  │                    │                   │  │
│  │  App.tsx (orkestra) │  lib.rs (22 cmd)  │  │
│  │  11 komponen       │  adb.rs (ADB ops) │  │
│  │  api.ts (invoke)   │  ai.rs (LLM API)  │  │
│  │  i18n.ts (ID/EN)   │  db.rs (SQLite)   │  │
│  │  safety-tags.ts    │                   │  │
│  └────────┬───────────┴────────┬──────────┘  │
│           │  invoke()          │              │
│           └────────────────────┘              │
│                    │                         │
│              ADB (USB/WiFi)                  │
│              AI API (OpenAI-compat)          │
│              SQLite (lokal)                  │
└──────────────────────────────────────────────┘
```

---

## STRUKTUR FILE

```
adb-uninstaller/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── src/
│   ├── App.tsx                 # 923 baris — komponen utama, semua state + logic
│   ├── index.css               # 899 baris — SEMUA styling (CSS custom properties)
│   ├── types.ts                # 91 baris — semua interface/type
│   ├── i18n.ts                 # 216 baris — terjemahan ID/EN
│   ├── errorMessages.ts        # 54 baris — mapping kode error → pesan manusia
│   ├── components/
│   │   ├── api.ts              # 64 baris — wrapper invoke() ke Tauri
│   │   ├── Sidebar.tsx         # 162 baris
│   │   ├── AppTable.tsx        # 221 baris
│   │   ├── DetailPanel.tsx     # 116 baris
│   │   ├── AIChat.tsx          # 160 baris
│   │   ├── SearchBar.tsx       # 37 baris
│   │   ├── SettingsDialog.tsx  # 153 baris
│   │   ├── ChangelogDialog.tsx # 202 baris
│   │   ├── ConfirmDialog.tsx   # 62 baris
│   │   ├── DebloatPresets.tsx  # 68 baris
│   │   └── LogDrawer.tsx       # 98 baris
│   └── lib/
│       ├── safety-tags.ts      # 145 baris — 82 hardcoded safety mapping
│       ├── presets-data.ts     # 60 baris — 6 preset debloat per brand
│       ├── presets-types.ts    # 4 baris
│       └── exportPreset.ts     # 60 baris — export JSON via dialog
├── src-tauri/
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── src/
│       ├── main.rs             # 5 baris — entry point
│       ├── lib.rs              # 245 baris — 22 tauri commands + run()
│       ├── adb.rs              # 724 baris — semua operasi ADB
│       ├── ai.rs               # 568 baris — AI/LLM integration
│       └── db.rs               # 261 baris — SQLite cache
```

---

## FITUR LENGKAP (WAJIB SEMUA ADA)

### A. Core ADB
1. **Deteksi device** USB + WiFi via `adb devices -l`, auto-select kalau cuma 1
2. **List apps** dari device: parse `pm list packages -f` + `-s` (system) + `-d` (disabled) + `dumpsys activity processes` (running)
3. **5 tab filter**: Semua / System / User / Disabled / Running
4. **Sort** ascending/descending: label, safety, size (size sort NUMERIC, bukan string)
5. **Search** dengan debounce 200ms + tombol clear
6. **Sticky table header**
7. **Kolom**: checkbox | label (nama readable) + package name subtitle | safety badge | type | status | size
8. **Detail panel** kanan: info package + 5 tombol aksi + copy package name
9. **Batch actions**: Uninstall, Disable, Enable, Force Stop, Clear Data (dengan confirmation dialog)
10. **Undo** restore: uninstall → `cmd package install-existing`, disable → `pm enable`
11. **Atur waktu layar mati**: dialog preset (1m/5m/10m/30m/60m/Selamanya), via `settings put system screen_off_timeout`
12. **Device info**: model (nama pasar, bukan kode), kode model, chipset, Android/SDK, battery, storage, RAM
13. **Critical block**: package critical TIDAK BOLEH di-uninstall/disable (ditolak di frontend)

### B. Keamanan & Safety Classification
1. **4 level**: safe / risky / critical / unknown
2. **Static offline tags**: 82 hardcoded mapping (Android core, Google, Xiaomi, Samsung, OPPO, Vivo bloatware)
3. **Fallback logic**: `com.android.*` → risky, contains `analytics/adservices` → safe, sisanya → unknown
4. **Auto AI batch**: semua package unknown langsung dianalisa AI (batch 50/call, loop sampai habis)
5. **AI result disimpan ke SQLite cache** — reconnect device → load instant
6. **Cross-device verdict inheritance**: package yang sudah dianalisa di HP A langsung diwarisi HP B
7. **Sanitize AI response**: filter hallucinated packages, deduplicate, normalize level casing
8. **AI app_name**: prompt minta nama asli app (com.whatsapp → WhatsApp), disimpan sebagai label

### C. AI Integration
1. **Provider**: OpenAI-compatible API (Z‍evaiRouter / lokal / OpenAI / apapun)
2. **Default**: `http://43.163.100.241:1997/v1`, model `kr/claude-haiku-4.5`
3. **Settings**: base URL, API key, model, system prompt, temperature (0.3), max tokens (4096)
4. **Test koneksi**: GET /models + POST /chat/completions dengan "ping"
5. **Analyze batch**: kirim package names → dapat JSON array SafetyAnalysis
6. **Analyze device**: AI brief teknisi format bullet (SPEK / ISU KHAS SERVIS / TIPS)
7. **Chat**: floating window, draggable (mouse + touch), minimize, clear history, conversation history lengkap
8. **SSE handling**: strip SSE `data:` lines, merge delta chunks
9. **Normalize base URL**: auto-append `/v1` kalau belum ada path

### D. UI/UX
1. **Layout**: grid 264px sidebar + 1fr main
2. **Dark mode default** + light mode toggle
3. **Bilingual**: Bahasa Indonesia / English — SEMUA label ikut berubah termasuk safety reason
4. **Custom confirmation dialog** (bukan window.confirm browser)
5. **Empty state**: tombol "Scan Device" langsung di tabel
6. **Progress bar** scan (persen + status message) via Tauri event
7. **Toast notification** (sonner, bottom-right)
8. **Log drawer**: collapsible, filter level, auto-scroll, export .txt
9. **AI Chat floating**: position bottom-right, draggable, minimizable
10. **Skeleton loading** per kolom saat scan
11. **Error message manusiawi**: kode teknis → bahasa teknisi Indonesia

### E. Data & Cache
1. **SQLite WAL mode** di `~/.config/adb-uninstaller/cache.db`
2. **Schema**: 1 tabel `app_cache` (package_name, label, is_system, is_disabled, safety_level, safety_reason, size, version, device_id, scanned_at) + UNIQUE(package_name, device_id) + index device_id
3. **Cache merge logic**: scan baru → merge dengan cache lama → preserve AI label/safety/size yang sudah ada → save kembali
4. **Cross-device inheritance**: package unknown di device baru cek apakah sudah ada verdict di device lain
5. **Export preset**: JSON file via Tauri dialog, fallback browser download
6. **6 preset debloat bawaan**: Xiaomi, Samsung, OPPO/Realme, Vivo, Generic, Infinix

---

## TYPESCRIPT INTERFACES (types.ts)

```typescript
type DeviceStatus = "online" | "offline" | "unauthorized"
type Transport = "usb" | "wireless"
type SafetyLevel = "safe" | "risky" | "critical" | "unknown"

interface Device { id: string; model: string; status: DeviceStatus | string; transport: Transport | string }
interface AppInfo { package_name: string; label: string; is_system: boolean; is_disabled: boolean; is_running: boolean; safety_level: SafetyLevel | string; safety_reason: string; size: string; version: string }
interface CommandResult { success: boolean; output: string; error: string | null; duration_ms: number }
interface DeviceInfo { model: string; market_name: string; model_code: string; chipset: string; manufacturer: string; android_version: string; sdk_level: string; battery_level: number; storage_total: string; storage_free: string; ram_total: string }
interface SafetyAnalysis { package_name: string; app_name: string; level: SafetyLevel | string; reason: string; can_remove: boolean }
interface ConnectionTest { success: boolean; message: string; models: string[] }
interface AppSettings { ai_base_url: string; ai_api_key: string; ai_model: string; ai_system_prompt: string; language: "id" | "en"; theme: "dark" | "light"; temperature: number; max_tokens: number }
interface CachedApp { package_name: string; label: string; is_system: boolean; is_disabled: boolean; safety_level: string; safety_reason: string; size: string; version: string; device_id: string; scanned_at: string }
interface LogEntry { id: string; ts: string; level: "info" | "success" | "warn" | "error"; source: "adb" | "ai" | "ui" | "system" | "cache"; message: string; detail?: string; duration_ms?: number }
```

---

## API LAYER (22 Tauri Commands)

Frontend `invoke()` → Rust `#[tauri::command]`:

| Frontend (api.ts) | Tauri Command | Modul Rust | Return |
|-------------------|---------------|------------|--------|
| `checkAdb()` | `check_adb_available` | adb | `bool` |
| `scanDevices()` | `scan_devices` | adb + emit scan-progress | `Vec<Device>` |
| `getDeviceInfo(deviceId)` | `get_device_info` | adb | `DeviceInfo` |
| `listApps(deviceId)` | `list_apps` | adb + db merge | `Vec<AppInfo>` |
| `getAppSize(deviceId, pkg)` | `get_app_size` | adb | `String` |
| `uninstall(deviceId, pkg)` | `uninstall_package` | adb | `CommandResult` |
| `disable(deviceId, pkg)` | `disable_package` | adb | `CommandResult` |
| `enable(deviceId, pkg)` | `enable_package` | adb | `CommandResult` |
| `restore(deviceId, pkg)` | `restore_package` | adb | `CommandResult` |
| `forceStop(deviceId, pkg)` | `force_stop_package` | adb | `CommandResult` |
| `clearData(deviceId, pkg)` | `clear_app_data` | adb | `CommandResult` |
| `getScreenTimeout(deviceId)` | `get_screen_timeout` | adb | `i64` |
| `setScreenTimeout(deviceId, ms)` | `set_screen_timeout` | adb | `CommandResult` |
| `analyzeBatch(packages)` | `analyze_apps_batch` | ai | `Vec<SafetyAnalysis>` |
| `chat(messages, context)` | `chat_with_ai` | ai | `String` |
| `analyzeDevice(model, chipset, android)` | `analyze_device` | ai | `String` |
| `loadSettings()` | `load_settings` | ai | `AppSettings` |
| `saveSettings(settings)` | `save_settings` | ai | `()` |
| `getCachedApps(deviceId)` | `get_cached_apps` | db | `Vec<CachedApp>` |
| `getLastScanTime(deviceId)` | `get_last_scan_time` | db | `Option<String>` |
| `clearDeviceCache(deviceId)` | `clear_device_cache` | db | `usize` |
| `saveAiResults(deviceId, results)` | `save_ai_results` | db | `usize` |
| `saveAppSize(deviceId, pkg, size)` | `save_app_size` | db | `usize` |

---

## AI SYSTEM PROMPTS

### 1. Batch Safety Analysis (`analyze_apps_batch`)
```
Kamu analis keamanan paket Android untuk teknisi servis HP Indonesia.
Brand umum: Xiaomi/Redmi, Samsung, OPPO, Vivo, Realme, Infinix.

Untuk SETIAP package, kembalikan JSON object dengan keys:
- package_name: nama package
- app_name: nama yang tampil di HP (contoh: com.whatsapp → WhatsApp, com.miui.home → Launcher MIUI)
- level: salah satu dari [safe, risky, critical, unknown]
- reason: alasan singkat, maks 5 kata
- can_remove: boolean

Definisi level:
- critical: sistem crash/bootloop jika dihapus (launcher, settings, framework, telephony, packageinstaller, SystemUI)
- risky: HP tetap jalan tapi fitur penting hilang (camera, keyboard, NFC, SIM manager, GMS core)
- safe: bloatware/app pihak ketiga/game bawaan, aman dihapus
- unknown: package tidak dikenali

Contoh output:
[{"package_name":"com.miui.cleanmaster","app_name":"Cleaner","level":"safe","reason":"Bloatware pembersih bawaan","can_remove":true}]

Kembalikan HANYA JSON array valid, tanpa markdown.
```
+ Lang suffix: "Tulis field reason dalam Bahasa Indonesia" / "Write reason in English"

### 2. Device Analysis (`analyze_device`)
```
You are a phone repair technician assistant for Indonesian service shops.
Common brands: Xiaomi, Samsung, OPPO, Vivo, Realme, Infinix — mostly budget-midrange.
Output format: SPEK / ISU KHAS SERVIS / TIPS (bullet • , maks 12 kata/poin, maks 2 poin/section)
```

### 3. Chat (`chat_with_ai`) — default/fallback
```
Kamu asisten ADB untuk teknisi servis HP Indonesia. Spesialisasi: debloat Android, analisa package, troubleshooting HP. Jawab dalam Bahasa Indonesia kecuali diminta bahasa lain. Singkat dan praktis.
```

---

## CSS DESIGN SYSTEM

### Dark Theme (default):
```css
--bg: #0b1220    --bg-panel: #0f172a    --bg-card: #131c31    --bg-hover: #1b2742
--border: #1f2b47    --border-strong: #2c3a5e
--text: #e6edf7    --text-dim: #8fa0bd    --text-faint: #6b7d9e
--primary: #3b82f6    --primary-hover: #2f6fe0
--success: #22c55e    --warning: #f59e0b    --danger: #ef4444
```

### Light Theme (`[data-theme="light"]`):
```css
--bg: #f6f8fa    --bg-panel: #ffffff    --bg-card: #f0f3f6    --bg-hover: #e2e8f0
--border: #c9d1d9    --border-strong: #6e7781
--text: #1f2328    --text-dim: #424a53    --text-faint: #57606a
--primary: #0969da    --primary-hover: #0550ae
--success: #1a7f37    --warning: #9a6700    --danger: #cf222e
```

### Class Utama:
- **Layout**: `.app-shell` (grid 264px+1fr), `.sidebar`, `.main`, `.workbench`, `.content`, `.detail-panel`
- **Sidebar**: `.brand`, `.brand-logo` (gradient bg, huruf "A"), `.side-section`, `.side-label`, `.stat-bars`
- **Topbar**: `.topbar`, `.topbar-title`, `.topbar-group`, `.topbar-sep`
- **Buttons**: `.btn`, `.btn-primary/danger/success/ghost`, `.btn-sm`, `.btn-icon`
- **Table**: `.table-scroll`, `table.app-table`, sticky thead, `.cell-check`, `.badge-safe/risky/critical/unknown`
- **Modal**: `.modal-overlay` (backdrop blur), `.modal`, `.modal-head/title/body/foot`, `.field`, `.field-label`
- **AI Chat**: `.ai-float` (fixed, 380x520, draggable), `.ai-float.minimized`, `.ai-bubble.user/assistant`
- **Progress**: `.progress-container`, `.progress-bar`, `.progress-fill` (gradient animation)
- **Utility**: `.skeleton` (shimmer), `.empty`, `.text-dim/faint/success/warning/danger`

---

## RUST BACKEND DETAIL

### adb.rs — Semua ADB Command
- **Timeout**: semua ADB command 30 detik via `tokio::time::timeout`
- **`run_adb(args)`**: spawn `adb` process, capture stdout+stderr
- **`run_adb_device(device_id, args)`**: prepend `-s device_id`
- **`pretty_label(package)`**: ekstrak segment deskriptif dari package name. Generic words (browser, launcher, player, service, app, android, system, ui, dll) di-skip, ambil segment sebelumnya. Compound word detection (globalbrowser → generic). Capitalize + replace `_`/`-` → spasi.
- **`scan_devices`**: parse `adb devices -l`, extract model dari `model:xxx`
- **`get_device_info`**: 10+ `getprop` calls (ro.product.model, marketname, manufacturer, chipset/soc/board, android version, SDK). Battery via `dumpsys battery`. Storage via `df /data`. RAM via `/proc/meminfo`.
- **`list_apps`**: 4 ADB calls (pm list packages -f, -s, -d, dumpsys activity processes). Merge cache. Pretty label.
- **`merge_and_save_cache`**: sync function (MutexGuard not Send across await). Load cache → merge safety/label/size → save → cross-device inherit.

### ai.rs — AI/LLM Client
- **OpenAI-compatible**: POST /chat/completions
- **SSE stripping**: handle `data: {...}\ndata: [DONE]` format, merge delta chunks
- **Sanitize**: filter hallucinated packages (not in input list), deduplicate (keep first), normalize level
- **Settings**: atomic file write (tmp → rename), unix 0600
- **Normalize base URL**: auto-append `/v1` kalau URL polos

### db.rs — SQLite Cache
- **WAL mode** + synchronous=NORMAL
- **save_apps**: INSERT OR REPLACE dengan merge logic — preserve existing AI data, cross-device inheritance
- **batch_update_safety**: transaction-wrapped, normalize level casing, update label jika app_name tidak kosong

---

## GOTCHA & BUG YANG SUDAH DIPERBAIKI (JANGAN ULANGI)

1. **`vite.config.ts base: "./"`** — WAJIB, tanpa ini asset tidak load di Tauri production build
2. **`tauri.conf.json csp: null`** — WAJIB, CSP ketat blokir CSS di WebView
3. **MutexGuard not Send across await** — cache merge HARUS sync function, bukan async
4. **React setState async** — bangun chat history SEBELUM panggil API (jangan andalkan state terbaru)
5. **`await loadApps()`** di runBatchOp/runOp/undoLast — tanpa await, busy spinner hilang sebelum tabel refresh
6. **SQLite double-open** — JANGAN buka Connection baru di dalam command, pakai managed DbState
7. **AI halusinasi** — filter response: hanya terima package yang memang dikirim, buang sisanya
8. **Sort size numeric** — parse "1.2 MB" ke bytes, jangan string comparison
9. **Cross-device scan race** — pakai loadRequestRef counter, buang result dari request lama
10. **Undo disable** — pakai `pm enable`, bukan `install-existing`
11. **AI SSE** — beberapa router kirim streaming SSE walau `stream: false`, handle kedua format
12. **Generic label** — `com.brave.browser` harus jadi "Brave" bukan "Browser"

---

## FITUR YANG BELUM ADA (BACKLOG)

1. **About Me dialog** — dialog "Tentang" dengan info pembuat (Hizam Nahari, Megapass Sidoarjo, tech stack, link GitHub)
2. **Windows support** — saat ini Linux only
3. **Auto-update** — belum ada mekanisme update otomatis
4. **Import preset** — hanya export, belum bisa import dari file JSON

---

## INSTRUKSI BUILD

```bash
# Prerequisites
sudo apt install -y android-tools-adb libwebkit2gtk-4.1-dev libayatana-appindicator3-dev librsvg2-dev
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Clone & build
git clone https://github.com/4ntiDandruff/adb-uninstaller.git
cd adb-uninstaller
npm install
npm run build              # frontend → dist/
cd src-tauri
cargo build --release      # binary → target/release/adb-uninstaller

# Atau pakai Tauri CLI (build + bundle .deb + .AppImage)
cd ..
npm run tauri build
```

### Desktop Shortcut
```ini
[Desktop Entry]
Type=Application
Name=ADB Uninstaller
Comment=Debloat & atur Android via ADB
Exec=/path/to/target/release/adb-uninstaller
Icon=/path/to/src-tauri/icons/128x128.png
Terminal=false
Categories=Utility;Development;
```

---

## VERIFIKASI SETELAH BUILD

```bash
npx tsc --noEmit           # 0 TypeScript errors
npm run build              # Vite build sukses
cd src-tauri
cargo check                # 0 Rust errors
cargo test                 # semua test pass
cargo build --release      # binary production

# Test manual:
# 1. Buka app dari desktop shortcut
# 2. Colok HP Android + USB debugging ON
# 3. Device terdeteksi otomatis
# 4. List apps muncul + auto AI analyze
# 5. Coba uninstall/disable bloatware
# 6. Coba AI Chat
# 7. Coba ganti bahasa ID ↔ EN
# 8. Coba dark ↔ light theme
```

---

**Catatan**: Dokumen ini cukup lengkap untuk rebuild 100% app dari nol. Semua interface, API contract, prompt AI, CSS design system, dan gotcha sudah dicatat. AI yang membaca ini harus bisa menghasilkan app yang identik secara fungsional.
