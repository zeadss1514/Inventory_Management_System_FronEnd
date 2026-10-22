import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Calendar,
  ExternalLink,
  FileText,
  Loader2,
  ScrollText,
  Tag,
  X,
} from "lucide-react";
import useProductLogs from "../../hooks/useProductLogs";
import {
  OPENABLE_LOG_TYPES,
  buildLogParts,
  formatDateTime,
  getLogDate,
  getLogDirection,
  getLogRefId,
  getLogTypeLabel,
  normalizeLogType,
} from "../../utils/logHelpers";
// Existing detail modals, reused as they are.
import PurchaseModal from "../Purchases/PurchaseModal";
import UsageModal from "../Usage/UsageModal";
import TransactionModal from "../Transactions/TransactionModal";
import "./ProductLogsModal.css";

// Same columns as the Logs page: date, direction (IncomingStock), type, sentence.
const COLUMNS = [
  { label: "التاريخ", icon: Calendar },
  { label: "الحركة", icon: ArrowLeftRight },
  { label: "النوع", icon: Tag },
  { label: "السجل", icon: FileText },
];

function toRow(log, index) {
  const time = getLogDate(log);
  const refId = getLogRefId(log);
  const type = normalizeLogType(log.typeOfInvoice);
  return {
    id: log._id ?? `log-${index}`,
    type,
    typeLabel: getLogTypeLabel(type),
    direction: getLogDirection(log),
    parts: buildLogParts(log),
    time,
    timeLabel: formatDateTime(time),
    refId: OPENABLE_LOG_TYPES.includes(type) ? refId : null,
  };
}

// Sorted ONLY by date, latest first (rows without a date last; ties -> newer id).
const newestFirst = (a, b) => {
  if (a.time == null && b.time == null) return String(b.id).localeCompare(String(a.id));
  if (a.time == null) return 1;
  if (b.time == null) return -1;
  return b.time - a.time || String(b.id).localeCompare(String(a.id));
};

function Sentence({ parts, type }) {
  return (
    <p className={`pl-sentence pl-sentence--${type ?? "unknown"}`} dir="rtl">
      {parts.map((part, i) =>
        part.kind === "text" ? (
          <span key={i} className="pl-word">
            {part.text}
          </span>
        ) : (
          <bdi key={i} className={`pl-chip pl-chip--${part.kind}${part.missing ? " pl-chip--missing" : ""}`}>
            {part.text}
          </bdi>
        ),
      )}
    </p>
  );
}

// Logs of ONE product inside ONE place: GET /logs/<productId>/<placeId>.
// Render it as a SIBLING of the opener's overlay (see WarehouseModal) so clicks
// here never bubble into that overlay's "click outside = close".
export default function ProductLogsModal({ productId, productName, placeId, placeName, onClose }) {
  const { status, logs, error, reload } = useProductLogs(productId, placeId);
  const [opened, setOpened] = useState(null); // { type, id } -> detail modal
  const closeDetail = useCallback(() => setOpened(null), []);

  const rows = useMemo(() => logs.map(toRow).sort(newestFirst), [logs]);

  useEffect(() => {
    // Esc closes only the top-most modal: while a detail modal is open, leave it be.
    const onKeyDown = (e) => e.key === "Escape" && !opened && onClose();
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, opened]);

  return (
    <>
      <div className="pl-overlay" onClick={onClose}>
        <div
          className="pl-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-logs-title"
          onClick={(e) => e.stopPropagation()}
        >
          <header className="pl-header">
            <div className="pl-header__text">
              <h2 id="product-logs-title" className="pl-title">
                <ScrollText size={22} strokeWidth={1.8} aria-hidden="true" />
                سجل الصنف
              </h2>
              <p className="pl-subtitle" dir="auto">
                <strong>{productName || "—"}</strong>
                <span aria-hidden="true"> · </span>
                {placeName || "—"}
              </p>
            </div>
            <button type="button" className="pl-close" onClick={onClose} aria-label="إغلاق">
              <X size={20} />
            </button>
          </header>

          <div className="pl-body">
            <div className="pl-table-wrap">
              <table className="pl-table">
                <thead>
                  <tr>
                    {COLUMNS.map(({ label, icon: Icon }) => (
                      <th key={label}>
                        <span className="pl-th-label">
                          <Icon size={15} aria-hidden="true" />
                          {label}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {status === "loading" && (
                    <tr>
                      <td colSpan={COLUMNS.length} className="pl-table__message">
                        <Loader2 size={18} className="pl-spin" aria-hidden="true" />
                        جاري تحميل السجلات...
                      </td>
                    </tr>
                  )}

                  {status === "error" && (
                    <tr>
                      <td colSpan={COLUMNS.length} className="pl-table__message pl-table__message--error">
                        {error?.message || "تعذّر تحميل السجلات."}
                        <button type="button" className="pl-retry-btn" onClick={reload}>
                          إعادة المحاولة
                        </button>
                      </td>
                    </tr>
                  )}

                  {status === "success" && rows.length === 0 && (
                    <tr>
                      <td colSpan={COLUMNS.length} className="pl-table__message">
                        لا توجد سجلات لهذا الصنف في هذا المكان.
                      </td>
                    </tr>
                  )}

                  {status === "success" &&
                    rows.map((row) => (
                      <tr key={row.id}>
                        <td className="pl-date">
                          <bdi dir="ltr">{row.timeLabel}</bdi>
                        </td>

                        <td>
                          {row.direction === "in" && (
                            <span className="pl-dir pl-dir--in">
                              <ArrowDownLeft size={14} aria-hidden="true" />
                              دخول
                            </span>
                          )}
                          {row.direction === "out" && (
                            <span className="pl-dir pl-dir--out">
                              <ArrowUpRight size={14} aria-hidden="true" />
                              خروج
                            </span>
                          )}
                          {!row.direction && "—"}
                        </td>

                        <td>
                          {row.refId ? (
                            <button
                              type="button"
                              className={`pl-type pl-type--${row.type} pl-type--link`}
                              onClick={() => setOpened({ type: row.type, id: row.refId })}
                              title="عرض تفاصيل العملية"
                              aria-label={`عرض تفاصيل عملية ${row.typeLabel}`}
                            >
                              {row.typeLabel}
                              <ExternalLink size={12} aria-hidden="true" />
                            </button>
                          ) : (
                            <span className={`pl-type pl-type--${row.type ?? "unknown"}`}>{row.typeLabel}</span>
                          )}
                        </td>

                        <td className="pl-text">
                          <Sentence parts={row.parts} type={row.type} />
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          <footer className="pl-footer">
            <span>
              {status === "success" && (
                <>
                  إجمالي السجلات: <strong>{rows.length}</strong>
                </>
              )}
            </span>
            <button type="button" className="pl-btn" onClick={onClose}>
              إغلاق
            </button>
          </footer>
        </div>
      </div>

      {/* Siblings of the overlay above (later in the DOM = on top at the same z-index). */}
      {opened?.type === "Invoices" && <PurchaseModal key={opened.id} invoiceId={opened.id} onClose={closeDetail} />}
      {opened?.type === "Usage" && <UsageModal key={opened.id} usageId={opened.id} onClose={closeDetail} />}
      {opened?.type === "TransactionsInvoices" && (
        <TransactionModal key={opened.id} transactionId={opened.id} onClose={closeDetail} />
      )}
    </>
  );
}
