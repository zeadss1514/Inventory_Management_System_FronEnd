import { useEffect, useMemo, useState } from "react";
import {
  Barcode,
  Box,
  Hash,
  Info,
  Loader2,
  Map,
  MapPin,
  MapPinned,
  Ruler,
  Search,
  StickyNote,
  TrendingDown,
  TrendingUp,
  Warehouse,
  X,
} from "lucide-react";
import useWarehouseDetail from "../../hooks/useWarehouseDetail";
import { getZoneName } from "../../utils/zone";
import "./WarehouseModal.css";

const PRODUCT_COLUMNS = [
  { label: "اسم المنتج", icon: Box },
  { label: "وحدة القياس", icon: Ruler },
  { label: "كود المنتج", icon: Barcode },
  { label: "المخزون الحالي", icon: Hash },
  { label: "الحد الأدنى", icon: TrendingDown },
  { label: "الحد الأقصى", icon: TrendingUp },
  { label: "ملاحظات", icon: StickyNote },
];

export default function WarehouseModal({ warehouseId, onClose }) {
  const { status, warehouse, reload } = useWarehouseDetail(warehouseId);
  const [productSearch, setProductSearch] = useState("");

  useEffect(() => {
    const onKeyDown = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const zoneName = getZoneName(warehouse?.zone);

  const filteredProducts = useMemo(() => {
    const list = Array.isArray(warehouse?.inSiteProducts) ? warehouse.inSiteProducts : [];
    const q = productSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter((item) => {
      const name = String(item.productId?.name ?? "").toLowerCase();
      const code = String(item.productId?.code ?? "");
      return name.includes(q) || code.includes(q);
    });
  }, [warehouse, productSearch]);

  return (
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
              تعذّر تحميل بيانات الموقع.
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
                    المنتجات داخل الموقع
                  </h3>
                  <div className="wh-products__search">
                    <input
                      type="search"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="ابحث عن منتج..."
                      aria-label="ابحث عن منتج داخل الموقع"
                    />
                    <Search size={16} className="wh-products__search-icon" aria-hidden="true" />
                  </div>
                </div>

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
                      {filteredProducts.length === 0 && (
                        <tr>
                          <td colSpan={PRODUCT_COLUMNS.length} className="wh-table__message">
                            لا توجد منتجات مطابقة.
                          </td>
                        </tr>
                      )}

                      {filteredProducts.map((item) => (
                        <tr key={item._id}>
                          <td className="wh-col-product">{item.productId?.name ?? "—"}</td>
                          <td>{item.productId?.measurementUnit || "—"}</td>
                          <td>{item.productId?.code ?? "—"}</td>
                          <td>{item.stock ?? "—"}</td>
                          <td>{item.minStock ?? "—"}</td>
                          <td>{item.maxStock ?? "—"}</td>
                          <td>{item.notes?.trim() || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
  );
}
