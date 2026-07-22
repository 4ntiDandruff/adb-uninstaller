use serde::{Deserialize, Serialize};
use std::time::Instant;
use tokio::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Device {
    pub id: String,
    pub model: String,
    pub status: String,
    pub transport: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppInfo {
    pub package_name: String,
    pub label: String,
    pub is_system: bool,
    pub is_disabled: bool,
    pub is_running: bool,
    pub safety_level: String,
    pub safety_reason: String,
    pub size: String,
    pub version: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandResult {
    pub success: bool,
    pub output: String,
    pub error: Option<String>,
    pub duration_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeviceInfo {
    pub model: String,
    pub manufacturer: String,
    pub android_version: String,
    pub sdk_level: i32,
    pub battery_level: i32,
    pub storage_total: String,
    pub storage_free: String,
    pub ram_total: String,
}

async fn run_adb(args: &[&str]) -> Result<(String, String, i32), String> {
    let output = Command::new("adb")
        .args(args)
        .output()
        .await
        .map_err(|e| format!("[ADB-1001] ADB tidak ditemukan atau gagal dijalankan: {e}"))?;

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();
    let code = output.status.code().unwrap_or(-1);
    Ok((stdout, stderr, code))
}

async fn run_adb_device(device_id: &str, args: &[&str]) -> Result<(String, String, i32), String> {
    let mut full = vec!["-s", device_id];
    full.extend_from_slice(args);
    run_adb(&full).await
}

fn timed_result(start: Instant, success: bool, output: String, error: Option<String>) -> CommandResult {
    CommandResult {
        success,
        output,
        error,
        duration_ms: start.elapsed().as_millis() as u64,
    }
}

pub async fn scan_devices() -> Result<Vec<Device>, String> {
    let (stdout, stderr, code) = run_adb(&["devices", "-l"]).await?;
    if code != 0 {
        return Err(format!("[ADB-1002] Gagal scan devices: {stderr}"));
    }

    let mut devices = Vec::new();
    for line in stdout.lines().skip(1) {
        let line = line.trim();
        if line.is_empty() {
            continue;
        }
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() < 2 {
            continue;
        }
        let id = parts[0].to_string();
        let status_raw = parts[1];
        let status = match status_raw {
            "device" => "online",
            "offline" => "offline",
            "unauthorized" => "unauthorized",
            _ => status_raw,
        }
        .to_string();

        let mut model = String::from("unknown");
        let mut transport = if id.contains(':') {
            "wireless".to_string()
        } else {
            "usb".to_string()
        };

        for p in &parts[2..] {
            if let Some(v) = p.strip_prefix("model:") {
                model = v.replace('_', " ");
            }
            if p.starts_with("usb:") {
                transport = "usb".to_string();
            }
        }

        devices.push(Device {
            id,
            model,
            status,
            transport,
        });
    }
    Ok(devices)
}

pub async fn get_device_info(device_id: String) -> Result<DeviceInfo, String> {
    async fn prop(device_id: &str, key: &str) -> String {
        run_adb_device(device_id, &["shell", "getprop", key])
            .await
            .map(|(o, _, _)| o.trim().to_string())
            .unwrap_or_default()
    }

    let model = prop(&device_id, "ro.product.model").await;
    let manufacturer = prop(&device_id, "ro.product.manufacturer").await;
    let android_version = prop(&device_id, "ro.build.version.release").await;
    let sdk_str = prop(&device_id, "ro.build.version.sdk").await;
    let sdk_level = sdk_str.parse().unwrap_or(0);

    let battery_level = match run_adb_device(&device_id, &["shell", "dumpsys", "battery"]).await {
        Ok((out, _, _)) => out
            .lines()
            .find(|l| l.trim().starts_with("level:"))
            .and_then(|l| l.split(':').nth(1))
            .and_then(|v| v.trim().parse().ok())
            .unwrap_or(-1),
        Err(_) => -1,
    };

    let (storage_total, storage_free) =
        match run_adb_device(&device_id, &["shell", "df", "-h", "/data"]).await {
            Ok((out, _, _)) => {
                let line = out.lines().nth(1).unwrap_or("");
                let cols: Vec<&str> = line.split_whitespace().collect();
                if cols.len() >= 4 {
                    (cols[1].to_string(), cols[3].to_string())
                } else {
                    ("?".into(), "?".into())
                }
            }
            Err(_) => ("?".into(), "?".into()),
        };

    let ram_total = match run_adb_device(&device_id, &["shell", "cat", "/proc/meminfo"]).await {
        Ok((out, _, _)) => out
            .lines()
            .find(|l| l.starts_with("MemTotal:"))
            .map(|l| {
                let kb: u64 = l
                    .split_whitespace()
                    .nth(1)
                    .and_then(|v| v.parse().ok())
                    .unwrap_or(0);
                format!("{:.1} GB", kb as f64 / 1024.0 / 1024.0)
            })
            .unwrap_or_else(|| "?".into()),
        Err(_) => "?".into(),
    };

    Ok(DeviceInfo {
        model,
        manufacturer,
        android_version,
        sdk_level,
        battery_level,
        storage_total,
        storage_free,
        ram_total,
    })
}

pub async fn list_apps(device_id: String) -> Result<Vec<AppInfo>, String> {
    let (all_out, err, code) =
        run_adb_device(&device_id, &["shell", "pm", "list", "packages", "-f"]).await?;
    if code != 0 {
        return Err(format!("[ADB-2001] Gagal list packages: {err}"));
    }

    let (sys_out, _, _) = run_adb_device(&device_id, &["shell", "pm", "list", "packages", "-s"])
        .await
        .unwrap_or_default();
    let (dis_out, _, _) = run_adb_device(&device_id, &["shell", "pm", "list", "packages", "-d"])
        .await
        .unwrap_or_default();
    let (run_out, _, _) = run_adb_device(
        &device_id,
        &["shell", "dumpsys", "activity", "processes"],
    )
    .await
    .unwrap_or_default();

    let system_set: std::collections::HashSet<String> = sys_out
        .lines()
        .filter_map(|l| l.strip_prefix("package:").map(|s| s.trim().to_string()))
        .collect();
    let disabled_set: std::collections::HashSet<String> = dis_out
        .lines()
        .filter_map(|l| l.strip_prefix("package:").map(|s| s.trim().to_string()))
        .collect();

    let mut apps = Vec::new();
    for line in all_out.lines() {
        // package:/path/base.apk=com.example.app
        let Some(rest) = line.strip_prefix("package:") else {
            continue;
        };
        let package_name = rest
            .rsplit('=')
            .next()
            .unwrap_or("")
            .trim()
            .to_string();
        if package_name.is_empty() {
            continue;
        }
        let is_system = system_set.contains(&package_name);
        let is_disabled = disabled_set.contains(&package_name);
        let is_running = run_out.contains(&package_name);

        apps.push(AppInfo {
            package_name: package_name.clone(),
            label: package_name.clone(),
            is_system,
            is_disabled,
            is_running,
            safety_level: "unknown".into(),
            safety_reason: String::new(),
            size: String::new(),
            version: String::new(),
        });
    }

    apps.sort_by(|a, b| a.package_name.cmp(&b.package_name));
    Ok(apps)
}

pub async fn get_app_size(device_id: String, package: String) -> Result<String, String> {
    // Pakai `pm path` lalu jumlahkan ukuran semua file APK (base + splits).
    let (out, err, code) = run_adb_device(&device_id, &["shell", "pm", "path", &package]).await?;
    if code != 0 {
        return Err(format!("[ADB-2002] Gagal get path: {err}"));
    }

    let mut total_bytes: u64 = 0;
    for line in out.lines() {
        let Some(path) = line.strip_prefix("package:") else {
            continue;
        };
        let path = path.trim();
        if path.is_empty() {
            continue;
        }
        // stat -c %s = ukuran byte; fallback parse `ls -la`
        if let Ok((sz, _, 0)) =
            run_adb_device(&device_id, &["shell", "stat", "-c", "%s", path]).await
        {
            if let Ok(b) = sz.trim().parse::<u64>() {
                total_bytes += b;
                continue;
            }
        }
        if let Ok((ll, _, 0)) = run_adb_device(&device_id, &["shell", "ls", "-la", path]).await {
            let cols: Vec<&str> = ll.split_whitespace().collect();
            if cols.len() >= 5 {
                if let Ok(b) = cols[4].parse::<u64>() {
                    total_bytes += b;
                }
            }
        }
    }

    if total_bytes == 0 {
        return Ok("?".into());
    }
    Ok(format_bytes(total_bytes))
}

fn format_bytes(b: u64) -> String {
    const KB: f64 = 1024.0;
    const MB: f64 = KB * 1024.0;
    const GB: f64 = MB * 1024.0;
    let bf = b as f64;
    if bf >= GB {
        format!("{:.1} GB", bf / GB)
    } else if bf >= MB {
        format!("{:.1} MB", bf / MB)
    } else if bf >= KB {
        format!("{:.0} KB", bf / KB)
    } else {
        format!("{} B", b)
    }
}

pub async fn uninstall_package(device_id: String, package: String) -> CommandResult {
    let start = Instant::now();
    match run_adb_device(
        &device_id,
        &["shell", "pm", "uninstall", "--user", "0", &package],
    )
    .await
    {
        Ok((out, err, code)) => {
            let success = code == 0 && out.to_lowercase().contains("success");
            timed_result(
                start,
                success,
                out,
                if success {
                    None
                } else {
                    Some(if err.is_empty() {
                        "[ADB-3001] Uninstall gagal".into()
                    } else {
                        format!("[ADB-3001] {err}")
                    })
                },
            )
        }
        Err(e) => timed_result(start, false, String::new(), Some(e)),
    }
}

pub async fn disable_package(device_id: String, package: String) -> CommandResult {
    let start = Instant::now();
    match run_adb_device(
        &device_id,
        &["shell", "pm", "disable-user", "--user", "0", &package],
    )
    .await
    {
        Ok((out, err, code)) => {
            let success = code == 0;
            timed_result(
                start,
                success,
                out,
                if success {
                    None
                } else {
                    Some(format!("[ADB-3002] Disable gagal: {err}"))
                },
            )
        }
        Err(e) => timed_result(start, false, String::new(), Some(e)),
    }
}

pub async fn enable_package(device_id: String, package: String) -> CommandResult {
    let start = Instant::now();
    match run_adb_device(&device_id, &["shell", "pm", "enable", &package]).await {
        Ok((out, err, code)) => {
            let success = code == 0;
            timed_result(
                start,
                success,
                out,
                if success {
                    None
                } else {
                    Some(format!("[ADB-3003] Enable gagal: {err}"))
                },
            )
        }
        Err(e) => timed_result(start, false, String::new(), Some(e)),
    }
}

pub async fn restore_package(device_id: String, package: String) -> CommandResult {
    let start = Instant::now();
    match run_adb_device(
        &device_id,
        &["shell", "cmd", "package", "install-existing", &package],
    )
    .await
    {
        Ok((out, err, code)) => {
            let success = code == 0 && (out.contains("Success") || out.contains("installed"));
            timed_result(
                start,
                success,
                out,
                if success { None } else { Some(format!("[ADB-3006] Restore gagal: {err}")) },
            )
        }
        Err(e) => timed_result(start, false, String::new(), Some(e)),
    }
}

pub async fn force_stop_package(device_id: String, package: String) -> CommandResult {
    let start = Instant::now();
    match run_adb_device(&device_id, &["shell", "am", "force-stop", &package]).await {
        Ok((out, err, code)) => {
            let success = code == 0;
            timed_result(
                start,
                success,
                out,
                if success {
                    None
                } else {
                    Some(format!("[ADB-3004] Force stop gagal: {err}"))
                },
            )
        }
        Err(e) => timed_result(start, false, String::new(), Some(e)),
    }
}

pub async fn clear_app_data(device_id: String, package: String) -> CommandResult {
    let start = Instant::now();
    match run_adb_device(&device_id, &["shell", "pm", "clear", &package]).await {
        Ok((out, err, code)) => {
            let success = code == 0 && out.to_lowercase().contains("success");
            timed_result(
                start,
                success,
                out,
                if success {
                    None
                } else {
                    Some(format!("[ADB-3005] Clear data gagal: {err}"))
                },
            )
        }
        Err(e) => timed_result(start, false, String::new(), Some(e)),
    }
}

pub async fn check_adb_available() -> Result<bool, String> {
    match Command::new("adb").arg("version").output().await {
        Ok(o) => Ok(o.status.success()),
        Err(_) => Ok(false),
    }
}
