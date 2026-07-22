import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { api, toast } from "./api";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  context: string;
}

export function AIChat({ context }: Props) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setMsgs((m) => [...m, { role: "user", content: text }]);
    setBusy(true);
    try {
      const reply = await api.chat(text, context);
      setMsgs((m) => [...m, { role: "assistant", content: reply }]);
    } catch (e) {
      toast.error(`Chat AI gagal`);
      setMsgs((m) => [...m, { role: "assistant", content: `⚠️ ${e}` }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ai-panel">
      <div className="ai-messages">
        {msgs.length === 0 && (
          <div className="text-xs text-dim">
            Tanya seputar debloat, keamanan package, atau perintah ADB. Contoh: "aplikasi apa yang aman dihapus di
            Xiaomi?"
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={`ai-bubble ${m.role}`}>
            {m.content}
          </div>
        ))}
        {busy && (
          <div className="ai-bubble assistant flex items-center gap-2 text-dim">
            <Loader2 size={14} className="animate-spin" /> mengetik…
          </div>
        )}
      </div>
      <div className="ai-input-row">
        <input
          className="input"
          placeholder="Ketik pesan…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          disabled={busy}
        />
        <button className="btn btn-primary btn-icon" onClick={send} disabled={busy || !input.trim()}>
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}
