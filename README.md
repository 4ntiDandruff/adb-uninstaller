# ADB Uninstaller v2.2.4

**By Teknisi Megapass Sidoarjo**

Desktop app Linux untuk manage aplikasi Android via ADB: scan device, list package, uninstall/disable/enable/force-stop/clear data, klasifikasi keamanan (static + AI batch), chat AI, cache lokal, export preset debloat.

![Platform](https://img.shields.io/badge/platform-Linux-blue)
![Stack](https://img.shields.io/badge/stack-Tauri%20v2%20%7C%20React%20%7C%20Rust-orange)
![Version](https://img.shields.io/badge/version-2.2.4-green)
![License](https://img.shields.io/badge/license-Private-lightgrey)

---

## Instalasi & Distro Package (.deb)

Aplikasi ini dipaketkan resmi dalam format **.deb** untuk Linux (Kubuntu, Ubuntu, Linux Mint, Debian).

### Cara Install Paket .deb:
```bash
sudo dpkg -i "src-tauri/target/release/bundle/deb/ADB Uninstaller_2.2.4_amd64.deb"
```
*Atau double-click file .deb di Dolphin/Nemo File Manager.*

---

## Fitur

### Core ADB
- Deteksi device USB / Wi‑Fi + auto-select
- List apps: tab Semua / System / User / Disabled / Running
- Kolom label app (nama readable) + package name
- Sort ascending / descending (label, safety, size — numeric)
- Search + debounce 200ms + tombol clear
- Sticky table header
- Detail panel per package + tombol copy package name
- Batch actions: Uninstall, Disable, Enable, Force Stop, Clear Data
- Undo restore (package yang di-uninstall/disable)
- **Atur waktu layar mati** — dialog preset (1m/5m/10m/30m/60m/Selamanya), lewati batas 10 menit UI bawaan HP, via `settings put system screen_off_timeout`
- **Device info lengkap** — nama pasar (Infinix Note 30 Pro, bukan kode X678B) + kode model + chipset
- **Analisa Device (AI)** — brief teknisi 1-klik: spek, isu khas servis model itu, tips (format bullet)

### Keamanan
- 4 level: **safe / risky / critical / unknown**
- Static offline tags (Android/Google/Xiaomi/Samsung/OPPO/Vivo bloat)
- **Unknown otomatis dianalisis AI** — semua package, bukan hanya 50 pertama
- Hasil AI disimpan ke SQLite cache (tidak hilang setelah restart)
- Response AI disaring ketat: package halusinasi/duplikat tidak boleh masuk cache
- AI cache persist: reconnect device → load instant dari DB, AI cuma proses package baru
- Critical package diblokir dari uninstall/disable

### AI
- Custom OpenAI-compatible provider (ZevaiRouter / lokal / OpenAI)
- Tombol **Test Koneksi** + daftar model
- Chat floating window (drag mouse + touch, minimize, clear history)
- Temperature + max tokens di Settings
- Reason AI ikut bahasa UI (Indonesia / English)

### UI / UX
- Custom confirmation dialog (bukan `window.confirm` browser)
- Empty state: tombol Scan Device langsung di tabel
- Dark mode (default) + Light mode — toggle di Settings
- Bahasa **Indonesia / English** — semua label, deskripsi, reason ikut berubah
- i18n konsisten: search, filter, counter, log, sidebar hint semua ikut bahasa aktif
- Statistik sidebar: total / safe / risky / kritis / unknown
- Progress bar scan (persen + status)
- Toast notification + log drawer (auto-scroll, export `.txt`)
- Error message manusiawi (bukan cuma kode teknis)
- CSP dinonaktifkan (CSP ketat memblokir CSS di Tauri WebView production)

### Utils
- Info device: model, Android, battery, storage, RAM
- Local SQLite cache WAL mode (`~/.config/adb-uninstaller/cache.db`)
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
sudo dpkg -i "ADB Uninstaller_2.2.4_amd64.deb"
# atau AppImage
chmod +x "ADB Uninstaller_2.2.4_amd64.AppImage"
./"ADB Uninstaller_2.2.4_amd64.AppImage"
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

File settings ditulis atomic dengan permission privat `0600` karena berisi API key.

---

## Cara pakai cepat

1. Colok HP → aktifkan **USB debugging**
2. Buka app → pilih device (auto-select kalau cuma 1)
3. Tunggu list apps + auto AI untuk package `unknown` (semua diproses, bukan hanya 50)
4. Centang package → Uninstall / Disable / Stop / Clear / Export
5. Pakai **AI Chat** untuk tanya debloat (floating, bisa digeser mouse/touch)
6. Ganti bahasa di Settings → semua label + deskripsi package ikut berubah

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
│       ├── adb.rs          # ADB commands + timeout
│       ├── ai.rs           # AI client + i18n prompt
│       ├── db.rs           # SQLite cache WAL
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
- Ganti bahasa di Settings → reason package langsung berubah tanpa scan ulang

---

## Kredit

**Megapass Intra Solusindo — Sidoarjo**  
Servis HP / laptop / komputer + tools teknisi internal.

Repo: https://github.com/4ntiDandruff/adb-uninstaller
