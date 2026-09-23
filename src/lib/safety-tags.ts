import type { SafetyLevel } from "../types";

export type SafetyTag = {
  level: SafetyLevel;
  reason: string;
  reasonEn: string;
};

const tags: Record<string, SafetyTag> = {
  "android":                                  { level: "critical", reason: "Inti sistem Android",         reasonEn: "System core" },
  "com.android.systemui":                     { level: "critical", reason: "Antarmuka sistem",            reasonEn: "System UI" },
  "com.android.phone":                        { level: "critical", reason: "Layanan telepon",             reasonEn: "Telephony" },
  "com.android.providers.telephony":          { level: "critical", reason: "Penyedia data telepon",       reasonEn: "Telephony provider" },
  "com.android.providers.settings":           { level: "critical", reason: "Penyedia pengaturan",         reasonEn: "Settings provider" },
  "com.android.settings":                     { level: "critical", reason: "Aplikasi pengaturan",         reasonEn: "Settings app" },
  "com.android.providers.contacts":           { level: "critical", reason: "Penyedia kontak",             reasonEn: "Contacts provider" },
  "com.android.providers.media":              { level: "critical", reason: "Penyedia media",              reasonEn: "Media provider" },
  "com.android.providers.downloads":          { level: "risky",    reason: "Penyedia unduhan",            reasonEn: "Download provider" },
  "com.android.vending":                      { level: "risky",    reason: "Play Store",                  reasonEn: "Play Store" },
  "com.google.android.gms":                   { level: "critical", reason: "Google Play Services",        reasonEn: "Google Play Services" },
  "com.google.android.gsf":                   { level: "critical", reason: "Google Services Framework",   reasonEn: "Google Services Framework" },
  "com.android.launcher3":                    { level: "critical", reason: "Launcher sistem",             reasonEn: "Launcher" },
  "com.sec.android.app.launcher":             { level: "critical", reason: "Launcher Samsung One UI",     reasonEn: "Samsung One UI launcher" },
  "com.oppo.launcher":                        { level: "critical", reason: "Launcher OPPO",               reasonEn: "OPPO launcher" },
  "com.coloros.home":                         { level: "critical", reason: "Launcher ColorOS",            reasonEn: "ColorOS launcher" },
  "com.bbk.launcher2":                        { level: "critical", reason: "Launcher Vivo",               reasonEn: "Vivo launcher" },
  "com.transsion.XOSLauncher":                { level: "critical", reason: "Launcher Infinix XOS",        reasonEn: "Infinix XOS launcher" },
  "com.transsion.hilauncher":                 { level: "critical", reason: "Launcher Tecno HiOS",         reasonEn: "Tecno HiOS launcher" },
  "com.transsion.magicshow":                  { level: "safe",     reason: "Animasi Magic Show",           reasonEn: "Magic Show animation" },
  "com.android.simappdialog":                 { level: "safe",     reason: "SIM App Dialog (Pop-up Iklan)", reasonEn: "SIM App Dialog (Promo pop-up)" },
  "com.mediatek.simprocessor":                { level: "safe",     reason: "Prosesor SIM MTK (Push Event)", reasonEn: "MTK SIM Processor (Push Event)" },
  "com.google.android.cellbroadcastreceiver": { level: "safe",     reason: "Siaran Darurat Google",        reasonEn: "Google Cell Broadcast" },
  "com.android.cellbroadcastreceiver":        { level: "safe",     reason: "Siaran Darurat Android",       reasonEn: "Android Cell Broadcast" },
  "com.android.stk2":                         { level: "safe",     reason: "SIM Toolkit 2",                reasonEn: "SIM Toolkit 2" },
  "com.geniex.vsimhelper":                    { level: "safe",     reason: "vSIM Helper Promo Roaming",    reasonEn: "GenieX vSIM Roaming Promo" },
  "com.android.adservices.api":               { level: "safe",     reason: "API Iklan & Tracking Android", reasonEn: "Android AdServices API" },
  "com.transsion.camera":                     { level: "critical", reason: "Kamera bawaan Infinix",         reasonEn: "Infinix stock camera" },
  "com.transsion.gamespace.app":              { level: "risky",    reason: "Game Space & Bypass Charge",   reasonEn: "Game Space & bypass charging" },
  "com.transsion.magazineservice.xos":        { level: "safe",     reason: "Iklan lockscreen magazine",     reasonEn: "Lockscreen carousel ads" },
  "com.transsion.personalizedService.xos":    { level: "safe",     reason: "Tracking iklan Transsion",     reasonEn: "Transsion ad profiling" },
  "com.transsion.statisticalsales":           { level: "safe",     reason: "Telemetri penjualan OEM",       reasonEn: "Sales telemetry" },
  "com.trassion.infinix.xclub":     { level: "safe",     reason: "Komunitas & promo XClub (OEM Typo)", reasonEn: "XClub Community (OEM Typo)" },
  "com.transsion.infinix.xclub":               { level: "safe",     reason: "Komunitas & promo XClub",       reasonEn: "XClub community & promos" },
  "com.transsion.carlcare":                   { level: "safe",     reason: "Layanan Carlcare",             reasonEn: "Carlcare service" },
  "com.transsion.plat.appupdate":             { level: "safe",     reason: "Updater toko Transsion",        reasonEn: "Transsion app updater" },
  "com.transsion.tips":                       { level: "safe",     reason: "Tips bawaan XOS",              reasonEn: "XOS tips" },
  "com.transsion.guideservice":               { level: "safe",     reason: "Panduan layanan pengguna",      reasonEn: "User guide service" },
  "com.transsion.manualguide":                { level: "safe",     reason: "Buku panduan digital",          reasonEn: "Digital user manual" },
  "cn.wps.moffice.lite.abroad.transsion":     { level: "safe",     reason: "WPS Office bawaan",             reasonEn: "Preinstalled WPS Office" },
  "com.facemoji.lite.transsion":              { level: "safe",     reason: "Keyboard Facemoji bawaan",      reasonEn: "Preinstalled Facemoji keyboard" },
  "com.funbase.xradio":                       { level: "safe",     reason: "Radio streaming online",        reasonEn: "Online radio streaming" },
  "com.transsion.cutepet":                    { level: "safe",     reason: "Animasi hewan layar",          reasonEn: "CutePet screen animation" },
  "com.transsion.healthlife":                 { level: "safe",     reason: "Kesehatan & pelacak langkah",   reasonEn: "Transsion Health tracker" },
  "com.transsion.wallet":                     { level: "safe",     reason: "Dompet Transsion",             reasonEn: "Transsion Wallet" },
  "com.transsion.letswitch":                  { level: "safe",     reason: "Alat migrasi ganti HP",         reasonEn: "LetSwitch migration tool" },
  "com.transsion.mobilecloner":               { level: "safe",     reason: "Alat kloning data",            reasonEn: "Mobile cloner tool" },
  "com.transsion.pcconnect":                  { level: "safe",     reason: "PC Connect Transsion",         reasonEn: "PC Connect Transsion" },
  "com.huawei.android.launcher":             { level: "critical", reason: "Launcher Huawei",             reasonEn: "Huawei launcher" },
  "com.samsung.android.honeyboard":           { level: "risky",    reason: "Keyboard Samsung",            reasonEn: "Samsung Keyboard" },
  "com.android.inputmethod.latin":            { level: "risky",    reason: "Keyboard bawaan",             reasonEn: "Keyboard" },
  "com.google.android.inputmethod.latin":     { level: "risky",    reason: "Gboard",                      reasonEn: "Gboard" },
  "com.android.bluetooth":                    { level: "critical", reason: "Stack Bluetooth",             reasonEn: "Bluetooth stack" },
  "com.android.nfc":                          { level: "risky",    reason: "NFC",                         reasonEn: "NFC" },
  "com.android.wifi":                         { level: "critical", reason: "WiFi sistem",                 reasonEn: "WiFi" },
  "com.android.server.telecom":               { level: "critical", reason: "Layanan telecom",             reasonEn: "Telecom" },
  "com.android.mms":                          { level: "risky",    reason: "SMS/MMS",                     reasonEn: "SMS/MMS" },
  "com.android.messaging":                    { level: "risky",    reason: "Pesan bawaan",                reasonEn: "Messages" },
  "com.google.android.apps.messaging":        { level: "risky",    reason: "Google Messages",             reasonEn: "Google Messages" },
  "com.android.camera2":                      { level: "risky",    reason: "Kamera bawaan",               reasonEn: "Camera" },
  "com.google.android.apps.photos":           { level: "safe",     reason: "Google Foto (pengguna)",      reasonEn: "Google Photos (user)" },
  "com.google.android.youtube":               { level: "safe",     reason: "YouTube",                     reasonEn: "YouTube" },
  "com.android.chrome":                       { level: "safe",     reason: "Chrome",                      reasonEn: "Chrome" },
  "com.google.android.apps.maps":             { level: "safe",     reason: "Google Maps",                 reasonEn: "Maps" },
  "com.whatsapp":                             { level: "safe",     reason: "WhatsApp",                    reasonEn: "WhatsApp" },
  "com.instagram.android":                    { level: "safe",     reason: "Instagram",                   reasonEn: "Instagram" },
  "com.facebook.katana":                      { level: "safe",     reason: "Facebook",                    reasonEn: "Facebook" },
  "com.facebook.orca":                        { level: "safe",     reason: "Messenger",                   reasonEn: "Messenger" },
  "com.twitter.android":                      { level: "safe",     reason: "X/Twitter",                   reasonEn: "X/Twitter" },
  "com.spotify.music":                        { level: "safe",     reason: "Spotify",                     reasonEn: "Spotify" },
  "com.tencent.mm":                           { level: "safe",     reason: "WeChat",                      reasonEn: "WeChat" },
  "com.ss.android.ugc.trill":                 { level: "safe",     reason: "TikTok",                      reasonEn: "TikTok" },
  "com.zhiliaoapp.musically":                 { level: "safe",     reason: "TikTok",                      reasonEn: "TikTok" },
  "org.lineageos.jelly":                      { level: "safe",     reason: "Browser Lineage",             reasonEn: "Lineage browser" },
  "org.lineageos.recorder":                   { level: "safe",     reason: "Perekam suara",               reasonEn: "Recorder" },
  "com.android.documentsui":                  { level: "risky",    reason: "Pengelola file",              reasonEn: "Files" },
  "com.google.android.packageinstaller":      { level: "critical", reason: "Penginstal paket",            reasonEn: "Package installer" },
  "com.android.packageinstaller":             { level: "critical", reason: "Penginstal paket",            reasonEn: "Package installer" },
  "com.android.shell":                        { level: "critical", reason: "Shell sistem",                reasonEn: "Shell" },
  "com.android.keychain":                     { level: "critical", reason: "Keychain sistem",             reasonEn: "Keychain" },
  "com.android.certinstaller":                { level: "critical", reason: "Penginstal sertifikat",       reasonEn: "Cert installer" },
  "com.miui.analytics":                       { level: "safe",     reason: "Analitik MIUI",               reasonEn: "MIUI analytics" },
  "com.miui.daemon":                          { level: "risky",    reason: "Daemon MIUI",                 reasonEn: "MIUI daemon" },
  "com.xiaomi.mipicks":                       { level: "safe",     reason: "GetApps Xiaomi",              reasonEn: "GetApps" },
  "com.miui.msa.global":                      { level: "safe",     reason: "Iklan MIUI",                  reasonEn: "MIUI ads" },
  "com.mi.globalbrowser":                     { level: "safe",     reason: "Mi Browser",                  reasonEn: "Mi Browser" },
  "com.miui.videoplayer":                     { level: "safe",     reason: "Mi Video",                    reasonEn: "Mi Video" },
  "com.miui.player":                          { level: "safe",     reason: "Mi Music",                    reasonEn: "Mi Music" },
  "com.xiaomi.glgm":                          { level: "safe",     reason: "Game Xiaomi",                 reasonEn: "Games" },
  "com.miui.android.fashiongallery":          { level: "safe",     reason: "Wallpaper carousel",          reasonEn: "Wallpaper carousel" },
  "com.miui.cloudservice":                    { level: "risky",    reason: "Mi Cloud",                    reasonEn: "Mi Cloud" },
  "com.miui.securitycenter":                  { level: "risky",    reason: "Pusat keamanan MIUI",         reasonEn: "Security center" },
  "com.miui.home":                            { level: "critical", reason: "Launcher MIUI",               reasonEn: "MIUI launcher" },
  "com.samsung.android.bixby.agent":          { level: "safe",     reason: "Bixby",                       reasonEn: "Bixby" },
  "com.samsung.android.app.spage":            { level: "safe",     reason: "Bixby Home",                  reasonEn: "Bixby Home" },
  "com.samsung.android.game.gamehome":        { level: "safe",     reason: "Game Launcher Samsung",       reasonEn: "Game Launcher" },
  "com.samsung.android.mateagent":            { level: "safe",     reason: "Galaxy Friends",              reasonEn: "Galaxy Friends" },
  "com.sec.android.app.sbrowser":             { level: "safe",     reason: "Samsung Internet",            reasonEn: "Samsung Internet" },
  "com.heytap.market":                        { level: "safe",     reason: "App Market OPPO",             reasonEn: "App Market" },
  "com.oppo.market":                          { level: "safe",     reason: "OPPO Market",                 reasonEn: "OPPO Market" },
  "com.coloros.phonemanager":                 { level: "risky",    reason: "Pengelola HP ColorOS",        reasonEn: "Phone Manager" },
  "com.realme.logtool":                       { level: "safe",     reason: "Alat log Realme",             reasonEn: "Log tool" },
  "com.vivo.appstore":                        { level: "safe",     reason: "Vivo Store",                  reasonEn: "Vivo Store" },
  "com.vivo.browser":                         { level: "safe",     reason: "Browser Vivo",                reasonEn: "Vivo Browser" },
  "com.facebook.services":                    { level: "safe",     reason: "Layanan Facebook",            reasonEn: "Facebook services" },
  "com.facebook.system":                      { level: "safe",     reason: "Sistem Facebook",             reasonEn: "Facebook system" },
  "com.facebook.appmanager":                  { level: "safe",     reason: "Manajer App Facebook",        reasonEn: "Facebook App Manager" },
  "com.google.android.partnersetup":          { level: "safe",     reason: "Setup partner Google",        reasonEn: "Partner setup" },
  "com.google.android.apps.wellbeing":        { level: "safe",     reason: "Digital Wellbeing",           reasonEn: "Digital Wellbeing" },
  "com.google.android.projection.gearhead":   { level: "safe",     reason: "Android Auto",                reasonEn: "Android Auto" },
  "com.google.android.apps.youtube.music":    { level: "safe",     reason: "YouTube Music",               reasonEn: "YT Music" },
  "com.google.android.videos":               { level: "safe",     reason: "Google TV",                   reasonEn: "Google TV" },
  "com.google.android.music":                { level: "safe",     reason: "Play Music (lama)",           reasonEn: "Play Music legacy" },
  "com.android.stk":                         { level: "risky",    reason: "SIM Toolkit",                 reasonEn: "SIM Toolkit" },
  "com.android.printspooler":                { level: "safe",     reason: "Layanan cetak",               reasonEn: "Print spooler" },
  "com.android.bips":                        { level: "safe",     reason: "Layanan cetak bawaan",        reasonEn: "Built-in Print Service" },
  "com.android.bookmarkprovider":            { level: "safe",     reason: "Penyedia bookmark",           reasonEn: "Bookmark provider" },
  "com.android.egg":                         { level: "safe",     reason: "Easter egg Android",          reasonEn: "Easter egg" },
  "com.android.wallpaper.livepicker":        { level: "safe",     reason: "Wallpaper hidup",             reasonEn: "Live wallpaper picker" },
  "com.google.android.marvin.talkback":       { level: "safe",     reason: "Pembaca layar (TalkBack)",    reasonEn: "Screen reader (TalkBack)" },
  "com.google.android.printservice.recommendation": { level: "safe", reason: "Rekomendasi cetak printer", reasonEn: "Print recommendation service" },
  "com.android.devicediagnostics":            { level: "safe",     reason: "Diagnostik perangkat",        reasonEn: "Device diagnostics" },
  "com.google.android.apps.emojiwallpaper":   { level: "safe",     reason: "Wallpaper emoji bawaan",      reasonEn: "Emoji wallpaper" },
  "com.google.android.apps.tachyon":          { level: "safe",     reason: "Google Meet bawaan",          reasonEn: "Google Meet" },
  "com.google.android.apps.translate":        { level: "safe",     reason: "Google Terjemahan bawaan",    reasonEn: "Google Translate" },
  "com.google.android.apps.docs":             { level: "safe",     reason: "Google Dokumen",              reasonEn: "Google Docs" },
  "com.google.android.apps.docs.editors.docs": { level: "safe",    reason: "Editor Google Dokumen",       reasonEn: "Google Docs Editor" },
  "com.sec.android.soagent":               { level: "safe",     reason: "Samsung OTA Agent",             reasonEn: "Samsung OTA Agent" },
  "com.wssyncmldm":                       { level: "safe",     reason: "Samsung Device Management Update", reasonEn: "Samsung Device Management Update" },
  "com.samsung.sdm":                       { level: "safe",     reason: "Samsung Software Update",       reasonEn: "Samsung Software Update" },
  "com.samsung.sdm.sdmviewer":             { level: "safe",     reason: "Samsung SDM Viewer",             reasonEn: "Samsung SDM Viewer" },
  "com.android.updater":                   { level: "safe",     reason: "Xiaomi/MIUI Updater",           reasonEn: "Xiaomi/MIUI Updater" },
  "com.coloros.sau":                       { level: "safe",     reason: "OPPO Software Auto Update",     reasonEn: "OPPO Software Auto Update" },
  "com.coloros.sauhelper":                 { level: "safe",     reason: "OPPO SAU Helper",               reasonEn: "OPPO SAU Helper" },
  "com.oppo.ota":                          { level: "safe",     reason: "OPPO OTA Update",               reasonEn: "OPPO OTA Update" },
  "com.oplus.ota":                         { level: "safe",     reason: "OnePlus/Oplus OTA Update",      reasonEn: "OnePlus/Oplus OTA Update" },
  "com.coloros.ota":                       { level: "safe",     reason: "ColorOS OTA Update",            reasonEn: "ColorOS OTA Update" },
  "com.bbk.updater":                       { level: "safe",     reason: "Vivo/iQOO Updater",             reasonEn: "Vivo/iQOO Updater" },
  "com.vivo.abe":                          { level: "safe",     reason: "Vivo Auto Update Engine",       reasonEn: "Vivo Auto Update Engine" },
  "com.transsion.systemupdate":            { level: "safe",     reason: "Infinix/Tecno System Update",   reasonEn: "Infinix/Tecno System Update" },
  "com.transsion.ota":                     { level: "safe",     reason: "Infinix/Tecno OTA Core",        reasonEn: "Infinix/Tecno OTA Core" },
  "com.sec.android.systemupdate":           { level: "safe",     reason: "Samsung System Update",         reasonEn: "Samsung System Update" },
  "com.huawei.android.hwouc":               { level: "safe",     reason: "Huawei OTA Update Center",      reasonEn: "Huawei OTA Update Center" },
};

export function classifyPackage(packageName: string, lang = "id"): SafetyTag {
  const tag = tags[packageName];
  if (tag) {
    return lang === "id" ? tag : { ...tag, reason: tag.reasonEn };
  }
  // Sekring deteksi launcher OEM otomatis
  const lower = packageName.toLowerCase();
  if (
    (lower.includes("launcher") || lower.endsWith(".home")) &&
    !lower.includes("gamehome") &&
    !lower.includes("carlauncher")
  ) {
    return {
      level: "critical",
      reason: lang === "id" ? "Launcher sistem — hati-hati" : "System launcher — caution",
      reasonEn: "System launcher — caution",
    };
  }

  // ponytail: hanya flag critical kalau BUKAN package yang sudah di-map di tags dict
  if (
    (packageName.startsWith("com.android.") ||
     packageName.startsWith("android.") ||
     packageName === "com.google.android.gms" ||
     packageName === "com.google.android.gsf") &&
    !tags[packageName]
  ) {
    return {
      level: "risky",
      reason: lang === "id" ? "Awalan Android/Google — cek manual" : "Android/Google prefix — check manually",
      reasonEn: "Android/Google prefix — check manually",
    };
  }
  if (
    packageName.includes("analytics") ||
    packageName.includes("adservices") ||
    packageName.includes("feedback") ||
    packageName.includes("bugreport")
  ) {
    return {
      level: "safe",
      reason: lang === "id" ? "Kemungkinan analitik/telemetri" : "Likely analytics/telemetry",
      reasonEn: "Likely analytics/telemetry",
    };
  }
  return {
    level: "unknown",
    reason: lang === "id" ? "Belum diklasifikasi" : "Not classified",
    reasonEn: "Not classified",
  };
}

export function enrichApps<T extends { package_name: string; safety_level: string; safety_reason: string; label?: string }>(
  apps: T[],
  lang = "id",
): T[] {
  return apps.map((a) => {
    if (a.safety_level && a.safety_level !== "unknown") return a;
    const tag = classifyPackage(a.package_name, lang);
    return {
      ...a,
      safety_level: tag.level,
      safety_reason: tag.reason || a.safety_reason,
    };
  });
}
