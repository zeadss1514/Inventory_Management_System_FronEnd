import { useEffect } from "react";
import { ArrowLeftRight, X } from "lucide-react";
import "./TransactionModal.css";

// PLACEHOLDER — will fetch the full transaction (including TransactedItems)
// from API_ENDPOINTS.transactionDetail(id), the same way PurchaseModal does.
export default function TransactionModal({ transactionId, onClose }) {
  useEffect(() => {
    const onKeyDown = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="transaction-modal-overlay" onClick={onClose}>
      <div
        className="transaction-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="transaction-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="transaction-modal__header">
          <h2 id="transaction-modal-title" className="transaction-modal__title">
            <ArrowLeftRight size={22} strokeWidth={1.8} aria-hidden="true" />
            تفاصيل التحويل
          </h2>
          <button type="button" className="transaction-modal__close" onClick={onClose} aria-label="إغلاق">
            <X size={20} />
          </button>
        </div>

        <div className="transaction-modal__body">
          <p className="transaction-modal__id">رقم التحويل: {transactionId}</p>
          <p className="transaction-modal__hint">سيتم بناء محتوى هذه النافذة في الخطوة التالية.</p>
        </div>

        <div className="transaction-modal__footer">
          <button type="button" className="transaction-modal__btn" onClick={onClose}>
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
