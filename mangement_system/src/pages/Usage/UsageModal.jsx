import {
  Box,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Hash,
  Info,
  Loader2,
  MapPinned,
  Ruler,
  Warehouse,
  X,
} from "lucide-react";
import { useEffect } from "react";
import useUsageDetail from "../../hooks/useUsageDetail";
import useProducts from "../../hooks/useProducts";
import { formatDate } from "../../utils/invoiceHelpers";
import { getEntityTypeLabel } from "../../utils/entityType";
import {
  getLineProduct,
  getLineQuantity,
  getUsageItems,
  getUsageTargetName,
  getUsageTargetType,
  sumUsageQuantity,
} from "../../utils/usageHelpers";
import "./UsageModal.css";

const ITEM_COLUMNS = [
  { label: "المنتج", icon: Box },
  { label: "الوحدة", icon: Ruler },
  { label: "الكمية", icon: Hash },
];

export default function UsageModal({ usageId, onClose }) {
  const { status, usage, error, reload } = useUsageDetail(usageId);
  const { products } = useProducts();
  const productMap = new Map(products.map((p) => [p._id, p]));

  useEffect(() => {
    const onKeyDown = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const items = usage ? getUsageItems(usage) : [];

  return (
    <div className="usage-modal-overlay" onClick={onClose}>
      <div
        className="usage-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="usage-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="usage-modal__header">
          <h2 id="usage-modal-title" className="usage-modal__title">
            <ClipboardList size={22} strokeWidth={1.8} aria-hidden="true" />
            تفاصيل عملية الاستخدام
          </h2>
          <button type="button" className="usage-modal__close" onClick={onClose} aria-label="إغلاق">
            <X size={20} />
          </button>
        </header>

        <div className="usage-modal__body">
          {status === "loading" && (
            <p className="um-state">
              <Loader2 size={18} className="um-spin" aria-hidden="true" />
              جاري تحميل البيانات...
            </p>
          )}

          {status === "error" && (
            <p className="um-state um-state--error">
              {error?.message || "تعذّر تحميل البيانات."}
              <button type="button" className="um-retry-btn" onClick={reload}>
                إعادة المحاولة
              </button>
            </p>
          )}

          {status === "success" && usage && (
            <>
              <div className="um-info-panel">
                <div className="um-info-panel__header">
                  <Info size={16} aria-hidden="true" />
                  معلومات العملية
                </div>

                <dl className="um-info-grid">
                  <div className="um-info-row">
                    <dt>
                      <Calendar size={14} aria-hidden="true" /> التاريخ
                    </dt>
                    <dd>{formatDate(usage.createdAt)}</dd>
                  </div>
                  <div className="um-info-row">
                    <dt>
                      <Warehouse size={14} aria-hidden="true" /> النوع
                    </dt>
                    <dd>{getEntityTypeLabel(getUsageTargetType(usage))}</dd>
                  </div>
                  <div className="um-info-row">
                    <dt>
                      <MapPinned size={14} aria-hidden="true" /> الموقع / المخزن
                    </dt>
                    <dd>{getUsageTargetName(usage)}</dd>
                  </div>
                  <div className="um-info-row">
                    <dt>
                      <Hash size={14} aria-hidden="true" /> إجمالي الكمية
                    </dt>
                    <dd>{sumUsageQuantity(items)}</dd>
                  </div>
                  <div className="um-info-row">
                    <dt>
                      <CheckCircle2 size={14} aria-hidden="true" /> الحالة
                    </dt>
                    <dd>
                      <span className={`um-badge ${usage.Activated ? "um-badge--active" : "um-badge--draft"}`}>
                        {usage.Activated ? "مفعل" : "مسودة"}
                      </span>
                    </dd>
                  </div>
                </dl>
              </div>

              <section className="um-items">
                <h3>أصناف الاستخدام</h3>
                <div className="um-table-wrap">
                  <table className="um-table">
                    <thead>
                      <tr>
                        {ITEM_COLUMNS.map(({ label, icon: Icon }) => (
                          <th key={label}>
                            <span className="um-th-label">
                              <Icon size={14} aria-hidden="true" />
                              {label}
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {items.length === 0 && (
                        <tr>
                          <td colSpan={ITEM_COLUMNS.length} className="um-table__message">
                            لا توجد أصناف في هذه العملية.
                          </td>
                        </tr>
                      )}
                      {items.map((line, i) => {
                        const { name, unit } = getLineProduct(line, productMap);
                        return (
                          <tr key={line._id ?? i}>
                            <td className="um-col-product">{name}</td>
                            <td>{unit}</td>
                            <td className="um-col-qty">{getLineQuantity(line)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </div>

        <footer className="usage-modal__footer">
          <button type="button" className="usage-modal__btn" onClick={onClose}>
            إغلاق
          </button>
        </footer>
      </div>
    </div>
  );
}
