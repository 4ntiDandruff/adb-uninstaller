// Mapping kode error teknis ke pesan manusiawi
export function humanizeError(error: string): string {
  // ADB Errors
  if (error.includes("ADB-1001")) return "ADB belum terinstall. Install: sudo apt install adb";
  if (error.includes("ADB-1002")) return "Gagal scan device. Pastikan HP terhubung dan USB debugging aktif.";
  if (error.includes("ADB-2001")) return "Gagal baca daftar aplikasi. Coba reconnect HP.";
  if (error.includes("ADB-2002")) return "Gagal baca ukuran aplikasi.";
  if (error.includes("ADB-3001")) return "Uninstall gagal. App mungkin system app yang diproteksi.";
  if (error.includes("ADB-3002")) return "Disable gagal. App mungkin sedang berjalan.";
  if (error.includes("ADB-3003")) return "Enable gagal. App mungkin corrupt.";
  if (error.includes("ADB-3004")) return "Force stop gagal. App mungkin system critical.";
  if (error.includes("ADB-3005")) return "Clear data gagal. App mungkin sedang dipakai.";
  if (error.includes("ADB-3006")) return "Restore gagal. App mungkin tidak pernah di-disable.";
  
  // AI Errors
  if (error.includes("ADB-4001")) return "Koneksi internet bermasalah. Cek jaringan.";
  if (error.includes("ADB-4002")) return "Server AI tidak merespon. Cek URL dan API key di Settings.";
  if (error.includes("ADB-4003")) return "Gagal baca balasan AI. Coba lagi.";
  if (error.includes("ADB-4004")) {
    if (error.includes("401")) return "API key salah atau expired. Cek di Settings.";
    if (error.includes("429")) return "Rate limit AI habis. Tunggu 1 menit.";
    if (error.includes("500")) return "Server AI sedang gangguan. Coba lagi 5 menit.";
    return "Server AI error. Cek koneksi dan settings.";
  }
  if (error.includes("ADB-4005")) return "API key kosong. Isi dulu di Settings.";
  if (error.includes("ADB-4006")) return "Gagal kirim data ke AI. Coba lagi.";
  if (error.includes("ADB-4007")) return "Balasan AI tidak valid. Coba lagi.";
  if (error.includes("ADB-4008")) return "AI balas format aneh. Coba lagi atau ganti model.";
  if (error.includes("ADB-4009")) return "AI tidak balas apa-apa. Cek model di Settings.";
  if (error.includes("ADB-4010")) return "Format balasan AI tidak dikenal. Update aplikasi.";
  
  // Settings Errors
  if (error.includes("ADB-5001")) return "Folder config tidak ditemukan.";
  if (error.includes("ADB-5002")) return "Gagal buat folder config.";
  if (error.includes("ADB-5003")) return "Gagal baca settings.";
  if (error.includes("ADB-5004")) return "Settings corrupt. Reset ke default.";
  if (error.includes("ADB-5005")) return "Gagal simpan settings.";
  if (error.includes("ADB-5006")) return "Gagal tulis file settings.";
  
  // DB Errors
  if (error.includes("DB-001")) return "Folder config tidak ditemukan.";
  if (error.includes("DB-002")) return "Gagal buat folder cache.";
  if (error.includes("DB-003")) return "Gagal buka database cache.";
  if (error.includes("DB-004")) return "Gagal buat tabel cache.";
  if (error.includes("DB-005")) return "Gagal buat index cache.";
  if (error.includes("DB-006")) return "Database cache sedang dipakai.";
  if (error.includes("DB-007")) return "Database cache tidak terinit.";
  if (error.includes("DB-008")) return "Gagal baca cache.";
  if (error.includes("DB-009")) return "Gagal baca waktu scan.";
  if (error.includes("DB-010")) return "Gagal hapus cache.";
  
  // Generic
  return error;
}
