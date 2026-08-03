import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onClear: () => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, onClear, placeholder }: Props) {
  const [local, setLocal] = useState(value);

  useEffect(() => { setLocal(value); }, [value]);

  useEffect(() => {
    const t = setTimeout(() => onChange(local), 200);
    return () => clearTimeout(t);
  }, [local, onChange]);

  return (
    <div className="search-wrap">
      <Search size={15} className="search-icon" />
      <input
        className="input"
        placeholder={placeholder ?? "Cari nama aplikasi atau package..."}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
      />
      {local && (
        <button className="search-clear" onClick={() => { setLocal(""); onClear(); }} aria-label="clear" title="Clear">
          <X size={14} />
        </button>
      )}
    </div>
  );
}
