import type { SafetyLevel } from "../types";

/** Static offline safety classification. AI only for unknown. */
export type SafetyTag = {
  level: SafetyLevel;
  reason: string;
};

const tags: Record<string, SafetyTag> = {
  // Critical — core Android / telephony
  "android": { level: "critical", reason: "System core" },
  "com.android.systemui": { level: "critical", reason: "System UI" },
  "com.android.phone": { level: "critical", reason: "Telephony" },
  "com.android.providers.telephony": { level: "critical", reason: "Telephony provider" },
  "com.android.providers.settings": { level: "critical", reason: "Settings provider" },
  "com.android.settings": { level: "critical", reason: "Settings app" },
  "com.android.providers.contacts": { level: "critical", reason: "Contacts provider" },
  "com.android.providers.media": { level: "critical", reason: "Media provider" },
  "com.android.providers.downloads": { level: "risky", reason: "Download provider" },
  "com.android.vending": { level: "risky", reason: "Play Store" },
  "com.google.android.gms": { level: "critical", reason: "Google Play Services" },
  "com.google.android.gsf": { level: "critical", reason: "Google Services Framework" },
  "com.android.launcher3": { level: "critical", reason: "Launcher" },
  "com.android.inputmethod.latin": { level: "risky", reason: "Keyboard" },
  "com.google.android.inputmethod.latin": { level: "risky", reason: "Gboard" },
  "com.android.bluetooth": { level: "critical", reason: "Bluetooth stack" },
  "com.android.nfc": { level: "risky", reason: "NFC" },
  "com.android.wifi": { level: "critical", reason: "WiFi" },
  "com.android.server.telecom": { level: "critical", reason: "Telecom" },
  "com.android.mms": { level: "risky", reason: "SMS/MMS" },
  "com.android.messaging": { level: "risky", reason: "Messages" },
  "com.google.android.apps.messaging": { level: "risky", reason: "Google Messages" },
  "com.android.camera2": { level: "risky", reason: "Camera" },
  "com.google.android.apps.photos": { level: "safe", reason: "Google Photos (user)" },
  "com.google.android.youtube": { level: "safe", reason: "YouTube" },
  "com.android.chrome": { level: "safe", reason: "Chrome" },
  "com.google.android.apps.maps": { level: "safe", reason: "Maps" },
  "com.whatsapp": { level: "safe", reason: "WhatsApp" },
  "com.instagram.android": { level: "safe", reason: "Instagram" },
  "com.facebook.katana": { level: "safe", reason: "Facebook" },
  "com.facebook.orca": { level: "safe", reason: "Messenger" },
  "com.twitter.android": { level: "safe", reason: "X/Twitter" },
  "com.spotify.music": { level: "safe", reason: "Spotify" },
  "com.tencent.mm": { level: "safe", reason: "WeChat" },
  "com.ss.android.ugc.trill": { level: "safe", reason: "TikTok" },
  "com.zhiliaoapp.musically": { level: "safe", reason: "TikTok" },
  "org.lineageos.jelly": { level: "safe", reason: "Lineage browser" },
  "org.lineageos.recorder": { level: "safe", reason: "Recorder" },
  "com.android.documentsui": { level: "risky", reason: "Files" },
  "com.google.android.packageinstaller": { level: "critical", reason: "Package installer" },
  "com.android.packageinstaller": { level: "critical", reason: "Package installer" },
  "com.android.shell": { level: "critical", reason: "Shell" },
  "com.android.keychain": { level: "critical", reason: "Keychain" },
  "com.android.certinstaller": { level: "critical", reason: "Cert installer" },
  // Xiaomi bloat (often safe to disable)
  "com.miui.analytics": { level: "safe", reason: "MIUI analytics" },
  "com.miui.daemon": { level: "risky", reason: "MIUI daemon" },
  "com.xiaomi.mipicks": { level: "safe", reason: "GetApps" },
  "com.miui.msa.global": { level: "safe", reason: "MIUI ads" },
  "com.mi.globalbrowser": { level: "safe", reason: "Mi Browser" },
  "com.miui.videoplayer": { level: "safe", reason: "Mi Video" },
  "com.miui.player": { level: "safe", reason: "Mi Music" },
  "com.xiaomi.glgm": { level: "safe", reason: "Games" },
  "com.miui.android.fashiongallery": { level: "safe", reason: "Wallpaper carousel" },
  "com.miui.cloudservice": { level: "risky", reason: "Mi Cloud" },
  "com.miui.securitycenter": { level: "risky", reason: "Security center" },
  "com.miui.home": { level: "critical", reason: "MIUI launcher" },
  // Samsung bloat
  "com.samsung.android.bixby.agent": { level: "safe", reason: "Bixby" },
  "com.samsung.android.app.spage": { level: "safe", reason: "Bixby Home" },
  "com.samsung.android.game.gamehome": { level: "safe", reason: "Game Launcher" },
  "com.samsung.android.mateagent": { level: "safe", reason: "Galaxy Friends" },
  "com.sec.android.app.sbrowser": { level: "safe", reason: "Samsung Internet" },
  // OPPO / Realme / ColorOS
  "com.heytap.market": { level: "safe", reason: "App Market" },
  "com.oppo.market": { level: "safe", reason: "OPPO Market" },
  "com.coloros.phonemanager": { level: "risky", reason: "Phone Manager" },
  "com.realme.logtool": { level: "safe", reason: "Log tool" },
  // Vivo
  "com.vivo.appstore": { level: "safe", reason: "Vivo Store" },
  "com.vivo.browser": { level: "safe", reason: "Vivo Browser" },
  // Generic analytics / ads
  "com.facebook.services": { level: "safe", reason: "Facebook services" },
  "com.facebook.system": { level: "safe", reason: "Facebook system" },
  "com.facebook.appmanager": { level: "safe", reason: "Facebook App Manager" },
  "com.google.android.partnersetup": { level: "safe", reason: "Partner setup" },
  "com.google.android.apps.wellbeing": { level: "safe", reason: "Digital Wellbeing" },
  "com.google.android.projection.gearhead": { level: "safe", reason: "Android Auto" },
  "com.google.android.apps.youtube.music": { level: "safe", reason: "YT Music" },
  "com.google.android.videos": { level: "safe", reason: "Google TV" },
  "com.google.android.music": { level: "safe", reason: "Play Music legacy" },
  "com.android.stk": { level: "risky", reason: "SIM Toolkit" },
  "com.android.printspooler": { level: "safe", reason: "Print spooler" },
  "com.android.bips": { level: "safe", reason: "Built-in Print Service" },
  "com.android.bookmarkprovider": { level: "safe", reason: "Bookmark provider" },
  "com.android.egg": { level: "safe", reason: "Easter egg" },
  "com.android.wallpaper.livepicker": { level: "safe", reason: "Live wallpaper" },
};

export function classifyPackage(packageName: string): SafetyTag {
  if (tags[packageName]) return tags[packageName];
  // Heuristic prefixes
  if (
    packageName.startsWith("com.android.") ||
    packageName.startsWith("android.") ||
    packageName.startsWith("com.google.android.gms") ||
    packageName === "com.google.android.gsf"
  ) {
    return { level: "critical", reason: "Android/Google core prefix" };
  }
  if (
    packageName.includes("analytics") ||
    packageName.includes("adservices") ||
    packageName.includes("feedback") ||
    packageName.includes("bugreport")
  ) {
    return { level: "safe", reason: "Likely analytics/telemetry" };
  }
  return { level: "unknown", reason: "Belum diklasifikasi" };
}

export function enrichApps<T extends { package_name: string; safety_level: string; safety_reason: string }>(
  apps: T[],
): T[] {
  return apps.map((a) => {
    const tag = classifyPackage(a.package_name);
    return {
      ...a,
      safety_level: tag.level,
      safety_reason: tag.reason,
    };
  });
}
