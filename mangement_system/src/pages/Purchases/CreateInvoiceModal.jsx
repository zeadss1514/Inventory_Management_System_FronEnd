import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Calculator,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  FileText,
  Hash,
  Loader2,
  Plus,
  Power,
  Ruler,
  Search,
  Settings,
  StickyNote,
  Trash2,
  X,
} from "lucide-react";
import { API_ENDPOINTS } from "../../config/api";
import useProducts from "../../hooks/useProducts";
import useSites from "../../hooks/useSites";
import useWarehouses from "../../hooks/useWarehouses";
import { formatCurrency } from "../../utils/invoiceHelpers";
import InvoiceItemRow from "./InvoiceItemRow";
import "./CreateInvoiceModal.css";

// Functional order — drives navigation / validation.
const FLOW_STEPS = ["type", "destination", "items", "review"];
const STEP_LABELS = {
  type: "نوع الفاتورة",
  destination: "اختيار الموقع / المخزن",
  items: "إضافة الأصناف",
  review: "التحقق من البيانات",
};
// Visual order only, matching the reference design (right to left: review, type, destination, items).
const STEPPER_DISPLAY_ORDER = ["review", "type", "destination", "items"];

const DESTINATION_TYPES = [
  { value: "Inventories", label: "مخزن" },
  { value: "Sites", label: "موقع" },
];

const ITEM_COLUMNS = [
  { label: "المنتج", icon: Box },
  { label: "الوحدة", icon: Ruler },
  { label: "الكمية", icon: Hash },
  { label: "سعر الوحدة", icon: DollarSign },
  { label: "إجمالي التكلفة", icon: Calculator },
  { label: "ملاحظات", icon: StickyNote },
  { label: "إجراءات", icon: Settings },
];

let localIdCounter = 0;
const nextLocalId = () => `local-${++localIdCounter}`;

// POSTs JSON and returns the parsed body. The API answers
// { success, message, data }, so this throws the server's own `message`
// whenever success is false or the HTTP status isn't ok, instead of a
// generic error — callers show err.message directly to the user.
async function postJson(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try {
    json = await res.json();
  } catch {
    // No JSON body — fine for a plain 200/204, but means we have no message on failure.
  }
  if (!res.ok || json?.success === false) {
    throw new Error(json?.message || "حدث خطأ غير متوقع. حاول مرة أخرى.");
  }
  return json ?? {};
}

// The API sometimes wraps the created/updated record in a one- or two-item
// array (e.g. [invoice, purchasedToDoc] from POST /purchase) instead of a
// bare object — this always returns the first record either way.
function firstRecord(data) {
  return Array.isArray(data) ? data[0] : data;
}

export default function CreateInvoiceModal({ onClose, onCreated }) {
  const [currentStep, setCurrentStep] = useState("type");

  // Step: destination
  const [destinationType, setDestinationType] = useState("Inventories");
  const [destinationId, setDestinationId] = useState("");
  const { warehouses, status: warehousesStatus } = useWarehouses();
  const { sites, status: sitesStatus } = useSites();
  const destinationOptions = destinationType === "Sites" ? sites : warehouses;
  const destinationStatus = destinationType === "Sites" ? sitesStatus : warehousesStatus;
  const selectedDestination = destinationOptions.find((d) => d._id === destinationId) ?? null;

  const [invoiceId, setInvoiceId] = useState(null);
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [createError, setCreateError] = useState(null);

  // Step: items
  const { products, status: productsStatus } = useProducts();
  const [items, setItems] = useState([]);
  const [itemSearch, setItemSearch] = useState("");

  const [activating, setActivating] = useState(false);
  const [activateError, setActivateError] = useState(null);
  const [activated, setActivated] = useState(false);

  useEffect(() => {
    const onKeyDown = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const totalCost = useMemo(
    () => items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.price) || 0), 0),
    [items],
  );

  const filteredItems = useMemo(() => {
    const q = itemSearch.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => {
      const product = products.find((p) => p._id === it.productId);
      return String(product?.name ?? "").toLowerCase().includes(q);
    });
  }, [items, itemSearch, products]);

  const hasSavedItem = items.some((it) => it.status === "saved");

  function goBack() {
    const idx = FLOW_STEPS.indexOf(currentStep);
    if (idx > 0) setCurrentStep(FLOW_STEPS[idx - 1]);
  }

  async function handleChooseDestination() {
    if (!destinationId || creatingInvoice) return;
    setCreatingInvoice(true);
    setCreateError(null);
    try {
      const json = await postJson(API_ENDPOINTS.createPurchase, {
        purchaseToType: destinationType,
        purchaseToId: destinationId,
      });
      const invoice = Array.isArray(json?.data) ? json.data[0] : (json?.data ?? json);
      const id = invoice?._id ?? invoice?.id;
      if (!id) throw new Error("لم يتم استلام رقم الفاتورة من الخادم.");
      setInvoiceId(id);
      onCreated?.();
      setCurrentStep("items");
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreatingInvoice(false);
    }
  }

  function handlePrimaryNext() {
    if (currentStep === "type") {
      setCurrentStep("destination");
      return;
    }
    if (currentStep === "destination") {
      if (invoiceId) {
        setCurrentStep("items");
        return;
      }
      handleChooseDestination();
      return;
    }
    if (currentStep === "items") {
      setCurrentStep("review");
    }
  }

  function addItemRow() {
    setItems((prev) => [
      ...prev,
      { localId: nextLocalId(), serverId: null, productId: "", quantity: 1, price: 0, notes: "", status: "draft", error: null },
    ]);
  }

  function updateItem(localId, patch) {
    setItems((prev) => prev.map((it) => (it.localId === localId ? { ...it, ...patch } : it)));
  }

  function removeItem(localId) {
    // No delete-invoice-item endpoint has been defined yet, so this only
    // removes the row locally — including already-saved rows.
    setItems((prev) => prev.filter((it) => it.localId !== localId));
  }

  async function confirmItem(localId) {
    const item = items.find((it) => it.localId === localId);
    if (!item || !invoiceId) return;
    if (!item.productId || Number(item.quantity) <= 0) {
      updateItem(localId, { status: "error", error: "اختر منتجاً وأدخل كمية صحيحة" });
      return;
    }
    updateItem(localId, { status: "saving", error: null });
    try {
      const json = await postJson(API_ENDPOINTS.addPurchaseItem(invoiceId), {
          productId: item.productId,
          Quantity: Number(item.quantity),
          CostPerOne: Number(item.price),
          notes: item.notes || undefined,
      });
      const saved = firstRecord(json?.data);
      updateItem(localId, { status: "saved", serverId: saved?._id ?? null, error: null });
    } catch (err) {
      updateItem(localId, { status: "error", error: err.message });
    }
  }

  async function handleActivate() {
    if (!invoiceId || activating) return;
    setActivating(true);
    setActivateError(null);
    try {
      await postJson(API_ENDPOINTS.activatePurchase(invoiceId));
      setActivated(true);
      onCreated?.();
    } catch (err) {
      setActivateError(err.message);
    } finally {
      setActivating(false);
    }
  }

  function handleCancel() {
    if (activated) {
      onClose();
      return;
    }
    const message = invoiceId
      ? "الفاتورة محفوظة كمسودة. هل تريد إغلاق النافذة؟"
      : "هل تريد إلغاء إنشاء هذه الفاتورة؟";
    if (window.confirm(message)) onClose();
  }

  const stepIndex = FLOW_STEPS.indexOf(currentStep);

  const isPrimaryDisabled =
    (currentStep === "destination" && (!destinationId || creatingInvoice)) ||
    (currentStep === "items" && !hasSavedItem);
  const primaryLoading = currentStep === "destination" && creatingInvoice;
  const primaryLabel = currentStep === "destination" && creatingInvoice ? "جاري الإنشاء..." : "التالي";

  return (
    <div className="invoice-modal-overlay" onClick={onClose}>
      <div
        className="invoice-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="invoice-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="invoice-modal__header">
          <h2 id="invoice-modal-title" className="invoice-modal__title">
            <FileText size={22} strokeWidth={1.8} aria-hidden="true" />
            إنشاء فاتورة مشتريات
          </h2>
          <button type="button" className="invoice-modal__close" onClick={onClose} aria-label="إغلاق">
            <X size={20} />
          </button>
        </header>

        {/* Stepper */}
        <div className="stepper">
          {STEPPER_DISPLAY_ORDER.map((key) => {
            const idx = FLOW_STEPS.indexOf(key);
            const state = idx < stepIndex ? "done" : idx === stepIndex ? "current" : "upcoming";
            return (
              <div key={key} className={`stepper__item stepper__item--${state}`}>
                <span className="stepper__circle">
                  {key === "review" ? <CheckCircle2 size={16} /> : idx + 1}
                </span>
                <span className="stepper__label">{STEP_LABELS[key]}</span>
              </div>
            );
          })}
        </div>

        {/* Activate / discard shortcut, available once the draft exists */}
        {invoiceId && !activated && (
          <div className="top-actions">
            <button type="button" className="activate-btn" onClick={handleActivate} disabled={activating}>
              {activating ? <Loader2 size={16} className="spin" aria-hidden="true" /> : <Power size={16} aria-hidden="true" />}
              تفعيل الفاتورة
            </button>
            <button type="button" className="discard-btn" onClick={handleCancel}>
              <Trash2 size={15} aria-hidden="true" />
              إلغاء
            </button>
          </div>
        )}
        {activateError && <p className="invoice-modal__error">{activateError}</p>}

        <div className="invoice-modal__body">
          {activated ? (
            <div className="success-panel">
              <CheckCircle2 size={40} aria-hidden="true" />
              <p>تم تفعيل الفاتورة بنجاح.</p>
              <button type="button" className="primary-btn" onClick={onClose}>
                إغلاق
              </button>
            </div>
          ) : (
            <>
              {currentStep === "type" && (
                <div className="step-panel">
                  <label htmlFor="invoice-type">نوع الفاتورة</label>
                  <div className="select">
                    <select id="invoice-type" value="purchase" disabled>
                      <option value="purchase">مشتريات</option>
                    </select>
                  </div>
                  <p className="step-hint">النوع الوحيد المتاح حالياً هو "مشتريات".</p>
                </div>
              )}

              {currentStep === "destination" && (
                <div className="step-panel">
                  <div className="dest-type-toggle" role="tablist" aria-label="نوع الوجهة">
                    {DESTINATION_TYPES.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        role="tab"
                        aria-selected={destinationType === t.value}
                        className={`dest-type-btn${destinationType === t.value ? " dest-type-btn--active" : ""}`}
                        onClick={() => {
                          setDestinationType(t.value);
                          setDestinationId("");
                        }}
                        disabled={!!invoiceId}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  <label htmlFor="destination-select">مشتري إلى</label>
                  <div className="select">
                    <select
                      id="destination-select"
                      value={destinationId}
                      onChange={(e) => setDestinationId(e.target.value)}
                      disabled={destinationStatus === "loading" || !!invoiceId}
                    >
                      <option value="">اختر...</option>
                      {destinationOptions.map((d) => (
                        <option key={d._id} value={d._id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {destinationStatus === "loading" && (
                    <p className="step-hint">
                      <Loader2 size={14} className="spin" aria-hidden="true" /> جاري تحميل القائمة...
                    </p>
                  )}
                  {createError && <p className="invoice-modal__error">{createError}</p>}
                  {invoiceId && <p className="step-hint">تم إنشاء الفاتورة كمسودة، يمكنك الآن إضافة الأصناف.</p>}
                </div>
              )}

              {currentStep === "items" && (
                <div className="step-panel items-panel">
                  <div className="items-toolbar">
                    <h3>إضافة الأصناف</h3>
                    <div className="search">
                      <input
                        type="search"
                        value={itemSearch}
                        onChange={(e) => setItemSearch(e.target.value)}
                        placeholder="ابحث عن منتج..."
                        aria-label="ابحث عن منتج"
                      />
                      <Search size={16} className="search__icon" aria-hidden="true" />
                    </div>
                  </div>

                  <div className="table-wrap">
                    <table className="items-table">
                      <thead>
                        <tr>
                          {ITEM_COLUMNS.map(({ label, icon: Icon }) => (
                            <th key={label}>
                              <span className="th-label">
                                <Icon size={14} aria-hidden="true" />
                                {label}
                              </span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredItems.length === 0 && (
                          <tr>
                            <td colSpan={ITEM_COLUMNS.length} className="items-table__message">
                              لا توجد أصناف بعد. اضغط "إضافة صنف" للبدء.
                            </td>
                          </tr>
                        )}
                        {filteredItems.map((item) => (
                          <InvoiceItemRow
                            key={item.localId}
                            item={item}
                            products={products}
                            onChange={(patch) => updateItem(item.localId, patch)}
                            onConfirm={() => confirmItem(item.localId)}
                            onRemove={() => removeItem(item.localId)}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <button type="button" className="add-item-btn" onClick={addItemRow}>
                    <Plus size={16} aria-hidden="true" />
                    إضافة صنف
                  </button>

                  {productsStatus === "error" && (
                    <p className="invoice-modal__error">تعذّر تحميل قائمة المنتجات.</p>
                  )}

                  <div className="items-total">
                    <span>إجمالي تكلفة الفاتورة</span>
                    <strong>{formatCurrency(totalCost)}</strong>
                  </div>
                </div>
              )}

              {currentStep === "review" && (
                <div className="step-panel review-panel">
                  <h3>ملخص الفاتورة</h3>
                  <dl className="review-list">
                    <div className="review-row">
                      <dt>نوع الوجهة</dt>
                      <dd>{destinationType === "Sites" ? "موقع" : "مخزن"}</dd>
                    </div>
                    <div className="review-row">
                      <dt>الوجهة</dt>
                      <dd>{selectedDestination?.name ?? "—"}</dd>
                    </div>
                    <div className="review-row">
                      <dt>عدد الأصناف المحفوظة</dt>
                      <dd>{items.filter((it) => it.status === "saved").length}</dd>
                    </div>
                    <div className="review-row">
                      <dt>الإجمالي</dt>
                      <dd>{formatCurrency(totalCost)}</dd>
                    </div>
                  </dl>
                </div>
              )}
            </>
          )}
        </div>

        {!activated && (
          <footer className="invoice-modal__footer">
            <button type="button" className="cancel-btn" onClick={handleCancel}>
              إلغاء
            </button>

            <div className="footer-right">
              {currentStep !== "type" && (
                <button type="button" className="back-btn" onClick={goBack}>
                  <ChevronRight size={16} aria-hidden="true" />
                  السابق
                </button>
              )}

              {currentStep !== "review" ? (
                <button type="button" className="primary-btn" onClick={handlePrimaryNext} disabled={isPrimaryDisabled}>
                  {primaryLoading && <Loader2 size={16} className="spin" aria-hidden="true" />}
                  {primaryLabel}
                  <ChevronLeft size={16} aria-hidden="true" />
                </button>
              ) : (
                <button
                  type="button"
                  className="primary-btn"
                  onClick={handleActivate}
                  disabled={activating || !hasSavedItem}
                >
                  {activating ? <Loader2 size={16} className="spin" aria-hidden="true" /> : <Check size={16} aria-hidden="true" />}
                  إنشاء الفاتورة
                </button>
              )}
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}
