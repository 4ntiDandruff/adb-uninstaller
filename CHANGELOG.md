# Catatan Rekam Medis Servis (CHANGELOG)

Semua perubahan penting pada proyek **ADB Uninstaller** didokumentasikan di sini secara kronologis.  
Format pencatatan berpedoman pada standar *Keep a Changelog* dengan kata kerja fisik konkret dan dampak riil terhadap sistem/hardware meja servis.

---

## [2.3.1] — 2026-09-16

Penyempurnaan Diagnostik Flash Memory: Auto-Detection Bus UFS vs eMMC, Perbaikan Kompatibilitas Benchmark Toybox Android (`conv=fsync`), dan Ambang Batas Kesehatan Adaptif.

### Added (Fitur & Instrumen Baru)
- **Deteksi Otomatis Bus Storage (UFS vs eMMC)**: Menambahkan detektor bus controller otomatis di backend Rust yang membaca property kernel `ro.boot.boot_devices` dan mapping symlink block device `/sys/block/sd*` (UFS) vs `/sys/block/mmcblk0` (eMMC).
- **Threshold Kesehatan Adaptif Berbasis Silikon**: Mengganti ambang batas tunggal dengan evaluasi adaptif sesuai teknologi chip:
  - *Mode UFS*: Ambang batas disetel `>= 60 MB/s` (Good / Prima), `25 – 60 MB/s` (Warning / Throttling), dan `< 25 MB/s` (Critical / Degradasi Bus).
  - *Mode eMMC*: Ambang batas disesuaikan dengan limit fisik bus paralel 8-bit half-duplex (`>= 25 MB/s` Good, `8 – 25 MB/s` Warning, `< 8 MB/s` Critical).
- **Penamaan Dinamis Kartu Flash**: Mengubah label kartu bento secara transparan menjadi `Kesehatan Flash (UFS)` atau `Kesehatan Flash (eMMC)` sesuai perangkat yang tersambung.

### Fixed (Perbaikan Bug Teknis)
- **Koreksi Sintaks Toybox dd (`conv=fsync`)**: Mengganti parameter `oflag=dsync` yang ditolak oleh utilitas `dd` bawaan Toybox Android (`bad oflag=dsync`) dengan `conv=fsync` yang sah untuk memaksa flushing buffer RAM langsung ke storage fisik di akhir penulisan.
- **Parser Kecepatan Multi-Format Toybox**: Memperluas parser kecepatan tulis Rust agar mengenali format output Toybox (`M/s`, `k/s`, `G/s`) di samping format standar GNU dd (`MB/s`, `kB/s`, `GB/s`), mengeliminasi kesalahan kalkulasi fallback latensi terminal error.
- **Pemulihan Scrollbar Vertikal Tabel Scan**: Mengeliminasi kelas utilitas `overflow-hidden` yang mematikan scrollbar pada kontainer hasil pemindaian sampah Storage Doctor, menggantikannya dengan `.table-scroll-doctor` yang memiliki batas tinggi terukur (`max-height: min(600px, calc(100vh - 360px))`), `overflow-y: auto`, `scrollbar-gutter: stable`, serta penataan sticky `<thead>` agar judul kolom tetap terkunci di atas saat daftar sampah di-scroll.

---

## [2.3.0] — 2026-09-16

Rilis Mayor: Modul Diagnostik Memori Storage Doctor, Ekstraktor APK Offline, Floating Bottom Action Dock, Sekring Kernel Anti-Zombie, dan Perombakan Dual-Theme Autentik Megapass.

### Added (Fitur & Instrumen Baru)
- **Ekstraktor APK Offline (Offline APK Extractor)**: Menambahkan mesin penarik berkas APK mentah (`extract_apk` dan `extract_multiple_apks` di backend Rust) yang mengambil path via `pm path` dan menyedotnya langsung ke folder `~/Downloads/APK_Backup/<vendor_model>/<package>_v<version>.apk` untuk backup aplikasi penting konsumen tanpa internet.
- **Floating Bottom Action Dock**: Menambahkan bilah aksi melayang responsif di bagian bawah layar (`.floating-batch-dock`) yang muncul otomatis saat paket dipilih, menyediakan tombol seleksi jempol cepat (Uninstall, Disable, Enable, Ekstraksi APK, Export JSON, dan Clear).
- **Scanner Multi-Vendor Storage Doctor**:
  - *Telegram Pruner*: Pemindaian otomatis folder media Telegram berukuran masif (Video, Dokumen, Audio) dan cache partikel.
  - *Crash Dumps & Debug Logs*: Pembersihan berkas dump debug vendor OEM bawaan MIUI/HyperOS, ColorOS/Realme, Transsion (Infinix/Tecno), dan Vivo yang sering membengkak puluhan gigabyte di `/sdcard/`.
  - *Orphan Zombie Directory*: Katalog deteksi folder sisa aplikasi yang sudah dicopot (TikTok, Likee, Helo, DUrecorder, InShot, VivaVideo, Baidu).
- **Multi-Segment Interactive Progress Meter**: Menambahkan visualisasi kapasitas penyimpanan bertingkat (Sistem & Aplikasi, Sampah Terpilih Siap Dipulihkan, dan Sisa Ruang Bebas) dengan animasi transisi pegas 350ms cubic-bezier dan efek denyut pendar lembut.
- **Tombol 1-Klik Bersihkan Semua Aman**: Menambahkan tombol aksi instan untuk menyeleksi seluruh item berstatus aman (*Safe*) dan langsung membuka dialog konfirmasi dry-run.
- **Lencana Kategori Brand Storage**: Menambahkan 6 kelas warna khas brand untuk identifikasi visual instan (`badge-cat-whatsapp`, `badge-cat-telegram`, `badge-cat-orphan`, `badge-cat-apk`, `badge-cat-cache`, `badge-cat-logs`).
- **Speedometer Chip eMMC / UFS**: Menanamkan micro-test penulisan via `dd if=/dev/zero of=... bs=1M count=8 conv=fsync` untuk mengukur kecepatan tulis nyata (*write speed* dalam MB/s) dan latensi respon (ms), mendeteksi keausan chip memori flash.
- **Pembersihan Cache Global Tanpa Root**: Menambahkan saklar *Trim Caches* yang memicu perintah kernel `pm trim-caches 999G` untuk menyapu sampah RAM/cache seluruh aplikasi seketika.
- **Simulasi Dry-Run**: Menambahkan dialog pratinjau sebelum eksekusi pembersihan permanen agar teknisi dapat meninjau daftar berkas dan total ukuran byte yang akan dihapus.
- **Ekspor Laporan Servis WhatsApp 1-Klik**: Menambahkan generator teks laporan format pesan instan bertajuk `*LAPORAN SERVIS MEMORI — MEGAPASS*` yang langsung tersalin ke clipboard sistem.
- **AI Storage Advisor**: Menambahkan integrasi konsultasi diagnosis storage berbasis model AI untuk memberikan 3 poin saran teknis fisik kepada teknisi meja servis.
- **Standarisasi Header Modal Presets & Confirm**: Menambahkan `modal-head`, ikon `Trash2`, judul baku, dan tombol tutup silang `X` pada `DebloatPresets.tsx` dan `ConfirmDialog.tsx`.

### Changed (Penyelarasan & Peningkatan Performa)
- **Eliminasi Total Karakter Emoji ke TUI Badges**: Menghapus seluruh karakter emoji grafis (`✨`, `🐛`, `🎨`, `⚠️`, `✓`, `📜`) dari antarmuka dan menggantikannya dengan 100% lencana teks TUI meja servis (`[feat]`, `[fix]`, `[ui]`, `[perf]`, `[ai]`, `[clean]`, `[sec]`) dan inline SVG native Lucide (`ScrollText`, `CheckCircle2`).
- **Peningkatan Kontras Tema Terang (WCAG AA/AAA)**: Mengunci warna teks utilitas aksen cyan (`#0284c7`), amber (`#b45309`), dan merah (`#b91c1c`) di mode terang sehingga memiliki rasio kontras tinggi (>4.5:1) di atas latar belakang putih.
- **Fisika Transisi Scoped**: Mengganti seluruh sisa deklarasi `transition-all` menjadi transisi properti terarah (seperti `transition: width 0.3s cubic-bezier(0.16, 1, 0.3, 1)`) pada bilah statistik sidebar dan progress meter.
- **Concentric Radius & Hover Lift**: Memperbarui radius kartu bento dari 12px menjadi 14px agar proporsional dengan padding 16px, dilengkapi efek angkat `translateY(-1px)` saat kursor melayang.
- **Standardisasi Geometri Tombol**: Mengunci seluruh tombol antarmuka pada skala terukur: tinggi 32px untuk aksi utama (`.btn`), tinggi 28px untuk tombol utilitas (`.btn-sm`), dan bujur sangkar presisi 28px × 28px untuk tombol ikon murni (`.btn-icon.btn-sm`).
- **Diferensiasi Ikon Ekspor**: Memisahkan ikon untuk ekstraksi APK mentah (`<Download>`) dan ekspor preset JSON (`<FileDown>`).

### Fixed (Perbaikan Bug & Sirkuit Keamanan)
- **Sekring Kernel Tokio Anti-Zombie**: Menanamkan `.kill_on_drop(true)` pada Tokio `Command` di driver ADB backend (`run_adb`, `run_adb_piped`, `extract_apk`) untuk mematikan sub-proses ADB seketika jika tugas dibatalkan atau timeout, mencegah kebocoran proses zombie di kernel Linux.
- **Clippy Compiler Lints**: Membersihkan *needless borrow* pada `extract_apk` handler Rust sehingga kompilasi bersih tanpa *warning*.
- **Bug Chevron Tiling Dropdown (`v v v v v`)**: Memperbaiki reset properti `background:` shorthand CSS pada kelas `.select-dark` di mode terang.
- **Eliminasi Karakter Em-Dash**: Mengganti seluruh karakter em-dash (`—`) menjadi tanda panah (`→`) atau tanda hubung biasa (`-`) sesuai standar direktif anti-AI slop.
- **Sinkronisasi Versi Antarmuka**: Memperbarui string versi pada dialog Tentang dan catatan rilis menjadi `v2.3.0`.

---

## [2.2.5] — 2026-08-10

Penyempurnaan Stabilitas Rilis Produksi dan Penanganan Event ADB.

### Added
- **Screen Timeout Override**: Menambahkan preset pengendali layar mati Android (1m, 5m, 10m, 30m, 60m, Always On) via `settings put system screen_off_timeout` untuk mencegah layar ponsel terkunci saat proses debloat berlangsung.
- **Resolusi Nama Komersial Pasar**: Menambahkan penerjemah kode pabrik OEM menjadi nama komersial toko (contoh: *X678B* otomatis tertera *Infinix Note 30 Pro*).
- **AI Hardware Note Briefing**: Integrasi briefing cepat teknisi untuk membaca catatan kelemahan fisik khas tipe motherboard ponsel yang tersambung.

### Fixed
- **Looping Re-render Bahasa**: Menambal kebocoran re-render tak terbatas pada pergantian bahasa antarmuka di `App.tsx`.
- **Sanitasi Stderr Force-Stop**: Mengisolasi penanganan kesalahan pada perintah `am force-stop` yang memicu alarm palsu pada beberapa firmware Transsion dan Oppo.

---

## [2.1.1] — 2026-08-03

Audit Sistem Menyeluruh, Optimasi Performa Basis Data, dan Penyesuaian CSP Tauri.

### Fixed
- **Optimasi Sambungan Basis Data**: Mengalihkan fungsi `list_apps` pada `adb.rs` untuk memakai instance path `db_path()` langsung tanpa memanggil `init_db()` berulang, mengeliminasi potensi tabrakan *race condition*.
- **Penyelesaian Peringatan Compiler Rust**: Membersihkan fungsi mati `update_safety()` pada `db.rs` dan memperbaiki *lifetime annotation* hingga kompilasi Rust mencapai 0 peringatan (*clean build*).

---

## [2.0.0] — 2026-07-15

Perombakan Arsitektur Total: Migrasi dari Prototipe Python/Tkinter ke Desktop Native Tauri v2 (Rust) + React 19.

### Changed
- **Pangkas Konsumsi Memori (RAM Drop 86%)**: Menurunkan penggunaan memori kerja komputer bengkel dari 280MB (Python/Tkinter) menjadi ~38MB (Tauri Rust), mengizinkan teknisi membuka skema boardview berat secara bersamaan.
- **Akselerasi Waktu Cold Start**: Memangkas waktu booting aplikasi dari 1.8 detik menjadi 240 milidetik.
- **Integrasi Mesin SQLite WAL**: Menggantikan penyimpanan flat-file JSON lama dengan basis data SQLite bertransaksi atomik anti-korupsi saat listrik padam.

---

## [1.0.0] — 2026-06-01

Rilis Perdana Alat Debloater Internal Meja Servis Megapass Intra Solusindo.

### Added
- Antarmuka inspeksi daftar aplikasi Android via koneksi ADB USB.
- Rambu pengaman awal berbasis daftar paket aman (*Safe List*) untuk Xiaomi MIUI dan Samsung OneUI.
- Saklar copot paket satu per satu via `pm uninstall -k --user 0`.
