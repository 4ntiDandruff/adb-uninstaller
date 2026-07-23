mod adb;
mod ai;
mod db;

use tauri::Emitter;

use adb::{AppInfo, CommandResult, Device, DeviceInfo};
use ai::{AppSettings, ConnectionTest, SafetyAnalysis};

#[tauri::command]
async fn scan_devices(window: tauri::Window) -> Result<Vec<Device>, String> {
    let _ = window.emit("scan-progress", serde_json::json!({"pct": 10, "msg": "Menjalankan adb devices..."}));
    let result = adb::scan_devices().await;
    let _ = window.emit("scan-progress", serde_json::json!({"pct": 100, "msg": "Scan selesai"}));
    result
}

#[tauri::command]
async fn get_device_info(device_id: String) -> Result<DeviceInfo, String> {
    adb::get_device_info(device_id).await
}

#[tauri::command]
async fn list_apps(window: tauri::Window, device_id: String) -> Result<Vec<AppInfo>, String> {
    let _ = window.emit("scan-progress", serde_json::json!({"pct": 20, "msg": "Membaca package manager..."}));
    let result = adb::list_apps(device_id).await;
    let _ = window.emit("scan-progress", serde_json::json!({"pct": 100, "msg": "Selesai"}));
    result
}

#[tauri::command]
async fn get_app_size(device_id: String, package: String) -> Result<String, String> {
    adb::get_app_size(device_id, package).await
}

#[tauri::command]
async fn uninstall_package(device_id: String, package: String) -> CommandResult {
    adb::uninstall_package(device_id, package).await
}

#[tauri::command]
async fn disable_package(device_id: String, package: String) -> CommandResult {
    adb::disable_package(device_id, package).await
}

#[tauri::command]
async fn enable_package(device_id: String, package: String) -> CommandResult {
    adb::enable_package(device_id, package).await
}

#[tauri::command]
async fn restore_package(device_id: String, package: String) -> CommandResult {
    adb::restore_package(device_id, package).await
}

#[tauri::command]
async fn force_stop_package(device_id: String, package: String) -> CommandResult {
    adb::force_stop_package(device_id, package).await
}

#[tauri::command]
async fn clear_app_data(device_id: String, package: String) -> CommandResult {
    adb::clear_app_data(device_id, package).await
}

#[tauri::command]
async fn analyze_apps_batch(packages: Vec<String>) -> Result<Vec<SafetyAnalysis>, String> {
    ai::analyze_apps_batch(packages).await
}

#[tauri::command]
async fn chat_with_ai(message: String, context: String) -> Result<String, String> {
    ai::chat_with_ai(message, context).await
}

#[tauri::command]
async fn test_ai_connection(
    base_url: String,
    api_key: String,
    model: String,
) -> Result<ConnectionTest, String> {
    ai::test_ai_connection(base_url, api_key, model).await
}

#[tauri::command]
fn save_settings(settings: AppSettings) -> Result<(), String> {
    ai::save_settings(settings)
}

#[tauri::command]
fn load_settings() -> Result<AppSettings, String> {
    ai::load_settings()
}

#[tauri::command]
async fn check_adb_available() -> Result<bool, String> {
    adb::check_adb_available().await
}

#[tauri::command]
async fn get_cached_apps(state: tauri::State<'_, db::DbState>, device_id: String) -> Result<Vec<db::CachedApp>, String> {
    let guard = db::get_conn(&state)?;
    let conn = guard.as_ref().ok_or("[DB-007] Database tidak terinit")?;
    db::load_apps(conn, &device_id).map_err(|e| format!("[DB-008] Load cache gagal: {e}"))
}

#[tauri::command]
async fn get_last_scan_time(state: tauri::State<'_, db::DbState>, device_id: String) -> Result<Option<String>, String> {
    let guard = db::get_conn(&state)?;
    let conn = guard.as_ref().ok_or("[DB-007] Database tidak terinit")?;
    db::get_last_scan_time(conn, &device_id).map_err(|e| format!("[DB-009] Get scan time gagal: {e}"))
}

#[tauri::command]
async fn clear_device_cache(state: tauri::State<'_, db::DbState>, device_id: String) -> Result<usize, String> {
    let guard = db::get_conn(&state)?;
    let conn = guard.as_ref().ok_or("[DB-007] Database tidak terinit")?;
    db::clear_device_cache(conn, &device_id).map_err(|e| format!("[DB-010] Clear cache gagal: {e}"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let db_conn = db::init_db().expect("Gagal init database");
    let db_state = db::DbState(std::sync::Mutex::new(Some(db_conn)));
    
    tauri::Builder::default()
        .manage(db_state)
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            scan_devices,
            get_device_info,
            list_apps,
            get_app_size,
            uninstall_package,
            disable_package,
            enable_package,
            restore_package,
            force_stop_package,
            clear_app_data,
            analyze_apps_batch,
            chat_with_ai,
            test_ai_connection,
            save_settings,
            load_settings,
            check_adb_available,
            get_cached_apps,
            get_last_scan_time,
            clear_device_cache,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
