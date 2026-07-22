mod adb;
mod ai;

use adb::{AppInfo, CommandResult, Device, DeviceInfo};
use ai::{AppSettings, ConnectionTest, SafetyAnalysis};

#[tauri::command]
async fn scan_devices() -> Result<Vec<Device>, String> {
    adb::scan_devices().await
}

#[tauri::command]
async fn get_device_info(device_id: String) -> Result<DeviceInfo, String> {
    adb::get_device_info(device_id).await
}

#[tauri::command]
async fn list_apps(device_id: String) -> Result<Vec<AppInfo>, String> {
    adb::list_apps(device_id).await
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            scan_devices,
            get_device_info,
            list_apps,
            get_app_size,
            uninstall_package,
            disable_package,
            enable_package,
            force_stop_package,
            clear_app_data,
            analyze_apps_batch,
            chat_with_ai,
            test_ai_connection,
            save_settings,
            load_settings,
            check_adb_available,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
