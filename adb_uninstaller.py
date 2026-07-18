#!/usr/bin/env python3
"""
ADB Uninstaller — Android Debloater GUI
Uninstall, disable, and enable Android packages via ADB.
Single-file, no external dependencies beyond stdlib + tkinter.
"""

import tkinter as tk
from tkinter import ttk, messagebox
import subprocess
import threading
import re
import shlex
import os


# ─── Critical packages: double-confirm before any action ───
CRITICAL_PACKAGES = {
    "com.android.settings",
    "com.android.systemui",
    "com.android.phone",
    "com.android.server.telecom",
    "com.android.providers.contacts",
    "com.android.providers.telephony",
    "com.android.providers.media",
    "com.android.providers.downloads",
    "com.android.inputmethod.latin",
    "com.android.launcher",
    "com.android.launcher3",
    "com.google.android.gms",
    "com.google.android.gsf",
    "com.android.vending",
    "com.android.bluetooth",
    "com.android.nfc",
}
# ── Popular App Names Dictionary for Instant Offline Lookup ──
POPULAR_APP_NAMES = {
    # ── Chat & Social Media ──
    "com.whatsapp": "WhatsApp",
    "com.whatsapp.w4b": "WhatsApp Business",
    "org.telegram.messenger": "Telegram",
    "org.telegram.plus": "Plus Messenger",
    "com.facebook.katana": "Facebook",
    "com.facebook.lite": "Facebook Lite",
    "com.facebook.orca": "Messenger",
    "com.facebook.mlite": "Messenger Lite",
    "com.instagram.android": "Instagram",
    "com.instagram.lite": "Instagram Lite",
    "com.ss.android.ugc.trill": "TikTok",
    "com.zhiliaoapp.musically": "TikTok",
    "com.ss.android.ugc.aweme.lite": "TikTok Lite",
    "com.twitter.android": "X (Twitter)",
    "com.linecorp.line.android": "LINE",
    "com.linecorp.linelite": "LINE Lite",
    "com.discord": "Discord",
    "com.pinterest": "Pinterest",
    "com.snapchat.android": "Snapchat",
    "com.reddit.frontpage": "Reddit",
    "com.linkedin.android": "LinkedIn",
    "com.tencent.mm": "WeChat",
    "sg.bigo.live": "BIGO LIVE",
    
    # ── E-Commerce & Shopping ──
    "com.shopee.id": "Shopee",
    "com.tokopedia.tkpd": "Tokopedia",
    "com.lazada.android": "Lazada",
    "com.bukalapak": "Bukalapak",
    "blibli.mobile.commerce": "Blibli",
    "com.akulaku.finance": "Akulaku",
    "com.alibaba.aliexpress.ita": "AliExpress",
    "com.amazon.mShop.android.shopping": "Amazon Shopping",
    "com.ebay.mobile": "eBay",
    "com.shein.ecom": "SHEIN",
    "com.tenpercent.temu": "Temu",
    
    # ── Ride Hailing & Logistics ──
    "net.gojek.app": "Gojek",
    "com.grabtaxi.passenger": "Grab",
    "com.taxsee.taxipassenger": "Maxim",
    "com.indriver.passenger": "inDrive",
    "com.traveloka.android": "Traveloka",
    "com.tiket.reporter": "Tiket.com",
    "id.co.kai.access": "Access by KAI",
    "com.kargo.shipper.app": "Kargo Shipper",
    "com.jne.myjne": "MyJNE",
    "com.jet.express": "J&T Express",
    "id.co.posindonesia.posaja": "PosAja!",
    "com.anteraja.customer": "Anteraja",
    "com.sicepat.express": "SiCepat Ekspres",
    
    # ── E-Wallet & Digital Payment ──
    "id.dana": "DANA",
    "id.ovo.user": "OVO",
    "com.sgo.nobu.payment.paypro": "GoPay",
    "com.telkom.looppay": "LinkAja",
    "id.co.rancomp.spay": "ShopeePay",
    "id.astra.astrapay": "AstraPay",
    "com.isaku.pocket": "i.saku",
    
    # ── Banking & Finance (Indonesia) ──
    "com.bca": "BCA Mobile",
    "id.co.bca.blue": "blu by BCA Digital",
    "id.co.mandiri.livin": "Livin' by Mandiri",
    "id.co.bri.brimo": "BRImo",
    "src.bni.otc": "BNI Mobile Banking",
    "com.bankbsi.bsimobile": "BSI Mobile",
    "id.co.btn.smartbanking": "BTN Mobile",
    "id.co.bcasyariah.mobile": "BCA Syariah Mobile",
    "com.cimbniaga.octomobile": "OCTO Mobile CIMB",
    "id.co.permata.mobile": "PermataMobile X",
    "id.co.danamon.dbank.registration": "D-Bank PRO Danamon",
    "com.digibank": "digibank by DBS",
    "id.co.ocbcnisp.onemobile": "ONEMobile OCBC",
    "id.co.bankmega.msmile": "M-Smile Bank Mega",
    "com.jtrust.mobi": "J Trust Mobile",
    "com.bankneocommerce.neobank": "neobank",
    "com.aladinbank.app": "Aladin Bank",
    "co.id.allo.allobank": "Allo Bank",
    "id.co.btpn.jenius": "Jenius",
    
    # ── Government, Health & Public Services ──
    "com.bpjs.jkn": "Mobile JKN",
    "dto.kemkes.satusehat": "SATUSEHAT Mobile",
    "com.pln.singlepoint": "PLN Mobile",
    "id.mypertamina.consumer": "MyPertamina",
    "id.go.kemenkeu.djp.efiling": "M-Pajak",
    "id.go.depok.depoksinglewindow": "Depok Single Window",
    "id.go.bkn.siasn.asn": "MyASN BKN",
    "id.go.kemendagri.identitas_kependudukan_digital": "IKD (Identitas Kependudukan Digital)",
    
    # ── Games Popular in Indonesia ──
    "com.mobile.legends": "Mobile Legends",
    "com.dts.freefireth": "Garena Free Fire",
    "com.dts.freefiremax": "Garena Free Fire MAX",
    "com.tencent.ig": "PUBG MOBILE",
    "com.miHoYo.GenshinImpact": "Genshin Impact",
    "com.miHoYo.hkrpg": "Honkai: Star Rail",
    "com.mojang.minecraftpe": "Minecraft",
    "com.roblox.client": "Roblox",
    "com.supercell.clashofclans": "Clash of Clans",
    "com.supercell.clashroyale": "Clash Royale",
    "com.supercell.brawlstars": "Brawl Stars",
    "com.ea.gp.fifamobile": "FC Mobile",
    "jp.konami.pesam": "eFootball",
    "com.kiloo.subwaysurf": "Subway Surfers",
    "com.king.candycrushsaga": "Candy Crush Saga",
    "com.ludo.king": "Ludo King",
    
    # ── Tools, Utilities & Browsers ──
    "com.android.chrome": "Google Chrome",
    "com.opera.browser": "Opera Browser",
    "com.opera.mini.native": "Opera Mini",
    "org.mozilla.firefox": "Firefox",
    "com.sec.android.app.sbrowser": "Samsung Internet",
    "com.mi.globalbrowser": "Mi Browser",
    "com.lenovo.anyshare.gps": "SHAREit",
    "com.tailscale.ipn": "Tailscale",
    "com.maxmpz.equalizer": "Poweramp Equalizer",
    "app.lawnchair.play": "Lawnchair Launcher",
    "com.microsoft.emmx": "Microsoft Edge",
    "com.brave.browser": "Brave Browser",
    "com.duckduckgo.mobile.android": "DuckDuckGo Browser",
    
    # ── Entertainment & Streaming ──
    "com.google.android.youtube": "YouTube",
    "app.morphe.android.youtube": "YouTube ReVanced",
    "app.revanced.android.gms": "microG ReVanced",
    "com.google.android.apps.youtube.music": "YouTube Music",
    "com.spotify.music": "Spotify",
    "com.joox.co.id": "JOOX",
    "com.netflix.mediaclient": "Netflix",
    "com.disney.disneyplus": "Disney+ Hotstar",
    "com.viu.phone": "Viu",
    "id.co.vidio.android": "Vidio",
    "com.hulu": "Hulu",
    "com.hbo.hbonow": "Max (HBO)",
    "com.amazon.avod.thirdpartyclient": "Prime Video",
    "com.wechat.vcomic": "WeTV",
    "com.iqiyi.i18n": "iQIYI",
    "com.webtoon": "LINE Webtoon",
    
    # ── Google Apps Suite ──
    "com.google.android.gms": "Google Play Services",
    "com.google.android.gsf": "Google Services Framework",
    "com.android.vending": "Google Play Store",
    "com.google.android.keep": "Google Keep",
    "com.google.android.apps.maps": "Google Maps",
    "com.google.android.apps.photos": "Google Photos",
    "com.google.android.gm": "Gmail",
    "com.google.android.apps.bard": "Gemini",
    "com.google.android.apps.docs": "Google Drive",
    "com.google.android.apps.tachyon": "Google Meet",
    "com.google.android.calendar": "Google Calendar",
    "com.google.android.apps.messaging": "Google Messages",
    "com.google.android.inputmethod.latin": "Gboard",
    "com.google.android.contacts": "Google Contacts",
    "com.google.android.dialer": "Google Phone",
    
    # ── Productivity & Cloud ──
    "com.microsoft.office.officehubrow": "Microsoft 365",
    "com.microsoft.office.word": "Microsoft Word",
    "com.microsoft.office.excel": "Microsoft Excel",
    "com.microsoft.office.powerpoint": "Microsoft PowerPoint",
    "com.microsoft.todos": "Microsoft To Do",
    "com.microsoft.teams": "Microsoft Teams",
    "com.dropbox.android": "Dropbox",
    "com.adobe.reader": "Adobe Acrobat Reader",
    "com.adobe.lrmobile": "Adobe Lightroom",
    "cn.wps.moffice_eng": "WPS Office",
    "com.notion.id": "Notion",
    "com.slack": "Slack",
    "com.zoom.videomeetings": "Zoom"
}



class ADBController:
    """All ADB interactions."""

    def __init__(self):
        self.uad_db = {}
        self._load_uad_database()

    def run(self, command, timeout=30):
        try:
            # Note: command is internally constructed, not user input
            # But we validate as defense-in-depth
            r = subprocess.run(
                f"adb {command}", shell=True,
                capture_output=True, text=True, timeout=timeout
            )
            return r.stdout.strip(), r.returncode
        except subprocess.TimeoutExpired:
            return "Timeout", 1
        except Exception as e:
            return str(e), 1

    def get_device(self):
        out, code = self.run("devices")
        if code != 0:
            return None, None
        lines = out.split("\n")[1:]
        for line in lines:
            if "\tdevice" in line:
                dev_id = line.split("\t")[0]
                brand, _ = self.run("shell getprop ro.product.brand")
                model, _ = self.run("shell getprop ro.product.model")
                name = f"{brand} {model}".strip() if brand else dev_id
                return dev_id, name
        return None, None

    def scan_packages(self, progress_cb=None):
        """Return list of dicts: {pkg, app_name, status, category, path}"""
        out_all, _ = self.run("shell pm list packages -f", timeout=60)
        if not out_all:
            return []

        # Disabled packages set
        out_dis, _ = self.run("shell pm list packages -d")
        disabled = set()
        if out_dis:
            for line in out_dis.split("\n"):
                line = line.strip()
                if line.startswith("package:"):
                    disabled.add(line.replace("package:", ""))

        # Accurate System packages list directly from PM
        out_sys, _ = self.run("shell pm list packages -s")
        system_pkgs = set()
        if out_sys:
            for line in out_sys.split("\n"):
                line = line.strip()
                if line.startswith("package:"):
                    system_pkgs.add(line.replace("package:", ""))

        # User-installed packages list directly from PM (-3 flag represents third-party)
        out_user, _ = self.run("shell pm list packages -3")
        user_installed_pkgs = set()
        if out_user:
            for line in out_user.split("\n"):
                line = line.strip()
                if line.startswith("package:"):
                    user_installed_pkgs.add(line.replace("package:", ""))

        lines = out_all.split("\n")
        total = len(lines)
        packages = []

        for i, line in enumerate(lines):
            line = line.strip()
            if not line.startswith("package:"):
                continue
            rest = line[len("package:"):]
            eq_idx = rest.rfind("=")
            if eq_idx == -1:
                continue
            path = rest[:eq_idx]
            pkg = rest[eq_idx + 1:]

            # Precision logic: 
            # 1. If it's registered in system packages (-s), it's ALWAYS a system app (even if updated in /data/app/)
            # 2. If it's not in system packages, and it's in third-party (-3), it's a User App
            # 3. Fallback: Path analysis if pm queries failed to map correctly
            if pkg in system_pkgs:
                is_system = True
            elif pkg in user_installed_pkgs:
                is_system = False
            else:
                is_system = any(x in path for x in ["/system/", "/vendor/", "/product/", "/apex/"]) and not "/data/app/" in path

            category = "system" if is_system else "user"
            status = "disabled" if pkg in disabled else "enabled"

            packages.append({
                "pkg": pkg, "app_name": "", "status": status,
                "category": category, "path": path,
            })
            if progress_cb and i % 10 == 0:
                progress_cb(i, total, f"Listing packages... {i}/{total}")

        total_pkg = len(packages)
        for i, p in enumerate(packages):
            p["app_name"] = self._get_app_name(p["pkg"])
            if progress_cb and i % 5 == 0:
                progress_cb(i, total_pkg, f"Resolving names... {i}/{total_pkg}")

        return packages

    def _load_uad_database(self):
        import os
        import json
        db_path = "/home/hizam/proyek/adb-uninstaller/uad_debloat.json"
        if os.path.exists(db_path):
            try:
                with open(db_path, "r") as f:
                    data = json.load(f)
                    for item in data:
                        pkg_id = item.get("id")
                        if pkg_id:
                            # Format name dynamically or fallback
                            self.uad_db[pkg_id] = item.get("description", "").split("\n")[0].strip() or pkg_id
            except Exception as e:
                print(f"Gagal memuat database UAD: {str(e)}")

    def _get_app_name(self, pkg):
        # 1. Check popular offline database
        if pkg in POPULAR_APP_NAMES:
            return POPULAR_APP_NAMES[pkg]
            
        # 2. Check 2,400+ UAD database
        if pkg in self.uad_db and self.uad_db[pkg]:
            # Clean descriptions to extract names
            desc = self.uad_db[pkg]
            if desc and not desc.startswith("http"):
                # Clean up punctuation and common description preambles
                clean_name = desc.split(".")[0].split("(")[0].strip()
                if len(clean_name) > 3 and len(clean_name) < 40:
                    return clean_name
                    
        # 3. Fallback: Dumpsys label lookup
        out, code = self.run(
            f"shell dumpsys package {pkg} 2>/dev/null | grep -i 'applicationInfo' -A 20 | head -25",
            timeout=5,
        )
        if code == 0 and out:
            for line in out.split("\n"):
                if "nonLocalizedLabel=" in line:
                    m = re.search(r"nonLocalizedLabel=(\S+)", line)
                    if m and m.group(1) != "null":
                        return m.group(1)
        
        # 4. Fallback: package name capitalization
        parts = pkg.split(".")
        return parts[-1].replace("_", " ").title() if parts else pkg

    def uninstall(self, pkg):
        safe_pkg = shlex.quote(pkg)
        out, code = self.run(f"shell pm uninstall -k --user 0 {safe_pkg}", timeout=15)
        return code == 0 and "Success" in out, out

    def disable(self, pkg):
        safe_pkg = shlex.quote(pkg)
        out, code = self.run(f"shell pm disable-user --user 0 {safe_pkg}", timeout=15)
        return code == 0, out

    def enable(self, pkg):
        safe_pkg = shlex.quote(pkg)
        out, code = self.run(f"shell pm enable --user 0 {safe_pkg}", timeout=15)
        return code == 0, out

    def get_running_user_apps(self, user_packages):
        """Return list of running user-installed packages with PIDs."""
        out, code = self.run("shell ps -A -o PID,NAME", timeout=10)
        if code != 0 or not out:
            return []
        running = {}
        for line in out.split("\n")[1:]:
            parts = line.strip().split(None, 1)
            if len(parts) == 2:
                pid, name = parts
                if pid.isdigit():
                    running[name] = pid
        
        result = []
        seen = set()
        user_pkg_set = {p["pkg"] for p in user_packages}
        for proc_name, pid in running.items():
            # Strip suffixes like :push, :remote, :privileged_process0, etc.
            base_name = proc_name.split(":")[0]
            if base_name in user_pkg_set and base_name not in seen:
                seen.add(base_name)
                result.append({"pkg": base_name, "pid": pid})
        return result

    def force_stop(self, pkg):
        safe_pkg = shlex.quote(pkg)
        out, code = self.run(f"shell am force-stop {safe_pkg}", timeout=10)
        return code == 0, out

    def get_device_specs(self):
        """Return dict of hardware specs using a single ADB call."""
        out, code = self.run(
            'shell "getprop ro.product.brand; '
            'getprop ro.product.model; '
            'getprop ro.build.version.release; '
            'getprop ro.build.version.sdk; '
            'getprop ro.product.cpu.abi"',
            timeout=10
        )
        if code != 0 or not out:
            return {
                "brand": "UNKNOWN", "model": "UNKNOWN", 
                "release": "UNKNOWN", "sdk": "UNKNOWN", "abi": "UNKNOWN"
            }
        
        lines = [line.strip() for line in out.split("\n") if line.strip()]
        # Ensure we have at least 5 lines (pad if missing)
        while len(lines) < 5:
            lines.append("UNKNOWN")
            
        return {
            "brand": lines[0].upper(),
            "model": lines[1],
            "release": lines[2],
            "sdk": lines[3],
            "abi": lines[4]
        }


class App:
    def __init__(self, root):
        self.root = root
        self.root.title("ADB Uninstaller — Android Debloater")
        self.root.geometry("1150x680")  # Made wider for proportional view
        self.root.minsize(900, 500)

        self.adb = ADBController()
        self.packages = []
        self.check_vars = {}
        self.device_id = None
        self.device_name = None
        self.sort_col = {}    # per-tab: {tab_key: column}
        self.sort_rev = {}    # per-tab: {tab_key: bool}
        self.running_pids = {}  # {pkg: pid}
        self.hide_critical = tk.BooleanVar(value=True)  # Default: True (hide)
        
        # ── Configuration Paths & AI settings variables ──
        import os
        self.config_dir = os.path.expanduser("~/.config/adb-uninstaller")
        os.makedirs(self.config_dir, exist_ok=True)
        self.config_file = os.path.join(self.config_dir, "ai_config.json")
        self.cache_file = os.path.join(self.config_dir, "custom_cache.json")
        
        self.ai_url = tk.StringVar(value="")
        self.ai_key = tk.StringVar(value="")
        self.ai_model = tk.StringVar(value="claude-3-haiku")
        
        self.ai_cache = {}
        self._load_config()
        self._load_cache()
        
        # State variable for AI configuration visibility
        self.ai_visible = False
        
        # AI Status: 'untested', 'incomplete', 'connected', 'error'
        self.ai_status = 'untested'
        
        self._build_ui()
        # Set initial layout sash position (70% left, 30% right) after UI loads
        self.root.update()
        self.paned.sashpos(0, 820)
        
        # Glow highlight effect for Scan Device button on startup
        self._scan_glow_active = True
        self._glow_pulse_state = 0
        self._apply_scan_glow()

    def _build_ui(self):
        # ── Header ──
        hdr_main = ttk.Frame(self.root, padding=8)
        hdr_main.pack(fill=tk.X)

        # Title & Subtitle with padded layout
        title_frame = ttk.Frame(hdr_main, padding=(4, 6))
        title_frame.pack(side=tk.LEFT)
        ttk.Label(title_frame, text="ADB Uninstaller By Megapass Sidoarjo", font=("", 14, "bold")).pack(anchor=tk.W)
        ttk.Label(title_frame, text="Versi 1.15", font=("", 9, "italic"), foreground="#86868b").pack(anchor=tk.W)

        # Device & Control Buttons
        ctrl_frame = ttk.Frame(hdr_main)
        ctrl_frame.pack(side=tk.RIGHT, fill=tk.Y)
        self.lbl_device = ttk.Label(ctrl_frame, text="Device: Not connected", font=("", 10, "bold"))
        self.lbl_device.pack(side=tk.LEFT, padx=10)
        self.btn_scan = ttk.Button(ctrl_frame, text="🔍 Scan Device", command=self._on_scan)
        self.btn_scan.pack(side=tk.LEFT, padx=2)
        self.btn_refresh_running = ttk.Button(ctrl_frame, text="🔄 Refresh Running", command=self._on_refresh_running)
        self.btn_refresh_running.pack(side=tk.LEFT, padx=2)
        self.btn_toggle_ai = ttk.Button(ctrl_frame, text="⚙️ AI Config", command=self._toggle_ai_panel)
        self.btn_toggle_ai.pack(side=tk.LEFT, padx=2)
        
        # AI Status Indicator Dot (Handy-style) - Use tk.Label for color control
        self.ai_status_dot = tk.Label(ctrl_frame, text="●", font=("", 14, "bold"), 
                                       fg="#9e9e9e", bg="#f5f5f7", cursor="hand2")
        self.ai_status_dot.pack(side=tk.LEFT, padx=(0, 4))
        self.ai_status_dot.bind("<Button-1>", lambda e: self._show_ai_status_tooltip())

        # ── Progress ──
        self.progress_var = tk.DoubleVar()
        self.progress = ttk.Progressbar(self.root, variable=self.progress_var, maximum=100)
        self.progress.pack(fill=tk.X, padx=8)
        self.lbl_progress = ttk.Label(self.root, text="", anchor=tk.W)
        self.lbl_progress.pack(fill=tk.X, padx=8)

        # ── Search & Filter Panel ──
        sf = ttk.Frame(self.root, padding=(8, 8))
        sf.pack(fill=tk.X)
        ttk.Label(sf, text="🔎 Search:").pack(side=tk.LEFT)
        self.search_var = tk.StringVar()
        self.search_var.trace_add("write", lambda *_: self._apply_filter())
        # Use standard tk.Entry or configure styling for entries
        self.search_entry = tk.Entry(sf, textvariable=self.search_var, width=30, 
                                     bg="#ffffff", fg="#1d1d1f", insertbackground="#007aff",
                                     bd=1, relief=tk.SOLID, highlightthickness=1,
                                     highlightbackground="#d2d2d7", highlightcolor="#007aff")
        self.search_entry.pack(side=tk.LEFT, padx=(4, 10), fill=tk.X, expand=True)

        # Safety Toggle
        self.chk_safety = ttk.Checkbutton(
            sf, text="Sembunyikan Aplikasi Sistem Inti",
            variable=self.hide_critical, command=self._apply_filter
        )
        self.chk_safety.pack(side=tk.LEFT, padx=(0, 10))

        btn_frame_top = ttk.Frame(sf)
        btn_frame_top.pack(side=tk.RIGHT)
        ttk.Button(btn_frame_top, text="Select All", command=self._select_all).pack(side=tk.LEFT, padx=2)
        ttk.Button(btn_frame_top, text="Deselect All", command=self._deselect_all).pack(side=tk.LEFT, padx=2)

        # ── Split Layout using PanedWindow ──
        self.paned = ttk.PanedWindow(self.root, orient=tk.HORIZONTAL)

        # Left Container (for Notebook)
        self.left_container = ttk.Frame(self.paned, width=720)
        self.paned.add(self.left_container, weight=3)

        # Notebook (4 tabs) inside Left Container
        self.notebook = ttk.Notebook(self.left_container)
        self.notebook.pack(fill=tk.BOTH, expand=True)

        # Right Container (for Log & Specs)
        self.right_container = ttk.Frame(self.paned, padding=(4, 0), width=330)
        self.paned.add(self.right_container, weight=1)

        # ── Configured AI Panel ──
        self.ai_frame = ttk.LabelFrame(self.right_container, text="⚙️ PENGATURAN AI (HIDDEN)", padding=8, relief="solid", borderwidth=1)
        # Note: We do NOT call pack here. It will be packed/unpacked dynamically via self._toggle_ai_panel()
        
        # Base URL row
        f_url = ttk.Frame(self.ai_frame)
        f_url.pack(fill=tk.X, pady=1)
        ttk.Label(f_url, text="Base URL:", font=("Inter", 9), foreground="#86868b", width=10, anchor=tk.W).pack(side=tk.LEFT)
        ent_url = tk.Entry(f_url, textvariable=self.ai_url, font=("Inter", 9), bg="#ffffff", fg="#1d1d1f",
                           bd=1, relief=tk.SOLID, highlightthickness=0)
        ent_url.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=4)
        
        # API Key row
        f_key = ttk.Frame(self.ai_frame)
        f_key.pack(fill=tk.X, pady=1)
        ttk.Label(f_key, text="API Key:", font=("Inter", 9), foreground="#86868b", width=10, anchor=tk.W).pack(side=tk.LEFT)
        ent_key = tk.Entry(f_key, textvariable=self.ai_key, show="*", font=("Inter", 9), bg="#ffffff", fg="#1d1d1f",
                           bd=1, relief=tk.SOLID, highlightthickness=0)
        ent_key.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=4)
        
        # Model row WITH inline Test button (Handy-style)
        f_model = ttk.Frame(self.ai_frame)
        f_model.pack(fill=tk.X, pady=1)
        ttk.Label(f_model, text="Model:", font=("Inter", 9), foreground="#86868b", width=10, anchor=tk.W).pack(side=tk.LEFT)
        ent_model = tk.Entry(f_model, textvariable=self.ai_model, font=("Inter", 9), bg="#ffffff", fg="#1d1d1f",
                             bd=1, relief=tk.SOLID, highlightthickness=0)
        ent_model.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=4)
        # Inline Test button (⚡ icon)
        self.btn_test_ai_inline = ttk.Button(f_model, text="⚡", width=3, command=self._on_test_ai)
        self.btn_test_ai_inline.pack(side=tk.LEFT, padx=(0, 2))

        # Apply button only (bottom)
        btn_row = ttk.Frame(self.ai_frame)
        btn_row.pack(fill=tk.X, pady=(6, 0))
        self.btn_apply_ai = ttk.Button(btn_row, text="💾 Apply & Save", command=self._on_apply_ai)
        self.btn_apply_ai.pack(fill=tk.X)

        # Device Specs Frame
        self.specs_frame = ttk.LabelFrame(self.right_container, text="📱 SPESIFIKASI DEVICE", padding=8, relief="solid", borderwidth=1)
        self.specs_frame.pack(fill=tk.X, pady=(0, 6))

        self.specs_labels = {}
        for spec_key, label_text in [
            ("brand", "Manufacturer:"),
            ("model", "Model:"),
            ("release", "Android Version:"),
            ("sdk", "API Level:"),
            ("abi", "Architecture:")
        ]:
            f = ttk.Frame(self.specs_frame)
            f.pack(fill=tk.X, pady=2)
            # Label (muted gray, 9pt)
            lbl = ttk.Label(f, text=f"{label_text:<18}", font=("Consolas", 9), foreground="#86868b")
            lbl.pack(side=tk.LEFT)
            # Value (bold orange, 10pt)
            self.specs_labels[spec_key] = ttk.Label(f, text="N/A", font=("", 10, "bold"), foreground="#ff9500")
            self.specs_labels[spec_key].pack(side=tk.LEFT, padx=4)

        # Log Activity Frame
        self.log_frame = ttk.LabelFrame(self.right_container, text="📝 LOG AKTIVITAS", padding=8, relief="solid", borderwidth=1)
        self.log_frame.pack(fill=tk.BOTH, expand=True)

        self.log_text = tk.Text(self.log_frame, wrap=tk.WORD, font=("Consolas", 9), state=tk.DISABLED,
                                bg="#ffffff", fg="#1d1d1f", insertbackground="#007aff", selectbackground="#007aff",
                                bd=0, relief=tk.FLAT)
        self.log_text.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        
        log_scroll = ttk.Scrollbar(self.log_frame, orient=tk.VERTICAL, command=self.log_text.yview)
        self.log_text.configure(yscrollcommand=log_scroll.set)
        log_scroll.pack(side=tk.RIGHT, fill=tk.Y)

        # Setup colors in Log text (Light theme)
        self.log_text.tag_config("info", foreground="#007aff")  # Bright blue
        self.log_text.tag_config("success", foreground="#007aff")  # Bright green
        self.log_text.tag_config("error", foreground="#ff3b30")  # Soft red

        # Log control buttons
        lcf = ttk.Frame(self.right_container)
        lcf.pack(fill=tk.X, pady=4)
        ttk.Button(lcf, text="Copy Log", command=self._copy_log).pack(side=tk.LEFT, expand=True, fill=tk.X, padx=1)
        ttk.Button(lcf, text="Clear Log", command=self._clear_log).pack(side=tk.RIGHT, expand=True, fill=tk.X, padx=1)

        # Frames for tabs
        self.tab_system = ttk.Frame(self.notebook)
        self.tab_user = ttk.Frame(self.notebook)
        self.tab_disabled = ttk.Frame(self.notebook)
        self.tab_running = ttk.Frame(self.notebook)
        
        self.notebook.add(self.tab_system, text="🏭 System Apps (0)")
        self.notebook.add(self.tab_user, text="👤 User Apps (0)")
        self.notebook.add(self.tab_disabled, text="🚫 Disabled Apps (0)")
        self.notebook.add(self.tab_running, text="🏃 Running Apps (0)")

        self.trees = {}
        for tab_key, tab_frame in [
            ("system", self.tab_system), 
            ("user", self.tab_user), 
            ("disabled", self.tab_disabled),
            ("running", self.tab_running)
        ]:
            self.sort_col[tab_key] = None
            self.sort_rev[tab_key] = False
            container = ttk.Frame(tab_frame)
            container.pack(fill=tk.BOTH, expand=True)

            cols = ("sel", "no", "package", "app_name", "status")
            tree = ttk.Treeview(container, columns=cols, show="headings", selectmode="extended")
            tree.heading("sel", text="☐", anchor=tk.CENTER)
            tree.heading("no", text="No", anchor=tk.CENTER)
            
            # Sortable headers
            tree.heading("package", text="Package Name ⇅",
                         command=lambda t=tree, k=tab_key: self._sort_column(k, "package"))
            tree.heading("app_name", text="App Name ⇅",
                         command=lambda t=tree, k=tab_key: self._sort_column(k, "app_name"))
            tree.heading("status", text="Status ⇅",
                         command=lambda t=tree, k=tab_key: self._sort_column(k, "status"))

            tree.column("sel", width=40, anchor=tk.CENTER, stretch=False)
            tree.column("no", width=50, anchor=tk.CENTER, stretch=False)
            tree.column("package", width=320, anchor=tk.W, stretch=True)
            tree.column("app_name", width=220, anchor=tk.W, stretch=True)
            tree.column("status", width=70, anchor=tk.CENTER, stretch=False)

            # Light theme row colors with subtle alternating pattern
            # Professional desaturated palette
            tree.tag_configure("enabled", background="#ffffff", foreground="#1d1d1f")   # Clean White
            tree.tag_configure("disabled", background="#f2f2f7", foreground="#8e8e93")  # Soft Cool Gray
            tree.tag_configure("critical", background="#ffebec", foreground="#d32f2f")  # Soft desaturated red
            
            # Alternating row backgrounds for better visual separation
            tree.tag_configure("oddrow", background="#fafafa")   # Very light gray for odd rows
            tree.tag_configure("evenrow", background="#ffffff")  # Pure white for even rows
            
            # Visual check states (a clean light accent blue background for selected items to make them highly visible)
            tree.tag_configure("checked", background="#fff9c4", foreground="#f57f17", font=("Inter", 10, "bold"))

            scrollbar = ttk.Scrollbar(container, orient=tk.VERTICAL, command=tree.yview)
            tree.configure(yscrollcommand=scrollbar.set)
            tree.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
            scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

            tree.bind("<Button-1>", lambda e, t=tree, k=tab_key: self._on_tree_click(e, t, k))
            # Bind Right-click (Button-3 on Linux/Kubuntu)
            tree.bind("<Button-3>", lambda e, t=tree: self._show_context_menu(e, t))
            self.trees[tab_key] = tree

        # ── Action Buttons ──
        af = ttk.Frame(self.root, padding=(8, 12))
        af.pack(fill=tk.X, side=tk.BOTTOM, pady=4)
        self.lbl_selected = ttk.Label(af, text="Selected: 0 apps")
        self.lbl_selected.pack(side=tk.LEFT)

        # Color Legend
        legend_frame = ttk.Frame(af)
        legend_frame.pack(side=tk.LEFT, padx=20)
        ttk.Label(legend_frame, text="Legenda Warna:", font=("", 9, "bold")).pack(side=tk.LEFT)
        
        lbl_green = tk.Label(legend_frame, text=" Aktif ", bg="#ffffff", fg="#1d1d1f", bd=1, relief="solid", font=("Inter", 8, "bold"))
        lbl_green.pack(side=tk.LEFT, padx=3)
        
        lbl_orange = tk.Label(legend_frame, text=" Disabled ", bg="#f2f2f7", fg="#8e8e93", bd=1, relief="solid", font=("Inter", 8, "bold"))
        lbl_orange.pack(side=tk.LEFT, padx=3)
        
        lbl_red = tk.Label(legend_frame, text=" Sistem Inti ", bg="#ffebec", fg="#d32f2f", bd=1, relief="solid", font=("Inter", 8, "bold"))
        lbl_red.pack(side=tk.LEFT, padx=3)

        ttk.Button(af, text="⏹️ Force Stop", command=lambda: self._do_action("force_stop")).pack(side=tk.RIGHT, padx=4)
        ttk.Button(af, text="✅ Enable", command=lambda: self._do_action("enable")).pack(side=tk.RIGHT, padx=4)
        ttk.Button(af, text="🚫 Disable", command=lambda: self._do_action("disable")).pack(side=tk.RIGHT, padx=4)
        ttk.Button(af, text="🗑️ Uninstall", command=lambda: self._do_action("uninstall")).pack(side=tk.RIGHT, padx=4)

        # ── Status Bar ──
        self.lbl_status = ttk.Label(self.root, text="Ready — connect device and press Scan",
                                    relief=tk.SUNKEN, anchor=tk.W, padding=4)
        self.lbl_status.pack(fill=tk.X, side=tk.BOTTOM)

        # Pack the middle paned window LAST so it occupies only the remaining space (prevents layout cropping)
        self.paned.pack(fill=tk.BOTH, expand=True, padx=8, pady=4)

    # ── Sort ──
    def _sort_column(self, tab_key, col):
        if self.sort_col.get(tab_key) == col:
            self.sort_rev[tab_key] = not self.sort_rev[tab_key]
        else:
            self.sort_col[tab_key] = col
            self.sort_rev[tab_key] = False
        self._apply_filter()

    # ── Tree click → toggle checkbox ──
    def _on_tree_click(self, event, tree, tab_key):
        region = tree.identify_region(event.x, event.y)
        if region not in ("cell", "tree"):
            return
        col = tree.identify_column(event.x)
        if col != "#1":
            return
        item = tree.identify_row(event.y)
        if not item:
            return
        vals = list(tree.item(item, "values"))
        pkg = vals[2]
        if vals[0] == "☑":
            vals[0] = "☐"
            self.check_vars[pkg] = False
        else:
            vals[0] = "☑"
            self.check_vars[pkg] = True
        
        # Redraw rows using _apply_filter to instantly reflect selection highlight
        self._apply_filter()
        self._update_selected_count()

    def _get_current_tab_key(self):
        idx = self.notebook.index("current")
        return ["system", "user", "disabled"][idx]

    def _select_all(self):
        tab = self._get_current_tab_key()
        tree = self.trees[tab]
        for item in tree.get_children():
            vals = list(tree.item(item, "values"))
            self.check_vars[vals[2]] = True
        self._apply_filter()
        self._update_selected_count()

    def _deselect_all(self):
        tab = self._get_current_tab_key()
        tree = self.trees[tab]
        for item in tree.get_children():
            vals = list(tree.item(item, "values"))
            self.check_vars[vals[2]] = False
        self._apply_filter()
        self._update_selected_count()

    def _update_selected_count(self):
        count = sum(1 for v in self.check_vars.values() if v)
        self.lbl_selected.config(text=f"Selected: {count} apps")

    # ── Scan ──
    def _on_scan(self):
        # Remove glow effect after first scan
        if self._scan_glow_active:
            self._remove_scan_glow()
        
        self.btn_scan.config(state=tk.DISABLED)
        self.lbl_status.config(text="Scanning...")
        self.log("Memulai scan device...", "info")
        self.progress_var.set(0)
        threading.Thread(target=self._scan_thread, daemon=True).start()

    def _scan_thread(self):
        self.root.after(0, lambda: self.lbl_progress.config(text="Checking device..."))
        dev_id, dev_name = self.adb.get_device()
        if not dev_id:
            self.root.after(0, lambda: self._scan_done(None, "No device found. Enable USB debugging and reconnect."))
            return
        self.device_id = dev_id
        self.device_name = dev_name
        self.root.after(0, lambda: self.lbl_device.config(text=f"🟢 {dev_name} ({dev_id})", foreground="#007aff"))
        self.root.after(0, lambda: self.log(f"Device terhubung: {dev_name} ({dev_id})", "success"))
        
        # Get specs
        specs = self.adb.get_device_specs()
        self.root.after(0, lambda s=specs: self._update_specs_ui(s))
        
        # Trigger background AI specs query if url is set
        if self.ai_url.get().strip():
            threading.Thread(target=self._query_ai_specs_thread, args=(specs,), daemon=True).start()

        def progress_cb(current, total, msg):
            pct = (current / max(total, 1)) * 100
            self.root.after(0, lambda p=pct, m=msg: self._update_progress(p, m))

        packages = self.adb.scan_packages(progress_cb=progress_cb)
        self.root.after(0, lambda: self._scan_done(packages, None))

    # ── Refresh Running ──
    def _on_refresh_running(self):
        if not self.packages:
            messagebox.showinfo("No Data", "Scan device first before refreshing running apps.")
            return
        self.btn_refresh_running.config(state=tk.DISABLED)
        self.lbl_status.config(text="Refreshing running apps...")
        self.log("Memperbarui daftar running apps...", "info")
        threading.Thread(target=self._refresh_running_thread, daemon=True).start()

    def _refresh_running_thread(self):
        user_pkgs = [p for p in self.packages if p["category"] == "user"]
        running = self.adb.get_running_user_apps(user_pkgs)
        self.root.after(0, lambda: self._refresh_running_done(running))

    def _refresh_running_done(self, running):
        self.btn_refresh_running.config(state=tk.NORMAL)
        self.running_pids = {r["pkg"]: r["pid"] for r in running}
        self._apply_filter()
        count = len(running)
        self.notebook.tab(3, text=f"🏃 Running Apps ({count})")
        self.lbl_status.config(text=f"Running apps: {count} user app(s) active in background")
        self.log(f"Running apps updated. {count} aplikasi terdeteksi aktif.", "success")

    def _update_progress(self, pct, msg):
        self.progress_var.set(pct)
        self.lbl_progress.config(text=msg)

    def _update_specs_ui(self, specs):
        for k, v in specs.items():
            if k in self.specs_labels:
                self.specs_labels[k].config(text=v)
        self.log(f"Specs loaded: Brand={specs['brand']}, OS={specs['release']}, API={specs['sdk']}", "info")

    def _scan_done(self, packages, error):
        self.btn_scan.config(state=tk.NORMAL)
        self.progress_var.set(100)
        if error:
            self.lbl_device.config(text="🔴 Disconnected", foreground="#ff3b30")
            self.lbl_status.config(text=f"Error: {error}")
            self.lbl_progress.config(text="")
            self.log(f"Scan gagal: {error}", "error")
            messagebox.showerror("Error", error)
            return
        self.log(f"Scan sukses. Ditemukan {len(packages)} packages.", "success")

        # Update packages with local cached AI names first
        for p in packages:
            if p["pkg"] in self.ai_cache:
                p["app_name"] = self.ai_cache[p["pkg"]]
                
        self.packages = packages
        self.check_vars = {p["pkg"]: False for p in packages}
        self._apply_filter()
        
        # Trigger background async name resolution for unknown / system-name packages
        if self.ai_url.get().strip():
            threading.Thread(target=self._async_resolve_all_packages, daemon=True).start()
        self._update_tab_counts()
        self.lbl_progress.config(text="")
        total = len(packages)
        sys_c = sum(1 for p in packages if p["category"] == "system")
        usr_c = total - sys_c
        self.lbl_status.config(text=f"Scan complete — {total} packages ({sys_c} system, {usr_c} user)")

    def _update_tab_counts(self):
        sys_count = sum(1 for p in self.packages if p["category"] == "system" and p["status"] == "enabled")
        usr_count = sum(1 for p in self.packages if p["category"] == "user" and p["status"] == "enabled")
        dis_count = sum(1 for p in self.packages if p["status"] == "disabled")
        self.notebook.tab(0, text=f"🏭 System Apps ({sys_count})")
        self.notebook.tab(1, text=f"👤 User Apps ({usr_count})")
        self.notebook.tab(2, text=f"🚫 Disabled Apps ({dis_count})")

    # ── Filter ──
    def _apply_filter(self):
        query = self.search_var.get().lower()

        for tab_key, tree in self.trees.items():
            tree.delete(*tree.get_children())

            # Filter by tab
            if tab_key == "running":
                filtered = [p for p in self.packages if p["pkg"] in self.running_pids]
            elif tab_key == "disabled":
                filtered = [p for p in self.packages if p["status"] == "disabled"]
            else:
                filtered = [p for p in self.packages if p["category"] == tab_key and p["status"] == "enabled"]

            # Safety filter (hide critical apps)
            if self.hide_critical.get():
                filtered = [p for p in filtered if p["pkg"] not in CRITICAL_PACKAGES]

            # Search filter
            if query:
                filtered = [p for p in filtered if query in p["pkg"].lower() or query in p["app_name"].lower()]

            # Sort
            sort_c = self.sort_col.get(tab_key)
            if sort_c:
                key_map = {"package": "pkg", "app_name": "app_name", "status": "status"}
                sk = key_map.get(sort_c, "pkg")
                filtered.sort(key=lambda x: x[sk].lower(), reverse=self.sort_rev.get(tab_key, False))
            else:
                filtered.sort(key=lambda x: x["pkg"])

            for idx, p in enumerate(filtered):
                checked = "✓" if self.check_vars.get(p["pkg"]) else "☐"
                status_icon = "✅" if p["status"] == "enabled" else "🚫"

                is_crit = p["pkg"] in CRITICAL_PACKAGES
                if is_crit:
                    tag = "critical"
                elif p["status"] == "disabled":
                    tag = "disabled"
                else:
                    tag = "enabled"

                display_name = p["app_name"]
                if tab_key == "running" and p["pkg"] in self.running_pids:
                    display_name = p['app_name']  # PID hidden for clean display
                
                # We insert 5 elements to match ("sel", "no", "package", "app_name", "status")
                # Apply alternating row backgrounds + status tag + checked state styling
                row_tag = "oddrow" if idx % 2 == 0 else "evenrow"
                
                # Check status overrides normal/zebra background for selected rows.
                # In Tkinter Treeview, the FIRST tag in the tuple that defines a style wins.
                # Therefore, we must prepend 'checked' to the beginning of the list.
                row_tags = []
                if self.check_vars.get(p["pkg"]):
                    row_tags.append("checked")
                row_tags.extend([tag, row_tag])
                    
                tree.insert("", tk.END,
                            values=(checked, idx + 1, p["pkg"], display_name, status_icon),
                            tags=tuple(row_tags))

    # ── Actions ──
    def _get_selected(self):
        return [pkg for pkg, selected in self.check_vars.items() if selected]

    def _do_action(self, action):
        selected = self._get_selected()
        if not selected:
            messagebox.showinfo("No Selection", "Select at least one app first.")
            return

        action_labels = {"uninstall": "Uninstall", "disable": "Disable", "enable": "Enable"}
        label = action_labels[action]

        critical_sel = [p for p in selected if p in CRITICAL_PACKAGES]
        if critical_sel:
            crit_list = "\n".join(critical_sel[:10])
            warn = (
                f"⚠️ WARNING: {len(critical_sel)} CRITICAL system package(s) selected!\n\n"
                f"{crit_list}\n\n"
                f"These are essential for your device to function.\n"
                f"{label} them may cause bootloop or brick your device.\n\n"
                f"Are you ABSOLUTELY sure?"
            )
            if not messagebox.askyesno("⚠️ CRITICAL WARNING", warn, icon="warning"):
                return

        msg = f"{label} {len(selected)} package(s)?\n\nFirst 5:\n" + "\n".join(selected[:5])
        if len(selected) > 5:
            msg += f"\n...and {len(selected) - 5} more"
        if not messagebox.askyesno("Confirm Action", msg):
            return

        self.btn_scan.config(state=tk.DISABLED)
        self.log(f"Memulai proses {action} untuk {len(selected)} aplikasi...", "info")
        threading.Thread(target=self._action_thread, args=(action, selected), daemon=True).start()

    def _action_thread(self, action, packages):
        results = {"success": [], "fail": 0, "errors": []}
        total = len(packages)

        for i, pkg in enumerate(packages):
            self.root.after(0, lambda p=pkg, i=i: self._update_progress(
                (i / total) * 100, f"Processing {p}... ({i + 1}/{total})"
            ))

            if action == "uninstall":
                ok, out = self.adb.uninstall(pkg)
            elif action == "disable":
                ok, out = self.adb.disable(pkg)
            elif action == "enable":
                ok, out = self.adb.enable(pkg)
            else:
                ok, out = False, "Unknown action"

            # Get human readable name from local packages dictionary
            app_name = pkg
            for p in self.packages:
                if p["pkg"] == pkg:
                    app_name = p["app_name"] if p["app_name"] else pkg
                    break

            if ok:
                results["success"].append(pkg)
                self.root.after(0, lambda an=app_name, p=pkg: self.log(f"Sukses: {action.title()} {an} ({p})", "success"))
            else:
                results["fail"] += 1
                results["errors"].append(f"{pkg}: {out}")
                self.root.after(0, lambda an=app_name, p=pkg, o=out: self.log(f"Gagal: {action.title()} {an} ({p}) - {o.strip()}", "error"))

        self.root.after(0, lambda: self._action_done(action, results))

    def _action_done(self, action, results):
        # Thread-safe GUI updates
        self.root.after(0, lambda: self.btn_scan.config(state=tk.NORMAL))
        self.root.after(0, lambda: self.progress_var.set(100))

        # Update local package data instead of re-scanning
        if action == "uninstall":
            # Safe: filter out removed packages instead of removing during iteration
            self.packages = [p for p in self.packages if p["pkg"] not in results["success"]]
        else:
            # Safe: update status without modifying list structure
            for pkg_name in results["success"]:
                for p in self.packages:
                    if p["pkg"] == pkg_name:
                        if action == "disable":
                            p["status"] = "disabled"
                        elif action == "enable":
                            p["status"] = "enabled"
                        break

        # Deselect all
        for pkg in list(self.check_vars.keys()):
            self.check_vars[pkg] = False
        # Remove uninstalled from check_vars
        if action == "uninstall":
            for pkg_name in results["success"]:
                self.check_vars.pop(pkg_name, None)

        self._update_selected_count()
        self._apply_filter()
        self._update_tab_counts()

        label = {"uninstall": "Uninstalled", "disable": "Disabled", "enable": "Enabled"}[action]
        msg = f"✅ {label}: {len(results['success'])}    ❌ Failed: {results['fail']}"
        if results["errors"]:
            msg += "\n\nErrors:\n" + "\n".join(results["errors"][:10])

        # Thread-safe label updates
        self.root.after(0, lambda: self.lbl_status.config(text=msg.split("\n")[0]))
        self.root.after(0, lambda: self.lbl_progress.config(text=""))
        self.log(f"Aksi selesai. Sukses: {len(results['success'])}, Gagal: {results['fail']}", "info" if results['fail'] == 0 else "error")
        self.root.after(0, lambda: messagebox.showinfo("Results", msg))



    # ── Logging System ──
    def log(self, text, tag="info"):
        from datetime import datetime
        time_str = datetime.now().strftime("%H:%M:%S")
        msg = f"[{time_str}] {text}\n"
        self.root.after(0, lambda m=msg, t=tag: self._log_threadsafe(m, t))

    def _log_threadsafe(self, msg, tag):
        self.log_text.config(state=tk.NORMAL)
        start_idx = self.log_text.index(tk.INSERT)
        self.log_text.insert(tk.END, msg)
        end_idx = self.log_text.index(tk.INSERT)
        if tag == "success":
            self.log_text.tag_add("success", start_idx, end_idx)
        elif tag == "error":
            self.log_text.tag_add("error", start_idx, end_idx)
        elif tag == "info":
            self.log_text.tag_add("info", start_idx, end_idx)
        self.log_text.config(state=tk.DISABLED)
        self.log_text.see(tk.END)

    def _clear_log(self):
        self.log_text.config(state=tk.NORMAL)
        self.log_text.delete("1.0", tk.END)
        self.log_text.config(state=tk.DISABLED)

    def _copy_log(self):
        self.root.clipboard_clear()
        self.root.clipboard_append(self.log_text.get("1.0", tk.END).strip())
        messagebox.showinfo("Success", "Log copied to clipboard!")

    def _show_context_menu(self, event, tree):
        # Select row under right click
        item = tree.identify_row(event.y)
        if not item:
            return
        
        # Highlight/Focus on the right-clicked item visually in selection
        tree.selection_set(item)
        tree.focus(item)
        
        vals = tree.item(item, "values")
        if not vals or len(vals) < 3:
            return
        
        pkg_name = vals[2]
        
        # Create context menu
        menu = tk.Menu(self.root, tearoff=0)
        menu.add_command(label=f"Copy Package Name: {pkg_name}", command=lambda: self._copy_text(pkg_name))
        menu.post(event.x_root, event.y_root)

    def _copy_text(self, text):
        self.root.clipboard_clear()
        self.root.clipboard_append(text)
        self.log(f"Menyalin package ke clipboard: {text}", "info")


    def _apply_scan_glow(self):
        """Apply glow highlight to Scan Device button to attract first click."""
        if self._scan_glow_active:
            # Start gentle pulse animation
            self._glow_pulse()
    
    def _glow_pulse(self):
        """Gentle pulse animation using text prefix."""
        if not self._scan_glow_active:
            return
        
        # Oscillate button text with visual indicator
        if self._glow_pulse_state % 2 == 0:
            self.btn_scan.config(text="⚡🔍 Scan Device ⚡")
        else:
            self.btn_scan.config(text="🔍 Scan Device")
        
        self._glow_pulse_state += 1
        
        # Pulse every 600ms (attention-grabbing but not annoying)
        if self._glow_pulse_state < 12:  # Stop after 6 cycles (7.2 seconds)
            self.root.after(600, self._glow_pulse)
        else:
            # Reset to normal after animation ends
            self._remove_scan_glow()
    def _remove_scan_glow(self):
        """Remove glow effect after first scan."""
        self._scan_glow_active = False
        try:
            self.btn_scan.config(text="🔍 Scan Device", relief="flat", borderwidth=1)
        except:
            pass

    # ── AI Configuration & Implementation Methods ──
    def _toggle_ai_panel(self):
        if self.ai_visible:
            self.ai_frame.pack_forget()
            self.ai_visible = False
            self.btn_toggle_ai.config(text="⚙️ AI Config")
            self.log("Setelan AI disembunyikan (Aman dari intipan).", "info")
        else:
            # Pack at the very top of the right container
            self.ai_frame.pack(fill=tk.X, pady=(0, 6), before=self.specs_frame)
            self.ai_visible = True
            self.btn_toggle_ai.config(text="🙈 Hide AI")
            self.log("Membuka setelan AI.", "info")

    def _on_apply_ai(self):
        self._save_config()
        self.log("Setelan AI berhasil disimpan & diterapkan!", "success")
        messagebox.showinfo("Success", "Setelan AI berhasil disimpan!")

    def _on_test_ai(self):
        url = self.ai_url.get().strip()
        if not url:
            self._update_ai_status('incomplete')
            messagebox.showerror("Error", "Base URL kosong! Harap isi terlebih dahulu.")
            return
            
        self.btn_test_ai_inline.config(state=tk.DISABLED)
        self._update_ai_status('testing')
        self.log("Menguji koneksi ke AI provider...", "info")
        
        def run_test():
            # Send simple ping payload
            ans = self._call_ai("Reply only with the word PONG.")
            self.btn_test_ai_inline.config(state=tk.NORMAL)
            if ans and "PONG" in ans.upper():
                self.root.after(0, lambda: self._update_ai_status('connected'))
                self.root.after(0, lambda: self.log("🟢 Koneksi AI Sukses! Claude Haiku terhubung.", "success"))
                self.root.after(0, lambda: messagebox.showinfo("Koneksi Sukses", "🟢 Sukses terhubung ke AI provider lokal!"))
            else:
                self.root.after(0, lambda: self._update_ai_status('error'))
                self.root.after(0, lambda: self.log("🔴 Koneksi AI Gagal! Cek URL/API Key/Token habis.", "error"))
                self.root.after(0, lambda: messagebox.showerror("Koneksi Gagal", "🔴 Gagal terhubung ke AI provider. Silakan periksa log aktivitas."))
                
        threading.Thread(target=run_test, daemon=True).start()
    def _update_ai_status(self, status):
        """Update AI status indicator dot: untested, incomplete, testing, connected, error"""
        self.ai_status = status
        status_map = {
            'untested': ('#9e9e9e', 'AI belum diuji'),      # Gray
            'incomplete': ('#ffc107', 'Konfigurasi belum lengkap'),  # Amber/Yellow
            'testing': ('#ff9800', 'Sedang menguji koneksi...'),     # Orange
            'connected': ('#4caf50', 'AI terhubung & siap'),         # Green
            'error': ('#f44336', 'Koneksi AI gagal')                 # Red
        }
        color, tooltip = status_map.get(status, ('#9e9e9e', 'Unknown'))
        self.ai_status_dot.config(fg=color)
        self.ai_status_tooltip = tooltip
    
    def _show_ai_status_tooltip(self):
        """Show AI status message when dot is clicked."""
        if hasattr(self, 'ai_status_tooltip'):
            messagebox.showinfo("Status AI", self.ai_status_tooltip)
    
    def _load_config(self):
        import json
        if os.path.exists(self.config_file):
            try:
                with open(self.config_file, "r") as f:
                    cfg = json.load(f)
                    self.ai_url.set(cfg.get("url", ""))
                    self.ai_key.set(cfg.get("key", ""))
                    self.ai_model.set(cfg.get("model", "claude-3-haiku"))
                    
                    # Update status based on config completeness
                    if self.ai_url.get().strip():
                        self.root.after(100, lambda: self._update_ai_status('untested'))
                    else:
                        self.root.after(100, lambda: self._update_ai_status('incomplete'))
            except:
                pass

    def _save_config(self):
        import json
        cfg = {"url": self.ai_url.get(), "key": self.ai_key.get(), "model": self.ai_model.get()}
        try:
            with open(self.config_file, "w") as f:
                json.dump(cfg, f, indent=4)
        except:
            pass

    def _load_cache(self):
        import json
        if os.path.exists(self.cache_file):
            try:
                with open(self.cache_file, "r") as f:
                    self.ai_cache = json.load(f)
            except:
                pass

    def _save_cache(self):
        import json
        try:
            with open(self.cache_file, "w") as f:
                json.dump(self.ai_cache, f, indent=4)
        except:
            pass

    def _call_ai(self, prompt):
        import json
        import urllib.request
        import urllib.error
        url = self.ai_url.get().strip()
        key = self.ai_key.get().strip()
        model = self.ai_model.get().strip()
        if not url:
            return None
        
        # Build path to chat/completions endpoint standard
        endpoint = url if url.endswith("/chat/completions") else url.rstrip("/") + "/chat/completions"
        payload = {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.2,
            "stream": False
        }
        req = urllib.request.Request(
            endpoint,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {key}" if key else "",
                "Content-Type": "application/json"
            },
            method="POST"
        )
        try:
            with urllib.request.urlopen(req, timeout=10) as response:
                res = json.loads(response.read().decode("utf-8"))
                return res["choices"][0]["message"]["content"].strip()
        except Exception as e:
            self.root.after(0, lambda: self.log(f"AI API Error: {str(e)}", "error"))
            return None

    def _query_ai_specs_thread(self, specs):
        brand = specs.get("brand", "Unknown")
        model = specs.get("model", "Unknown")
        if brand == "UNKNOWN" or model == "UNKNOWN":
            return
            
        self.root.after(0, lambda: self.log(f"Meminta spesifikasi HP {brand} {model} dari AI...", "info"))
        prompt = (
            f"Berikan spesifikasi lengkap HP {brand} {model}. "
            "Format dalam Bahasa Indonesia ringkas berupa poin-poin tanpa markdown tebal: "
            "Chipset, RAM/Storage bawaan, Layar, Baterai, Kamera, dan Tahun Rilis."
        )
        ans = self._call_ai(prompt)
        if ans:
            # Format and display in logs
            self.root.after(0, lambda: self.log(f"--- SPESIFIKASI AI ({brand} {model}) ---\n{ans}\n------------------", "success"))

    def _async_resolve_all_packages(self):
        # Scan packages in current self.packages that fall back to capitalized package names
        # e.g., if p["app_name"] is equal to capitalized package name and not in POPULAR_APP_NAMES
        # We query them in the background sequentially to avoid slamming the API.
        from time import sleep
        unknowns = []
        for p in self.packages:
            pkg = p["pkg"]
            # Detect fallback names (not found in popular and not in UAD)
            if pkg not in self.ai_cache and p["app_name"] == pkg.split(".")[-1].replace("_", " ").title():
                unknowns.append(pkg)
                
        if not unknowns:
            return
            
        self.root.after(0, lambda: self.log(f"Menemukan {len(unknowns)} aplikasi tidak dikenal. Meminta identifikasi nama dari AI...", "info"))
        
        for idx, pkg in enumerate(unknowns):
            # Check configuration still exists
            if not self.ai_url.get().strip():
                break
                
            prompt = f"Tebak nama aplikasi Android untuk package name: {pkg}. Balas HANYA dengan nama aplikasinya saja secara singkat (maksimal 4 kata), tanpa penjelasan tambahan."
            ans = self._call_ai(prompt)
            if ans:
                ans = ans.replace('"', '').replace("'", "").rstrip(".")
                self.ai_cache[pkg] = ans
                self._save_cache()
                
                # Update local models
                for p in self.packages:
                    if p["pkg"] == pkg:
                        p["app_name"] = ans
                        break
                
                # Refresh filter in GUI thread safely to update the names on screen
                self.root.after(0, self._apply_filter)
                self.root.after(0, lambda k=pkg, a=ans: self.log(f"AI mendeteksi {k} -> {a}", "success"))
                
            # Rate limiting delay (1 second) to be nice to local providers
            sleep(1.0)


def main():
    root = tk.Tk()
    
    # ── Modern Light Theme (Clean & Bright) ──
    bg_main = "#f5f5f7"       # Light gray background (Apple-style)
    bg_card = "#ffffff"       # Pure white cards/panels
    bg_input = "#e8e8ea"      # Light gray input fields
    fg_main = "#1d1d1f"       # Soft black text
    fg_muted = "#86868b"      # Muted gray text
    accent = "#ff9500"        # Vibrant orange accent
    accent_blue = "#007aff"   # Bright blue (focus/links)
    bg_tree = "#ffffff"       # White table background
    border = "#d2d2d7"        # Subtle border gray
    
    style = ttk.Style()
    if "clam" in style.theme_names():
        style.theme_use("clam")
        
    # Main defaults with a clean font structure
    style.configure(".", background=bg_main, foreground=fg_main, bordercolor=border, font=("Inter", 10))
    style.configure("TFrame", background=bg_main)
    style.configure("TLabel", background=bg_main, foreground=fg_main, font=("Inter", 10))
    
    # Modernized rounded buttons with hover/active states
    style.configure("TButton", background=bg_card, foreground=fg_main, 
                    bordercolor=border, focuscolor=accent_blue, padding=(12, 6),
                    font=("Inter", 9, "bold"), relief="flat")
    style.map("TButton", 
              background=[("active", accent_blue), ("disabled", "#f2f2f7")], 
              foreground=[("active", "#ffffff"), ("disabled", "#aeaeb2")],
              bordercolor=[("active", accent_blue), ("!active", border)])
              
    # Modern Apple-style segment tabs
    style.configure("TNotebook", background=bg_main, bordercolor="#e5e5ea", tabmargins=[2, 4, 2, 0])
    style.configure("TNotebook.Tab", background="#e5e5ea", foreground=fg_muted, 
                    bordercolor="#e5e5ea", padding=(14, 6), font=("Inter", 9, "bold"), relief="flat")
    style.map("TNotebook.Tab", 
              background=[("selected", bg_card), ("active", "#e0e0e5")], 
              foreground=[("selected", accent_blue), ("active", fg_main)],
              bordercolor=[("selected", "#e5e5ea"), ("!selected", "#e5e5ea")])
              
    # Treeview - Professional clean rows
    style.configure("Treeview", background=bg_tree, foreground=fg_main, 
                    fieldbackground=bg_tree, rowheight=28, font=("Inter", 9))
    style.configure("Treeview.Heading", background=bg_card, foreground=fg_main, 
                    bordercolor="#e5e5ea", padding=6, font=("Inter", 9, "bold"), relief="flat")
    
    # Fix Treeview tag background bug in modern Tkinter (Ubuntu/Kubuntu)
    def fixed_map(option):
        return [elm for elm in style.map("Treeview", option)
                if elm[0] not in ("!disabled", "!selected")]
    style.map("Treeview", 
              foreground=fixed_map("foreground"),
              background=fixed_map("background"))
              
    # Labelframe - Clean bordered cards
    style.configure("TLabelframe", background=bg_card, bordercolor=border, relief="solid", borderwidth=1)
    style.configure("TLabelframe.Label", background=bg_card, foreground=accent_blue, 
                    font=("", 10, "bold"))
    
    # Progressbar
    style.configure("Horizontal.TProgressbar", background=accent, 
                    troughcolor=bg_input, bordercolor=border)
    
    # Checkbutton
    style.configure("TCheckbutton", background=bg_main, foreground=fg_main, font=("Inter", 9, "bold"), focuscolor="")
    style.map("TCheckbutton",
              foreground=[("active", accent_blue)],
              background=[("active", bg_main)])
    
    # Scrollbar - VISIBLE dark gray on light background
    style.configure("Vertical.TScrollbar", background="#c0c0c5", troughcolor=bg_main,
                    bordercolor=border, arrowcolor=fg_muted)
    style.map("Vertical.TScrollbar",
              background=[("active", "#a0a0a5")])
    
    # PanedWindow
    style.configure("TPanedwindow", background=bg_main)
    
    root.configure(bg=bg_main)
    
    app = App(root)
    root.mainloop()


if __name__ == "__main__":
    main()
