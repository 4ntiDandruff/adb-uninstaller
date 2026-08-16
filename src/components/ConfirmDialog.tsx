import { AlertTriangle } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";

interface Props {
  open: boolean;
  title: string;
  message: string;
  detail?: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open, title, message, detail, confirmLabel = "Lanjutkan",
  danger = false, onConfirm, onCancel,
}: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) cancelRef.current?.focus();
  }, [open]);

  const onKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") onCancel();
  }, [onCancel]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onCancel} onKeyDown={onKey}>
      <div className="modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="flex items-center gap-2">
            {danger && <AlertTriangle size={16} className="text-danger" />}
            <div className="modal-title">{title}</div>
          </div>
        </div>
        <div className="modal-body">
          <div className="text-sm" style={{ whiteSpace: "pre-wrap" }}>{message}</div>
          {detail && (
            <div className="mt-2 rounded-lg p-2 text-xs mono" style={{ background: "var(--bg-card)", maxHeight: 120, overflowY: "auto" }}>
              {detail}
            </div>
          )}
        </div>
        <div className="modal-foot">
          <button ref={cancelRef} className="btn btn-ghost" onClick={onCancel}>
            Batal
          </button>
          <button
            className={danger ? "btn btn-danger" : "btn btn-primary"}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
