# AGENT PROMPT — ADB Uninstaller v2

> Prompt ini dibaca oleh agent AI (Claude/Gemini) di sesi baru untuk melanjutkan development ADB Uninstaller v2.

## Setup Environment

```bash
export PATH="$HOME/.cargo/bin:$PATH"
cd ~/proyek/adb-uninstaller
```

## Aturan Dasar

1. **BAHASA**: Selalu gunakan Bahasa Indonesia untuk komunikasi dengan user. Code dan comment dalam Bahasa Inggris.
2. **VERIFIKASI**: Jangan pernah klaim fitur "done" tanpa verifikasi — cek file, cek build, cek binary.
3. **PLAN FIRST**: Baca `PLAN.md` sebelum mulai coding. PLAN.md adalah source of truth.
4. **COMMIT PER FITUR**: Satu commit per fitur yang selesai dan terverifikasi.
5. **ERROR CODE**: Semua error menggunakan format `[ADB-XXXX]` untuk memudahkan debugging.
6. **FOLDER KERJA**: `/home/hizam/proyek/adb-uninstaller/` (node hizam).

## Stack

- **Backend**: Tauri v2 (Rust) — semua ADB commands + AI HTTP calls
- **Frontend**: React 18 + TypeScript + Tailwind CSS 4 + shadcn/ui + Vite
- **AI**: OpenAI-compatible API (ZevaiRouter default: `http://43.163.100.241:1997/v1`)
- **Build Target**: `.deb` + `.AppImage` untuk Linux (Kubuntu)

## Struktur Proyek

```
adb-uninstaller/
├── src-tauri/          # Rust backend
│   ├── src/
│   │   ├── main.rs     # Entry point, Tauri setup
│   │   ├── lib.rs      # Command registration
│   │   ├── adb.rs      # ADB command execution
│   │   ├── ai.rs       # AI API integration
│   │   ├── device.rs   # Device info parsing
│   │   ├── presets.rs  # Debloat presets
│   │   └── db.rs       # SQLite log/history
│   ├── Cargo.toml
│   └── tauri.conf.json
├── src/                # React frontend
│   ├── components/
│   │   ├── ui/         # shadcn/ui components
│   │   ├── AppList.tsx
│   │   ├── AppTable.tsx
│   │   ├── SearchBar.tsx
│   │   ├── DeviceSelector.tsx
│   │   ├── AIPanel.tsx
│   │   ├── LogPanel.tsx
│   │   ├── SettingsDialog.tsx
│   │   ├── DebloatPresets.tsx
│   │   ├── PackageDetail.tsx
│   │   └── DeviceInfo.tsx
│   ├── hooks/
│   │   ├── useADB.ts
│   │   ├── useAI.ts
│   │   └── useSettings.ts
│   ├── lib/
│   │   ├── safety-tags.ts   # Static safety classification
│   │   └── presets-data.ts  # Debloat presets per brand
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── PLAN.md
```

## Tauri Commands (API Contract)

Semua command dipanggil dari frontend via `@tauri-apps/api/core`:

```typescript
// Device
invoke('scan_devices'): Promise<Device[]>
invoke('get_device_info', { deviceId: string }): Promise<DeviceInfo>

// Apps
invoke('list_apps', { deviceId: string }): Promise<AppInfo[]>
invoke('get_app_size', { deviceId: string, package: string }): Promise<string>

// Operations
invoke('uninstall_package', { deviceId: string, package: string }): Promise<CommandResult>
invoke('disable_package', { deviceId: string, package: string }): Promise<CommandResult>
invoke('enable_package', { deviceId: string, package: string }): Promise<CommandResult>
invoke('force_stop_package', { deviceId: string, package: string }): Promise<CommandResult>
invoke('clear_app_data', { deviceId: string, package: string }): Promise<CommandResult>

// AI
invoke('analyze_apps_batch', { packages: string[] }): Promise<SafetyAnalysis[]>
invoke('chat_with_ai', { message: string, context: string }): Promise<string>
invoke('test_ai_connection', { baseUrl: string, apiKey: string, model: string }): Promise<ConnectionTest>

// Settings
invoke('save_settings', { settings: AppSettings }): Promise<void>
invoke('load_settings'): Promise<AppSettings>
```

## Data Types

```typescript
interface Device {
  id: string;           // serial number
  model: string;        // device model
  status: 'online' | 'offline' | 'unauthorized';
  transport: 'usb' | 'wireless';
}

interface AppInfo {
  package_name: string;
  label: string;        // human-readable app name
  is_system: boolean;
  is_disabled: boolean;
  is_running: boolean;
  safety_level: 'safe' | 'risky' | 'critical' | 'unknown';
  safety_reason: string;
  size: string;         // formatted: "12.5 MB"
  version: string;
}

interface CommandResult {
  success: boolean;
  output: string;
  error: string | null;
  duration_ms: number;
}

interface DeviceInfo {
  model: string;
  manufacturer: string;
  android_version: string;
  sdk_level: number;
  battery_level: number;
  storage_total: string;
  storage_free: string;
  ram_total: string;
}

interface SafetyAnalysis {
  package_name: string;
  level: 'safe' | 'risky' | 'critical' | 'unknown';
  reason: string;
  can_remove: boolean;
}

interface ConnectionTest {
  success: boolean;
  message: string;
  models: string[];     // available models
}

interface AppSettings {
  ai_base_url: string;
  ai_api_key: string;
  ai_model: string;
  ai_system_prompt: string;
  language: 'id' | 'en';
  theme: 'dark' | 'light';
  temperature: number;
  max_tokens: number;
}
```

## AI Integration Detail

### Batch Analysis
```
POST {base_url}/chat/completions
Headers: Authorization: Bearer <api_key>
Body: {
  model: "{model}",
  messages: [{
    role: "system",
    content: "Analyze these Android package names. For each, return safety level (safe/risky/critical), reason, and whether it's safe to remove. Format: JSON array."
  }, {
    role: "user",
    content: "[{50 package names as JSON array}]"
  }],
  temperature: 0.3,
  max_tokens: 4096
}
```

### Safety Tags (Static Fallback)
File: `src/lib/safety-tags.ts` — JSON statis 500+ package names dengan klasifikasi manual. AI hanya dipanggil untuk package yang tidak ada di static list (unknown).

## Theme Colors

```css
:root {
  --primary: #3B82F6;
  --success: #22C55E;
  --warning: #F59E0B;
  --danger: #EF4444;
  --bg-dark: #0F172A;
  --bg-card: #1E293B;
  --text-primary: #F8FAFC;
  --text-secondary: #94A3B8;
}
```

## Build Commands

```bash
# Development
npm run tauri dev

# Build .deb
npm run tauri build -- --bundles deb

# Build .AppImage
npm run tauri build -- --bundles appimage

# Build all
npm run tauri build
```

## Debloat Presets

Preset JSON per brand disimpan di `src/lib/presets-data.ts`. Format:
```typescript
interface DebloatPreset {
  brand: string;
  packages: { name: string; description: string; safe_to_remove: boolean }[];
}
```

Brand yang didukung: Xiaomi, POCO, Redmi, Samsung, OPPO, Realme, Vivo, Infinix, Tecno, itel, Generic AOSP.

## Checklist Verifikasi Per Fitur

Sebelum klaim fitur selesai:
1. [ ] Cek file source ada dan tidak kosong
2. [ ] Cek tidak ada error TypeScript (`npm run typecheck`)
3. [ ] Cek tidak ada error Rust (`cargo check`)
4. [ ] Cek fitur muncul di UI (deskripsikan apa yang terlihat)
5. [ ] Cek fitur berfungsi (deskripsikan hasil test)

## Catatan Penting

- **JANGAN PERNAH** klaim selesai tanpa verifikasi. Ini penyebab kegagalan sesi sebelumnya.
- ADB harus di-install user. Aplikasi cek dan tampilkan warning jika tidak ada.
- AI endpoint WAJIB pakai `/v1` suffix (ZevaiRouter requirement).
- Log panel mencatat SEMUA: command ADB, output, timing, error, AI response.
- Error kode [ADB-XXXX] untuk memudahkan user melaporkan bug ke Hermes.
