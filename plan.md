# ADB Uninstaller v2 — Implementation Plan

> **Cross-Session Handoff Blueprint**
> Target OS: Linux only (Kubuntu) | Stack: Tauri v2 + React 19 + Tailwind v4 + shadcn/ui
> Repository: 4ntiDandruff/adb-uninstaller (overwrite master)
> Dev Node: hizam@100.125.162.127 (Node 22 / Rust toolchain ready)
> Status: FINAL SPECIFICATION - No further discussion needed.

---

## 1. Project Overview

### 1.1 Specification
- **App Name**: ADB Uninstaller - By Teknisi Megapass Sidoarjo
- **Stack**: Tauri v2 + React 19 (TypeScript) + Tailwind CSS v4 + shadcn/ui
- **Target OS**: Linux only (Kubuntu)
- **Dev Node**: `hizam@100.125.162.127`
- **Philosophy**: Single-device client tool, RAM-only undo stack, hybrid safety tag database (static lookup with local AI analysis fallback).
- **SKIP List**: Multi-device support, PDF reporting, FRP features, Root access, Select All/Deselect All buttons, and log export buttons.

---

## 2. Architecture & File Structure

### 2.1 Directory Structure
```
adb-uninstaller/
├── src/                          # React + TS Frontend
│   ├── App.tsx                   # Main Shell Layout
│   ├── components/
│   │   ├── DevicePanel.tsx       # State indicator and properties viewer
│   │   ├── AppList.tsx           # Tab layout manager (System, User, Disabled, Running)
│   │   ├── AppRow.tsx            # Row actions & safety tag badges
│   │   ├── ActionBar.tsx         # Floating batch operations bar
│   │   ├── LogPanel.tsx          # Collapsible CLI output log viewer
│   │   └── dialogs/
│   │       ├── PresetDialog.tsx  # Brand debloat preset installer
│   │       ├── SettingsDialog.tsx# API config & AI behaviour settings
│   │       └── AboutDialog.tsx   # Editable developer profile (localStorage)
│   ├── hooks/
│   │   ├── useADB.ts             # Rust bridge hook
│   │   └── useAI.ts              # z‍evairouter API fetcher
│   ├── lib/
│   │   ├── safety.ts             # Hybrid static/AI classification engine
│   │   └── utils.ts
│   └── types.ts                  # Shared data type contracts
├── src-tauri/                    # Rust Backend
│   ├── src/
│   │   ├── main.rs               # Command registry & state lifecycle
│   │   ├── adb.rs                # pm command execution & stderr wrapping
│   │   └── device.rs             # adb shell getprop parsing
│   ├── Cargo.toml
│   └── tauri.conf.json           # App bundle configs (identifier: com.megapass.adbuninstaller)
├── presets/                      # Local JSON brand preset files
│   ├── xiaomi.json
│   ├── samsung.json
│   ├── oppo-realme.json
│   ├── vivo.json
│   ├── infinix.json
│   ├── tecno.json
│   ├── itel.json
│   └── generic-aosp.json
└── data/
    └── safety-tags.json          # Static safety tags mapping (JSON database)
```

### 2.2 Data Flow
`User Action (UI) -> invoke() -> Rust Backend -> adb shell execution -> parse stdout/stderr -> UI update`
`AI Operations -> direct browser HTTP fetch -> z‍evairouter gateway -> State cache updates`

---

## 3. Feature Specifications & Acceptance Criteria

### 3.1 Device Scanner & Blocker States
- **Spec**: Executes `adb devices -l` to get connection state and serial. If connected, runs `adb shell getprop` to gather model, brand, Android version, and SDK level.
- **Multiple Devices Blocker Screen**:
  - If >1 device is detected, Rust returns an error code.
  - Frontend renders a full-screen blurred warning overlay: **"Multiple Devices Detected! Harap cabut perangkat lain dan sisakan 1 HP saja yang tercolok."**
- **Connection & Security UX States**:
  - **Disconnected State**: Shows grey icon status indicator. Main interface is locked with instruction panel: "Colok HP via USB dan aktifkan USB Debugging."
  - **Unauthorized State**: Shows flashing amber warning icon. Overlay text: "Izinkan USB Debugging di layar HP Anda. Centang 'Selalu izinkan dari komputer ini'." Includes a "Retry" scanning button.
  - **Connected State**: Green indicator lights up. Instantly triggers app list fetch.

### 3.2 App Tab List (4 Tabs)
- **Spec**: Lists packages sorted by category:
  - System: `pm list packages -s`
  - User: `pm list packages -3`
  - Disabled: `pm list packages -d`
  - Running: `ps` list cross-referenced against packages.
- **Loading UX (Skeleton Loader)**:
  - While fetching the app list, show a skeleton table rows structure using shadcn `<Skeleton />` to avoid page jumps and layout shifts.
- **App Size Retrieval**:
  - Use fast APK size query: `adb shell pm list packages -f` to get the APK installation path, then run `adb shell ls -l [apk_path]` (or `stat` fallback) to parse the byte size. Fast, light, and does not require root permissions.
- **Acceptance Criteria**:
  - Displays active tabs with real-time count: e.g., "System (128)".
  - Displays human-readable application size (e.g. 12.5 MB).
  - Shows color-coded safety badges (Green: Safe, Yellow: Risky, Red: Critical, Gray: Unknown).

### 3.3 Main Operations & Undo Stack
- **Spec**: Supports batch actions: Uninstall, Disable, Enable, Force Stop. Maintains a RAM-only undo stack inside React memory.
- **UX Batch Processing Indicator**:
  - For presets uninstall operations or batch uninstalls, display a modal progress bar showing current status (e.g., "Uninstalling com.miui.analytics... [12/28]") to keep the user informed.
- **Acceptance Criteria**:
  - Shows warning modal before Uninstall/Disable actions.
  - Reinstalls uninstalled apps using `cmd package install-existing` upon trigger of the "Undo" button.
  - Clears undo memory immediately when device is disconnected or app is closed.

### 3.4 Interactive AI Integration & Extensible Safety Tags
- **Spec**: Connects to the user-configured API key at the z‍evairouter gateway to auto-classify unknown packages.
- **Database Extensibility**:
  - Local database `safety-tags.json` is stored in the application data directory (`~/.local/share/com.megapass.adbuninstaller/safety-tags.json`).
  - When z‍evairouter AI successfully classifies an unknown app, the application appends the classification results directly into the local `safety-tags.json` file. This updates the local DB dynamically over time.
- **Acceptance Criteria**:
  - Safely falls back to Local database (no network hit) for known system apps.
  - Updates safety tag state immediately upon receiving AI classification payload.

---

## 4. UI Layout & UX Physics Specs

### 4.1 Interface Layout Physics
- **Sticky Table Headers**: Column headers for the app list grid (`[Safety] [App Name] [Package ID] [Size]`) must remain sticky at the top of the container during scrolling.
- **Dynamic Log Panel Scroll**:
  - The collapsible Log Panel at the bottom must automatically scroll to the bottom line (`scrollToBottom`) whenever a new log entry is added.
  - User scrolling up triggers temporary auto-scroll lock, clicking "Resume" or scrolling to the bottom unlocks it.
- **Action Notifications**: Every trigger execution must dispatch a shadcn Toast notification (Green for success, Red for failure with error message summary).

### 4.2 Text-Based Wireframe (Main Window Layout)
```
┌─────────────────────────────────────────────────────────┐
│ Title Bar: ADB Uninstaller (Megapass Sidoarjo) [Settings][About]│
├─────────────────────────────────────────────────────────┤
│ [Scan Device] Status: Connected (Xiaomi Redmi Note 12)  │
│ SDK: 33 | Android: 13 | Serial: abc123def               │
├─────────────────────────────────────────────────────────┤
│ [Search package...     ] [Filter: All v] [Debloat Presets]│
├────────────────────┬────────────────────────────────────┤
│ TABS:              │                                    │
│ [System] [User]    │                                    │
│ [Disabled] [Running]│                                   │
│ ┌──────────────────┴──────────────────────────────────┐ │
│ │ [🟢 Safe]     com.miui.analytics     MIUI Analytics │ │
│ │ [🔴 Critical] com.android.settings   Settings       │ │
│ │ [🟡 Risky]    com.google.android.gms Play Services  │ │
│ │ [⚪ Unknown]  com.unknown.bloat      Unknown App    │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ [Uninstall] [Disable] [Enable] [Force Stop] [Ask AI 🤖] │
├─────────────────────────────────────────────────────────┤
│ Collapsible Log Panel [Level: Info v] [Copy] [Clear] [▲]│
│ 14:30:00 [info] Executing adb shell pm uninstall...    │
│ 14:30:01 [info] Success: com.miui.analytics uninstalled│
└─────────────────────────────────────────────────────────┘
```

### 4.3 Dialog Views
```
Settings Dialog:                 About Developer Dialog:
┌─────────────────────────────┐  ┌─────────────────────────────┐
│ AI Provider Settings    [X] │  │ About Developer         [X] │
│ Base URL: [https://...]     │  │ (Saved to localStorage)     │
│ API Key:  [sk-...]          │  │ Name:    [Hizam Nahari    ] │
│ Model:    [gpt-4o-mini   v] │  │ Phone:   [08123456789     ] │
│ [Test Connection]           │  │ Address: [Sidoarjo        ] │
│                             │  │ Website: [megapass.net    ] │
│ Behaviour Settings          │  │                             │
│ [x] Auto-analyze on scan    │  │ App Version: v2.0.0         │
│ [x] Dark Mode               │  │ Tauri v2 + React 19         │
│                [Save][Close]│  │                [Save][Close]│
└─────────────────────────────┘  └─────────────────────────────┘
```

---

## 5. Debloat Presets Database (Initial Packages)

These package definitions must be written to their respective JSON files under `presets/` directory.

### 5.1 Xiaomi/POCO/Redmi (`presets/xiaomi.json`)
- `com.miui.analytics` (Label: MIUI Analytics | Category: telemetry | Safety: safe | Reason: Telemetry tracking)
- `com.miui.msa.global` (Label: MSA Ads Daemon | Category: utility | Safety: safe | Reason: Ad daemon launcher)
- `com.miui.cloudservice` (Label: Mi Cloud | Category: cloud | Safety: safe | Reason: Cloud backup tool)
- `com.xiaomi.payment` (Label: Mi Pay | Category: finance | Safety: safe | Reason: Financial services)
- `com.miui.hybrid` (Label: Quick Apps | Category: utility | Safety: safe | Reason: Unused quick-app runner)
- `com.miui.videoplayer` (Label: Mi Video | Category: entertainment | Safety: safe | Reason: Ad-heavy stock video)
- `com.miui.player` (Label: Mi Music | Category: entertainment | Safety: safe | Reason: Ad-heavy music player)
- `com.miui.bugreport` (Label: Feedback | Category: utility | Safety: safe | Reason: Unused feedback tool)
- `com.miui.daemon` (Label: MIUI Daemon | Category: telemetry | Safety: safe | Reason: Background logging tool)
- `com.xiaomi.midrop` (Label: ShareMe | Category: utility | Safety: safe | Reason: File sharing bloat)

### 5.2 Samsung (`presets/samsung.json`)
- `com.samsung.android.bixby.agent` (Label: Bixby Agent | Category: utility | Safety: safe | Reason: Unused voice assistant)
- `com.samsung.android.bixby.wakeup` (Label: Bixby Wakeup | Category: utility | Safety: safe | Reason: Background listening agent)
- `com.samsung.android.app.spage` (Label: Samsung Daily | Category: utility | Safety: safe | Reason: Side panel feed widget)
- `com.samsung.android.kidshome` (Label: Samsung Kids | Category: utility | Safety: safe | Reason: Unused kids mode wrapper)
- `com.sec.android.app.sbrowser` (Label: Samsung Internet | Category: browser | Safety: safe | Reason: Bloat browser tool)
- `com.samsung.android.game.gamehome` (Label: Game Launcher | Category: gaming | Safety: safe | Reason: Gaming dashboard bloat)
- `com.samsung.android.mateagent` (Label: Samsung Mate Agent | Category: telemetry | Safety: safe | Reason: Background diagnostic agent)
- `com.sec.android.easyMover.Agent` (Label: Smart Switch Agent | Category: utility | Safety: safe | Reason: File backup agent)
- `com.samsung.android.fmm` (Label: Find My Mobile | Category: utility | Safety: safe | Reason: Duplicates Google Find My Device)
- `com.samsung.android.app.watchmanagerstub` (Label: Galaxy Watch Stub | Category: utility | Safety: safe | Reason: Wearable connection stub)

### 5.3 OPPO/Realme (`presets/oppo-realme.json`)
- `com.oppo.analytics` (Label: Oppo Analytics | Category: telemetry | Safety: safe | Reason: Telemetry collector)
- `com.heytap.browser` (Label: HeyTap Browser | Category: browser | Safety: safe | Reason: Stock ad-heavy browser)
- `com.coloros.oppopay` (Label: Oppo Pay | Category: finance | Safety: safe | Reason: Digital wallet bloat)
- `com.heytap.mcs` (Label: HeyTap Push | Category: utility | Safety: safe | Reason: Cloud push ads daemon)
- `com.heytap.cloud` (Label: HeyTap Cloud | Category: cloud | Safety: safe | Reason: Stock cloud backup utility)
- `com.coloros.gamespace` (Label: Game Space | Category: gaming | Safety: safe | Reason: Unused gaming optimizer)
- `com.heytap.habit.helper` (Label: Daily Habits | Category: utility | Safety: safe | Reason: Digital health clone tracker)
- `com.coloros.securepay` (Label: Secure Payment | Category: finance | Safety: safe | Reason: Custom payment validation)
- `com.oppo.usercenter` (Label: Oppo Member Center | Category: account | Safety: safe | Reason: HeyTap account wrapper)
- `com.coloros.video` (Label: ColorOS Video | Category: entertainment | Safety: safe | Reason: Stock video player bloat)

### 5.4 Vivo (`presets/vivo.json`)
- `com.vivo.browser` (Label: Vivo Browser | Category: browser | Safety: safe | Reason: Default bloat browser)
- `com.vivo.game` (Label: Vivo Game Space | Category: gaming | Safety: safe | Reason: Vivo gaming optimization tool)
- `com.vivo.assistant` (Label: Jovi Assistant | Category: utility | Safety: safe | Reason: Vivo voice assistant agent)
- `com.vivo.appstore` (Label: V-Appstore | Category: utility | Safety: safe | Reason: Vivo app marketplace)
- `com.vivo.unionpay` (Label: Vivo Wallet | Category: finance | Safety: safe | Reason: Payment service app)
- `com.vivo.vshare` (Label: Vivo Share | Category: utility | Safety: safe | Reason: File transfer tool)
- `com.vivo.space` (Label: Vivo Cloud | Category: cloud | Safety: safe | Reason: Vivo backup system)
- `com.vlife.vivo.wallpaper` (Label: Live Wallpaper | Category: theme | Safety: safe | Reason: Wallpapers engine)
- `com.bbk.theme` (Label: Vivo Themes | Category: theme | Safety: safe | Reason: Theme engine system)
- `com.bbk.cloud` (Label: BBK Cloud | Category: cloud | Safety: safe | Reason: Storage server agent)

### 5.5 Infinix (`presets/infinix.json`)
- `com.transsion.xshare` (Label: XShare | Category: utility | Safety: safe | Reason: Default file sharing app)
- `com.transsion.phoenix` (Label: Phoenix Browser | Category: browser | Safety: safe | Reason: Ad-heavy stock web browser)
- `com.transsion.palmstore` (Label: Palmstore | Category: utility | Safety: safe | Reason: Bloatware app store)
- `com.transsion.calcare` (Label: Carlcare | Category: utility | Safety: safe | Reason: Support and diagnostics tracker)
- `com.transsion.phonemanager` (Label: Phone Master | Category: utility | Safety: safe | Reason: Optimizer with constant push ads)
- `com.transsion.bomb` (Label: Freezer | Category: utility | Safety: safe | Reason: App freezer bloat)
- `com.transsion.magicshow` (Label: XTheme | Category: theme | Safety: safe | Reason: Theme customizer)
- `com.transsion.vskit` (Label: Vskit | Category: entertainment | Safety: safe | Reason: Short video streaming app)
- `com.transsion.xclub` (Category: social | Safety: safe | Reason: Infinix user community app)
- `com.transsion.haoslay` (Label: HAO Play | Category: gaming | Safety: safe | Reason: Default game center bloat)

### 5.6 Tecno (`presets/tecno.json`)
- `com.transsion.xshare` (Label: XShare | Category: utility | Safety: safe | Reason: File sharing bloat)
- `com.transsion.phoenix` (Label: Phoenix Browser | Category: browser | Safety: safe | Reason: Ad-heavy web browser)
- `com.transsion.palmstore` (Label: Palmstore | Category: utility | Safety: safe | Reason: Unofficial store bloat)
- `com.transsion.calcare` (Label: Carlcare | Category: utility | Safety: safe | Reason: Customer care tool)
- `com.transsion.phonemanager` (Label: Phone Master | Category: utility | Safety: safe | Reason: Clean-up tool with ads)
- `com.transsion.ahagame` (Label: AHA Games | Category: gaming | Safety: safe | Reason: Pre-installed game market)
- `com.transsion.magicshow` (Label: XTheme | Category: theme | Safety: safe | Reason: Theme customize agent)
- `com.transsion.vskit` (Label: Vskit | Category: entertainment | Safety: safe | Reason: Transsion video platform)
- `com.transsion.xclub` (Category: social | Safety: safe | Reason: Forum application bloat)
- `com.transsion.haoslay` (Label: HAO Play | Category: gaming | Safety: safe | Reason: Cloud gaming client)

### 5.7 itel (`presets/itel.json`)
- `com.transsion.xshare` (Label: XShare | Category: utility | Safety: safe | Reason: File sharing system)
- `com.transsion.phoenix` (Label: Phoenix Browser | Category: browser | Safety: safe | Reason: Ad-heavy browser client)
- `com.transsion.palmstore` (Label: Palmstore | Category: utility | Safety: safe | Reason: App downloader)
- `com.transsion.calcare` (Label: Carlcare | Category: utility | Safety: safe | Reason: Diagnostics support)
- `com.transsion.phonemanager` (Label: Phone Master | Category: utility | Safety: safe | Reason: Adware diagnostic utility)
- `com.transsion.ahagame` (Label: AHA Games | Category: gaming | Safety: safe | Reason: Gaming marketplace)
- `com.transsion.magicshow` (Label: XTheme | Category: theme | Safety: safe | Reason: System personalization bloat)
- `com.transsion.vskit` (Label: Vskit | Category: entertainment | Safety: safe | Reason: Short video app)
- `com.transsion.xclub` (Category: social | Safety: safe | Reason: Community portal)
- `com.transsion.haoslay` (Label: HAO Play | Category: gaming | Safety: safe | Reason: Game emulator helper)

### 5.8 Generic AOSP (`presets/generic-aosp.json`)
- `com.android.bookmarkprovider` (Label: Bookmark Provider | Category: utility | Safety: safe | Reason: AOSP browser bookmarks sync)
- `com.android.browser` (Label: Stock Browser | Category: browser | Safety: safe | Reason: Old stock AOSP browser)
- `com.android.calendar` (Label: Calendar | Category: utility | Safety: safe | Reason: Basic system calendar app)
- `com.android.deskclock` (Label: Clock | Category: utility | Safety: safe | Reason: Default system clock app)
- `com.android.email` (Label: Email | Category: utility | Safety: safe | Reason: Outdated default mail client)
- `com.android.music` (Label: Music Player | Category: entertainment | Safety: safe | Reason: Default legacy player)
- `com.android.printspooler` (Label: Print Spooler | Category: utility | Safety: safe | Reason: System background printing service)
- `com.android.calculator2` (Label: Calculator | Category: utility | Safety: safe | Reason: Stock basic calculator)
- `com.android.contacts` (Label: Contacts | Category: utility | Safety: safe | Reason: Stock contact book app)
- `com.android.gallery3d` (Label: Gallery | Category: entertainment | Safety: safe | Reason: Stock 3D photo gallery)

---

## 6. AI Integration Spec

### 6.1 Configuration Schema
Managed dynamically in React and configured via settings panel:
```json
{
  "base_url": "https://z‍evairouter.megapass.lan/v1",
  "api_key": "sk-...",
  "model": "gpt-4o-mini",
  "temperature": 0.3,
  "max_tokens": 500,
  "response_language": "Indonesian"
}
```

### 6.2 Prompts
- **Safety Tagging (Classification)**:
  `Analyze the Android app package: "{packageName}" (Label: "{label}"). Return ONLY a raw JSON object matching this schema: {"safety": "safe" | "risky" | "critical", "reason": "Brief explanation in Indonesian."}`
- **Ask AI (General QA)**:
  `Explain the function, safety risks, and impact of removing the package "{packageName}" ({label}) on an Android system. Write in Indonesian.`

---

## 7. Phasing Strategy

- **Phase 1 (Environment Setup)**: Setup Tauri v2 + React 19 TS + Tailwind v4 base template.
- **Phase 2 (ADB Native Implementation)**: Code Rust handlers inside `adb.rs` and `device.rs` to run `adb devices` and get props securely.
- **Phase 3 (Frontend List & Actions)**: Build list views, tabs, responsive row elements, dynamic size viewer, and action handlers with dialog validation.
- **Phase 4 (Presets & Local DB)**: Setup static `safety-tags.json` local database, and configure brand selector modals.
- **Phase 5 (AI client & Dev Profile)**: Connect z‍evairouter APIs, configure local settings persistency (localStorage for user configuration and About Developer content), compile production releases (`.AppImage` & `.deb`).

---

## 8. Setup Requirements & Dependencies

### 8.1 Required Tools
- Node.js (v22+) & npm
- Rust toolchain (cargo)
- Android Debug Bridge (adb)
- Tauri CLI v2

### 8.2 Target Dependencies
- **Frontend (npm)**:
  - `tailwindcss`
  - `@tailwindcss/vite`
  - `lucide-react`
  - `clsx`
  - `tailwind-merge`
- **UI Components (shadcn/ui)**:
  - `dialog`, `table`, `button`, `input`, `scroll-area`, `select`, `switch`, `toast`, `card`, `tabs`
- **Rust dependencies (Cargo)**:
  - `tauri` (v2.0)
  - `serde` (v1.0, with `derive` feature)
  - `serde_json` (v1.0)
  - `tokio` (v1, with `full` features)

### 8.3 Configuration File Keys
- **`src-tauri/tauri.conf.json`**:
  - `identifier`: `"com.megapass.adbuninstaller"`
  - `window`: width `1280`, height `800`, minWidth `1024`, minHeight `600`, resizable `true`
  - `bundle`: config for target Linux builds (.deb, AppImage)
- **`components.json`**: shadcn/ui configuration keys
- **`tailwind.config.js` / `vite.config.ts`**: configuration for CSS & build assets

---

## 9. Build & Release

### 9.1 Build Target
```bash
npm run tauri build
```

### 9.2 Artifact Destinations
Tauri outputs release bundles locally to:
- **AppImage**: `src-tauri/target/release/bundle/appimage/adb-uninstaller_2.0.0_amd64.AppImage`
- **Debian**: `src-tauri/target/release/bundle/deb/adb-uninstaller_2.0.0_amd64.deb`

### 9.3 Release Manifest & Verification
1. Verify the version identifier matches `com.megapass.adbuninstaller`.
2. Inspect log files and test run the generated AppImage on a Kubuntu target machine.
3. Clean build cache regularly using `cargo clean`.
