import {
  Box,
  Calculator,
  Calendar,
  CheckCircle2,
  DollarSign,
  FileText,
  Hash,
  Info,
  Loader2,
  Ruler,
  User,
  Warehouse,
  X,
} from "lucide-react";
import usePurchaseDetail from "../../hooks/usePurchaseDetail";
import useProducts from "../../hooks/useProducts";
import { formatCurrency, formatDate, getPurchasedToName } from "../../utils/invoiceHelpers";
import { getEntityTypeLabel } from "../../utils/entityType";
import "./PurchaseModal.css";

const getTypeLabel = getEntityTypeLabel;

const ITEM_COLUMNS = [
  { label: "المنتج", icon: Box },
  { label: "الوحدة", icon: Ruler },
  { label: "الكمية", icon: Hash },
  { label: "سعر الوحدة", icon: DollarSign },
  { label: "الإجمالي", icon: Calculator },
];

export default function PurchaseModal({ invoiceId, onClose }) {
  const { status, invoice, error, reload } = usePurchaseDetail(invoiceId);
  // The invoice's items only carry a ProductId reference, so the product's
  // name/unit are resolved here from the already-fetched product list.
  const { products } = useProducts();

  return (
    <div className="purchase-modal-overlay" onClick={onClose}>
      <div
        className="purchase-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="purchase-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="purchase-modal__header">
          <h2 id="purchase-modal-title" className="purchase-modal__title">
            <FileText size={22} strokeWidth={1.8} aria-hidden="true" />
            تفاصيل الفاتورة
          </h2>
          <button type="button" className="purchase-modal__close" onClick={onClose} aria-label="إغلاق">
            <X size={20} />
          </button>
        </header>

        <div className="purchase-modal__body">
          {status === "loading" && (
            <p className="pm-state">
              <Loader2 size={18} className="pm-spin" aria-hidden="true" />
              جاري تحميل بيانات الفاتورة...
            </p>
          )}

          {status === "error" && (
            <p className="pm-state pm-state--error">
              {error?.message || "تعذّر تحميل بيانات الفاتورة."}
              <button type="button" className="pm-retry-btn" onClick={reload}>
                إعادة المحاولة
              </button>
            </p>
          )}

          {status === "success" && invoice && (
            <>
              <div className="pm-info-panel">
                <div className="pm-info-panel__header">
                  <Info size={16} aria-hidden="true" />
                  معلومات الفاتورة
                </div>

                <dl className="pm-info-grid">
                  <div className="pm-info-row">
                    <dt>
                      <Calendar size={14} aria-hidden="true" /> التاريخ
                    </dt>
                    <dd>{formatDate(invoice.createdAt)}</dd>
                  </div>
                  <div className="pm-info-row">
                    <dt>
                      <Warehouse size={14} aria-hidden="true" /> نوع الشراء
                    </dt>
                    <dd>{getTypeLabel(invoice.purchaseToType)}</dd>
                  </div>
                  <div className="pm-info-row">
                    <dt>
                      <Warehouse size={14} aria-hidden="true" /> تم الشراء إلى
                    </dt>
                    <dd>{getPurchasedToName(invoice.purchasedTo)}</dd>
                  </div>
                  <div className="pm-info-row">
                    <dt>
                      <DollarSign size={14} aria-hidden="true" /> التكلفة الإجمالية
                    </dt>
                    <dd>{formatCurrency(invoice.totalcost ?? invoice.totalCost)}</dd>
                  </div>
                  <div className="pm-info-row">
                    <dt>
                      <CheckCircle2 size={14} aria-hidden="true" /> الحالة
                    </dt>
                    <dd>
                      <span className={`pm-badge ${invoice.Activated ? "pm-badge--active" : "pm-badge--draft"}`}>
                        {invoice.Activated ? "مفعل" : "مسودة"}
                      </span>
                    </dd>
                  </div>
                  <div className="pm-info-row">
                    <dt>
                      <User size={14} aria-hidden="true" /> المستخدم
                    </dt>
                    <dd>
                      <span className="pm-user-disabled" title="سيتم تفعيل عرض المستخدم الذي أنشأ الفاتورة لاحقاً">
                        غير مفعل
                      </span>
                    </dd>
                  </div>
                </dl>
              </div>

              <section className="pm-items">
                <h3>أصناف الفاتورة</h3>
                <div className="pm-table-wrap">
                  <table className="pm-table">
                    <thead>
                      <tr>
                        {ITEM_COLUMNS.map(({ label, icon: Icon }) => (
                          <th key={label}>
                            <span className="pm-th-label">
                              <Icon size={14} aria-hidden="true" />
                              {label}
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(!invoice.InvoiceItems || invoice.InvoiceItems.length === 0) && (
                        <tr>
                          <td colSpan={ITEM_COLUMNS.length} className="pm-table__message">
                            لا توجد أصناف في هذه الفاتورة.
                          </td>
                        </tr>
                      )}
                      {(invoice.InvoiceItems ?? []).map((line) => {
                        const productId =
                          typeof line.ProductId === "string" ? line.ProductId : line.ProductId?._id;
                        const product = products.find((p) => p._id === productId) ?? null;
                        const name = product?.name ?? line.ProductId?.name ?? "—";
                        const unit = product?.measurementUnit ?? line.ProductId?.measurementUnit ?? "—";
                        return (
                          <tr key={line._id ?? productId}>
                            <td className="pm-col-product">{name}</td>
                            <td>{unit}</td>
                            <td>{line.Quantity ?? "—"}</td>
                            <td>{formatCurrency(line.CostPerOne)}</td>
                            <td className="pm-col-total">{formatCurrency(line.TotalCost)}</td>
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

        <footer className="purchase-modal__footer">
          <button type="button" className="purchase-modal__btn" onClick={onClose}>
            إغلاق
          </button>
        </footer>
      </div>
    </div>
  );
}
