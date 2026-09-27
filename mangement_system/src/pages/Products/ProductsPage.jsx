import { useCallback, useMemo, useState } from "react";
import {
  Activity,
  Box,
  ChevronDown,
  Eye,
  Filter,
  Hash,
  Layers,
  Loader2,
  Ruler,
  Search,
  Settings,
} from "lucide-react";
import PageHeader from "../../components/PageHeader/PageHeader";
import Pagination from "../../components/Pagination/Pagination";
import useProducts from "../../hooks/useProducts";
import ProductModal from "./ProductModal";
import "./ProductsPage.css";

const PAGE_SIZE = 10; // rows per page

const STATUS_OPTIONS = [
  { value: "all", label: "الكل" },
  { value: "active", label: "نشط" },
  { value: "inactive", label: "غير نشط" },
];

const COLUMNS = [
  { label: "المنتج", icon: Box, className: "col-product" },
  { label: "الكود", icon: Hash },
  { label: "الكمية الإجمالية", icon: Layers },
  { label: "وحدة القياس", icon: Ruler },
  { label: "الحالة", icon: Activity },
  { label: "إجراءات", icon: Settings },
];

export default function ProductsPage() {
  const { status, products, reload } = useProducts();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null); // product shown in the modal

  const closeModal = useCallback(() => setSelected(null), []);

  // Filters
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (statusFilter === "active" && !p.active) return false;
      if (statusFilter === "inactive" && p.active) return false;
      if (!q) return true;
      return (
        String(p.name ?? "").toLowerCase().includes(q) ||
        String(p.code ?? "").includes(q)
      );
    });
  }, [products, search, statusFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSearch = (value) => {
    setSearch(value);
    setPage(1);
  };
  const handleStatus = (value) => {
    setStatusFilter(value);
    setPage(1);
  };

  return (
    <div className="products-page">
      <PageHeader title="المنتجات" subtitle="إدارة جميع المنتجات في النظام" />

      <section className="card">
        {/* Filters */}
        <div className="filters">
          <div className="filters__status">
            <Filter size={22} strokeWidth={1.6} aria-hidden="true" />
            <label htmlFor="status-filter">تصفية حسب الحالة:</label>
            <div className="select">
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => handleStatus(e.target.value)}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="select__chevron" aria-hidden="true" />
            </div>
          </div>

          <div className="search">
            <input
              type="search"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="ابحث عن منتج..."
              aria-label="ابحث عن منتج"
            />
            <Search size={18} className="search__icon" aria-hidden="true" />
          </div>
        </div>

        {/* Table */}
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                {COLUMNS.map(({ label, icon: Icon, className }) => (
                  <th key={label} className={className}>
                    <span className="th-label">
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
                  <td colSpan={COLUMNS.length} className="table__message">
                    <Loader2 size={18} className="spin" aria-hidden="true" />
                    جاري تحميل المنتجات...
                  </td>
                </tr>
              )}

              {status === "error" && (
                <tr>
                  <td colSpan={COLUMNS.length} className="table__message table__message--error">
                    تعذّر تحميل المنتجات. تأكد من تشغيل الخادم ثم أعد المحاولة.
                    <button type="button" className="retry-btn" onClick={reload}>
                      إعادة المحاولة
                    </button>
                  </td>
                </tr>
              )}

              {status === "success" && pageItems.length === 0 && (
                <tr>
                  <td colSpan={COLUMNS.length} className="table__message">
                    لا توجد منتجات مطابقة.
                  </td>
                </tr>
              )}

              {status === "success" &&
                pageItems.map((product) => (
                  <tr key={product._id}>
                    <td className="col-product">
                      <div className="product-cell">
                        <span className="product-cell__thumb" aria-hidden="true">
                          <Box size={20} strokeWidth={1.6} />
                        </span>
                        <button
                          type="button"
                          className="link-btn"
                          onClick={() => setSelected(product)}
                        >
                          {product.name}
                        </button>
                      </div>
                    </td>
                    <td>{product.code ?? "—"}</td>
                    <td>{product.total_quantity ?? "—"}</td>
                    <td>{product.measurementUnit || "—"}</td>
                    <td>
                      <span className={`badge ${product.active ? "badge--active" : "badge--inactive"}`}>
                        {product.active ? "نشط" : "غير نشط"}
                      </span>
                      {product.freezed && <span className="badge badge--frozen">مجمّد</span>}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => setSelected(product)}
                        aria-label={`عرض تفاصيل ${product.name}`}
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="table-footer">
          <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
          <span className="table-footer__total">
            إجمالي المنتجات: <strong>{filtered.length}</strong>
          </span>
        </div>
      </section>

      {selected && <ProductModal product={selected} onClose={closeModal} />}
    </div>
  );
}
