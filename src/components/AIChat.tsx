import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Minus, Send, X } from "lucide-react";
import { api, toast } from "./api";

export interface Msg {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  context: string;
  msgs: Msg[];
  setMsgs: React.Dispatch<React.SetStateAction<Msg[]>>;
  pos: { x: number; y: number };
  setPos: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  minimized: boolean;
  onClose: () => void;
  onToggleMinimize: () => void;
}

export function AIChat({ context, msgs, setMsgs, pos, setPos, minimized, onClose, onToggleMinimize }: Props) {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest("button")) return;
      isDragging.current = true;
      const rect = dragRef.current?.getBoundingClientRect();
      if (rect) {
        offsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      }
    },
    [],
  );

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!isDragging.current) return;
      const nx = e.clientX - offsetRef.current.x;
      const ny = e.clientY - offsetRef.current.y;
      // Clamp: jangan biarkan window keluar layar
      const maxX = window.innerWidth - 320;
      const maxY = window.innerHeight - 200;
      setPos({
        x: Math.max(0, Math.min(nx, maxX)),
        y: Math.max(0, Math.min(ny, maxY)),
      });
    }
    function onUp() {
      isDragging.current = false;
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [setPos]);

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

  if (minimized) {
    return (
      <div
        className="ai-float minimized"
        style={{ left: pos.x, top: pos.y }}
        onClick={onToggleMinimize}
        title="Klik untuk buka"
      >
        <div className="ai-float-head" onMouseDown={onMouseDown}>
          <span>AI Assistant</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={dragRef}
      className="ai-float"
      style={{ left: pos.x, top: pos.y }}
    >
      <div className="ai-float-head" onMouseDown={onMouseDown}>
        <span className="font-semibold">AI Assistant</span>
        <div className="flex items-center gap-1">
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onToggleMinimize} title="Minimize">
            <Minus size={13} />
          </button>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose} title="Tutup">
            <X size={13} />
          </button>
        </div>
      </div>
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
    </div>
  );
}
