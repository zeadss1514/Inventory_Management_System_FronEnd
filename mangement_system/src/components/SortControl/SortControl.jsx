import { ArrowDownAZ, ArrowUpAZ, ChevronDown } from "lucide-react";
import "./SortControl.css";

// options: [{ value, label }]
export default function SortControl({ id, options, value, direction, onChange, onToggleDirection }) {
  return (
    <div className="sort-control">
      <label htmlFor={id}>ترتيب حسب:</label>
      <div className="select">
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown size={16} className="select__chevron" aria-hidden="true" />
      </div>

      <button
        type="button"
        className="sort-control__dir"
        onClick={onToggleDirection}
        aria-label={direction === "asc" ? "تصاعدي" : "تنازلي"}
        title={direction === "asc" ? "تصاعدي" : "تنازلي"}
      >
        {direction === "asc" ? <ArrowUpAZ size={18} /> : <ArrowDownAZ size={18} />}
      </button>
    </div>
  );
}
