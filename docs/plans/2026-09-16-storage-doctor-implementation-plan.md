# Storage Doctor & Deep Cleaner (v2.3.0) Implementation Plan

> **For agentic workers:** Inline execution in sequence with frequent compilation and test passes. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambahkan modul "Storage Doctor & Deep Cleaner" ke ADB Uninstaller untuk scan sampah deep (WhatsApp duplikat, orphan folder, APK mentah), fast cache trim (`pm trim-caches`), benchmark fisik kesehatan eMMC/UFS, dan generator laporan servis WhatsApp pelanggan.

**Architecture:** Modul terisolasi `src-tauri/src/storage.rs` di Rust backend yang memegang seluruh proses scanning & eksekusi Toybox/ADB dengan timeout terpisah (60s) dan blacklist pengaman. Frontend berupa komponen React terisolasi `src/components/StorageDoctor.tsx` yang di-switch via tab header utama di `App.tsx`.

**Tech Stack:** Rust (Tauri v2 + tokio + rusqlite WAL), React 19, Tailwind CSS v4, Lucide SVG, Web Clipboard API.

**Spec:** `/home/hizam/proyek/adb-uninstaller/saranpengembangan.md`

## Global Constraints
- Zero build-step / runtime bloat, colocation rule di React & Rust.
- Wajib timeout khusus storage (60-120s) agar tidak memicu error `[ADB-1001]`.
- Blacklist mutlak anti-salah-hapus: `/`, `/sdcard`, `/sdcard/`, `/storage/emulated/0`, `DCIM`, `Pictures`, `Documents`, `Download` (root).
- Full i18n konsisten (ID & EN) di `src/i18n.ts`, dilarang hardcode teks di JSX.

---

### Task 1: Modul Rust Backend `storage.rs` (Stats, Trim, Benchmark)

**Files:**
- Create: `src-tauri/src/storage.rs`
- Modify: `src-tauri/src/lib.rs`

**Interfaces:**
- Produces:
  - `pub struct StorageStats { total_bytes: u64, free_bytes: u64, used_bytes: u64, percent_used: u8, emmc_write_speed_mbps: f64, emmc_latency_ms: u64, emmc_health: String }`
  - `pub async fn get_storage_stats(device_id: String) -> Result<StorageStats, String>`
  - `pub async fn trim_caches(device_id: String) -> crate::adb::CommandResult`
  - `pub async fn benchmark_storage(device_id: String) -> Result<(f64, u64, String), String>`

- [ ] **Step 1: Buat struct dan fungsi pengaman path blacklist di `storage.rs`**
  Memastikan path yang hendak disentuh aman dari penghapusan fatal.
- [ ] **Step 2: Implementasi `trim_caches`**
  Menjalankan `cmd package trim-caches 999G` atau `pm trim-caches 999G` via ADB.
- [ ] **Step 3: Implementasi `benchmark_storage`**
  Cek `dumpsys diskstats` untuk write speed dan latensi; fallback ke micro-benchmark synthetic `dd if=/dev/zero of=/sdcard/.bench_tmp bs=1M count=8 oflag=dsync`.
- [ ] **Step 4: Daftarkan command di `src-tauri/src/lib.rs`**
  Expose `get_storage_stats`, `trim_caches`, `benchmark_storage` ke Tauri invoke handler.
- [ ] **Step 5: Verifikasi kompilasi backend**
  Jalankan `cargo check` dan unit test di `src-tauri`.

---

### Task 2: Modul Scanner Sampah & Engine Safe Deletion di `storage.rs`

**Files:**
- Modify: `src-tauri/src/storage.rs`
- Modify: `src-tauri/src/lib.rs`

**Interfaces:**
- Produces:
  - `pub struct TrashItem { id: String, category: String, path: String, size_bytes: u64, safety_level: String, description_id: String, description_en: String }`
  - `pub async fn scan_storage_junk(device_id: String, installed_packages: Vec<String>) -> Result<Vec<TrashItem>, String>`
  - `pub async fn delete_junk_items(device_id: String, paths: Vec<String>) -> Result<usize, String>`

- [ ] **Step 1: Scanner WhatsApp Pruning**
  Cek kedua lokasi (`/sdcard/WhatsApp` dan `/sdcard/Android/media/com.whatsapp/WhatsApp/Media`).
  Target: `Sent/` (video/images), `.Statuses/`, dan file backup database harian lama `msgstore-*.db.crypt*` (sisakan 1 backup paling baru).
- [ ] **Step 2: Scanner APK Mentah Download**
  Cari file `.apk` di `/sdcard/Download/` yang sudah terinstall di sistem.
- [ ] **Step 3: Scanner Orphan Directory**
  List folder di root `/sdcard/`, bandingkan dengan whitelist folder sistem standar (`DCIM`, `Pictures`, `Music`, dll.) dan kamus mapping package (`SHAREit`, `KineMaster`, `Snaptube`, `CapCut`).
- [ ] **Step 4: Engine Safe Delete dengan Proteksi Blacklist**
  Loop penghapusan path yang valid, tolak keras bila path mengandung root atau folder yang dilindungi.
- [ ] **Step 5: Daftarkan command di `lib.rs` dan test dengan `cargo test`**

---

### Task 3: Tipe Data TypeScript & API Client

**Files:**
- Modify: `src/types.ts`
- Modify: `src/components/api.ts`

- [ ] **Step 1: Tambahkan tipe TypeScript di `src/types.ts`**
  `StorageStats`, `TrashItem`, `StorageCategory`.
- [ ] **Step 2: Tambahkan API wrapper di `src/components/api.ts`**
  `getStorageStats`, `trimCaches`, `benchmarkStorage`, `scanStorageJunk`, `deleteJunkItems`.
- [ ] **Step 3: Jalankan `npm run typecheck`**
  Pastikan validasi tipe 100% lulus.

---

### Task 4: UI Komponen `StorageDoctor.tsx`

**Files:**
- Create: `src/components/StorageDoctor.tsx`
- Modify: `src/i18n.ts`

- [ ] **Step 1: Tambahkan kamus i18n untuk Storage Doctor di `src/i18n.ts` (ID & EN)**
  Label tabs, kategori sampah, badge kesehatan eMMC, modal dry-run, template laporan WA.
- [ ] **Step 2: Buat Bento Summary Cards**
  - Card 1: Kapasitas storage `/data` (Gauge / Bar visual + Free vs Used).
  - Card 2: Status kesehatan eMMC/UFS (Kecepatan Write MB/s, Latensi ms, Badge: "Sehat" / "Mulai Aus" / "Kritis").
  - Card 3: Tombol Aksi Cepat "Fast Cache Trim" (`pm trim-caches`).
- [ ] **Step 3: Tabel Temuan Sampah & Filter Kategori**
  Filter: Semua, WhatsApp, Orphan, APK Mentah, Cache. Checkbox cerdas: kategori `safe` tercentang otomatis, `review` unchecked.
- [ ] **Step 4: Modal Dry-Run Konfirmasi Sebelum Hapus**
  Tampilkan rincian folder dan total GB yang akan dibebaskan sebelum eksekusi `deleteJunkItems`.
- [ ] **Step 5: Generator Laporan Servis WhatsApp (1-Klik Salin)**
  Memformat teks rapi siap kirim ke WA pelanggan dengan metrik sebelum vs sesudah servis.

---

### Task 5: Integrasi Tab Utama di `src/App.tsx` & Smoke Test

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Tambahkan Navigasi Switcher di Topbar `App.tsx`**
  Pilihan tab `[Aplikasi & Debloat]` dan `[Storage Doctor]`.
- [ ] **Step 2: Render kondisional komponen `StorageDoctor` saat tab aktif**
- [ ] **Step 3: Verifikasi build lengkap**
  `npm run typecheck` ➜ `npm run build` ➜ `cargo check` ➜ `cargo test`.
- [ ] **Step 4: Git commit & push**
