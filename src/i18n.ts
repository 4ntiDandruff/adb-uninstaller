export type Lang = "id" | "en";

export const t: Record<Lang, Record<string, string>> = {
  id: {
    // Topbar
    "topbar.title": "Aplikasi",
    "topbar.ai_analyze": "AI",
    "topbar.undo": "Undo",
    "topbar.ai_chat": "AI Chat",
    "topbar.theme": "Ganti tema",
    
    // Sidebar
    "sidebar.devices": "Perangkat",
    "sidebar.select_device": "— Pilih device —",
    "sidebar.refresh": "Refresh",
    "sidebar.device_info": "Info Perangkat",
    "sidebar.model": "Model",
    "sidebar.android": "Android",
    "sidebar.battery": "Baterai",
    "sidebar.storage": "Penyimpanan",
    "sidebar.ram": "RAM",
    "sidebar.stats": "Statistik",
    "sidebar.total_apps": "Total aplikasi",
    "sidebar.settings": "Pengaturan",
    
    // Stats
    "stats.total": "Total",
    "stats.safe": "Aman",
    "stats.risky": "Berisiko",
    "stats.unknown": "Tidak diketahui",
    
    // Toolbar
    "toolbar.search": "Cari package...",
    "toolbar.all_levels": "Semua level",
    "toolbar.reset": "Reset",
    "toolbar.uninstall": "Uninstall",
    "toolbar.disable": "Nonaktifkan",
    "toolbar.enable": "Aktifkan",
    "toolbar.stop": "Stop",
    "toolbar.clear": "Hapus Data",
    
    // Table
    "table.all": "Semua",
    "table.system": "System",
    "table.user": "User",
    "table.disabled": "Nonaktif",
    "table.running": "Berjalan",
    "table.package": "Package",
    "table.safety": "Keamanan",
    "table.type": "Tipe",
    "table.status": "Status",
    "table.size": "Ukuran",
    "table.empty": "Belum ada data. Scan device dulu.",
    "table.no_result": "Tidak ada hasil untuk filter ini.",
    
    // Detail
    "detail.uninstall": "Uninstall",
    "detail.disable": "Nonaktifkan",
    "detail.enable": "Aktifkan",
    "detail.force_stop": "Force Stop",
    "detail.clear_data": "Hapus Data",
    
    // AI Chat
    "chat.title": "Asisten AI",
    "chat.placeholder": "Ketik pesan...",
    "chat.hint": "Tanya seputar debloat, keamanan package, atau perintah ADB.",
    
    // Messages
    "msg.scan_devices": "Scan device",
    "msg.scan_complete": "Scan selesai",
    "msg.scan_failed": "Scan gagal",
    "msg.loading_cache": "Cek cache lokal...",
    "msg.loading_fresh": "Scan device untuk update...",
    "msg.load_success": "Load berhasil",
    "msg.load_failed": "Load gagal",
    
    // Settings
    "settings.title": "Pengaturan",
    "settings.language": "Bahasa",
    "settings.theme": "Tema",
    "settings.dark": "Gelap",
    "settings.light": "Terang",
    "settings.save": "Simpan",
    "settings.cancel": "Batal",
    
    // Safety
    "safety.safe": "aman",
    "safety.risky": "berisiko",
    "safety.critical": "kritis",
    "safety.unknown": "tidak diketahui",
  },
  en: {
    // Topbar
    "topbar.title": "Apps",
    "topbar.ai_analyze": "AI",
    "topbar.undo": "Undo",
    "topbar.ai_chat": "AI Chat",
    "topbar.theme": "Toggle theme",
    
    // Sidebar
    "sidebar.devices": "Devices",
    "sidebar.select_device": "— Select device —",
    "sidebar.refresh": "Refresh",
    "sidebar.device_info": "Device Info",
    "sidebar.model": "Model",
    "sidebar.android": "Android",
    "sidebar.battery": "Battery",
    "sidebar.storage": "Storage",
    "sidebar.ram": "RAM",
    "sidebar.stats": "Statistics",
    "sidebar.total_apps": "Total apps",
    "sidebar.settings": "Settings",
    
    // Stats
    "stats.total": "Total",
    "stats.safe": "Safe",
    "stats.risky": "Risky",
    "stats.unknown": "Unknown",
    
    // Toolbar
    "toolbar.search": "Search packages...",
    "toolbar.all_levels": "All levels",
    "toolbar.reset": "Reset",
    "toolbar.uninstall": "Uninstall",
    "toolbar.disable": "Disable",
    "toolbar.enable": "Enable",
    "toolbar.stop": "Stop",
    "toolbar.clear": "Clear Data",
    
    // Table
    "table.all": "All",
    "table.system": "System",
    "table.user": "User",
    "table.disabled": "Disabled",
    "table.running": "Running",
    "table.package": "Package",
    "table.safety": "Safety",
    "table.type": "Type",
    "table.status": "Status",
    "table.size": "Size",
    "table.empty": "No data. Scan a device first.",
    "table.no_result": "No results for this filter.",
    
    // Detail
    "detail.uninstall": "Uninstall",
    "detail.disable": "Disable",
    "detail.enable": "Enable",
    "detail.force_stop": "Force Stop",
    "detail.clear_data": "Clear Data",
    
    // AI Chat
    "chat.title": "AI Assistant",
    "chat.placeholder": "Type a message...",
    "chat.hint": "Ask about debloat, package safety, or ADB commands.",
    
    // Messages
    "msg.scan_devices": "Scanning devices",
    "msg.scan_complete": "Scan complete",
    "msg.scan_failed": "Scan failed",
    "msg.loading_cache": "Checking local cache...",
    "msg.loading_fresh": "Scanning device for updates...",
    "msg.load_success": "Load successful",
    "msg.load_failed": "Load failed",
    
    // Settings
    "settings.title": "Settings",
    "settings.language": "Language",
    "settings.theme": "Theme",
    "settings.dark": "Dark",
    "settings.light": "Light",
    "settings.save": "Save",
    "settings.cancel": "Cancel",
    
    // Safety
    "safety.safe": "safe",
    "safety.risky": "risky",
    "safety.critical": "critical",
    "safety.unknown": "unknown",
  },
};

export function translate(lang: Lang, key: string): string {
  return t[lang][key] ?? key;
}
