import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Barcode,
  Box,
  Hash,
  History,
  Info,
  Loader2,
  Map,
  MapPin,
  MapPinned,
  Package,
  Ruler,
  Search,
  StickyNote,
  TrendingDown,
  TrendingUp,
  Warehouse,
  Wrench,
  X,
} from "lucide-react";
import useWarehouseDetail from "../../hooks/useWarehouseDetail";
import { getZoneName } from "../../utils/zone";
import ProductLogsModal from "../Logs/ProductLogsModal";
import "./WarehouseModal.css";

const PRODUCT_COLUMNS = [
  { label: "اسم الصنف", icon: Box },
  { label: "وحدة القياس", icon: Ruler },
  { label: "كود الصنف", icon: Barcode },
  { label: "المخزون الحالي", icon: Hash },
  { label: "الحد الأدنى", icon: TrendingDown },
  { label: "الحد الأقصى", icon: TrendingUp },
  { label: "ملاحظات", icon: StickyNote },
  { label: "السجل", icon: History },
];

// The place's products are listed in two tables by `productId.type`:
// tools first, then products. `type` is required on every product, so there is
// no third group; anything that is not "tools" is listed under products, so an
// item can never disappear from the modal.
const GROUPS = [
  { key: "tools", title: "المعدات", icon: Wrench, empty: "لا توجد معدات مطابقة." },
  { key: "product", title: "المنتجات", icon: Package, empty: "لا توجد منتجات مطابقة." },
];

function ItemsTable({ items, emptyText, onOpenLogs }) {
  return (
    <div className="wh-table-wrap">
      <table className="wh-table">
        <thead>
          <tr>
            {PRODUCT_COLUMNS.map(({ label, icon: Icon }) => (
              <th key={label}>
                <span className="wh-th-label">
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
              <td colSpan={PRODUCT_COLUMNS.length} className="wh-table__message">
                {emptyText}
              </td>
            </tr>
          )}

          {items.map((item) => (
            <tr key={item._id}>
              <td className="wh-col-product">{item.productId?.name ?? "—"}</td>
              <td>{item.productId?.measurementUnit || "—"}</td>
              <td>{item.productId?.code ?? "—"}</td>
              <td>{item.stock ?? "—"}</td>
              <td>{item.minStock ?? "—"}</td>
              <td>{item.maxStock ?? "—"}</td>
              <td>{item.notes?.trim() || "—"}</td>
              <td>
                {item.productId?._id ? (
                  <button
                    type="button"
                    className="wh-log-btn"
                    onClick={() => onOpenLogs({ productId: item.productId._id, productName: item.productId.name })}
                    aria-label={`عرض سجل ${item.productId.name ?? "الصنف"} في هذا الموقع`}
                  >
                    <History size={14} aria-hidden="true" />
                    عرض السجل
                  </button>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function WarehouseModal({ warehouseId, onClose }) {
  const { status, warehouse, error, reload } = useWarehouseDetail(warehouseId);
  const [productSearch, setProductSearch] = useState("");
  // { productId, productName } of the row whose logs are open
  const [logTarget, setLogTarget] = useState(null);
  const closeLogs = useCallback(() => setLogTarget(null), []);

  useEffect(() => {
    // Esc closes only the top-most modal: while the logs modal is open, leave this one be.
    const onKeyDown = (e) => e.key === "Escape" && !logTarget && onClose();
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, logTarget]);

  const zoneName = getZoneName(warehouse?.zone);

  // search filters both lists, then each item goes to the table of its product's type
  const groups = useMemo(() => {
    const list = Array.isArray(warehouse?.inSiteProducts) ? warehouse.inSiteProducts : [];
    const q = productSearch.trim().toLowerCase();
    const matches = q
      ? list.filter((item) => {
          const name = String(item.productId?.name ?? "").toLowerCase();
          const code = String(item.productId?.code ?? "");
          return name.includes(q) || code.includes(q);
        })
      : list;

    const buckets = { tools: [], product: [] };
    for (const item of matches) {
      buckets[item.productId?.type === "tools" ? "tools" : "product"].push(item);
    }
    return GROUPS.map((g) => ({ ...g, items: buckets[g.key] }));
  }, [warehouse, productSearch]);

  return (
    <>
    <div className="wh-modal-overlay" onClick={onClose}>
      <div
        className="wh-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="warehouse-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="wh-modal__header">
          <h2 id="warehouse-modal-title" className="wh-modal__title">
            <Warehouse size={22} strokeWidth={1.8} aria-hidden="true" />
            تفاصيل الموقع
          </h2>
          <button type="button" className="wh-modal__close" onClick={onClose} aria-label="إغلاق">
            <X size={20} />
          </button>
        </header>

        <div className="wh-modal__body">
          {status === "loading" && (
            <p className="wh-state">
              <Loader2 size={18} className="wh-spin" aria-hidden="true" />
              جاري تحميل بيانات الموقع...
            </p>
          )}

          {status === "error" && (
            <p className="wh-state wh-state--error">
              {error?.message || "تعذّر تحميل بيانات الموقع."}
              <button type="button" className="wh-retry-btn" onClick={reload}>
                إعادة المحاولة
              </button>
            </p>
          )}

          {status === "success" && warehouse && (
            <>
              <div className="wh-top-grid">
                {/* Site card */}
                <div className="wh-site-card">
                  <span className="wh-site-card__icon" aria-hidden="true">
                    <MapPin size={26} strokeWidth={1.8} />
                  </span>

                  <div className="wh-site-card__name-row">
                    <h3 className="wh-site-card__name">{warehouse.name}</h3>
                    <span className={`wh-badge ${warehouse.active ? "wh-badge--active" : "wh-badge--inactive"}`}>
                      {warehouse.active ? "نشط" : "غير نشط"}
                    </span>
                  </div>

                  <p className="wh-site-card__meta">
                    <MapPinned size={15} aria-hidden="true" />
                    المنطقة: {zoneName}
                  </p>
                  <p className="wh-site-card__meta">
                    <Map size={15} aria-hidden="true" />
                    العنوان: {warehouse.address?.trim() || "—"}
                  </p>
                </div>

                {/* Info panel */}
                <div className="wh-info-panel">
                  <div className="wh-info-panel__header">
                    <Info size={16} aria-hidden="true" />
                    معلومات الموقع
                  </div>

                  <dl className="wh-info-list">
                    <div className="wh-info-row">
                      <dt>اسم الموقع</dt>
                      <dd>{warehouse.name}</dd>
                    </div>
                    <div className="wh-info-row">
                      <dt>المنطقة</dt>
                      <dd>{zoneName}</dd>
                    </div>
                    <div className="wh-info-row">
                      <dt>الحالة</dt>
                      <dd>
                        <span className={`wh-badge ${warehouse.active ? "wh-badge--active" : "wh-badge--inactive"}`}>
                          {warehouse.active ? "نشط" : "غير نشط"}
                        </span>
                      </dd>
                    </div>
                    <div className="wh-info-row">
                      <dt>العنوان</dt>
                      <dd>{warehouse.address?.trim() || "—"}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Products at this site */}
              <section className="wh-products">
                <div className="wh-products__header">
                  <h3>
                    <Box size={16} aria-hidden="true" />
                    الأصناف داخل الموقع
                  </h3>
                  <div className="wh-products__search">
                    <input
                      type="search"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="ابحث عن صنف..."
                      aria-label="ابحث عن صنف داخل الموقع"
                    />
                    <Search size={16} className="wh-products__search-icon" aria-hidden="true" />
                  </div>
                </div>

                {groups.map(({ key, title, icon: GroupIcon, empty, items }) => (
                  <div key={key} className={`wh-group wh-group--${key}`}>
                    <div className="wh-group__header">
                      <h4>
                        <GroupIcon size={16} aria-hidden="true" />
                        {title}
                      </h4>
                      <span className="wh-group__count">{items.length}</span>
                    </div>
                    <ItemsTable items={items} emptyText={empty} onOpenLogs={setLogTarget} />
                  </div>
                ))}
              </section>
            </>
          )}
        </div>

        <footer className="wh-modal__footer">
          <button type="button" className="wh-modal__btn" onClick={onClose}>
            إغلاق
          </button>
        </footer>
      </div>
    </div>

    {/* Sibling of the overlay above: a click inside it must not bubble into its "click outside = close". */}
    {logTarget && (
      <ProductLogsModal
        key={logTarget.productId}
        productId={logTarget.productId}
        productName={logTarget.productName}
        placeId={warehouseId}
        placeName={warehouse?.name}
        onClose={closeLogs}
      />
    )}
    </>
  );
}
