import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeftRight,
  Box,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Hash,
  Loader2,
  Plus,
  Power,
  Ruler,
  Search,
  Settings,
  Trash2,
  X,
} from "lucide-react";
import { API_ENDPOINTS } from "../../config/api";
import useProducts from "../../hooks/useProducts";
import useSites from "../../hooks/useSites";
import useWarehouses from "../../hooks/useWarehouses";
import TransactionItemRow from "./TransactionItemRow";
import "./CreateTransactionModal.css";

// Functional order — drives navigation / validation.
const FLOW_STEPS = ["from", "to", "items", "review"];
const STEP_LABELS = {
  from: "اختيار المصدر",
  to: "اختيار الوجهة",
  items: "إضافة الأصناف",
  review: "التحقق من البيانات",
};
// Visual order only, matching the create-invoice modal's reference design.
const STEPPER_DISPLAY_ORDER = ["review", "from", "to", "items"];

// Matches the model enum: { type: String, enum: ["Sites", "Inventories"] }
const ENTITY_TYPES = [
  { value: "Inventories", label: "مخزن" },
  { value: "Sites", label: "موقع" },
];

const ITEM_COLUMNS = [
  { label: "المنتج", icon: Box },
  { label: "الوحدة", icon: Ruler },
  { label: "الكمية", icon: Hash },
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
// array instead of a bare object — this always returns the first record either way.
function firstRecord(data) {
  return Array.isArray(data) ? data[0] : data;
}

export default function CreateTransactionModal({ onClose, onCreated }) {
  const [currentStep, setCurrentStep] = useState("from");

  const { warehouses, status: warehousesStatus } = useWarehouses();
  const { sites, status: sitesStatus } = useSites();

  // Step: From
  const [fromType, setFromType] = useState("Inventories");
  const [fromId, setFromId] = useState("");
  const fromOptions = fromType === "Sites" ? sites : warehouses;
  const fromStatus = fromType === "Sites" ? sitesStatus : warehousesStatus;

  // Step: To
  const [toType, setToType] = useState("Inventories");
  const [toId, setToId] = useState("");
  const toOptions = toType === "Sites" ? sites : warehouses;
  const toStatus = toType === "Sites" ? sitesStatus : warehousesStatus;

  const sameEntity = fromType === toType && fromId && toId && fromId === toId;

  const [transactionId, setTransactionId] = useState(null);
  const [creating, setCreating] = useState(false);
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

  async function handleCreateTransaction() {
    if (!fromId || !toId || sameEntity || creating) return;
    setCreating(true);
    setCreateError(null);
    try {
      const json = await postJson(API_ENDPOINTS.createTransaction, {
        ToType: toType,
        FromType: fromType,
        TransactedToId: toId,
        TransactedFromId: fromId,
      });
      const created = firstRecord(json?.data);
      const id = created?._id ?? created?.id;
      if (!id) throw new Error("لم يتم استلام رقم التحويل من الخادم.");
      setTransactionId(id);
      onCreated?.();
      setCurrentStep("items");
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  }

  function handlePrimaryNext() {
    if (currentStep === "from") {
      setCurrentStep("to");
      return;
    }
    if (currentStep === "to") {
      if (transactionId) {
        setCurrentStep("items");
        return;
      }
      handleCreateTransaction();
      return;
    }
    if (currentStep === "items") {
      setCurrentStep("review");
    }
  }

  function addItemRow() {
    setItems((prev) => [
      ...prev,
      { localId: nextLocalId(), serverId: null, productId: "", quantity: 1, status: "draft", error: null },
    ]);
  }

  function updateItem(localId, patch) {
    setItems((prev) => prev.map((it) => (it.localId === localId ? { ...it, ...patch } : it)));
  }

  function removeItem(localId) {
    // No delete-transaction-item endpoint has been defined yet, so this
    // only removes the row locally — including already-saved rows.
    setItems((prev) => prev.filter((it) => it.localId !== localId));
  }

  async function confirmItem(localId) {
    const item = items.find((it) => it.localId === localId);
    if (!item || !transactionId) return;
    if (!item.productId || Number(item.quantity) <= 0) {
      updateItem(localId, { status: "error", error: "اختر منتجاً وأدخل كمية صحيحة" });
      return;
    }
    updateItem(localId, { status: "saving", error: null });
    try {
      const json = await postJson(API_ENDPOINTS.addTransactionItem(transactionId), {
        productId: item.productId,
        Quantity: Number(item.quantity),
      });
      const saved = firstRecord(json?.data);
      updateItem(localId, { status: "saved", serverId: saved?._id ?? null, error: null });
    } catch (err) {
      updateItem(localId, { status: "error", error: err.message });
    }
  }

  async function handleActivate() {
    if (!transactionId || activating) return;
    setActivating(true);
    setActivateError(null);
    try {
      await postJson(API_ENDPOINTS.activateTransaction(transactionId));
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
    const message = transactionId
      ? "التحويل محفوظ كمسودة. هل تريد إغلاق النافذة؟"
      : "هل تريد إلغاء إنشاء هذا التحويل؟";
    if (window.confirm(message)) onClose();
  }

  const stepIndex = FLOW_STEPS.indexOf(currentStep);

  const isPrimaryDisabled =
    (currentStep === "from" && !fromId) ||
    (currentStep === "to" && (!toId || sameEntity || creating)) ||
    (currentStep === "items" && !hasSavedItem);
  const primaryLoading = currentStep === "to" && creating;
  const primaryLabel = currentStep === "to" && creating ? "جاري الإنشاء..." : "التالي";

  return (
    <div className="transaction-wizard-overlay" onClick={onClose}>
      <div
        className="transaction-wizard"
        role="dialog"
        aria-modal="true"
        aria-labelledby="transaction-wizard-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="transaction-wizard__header">
          <h2 id="transaction-wizard-title" className="transaction-wizard__title">
            <ArrowLeftRight size={22} strokeWidth={1.8} aria-hidden="true" />
            إنشاء تحويل
          </h2>
          <button type="button" className="transaction-wizard__close" onClick={onClose} aria-label="إغلاق">
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
        {transactionId && !activated && (
          <div className="top-actions">
            <button type="button" className="activate-btn" onClick={handleActivate} disabled={activating}>
              {activating ? <Loader2 size={16} className="spin" aria-hidden="true" /> : <Power size={16} aria-hidden="true" />}
              تفعيل التحويل
            </button>
            <button type="button" className="discard-btn" onClick={handleCancel}>
              <Trash2 size={15} aria-hidden="true" />
              إلغاء
            </button>
          </div>
        )}
        {activateError && <p className="transaction-wizard__error">{activateError}</p>}

        <div className="transaction-wizard__body">
          {activated ? (
            <div className="success-panel">
              <CheckCircle2 size={40} aria-hidden="true" />
              <p>تم تفعيل التحويل بنجاح.</p>
              <button type="button" className="primary-btn" onClick={onClose}>
                إغلاق
              </button>
            </div>
          ) : (
            <>
              {(currentStep === "from" || currentStep === "to") && (
                <div className="step-panel">
                  <div className="dest-type-toggle" role="tablist" aria-label={currentStep === "from" ? "نوع المصدر" : "نوع الوجهة"}>
                    {ENTITY_TYPES.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        role="tab"
                        aria-selected={(currentStep === "from" ? fromType : toType) === t.value}
                        className={`dest-type-btn${(currentStep === "from" ? fromType : toType) === t.value ? " dest-type-btn--active" : ""}`}
                        onClick={() => {
                          if (currentStep === "from") {
                            setFromType(t.value);
                            setFromId("");
                          } else {
                            setToType(t.value);
                            setToId("");
                          }
                        }}
                        disabled={!!transactionId}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  <label htmlFor="entity-select">{currentStep === "from" ? "من" : "إلى"}</label>
                  <div className="select">
                    <select
                      id="entity-select"
                      value={currentStep === "from" ? fromId : toId}
                      onChange={(e) => (currentStep === "from" ? setFromId(e.target.value) : setToId(e.target.value))}
                      disabled={(currentStep === "from" ? fromStatus : toStatus) === "loading" || !!transactionId}
                    >
                      <option value="">اختر...</option>
                      {(currentStep === "from" ? fromOptions : toOptions).map((d) => (
                        <option key={d._id} value={d._id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {(currentStep === "from" ? fromStatus : toStatus) === "loading" && (
                    <p className="step-hint">
                      <Loader2 size={14} className="spin" aria-hidden="true" /> جاري تحميل القائمة...
                    </p>
                  )}
                  {currentStep === "to" && sameEntity && (
                    <p className="transaction-wizard__error">لا يمكن أن يكون المصدر والوجهة نفس الموقع.</p>
                  )}
                  {createError && <p className="transaction-wizard__error">{createError}</p>}
                  {transactionId && <p className="step-hint">تم إنشاء التحويل كمسودة، يمكنك الآن إضافة الأصناف.</p>}
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
                          <TransactionItemRow
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
                    <p className="transaction-wizard__error">تعذّر تحميل قائمة المنتجات.</p>
                  )}
                </div>
              )}

              {currentStep === "review" && (
                <div className="step-panel review-panel">
                  <h3>ملخص التحويل</h3>
                  <dl className="review-list">
                    <div className="review-row">
                      <dt>من</dt>
                      <dd>{fromOptions.find((d) => d._id === fromId)?.name ?? "—"}</dd>
                    </div>
                    <div className="review-row">
                      <dt>إلى</dt>
                      <dd>{toOptions.find((d) => d._id === toId)?.name ?? "—"}</dd>
                    </div>
                    <div className="review-row">
                      <dt>عدد الأصناف المحفوظة</dt>
                      <dd>{items.filter((it) => it.status === "saved").length}</dd>
                    </div>
                  </dl>
                </div>
              )}
            </>
          )}
        </div>

        {!activated && (
          <footer className="transaction-wizard__footer">
            <button type="button" className="cancel-btn" onClick={handleCancel}>
              إلغاء
            </button>

            <div className="footer-right">
              {currentStep !== "from" && (
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
                  إنشاء التحويل
                </button>
              )}
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}
