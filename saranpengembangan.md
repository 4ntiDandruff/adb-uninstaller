# BLUEPRINT: STORAGE DOCTOR & DEEP CLEANER (v2.3.0)
Proyek: ADB Uninstaller (Megapass Intra Solusindo)
Platform: Linux Desktop (Tauri v2 + Rust + React + SQLite WAL)

---

## 1. MASALAH & TUJUAN
Memori internal Android sering penuh bukan karena aplikasi aktif, melainkan:
- Folder orphan (zombie) sisa aplikasi yang sudah di-uninstall (misal: cache video SHAREit hingga puluhan GB).
- Duplikasi file kirim WhatsApp (folder Sent), cache status WA, dan backup database harian lama.
- File installer mentah (.apk) di folder unduhan padahal aplikasi sudah terpasang.
- Cache thumbnail tersembunyi (.thumbnails, .tmfs) dan log crash OEM.
- Penurunan performa fisik flash storage (eMMC/UFS aus/lemah).

Tujuan:
Menyediakan modul dedicated "Storage Doctor" untuk scan mendalam, klasifikasi aman/kritis, pembersihan cerdas ber-AI, benchmark kesehatan flash storage, dan pembuatan laporan servis siap kirim ke WhatsApp pelanggan.

---

## 2. PEMBAGIAN KOMPONEN & TANGGUNG JAWAB

### A. Backend (Rust - Tauri Core)
- **Kapasitas & Benchmark**: Ambil metrik partisi (/data) dan ukur performa I/O write storage dari `dumpsys diskstats` (kecepatan kB/s & latensi) untuk deteksi eMMC aus.
- **Scanner Bertahap**:
  1. *Orphan Detector*: Bandingkan direktori di `/sdcard/` dengan `pm list packages`.
  2. *WhatsApp Pruner*: Deteksi folder `Sent`, `.Statuses`, dan file backup harian lama `msgstore-*.db.crypt*` (sisakan 1 backup terbaru).
  3. *APK Leftover*: Deteksi installer mentah di folder download yang aplikasinya sudah terpasang.
  4. *Big Files*: Indeks file berukuran > 500 MB untuk ditinjau teknisi.
- **Fast Global Trim**: Eksekusi perintah native Android `pm trim-caches 999G` untuk pembersihan cache global instan tanpa root.
- **Safe Batch Deletion Engine**:
  - Wajib anti-hang: gunakan streaming batch deletion (misal: Toybox `find -delete`) agar tidak timeout saat menghapus puluhan ribu file individual.
  - Blacklist proteksi data: blokir mutlak penghapusan pada root path, sistem, `DCIM`, `Pictures`, `Documents`, dan data utama WhatsApp.

### B. AI Engine & Database Cache (Rust + SQLite WAL)
- **Efisiensi Token**: AI hanya dipanggil untuk folder tidak dikenal berukuran > 50 MB yang belum ada di database lokal.
- **Batching Request**: Kirim maksimal 3-5 folder per prompt ke model LLM.
- **Output AI**: Klasifikasi kategori safety (`safe`, `review`, `critical`), alasan ringkas teknisi (bahasa Indonesia), dan dugaan nama aplikasi asal.
- **SQLite Persistence**: Simpan hasil analisa ke tabel cache (`storage_folder_cache`) agar scan berulang tidak mengonsumsi token.

### C. Frontend (React + Tailwind)
- **Navigasi**: Switch tab utama antara `[Aplikasi & Debloat]` dan `[Pembersih Storage]`, serta shortcut di sidebar.
- **Bento Summary**: Ringkasan kapasitas storage, estimasi ruang yang bisa dibebaskan, dan badge status kesehatan eMMC.
- **Tabel Temuan Sampah**:
  - Filter kategori: Semua, Orphan, WhatsApp, Cache/Log, APK Mentah, File Besar.
  - Checkbox cerdas: Item kategori `safe` tercentang otomatis; kategori `review` dan `critical` default tidak tercentang.
- **Dialog Dry-Run**: Konfirmasi rincian folder dan total ukuran sebelum eksekusi pembersihan.
- **Generator Laporan Servis**: Tombol 1-klik untuk menyalin ringkasan teks perbandingan memori sebelum vs sesudah pembersihan ke clipboard untuk laporan ke pemilik HP.

---

## 3. ATURAN KEAMANAN & EDGE CASES
- **ADB Timeout Separation**: Fungsi ADB bawaan menggunakan timeout 30s. Modul scanning/cleaning storage wajib memakai timeout khusus yang lebih longgar (60-120s) atau streaming async agar tidak memicu error ADB-1001.
- **Scoped Storage (Android 11+)**: Jangan berasumsi path `/Android/data` selalu bisa dibaca langsung secara rekursif jika tanpa root. Siapkan fallback penanganan error.
- **Variasi Tooling Android (Toybox vs Toolbox)**: Gunakan flag universal (misal `du -k`, bukan `-h` atau `-d` tanpa fallback) agar kompatibel dari Android 7 sampai Android 15.
- **Whitelist Folder Standar**: Jangan pernah menandai folder standar OS (seperti `Documents`, `Music`, `Movies`, `Download`) sebagai orphan.
- **Proteksi Data User di Folder App**: Untuk aplikasi transfer file (seperti SHAREit atau Xender), hanya targetkan subfolder cache/status/thumbnail, jangan menghapus folder unduhan file pengguna.
- **Konsistensi i18n**: Wajib daftarkan semua label, kategori sampah, dan string UI baru ke `src/i18n.ts` (ID & EN), dilarang hardcode string bahasa Indonesia di JSX.

---

## 4. KRITERIA SELESAI (ACCEPTANCE CRITERIA)
1. Fitur dapat membedakan folder orphan dari folder sistem standar tanpa false-positive.
2. Proses hapus folder berisi puluhan ribu file selesai tanpa memicu timeout ADB.
3. Direktori blacklist (DCIM, Pictures, WhatsApp Media utama) terbukti tidak tersentuh saat eksekusi.
4. Performa write eMMC terdeteksi dan memberikan peringatan jika storage lambat.
5. UI mendukung toggle bahasa ID/EN tanpa teks yang pecah/hardcoded.
6. Tombol salin laporan menghasilkan ringkasan teks rapi siap kirim ke WhatsApp.
