import { useEffect, useState } from "react";
import { X, Loader2, CheckCircle2, XCircle } from "lucide-react";
import type { AppSettings } from "../types";
import { api, toast } from "./api";
import { invoke } from "@tauri-apps/api/core";
import type { ConnectionTest } from "../types";

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
    api
      .loadSettings()
      .then(setS)
      .catch((e) => toast.error(`Load settings gagal: ${e}`));
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
      toast.success("Settings tersimpan");
      onSaved(s);
      onClose();
    } catch (e) {
      toast.error(`Simpan gagal: ${e}`);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="card max-h-[90vh] w-full max-w-xl overflow-auto p-5" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Pengaturan</h3>
          <button className="rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-white" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <div>
            <label className="mb-1 block text-slate-400">AI Base URL (wajib /v1)</label>
            <input className="input" value={s.ai_base_url} onChange={(e) => set("ai_base_url", e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-slate-400">API Key</label>
            <input
              className="input"
              type="password"
              value={s.ai_api_key}
              onChange={(e) => set("ai_api_key", e.target.value)}
              placeholder="sk-..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-slate-400">Model</label>
              <input className="input" value={s.ai_model} onChange={(e) => set("ai_model", e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-slate-400">Bahasa UI</label>
              <select className="input" value={s.language} onChange={(e) => set("language", e.target.value)}>
                <option value="id">Indonesia</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-slate-400">Temperature</label>
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
            <div>
              <label className="mb-1 block text-slate-400">Max Tokens</label>
              <input
                className="input"
                type="number"
                value={s.max_tokens}
                onChange={(e) => set("max_tokens", parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-slate-400">System Prompt</label>
            <textarea
              className="input min-h-20"
              value={s.ai_system_prompt}
              onChange={(e) => set("ai_system_prompt", e.target.value)}
            />
          </div>

          {testResult && (
            <div
              className={`flex items-start gap-2 rounded-md p-2 text-xs ${
                testResult.success ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"
              }`}
            >
              {testResult.success ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
              <div className="min-w-0 flex-1 break-words">
                {testResult.message}
                {testResult.models.length > 0 && (
                  <div className="mt-1 text-slate-400">
                    {testResult.models.length} models: {testResult.models.slice(0, 5).join(", ")}
                    {testResult.models.length > 5 ? "…" : ""}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-end gap-2">
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
