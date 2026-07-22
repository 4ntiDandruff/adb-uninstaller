import { useState } from "react";
import { ChevronDown, ChevronUp, Copy, Trash2 } from "lucide-react";
import type { LogEntry } from "../types";
import { toast } from "./api";

const LEVEL_CLASS: Record<LogEntry["level"], string> = {
  info: "text-dim",
  success: "text-success",
  warn: "text-warning",
  error: "text-danger",
};

interface Props {
  logs: LogEntry[];
  onClear: () => void;
}

export function LogDrawer({ logs, onClear }: Props) {
  const [open, setOpen] = useState(false);
  const [levelFilter, setLevelFilter] = useState<"all" | LogEntry["level"]>("all");
  const filtered = logs.filter((l) => levelFilter === "all" || l.level === levelFilter);

  async function copyAll() {
    const text = filtered
      .map((l) => `[${l.ts}] [${l.level.toUpperCase()}] [${l.source}] ${l.message}${l.detail ? `\n${l.detail}` : ""}`)
      .join("\n");
    await navigator.clipboard.writeText(text);
    toast.success("Log disalin");
  }

  return (
    <div className="log-drawer">
      <div className="log-header" onClick={() => setOpen((o) => !o)}>
        {open ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
        <span className="text-sm font-semibold">Log</span>
        <span className="text-xs text-faint">{filtered.length}</span>
        <div className="ml-auto flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <select
            className="select-dark btn-sm"
            style={{ width: 110 }}
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value as typeof levelFilter)}
          >
            <option value="all">Semua</option>
            <option value="info">Info</option>
            <option value="success">Success</option>
            <option value="warn">Warn</option>
            <option value="error">Error</option>
          </select>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={copyAll} title="Copy">
            <Copy size={14} />
          </button>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClear} title="Clear">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      {open && (
        <div className="log-body">
          {filtered.length === 0 && <div className="text-faint">Belum ada log.</div>}
          {filtered.map((l) => (
            <div key={l.id} className="log-line">
              <span className="log-time">{new Date(l.ts).toLocaleTimeString("id-ID")}</span>
              <span className={`font-semibold ${LEVEL_CLASS[l.level]}`}>[{l.level}]</span>
              <span className="text-primary">[{l.source}]</span>
              <span className={LEVEL_CLASS[l.level]}>
                {l.message}
                {typeof l.duration_ms === "number" && <span className="text-faint"> ({l.duration_ms}ms)</span>}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
