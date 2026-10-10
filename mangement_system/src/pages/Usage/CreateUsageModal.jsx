import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
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
import useDestinationProducts from "../../hooks/useDestinationProducts";
import useSites from "../../hooks/useSites";
import useWarehouses from "../../hooks/useWarehouses";
import { firstRecord, postJson } from "../../utils/postJson";
import UsageItemRow from "./UsageItemRow";
import "./CreateUsageModal.css";

// Functional order — drives navigation / validation.
const FLOW_STEPS = ["destination", "items", "review"];
const STEP_LABELS = {
  destination: "اختيار الموقع / المخزن",
  items: "إضافة الأصناف",
  review: "التحقق من البيانات",
};

const DESTINATION_TYPES = [
  { value: "Inventories", label: "مخزن" },
  { value: "Sites", label: "موقع" },
];

const ITEM_COLUMNS = [
  { label: "المنتج", icon: Box },
  { label: "الوحدة", icon: Ruler },
  { label: "الكمية", icon: Hash },
  { label: "إجراءات", icon: Settings },
];

// ⚠️ UNVERIFIED request bodies — field names were not specified, so these
// mirror POST /purchase and POST /transaction/:id. If the server rejects a
// request, the real field names are the first thing to check, and these two
// functions are the only place to change.
const buildCreateBody = (type, id) => ({ usedFromType: type, usedFromId: id });
const buildItemBody = (item) => ({ productId: item.productId, Quantity: Number(item.quantity) });

let localIdCounter = 0;
const nextLocalId = () => `usage-local-${++localIdCounter}`;

export default function CreateUsageModal({ onClose, onCreated }) {
  const [currentStep, setCurrentStep] = useState("destination");

  // Step 1: destination (type, then the site/inventory itself)
  const [destinationType, setDestinationType] = useState("Inventories");
  const [destinationId, setDestinationId] = useState("");
  const { warehouses, status: warehousesStatus } = useWarehouses();
  const { sites, status: sitesStatus } = useSites();
  const destinationOptions = destinationType === "Sites" ? sites : warehouses;
  const destinationStatus = destinationType === "Sites" ? sitesStatus : warehousesStatus;
  const selectedDestination = destinationOptions.find((d) => d._id === destinationId) ?? null;

  const [usageId, setUsageId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  // Step 2: items
  // Only the products that exist in the chosen site / inventory.
  const { products, status: productsStatus } = useDestinationProducts(destinationType, destinationId);
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

  const savedItems = useMemo(() => items.filter((it) => it.status === "saved"), [items]);
  const hasSavedItem = savedItems.length > 0;
  const totalQuantity = useMemo(
    () => savedItems.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0),
    [savedItems],
  );

  const filteredItems = useMemo(() => {
    const q = itemSearch.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => {
      const product = products.find((p) => p._id === it.productId);
      return String(product?.name ?? "").toLowerCase().includes(q);
    });
  }, [items, itemSearch, products]);

  function goBack() {
    const idx = FLOW_STEPS.indexOf(currentStep);
    if (idx > 0) setCurrentStep(FLOW_STEPS[idx - 1]);
  }

  // POST /usage  { type, id }  -> draft usage
  async function handleCreateDraft() {
    if (!destinationId || creating) return;
    setCreating(true);
    setCreateError(null);
    try {
      const json = await postJson(API_ENDPOINTS.createUsage, buildCreateBody(destinationType, destinationId));
      const record = firstRecord(json?.data ?? json);
      const id = record?._id ?? record?.id;
      if (!id) throw new Error("لم يتم استلام رقم العملية من الخادم.");
      setUsageId(id);
      onCreated?.();
      setCurrentStep("items");
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  }

  function handlePrimaryNext() {
    if (currentStep === "destination") {
      if (usageId) setCurrentStep("items");
      else handleCreateDraft();
      return;
    }
    if (currentStep === "items") setCurrentStep("review");
  }

  // Stock left for this row's product: the place's stock minus what other
  // SAVED rows of the same product already take. null = stock unknown.
  function getAvailable(item) {
    const product = products.find((p) => p._id === item.productId);
    if (!product || typeof product.stock !== "number") return null;
    const takenElsewhere = items
      .filter((it) => it.localId !== item.localId && it.productId === item.productId && it.status === "saved")
      .reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
    return Math.max(0, product.stock - takenElsewhere);
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
    // No delete-item endpoint is defined yet, so this only removes the row
    // locally — including rows that were already saved on the server.
    setItems((prev) => prev.filter((it) => it.localId !== localId));
  }

  // POST /usage/:id  { productId, Quantity }
  async function confirmItem(localId) {
    const item = items.find((it) => it.localId === localId);
    if (!item || !usageId) return;
    if (!item.productId || Number(item.quantity) <= 0) {
      updateItem(localId, { status: "error", error: "اختر منتجاً وأدخل كمية صحيحة" });
      return;
    }
    const available = getAvailable(item);
    if (available !== null && Number(item.quantity) > available) {
      updateItem(localId, {
        status: "error",
        error: `الكمية (${Number(item.quantity)}) أكبر من المتوفر (${available})`,
      });
      return;
    }
    updateItem(localId, { status: "saving", error: null });
    try {
      const json = await postJson(API_ENDPOINTS.addUsageItem(usageId), buildItemBody(item));
      const saved = firstRecord(json?.data);
      updateItem(localId, { status: "saved", serverId: saved?._id ?? null, error: null });
    } catch (err) {
      updateItem(localId, { status: "error", error: err.message });
    }
  }

  // POST /usage/:id/activate
  async function handleActivate() {
    if (!usageId || activating) return;
    setActivating(true);
    setActivateError(null);
    try {
      await postJson(API_ENDPOINTS.activateUsage(usageId));
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
    const message = usageId
      ? "عملية الاستخدام محفوظة كمسودة. هل تريد إغلاق النافذة؟"
      : "هل تريد إلغاء إنشاء عملية الاستخدام؟";
    if (window.confirm(message)) onClose();
  }

  const stepIndex = FLOW_STEPS.indexOf(currentStep);
  const isPrimaryDisabled =
    (currentStep === "destination" && (!destinationId || creating)) || (currentStep === "items" && !hasSavedItem);
  const primaryLoading = currentStep === "destination" && creating;
  const primaryLabel = primaryLoading ? "جاري الإنشاء..." : "التالي";

  return (
    <div className="usage-wizard-overlay" onClick={onClose}>
      <div
        className="usage-wizard"
        role="dialog"
        aria-modal="true"
        aria-labelledby="usage-wizard-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="usage-wizard__header">
          <h2 id="usage-wizard-title" className="usage-wizard__title">
            <ClipboardList size={22} strokeWidth={1.8} aria-hidden="true" />
            إنشاء عملية استخدام
          </h2>
          <button type="button" className="usage-wizard__close" onClick={onClose} aria-label="إغلاق">
            <X size={20} />
          </button>
        </header>

        {/* Stepper — natural order, first step renders on the right in RTL */}
        <div className="uw-stepper">
          {FLOW_STEPS.map((key, idx) => {
            const state = idx < stepIndex ? "done" : idx === stepIndex ? "current" : "upcoming";
            return (
              <div key={key} className={`uw-stepper__item uw-stepper__item--${state}`}>
                <span className="uw-stepper__circle">
                  {state === "done" ? <Check size={16} /> : idx + 1}
                </span>
                <span className="uw-stepper__label">{STEP_LABELS[key]}</span>
              </div>
            );
          })}
        </div>

        {/* Activate / discard shortcut, available once the draft exists */}
        {usageId && !activated && (
          <div className="uw-top-actions">
            <button type="button" className="uw-activate-btn" onClick={handleActivate} disabled={activating || !hasSavedItem}>
              {activating ? <Loader2 size={16} className="uw-spin" aria-hidden="true" /> : <Power size={16} aria-hidden="true" />}
              تفعيل العملية
            </button>
            <button type="button" className="uw-discard-btn" onClick={handleCancel}>
              <Trash2 size={15} aria-hidden="true" />
              إلغاء
            </button>
          </div>
        )}
        {activateError && <p className="uw-error uw-error--banner">{activateError}</p>}

        <div className="usage-wizard__body">
          {activated ? (
            <div className="uw-success">
              <CheckCircle2 size={40} aria-hidden="true" />
              <p>تم تفعيل عملية الاستخدام بنجاح.</p>
              <button type="button" className="uw-primary-btn" onClick={onClose}>
                إغلاق
              </button>
            </div>
          ) : (
            <>
              {currentStep === "destination" && (
                <div className="uw-panel">
                  <div className="uw-type-toggle" role="tablist" aria-label="نوع المكان">
                    {DESTINATION_TYPES.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        role="tab"
                        aria-selected={destinationType === t.value}
                        className={`uw-type-btn${destinationType === t.value ? " uw-type-btn--active" : ""}`}
                        onClick={() => {
                          setDestinationType(t.value);
                          setDestinationId("");
                        }}
                        disabled={!!usageId}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  <label htmlFor="usage-destination-select">
                    {destinationType === "Sites" ? "اختر الموقع" : "اختر المخزن"}
                  </label>
                  <select
                    id="usage-destination-select"
                    className="uw-select"
                    value={destinationId}
                    onChange={(e) => setDestinationId(e.target.value)}
                    disabled={destinationStatus === "loading" || !!usageId}
                  >
                    <option value="">اختر...</option>
                    {destinationOptions.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.name}
                      </option>
                    ))}
                  </select>

                  {destinationStatus === "loading" && (
                    <p className="uw-hint">
                      <Loader2 size={14} className="uw-spin" aria-hidden="true" /> جاري تحميل القائمة...
                    </p>
                  )}
                  {createError && <p className="uw-error">{createError}</p>}
                  {usageId && <p className="uw-hint">تم إنشاء العملية كمسودة، يمكنك الآن إضافة الأصناف.</p>}
                </div>
              )}

              {currentStep === "items" && (
                <div className="uw-panel uw-panel--wide">
                  <div className="uw-toolbar">
                    <h3>إضافة الأصناف</h3>
                    <div className="uw-search">
                      <input
                        type="search"
                        value={itemSearch}
                        onChange={(e) => setItemSearch(e.target.value)}
                        placeholder="ابحث عن منتج..."
                        aria-label="ابحث عن منتج"
                      />
                      <Search size={16} className="uw-search__icon" aria-hidden="true" />
                    </div>
                  </div>

                  <div className="uw-table-wrap">
                    <table className="uw-table">
                      <thead>
                        <tr>
                          {ITEM_COLUMNS.map(({ label, icon: Icon }) => (
                            <th key={label}>
                              <span className="uw-th-label">
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
                            <td colSpan={ITEM_COLUMNS.length} className="uw-table__message">
                              لا توجد أصناف بعد. اضغط "إضافة صنف" للبدء.
                            </td>
                          </tr>
                        )}
                        {filteredItems.map((item) => (
                          <UsageItemRow
                            key={item.localId}
                            item={item}
                            products={products}
                            available={getAvailable(item)}
                            onChange={(patch) => updateItem(item.localId, patch)}
                            onConfirm={() => confirmItem(item.localId)}
                            onRemove={() => removeItem(item.localId)}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <button type="button" className="uw-add-btn" onClick={addItemRow}>
                    <Plus size={16} aria-hidden="true" />
                    إضافة صنف
                  </button>

                  {productsStatus === "error" && <p className="uw-error">تعذّر تحميل قائمة المنتجات.</p>}
                  {productsStatus === "success" && products.length === 0 && (
                    <p className="uw-error">لا توجد منتجات في المكان المحدد.</p>
                  )}

                  <div className="uw-total">
                    <span>إجمالي الكميات المحفوظة</span>
                    <strong>{totalQuantity}</strong>
                  </div>
                </div>
              )}

              {currentStep === "review" && (
                <div className="uw-panel uw-panel--review">
                  <h3>ملخص العملية</h3>
                  <dl className="uw-review-list">
                    <div className="uw-review-row">
                      <dt>النوع</dt>
                      <dd>{destinationType === "Sites" ? "موقع" : "مخزن"}</dd>
                    </div>
                    <div className="uw-review-row">
                      <dt>الموقع / المخزن</dt>
                      <dd>{selectedDestination?.name ?? "—"}</dd>
                    </div>
                    <div className="uw-review-row">
                      <dt>عدد الأصناف المحفوظة</dt>
                      <dd>{savedItems.length}</dd>
                    </div>
                    <div className="uw-review-row">
                      <dt>إجمالي الكميات</dt>
                      <dd>{totalQuantity}</dd>
                    </div>
                  </dl>

                  <ul className="uw-review-items">
                    {savedItems.map((it) => {
                      const p = products.find((x) => x._id === it.productId);
                      return (
                        <li key={it.localId}>
                          <span>{p?.name ?? "—"}</span>
                          <strong>
                            {Number(it.quantity)} {p?.measurementUnit ?? ""}
                          </strong>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        {!activated && (
          <footer className="usage-wizard__footer">
            <button type="button" className="uw-cancel-btn" onClick={handleCancel}>
              إلغاء
            </button>

            <div className="uw-footer-right">
              {currentStep !== "destination" && (
                <button type="button" className="uw-back-btn" onClick={goBack}>
                  <ChevronRight size={16} aria-hidden="true" />
                  السابق
                </button>
              )}

              {currentStep !== "review" ? (
                <button type="button" className="uw-primary-btn" onClick={handlePrimaryNext} disabled={isPrimaryDisabled}>
                  {primaryLoading && <Loader2 size={16} className="uw-spin" aria-hidden="true" />}
                  {primaryLabel}
                  <ChevronLeft size={16} aria-hidden="true" />
                </button>
              ) : (
                <button type="button" className="uw-primary-btn" onClick={handleActivate} disabled={activating || !hasSavedItem}>
                  {activating ? <Loader2 size={16} className="uw-spin" aria-hidden="true" /> : <Check size={16} aria-hidden="true" />}
                  تفعيل العملية
                </button>
              )}
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}
