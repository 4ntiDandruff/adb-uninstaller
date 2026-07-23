# ADB Uninstaller v2

**By Teknisi Megapass Sidoarjo**

Desktop app Linux untuk manage aplikasi Android via ADB: scan device, list package, uninstall/disable/enable/force-stop/clear data, klasifikasi keamanan (static + AI batch), chat AI, cache lokal, export preset debloat.

![Platform](https://img.shields.io/badge/platform-Linux-blue)
![Stack](https://img.shields.io/badge/stack-Tauri%20v2%20%7C%20React%20%7C%20Rust-orange)
![License](https://img.shields.io/badge/license-Private-lightgrey)

---

## Fitur

### Core ADB
- Deteksi device USB / Wi‑Fi
- List apps: tab Semua / System / User / Disabled / Running
- Sort ascending / descending (package, safety, size)
- Search + clear (tombol X)
- Sticky table header
- Detail panel per package
- Batch actions: Uninstall, Disable, Enable, Force Stop, Clear Data
- Undo restore (package yang di-uninstall/disable)

### Keamanan
- 4 level: **safe / risky / critical / unknown**
- Static offline tags (Android/Google/Xiaomi/Samsung/OPPO/Vivo bloat)
- **Unknown otomatis dianalisis AI** (batch 50 package/call)
- Hasil AI disimpan ke SQLite cache (tidak hilang setelah restart)

### AI
- Custom OpenAI-compatible provider (ZevaiRouter / lokal / OpenAI)
- Tombol **Test Koneksi** + daftar model
- Chat floating window (drag, minimize, history persist)
- Temperature + max tokens di Settings

### UI / UX
- Dark mode (default) + Light mode (GitHub-style)
- Bahasa **Indonesia / English**
- Progress bar scan (persen + status)
- Toast notification + log drawer
- Error message manusiawi (bukan cuma kode teknis)

### Utils
- Info device: model, Android, battery, storage, RAM
- Local SQLite cache (`~/.config/adb-uninstaller/cache.db`)
- Export preset debloat (JSON)
- Debloat presets bawaan

---

## Install (Linux)

### Dependency
```bash
sudo apt update
sudo apt install -y android-tools-adb
```

### Bundle siap pakai
```bash
# .deb
sudo dpkg -i "ADB Uninstaller_2.0.0_amd64.deb"
# atau AppImage
chmod +x "ADB Uninstaller_2.0.0_amd64.AppImage"
./"ADB Uninstaller_2.0.0_amd64.AppImage"
```

Build lokal menghasilkan:
- `src-tauri/target/release/bundle/deb/`
- `src-tauri/target/release/bundle/appimage/`

---

## Build dari source

### Butuh
- Node.js 20+
- Rust (stable)
- `libwebkit2gtk-4.1-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev` (Ubuntu/Kubuntu)

```bash
git clone https://github.com/4ntiDandruff/adb-uninstaller.git
cd adb-uninstaller
npm install
npm run tauri build
```

Dev mode:
```bash
npm run tauri dev
```

---

## Settings AI

Buka **Pengaturan** di app:

| Field | Contoh |
|-------|--------|
| Base URL | `http://HOST:PORT/v1` (wajib ada `/v1`) |
| API Key | `sk-...` |
| Model | mis. `kr/claude-haiku-4.5` |
| Temperature | `0.3` (konsisten) |
| Max Tokens | `4096` |
| Bahasa UI | Indonesia / English |
| Tema | Dark / Light |

Settings tersimpan di:
`~/.config/adb-uninstaller/settings.json`

---

## Cara pakai cepat

1. Colok HP → aktifkan **USB debugging**
2. Buka app → pilih device (auto-select kalau cuma 1)
3. Tunggu list apps + auto AI untuk package `unknown`
4. Centang package → Uninstall / Disable / Stop / Clear / Export
5. Pakai **AI Chat** untuk tanya debloat (floating, bisa digeser)

---

## Struktur proyek

```
adb-uninstaller/
├── src/                    # React frontend
│   ├── App.tsx
│   ├── components/         # Sidebar, AppTable, AIChat, Settings...
│   ├── lib/                # safety-tags, export, presets
│   ├── i18n.ts
│   └── errorMessages.ts
├── src-tauri/
│   └── src/
│       ├── adb.rs          # ADB commands
│       ├── ai.rs           # AI client
│       ├── db.rs           # SQLite cache
│       └── lib.rs          # Tauri commands
└── package.json
```

---

## Changelog

Lihat [CHANGELOG.md](./CHANGELOG.md).

---

## Catatan teknisi

- System app critical: jangan di-uninstall sembarangan
- Disable lebih aman daripada uninstall untuk bloat OEM
- Cache AI mempercepat device kedua / scan ulang
- Export JSON bisa dibagikan ke teknisi lain sebagai preset debloat

---

## Kredit

**Megapass Intra Solusindo — Sidoarjo**  
Servis HP / laptop / komputer + tools teknisi internal.

Repo: https://github.com/4ntiDandruff/adb-uninstaller
