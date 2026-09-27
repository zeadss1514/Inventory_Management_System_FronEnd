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
  X,
} from "lucide-react";
import useSiteDetail from "../../hooks/useSiteDetail";
import { getZoneName } from "../../utils/zone";
import "./SiteModal.css";

const PRODUCT_COLUMNS = [
  { label: "اسم المنتج", icon: Box },
  { label: "وحدة القياس", icon: Ruler },
  { label: "كود المنتج", icon: Barcode },
  { label: "المخزون الحالي", icon: Hash },
  { label: "الحد الأدنى", icon: TrendingDown },
  { label: "الحد الأقصى", icon: TrendingUp },
  { label: "ملاحظات", icon: StickyNote },
];

export default function SiteModal({ siteId, onClose }) {
  const { status, site, reload } = useSiteDetail(siteId);
  const [productSearch, setProductSearch] = useState("");

  useEffect(() => {
    const onKeyDown = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const zoneName = getZoneName(site?.zone);

  const filteredProducts = useMemo(() => {
    const list = Array.isArray(site?.inSiteProducts) ? site.inSiteProducts : [];
    const q = productSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter((item) => {
      const name = String(item.productId?.name ?? "").toLowerCase();
      const code = String(item.productId?.code ?? "");
      return name.includes(q) || code.includes(q);
    });
  }, [site, productSearch]);

  return (
    <div className="site-modal-overlay" onClick={onClose}>
      <div
        className="site-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="site-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="site-modal__header">
          <h2 id="site-modal-title" className="site-modal__title">
            <MapPin size={22} strokeWidth={1.8} aria-hidden="true" />
            تفاصيل الموقع
          </h2>
          <button type="button" className="site-modal__close" onClick={onClose} aria-label="إغلاق">
            <X size={20} />
          </button>
        </header>

        <div className="site-modal__body">
          {status === "loading" && (
            <p className="site-state">
              <Loader2 size={18} className="site-spin" aria-hidden="true" />
              جاري تحميل بيانات الموقع...
            </p>
          )}

          {status === "error" && (
            <p className="site-state site-state--error">
              تعذّر تحميل بيانات الموقع.
              <button type="button" className="site-retry-btn" onClick={reload}>
                إعادة المحاولة
              </button>
            </p>
          )}

          {status === "success" && site && (
            <>
              <div className="site-top-grid">
                {/* Site card */}
                <div className="site-site-card">
                  <span className="site-site-card__icon" aria-hidden="true">
                    <MapPin size={26} strokeWidth={1.8} />
                  </span>

                  <div className="site-site-card__name-row">
                    <h3 className="site-site-card__name">{site.name}</h3>
                    <span className={`site-badge ${site.active ? "site-badge--active" : "site-badge--inactive"}`}>
                      {site.active ? "نشط" : "غير نشط"}
                    </span>
                  </div>

                  <p className="site-site-card__meta">
                    <MapPinned size={15} aria-hidden="true" />
                    المنطقة: {zoneName}
                  </p>
                  <p className="site-site-card__meta">
                    <Map size={15} aria-hidden="true" />
                    العنوان: {site.address?.trim() || "—"}
                  </p>
                </div>

                {/* Info panel */}
                <div className="site-info-panel">
                  <div className="site-info-panel__header">
                    <Info size={16} aria-hidden="true" />
                    معلومات الموقع
                  </div>

                  <dl className="site-info-list">
                    <div className="site-info-row">
                      <dt>اسم الموقع</dt>
                      <dd>{site.name}</dd>
                    </div>
                    <div className="site-info-row">
                      <dt>المنطقة</dt>
                      <dd>{zoneName}</dd>
                    </div>
                    <div className="site-info-row">
                      <dt>الحالة</dt>
                      <dd>
                        <span className={`site-badge ${site.active ? "site-badge--active" : "site-badge--inactive"}`}>
                          {site.active ? "نشط" : "غير نشط"}
                        </span>
                      </dd>
                    </div>
                    <div className="site-info-row">
                      <dt>العنوان</dt>
                      <dd>{site.address?.trim() || "—"}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Products at this site */}
              <section className="site-products">
                <div className="site-products__header">
                  <h3>
                    <Box size={16} aria-hidden="true" />
                    المنتجات داخل الموقع
                  </h3>
                  <div className="site-products__search">
                    <input
                      type="search"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="ابحث عن منتج..."
                      aria-label="ابحث عن منتج داخل الموقع"
                    />
                    <Search size={16} className="site-products__search-icon" aria-hidden="true" />
                  </div>
                </div>

                <div className="site-table-wrap">
                  <table className="site-table">
                    <thead>
                      <tr>
                        {PRODUCT_COLUMNS.map(({ label, icon: Icon }) => (
                          <th key={label}>
                            <span className="site-th-label">
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
                          <td colSpan={PRODUCT_COLUMNS.length} className="site-table__message">
                            لا توجد منتجات مطابقة.
                          </td>
                        </tr>
                      )}

                      {filteredProducts.map((item) => (
                        <tr key={item._id}>
                          <td className="site-col-product">{item.productId?.name ?? "—"}</td>
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

        <footer className="site-modal__footer">
          <button type="button" className="site-modal__btn" onClick={onClose}>
            إغلاق
          </button>
        </footer>
      </div>
    </div>
  );
}
