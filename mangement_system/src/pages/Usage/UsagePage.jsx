import { useMemo, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  Filter,
  Hash,
  Loader2,
  MapPin,
  MapPinned,
  MoreVertical,
  Package,
  Plus,
  Search,
  Warehouse,
} from "lucide-react";
import PageHeader from "../../components/PageHeader/PageHeader";
import RequireAuth from "../../components/RequireAuth/RequireAuth";
import Pagination from "../../components/Pagination/Pagination";
import SortControl from "../../components/SortControl/SortControl";
import useUsages from "../../hooks/useUsages";
import useProducts from "../../hooks/useProducts";
import { hasPermission } from "../../utils/auth";
import { formatDate } from "../../utils/invoiceHelpers";
import { getEntityTypeLabel } from "../../utils/entityType";
import {
  getUsageItems,
  getUsageProductNames,
  getUsageTargetName,
  getUsageTargetType,
  sumUsageQuantity,
} from "../../utils/usageHelpers";
import UsageModal from "./UsageModal";
import CreateUsageModal from "./CreateUsageModal";
import "./UsagePage.css";

const PAGE_SIZE = 10;

// Key in the token payload (req.auth) that allows creating a usage operation.
const CREATE_PERMISSION = "Usage";

// "المفعلة" fetches GET /usage, "المسودات" fetches GET /usage/draft — see useUsages.
const STATUS_TABS = [
  { value: "active", label: "المفعلة" },
  { value: "draft", label: "المسودات" },
];

const TYPE_OPTIONS = [
  { value: "all", label: "الكل" },
  { value: "Inventories", label: "مخزن" },
  { value: "Sites", label: "موقع" },
];

const SORT_OPTIONS = [
  { value: "date", label: "التاريخ" },
  { value: "destination", label: "الموقع / المخزن" },
  { value: "type", label: "النوع" },
  { value: "quantity", label: "الكمية" },
];

// Index 0 renders on the right (RTL).
const COLUMNS = [
  { label: "التاريخ", icon: Calendar },
  { label: "الموقع / المخزن", icon: MapPinned },
  { label: "النوع", icon: Warehouse },
  { label: "الصنف", icon: Package },
  { label: "الكمية", icon: Hash },
  { label: "الحالة", icon: CheckCircle2 },
  { label: "إجراءات", icon: MoreVertical },
];

function UsageContent() {
  const [tab, setTab] = useState("active");
  const { status, usages, error, reload } = useUsages(tab);
  // UI only — the backend must enforce the permission on POST /usage as well.
  const canCreate = CREATE_PERMISSION ? hasPermission(CREATE_PERMISSION) : true;
  const { products } = useProducts();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Usage lines usually carry only a ProductId, so names are resolved here.
  const productMap = useMemo(() => new Map(products.map((p) => [p._id, p])), [products]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return usages.filter((u) => {
      if (typeFilter !== "all" && getUsageTargetType(u) !== typeFilter) return false;
      if (!q) return true;
      return (
        getUsageTargetName(u).toLowerCase().includes(q) ||
        getEntityTypeLabel(getUsageTargetType(u)).toLowerCase().includes(q) ||
        getUsageProductNames(u, productMap).some((n) => String(n).toLowerCase().includes(q))
      );
    });
  }, [usages, search, typeFilter, productMap]);

  const sorted = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    const list = [...filtered];
    list.sort((a, b) => {
      switch (sortBy) {
        case "destination":
          return getUsageTargetName(a).localeCompare(getUsageTargetName(b), "ar") * dir;
        case "type":
          return (
            getEntityTypeLabel(getUsageTargetType(a)).localeCompare(getEntityTypeLabel(getUsageTargetType(b)), "ar") * dir
          );
        case "quantity":
          return (sumUsageQuantity(getUsageItems(a)) - sumUsageQuantity(getUsageItems(b))) * dir;
        case "date":
        default:
          return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
      }
    });
    return list;
  }, [filtered, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleTab = (value) => {
    setTab(value);
    setPage(1);
  };
  const handleSearch = (value) => {
    setSearch(value);
    setPage(1);
  };
  const handleTypeFilter = (value) => {
    setTypeFilter(value);
    setPage(1);
  };
  const handleSortBy = (value) => {
    setSortBy(value);
    setPage(1);
  };
  const toggleSortDir = () => setSortDir((d) => (d === "asc" ? "desc" : "asc"));

  return (
    <div className="usage-page">
      <PageHeader
        title="الاستخدام"
        subtitle="إدارة جميع عمليات استخدام الأصناف"
        action={
          canCreate ? (
            <button type="button" className="usage-new-btn" onClick={() => setShowCreateModal(true)}>
              <Plus size={18} aria-hidden="true" />
              إنشاء عملية استخدام
            </button>
          ) : undefined
        }
      />

      <section className="usage-card">
        <div className="usage-filters">
          <div className="usage-search">
            <input
              type="search"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="ابحث عن موقع أو صنف..."
              aria-label="ابحث في عمليات الاستخدام"
            />
            <Search size={18} className="usage-search__icon" aria-hidden="true" />
          </div>

          <div className="usage-type-filter">
            <label htmlFor="usage-type-filter">النوع:</label>
            <div className="usage-select">
              <select id="usage-type-filter" value={typeFilter} onChange={(e) => handleTypeFilter(e.target.value)}>
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="usage-select__chevron" aria-hidden="true" />
            </div>
            <Filter size={20} strokeWidth={1.6} aria-hidden="true" />
          </div>

          <SortControl
            id="usage-sort-by"
            options={SORT_OPTIONS}
            value={sortBy}
            direction={sortDir}
            onChange={handleSortBy}
            onToggleDirection={toggleSortDir}
          />

          <div className="usage-tabs">
            <span className="usage-tabs__label">الحالة:</span>
            <div className="usage-tabs__group" role="tablist" aria-label="حالة عملية الاستخدام">
              {STATUS_TABS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.value}
                  className={`usage-tabs__btn${tab === t.value ? " usage-tabs__btn--active" : ""}`}
                  onClick={() => handleTab(t.value)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="usage-table-wrap">
          <table className="usage-table">
            <thead>
              <tr>
                {COLUMNS.map(({ label, icon: Icon }) => (
                  <th key={label}>
                    <span className="usage-th-label">
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
                  <td colSpan={COLUMNS.length} className="usage-table__message">
                    <Loader2 size={18} className="usage-spin" aria-hidden="true" />
                    جاري تحميل البيانات...
                  </td>
                </tr>
              )}

              {status === "error" && (
                <tr>
                  <td colSpan={COLUMNS.length} className="usage-table__message usage-table__message--error">
                    {error?.message || "تعذّر تحميل البيانات. تأكد من تشغيل الخادم ثم أعد المحاولة."}
                    <button type="button" className="usage-retry-btn" onClick={reload}>
                      إعادة المحاولة
                    </button>
                  </td>
                </tr>
              )}

              {status === "success" && pageItems.length === 0 && (
                <tr>
                  <td colSpan={COLUMNS.length} className="usage-table__message">
                    لا توجد عمليات استخدام مطابقة.
                  </td>
                </tr>
              )}

              {status === "success" &&
                pageItems.map((usage) => {
                  const targetType = getUsageTargetType(usage);
                  const DestIcon = targetType === "Sites" ? MapPin : Warehouse;
                  const destName = getUsageTargetName(usage);
                  const productNames = getUsageProductNames(usage, productMap);
                  const totalQty = sumUsageQuantity(getUsageItems(usage));
                  return (
                    <tr key={usage._id}>
                      <td>{formatDate(usage.createdAt)}</td>
                      <td>
                        <button type="button" className="usage-link-btn usage-dest-cell" onClick={() => setSelectedId(usage._id)}>
                          <DestIcon size={15} aria-hidden="true" />
                          {destName}
                        </button>
                      </td>
                      <td>
                        <span className="usage-type-badge">{getEntityTypeLabel(targetType)}</span>
                      </td>
                      <td>
                        {productNames.length === 0 ? (
                          "—"
                        ) : (
                          <span className="usage-product-cell">
                            {productNames[0]}
                            {productNames.length > 1 && (
                              <span className="usage-more" title={productNames.slice(1).join("، ")}>
                                +{productNames.length - 1}
                              </span>
                            )}
                          </span>
                        )}
                      </td>
                      <td>{totalQty}</td>
                      <td>
                        <span className={`usage-badge ${tab === "draft" ? "usage-badge--draft" : "usage-badge--active"}`}>
                          {tab === "draft" ? "مسودة" : "مفعل"}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="usage-icon-btn"
                          onClick={() => setSelectedId(usage._id)}
                          aria-label={`عرض تفاصيل عملية الاستخدام الخاصة بـ ${destName}`}
                        >
                          <MoreVertical size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        <div className="usage-table-footer">
          <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
          <span>
            إجمالي العمليات: <strong>{sorted.length}</strong>
          </span>
        </div>
      </section>

      {selectedId && <UsageModal usageId={selectedId} onClose={() => setSelectedId(null)} />}

      {showCreateModal && canCreate && (
        <CreateUsageModal onClose={() => setShowCreateModal(false)} onCreated={reload} />
      )}
    </div>
  );
}

// Signed-out visitors are sent to /login before UsageContent (and its data
// hooks) ever run. The modals only render inside the page.
export default function UsagePage() {
  return (
    <RequireAuth>
      <UsageContent />
    </RequireAuth>
  );
}
