import { useEffect, useState } from "react";
import { X, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import type { AppSettings, ConnectionTest } from "../types";
import { api, toast } from "./api";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: (s: AppSettings) => void;
}

export function SettingsDialog({ open, onClose, onSaved }: Props) {
  const [s, setS] = useState<AppSettings | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTest | null>(null);

  useEffect(() => {
    if (!open) return;
    api.loadSettings().then(setS).catch((e) => toast.error(`Load settings gagal: ${e}`));
  }, [open]);

  if (!open || !s) return null;

  const set = <K extends keyof AppSettings>(k: K, v: AppSettings[K]) =>
    setS((p) => (p ? { ...p, [k]: v } : p));

  async function testConnection() {
    if (!s) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await invoke<ConnectionTest>("test_ai_connection", {
        baseUrl: s.ai_base_url,
        apiKey: s.ai_api_key,
        model: s.ai_model,
      });
      setTestResult(res);
      if (res.success) toast.success("Koneksi AI OK");
      else toast.error(res.message);
    } catch (e) {
      toast.error(`Test gagal: ${e}`);
    } finally {
      setTesting(false);
    }
  }

  async function save() {
    if (!s) return;
    try {
      await api.saveSettings(s);
      toast.success("Pengaturan tersimpan");
      onSaved(s);
      onClose();
    } catch (e) {
      toast.error(`Simpan gagal: ${e}`);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">Pengaturan</div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          <div className="field">
            <label className="field-label">AI Base URL (wajib /v1)</label>
            <input className="input" value={s.ai_base_url} onChange={(e) => set("ai_base_url", e.target.value)} />
          </div>
          <div className="field">
            <label className="field-label">API Key</label>
            <input
              className="input"
              type="password"
              value={s.ai_api_key}
              onChange={(e) => set("ai_api_key", e.target.value)}
              placeholder="sk-..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="field">
              <label className="field-label">Model</label>
              <input className="input" value={s.ai_model} onChange={(e) => set("ai_model", e.target.value)} />
            </div>
            <div className="field">
              <label className="field-label">Bahasa UI</label>
              <select className="select-dark" value={s.language} onChange={(e) => set("language", e.target.value)}>
                <option value="id">Indonesia</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="field">
              <label className="field-label">Temperature</label>
              <input
                className="input"
                type="number"
                step="0.1"
                min="0"
                max="2"
                value={s.temperature}
                onChange={(e) => set("temperature", parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="field">
              <label className="field-label">Max Tokens</label>
              <input
                className="input"
                type="number"
                value={s.max_tokens}
                onChange={(e) => set("max_tokens", parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
          <div className="field">
            <label className="field-label">System Prompt</label>
            <textarea
              className="input"
              rows={3}
              value={s.ai_system_prompt}
              onChange={(e) => set("ai_system_prompt", e.target.value)}
            />
          </div>

          {testResult && (
            <div
              className={`flex items-start gap-2 rounded-lg p-3 text-xs ${
                testResult.success ? "bg-emerald-500/10 text-emerald-300" : "bg-red-500/10 text-red-300"
              }`}
            >
              {testResult.success ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
              <div className="min-w-0 flex-1 break-words">
                {testResult.message}
                {testResult.models.length > 0 && (
                  <div className="mt-1 text-dim">
                    {testResult.models.length} model: {testResult.models.slice(0, 5).join(", ")}
                    {testResult.models.length > 5 ? "…" : ""}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="modal-foot">
          <button className="btn btn-ghost" onClick={testConnection} disabled={testing}>
            {testing ? <Loader2 size={14} className="animate-spin" /> : null}
            Test Koneksi
          </button>
          <button className="btn btn-primary" onClick={save}>
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}
