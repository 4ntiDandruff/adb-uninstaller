# Catatan Rekam Medis Servis (CHANGELOG)

Semua perubahan penting pada proyek **ADB Uninstaller** didokumentasikan di sini.  
Format pencatatan berpedoman pada prinsip *Keep a Changelog* dengan kata kerja fisik konkret dan dampak riil ke sistem/hardware meja servis.

---

## [2.3.0] — 2026-09-16

Rilis Mayor: Penambahan Modul Diagnostik Memori Storage Doctor, Perombakan Dual-Theme Autentik Megapass, dan Standardisasi Geometri Tombol.

### Added (Fitur & Instrumen Baru)
- **Modul Storage Doctor**: Menambahkan kokpit telemetri penyimpanan internal Android (Total, Used, Free) dengan visualisasi bar kapasitas real-time.
- **Speedometer Chip eMMC / UFS**: Menanamkan micro-test penulisan acak via `dd if=/dev/zero of=... bs=1M count=10 oflag=dsync` untuk mengukur kecepatan tulis nyata (*write speed* dalam MB/s) dan latensi respon (ms), mendeteksi keausan chip memori flash sebelum terlambat.
- **Pembersihan Cache Global Tanpa Root**: Menambahkan saklar *Trim Caches* yang memicu perintah kernel `pm trim-caches 999999999999` untuk menyapu sampah RAM/cache seluruh aplikasi seketika.
- **Triage 5 Kategori Sampah Memori**: Menambahkan pemindaian otomatis untuk berkas instalasi APK usang (`/sdcard/Download/*.apk`), cache thumbnail (`.thumbnails`), berkas cache aplikasi, folder berkas temporer, dan folder sisa aplikasi yang sudah dicopot.
- **Simulasi Dry-Run**: Menambahkan dialog pratinjau sebelum eksekusi pembersihan permanen agar teknisi dapat meninjau daftar berkas dan total ukuran byte yang akan dihapus.
- **Ekspor Laporan Servis WhatsApp 1-Klik**: Menambahkan generator teks laporan format pesan instan bertajuk `*LAPORAN SERVIS MEMORI — MEGAPASS*` yang langsung tersalin ke clipboard sistem.
- **AI Storage Advisor**: Menambahkan integrasi konsultasi diagnosis storage berbasis model AI untuk memberikan 3 poin saran teknis fisik kepada teknisi meja servis.
- **Tema Ganda Autentik Meja Servis**:
  - *Dark Modern Tech*: Mengunci fondasi Deep Slate (`#0B1220`) dengan pendar aksen Electric Cyan (`#22D3EE`) dan tombol bergradien tegangan tinggi.
  - *Cupertino Liquid Crystal v2.0*: Mengimplementasikan fondasi kanvas Platinum (`#F5F5F7`) berpadu 5 titik gradien ambient iridescent mesh dinamis dan tombol biru Apple (`#0071E3`).
- **Ikon SVG Lucide Penuh pada Seluruh Tombol Aksi**: Menambahkan ikon native `<Trash2>`, `<Ban>`, `<CheckCircle2>`, `<PowerOff>`, `<Eraser>`, `<Download>`, dan `<Sparkles>` pada toolbar batch dan panel inspektur aplikasi.

### Changed (Penyelarasan & Peningkatan Performa)
- **Standardisasi Geometri Tombol**: Mengunci seluruh tombol antarmuka pada skala terukur: tinggi 32px untuk aksi utama (`.btn`), tinggi 28px untuk tombol utilitas (`.btn-sm`), dan bujur sangkar presisi 28px × 28px untuk tombol ikon murni (`.btn-icon.btn-sm`).
- **Penyelarasan Elemen Topbar**: Mengunci dropdown pilihan bahasa (`select-dark btn-sm`) dan tombol utilitas (*Theme, Info, Screen, Presets, Undo, AI Chat*) tepat pada satu garis horizontal dengan tinggi seragam 28px.
- **Eliminasi Total Karakter Emoji**: Menghapus seluruh karakter emoji mentah sistem (`💾`, `⚡`, `🛡️`, `🧹`, `🚀`) dari antarmuka dan menggantikannya dengan 100% inline SVG Lucide agar kebal dari kerusakan rendering kotak silang (*tofu*).
- **Segmented Control Neomorphic**: Mengubah tab aktif navigasi menjadi kartu terangkat berwarna putih (`#FFFFFF`) dengan bayangan halus `0 2px 8px rgba(0,0,0,0.1)` pada mode terang dan gradien cyan berteks gelap kontras pada mode gelap.

### Fixed (Perbaikan Bug & Sirkuit)
- **Bug Chevron Tiling Dropdown (`v v v v v`)**: Memperbaiki reset properti `background:` shorthand CSS pada kelas `.select-dark` di mode terang yang sebelumnya menghapus deklarasi `background-repeat: no-repeat`.
- **Garis Potong Empty State Tabel**: Menghilangkan garis batas horizontal `border-bottom` bawaan tabel saat antrean paket kosong, menjaga area pandang tengah tetap lapang dan rapi.
- **Kontras Teks Badge Kategori Storage**: Memperbaiki kontras warna teks pada pil hitungan kategori aktif agar terbaca tegas di mode terang maupun mode gelap.
- **Dead Code Eliminasi di Storage Doctor**: Menghapus import ikon `Smartphone` yang tidak terpakai di berkas `StorageDoctor.tsx` guna meloloskan validasi kompilasi `tsc --noEmit`.

---

## [2.2.5] — 2026-08-10

Penyempurnaan Stabilitas Rilis Produksi dan Penanganan Event ADB.

### Added
- Penambahan dialog preset lewati batas waktu layar mati Android (*Screen Timeout Override*): 1m, 5m, 10m, 30m, 60m, dan Tanpa Batas (*Always On*) via `settings put system screen_off_timeout`.
- Penambahan resolusi nama komersial pasar pada informasi perangkat (contoh: *Infinix Note 30 Pro* bukan sekadar kode pabrik *X678B*).
- Integrasi briefing cepat teknisi berbasis kecerdasan AI untuk membaca kelemahan khas dan catatan servis dari tipe motherboard perangkat yang tersambung.

### Fixed
- Menambal celah *infinite loop* re-render saat pergantian bahasa antarmuka di `App.tsx`.
- Mengisolasi penanganan kesalahan stderr pada proses `force-stop` yang sebelumnya memicu alarm palsu pada ponsel merek tertentu.

---

## [2.1.1] — 2026-08-03

Audit Sistem Menyeluruh, Optimasi Performa Basis Data, dan Penyesuaian CSP Tauri.

### Fixed
- **Optimasi Sambungan Basis Data**: Mengalihkan fungsi `list_apps` pada `adb.rs` untuk memakai instance path `db_path()` langsung tanpa memanggil `init_db()` berulang, mengeliminasi potensi tabrakan *race condition*.
- **Penyelesaian Peringatan Compiler Rust**: Membersihkan fungsi mati `update_safety()` pada `db.rs` dan memperbaiki *lifetime annotation* hingga kompilasi Rust mencapai 0 peringatan (*clean build*).
- **Penanganan Jalur Aset Produksi**: Menambahkan `base: "./"` pada konfigurasi `vite.config.ts` untuk memastikan berkas CSS dan JS ter-bundle utuh di WebView Tauri Linux.
- **Pengaturan CSP WebView**: Mengatur Content Security Policy (CSP) ke mode `null` agar injeksi style Tailwind CSS runtime tidak diblokir oleh engine WebKitGTK.

### Added
- Merancang komponen `ConfirmDialog` kustom untuk menggantikan popup bawaan browser `window.confirm()`.
- Menambahkan tombol aksi cepat *Scan Device* tepat di tengah kanvas kosong (*empty state*).
- Memindahkan posisi default HUD AI Chat ke pojok kanan bawah agar tidak menghalangi panel samping.

---

## [2.1.0] — 2026-08-03

Pembaruan Mayor Stabilitas Komunikasi ADB dan Penyelamatan Basis Data.

### Added
- Menambahkan kolom nama aplikasi readable beserta ID paket mono pada tabel utama.
- Mengaktifkan pengurutan numerik ukuran paket (Bytes) secara presisi, menggantikan perbandingan karakter string.
- Menerapkan arsitektur basis data *Write-Ahead Logging* (`PRAGMA journal_mode = WAL`) pada SQLite lokal agar data klasifikasi aman dari ancaman mati lampu tiba-tiba.
- Menyediakan riwayat log terminal dengan fitur ekspor berkas teks `.txt` dan drawer auto-scroll.

### Fixed
- Memasang sekring waktu tunggu *timeout 30 detik* pada seluruh panggilan `adb.rs` untuk mencegah aplikasi freeze permanen saat kabel USB longgar.
- Memperbaiki kebocoran pembaharuan tabel `db.rs` agar query `update_safety` terisolasi per `device_id` unik.
- Memperbaiki antrean analisa AI batch sehingga seluruh paket *unknown* diproses tuntas tanpa terpotong di angka 50 aplikasi pertama.

---

## [2.0.0] — 2026-07-23

Pembangunan Ulang Total (Rebuild) Menuju Arsitektur Desktop Native Modern (Tauri v2 + React + Rust).

### Added
- Penggantian total mesin backend berbasis Electron/Python menjadi binary native Rust via Tauri v2.
- Pengurangan beban memori operasional dari 450 MB menjadi di bawah 45 MB saat idle.
- Pemetaan otomatis status aplikasi Android: Semua, Sistem, Pengguna, Dinonaktifkan, dan Sedang Berjalan.
- Klasifikasi keamanan otomatis 4 level: *Safe*, *Risky*, *Critical*, dan *Unknown*.
- Sekring pengaman sirkuit: Paket bertanda *Critical* dikunci otomatis dari tombol uninstall massal untuk mencegah *soft-brick* atau *bootloop*.
- Pembuatan paket instalasi Debian `.deb` dan binary mandiri `.AppImage` siap pakai untuk Linux desktop meja servis.

---

## [1.x] — Arsip Warisan

Arsip versi generasi pertama berbasis skrip shell CLI dan Python Tkinter dialihkan ke branch repositori `v1-archive`.
