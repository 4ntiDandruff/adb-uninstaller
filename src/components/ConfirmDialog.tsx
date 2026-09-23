import { AlertTriangle, X } from "lucide-react";
import { useEffect, useRef } from "react";

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
    if (!open) return;
    cancelRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="flex items-center gap-2">
            {danger && <AlertTriangle size={16} className="text-danger" />}
            <div className="modal-title">{title}</div>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onCancel} title="Batal">
            <X size={15} />
          </button>
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
