import { X } from "lucide-react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onClear: () => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, onClear, placeholder }: Props) {
  return (
    <div className="relative w-full max-w-sm">
      <input
        className="input pr-9"
        placeholder={placeholder ?? "Cari nama aplikasi..."}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          aria-label="clear"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-slate-100"
          onClick={onClear}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
