import type { DebloatPreset } from "./presets-types";

export type { DebloatPreset };

export const DEBLOAT_PRESETS: DebloatPreset[] = [
  {
    brand: "Xiaomi / POCO / Redmi",
    packages: [
      { name: "com.miui.analytics", description: "MIUI Analytics", safe_to_remove: true },
      { name: "com.miui.msa.global", description: "MSA Ads", safe_to_remove: true },
      { name: "com.xiaomi.mipicks", description: "GetApps", safe_to_remove: true },
      { name: "com.mi.globalbrowser", description: "Mi Browser", safe_to_remove: true },
      { name: "com.miui.videoplayer", description: "Mi Video", safe_to_remove: true },
      { name: "com.miui.player", description: "Mi Music", safe_to_remove: true },
      { name: "com.xiaomi.glgm", description: "Games", safe_to_remove: true },
      { name: "com.miui.android.fashiongallery", description: "Wallpaper carousel", safe_to_remove: true },
    ],
  },
  {
    brand: "Samsung",
    packages: [
      { name: "com.samsung.android.bixby.agent", description: "Bixby", safe_to_remove: true },
      { name: "com.samsung.android.app.spage", description: "Bixby Home", safe_to_remove: true },
      { name: "com.samsung.android.game.gamehome", description: "Game Launcher", safe_to_remove: true },
      { name: "com.samsung.android.mateagent", description: "Galaxy Friends", safe_to_remove: true },
    ],
  },
  {
    brand: "OPPO / Realme",
    packages: [
      { name: "com.heytap.market", description: "App Market", safe_to_remove: true },
      { name: "com.oppo.market", description: "OPPO Market", safe_to_remove: true },
      { name: "com.realme.logtool", description: "Log tool", safe_to_remove: true },
    ],
  },
  {
    brand: "Vivo",
    packages: [
      { name: "com.vivo.appstore", description: "Vivo Store", safe_to_remove: true },
      { name: "com.vivo.browser", description: "Vivo Browser", safe_to_remove: true },
    ],
  },
  {
    brand: "Generic AOSP / Facebook",
    packages: [
      { name: "com.facebook.services", description: "Facebook Services", safe_to_remove: true },
      { name: "com.facebook.system", description: "Facebook System", safe_to_remove: true },
      { name: "com.facebook.appmanager", description: "Facebook App Manager", safe_to_remove: true },
      { name: "com.android.egg", description: "Android Easter Egg", safe_to_remove: true },
      { name: "com.android.bookmarkprovider", description: "Bookmark Provider", safe_to_remove: true },
    ],
  },
  {
    brand: "Infinix / Tecno / itel",
    packages: [
      { name: "com.transsion.XOSLauncher", description: "XOS Launcher (hati-hati)", safe_to_remove: false },
      { name: "com.transsion.magicshow", description: "Magic Show", safe_to_remove: true },
    ],
  },
];
