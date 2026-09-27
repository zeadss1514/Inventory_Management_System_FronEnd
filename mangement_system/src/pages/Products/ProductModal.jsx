import { useEffect } from "react";
import { Box, X } from "lucide-react";
import "./ProductModal.css";

// PLACEHOLDER – the real content (image, details, locations table) comes next.
export default function ProductModal({ product, onClose }) {
  useEffect(() => {
    const onKeyDown = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal__header">
          <h2 id="product-modal-title" className="modal__title">
            <Box size={22} strokeWidth={1.8} aria-hidden="true" />
            تفاصيل المنتج
          </h2>
          <button type="button" className="modal__close" onClick={onClose} aria-label="إغلاق">
            <X size={20} />
          </button>
        </div>

        <div className="modal__body">
          <p className="modal__product-name">{product.name}</p>
          <p className="modal__hint">سيتم بناء محتوى هذه النافذة في الخطوة التالية.</p>
        </div>

        <div className="modal__footer">
          <button type="button" className="modal__btn" onClick={onClose}>
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
