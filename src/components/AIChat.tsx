import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Minus, Send, Trash2, X } from "lucide-react";
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
  const msgsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    msgsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, busy]);

  function startDrag(clientX: number, clientY: number) {
    isDragging.current = true;
    const rect = dragRef.current?.getBoundingClientRect();
    if (rect) offsetRef.current = { x: clientX - rect.left, y: clientY - rect.top };
  }

  function moveDrag(clientX: number, clientY: number) {
    if (!isDragging.current) return;
    const maxX = window.innerWidth - 320;
    const maxY = window.innerHeight - 48;
    setPos({
      x: Math.max(0, Math.min(clientX - offsetRef.current.x, maxX)),
      y: Math.max(0, Math.min(clientY - offsetRef.current.y, maxY)),
    });
  }

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    startDrag(e.clientX, e.clientY);
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    const t = e.touches[0];
    startDrag(t.clientX, t.clientY);
  }, []);

  useEffect(() => {
    function onMove(e: MouseEvent) { moveDrag(e.clientX, e.clientY); }
    function onTouch(e: TouchEvent) { moveDrag(e.touches[0].clientX, e.touches[0].clientY); }
    function onUp() { isDragging.current = false; }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onTouch, { passive: true });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("touchend", onUp);
    };
  }, [setPos]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setMsgs((m) => [...m, { role: "user", content: text }]);
    setBusy(true);
    try {
      const history = [...msgs, { role: "user" as const, content: text }];
      const reply = await api.chat(
        history.map(m => ({ role: m.role, content: m.content })),
        context
      );
      setMsgs((m) => [...m, { role: "assistant", content: reply }]);
    } catch (e) {
      toast.error(`Chat AI gagal`);
      setMsgs((m) => [...m, { role: "assistant", content: `⚠️ ${e}` }]);
    } finally {
      setBusy(false);
    }
  }

  const headProps = { onMouseDown, onTouchStart };

  if (minimized) {
    return (
      <div ref={dragRef} className="ai-float minimized" style={{ left: pos.x, top: pos.y }}>
        <div className="ai-float-head" {...headProps} onClick={onToggleMinimize} title="Klik untuk buka">
          <span>AI Assistant</span>
        </div>
      </div>
    );
  }

  return (
    <div ref={dragRef} className="ai-float" style={{ left: pos.x, top: pos.y }}>
      <div className="ai-float-head" {...headProps}>
        <span className="font-semibold">AI Assistant</span>
        <div className="flex items-center gap-1">
          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setMsgs([])} title="Clear history">
            <Trash2 size={13} />
          </button>
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
              Tanya seputar debloat, keamanan package, atau perintah ADB.
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
          <div ref={msgsEndRef} />
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
