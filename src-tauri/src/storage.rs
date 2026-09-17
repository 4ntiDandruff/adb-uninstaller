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
    pub category: String, // "whatsapp", "telegram", "orphan", "apk", "cache", "logs"
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
    "/storage/",
    "/data",
    "/system",
    "/vendor",
    "/product",
    "/apex",
    "/sdcard/Android",
    "/storage/emulated/0/Android",
    "/sdcard/Android/data",
    "/storage/emulated/0/Android/data",
    "/sdcard/Android/media",
    "/storage/emulated/0/Android/media",
    "/sdcard/Android/obb",
    "/storage/emulated/0/Android/obb",
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
    "Audiobooks",
    "Recordings",
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
        "/sdcard/Android/data/org.telegram.messenger",
        "/storage/emulated/0/Android/data/org.telegram.messenger",
        "/sdcard/Android/data/org.telegram.messenger/files",
        "/storage/emulated/0/Android/data/org.telegram.messenger/files",
        "/sdcard/Android/data/org.telegram.messenger/files/Telegram",
        "/storage/emulated/0/Android/data/org.telegram.messenger/files/Telegram",
        "/sdcard/Android/data/org.telegram.messenger.web",
        "/storage/emulated/0/Android/data/org.telegram.messenger.web",
        "/sdcard/Android/data/org.telegram.messenger.web/files",
        "/storage/emulated/0/Android/data/org.telegram.messenger.web/files",
        "/sdcard/Android/data/org.telegram.messenger.web/files/Telegram",
        "/storage/emulated/0/Android/data/org.telegram.messenger.web/files/Telegram",
        "/sdcard/Android/data/org.thunderdog.challegram",
        "/storage/emulated/0/Android/data/org.thunderdog.challegram",
        "/sdcard/Android/data/org.thunderdog.challegram/files",
        "/storage/emulated/0/Android/data/org.thunderdog.challegram/files",
        "/sdcard/Android/data/org.telegram.plus",
        "/storage/emulated/0/Android/data/org.telegram.plus",
        "/sdcard/Android/data/nekox.messenger",
        "/storage/emulated/0/Android/data/nekox.messenger",
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
        if speed_mbps >= 20.0 {
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
    let mut seen_paths: HashSet<String> = HashSet::new();
    let installed_set: HashSet<String> = installed_packages.into_iter().collect();

    // 1. WhatsApp Pruner
    let wa_bases = [
        ("/sdcard/Android/media/com.whatsapp/WhatsApp", "WhatsApp"),
        ("/sdcard/WhatsApp", "WhatsApp"),
        ("/sdcard/Android/media/com.whatsapp.w4b/WhatsApp Business", "WhatsApp Business"),
        ("/sdcard/WhatsApp Business", "WhatsApp Business"),
    ];

    for (wa, wa_label) in wa_bases {
        // Cek Sent Videos (> 1MB)
        let sent_video = format!("{wa}/Media/WhatsApp Video/Sent");
        if !seen_paths.contains(&sent_video) {
            let sz_vid = get_path_size_bytes(&device_id, &sent_video).await;
            if sz_vid > 1024 * 1024 {
                seen_paths.insert(sent_video.clone());
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
        }

        // Cek Sent Images (> 1MB)
        let sent_img = format!("{wa}/Media/WhatsApp Images/Sent");
        if !seen_paths.contains(&sent_img) {
            let sz_img = get_path_size_bytes(&device_id, &sent_img).await;
            if sz_img > 1024 * 1024 {
                seen_paths.insert(sent_img.clone());
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
        }

        // Cek Sent Documents (> 1MB)
        let sent_doc = format!("{wa}/Media/WhatsApp Documents/Sent");
        if !seen_paths.contains(&sent_doc) {
            let sz_doc = get_path_size_bytes(&device_id, &sent_doc).await;
            if sz_doc > 1024 * 1024 {
                seen_paths.insert(sent_doc.clone());
                items.push(TrashItem {
                    id: format!("wa_sent_doc_{}", items.len()),
                    category: "whatsapp".into(),
                    path: sent_doc,
                    name: format!("{wa_label} Dokumen Sent"),
                    size_bytes: sz_doc,
                    size_formatted: format_bytes(sz_doc),
                    safety_level: "safe".into(),
                    description_id: "Duplikat berkas dokumen yang pernah dikirim via WhatsApp".into(),
                    description_en: "Sent documents duplicate in WhatsApp".into(),
                });
            }
        }

        // Cek Sent Audio (> 512KB)
        let sent_aud = format!("{wa}/Media/WhatsApp Audio/Sent");
        if !seen_paths.contains(&sent_aud) {
            let sz_aud = get_path_size_bytes(&device_id, &sent_aud).await;
            if sz_aud > 1024 * 512 {
                seen_paths.insert(sent_aud.clone());
                items.push(TrashItem {
                    id: format!("wa_sent_aud_{}", items.len()),
                    category: "whatsapp".into(),
                    path: sent_aud,
                    name: format!("{wa_label} Audio Sent"),
                    size_bytes: sz_aud,
                    size_formatted: format_bytes(sz_aud),
                    safety_level: "safe".into(),
                    description_id: "Duplikat berkas audio/musik yang pernah dikirim via WhatsApp".into(),
                    description_en: "Sent audio duplicates in WhatsApp".into(),
                });
            }
        }

        // Cek Voice Notes (> 1MB)
        let voice_notes = format!("{wa}/Media/WhatsApp Voice Notes");
        if !seen_paths.contains(&voice_notes) {
            let sz_vn = get_path_size_bytes(&device_id, &voice_notes).await;
            if sz_vn > 1024 * 1024 {
                seen_paths.insert(voice_notes.clone());
                items.push(TrashItem {
                    id: format!("wa_voice_notes_{}", items.len()),
                    category: "whatsapp".into(),
                    path: voice_notes,
                    name: format!("{wa_label} Voice Notes"),
                    size_bytes: sz_vn,
                    size_formatted: format_bytes(sz_vn),
                    safety_level: "safe".into(),
                    description_id: "Koleksi rekaman pesan suara WhatsApp lama yang menumpuk".into(),
                    description_en: "Old WhatsApp voice notes audio cache".into(),
                });
            }
        }

        // Cek Sent Animated GIFs (> 512KB)
        let sent_gif = format!("{wa}/Media/WhatsApp Animated Gifs/Sent");
        if !seen_paths.contains(&sent_gif) {
            let sz_gif = get_path_size_bytes(&device_id, &sent_gif).await;
            if sz_gif > 1024 * 512 {
                seen_paths.insert(sent_gif.clone());
                items.push(TrashItem {
                    id: format!("wa_sent_gif_{}", items.len()),
                    category: "whatsapp".into(),
                    path: sent_gif,
                    name: format!("{wa_label} GIF Sent"),
                    size_bytes: sz_gif,
                    size_formatted: format_bytes(sz_gif),
                    safety_level: "safe".into(),
                    description_id: "Duplikat animasi GIF yang pernah dikirim via WhatsApp".into(),
                    description_en: "Sent animated GIFs duplicate in WhatsApp".into(),
                });
            }
        }

        // Cek Link Preview Cache (.Links) (> 1MB)
        let links_cache = format!("{wa}/Media/.Links");
        if !seen_paths.contains(&links_cache) {
            let sz_links = get_path_size_bytes(&device_id, &links_cache).await;
            if sz_links > 1024 * 1024 {
                seen_paths.insert(links_cache.clone());
                items.push(TrashItem {
                    id: format!("wa_links_{}", items.len()),
                    category: "whatsapp".into(),
                    path: links_cache,
                    name: format!("{wa_label} Link Preview Cache"),
                    size_bytes: sz_links,
                    size_formatted: format_bytes(sz_links),
                    safety_level: "safe".into(),
                    description_id: "Cache pratinjau tautan web WhatsApp yang membengkak".into(),
                    description_en: "WhatsApp web link preview thumbnail cache".into(),
                });
            }
        }

        // Cek Media Optimizer Cache (.wamocache) (> 512KB)
        let wamo_cache = format!("{wa}/Media/.wamocache");
        if !seen_paths.contains(&wamo_cache) {
            let sz_wamo = get_path_size_bytes(&device_id, &wamo_cache).await;
            if sz_wamo > 1024 * 512 {
                seen_paths.insert(wamo_cache.clone());
                items.push(TrashItem {
                    id: format!("wa_wamo_{}", items.len()),
                    category: "whatsapp".into(),
                    path: wamo_cache,
                    name: format!("{wa_label} Media Optimizer Cache"),
                    size_bytes: sz_wamo,
                    size_formatted: format_bytes(sz_wamo),
                    safety_level: "safe".into(),
                    description_id: "Cache sementara optimasi pengiriman media WhatsApp".into(),
                    description_en: "WhatsApp media optimizer temporary cache".into(),
                });
            }
        }

        // Cek Statuses Cache (> 512KB)
        let statuses = format!("{wa}/Media/.Statuses");
        if !seen_paths.contains(&statuses) {
            let sz_stat = get_path_size_bytes(&device_id, &statuses).await;
            if sz_stat > 1024 * 512 {
                seen_paths.insert(statuses.clone());
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
                    if !seen_paths.contains(&file_path) {
                        let sz_file = get_path_size_bytes(&device_id, &file_path).await;
                        seen_paths.insert(file_path.clone());
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
        }
    }

    // 2. Telegram Media & Cache Pruner
    let tg_media_bases = [
        // Modern scoped storage (Android 11+)
        ("/sdcard/Android/data/org.telegram.messenger/files/Telegram", "Telegram"),
        ("/sdcard/Android/data/org.telegram.messenger.web/files/Telegram", "Telegram Web"),
        ("/sdcard/Android/data/org.thunderdog.challegram/files", "Telegram X"),
        ("/sdcard/Android/data/org.telegram.plus/files/Telegram", "Telegram Plus"),
        ("/sdcard/Android/data/nekox.messenger/files/Telegram", "Nekogram"),
        // Scoped media
        ("/sdcard/Android/media/org.telegram.messenger/Telegram", "Telegram"),
        ("/sdcard/Android/media/org.telegram.messenger.web/Telegram", "Telegram Web"),
        ("/sdcard/Android/media/org.thunderdog.challegram/Telegram", "Telegram X"),
        // Legacy
        ("/sdcard/Telegram", "Telegram"),
    ];

    let tg_subdirs = [
        ("Telegram Images", "images", "Cache file foto dan gambar unduhan Telegram", 1024 * 512),
        ("Telegram Video", "video", "Duplikat video unduhan Telegram", 1024 * 1024),
        ("Telegram Documents", "dokumen", "File dokumen dan arsip unduhan Telegram", 1024 * 512),
        ("Telegram Files", "files", "File attachment dan berkas unduhan Telegram", 1024 * 512),
        ("Telegram Audio", "audio", "File audio dan rekaman suara unduhan Telegram", 1024 * 512),
        ("Telegram Stories", "stories", "Cache preview story Telegram", 1024 * 512),
    ];

    for (tg_base, tg_label) in tg_media_bases {
        for (sub, kind, desc, min_size) in tg_subdirs {
            let p = format!("{tg_base}/{sub}");
            if !seen_paths.contains(&p) {
                let sz = get_path_size_bytes(&device_id, &p).await;
                if sz > min_size {
                    seen_paths.insert(p.clone());
                    let clean_sub = sub.strip_prefix("Telegram ").unwrap_or(sub);
                    let item_name = format!("{tg_label} {clean_sub}");
                    items.push(TrashItem {
                        id: format!("tg_{}_{}", kind, items.len()),
                        category: "telegram".into(),
                        path: p,
                        name: item_name,
                        size_bytes: sz,
                        size_formatted: format_bytes(sz),
                        safety_level: "safe".into(),
                        description_id: desc.into(),
                        description_en: format!("Telegram downloaded {kind} cache bloat"),
                    });
                }
            }
        }
    }

    // Telegram App Cache Folders (particle animation, webviews, cached thumbs)
    let tg_cache_dirs = [
        ("/sdcard/Android/data/org.telegram.messenger/cache", "Telegram"),
        ("/sdcard/Android/data/org.telegram.messenger.web/cache", "Telegram Web"),
        ("/sdcard/Android/data/org.thunderdog.challegram/cache", "Telegram X"),
        ("/sdcard/Android/data/org.telegram.plus/cache", "Telegram Plus"),
        ("/sdcard/Android/data/nekox.messenger/cache", "Nekogram"),
    ];

    for (cache_dir, tg_label) in tg_cache_dirs {
        if !seen_paths.contains(cache_dir) {
            let sz = get_path_size_bytes(&device_id, cache_dir).await;
            if sz > 1024 * 1024 {
                seen_paths.insert(cache_dir.to_string());
                items.push(TrashItem {
                    id: format!("tg_cache_{}", items.len()),
                    category: "telegram".into(),
                    path: cache_dir.to_string(),
                    name: format!("{tg_label} App Cache"),
                    size_bytes: sz,
                    size_formatted: format_bytes(sz),
                    safety_level: "safe".into(),
                    description_id: "Cache sementara particle animasi dan webview Telegram".into(),
                    description_en: "Telegram temporary animation and webview cache".into(),
                });
            }
        }
    }

    // 3. OEM Gallery & System Trash / Recycle Bins
    let oem_trash_dirs = [
        // Transsion (Infinix / Tecno / Itel)
        ("/sdcard/.trashBin", "Tempat Sampah Galeri (Transsion)", "Foto & video yang dibuang ke recycle bin galeri Infinix/Tecno"),
        ("/sdcard/.trashBin_File", "Tempat Sampah File (Transsion)", "Berkas file yang dibuang ke recycle bin file manager Infinix/Tecno"),
        // Xiaomi / Poco / Redmi (MIUI & HyperOS)
        ("/sdcard/MIUI/Gallery/cloud/.trashBin", "Tempat Sampah Galeri MIUI", "Foto & video yang dihapus ke recycle bin galeri Xiaomi"),
        ("/sdcard/MIUI/Gallery/cloud/trashBin", "Tempat Sampah Galeri HyperOS", "Foto & video recycle bin galeri Xiaomi/Poco"),
        ("/sdcard/MIUI/trash", "Tempat Sampah File MIUI", "Berkas file recycle bin MIUI File Manager"),
        // Samsung One UI
        ("/sdcard/Android/data/com.sec.android.gallery3d/files/trash", "Tempat Sampah Galeri Samsung", "Foto & video recycle bin Galeri Samsung"),
        ("/sdcard/Android/data/com.samsung.android.video/files/trash", "Tempat Sampah Video Samsung", "Video recycle bin Samsung Video Player"),
        ("/sdcard/Android/data/com.sec.android.app.myfiles/files/trash", "Tempat Sampah My Files Samsung", "File recycle bin Samsung My Files"),
        // OPPO / Realme / OnePlus (ColorOS / Realme UI / OxygenOS)
        ("/sdcard/Android/data/com.coloros.gallery3d/files/recycle", "Tempat Sampah Galeri ColorOS", "Foto & video recycle bin Galeri Oppo/Realme"),
        ("/sdcard/Android/data/com.oplus.gallery/files/recycle", "Tempat Sampah Galeri Oplus", "Foto & video recycle bin Galeri OnePlus/Realme"),
        ("/sdcard/Android/data/com.coloros.filemanager/files/recycle", "Tempat Sampah File ColorOS", "File recycle bin File Manager ColorOS"),
        // Vivo / iQOO (Funtouch OS / OriginOS)
        ("/sdcard/Android/data/com.vivo.gallery/files/recycle", "Tempat Sampah Galeri Vivo", "Foto & video recycle bin Galeri Vivo/iQOO"),
        ("/sdcard/Android/data/com.vivo.FileManager/files/recycle", "Tempat Sampah File Vivo", "File recycle bin Vivo File Manager"),
        // Generic Trashes
        ("/sdcard/.trashes", "Android Trashes Directory", "Tempat sampah recycle bin eksternal"),
        ("/sdcard/.Trash", "Linux/Android Trash Directory", "Tempat sampah recycle bin tersembunyi"),
        ("/sdcard/.Trash-1000", "Desktop Trash MTP", "Tempat sampah sisa koneksi desktop MTP"),
    ];

    for (trash_dir, label, desc) in oem_trash_dirs {
        if !seen_paths.contains(trash_dir) {
            let sz = get_path_size_bytes(&device_id, trash_dir).await;
            if sz > 1024 * 512 {
                seen_paths.insert(trash_dir.to_string());
                items.push(TrashItem {
                    id: format!("trash_{}", items.len()),
                    category: "cache".into(),
                    path: trash_dir.to_string(),
                    name: label.to_string(),
                    size_bytes: sz,
                    size_formatted: format_bytes(sz),
                    safety_level: "safe".into(),
                    description_id: desc.to_string(),
                    description_en: "OEM gallery or system recycle bin cache".into(),
                });
            }
        }
    }

    // 4. Vendor Logs & Crash Dumps
    let vendor_log_dirs = [
        ("/sdcard/MIUI/debug_log", "MIUI Debug Logs"),
        ("/sdcard/ColorOS/Log", "ColorOS / Realme Logs"),
        ("/sdcard/Transsion/log", "Infinix / Tecno Logs"),
        ("/sdcard/vivo/log", "Vivo Funtouch Logs"),
        ("/sdcard/logs", "System Diagnostic Logs"),
        ("/sdcard/log", "System Dump Logs"),
    ];

    for (ld, label) in vendor_log_dirs {
        if !seen_paths.contains(ld) {
            let sz = get_path_size_bytes(&device_id, ld).await;
            if sz > 1024 * 512 {
                seen_paths.insert(ld.to_string());
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
    }

    // 5. Thumbnail Cache & App Image Caches
    let thumb_paths = [
        ("/sdcard/DCIM/.thumbnails", "DCIM Thumbnail Cache", "Cache pratinjau thumbnail kamera & galeri yang membengkak"),
        ("/sdcard/.thumbnails", "Root Thumbnail Cache", "Cache pratinjau thumbnail global Android"),
        ("/sdcard/Pictures/.thumbnails", "Pictures Thumbnail Cache", "Cache pratinjau foto galeri"),
        ("/sdcard/LazyList", "LazyList Image Cache", "Cache pratinjau thumbnail gambar sisa library LazyList"),
    ];

    for (tp, label, desc) in thumb_paths {
        if !seen_paths.contains(tp) {
            let sz = get_path_size_bytes(&device_id, tp).await;
            if sz > 1024 * 1024 {
                seen_paths.insert(tp.to_string());
                items.push(TrashItem {
                    id: format!("thumb_{}", items.len()),
                    category: "cache".into(),
                    path: tp.to_string(),
                    name: label.to_string(),
                    size_bytes: sz,
                    size_formatted: format_bytes(sz),
                    safety_level: "safe".into(),
                    description_id: desc.to_string(),
                    description_en: "Gallery thumbnail cache bloat".into(),
                });
            }
        }
    }

    // 6. Raw APK Installers di Download Folder
    if let Ok((out, _, 0)) = run_adb_device(&device_id, &["shell", "find", "/sdcard/Download", "-maxdepth", "2", "-name", "*.apk"]).await {
        for line in out.lines() {
            let apk_path = line.trim();
            if apk_path.is_empty() || seen_paths.contains(apk_path) {
                continue;
            }
            let sz = get_path_size_bytes(&device_id, apk_path).await;
            let file_name = apk_path.rsplit('/').next().unwrap_or("app.apk");
            seen_paths.insert(apk_path.to_string());
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

    // 7. Orphan Directory Scanner di Root /sdcard/
    let known_folder_map: &[(&str, &[&str], &str)] = &[
        ("SHAREit", &["com.lenovo.anyshare.gps"], "SHAREit"),
        ("Xender", &["cn.xender"], "Xender"),
        ("Snaptube", &["com.snaptube.premium"], "Snaptube"),
        ("Vidmate", &["com.nemo.vidmate"], "Vidmate"),
        ("KineMaster", &["com.nexstreaming.app.kinemasterfree"], "KineMaster"),
        ("CapCut", &["com.lemon.lvoverseas"], "CapCut"),
        ("UCDownloads", &["com.UCMobile.intl"], "UC Browser"),
        ("cleanmaster", &["com.cleanmaster.mguard"], "Clean Master"),
        ("TikTok", &["com.zhiliaoapp.musically"], "TikTok"),
        ("Likee", &["video.like"], "Likee"),
        ("Helo", &["com.eterno.helo"], "Helo"),
        ("DUrecorder", &["com.duapps.recorder"], "DU Recorder"),
        ("InShot", &["com.camerasideas.instashot"], "InShot"),
        ("VivaVideo", &["com.quvideo.xiaoying"], "VivaVideo"),
        ("baidu", &["com.baidu.searchbox"], "Baidu"),
        ("visha", &["com.transsion.visha", "com.visha.video.player", "com.visha.player"], "Visha Player"),
        ("XShare", &["com.infinix.xshare", "com.transsion.xshare"], "XShare"),
        ("Boomplay", &["com.afmobi.boomplayer"], "Boomplay"),
        ("AhaGames", &["com.transsion.ahagames"], "Aha Games"),
        ("PalmStore", &["com.transsion.palmstore"], "Palm Store"),
        ("Zalo", &["com.zing.zalo"], "Zalo"),
        ("Viber", &["com.viber.voip"], "Viber"),
        ("Line", &["jp.naver.line.android"], "LINE"),
        ("Truecaller", &["com.truecaller"], "Truecaller"),
        ("MXPlayer", &["com.mxtech.videoplayer.ad", "com.mxtech.videoplayer.pro"], "MX Player"),
        ("Opera", &["com.opera.browser", "com.opera.mini.native"], "Opera"),
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

            for (f_name, pkgs, app_title) in known_folder_map {
                if dir_name.eq_ignore_ascii_case(f_name) {
                    let any_installed = pkgs.iter().any(|pkg| installed_set.contains(*pkg));
                    if !any_installed {
                        is_orphan = true;
                        matched_app = app_title;
                    }
                    break;
                }
            }

            if is_orphan {
                let full_path = format!("/sdcard/{dir_name}");
                if !seen_paths.contains(&full_path) {
                    let sz = get_path_size_bytes(&device_id, &full_path).await;
                    if sz > 1024 * 1024 {
                        seen_paths.insert(full_path.clone());
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
        assert!(is_safe_to_delete("/storage/emulated/0/").is_err());
        assert!(is_safe_to_delete("/sdcard/Android").is_err());
        assert!(is_safe_to_delete("/sdcard/Android/data").is_err());
        assert!(is_safe_to_delete("/sdcard/Android/media").is_err());
        assert!(is_safe_to_delete("/sdcard/Android/obb").is_err());
        assert!(is_safe_to_delete("/sdcard/DCIM").is_err());
        assert!(is_safe_to_delete("/sdcard/Pictures").is_err());
        assert!(is_safe_to_delete("/sdcard/Documents").is_err());
        assert!(is_safe_to_delete("/sdcard/Audiobooks").is_err());
        assert!(is_safe_to_delete("/sdcard/Recordings").is_err());
        assert!(is_safe_to_delete("/sdcard/WhatsApp").is_err());
        assert!(is_safe_to_delete("/sdcard/WhatsApp Business").is_err());
        assert!(is_safe_to_delete("/sdcard/Android/media/com.whatsapp").is_err());
        assert!(is_safe_to_delete("/sdcard/Telegram").is_err());
        assert!(is_safe_to_delete("/sdcard/Android/data/org.telegram.messenger").is_err());
        assert!(is_safe_to_delete("/sdcard/Android/data/org.telegram.messenger/files").is_err());
        assert!(is_safe_to_delete("/sdcard/Android/data/org.telegram.messenger/files/Telegram").is_err());
        assert!(is_safe_to_delete("/data/app").is_err());
        assert!(is_safe_to_delete("/sdcard/foo/../DCIM").is_err());

        // Allowed paths
        assert!(is_safe_to_delete("/sdcard/Telegram/Telegram Video").is_ok());
        assert!(is_safe_to_delete("/sdcard/Android/data/org.telegram.messenger/files/Telegram/Telegram Images").is_ok());
        assert!(is_safe_to_delete("/sdcard/Android/data/org.telegram.messenger/cache").is_ok());
        assert!(is_safe_to_delete("/sdcard/.trashBin").is_ok());
        assert!(is_safe_to_delete("/sdcard/.trashBin_File").is_ok());
        assert!(is_safe_to_delete("/sdcard/Android/media/com.whatsapp/WhatsApp/Media/WhatsApp Video/Sent").is_ok());
        assert!(is_safe_to_delete("/sdcard/Android/media/com.whatsapp/WhatsApp/Media/WhatsApp Documents/Sent").is_ok());
        assert!(is_safe_to_delete("/sdcard/Android/media/com.whatsapp/WhatsApp/Media/WhatsApp Voice Notes").is_ok());
        assert!(is_safe_to_delete("/sdcard/Android/media/com.whatsapp/WhatsApp/Media/.Links").is_ok());
        assert!(is_safe_to_delete("/sdcard/DCIM/.thumbnails").is_ok());
        assert!(is_safe_to_delete("/sdcard/LazyList").is_ok());
        assert!(is_safe_to_delete("/sdcard/Download/test.apk").is_ok());
        assert!(is_safe_to_delete("/sdcard/SHAREit").is_ok());
    }

    #[tokio::test]
    #[ignore]
    async fn test_live_scan() {
        use crate::adb::scan_devices;
        let devices = scan_devices().await.unwrap_or_default();
        if let Some(dev) = devices.first() {
            let items = scan_storage_junk(dev.id.clone(), vec![]).await.unwrap();
            println!("DEVICE: {}", dev.id);
            println!("TOTAL ITEMS: {}", items.len());
            let mut total_bytes = 0u64;
            for it in &items {
                total_bytes += it.size_bytes;
                println!("  [{}] {} ({}) -> {}", it.category, it.name, it.size_formatted, it.path);
            }
            println!("TOTAL JUNK DETECTED: {}", format_bytes(total_bytes));
        }
    }
}
