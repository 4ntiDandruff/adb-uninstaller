# ADB Uninstaller — Android Debloater

**Versi:** 1.17  
**Developer:** Megapass Intra Solusindo (Sidoarjo, Indonesia)  
**Platform:** Linux/Kubuntu  
**License:** Internal Use  

---

## 📋 Deskripsi

ADB Uninstaller adalah aplikasi GUI berbasis Python untuk mengelola aplikasi Android melalui ADB (Android Debug Bridge). Aplikasi ini memungkinkan teknisi untuk:

- **Uninstall** aplikasi sistem dan user
- **Disable/Freeze** aplikasi tanpa menghapus
- **Enable** aplikasi yang di-disable
- **Force Stop** aplikasi yang sedang berjalan
- **Scan** dan filter 400+ aplikasi dalam hitungan detik

---

## ✨ Fitur Utama

### 🔍 Scanning & Filter
- Scan device Android dalam <2 detik
- Database offline 130+ aplikasi populer Indonesia
- Search real-time berdasarkan package name atau app name
- Filter: System Apps, User Apps, Disabled Apps, Running Apps

### 🛡️ Safety Features
- **Sistem Inti (Critical Package) Protection:** Warning visual & double-confirm sebelum uninstall/disable aplikasi sistem penting
- **Developer Apps Filter:** Checkbox untuk sembunyikan aplikasi developer/debugging
- **Multi-select:** Batch uninstall/disable/enable

### 📊 Device Information
- Manufacturer, Model, Android Version
- API Level & Architecture
- Real-time activity log

### 🎨 Modern UI (Apple-style segment tabs & Clean colors)
- Light theme yang nyaman di mata dengan aksen biru minimalis (tidak ada warna hijau norak)
- Alternating Zebra striping dengan highlight baris terpilih (checked row effect) berwarna biru muda bersih
- Glow effect tombol Scan Device (visual cue pertama kali buka)
- Responsive column layout

---

## 🚀 Instalasi & Setup

### Prasyarat

1. **ADB Tools** harus terinstal:
```bash
sudo apt update
sudo apt install android-tools-adb android-tools-fastboot
```

2. **Python 3.11+** dan **Tkinter**:
```bash
sudo apt install python3 python3-tk
```

3. **USB Debugging** di Android harus aktif:
   - Settings → About Phone → tap Build Number 7x (Developer Mode)
   - Settings → Developer Options → USB Debugging ON

### Instalasi Aplikasi

1. File sudah ada di:
```bash
~/proyek/adb-uninstaller/
```

2. Pastikan file executable:
```bash
chmod +x ~/proyek/adb-uninstaller/adb_uninstaller.py
```

---

## 🎯 Cara Pakai

### 1. Jalankan Aplikasi

**Via Terminal:**
```bash
cd ~/proyek/adb-uninstaller
python3 adb_uninstaller.py
```

**Via Desktop Launcher:**
- Cari "ADB Uninstaller" di Application Menu
- Klik untuk jalankan

### 2. Hubungkan Device

1. Colokkan HP Android via USB
2. Pastikan USB Debugging aktif
3. Klik tombol **🔍 Scan Device**
4. Izinkan koneksi ADB di HP (pop-up "Allow USB debugging?")

### 3. Kelola Aplikasi

**Uninstall Aplikasi:**
1. Pilih tab (System Apps / User Apps)
2. Centang aplikasi yang mau dihapus (baris akan di-highlight biru muda otomatis)
3. Klik tombol **🗑️ Uninstall**
4. Konfirmasi

**Disable/Freeze Aplikasi:**
1. Centang aplikasi
2. Klik tombol **🚫 Disable**
3. Aplikasi akan berhenti dan tidak muncul di launcher

**Enable Aplikasi:**
1. Buka tab **Disabled Apps**
2. Centang aplikasi yang mau diaktifkan kembali
3. Klik tombol **✅ Enable**

**Force Stop (Running Apps):**
1. Klik tombol **🔄 Refresh Running** untuk update daftar
2. Centang aplikasi yang sedang berjalan
3. Klik tombol **⏹️ Force Stop**

---

## ⚙️ Command ADB Manual (Troubleshooting)

Jika aplikasi error atau butuh manual command:

```bash
# List devices
adb devices

# List all packages
adb shell pm list packages

# Uninstall package
adb shell pm uninstall -k --user 0 <package.name>

# Disable package
adb shell pm disable-user --user 0 <package.name>

# Enable package
adb shell pm enable <package.name>

# Force stop
adb shell am force-stop <package.name>
```

---

## 🛡️ Keamanan & Best Practices

### ⚠️ Package Sistem Inti (JANGAN DIHAPUS!)

Aplikasi ini akan warning double jika Anda mencoba uninstall/disable package berikut:

- `com.android.settings` — Aplikasi Settings
- `com.android.systemui` — System UI (status bar, notifikasi)
- `com.android.phone` — Aplikasi Telepon
- `com.google.android.gms` — Google Play Services
- `com.android.vending` — Google Play Store
- `com.android.launcher3` — Launcher default

**Menghapus package ini bisa membuat HP bootloop atau brick!**

### ✅ Aman Untuk Dihapus

- Bloatware brand (Samsung, Xiaomi, Oppo apps)
- Game pre-installed
- Aplikasi social media bawaan
- Aplikasi streaming yang tidak dipakai

### 💡 Tips

1. **Backup dulu** sebelum uninstall system apps
2. **Test disable dulu** sebelum uninstall permanent
3. **Catat package name** aplikasi yang dihapus (bisa reinstall via Play Store)
4. **Jangan hapus** apps dengan nama `android.*` atau `com.android.*` kecuali yakin

---

## 🐛 Troubleshooting

### Device Not Detected

**Solusi:**
```bash
# Restart ADB server
adb kill-server
adb start-server

# Check permissions
adb devices
# Jika muncul "unauthorized", allow di HP
```

### Permission Denied

**Solusi:**
```bash
# Tambahkan user ke grup plugdev
sudo usermod -aG plugdev $USER
# Logout dan login lagi
```

### App Crash / Error

**Solusi:**
```bash
# Jalankan dari terminal untuk lihat error log
cd ~/proyek/adb-uninstaller
python3 adb_uninstaller.py
```

---

## 📁 Struktur File

```
adb-uninstaller/
├── adb_uninstaller.py          # Main application (1102 baris)
├── ADB-Uninstaller.desktop     # Desktop launcher
└── README.md                   # Dokumentasi ini
```

---

## 🔧 Technical Details

### Dependencies
- **Python:** 3.11+
- **Tkinter:** GUI framework (built-in)
- **subprocess:** ADB command execution
- **threading:** Background operations
- **shlex:** Shell injection protection

### Database Aplikasi Populer
Aplikasi ini memiliki database offline 130+ aplikasi populer Indonesia untuk resolusi nama instan:
- Chat & Social: WhatsApp, Telegram, Facebook, Instagram, TikTok, X
- E-commerce: Shopee, Tokopedia, Lazada, Bukalapak
- E-wallet: DANA, OVO, GoPay, LinkAja, ShopeePay
- M-Banking: BCA, Mandiri (Livin'), BRI (BRImo), BNI, BSI
- Ride-hailing: Gojek, Grab, Maxim
- Gaming: Mobile Legends, Free Fire, PUBG, Genshin Impact
- Streaming: Spotify, Netflix, YouTube, Disney+ Hotstar

### Security Features
✅ Shell injection protection (shlex.quote)  
✅ Thread-safe GUI updates  
✅ ADB timeout protection (10-60 detik)  
✅ Critical package double-confirm  
✅ Safe list iteration (no IndexError)  
✅ Memory leak prevention (daemon threads)  

---

## 📝 Changelog

### v1.17 (2026-07-19)
- 🧠 **Intelligence:** Persistent knowledge base (knowledge_base.md) — self-growing database auto-populated from successful AI resolutions
- 📊 **Performance:** 75%+ hit rate on first run (1114 pre-loaded packages), approaching 95%+ on subsequent sessions
- 💾 **Architecture:** Priority chain: knowledge_base > ai_cache > POPULAR_APP_NAMES > UAD_DB > AI fallback
- 🚀 **Impact:** Session 1: ~360 AI calls | Session 2: ~50 AI calls | Session N: <10 AI calls

### v1.16 (2026-07-19)
- ⚡ **Performance:** Batch AI resolution — process 30 packages per request instead of serial (3-10x faster, ~70s vs ~270s for full scan)
- 🎯 **UX:** Priority sorting — User apps displayed first, then Disabled, then System (immediate visual feedback)
- 📊 **Stats:** 269 packages resolved in 70 seconds vs 269 seconds (serial)

### v1.15 (2026-07-19)
- 🐛 **Bugfix:** AI package name resolution sekarang benar-benar bekerja! Improved detection logic menangkap nama partial dari dumpsys (e.g. "Language Tailwind"), strengthened prompt dengan examples, dan validation reject response verbose. Contoh: "Language Tailwind" → "Google Gemini" ✅

### v1.14 (2026-07-19)
- ✨ **Feature:** Silent AI auto-test on startup — indikator AI langsung hijau otomatis tanpa popup (delay 2 detik setelah app load, hanya test kalau config sudah ada).

### v1.13 (2026-07-19)
- ✨ **Feature:** Auto-scan device on startup — device langsung terdeteksi otomatis tanpa perlu klik Scan Device (delay 1.5 detik untuk UI init).

### v1.12 (2026-07-18)
- 🐛 **Bugfix:** Mengganti warna checked row dari kuning-oranye norak menjadi biru muda clean (#e3f2fd) sesuai design system.

### v1.11 (2026-07-18)
- ✅ **New Visuals:** Mengganti warna hijau norak menjadi abu-abu & aksen biru elegan.
- ✅ **New UX:** Menambahkan visual check/selection highlight (biru muda) untuk row yang terpilih/dicentang.
- ✅ **Layout Fix:** Memperbaiki layout packing tombol aksi (uninstall/disable/enable) yang sempat terpotong.
- ✅ **Clean Code:** Optimasi map tag handling Tkinter agar stabil di Ubuntu/Kubuntu modern.
- ✅ **Rename Red Tag:** Mengubah teks legenda "Kritis (Bahaya)" menjadi "Sistem Inti".

### v1.10 (2026-07-18)
- Initial release dengan multi-tab & device specs display.

---

## 👨‍💻 Developer

**Megapass Intra Solusindo**  
Servis HP, Laptop, Komputer  
Sidoarjo, Indonesia  

---

## 📄 License

Internal use only — Megapass Sidoarjo.  
Not for public distribution.

---

**Terima kasih telah menggunakan ADB Uninstaller!** 🚀
