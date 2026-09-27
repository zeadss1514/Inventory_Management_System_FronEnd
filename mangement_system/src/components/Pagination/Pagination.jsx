import { ChevronLeft, ChevronRight } from "lucide-react";
import "./Pagination.css";

const WINDOW = 5; // how many page numbers to show at once

export default function Pagination({ page, totalPages, onPageChange }) {
  const start = Math.max(1, Math.min(page - 2, totalPages - WINDOW + 1));
  const end = Math.min(totalPages, start + WINDOW - 1);
  const pages = [];
  for (let p = start; p <= end; p++) pages.push(p);

  return (
    <nav className="pagination" aria-label="التنقل بين الصفحات">
      <button
        type="button"
        className="pagination__btn"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="الصفحة السابقة"
      >
        <ChevronLeft size={16} />
      </button>

      {pages.map((p) => (
        <button
          key={p}
          type="button"
          className={`pagination__btn${p === page ? " pagination__btn--active" : ""}`}
          onClick={() => onPageChange(p)}
          aria-current={p === page ? "page" : undefined}
        >
          {p}
        </button>
      ))}

      <button
        type="button"
        className="pagination__btn"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="الصفحة التالية"
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}
