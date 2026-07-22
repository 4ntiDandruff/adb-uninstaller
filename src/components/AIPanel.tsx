import { useState } from "react";
import { MessageSquare, Send, X, Loader2 } from "lucide-react";
import { api, toast } from "./api";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  open: boolean;
  onToggle: () => void;
  context: string;
}

export function AIPanel({ open, onToggle, context }: Props) {
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
      toast.error(`Chat AI gagal: ${e}`);
      setMsgs((m) => [...m, { role: "assistant", content: `⚠️ ${e}` }]);
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        className="btn btn-primary fixed bottom-4 right-4 z-40 rounded-full p-3 shadow-lg"
        onClick={onToggle}
        title="Chat AI"
      >
        <MessageSquare size={20} />
      </button>
    );
  }

  return (
    <div className="card fixed bottom-4 right-4 z-40 flex h-[28rem] w-96 max-w-[92vw] flex-col p-3 shadow-2xl">
      <div className="mb-2 flex items-center justify-between border-b border-slate-700 pb-2">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <MessageSquare size={16} className="text-blue-400" /> AI Assistant
        </span>
        <button className="rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-white" onClick={onToggle}>
          <X size={16} />
        </button>
      </div>
      <div className="mb-2 min-h-0 flex-1 space-y-2 overflow-auto">
        {msgs.length === 0 && (
          <div className="text-xs text-slate-500">
            Tanya apa saja: "aplikasi apa yang aman dihapus?", "cara debloat xiaomi", dll.
          </div>
        )}
        {msgs.map((m, i) => (
          <div
            key={i}
            className={`rounded-lg px-3 py-2 text-sm ${
              m.role === "user"
                ? "ml-8 bg-blue-600 text-white"
                : "mr-8 bg-slate-700 text-slate-100"
            }`}
          >
            <pre className="whitespace-pre-wrap font-sans">{m.content}</pre>
          </div>
        ))}
        {busy && (
          <div className="mr-8 flex items-center gap-2 rounded-lg bg-slate-700 px-3 py-2 text-sm text-slate-300">
            <Loader2 size={14} className="animate-spin" /> mengetik…
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <input
          className="input"
          placeholder="Ketik pesan…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          disabled={busy}
        />
        <button className="btn btn-primary" onClick={send} disabled={busy || !input.trim()}>
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
