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
  "com.android.wallpaper.livepicker":        { level: "safe",     reason: "Wallpaper hidup",             reasonEn: "Live wallpaper" },
};

export function classifyPackage(packageName: string, lang = "id"): SafetyTag {
  const tag = tags[packageName];
  if (tag) {
    return lang === "id" ? tag : { ...tag, reason: tag.reasonEn };
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
