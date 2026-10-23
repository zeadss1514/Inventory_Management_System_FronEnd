import { useEffect, useMemo, useState } from "react";
import {
  Barcode,
  Box,
  ClipboardList,
  FileText,
  Hash,
  Info,
  Layers,
  Loader2,
  MapPin,
  MapPinned,
  Ruler,
  Search,
  StickyNote,
  Tag,
  TrendingDown,
  TrendingUp,
  Warehouse,
  X,
} from "lucide-react";
import useProductDetail from "../../hooks/useProductDetail";
import { getEntityTypeLabel } from "../../utils/entityType";
import { getProductTypeLabel } from "../../utils/productType";
import "./ProductModal.css";

const LOCATION_COLUMNS = [
  { label: "المكان", icon: MapPinned },
  { label: "النوع", icon: Warehouse },
  { label: "المخزون الحالي", icon: Hash },
  { label: "إجمالي الاستخدام", icon: ClipboardList }, // entry.TotalUsage
  { label: "إجمالي الكمية", icon: Layers }, // entry.TotalQuantity
  { label: "الحد الأدنى", icon: TrendingDown },
  { label: "الحد الأقصى", icon: TrendingUp },
  { label: "ملاحظات", icon: StickyNote },
];

const TYPE_TABS = [
  { value: "all", label: "الكل" },
  { value: "Inventories", label: "المخازن" },
  { value: "Sites", label: "المواقع" },
];

// `productId` inside a stock entry is a plain id here, but may be a populated object elsewhere.
const entryProductId = (entry) => (typeof entry?.productId === "string" ? entry.productId : entry?.productId?._id);

// One row per stock entry of THIS product in each place.
function buildRows(productId, places, type) {
  return (places ?? []).flatMap((place) => {
    const list = Array.isArray(place.inSiteProducts) ? place.inSiteProducts : [];
    const mine = list.filter((entry) => entryProductId(entry) === productId);
    // The server already narrows the list to this product; if the ids can't be
    // compared (unexpected shape) fall back to every entry instead of showing nothing.
    const entries = mine.length ? mine : list;
    return entries.map((entry, i) => ({
      key: `${type}-${place._id}-${entry._id ?? i}`,
      name: place.name ?? "—",
      type,
      stock: Number(entry.stock) || 0,
      totalUsage: entry.TotalUsage, // shown as "—" when the entry doesn't have it yet
      totalQuantity: entry.TotalQuantity,
      minStock: entry.minStock,
      maxStock: entry.maxStock,
      notes: entry.notes?.trim() || "—",
    }));
  });
}

export default function ProductModal({ product: listProduct, onClose }) {
  // The list row only gives us the id; everything shown comes from GET /product/<id>.
  const { status, product, sites, inventories, error, reload } = useProductDetail(listProduct?._id);

  const [typeFilter, setTypeFilter] = useState("all");
  const [placeSearch, setPlaceSearch] = useState("");

  useEffect(() => {
    const onKeyDown = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  // inventories first, then sites
  const rows = useMemo(
    () => [...buildRows(product?._id, inventories, "Inventories"), ...buildRows(product?._id, sites, "Sites")],
    [product, inventories, sites],
  );

  const totals = useMemo(() => {
    const sum = (type) => rows.filter((r) => r.type === type).reduce((acc, r) => acc + r.stock, 0);
    const inInventories = sum("Inventories");
    const inSites = sum("Sites");
    return { inInventories, inSites, all: inInventories + inSites, places: rows.length };
  }, [rows]);

  const visibleRows = useMemo(() => {
    const q = placeSearch.trim().toLowerCase();
    return rows.filter((r) => {
      if (typeFilter !== "all" && r.type !== typeFilter) return false;
      return !q || r.name.toLowerCase().includes(q);
    });
  }, [rows, typeFilter, placeSearch]);

  const unit = product?.measurementUnit || "";
  const withUnit = (n) => (unit ? `${n} ${unit}` : String(n));

  return (
    <div className="prod-modal-overlay" onClick={onClose}>
      <div
        className="prod-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="prod-modal__header">
          <h2 id="product-modal-title" className="prod-modal__title">
            <Box size={22} strokeWidth={1.8} aria-hidden="true" />
            تفاصيل الصنف
          </h2>
          <button type="button" className="prod-modal__close" onClick={onClose} aria-label="إغلاق">
            <X size={20} />
          </button>
        </header>

        <div className="prod-modal__body">
          {status === "loading" && (
            <p className="pd-state">
              <Loader2 size={18} className="pd-spin" aria-hidden="true" />
              جاري تحميل بيانات الصنف...
            </p>
          )}

          {status === "error" && (
            <p className="pd-state pd-state--error">
              {error?.message || "تعذّر تحميل بيانات الصنف."}
              <button type="button" className="pd-retry-btn" onClick={reload}>
                إعادة المحاولة
              </button>
            </p>
          )}

          {status === "success" && !product && <p className="pd-state">لم يتم العثور على بيانات هذا الصنف.</p>}

          {status === "success" && product && (
            <>
              {/* Product card + info */}
              <div className="pd-top-grid">
                <div className="pd-card">
                  <span className="pd-card__icon" aria-hidden="true">
                    <Box size={26} strokeWidth={1.8} />
                  </span>
                  <div className="pd-card__name-row">
                    <h3 className="pd-card__name">{product.name}</h3>
                    <span className={`pd-badge ${product.active ? "pd-badge--active" : "pd-badge--inactive"}`}>
                      {product.active ? "نشط" : "غير نشط"}
                    </span>
                    {product.freezed && <span className="pd-badge pd-badge--frozen">مجمّد</span>}
                  </div>
                  <p className="pd-card__meta">
                    <Tag size={15} aria-hidden="true" />
                    النوع: {getProductTypeLabel(product.type)}
                  </p>
                  <p className="pd-card__meta">
                    <Barcode size={15} aria-hidden="true" />
                    الكود: {product.code ?? "—"}
                  </p>
                  <p className="pd-card__meta">
                    <Ruler size={15} aria-hidden="true" />
                    وحدة القياس: {product.measurementUnit || "—"}
                  </p>
                </div>

                <div className="pd-info">
                  <div className="pd-info__header">
                    <Info size={16} aria-hidden="true" />
                    معلومات الصنف
                  </div>
                  <dl className="pd-info__list">
                    <div className="pd-info__row">
                      <dt>اسم الصنف</dt>
                      <dd>{product.name}</dd>
                    </div>
                    <div className="pd-info__row">
                      <dt>نوع الصنف</dt>
                      <dd>
                        {product.type ? (
                          <span className={`pd-ptype pd-ptype--${product.type}`}>{getProductTypeLabel(product.type)}</span>
                        ) : (
                          "—"
                        )}
                      </dd>
                    </div>
                    <div className="pd-info__row">
                      <dt>الكود</dt>
                      <dd>{product.code ?? "—"}</dd>
                    </div>
                    <div className="pd-info__row">
                      <dt>وحدة القياس</dt>
                      <dd>{product.measurementUnit || "—"}</dd>
                    </div>
                    <div className="pd-info__row">
                      <dt>الحالة</dt>
                      <dd>
                        <span className={`pd-badge ${product.active ? "pd-badge--active" : "pd-badge--inactive"}`}>
                          {product.active ? "نشط" : "غير نشط"}
                        </span>
                        {product.freezed && <span className="pd-badge pd-badge--frozen">مجمّد</span>}
                      </dd>
                    </div>
                    <div className="pd-info__row">
                      <dt>الوصف</dt>
                      <dd className="pd-info__desc">{product.description?.trim() || "—"}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Quantities */}
              <div className="pd-stats">
                <div className="pd-stat pd-stat--main">
                  <span className="pd-stat__icon" aria-hidden="true">
                    <Layers size={18} />
                  </span>
                  <span className="pd-stat__label">الكمية الإجمالية</span>
                  <strong className="pd-stat__value">{withUnit(totals.all)}</strong>
                </div>
                <div className="pd-stat">
                  <span className="pd-stat__icon" aria-hidden="true">
                    <Warehouse size={18} />
                  </span>
                  <span className="pd-stat__label">في المخازن</span>
                  <strong className="pd-stat__value">{withUnit(totals.inInventories)}</strong>
                </div>
                <div className="pd-stat">
                  <span className="pd-stat__icon" aria-hidden="true">
                    <MapPin size={18} />
                  </span>
                  <span className="pd-stat__label">في المواقع</span>
                  <strong className="pd-stat__value">{withUnit(totals.inSites)}</strong>
                </div>
                <div className="pd-stat">
                  <span className="pd-stat__icon" aria-hidden="true">
                    <MapPinned size={18} />
                  </span>
                  <span className="pd-stat__label">عدد الأماكن</span>
                  <strong className="pd-stat__value">{totals.places}</strong>
                </div>
              </div>

              {/* Where the product is */}
              <section className="pd-locations">
                <div className="pd-locations__header">
                  <h3>
                    <FileText size={16} aria-hidden="true" />
                    أماكن وجود الصنف
                  </h3>

                  <div className="pd-tabs" role="tablist" aria-label="نوع المكان">
                    {TYPE_TABS.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        role="tab"
                        aria-selected={typeFilter === t.value}
                        className={`pd-tabs__btn${typeFilter === t.value ? " pd-tabs__btn--active" : ""}`}
                        onClick={() => setTypeFilter(t.value)}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  <div className="pd-search">
                    <input
                      type="search"
                      value={placeSearch}
                      onChange={(e) => setPlaceSearch(e.target.value)}
                      placeholder="ابحث عن مخزن أو موقع..."
                      aria-label="ابحث عن مخزن أو موقع"
                    />
                    <Search size={16} className="pd-search__icon" aria-hidden="true" />
                  </div>
                </div>

                <div className="pd-table-wrap">
                  <table className="pd-table">
                    <thead>
                      <tr>
                        {LOCATION_COLUMNS.map(({ label, icon: Icon }) => (
                          <th key={label}>
                            <span className="pd-th-label">
                              <Icon size={14} aria-hidden="true" />
                              {label}
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {visibleRows.length === 0 && (
                        <tr>
                          <td colSpan={LOCATION_COLUMNS.length} className="pd-table__message">
                            {rows.length === 0
                              ? "هذا الصنف غير موجود في أي مخزن أو موقع."
                              : "لا توجد أماكن مطابقة."}
                          </td>
                        </tr>
                      )}

                      {visibleRows.map((row) => {
                        const PlaceIcon = row.type === "Sites" ? MapPin : Warehouse;
                        return (
                          <tr key={row.key}>
                            <td className="pd-col-place">
                              <span className="pd-place">
                                <PlaceIcon size={15} aria-hidden="true" />
                                {row.name}
                              </span>
                            </td>
                            <td>
                              <span className={`pd-type pd-type--${row.type}`}>{getEntityTypeLabel(row.type)}</span>
                            </td>
                            <td className="pd-col-stock">{row.stock}</td>
                            <td>{row.totalUsage ?? "—"}</td>
                            <td>{row.totalQuantity ?? "—"}</td>
                            <td>{row.minStock ?? "—"}</td>
                            <td>{row.maxStock ?? "—"}</td>
                            <td>{row.notes}</td>
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

        <footer className="prod-modal__footer">
          <button type="button" className="prod-modal__btn" onClick={onClose}>
            إغلاق
          </button>
        </footer>
      </div>
    </div>
  );
}
