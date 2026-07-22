import { useState } from "react";
import { Copy, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import type { LogEntry } from "../types";
import { cn } from "../lib/utils";
import { toast } from "./api";

const LEVEL_STYLE: Record<LogEntry["level"], string> = {
  info: "text-slate-300",
  success: "text-emerald-400",
  warn: "text-amber-400",
  error: "text-red-400",
};

interface Props {
  logs: LogEntry[];
  onClear: () => void;
}

export function LogPanel({ logs, onClear }: Props) {
  const [open, setOpen] = useState(true);
  const [levelFilter, setLevelFilter] = useState<"all" | LogEntry["level"]>("all");

  const filtered = logs.filter((l) => levelFilter === "all" || l.level === levelFilter);

  async function copyAll() {
    const text = filtered
      .map((l) => `[${l.ts}] [${l.level.toUpperCase()}] [${l.source}] ${l.message}${l.detail ? `\n${l.detail}` : ""}`)
      .join("\n");
    await navigator.clipboard.writeText(text);
    toast.success("Log disalin ke clipboard");
  }

  return (
    <div className="card mt-2 flex min-h-0 flex-col">
      <div className="flex items-center gap-2 border-b border-slate-700 px-3 py-1.5">
        <button className="text-slate-300 hover:text-white" onClick={() => setOpen((o) => !o)}>
          {open ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
        <span className="text-sm font-semibold">Log / Riwayat</span>
        <select
          className="select-dark ml-2 w-32 px-2 py-0.5 text-xs"
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value as typeof levelFilter)}
        >
          <option value="all">Semua</option>
          <option value="info">Info</option>
          <option value="success">Success</option>
          <option value="warn">Warn</option>
          <option value="error">Error</option>
        </select>
        <span className="ml-auto text-xs text-slate-500">{filtered.length} entri</span>
        <button className="btn btn-ghost px-2 py-1 text-xs" onClick={copyAll} title="Copy log">
          <Copy size={14} />
        </button>
        <button className="btn btn-ghost px-2 py-1 text-xs" onClick={onClear} title="Clear log">
          <Trash2 size={14} />
        </button>
      </div>
      {open && (
        <div className="max-h-48 min-h-0 overflow-auto px-3 py-2 font-mono text-xs">
          {filtered.length === 0 && <div className="text-slate-500">Belum ada log.</div>}
          {filtered.map((l) => (
            <div key={l.id} className="mb-1">
              <span className="text-slate-500">{new Date(l.ts).toLocaleTimeString("id-ID")}</span>{" "}
              <span className={cn("font-semibold", LEVEL_STYLE[l.level])}>
                [{l.level.toUpperCase()}]
              </span>{" "}
              <span className="text-blue-300">[{l.source}]</span>{" "}
              <span className={LEVEL_STYLE[l.level]}>{l.message}</span>
              {typeof l.duration_ms === "number" && (
                <span className="text-slate-500"> ({l.duration_ms}ms)</span>
              )}
              {l.detail && <pre className="ml-6 whitespace-pre-wrap text-slate-400">{l.detail}</pre>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
