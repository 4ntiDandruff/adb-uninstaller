import { Search, X } from "lucide-react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onClear: () => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, onClear, placeholder }: Props) {
  return (
    <div className="search-wrap">
      <Search size={15} className="search-icon" />
      <input
        className="input"
        placeholder={placeholder ?? "Cari nama aplikasi atau package..."}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button className="search-clear" onClick={onClear} aria-label="clear" title="Clear">
          <X size={14} />
        </button>
      )}
    </div>
  );
}
