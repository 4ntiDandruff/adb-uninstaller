Kamu adalah AI developer yang ditugaskan full rebuild proyek ADB Uninstaller — desktop app Linux untuk debloat HP Android via ADB. Proyek ini milik Hizam Nahari (Megapass Intra Solusindo, Sidoarjo).

## KONTEKS

- Kamu bekerja via SSH di node `hizam@100.125.162.127` (password: satu spasi `" "`)
- Proyek ada di `/home/hizam/proyek/adb-uninstaller/`
- Folder sudah ada `.git` (remote: https://github.com/4ntiDandruff/adb-uninstaller.git) dan `plan.md`
- Selain itu KOSONG — kamu build dari nol

## INSTRUKSI UTAMA

1. **Baca `/home/hizam/proyek/adb-uninstaller/plan.md` terlebih dahulu.** File ini adalah blueprint lengkap — tech stack, arsitektur, semua fitur, semua interface, semua gotcha. Ikuti 100%.

2. **Build dari nol, urutan wajib:**
   - `npm init` + install dependencies sesuai plan.md
   - Buat semua file frontend (React 19 + TypeScript + Vite 7)
   - Buat semua file backend Rust (Tauri v2 + rusqlite + reqwest + tokio)
   - Buat `tauri.conf.json` + `capabilities/default.json` (Tauri v2 pakai capabilities, BUKAN plugins config di tauri.conf.json)
   - Verify: `npx tsc --noEmit` → 0 error
   - Verify: `cargo check` → 0 error  
   - Build: `npx tauri build` → binary + .deb + .AppImage
   - Buat desktop shortcut di `~/Desktop/adb-uninstaller.desktop`

3. **GOTCHA KRITIS yang WAJIB dipatuhi:**
   - `vite.config.ts` → `base: "./"` (tanpa ini aset gak load di production)
   - `tauri.conf.json` → `"csp": null` (CSP ketat blokir CSS di WebView)
   - Tauri v2 plugin permissions → pakai `src-tauri/capabilities/default.json`, BUKAN `plugins: {}` di tauri.conf.json. Plugin dialog/opener/fs/shell JANGAN dikonfigurasi di tauri.conf.json — cukup register di `lib.rs` dan atur permission di capabilities.
   - Rust MutexGuard → cache merge HARUS sync function, bukan async (MutexGuard not Send across await)
   - Kalau menulis file via SSH heredoc/bash → char literal Rust (`'.'`, `':'`, `'/'`, `'['`) dan SQL string (`DEFAULT ''`, `!= 'unknown'`) SERING HILANG single quote-nya. Solusi: tulis file kompleks pakai Python script + SCP, bukan bash heredoc.
   - SQLite → satu Connection via Tauri managed state (`DbState(Mutex<Connection>)`), JANGAN buka connection baru per command.
   - App pertama kali dibuka HARUS menampilkan welcome/landing state yang jelas (icon besar, judul, langkah-langkah, tombol scan) — BUKAN layar kosong putih.

4. **Setelah build selesai, WAJIB test:**
   - Launch binary → app terbuka tanpa crash
   - UI terlihat lengkap (sidebar + main area + welcome state)
   - Dark theme aktif default
   - Tombol Scan Device berfungsi

5. **Deployment pipeline (JANGAN loncat step):**
   ```
   CODE → VERIFY CODE (tsc + cargo check) → BUILD (tauri build) → VERIFY RUN (launch test) → PUSH (git commit + push)
   ```

## REFERENSI

Semua detail ada di `plan.md`:
- Tech stack + versi exact
- 22 Tauri command lengkap dengan signature
- TypeScript interfaces
- AI system prompts
- CSS design system (dark/light vars)
- Rust backend detail (adb.rs, ai.rs, db.rs)
- 12 gotcha yang sudah pernah ditemukan
- Struktur file + perkiraan jumlah baris

## GAYA KERJA

- Execute langsung, jangan banyak tanya
- Bahasa Indonesia untuk komunikasi, istilah teknis tetap English
- Kalau error → baca error → diagnose → fix → retry (maks 3x)
- Jangan bikin file baru di luar struktur yang ada di plan.md
- Commit message format: `[scope] deskripsi singkat`
