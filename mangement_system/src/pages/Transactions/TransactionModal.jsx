import {
  ArrowLeftRight,
  Box,
  Calendar,
  CheckCircle2,
  Hash,
  Info,
  Loader2,
  MapPin,
  Ruler,
  User,
  Warehouse,
  X,
} from "lucide-react";
import useTransactionDetail from "../../hooks/useTransactionDetail";
import useProducts from "../../hooks/useProducts";
import useSites from "../../hooks/useSites";
import useWarehouses from "../../hooks/useWarehouses";
import { formatDate, getEntityName } from "../../utils/invoiceHelpers";
import { getEntityTypeLabel } from "../../utils/entityType";
import "./TransactionModal.css";

const ITEM_COLUMNS = [
  { label: "المنتج", icon: Box },
  { label: "الوحدة", icon: Ruler },
  { label: "الكمية", icon: Hash },
];

// TransactedFrom/TransactedTo sometimes arrive as a populated object and
// sometimes as a raw id string (e.g. right after creating the transaction).
// When it's just an id, look the name up in the already-fetched sites /
// warehouses list instead of showing the id itself.
function resolveEntityName(ref, type, sites, warehouses) {
  if (ref && typeof ref === "object") return getEntityName(ref);
  const list = type === "Sites" ? sites : warehouses;
  const found = list.find((d) => d._id === ref);
  return found?.name ?? getEntityName(ref);
}

export default function TransactionModal({ transactionId, onClose }) {
  const { status, transaction, error, reload } = useTransactionDetail(transactionId);
  // The transaction's items only carry a ProductId reference, so the
  // product's name/unit are resolved here from the already-fetched list.
  const { products } = useProducts();
  const { sites } = useSites();
  const { warehouses } = useWarehouses();

  const FromIcon = transaction?.FromType === "Sites" ? MapPin : Warehouse;
  const ToIcon = transaction?.ToType === "Sites" ? MapPin : Warehouse;
  const fromName = transaction
    ? resolveEntityName(transaction.TransactedFrom, transaction.FromType, sites, warehouses)
    : "—";
  const toName = transaction
    ? resolveEntityName(transaction.TransactedTo, transaction.ToType, sites, warehouses)
    : "—";

  return (
    <div className="transaction-modal-overlay" onClick={onClose}>
      <div
        className="transaction-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="transaction-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="transaction-modal__header">
          <h2 id="transaction-modal-title" className="transaction-modal__title">
            <ArrowLeftRight size={22} strokeWidth={1.8} aria-hidden="true" />
            تفاصيل التحويل
          </h2>
          <button type="button" className="transaction-modal__close" onClick={onClose} aria-label="إغلاق">
            <X size={20} />
          </button>
        </header>

        <div className="transaction-modal__body">
          {status === "loading" && (
            <p className="tm-state">
              <Loader2 size={18} className="tm-spin" aria-hidden="true" />
              جاري تحميل بيانات التحويل...
            </p>
          )}

          {status === "error" && (
            <p className="tm-state tm-state--error">
              {error?.message || "تعذّر تحميل بيانات التحويل."}
              <button type="button" className="tm-retry-btn" onClick={reload}>
                إعادة المحاولة
              </button>
            </p>
          )}

          {status === "success" && transaction && (
            <>
              <div className="tm-info-panel">
                <div className="tm-info-panel__header">
                  <Info size={16} aria-hidden="true" />
                  معلومات التحويل
                </div>

                <dl className="tm-info-grid">
                  <div className="tm-info-row">
                    <dt>
                      <Hash size={14} aria-hidden="true" /> رقم التحويل
                    </dt>
                    <dd>{transaction._id}</dd>
                  </div>
                  <div className="tm-info-row">
                    <dt>
                      <Calendar size={14} aria-hidden="true" /> التاريخ
                    </dt>
                    <dd>{formatDate(transaction.createdAt)}</dd>
                  </div>
                  <div className="tm-info-row">
                    <dt>
                      <FromIcon size={14} aria-hidden="true" /> من
                    </dt>
                    <dd>{fromName}</dd>
                  </div>
                  <div className="tm-info-row">
                    <dt>
                      <FromIcon size={14} aria-hidden="true" /> نوع المصدر
                    </dt>
                    <dd>{getEntityTypeLabel(transaction.FromType)}</dd>
                  </div>
                  <div className="tm-info-row">
                    <dt>
                      <ToIcon size={14} aria-hidden="true" /> إلى
                    </dt>
                    <dd>{toName}</dd>
                  </div>
                  <div className="tm-info-row">
                    <dt>
                      <ToIcon size={14} aria-hidden="true" /> نوع الوجهة
                    </dt>
                    <dd>{getEntityTypeLabel(transaction.ToType)}</dd>
                  </div>
                  <div className="tm-info-row">
                    <dt>
                      <CheckCircle2 size={14} aria-hidden="true" /> الحالة
                    </dt>
                    <dd>
                      <span className={`tm-badge ${transaction.Activated ? "tm-badge--active" : "tm-badge--draft"}`}>
                        {transaction.Activated ? "مفعل" : "مسودة"}
                      </span>
                    </dd>
                  </div>
                  <div className="tm-info-row">
                    <dt>
                      <User size={14} aria-hidden="true" /> المستخدم
                    </dt>
                    <dd>
                      <span className="tm-user-disabled" title="سيتم تفعيل عرض المستخدم الذي أنشأ التحويل لاحقاً">
                        غير مفعل
                      </span>
                    </dd>
                  </div>
                </dl>
              </div>

              <section className="tm-items">
                <h3>أصناف التحويل</h3>
                <div className="tm-table-wrap">
                  <table className="tm-table">
                    <thead>
                      <tr>
                        {ITEM_COLUMNS.map(({ label, icon: Icon }) => (
                          <th key={label}>
                            <span className="tm-th-label">
                              <Icon size={14} aria-hidden="true" />
                              {label}
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(!transaction.TransactedItems || transaction.TransactedItems.length === 0) && (
                        <tr>
                          <td colSpan={ITEM_COLUMNS.length} className="tm-table__message">
                            لا توجد أصناف في هذا التحويل.
                          </td>
                        </tr>
                      )}
                      {(transaction.TransactedItems ?? []).map((line) => {
                        const productRef = line.ProductId ?? line.productId;
                        const productId = typeof productRef === "string" ? productRef : productRef?._id;
                        const product = products.find((p) => p._id === productId) ?? null;
                        const name = product?.name ?? productRef?.name ?? "—";
                        const unit = product?.measurementUnit ?? productRef?.measurementUnit ?? "—";
                        return (
                          <tr key={line._id ?? productId}>
                            <td className="tm-col-product">{name}</td>
                            <td>{unit}</td>
                            <td>{line.Quantity ?? line.quantity ?? "—"}</td>
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

        <footer className="transaction-modal__footer">
          <button type="button" className="transaction-modal__btn" onClick={onClose}>
            إغلاق
          </button>
        </footer>
      </div>
    </div>
  );
}
