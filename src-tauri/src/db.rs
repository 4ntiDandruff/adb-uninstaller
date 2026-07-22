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

fn db_path() -> Result<PathBuf, String> {
    let dir = dirs::config_dir()
        .ok_or_else(|| "[DB-001] Config dir tidak ditemukan".to_string())?
        .join("adb-uninstaller");
    std::fs::create_dir_all(&dir)
        .map_err(|e| format!("[DB-002] Gagal buat config dir: {e}"))?;
    Ok(dir.join("cache.db"))
}

pub fn init_db() -> Result<Connection, String> {
    let path = db_path()?;
    let conn = Connection::open(path)
        .map_err(|e| format!("[DB-003] Gagal buka database: {e}"))?;
    
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
    ).map_err(|e| format!("[DB-004] Gagal buat tabel: {e}"))?;
    
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_app_cache_device ON app_cache(device_id)",
        [],
    ).map_err(|e| format!("[DB-005] Gagal buat index: {e}"))?;
    
    Ok(conn)
}

pub fn get_conn(state: &DbState) -> Result<std::sync::MutexGuard<Option<Connection>>, String> {
    state.0.lock().map_err(|e| format!("[DB-006] Lock poisoned: {e}"))
}

pub fn save_apps(conn: &Connection, device_id: &str, apps: &[crate::adb::AppInfo]) -> SqlResult<usize> {
    let now = chrono::Local::now().to_rfc3339();
    let mut count = 0;
    
    for app in apps {
        conn.execute(
            "INSERT OR REPLACE INTO app_cache 
             (package_name, label, is_system, is_disabled, safety_level, safety_reason, size, version, device_id, scanned_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            rusqlite::params![
                app.package_name,
                app.label,
                app.is_system as i32,
                app.is_disabled as i32,
                app.safety_level,
                app.safety_reason,
                app.size,
                app.version,
                device_id,
                now,
            ],
        )?;
        count += 1;
    }
    Ok(count)
}

pub fn load_apps(conn: &Connection, device_id: &str) -> SqlResult<Vec<CachedApp>> {
    let mut stmt = conn.prepare(
        "SELECT package_name, label, is_system, is_disabled, safety_level, safety_reason, size, version, device_id, scanned_at
         FROM app_cache WHERE device_id = ?1 ORDER BY package_name"
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
        "SELECT scanned_at FROM app_cache WHERE device_id = ?1 ORDER BY scanned_at DESC LIMIT 1"
    )?;
    let mut rows = stmt.query([device_id])?;
    if let Some(row) = rows.next()? {
        Ok(Some(row.get(0)?))
    } else {
        Ok(None)
    }
}
