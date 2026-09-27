import { useCallback, useMemo, useState } from "react";
import {
  Activity,
  ChevronDown,
  Eye,
  Filter,
  Layers,
  Loader2,
  MapPinned,
  Search,
  Settings,
  Warehouse,
} from "lucide-react";
import PageHeader from "../../components/PageHeader/PageHeader";
import Pagination from "../../components/Pagination/Pagination";
import SortControl from "../../components/SortControl/SortControl";
import useWarehouses from "../../hooks/useWarehouses";
import { formatProductsCount, sumInSiteProducts } from "../../utils/formatArabicCount";
import { getZoneName } from "../../utils/zone";
import WarehouseModal from "./WarehouseModal";
import "./WarehousesPage.css";

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: "all", label: "الكل" },
  { value: "active", label: "نشط" },
  { value: "inactive", label: "غير نشط" },
];

const SORT_OPTIONS = [
  { value: "name", label: "الاسم" },
  { value: "zone", label: "المنطقة" },
  { value: "active", label: "الحالة" },
  { value: "products", label: "عدد المنتجات" },
];

const COLUMNS = [
  { label: "الموقع", icon: Warehouse, className: "col-name" },
  { label: "المنطقة", icon: MapPinned },
  { label: "عدد المنتجات", icon: Layers },
  { label: "الحالة", icon: Activity },
  { label: "إجراءات", icon: Settings },
];

// Normalizes a warehouse record so the rest of the component doesn't
// have to keep checking whether zone/inSiteProducts are present.
function normalize(warehouse) {
  const zoneName = getZoneName(warehouse.zone);
  const productsCount = sumInSiteProducts(warehouse.inSiteProducts);
  return { ...warehouse, zoneName, productsCount };
}

export default function WarehousesPage() {
  const { status, warehouses, reload } = useWarehouses();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);

  const closeModal = useCallback(() => setSelected(null), []);

  const normalized = useMemo(() => warehouses.map(normalize), [warehouses]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return normalized.filter((w) => {
      if (statusFilter === "active" && !w.active) return false;
      if (statusFilter === "inactive" && w.active) return false;
      if (!q) return true;
      return (
        String(w.name ?? "").toLowerCase().includes(q) ||
        w.zoneName.toLowerCase().includes(q)
      );
    });
  }, [normalized, search, statusFilter]);

  const sorted = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    const list = [...filtered];
    list.sort((a, b) => {
      switch (sortBy) {
        case "zone":
          return a.zoneName.localeCompare(b.zoneName, "ar") * dir;
        case "active":
          return (Number(a.active) - Number(b.active)) * dir;
        case "products":
          return (a.productsCount - b.productsCount) * dir;
        case "name":
        default:
          return String(a.name ?? "").localeCompare(String(b.name ?? ""), "ar") * dir;
      }
    });
    return list;
  }, [filtered, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSearch = (value) => {
    setSearch(value);
    setPage(1);
  };
  const handleStatus = (value) => {
    setStatusFilter(value);
    setPage(1);
  };
  const handleSortBy = (value) => {
    setSortBy(value);
    setPage(1);
  };
  const toggleSortDir = () => setSortDir((d) => (d === "asc" ? "desc" : "asc"));

  return (
    <div className="warehouses-page">
      <PageHeader title="المخازن" subtitle="إدارة جميع المواقع والمخازن في النظام" icon={Warehouse} />

      <section className="card">
        {/* Filters + sorting */}
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

          <SortControl
            id="sort-by"
            options={SORT_OPTIONS}
            value={sortBy}
            direction={sortDir}
            onChange={handleSortBy}
            onToggleDirection={toggleSortDir}
          />

          <div className="search">
            <input
              type="search"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="ابحث عن موقع أو منطقة..."
              aria-label="ابحث عن موقع أو منطقة"
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
                    جاري تحميل المواقع...
                  </td>
                </tr>
              )}

              {status === "error" && (
                <tr>
                  <td colSpan={COLUMNS.length} className="table__message table__message--error">
                    تعذّر تحميل المواقع. تأكد من تشغيل الخادم ثم أعد المحاولة.
                    <button type="button" className="retry-btn" onClick={reload}>
                      إعادة المحاولة
                    </button>
                  </td>
                </tr>
              )}

              {status === "success" && pageItems.length === 0 && (
                <tr>
                  <td colSpan={COLUMNS.length} className="table__message">
                    لا توجد مواقع مطابقة.
                  </td>
                </tr>
              )}

              {status === "success" &&
                pageItems.map((warehouse) => (
                  <tr key={warehouse._id}>
                    <td className="col-name">
                      <div className="name-cell">
                        <span className="name-cell__thumb" aria-hidden="true">
                          <Warehouse size={20} strokeWidth={1.6} />
                        </span>
                        <button
                          type="button"
                          className="link-btn"
                          onClick={() => setSelected(warehouse)}
                        >
                          {warehouse.name}
                        </button>
                      </div>
                    </td>
                    <td>{warehouse.zoneName}</td>
                    <td>{formatProductsCount(warehouse.productsCount)}</td>
                    <td>
                      <span className={`badge ${warehouse.active ? "badge--active" : "badge--inactive"}`}>
                        {warehouse.active ? "نشط" : "غير نشط"}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => setSelected(warehouse)}
                        aria-label={`عرض تفاصيل ${warehouse.name}`}
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
            إجمالي المواقع: <strong>{sorted.length}</strong>
          </span>
        </div>
      </section>

      {selected && (
        <WarehouseModal key={selected._id} warehouseId={selected._id} onClose={closeModal} />
      )}
    </div>
  );
}
