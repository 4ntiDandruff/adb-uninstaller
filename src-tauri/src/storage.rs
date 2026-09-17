use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::time::Instant;

use crate::adb::{format_bytes, run_adb_device, run_adb_device_timeout, timed_result, CommandResult};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StorageStats {
    pub total_bytes: u64,
    pub used_bytes: u64,
    pub free_bytes: u64,
    pub percent_used: u8,
    pub total_formatted: String,
    pub used_formatted: String,
    pub free_formatted: String,
    pub emmc_write_speed_mbps: f64,
    pub emmc_latency_ms: u64,
    pub emmc_health: String, // "good", "warning", "critical", "unknown"
    pub storage_type: String, // "UFS", "eMMC", "Flash"
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrashItem {
    pub id: String,
    pub category: String, // "whatsapp", "orphan", "apk", "cache"
    pub path: String,
    pub name: String,
    pub size_bytes: u64,
    pub size_formatted: String,
    pub safety_level: String, // "safe", "review", "critical"
    pub description_id: String,
    pub description_en: String,
}

pub const FORBIDDEN_ROOTS: &[&str] = &[
    "",
    "/",
    "/sdcard",
    "/sdcard/",
    "/storage/emulated/0",
    "/storage/emulated/0/",
    "/storage",
    "/data",
    "/system",
    "/vendor",
    "/product",
    "/apex",
];

pub const PROTECTED_FOLDERS: &[&str] = &[
    "DCIM",
    "Pictures",
    "Documents",
    "Download",
    "Movies",
    "Music",
    "Ringtones",
    "Alarms",
    "Notifications",
    "Podcasts",
];

pub fn escape_shell_path(path: &str) -> String {
    format!("'{}'", path.replace('\'', "'\\''"))
}

pub fn is_safe_to_delete(path: &str) -> Result<(), String> {
    let clean = path.trim().trim_end_matches('/');
    if clean.is_empty() {
        return Err("[SEC-301] Path target kosong".into());
    }
    // Wajib berada di storage publik pengguna (/sdcard/ atau /storage/emulated/0/)
    if !clean.starts_with("/sdcard/") && !clean.starts_with("/storage/emulated/0/") {
        return Err(format!("[SEC-305] Ditolak: target harus berada di dalam /sdcard/ ({clean})"));
    }
    for root in FORBIDDEN_ROOTS {
        if clean == root.trim_end_matches('/') {
            return Err(format!("[SEC-302] Ditolak: dilarang menghapus root directory ({path})"));
        }
    }
    // Proteksi direktori induk WhatsApp / Telegram / Messenger
    let protected_app_roots = [
        "/sdcard/WhatsApp",
        "/storage/emulated/0/WhatsApp",
        "/sdcard/WhatsApp Business",
        "/storage/emulated/0/WhatsApp Business",
        "/sdcard/Android/media/com.whatsapp",
        "/storage/emulated/0/Android/media/com.whatsapp",
        "/sdcard/Android/media/com.whatsapp/WhatsApp",
        "/storage/emulated/0/Android/media/com.whatsapp/WhatsApp",
        "/sdcard/Android/media/com.whatsapp.w4b",
        "/storage/emulated/0/Android/media/com.whatsapp.w4b",
        "/sdcard/Android/media/com.whatsapp.w4b/WhatsApp Business",
        "/storage/emulated/0/Android/media/com.whatsapp.w4b/WhatsApp Business",
        "/sdcard/Telegram",
        "/storage/emulated/0/Telegram",
        "/sdcard/Android/media/org.telegram.messenger",
        "/storage/emulated/0/Android/media/org.telegram.messenger",
        "/sdcard/Android/media/org.telegram.messenger.web",
        "/storage/emulated/0/Android/media/org.telegram.messenger.web",
        "/sdcard/Android/media/org.thunderdog.challegram",
        "/storage/emulated/0/Android/media/org.thunderdog.challegram",
    ];
    for app_root in protected_app_roots {
        if clean == app_root {
            return Err(format!("[SEC-306] Ditolak: direktori induk aplikasi dilindungi ({clean})"));
        }
    }
    for protected in PROTECTED_FOLDERS {
        let p1 = format!("/sdcard/{protected}");
        let p2 = format!("/storage/emulated/0/{protected}");
        if clean == p1 || clean == p2 {
            return Err(format!("[SEC-303] Ditolak: direktori dilindungi ({protected})"));
        }
    }
    if clean.contains("..") {
        return Err("[SEC-304] Ditolak: path traversal tidak diizinkan".into());
    }
    Ok(())
}

pub async fn detect_storage_type(device_id: &str) -> String {
    // 1. Cek boot devices dari ro.boot.boot_devices atau ro.boot.bootdevice
    if let Ok((out, _, 0)) = run_adb_device(device_id, &["shell", "getprop", "ro.boot.boot_devices"]).await {
        let lower = out.to_lowercase();
        if lower.contains("ufs") {
            return "UFS".to_string();
        } else if lower.contains("mmc") {
            return "eMMC".to_string();
        }
    }
    if let Ok((out, _, 0)) = run_adb_device(device_id, &["shell", "getprop", "ro.boot.bootdevice"]).await {
        let lower = out.to_lowercase();
        if lower.contains("ufs") {
            return "UFS".to_string();
        } else if lower.contains("mmc") {
            return "eMMC".to_string();
        }
    }

    // 2. Cek block devices di /sys/block/
    if let Ok((out, _, 0)) = run_adb_device(device_id, &["shell", "ls -l /sys/block/ 2>/dev/null"]).await {
        let lower = out.to_lowercase();
        if lower.contains("ufshci") || lower.contains("ufs") {
            return "UFS".to_string();
        } else if lower.contains("mmcblk") || lower.contains("mmc") {
            return "eMMC".to_string();
        }
    }

    "Flash".to_string()
}

pub async fn get_storage_stats(device_id: String) -> Result<StorageStats, String> {
    // df -k /data untuk membaca partisi data pengguna
    let (out, err, code) = run_adb_device(&device_id, &["shell", "df", "-k", "/data"]).await?;
    if code != 0 {
        return Err(format!("[STOR-1001] Gagal membaca storage: {err}"));
    }

    let mut total_bytes = 0u64;
    let mut used_bytes = 0u64;
    let mut free_bytes = 0u64;
    let mut percent = 0u8;

    for line in out.lines().skip(1) {
        let cols: Vec<&str> = line.split_whitespace().collect();
        // Kolom standar df -k: Filesystem 1K-blocks Used Available Use% Mounted
        // Biasanya 6 kolom, atau 5 jika filesystem panjang wrap ke baris 1
        if cols.len() >= 5 {
            let offset = if cols.len() >= 6 { 1 } else { 0 };
            let total_kb = cols[offset].parse::<u64>().unwrap_or(0);
            let used_kb = cols[offset + 1].parse::<u64>().unwrap_or(0);
            let free_kb = cols[offset + 2].parse::<u64>().unwrap_or(0);

            if total_kb > 0 {
                total_bytes = total_kb * 1024;
                used_bytes = used_kb * 1024;
                free_bytes = free_kb * 1024;
                percent = ((used_bytes as f64 / total_bytes as f64) * 100.0).round() as u8;
                break;
            }
        }
    }

    if total_bytes == 0 {
        return Err("[STOR-1002] Gagal parsing kapasitas storage".into());
    }

    Ok(StorageStats {
        total_bytes,
        used_bytes,
        free_bytes,
        percent_used: percent,
        total_formatted: format_bytes(total_bytes),
        used_formatted: format_bytes(used_bytes),
        free_formatted: format_bytes(free_bytes),
        emmc_write_speed_mbps: 0.0,
        emmc_latency_ms: 0,
        emmc_health: "unknown".into(),
        storage_type: detect_storage_type(&device_id).await,
    })
}

pub async fn trim_caches(device_id: String) -> CommandResult {
    let start = Instant::now();
    // Coba pm trim-caches 999G dulu
    let (_out, err, code) = run_adb_device(&device_id, &["shell", "pm", "trim-caches", "999G"]).await
        .unwrap_or_else(|e| (String::new(), e, -1));

    if code == 0 {
        return timed_result(start, true, "Global cache berhasil di-trim".into(), None);
    }

    // Fallback: cmd package trim-caches 999G (Android modern)
    let (out2, err2, code2) = run_adb_device(&device_id, &["shell", "cmd", "package", "trim-caches", "999G"]).await
        .unwrap_or_else(|e| (String::new(), e, -1));

    if code2 == 0 {
        timed_result(start, true, "Global cache berhasil di-trim".into(), None)
    } else {
        timed_result(start, false, out2, Some(format!("[STOR-1003] Trim cache gagal: {err} | {err2}")))
    }
}

pub async fn benchmark_storage(device_id: String) -> Result<StorageStats, String> {
    let mut stats = get_storage_stats(device_id.clone()).await?;

    // Micro-benchmark fisik via dd: tulis 8MB dengan conv=fsync (kompatibel penuh dengan Toybox Android)
    let cmd = "dd if=/dev/zero of=/sdcard/.megapass_bench bs=1M count=8 conv=fsync 2>&1 && rm -f /sdcard/.megapass_bench";
    let start = Instant::now();
    let (out, _, code) = run_adb_device(&device_id, &["shell", cmd]).await
        .unwrap_or_default();
    let elapsed_ms = start.elapsed().as_millis() as u64;

    // Parsing kecepatan dari output dd:
    // Format Toybox Android: "8388608 bytes (8.0 M) copied, 0.049 s, 163 M/s"
    // Format GNU dd: "8388608 bytes (8.4 MB, 8.0 MiB) copied, 0.21 s, 39.9 MB/s"
    let mut speed_mbps = 0.0;
    for part in out.split(',') {
        let p = part.trim();
        if let Some(num_str) = p.strip_suffix("GB/s").or_else(|| p.strip_suffix("G/s")) {
            speed_mbps = num_str.trim().parse::<f64>().unwrap_or(0.0) * 1024.0;
        } else if let Some(num_str) = p.strip_suffix("MB/s").or_else(|| p.strip_suffix("M/s")) {
            speed_mbps = num_str.trim().parse::<f64>().unwrap_or(0.0);
        } else if let Some(num_str) = p.strip_suffix("kB/s").or_else(|| p.strip_suffix("KB/s")).or_else(|| p.strip_suffix("k/s")).or_else(|| p.strip_suffix("K/s")) {
            speed_mbps = num_str.trim().parse::<f64>().unwrap_or(0.0) / 1024.0;
        }
    }

    // Jika dd berhasil tapi tidak cetak speed rate, hitung manual dari 8MB / elapsed
    if speed_mbps == 0.0 && elapsed_ms > 0 && (code == 0 || out.contains("copied")) {
        speed_mbps = (8.0 / (elapsed_ms as f64 / 1000.0) * 10.0).round() / 10.0;
    }

    // Evaluasi kesehatan adaptif: UFS vs eMMC
    let is_ufs = stats.storage_type.to_uppercase().contains("UFS");
    let health = if is_ufs {
        if speed_mbps >= 60.0 {
            "good".to_string()
        } else if speed_mbps >= 25.0 {
            "warning".to_string()
        } else if speed_mbps > 0.0 {
            "critical".to_string()
        } else {
            "unknown".to_string()
        }
    } else {
        if speed_mbps >= 25.0 {
            "good".to_string()
        } else if speed_mbps >= 8.0 {
            "warning".to_string()
        } else if speed_mbps > 0.0 {
            "critical".to_string()
        } else {
            "unknown".to_string()
        }
    };

    stats.emmc_write_speed_mbps = (speed_mbps * 10.0).round() / 10.0;
    stats.emmc_latency_ms = elapsed_ms;
    stats.emmc_health = health;

    Ok(stats)
}

async fn get_path_size_bytes(device_id: &str, path: &str) -> u64 {
    // Jalankan du -sk <path> (output dalam KB)
    let quoted = escape_shell_path(path);
    if let Ok((out, _, 0)) = run_adb_device(device_id, &["shell", "du", "-sk", &quoted]).await {
        if let Some(first) = out.split_whitespace().next() {
            if let Ok(kb) = first.parse::<u64>() {
                return kb * 1024;
            }
        }
    }
    0
}

pub async fn scan_storage_junk(
    device_id: String,
    installed_packages: Vec<String>,
) -> Result<Vec<TrashItem>, String> {
    let mut items = Vec::new();
    let installed_set: HashSet<String> = installed_packages.into_iter().collect();

    // 1. WhatsApp Pruner
    let wa_bases = [
        ("/sdcard/Android/media/com.whatsapp/WhatsApp", "WhatsApp"),
        ("/sdcard/WhatsApp", "WhatsApp"),
        ("/sdcard/Android/media/com.whatsapp.w4b/WhatsApp Business", "WhatsApp Business"),
        ("/sdcard/WhatsApp Business", "WhatsApp Business"),
    ];

    for (wa, wa_label) in wa_bases {
        // Cek Sent Videos
        let sent_video = format!("{wa}/Media/WhatsApp Video/Sent");
        let sz_vid = get_path_size_bytes(&device_id, &sent_video).await;
        if sz_vid > 1024 * 1024 {
            items.push(TrashItem {
                id: format!("wa_sent_video_{}", items.len()),
                category: "whatsapp".into(),
                path: sent_video,
                name: format!("{wa_label} Video Sent"),
                size_bytes: sz_vid,
                size_formatted: format_bytes(sz_vid),
                safety_level: "safe".into(),
                description_id: "Duplikat video yang pernah dikirim via WhatsApp".into(),
                description_en: "Sent videos duplicate in WhatsApp".into(),
            });
        }

        // Cek Sent Images
        let sent_img = format!("{wa}/Media/WhatsApp Images/Sent");
        let sz_img = get_path_size_bytes(&device_id, &sent_img).await;
        if sz_img > 1024 * 1024 {
            items.push(TrashItem {
                id: format!("wa_sent_img_{}", items.len()),
                category: "whatsapp".into(),
                path: sent_img,
                name: format!("{wa_label} Images Sent"),
                size_bytes: sz_img,
                size_formatted: format_bytes(sz_img),
                safety_level: "safe".into(),
                description_id: "Duplikat foto yang pernah dikirim via WhatsApp".into(),
                description_en: "Sent images duplicate in WhatsApp".into(),
            });
        }

        // Cek Statuses Cache
        let statuses = format!("{wa}/Media/.Statuses");
        let sz_stat = get_path_size_bytes(&device_id, &statuses).await;
        if sz_stat > 1024 * 512 {
            items.push(TrashItem {
                id: format!("wa_statuses_{}", items.len()),
                category: "whatsapp".into(),
                path: statuses,
                name: format!("{wa_label} Status Cache"),
                size_bytes: sz_stat,
                size_formatted: format_bytes(sz_stat),
                safety_level: "safe".into(),
                description_id: "Cache status kontak WhatsApp yang sudah kedaluwarsa".into(),
                description_en: "Expired contact WhatsApp statuses cache".into(),
            });
        }

        // Cek Daily Backups Databases (msgstore-*.db.crypt*)
        let db_dir = format!("{wa}/Databases");
        let quoted_db = escape_shell_path(&db_dir);
        if let Ok((out, _, 0)) = run_adb_device(&device_id, &["shell", "ls", "-1", &quoted_db]).await {
            let mut backup_files: Vec<String> = out
                .lines()
                .map(|l| l.trim().to_string())
                .filter(|l| l.starts_with("msgstore-") && l.contains(".db.crypt"))
                .collect();

            // Urutkan ascending agar backup paling baru ada di posisi terakhir
            backup_files.sort();

            // Sisakan 1 backup harian terbaru; hapus backup lama yang menumpuk
            if backup_files.len() > 1 {
                let to_remove = &backup_files[..backup_files.len() - 1];
                for file in to_remove {
                    let file_path = format!("{db_dir}/{file}");
                    let sz_file = get_path_size_bytes(&device_id, &file_path).await;
                    items.push(TrashItem {
                        id: format!("wa_db_{}", items.len()),
                        category: "whatsapp".into(),
                        path: file_path,
                        name: file.clone(),
                        size_bytes: sz_file,
                        size_formatted: format_bytes(sz_file),
                        safety_level: "safe".into(),
                        description_id: "Backup chat WhatsApp lama (backup terbaru tetap aman disimpan)".into(),
                        description_en: "Old WhatsApp backup archive (latest backup is preserved)".into(),
                    });
                }
            }
        }
        // Jika sudah ketemu salah satu path WA aktif, tidak perlu scan path lama
        if sz_vid > 0 || sz_img > 0 || sz_stat > 0 {
            break;
        }
    }

    // 2. Telegram Media Pruner
    let tg_bases = [
        ("/sdcard/Android/media/org.telegram.messenger/Telegram", "Telegram"),
        ("/sdcard/Telegram", "Telegram"),
        ("/sdcard/Android/media/org.thunderdog.challegram/Telegram", "Telegram X"),
        ("/sdcard/Android/media/org.telegram.messenger.web/Telegram", "Telegram Web"),
    ];

    for (tg, tg_label) in tg_bases {
        let tg_subdirs = [
            ("Telegram Video", "video", "Duplikat video unduhan Telegram"),
            ("Telegram Documents", "dokumen", "File dokumen/arsip unduhan Telegram"),
            ("Telegram Audio", "audio", "File audio/voice note unduhan Telegram"),
        ];

        let mut found_tg = false;
        for (sub, kind, desc) in tg_subdirs {
            let p = format!("{tg}/{sub}");
            let sz = get_path_size_bytes(&device_id, &p).await;
            if sz > 1024 * 1024 {
                found_tg = true;
                items.push(TrashItem {
                    id: format!("tg_{}_{}", kind, items.len()),
                    category: "telegram".into(),
                    path: p,
                    name: format!("{tg_label} {sub}"),
                    size_bytes: sz,
                    size_formatted: format_bytes(sz),
                    safety_level: "safe".into(),
                    description_id: desc.into(),
                    description_en: format!("Telegram downloaded {kind} cache bloat"),
                });
            }
        }
        if found_tg {
            break;
        }
    }

    // 3. Vendor Logs & Crash Dumps
    let vendor_log_dirs = [
        ("/sdcard/MIUI/debug_log", "MIUI Debug Logs"),
        ("/sdcard/ColorOS/Log", "ColorOS / Realme Logs"),
        ("/sdcard/Transsion/log", "Infinix / Tecno Logs"),
        ("/sdcard/vivo/log", "Vivo Funtouch Logs"),
        ("/sdcard/logs", "System Diagnostic Logs"),
        ("/sdcard/log", "System Dump Logs"),
    ];

    for (ld, label) in vendor_log_dirs {
        let sz = get_path_size_bytes(&device_id, ld).await;
        if sz > 1024 * 512 {
            items.push(TrashItem {
                id: format!("log_{}", items.len()),
                category: "logs".into(),
                path: ld.to_string(),
                name: label.to_string(),
                size_bytes: sz,
                size_formatted: format_bytes(sz),
                safety_level: "safe".into(),
                description_id: "Log sistem & crash dump pabrikan yang menumpuk di memori".into(),
                description_en: "Manufacturer system logging and crash dumps".into(),
            });
        }
    }

    // 2. Thumbnail Cache (.thumbnails)
    let thumb_paths = ["/sdcard/DCIM/.thumbnails", "/sdcard/.thumbnails"];
    for tp in thumb_paths {
        let sz = get_path_size_bytes(&device_id, tp).await;
        if sz > 1024 * 1024 * 5 {
            items.push(TrashItem {
                id: format!("thumb_{}", items.len()),
                category: "cache".into(),
                path: tp.to_string(),
                name: "Thumbnail Cache".into(),
                size_bytes: sz,
                size_formatted: format_bytes(sz),
                safety_level: "safe".into(),
                description_id: "Cache pratinjau thumbnail galeri yang membengkak".into(),
                description_en: "Gallery thumbnail cache bloat".into(),
            });
        }
    }

    // 3. Raw APK Installers di Download Folder
    if let Ok((out, _, 0)) = run_adb_device(&device_id, &["shell", "find", "/sdcard/Download", "-maxdepth", "2", "-name", "*.apk"]).await {
        for line in out.lines() {
            let apk_path = line.trim();
            if apk_path.is_empty() {
                continue;
            }
            let sz = get_path_size_bytes(&device_id, apk_path).await;
            let file_name = apk_path.rsplit('/').next().unwrap_or("app.apk");
            items.push(TrashItem {
                id: format!("apk_{}", items.len()),
                category: "apk".into(),
                path: apk_path.to_string(),
                name: file_name.to_string(),
                size_bytes: sz,
                size_formatted: format_bytes(sz),
                safety_level: "review".into(),
                description_id: "File installer APK mentah di folder Download".into(),
                description_en: "Raw APK installer package in Download folder".into(),
            });
        }
    }

    // 4. Orphan Directory Scanner di Root /sdcard/
    let known_folder_map = [
        ("SHAREit", "com.lenovo.anyshare.gps"),
        ("Xender", "cn.xender"),
        ("Snaptube", "com.snaptube.premium"),
        ("Vidmate", "com.nemo.vidmate"),
        ("KineMaster", "com.nexstreaming.app.kinemasterfree"),
        ("CapCut", "com.lemon.lvoverseas"),
        ("UCDownloads", "com.UCMobile.intl"),
        ("cleanmaster", "com.cleanmaster.mguard"),
        ("TikTok", "com.zhiliaoapp.musically"),
        ("Likee", "video.like"),
        ("Helo", "com.eterno.helo"),
        ("DUrecorder", "com.duapps.recorder"),
        ("InShot", "com.camerasideas.instashot"),
        ("VivaVideo", "com.quvideo.xiaoying"),
        ("baidu", "com.baidu.searchbox"),
    ];

    if let Ok((out, _, 0)) = run_adb_device(&device_id, &["shell", "ls", "-1", "/sdcard"]).await {
        for line in out.lines() {
            let dir_name = line.trim().trim_end_matches('/');
            if dir_name.is_empty() || dir_name.starts_with('.') {
                continue;
            }

            // Abaikan folder standar OS
            if PROTECTED_FOLDERS.contains(&dir_name) || dir_name == "Android" || dir_name == "MIUI" {
                continue;
            }

            // Periksa apakah folder ini milik aplikasi yang sudah dihapus
            let mut is_orphan = false;
            let mut matched_app = "";

            for (f_name, pkg) in known_folder_map {
                if dir_name.eq_ignore_ascii_case(f_name) {
                    if !installed_set.contains(pkg) {
                        is_orphan = true;
                        matched_app = f_name;
                    }
                    break;
                }
            }

            if is_orphan {
                let full_path = format!("/sdcard/{dir_name}");
                let sz = get_path_size_bytes(&device_id, &full_path).await;
                if sz > 1024 * 1024 {
                    items.push(TrashItem {
                        id: format!("orphan_{}", items.len()),
                        category: "orphan".into(),
                        path: full_path,
                        name: dir_name.to_string(),
                        size_bytes: sz,
                        size_formatted: format_bytes(sz),
                        safety_level: "safe".into(),
                        description_id: format!("Folder zombie sisa {matched_app} yang sudah di-uninstall"),
                        description_en: format!("Residual orphan folder from uninstalled {matched_app}"),
                    });
                }
            }
        }
    }

    Ok(items)
}

pub async fn delete_junk_items(device_id: String, paths: Vec<String>) -> Result<usize, String> {
    let mut count = 0;
    for path in &paths {
        is_safe_to_delete(path)?;
    }

    for path in paths {
        let quoted = escape_shell_path(&path);
        // Timeout 180 detik untuk operasi hapus massal (WhatsApp Sent / Telegram cache berisi ribuan file FUSE)
        let (out, err, code) = run_adb_device_timeout(&device_id, &["shell", "rm", "-rf", &quoted], 180).await
            .map_err(|e| format!("[STOR-2001] Gagal eksekusi hapus: {e}"))?;
        if code != 0 {
            return Err(format!("[STOR-2002] Gagal hapus {path}: {err} {out}"));
        }
        count += 1;
    }
    Ok(count)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_escape_shell_path() {
        assert_eq!(escape_shell_path("/sdcard/WhatsApp/Media/WhatsApp Video/Sent"), "'/sdcard/WhatsApp/Media/WhatsApp Video/Sent'");
        assert_eq!(escape_shell_path("/sdcard/test'quote"), "'/sdcard/test'\\''quote'");
    }

    #[test]
    fn test_is_safe_to_delete_blocks_dangerous_roots() {
        assert!(is_safe_to_delete("/").is_err());
        assert!(is_safe_to_delete("/sdcard").is_err());
        assert!(is_safe_to_delete("/sdcard/").is_err());
        assert!(is_safe_to_delete("/storage/emulated/0").is_err());
        assert!(is_safe_to_delete("/sdcard/DCIM").is_err());
        assert!(is_safe_to_delete("/sdcard/Pictures").is_err());
        assert!(is_safe_to_delete("/sdcard/Documents").is_err());
        assert!(is_safe_to_delete("/sdcard/WhatsApp").is_err());
        assert!(is_safe_to_delete("/sdcard/WhatsApp Business").is_err());
        assert!(is_safe_to_delete("/sdcard/Android/media/com.whatsapp").is_err());
        assert!(is_safe_to_delete("/sdcard/Telegram").is_err());
        assert!(is_safe_to_delete("/sdcard/Telegram/Telegram Video").is_ok());
        assert!(is_safe_to_delete("/data/app").is_err());
        assert!(is_safe_to_delete("/sdcard/foo/../DCIM").is_err());

        // Allowed paths
        assert!(is_safe_to_delete("/sdcard/Android/media/com.whatsapp/WhatsApp/Media/WhatsApp Video/Sent").is_ok());
        assert!(is_safe_to_delete("/sdcard/DCIM/.thumbnails").is_ok());
        assert!(is_safe_to_delete("/sdcard/Download/test.apk").is_ok());
        assert!(is_safe_to_delete("/sdcard/SHAREit").is_ok());
    }
}
