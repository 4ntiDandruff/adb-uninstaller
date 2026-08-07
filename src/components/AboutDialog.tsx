import { X, Globe, Github, Info, ShieldCheck, Heart } from "lucide-react";
import { openUrl } from "@tauri-apps/plugin-opener";

interface Props {
  open: boolean;
  onClose: () => void;
  lang?: string;
}

export function AboutDialog({ open, onClose, lang = "id" }: Props) {
  if (!open) return null;

  const handleOpenLink = async (url: string) => {
    try {
      await openUrl(url);
    } catch {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Info size={18} className="text-primary" />
            {lang === "en" ? "About ADB Uninstaller" : "Tentang ADB Uninstaller"}
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body text-center space-y-4" style={{ padding: "20px 24px" }}>
          {/* Logo & Header */}
          <div className="flex flex-col items-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl mb-2"
              style={{
                background: "linear-gradient(135deg, var(--primary) 0%, #3b82f6 100%)",
                color: "#ffffff",
                boxShadow: "0 8px 16px -4px rgba(59, 130, 246, 0.4)"
              }}
            >
              A
            </div>
            <h3 className="text-lg font-bold" style={{ margin: 0 }}>ADB Uninstaller</h3>
            <span className="text-xs text-faint font-mono mt-0.5">v2.2.4 · Tauri v2 + React</span>
          </div>

          <p className="text-xs text-dim leading-relaxed" style={{ margin: "12px 0 16px" }}>
            {lang === "en"
              ? "A lightweight, powerful Android debloater and package manager tailored for repair technicians and power users."
              : "Aplikasi desktop ringan & kencang untuk debloat & manajemen HP Android via ADB, dibuat khusus untuk meja servis & kebutuhan teknisi."}
          </p>

          {/* Profil Pembuat */}
          <div
            className="text-left rounded-xl p-3 text-xs space-y-2"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center gap-1.5 font-semibold text-primary">
              <ShieldCheck size={14} />
              {lang === "en" ? "Developer Information" : "Informasi Pembuat"}
            </div>

            <div className="space-y-1 text-dim">
              <div className="flex justify-between">
                <span className="text-faint">Developer:</span>
                <span className="font-medium text-main">Hizam Nahari</span>
              </div>
              <div className="flex justify-between">
                <span className="text-faint">Workshop:</span>
                <span className="font-medium text-main">Megapass Intra Solusindo</span>
              </div>
              <div className="flex justify-between">
                <span className="text-faint">Lokasi:</span>
                <span className="font-medium text-main">Sidoarjo, Jawa Timur</span>
              </div>
            </div>
          </div>

          {/* Links / Website */}
          <div className="flex gap-2 pt-2">
            <button
              className="btn btn-ghost btn-sm flex-1 flex items-center justify-center gap-2"
              onClick={() => handleOpenLink("https://megapass.web.id")}
              title="Kunjungi Website Megapass"
              style={{ border: "1px solid var(--border)" }}
            >
              <Globe size={14} className="text-primary" />
              <span>Website</span>
            </button>
            <button
              className="btn btn-ghost btn-sm flex-1 flex items-center justify-center gap-2"
              onClick={() => handleOpenLink("https://github.com/4ntiDandruff/adb-uninstaller")}
              title="Kunjungi Repository GitHub"
              style={{ border: "1px solid var(--border)" }}
            >
              <Github size={14} />
              <span>GitHub</span>
            </button>
          </div>
        </div>

        <div className="modal-foot flex items-center justify-between">
          <span className="text-xs text-faint flex items-center gap-1">
            Made with <Heart size={12} className="text-danger fill-danger" /> in Sidoarjo
          </span>
          <button className="btn btn-primary btn-sm" onClick={onClose}>
            {lang === "en" ? "Close" : "Tutup"}
          </button>
        </div>
      </div>
    </div>
  );
}
