use rusqlite::{Connection, Result as SqlResult};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CachedApp {
    pub package_name: String,
    pub label: String,
    pub is_system: bool,
    pub is_disabled: bool,
    pub safety_level: String,
    pub safety_reason: String,
    pub size: String,
    pub version: String,
    pub device_id: String,
    pub scanned_at: String,
}

pub struct DbState(pub Mutex<Option<Connection>>);

pub fn db_path() -> Result<PathBuf, String> {
    let dir = dirs::config_dir()
        .ok_or_else(|| "[DB-001] Config dir tidak ditemukan".to_string())?
        .join("adb-uninstaller");
    std::fs::create_dir_all(&dir).map_err(|e| format!("[DB-002] Gagal buat config dir: {e}"))?;
    Ok(dir.join("cache.db"))
}

pub fn init_db() -> Result<Connection, String> {
    let path = db_path()?;
    let conn = Connection::open(path).map_err(|e| format!("[DB-003] Gagal buka database: {e}"))?;
    conn.execute_batch(
        "PRAGMA journal_mode=WAL;
         PRAGMA synchronous=NORMAL;
         PRAGMA busy_timeout=5000;
         PRAGMA cache_size=-64000;
         PRAGMA temp_store=MEMORY;",
    )
    .map_err(|e| format!("[DB-003b] WAL mode gagal: {e}"))?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS app_cache (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            package_name TEXT NOT NULL,
            label TEXT,
            is_system INTEGER,
            is_disabled INTEGER,
            safety_level TEXT,
            safety_reason TEXT,
            size TEXT,
            version TEXT,
            device_id TEXT NOT NULL,
            scanned_at TEXT NOT NULL,
            UNIQUE(package_name, device_id)
        )",
        [],
    )
    .map_err(|e| format!("[DB-004] Gagal buat tabel app_cache: {e}"))?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_app_cache_device ON app_cache(device_id)",
        [],
    )
    .map_err(|e| format!("[DB-005] Gagal buat index device: {e}"))?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_app_cache_pkg ON app_cache(package_name)",
        [],
    )
    .map_err(|e| format!("[DB-005b] Gagal buat index package: {e}"))?;

    // Kamus Universal Meja Servis (Package Catalog)
    conn.execute(
        "CREATE TABLE IF NOT EXISTS package_catalog (
            package_name TEXT PRIMARY KEY,
            label TEXT,
            safety_level TEXT NOT NULL,
            safety_reason TEXT,
            updated_at TEXT NOT NULL
        )",
        [],
    )
    .map_err(|e| format!("[DB-005c] Gagal buat tabel package_catalog: {e}"))?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_catalog_pkg ON package_catalog(package_name)",
        [],
    )
    .map_err(|e| format!("[DB-005d] Gagal buat index package_catalog: {e}"))?;

    // Seed / auto-migrate dari app_cache yang sudah pernah teranalisis
    let _ = conn.execute(
        "INSERT OR IGNORE INTO package_catalog (package_name, label, safety_level, safety_reason, updated_at)
         SELECT package_name,
                label,
                safety_level,
                safety_reason,
                MAX(scanned_at) as updated_at
         FROM app_cache
         WHERE safety_level NOT IN ('unknown', '')
         GROUP BY package_name",
        [],
    );

    Ok(conn)
}

pub fn get_conn(state: &DbState) -> Result<std::sync::MutexGuard<'_, Option<Connection>>, String> {
    state
        .0
        .lock()
        .map_err(|e| format!("[DB-006] Lock poisoned: {e}"))
}

pub fn save_apps(
    conn: &Connection,
    device_id: &str,
    apps: &[crate::adb::AppInfo],
) -> SqlResult<usize> {
    let now = chrono::Local::now().to_rfc3339();
    let mut count = 0;
    let tx = conn.unchecked_transaction()?;

    for app in apps {
        // 1. Ambil data lama spesifik device jika sudah pernah discan
        let existing: Option<(String, String, String, String, String)> = tx
            .query_row(
                "SELECT label, safety_level, safety_reason, size, version FROM app_cache WHERE package_name = ?1 AND device_id = ?2",
                rusqlite::params![app.package_name, device_id],
                |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?, row.get(4)?)),
            )
            .ok();

        let (old_label, old_level, old_reason, old_size, old_version) =
            existing.unwrap_or_default();

        // 2. Cek Kamus Universal Meja Servis (package_catalog)
        let catalog_entry: Option<(String, String, String)> = tx
            .query_row(
                "SELECT label, safety_level, safety_reason FROM package_catalog WHERE package_name = ?1",
                rusqlite::params![app.package_name],
                |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
            )
            .ok();

        let (cat_label, cat_level, cat_reason) = catalog_entry.unwrap_or_default();

        // Prioritas Label:
        // a. Jika app.label sudah bukan package name & bukan pretty slug default -> pakai app.label
        // b. Jika old_label (cache device) ada & bukan package name -> pakai old_label
        // c. Jika cat_label (kamus universal) ada & bukan package name -> pakai cat_label
        // d. Fallback ke app.label
        let label = if !app.label.is_empty()
            && app.label != app.package_name
            && app.label != crate::adb::pretty_label(&app.package_name)
        {
            app.label.clone()
        } else if !old_label.is_empty() && old_label != app.package_name {
            old_label
        } else if !cat_label.is_empty() && cat_label != app.package_name {
            cat_label
        } else {
            app.label.clone()
        };

        // Prioritas Safety Level:
        // a. Jika app.safety_level bukan unknown -> pakai
        // b. Jika old_level bukan unknown -> pakai
        // c. Jika cat_level bukan unknown -> pakai dari Kamus Universal!
        // d. Fallback query lintas device lama
        let (safety_level, safety_reason) = if app.safety_level != "unknown" && !app.safety_level.is_empty() {
            (
                app.safety_level.clone(),
                if !app.safety_reason.is_empty() {
                    app.safety_reason.clone()
                } else {
                    old_reason
                },
            )
        } else if !old_level.is_empty() && old_level != "unknown" {
            (old_level, old_reason)
        } else if !cat_level.is_empty() && cat_level != "unknown" {
            (cat_level, cat_reason)
        } else {
            // Fallback lintas device lain jika belum masuk catalog
            tx.query_row(
                "SELECT safety_level, safety_reason FROM app_cache WHERE package_name = ?1 AND safety_level NOT IN ('unknown', '') ORDER BY scanned_at DESC LIMIT 1",
                rusqlite::params![app.package_name],
                |row| Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?)),
            )
            .unwrap_or(("unknown".into(), String::new()))
        };

        let size = if !app.size.is_empty() && app.size != "?" {
            app.size.clone()
        } else if !old_size.is_empty() {
            old_size
        } else {
            app.size.clone()
        };

        let version = if !app.version.is_empty() {
            app.version.clone()
        } else {
            old_version
        };

        tx.execute(
            "INSERT OR REPLACE INTO app_cache 
             (package_name, label, is_system, is_disabled, safety_level, safety_reason, size, version, device_id, scanned_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            rusqlite::params![
                app.package_name,
                label,
                app.is_system as i32,
                app.is_disabled as i32,
                safety_level,
                safety_reason,
                size,
                version,
                device_id,
                now,
            ],
        )?;
        count += 1;
    }
    tx.commit()?;
    Ok(count)
}

pub fn load_apps(conn: &Connection, device_id: &str) -> SqlResult<Vec<CachedApp>> {
    let mut stmt = conn.prepare(
        "SELECT package_name, label, is_system, is_disabled, safety_level, safety_reason, size, version, device_id, scanned_at
         FROM app_cache WHERE device_id = ?1 ORDER BY package_name",
    )?;

    let rows = stmt.query_map([device_id], |row| {
        Ok(CachedApp {
            package_name: row.get(0)?,
            label: row.get(1)?,
            is_system: row.get::<_, i32>(2)? != 0,
            is_disabled: row.get::<_, i32>(3)? != 0,
            safety_level: row.get(4)?,
            safety_reason: row.get(5)?,
            size: row.get(6)?,
            version: row.get(7)?,
            device_id: row.get(8)?,
            scanned_at: row.get(9)?,
        })
    })?;

    let mut apps = Vec::new();
    for row in rows {
        apps.push(row?);
    }
    Ok(apps)
}

pub fn clear_device_cache(conn: &Connection, device_id: &str) -> SqlResult<usize> {
    conn.execute("DELETE FROM app_cache WHERE device_id = ?1", [device_id])
}

pub fn get_last_scan_time(conn: &Connection, device_id: &str) -> SqlResult<Option<String>> {
    let mut stmt = conn.prepare(
        "SELECT scanned_at FROM app_cache WHERE device_id = ?1 ORDER BY scanned_at DESC LIMIT 1",
    )?;
    let mut rows = stmt.query([device_id])?;
    if let Some(row) = rows.next()? {
        Ok(Some(row.get(0)?))
    } else {
        Ok(None)
    }
}

pub fn batch_update_safety(
    conn: &Connection,
    device_id: &str,
    updates: &[(String, String, String, String)], // (package_name, app_name, safety_level, safety_reason)
) -> SqlResult<usize> {
    let now = chrono::Local::now().to_rfc3339();
    let tx = conn.unchecked_transaction()?;
    let mut count = 0;
    for (pkg, app_name, level, reason) in updates {
        // Normalize AI level casing: "Safe" / "SAFE" -> "safe"
        let level = match level.to_lowercase().as_str() {
            "safe" | "risky" | "critical" | "unknown" => level.to_lowercase(),
            other if other.contains("crit") => "critical".into(),
            other if other.contains("risk") => "risky".into(),
            other if other.contains("safe") || other.contains("ok") => "safe".into(),
            _ => "unknown".into(),
        };

        // 1. Update app_cache untuk device_id saat ini
        let rows = if !app_name.is_empty() {
            tx.execute(
                "UPDATE app_cache SET label = ?1, safety_level = ?2, safety_reason = ?3, scanned_at = ?4 WHERE package_name = ?5 AND device_id = ?6",
                rusqlite::params![app_name, level, reason, now, pkg, device_id],
            )?
        } else {
            tx.execute(
                "UPDATE app_cache SET safety_level = ?1, safety_reason = ?2, scanned_at = ?3 WHERE package_name = ?4 AND device_id = ?5",
                rusqlite::params![level, reason, now, pkg, device_id],
            )?
        };
        if rows == 0 {
            let label = if app_name.is_empty() { pkg } else { app_name };
            tx.execute(
                "INSERT OR IGNORE INTO app_cache (package_name, label, is_system, is_disabled, safety_level, safety_reason, size, version, device_id, scanned_at)
                 VALUES (?1, ?2, 0, 0, ?3, ?4, '', '', ?5, ?6)",
                rusqlite::params![pkg, label, level, reason, device_id, now],
            )?;
        }

        // 2. Simpan atau perbarui Kamus Universal Meja Servis (package_catalog)
        if level != "unknown" {
            let label = if !app_name.is_empty() { app_name.as_str() } else { pkg.as_str() };
            tx.execute(
                "INSERT INTO package_catalog (package_name, label, safety_level, safety_reason, updated_at)
                 VALUES (?1, ?2, ?3, ?4, ?5)
                 ON CONFLICT(package_name) DO UPDATE SET
                     label = CASE WHEN ?2 != '' AND ?2 != ?1 THEN ?2 ELSE package_catalog.label END,
                     safety_level = ?3,
                     safety_reason = ?4,
                     updated_at = ?5",
                rusqlite::params![pkg, label, level, reason, now],
            )?;
        }

        count += 1;
    }
    tx.commit()?;
    Ok(count)
}

pub fn update_app_size(
    conn: &Connection,
    device_id: &str,
    package_name: &str,
    size: &str,
) -> SqlResult<usize> {
    conn.execute(
        "UPDATE app_cache SET size = ?1 WHERE package_name = ?2 AND device_id = ?3",
        rusqlite::params![size, package_name, device_id],
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_package_catalog_cross_device_inheritance() {
        let conn = Connection::open_in_memory().unwrap();
        conn.execute_batch(
            "CREATE TABLE app_cache (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                package_name TEXT NOT NULL,
                label TEXT,
                is_system INTEGER,
                is_disabled INTEGER,
                safety_level TEXT,
                safety_reason TEXT,
                size TEXT,
                version TEXT,
                device_id TEXT NOT NULL,
                scanned_at TEXT NOT NULL,
                UNIQUE(package_name, device_id)
            );
            CREATE TABLE package_catalog (
                package_name TEXT PRIMARY KEY,
                label TEXT,
                safety_level TEXT NOT NULL,
                safety_reason TEXT,
                updated_at TEXT NOT NULL
            );",
        )
        .unwrap();

        // 1. Simpan AI result di HP-1
        let updates = vec![(
            "com.example.bloatware".to_string(),
            "Contoh Bloatware".to_string(),
            "safe".to_string(),
            "Aman dicopot".to_string(),
        )];
        batch_update_safety(&conn, "DEVICE_HP1", &updates).unwrap();

        // Verifikasi masuk ke catalog
        let cat: (String, String) = conn
            .query_row(
                "SELECT label, safety_level FROM package_catalog WHERE package_name = ?1",
                ["com.example.bloatware"],
                |r| Ok((r.get(0)?, r.get(1)?)),
            )
            .unwrap();
        assert_eq!(cat.0, "Contoh Bloatware");
        assert_eq!(cat.1, "safe");

        // 2. Sekarang colok HP-2 baru yang belum pernah discan
        let new_app = crate::adb::AppInfo {
            package_name: "com.example.bloatware".to_string(),
            label: crate::adb::pretty_label("com.example.bloatware"),
            is_system: true,
            is_disabled: false,
            is_running: false,
            safety_level: "unknown".to_string(),
            safety_reason: String::new(),
            size: String::new(),
            version: String::new(),
        };

        save_apps(&conn, "DEVICE_HP2_BARU", &[new_app]).unwrap();

        // 3. Verifikasi HP-2 otomatis mewarisi label & safety dari Kamus Universal!
        let loaded = load_apps(&conn, "DEVICE_HP2_BARU").unwrap();
        assert_eq!(loaded.len(), 1);
        assert_eq!(loaded[0].label, "Contoh Bloatware");
        assert_eq!(loaded[0].safety_level, "safe");
        assert_eq!(loaded[0].safety_reason, "Aman dicopot");
    }
}
