import { useMemo, useState } from "react";
import {
  ArrowLeftRight,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Filter,
  Loader2,
  MapPin,
  MoreVertical,
  Plus,
  Search,
  Warehouse,
} from "lucide-react";
import PageHeader from "../../components/PageHeader/PageHeader";
import Pagination from "../../components/Pagination/Pagination";
import SortControl from "../../components/SortControl/SortControl";
import useTransactions from "../../hooks/useTransactions";
import { formatDate, getEntityName } from "../../utils/invoiceHelpers";
import { getEntityTypeLabel } from "../../utils/entityType";
import TransactionModal from "./TransactionModal";
import CreateTransactionModal from "./CreateTransactionModal";
import "./TransactionsPage.css";

const PAGE_SIZE = 10;

// Only one endpoint exists (/transaction), so "الحالة" filters the already
// fetched list locally by `Activated` instead of switching urls like the
// purchases page's tabs do.
const STATUS_TABS = [
  { value: "all", label: "الكل" },
  { value: "active", label: "مفعل" },
  { value: "draft", label: "مسودة" },
];

const ENTITY_TYPE_OPTIONS = [
  { value: "all", label: "الكل" },
  { value: "Inventories", label: "مخزن" },
  { value: "Sites", label: "موقع" },
];

const SORT_OPTIONS = [
  { value: "date", label: "التاريخ" },
  { value: "from", label: "من" },
  { value: "to", label: "إلى" },
];

const COLUMNS = [
  { label: "التاريخ", icon: Calendar },
  { label: "من", icon: Warehouse },
  { label: "نوع المصدر", icon: Filter },
  { label: "إلى", icon: Warehouse },
  { label: "نوع الوجهة", icon: Filter },
  { label: "الحالة", icon: CheckCircle2 },
  { label: "إجراءات", icon: MoreVertical },
];

export default function TransactionsPage() {
  const { status, transactions, reload } = useTransactions();

  const [search, setSearch] = useState("");
  const [fromType, setFromType] = useState("all");
  const [toType, setToType] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  // Sorted by date (newest first) by default, matching the purchases page.
  const [sortBy, setSortBy] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [selectedTransactionId, setSelectedTransactionId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return transactions.filter((tx) => {
      if (fromType !== "all" && tx.FromType !== fromType) return false;
      if (toType !== "all" && tx.ToType !== toType) return false;
      if (statusFilter === "active" && !tx.Activated) return false;
      if (statusFilter === "draft" && tx.Activated) return false;
      if (!q) return true;
      return (
        getEntityName(tx.TransactedFrom).toLowerCase().includes(q) ||
        getEntityName(tx.TransactedTo).toLowerCase().includes(q)
      );
    });
  }, [transactions, search, fromType, toType, statusFilter]);

  const sorted = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    const list = [...filtered];
    list.sort((a, b) => {
      switch (sortBy) {
        case "from":
          return getEntityName(a.TransactedFrom).localeCompare(getEntityName(b.TransactedFrom), "ar") * dir;
        case "to":
          return getEntityName(a.TransactedTo).localeCompare(getEntityName(b.TransactedTo), "ar") * dir;
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

  const handleSearch = (value) => {
    setSearch(value);
    setPage(1);
  };
  const handleFromType = (value) => {
    setFromType(value);
    setPage(1);
  };
  const handleToType = (value) => {
    setToType(value);
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
    <div className="transactions-page">
      <PageHeader
        title="التنقلات"
        subtitle="إدارة جميع عمليات نقل المنتجات بين المواقع والمخازن"
        icon={ArrowLeftRight}
        action={
          <button type="button" className="new-transaction-btn" onClick={() => setShowCreateModal(true)}>
            <Plus size={18} aria-hidden="true" />
            إنشاء تحويل
          </button>
        }
      />

      <section className="card">
        {/* Filters */}
        <div className="filters">
          <div className="search">
            <input
              type="search"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="ابحث عن تحويل..."
              aria-label="ابحث عن تحويل"
            />
            <Search size={18} className="search__icon" aria-hidden="true" />
          </div>

          <div className="filters__type">
            <label htmlFor="from-type-filter">نوع المصدر:</label>
            <div className="select">
              <select id="from-type-filter" value={fromType} onChange={(e) => handleFromType(e.target.value)}>
                {ENTITY_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="select__chevron" aria-hidden="true" />
            </div>
          </div>

          <div className="filters__type">
            <label htmlFor="to-type-filter">نوع الوجهة:</label>
            <div className="select">
              <select id="to-type-filter" value={toType} onChange={(e) => handleToType(e.target.value)}>
                {ENTITY_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="select__chevron" aria-hidden="true" />
            </div>
          </div>

          <SortControl
            id="transactions-sort-by"
            options={SORT_OPTIONS}
            value={sortBy}
            direction={sortDir}
            onChange={handleSortBy}
            onToggleDirection={toggleSortDir}
          />

          <div className="status-tabs">
            <span className="status-tabs__label">الحالة:</span>
            <div className="status-tabs__group" role="tablist" aria-label="حالة التحويل">
              {STATUS_TABS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  role="tab"
                  aria-selected={statusFilter === t.value}
                  className={`status-tabs__btn${statusFilter === t.value ? " status-tabs__btn--active" : ""}`}
                  onClick={() => handleStatus(t.value)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                {COLUMNS.map(({ label, icon: Icon }) => (
                  <th key={label}>
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
                    جاري تحميل التحويلات...
                  </td>
                </tr>
              )}

              {status === "error" && (
                <tr>
                  <td colSpan={COLUMNS.length} className="table__message table__message--error">
                    تعذّر تحميل التحويلات. تأكد من تشغيل الخادم ثم أعد المحاولة.
                    <button type="button" className="retry-btn" onClick={reload}>
                      إعادة المحاولة
                    </button>
                  </td>
                </tr>
              )}

              {status === "success" && pageItems.length === 0 && (
                <tr>
                  <td colSpan={COLUMNS.length} className="table__message">
                    لا توجد تحويلات مطابقة.
                  </td>
                </tr>
              )}

              {status === "success" &&
                pageItems.map((tx) => {
                  const FromIcon = tx.FromType === "Sites" ? MapPin : Warehouse;
                  const ToIcon = tx.ToType === "Sites" ? MapPin : Warehouse;
                  const fromName = getEntityName(tx.TransactedFrom);
                  const toName = getEntityName(tx.TransactedTo);
                  return (
                    <tr key={tx._id}>
                      <td>{formatDate(tx.createdAt)}</td>
                      <td>
                        <button
                          type="button"
                          className="link-btn entity-cell"
                          onClick={() => setSelectedTransactionId(tx._id)}
                        >
                          <FromIcon size={15} aria-hidden="true" />
                          {fromName}
                        </button>
                      </td>
                      <td>
                        <span className="type-badge">{getEntityTypeLabel(tx.FromType)}</span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="link-btn entity-cell"
                          onClick={() => setSelectedTransactionId(tx._id)}
                        >
                          <ToIcon size={15} aria-hidden="true" />
                          {toName}
                        </button>
                      </td>
                      <td>
                        <span className="type-badge">{getEntityTypeLabel(tx.ToType)}</span>
                      </td>
                      <td>
                        <span className={`badge ${tx.Activated ? "badge--active" : "badge--draft"}`}>
                          {tx.Activated ? "مفعل" : "مسودة"}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => setSelectedTransactionId(tx._id)}
                          aria-label={`عرض تفاصيل التحويل من ${fromName} إلى ${toName}`}
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

        {/* Footer */}
        <div className="table-footer">
          <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
          <span className="table-footer__total">
            إجمالي التحويلات: <strong>{sorted.length}</strong>
          </span>
        </div>
      </section>

      {selectedTransactionId && (
        <TransactionModal transactionId={selectedTransactionId} onClose={() => setSelectedTransactionId(null)} />
      )}

      {showCreateModal && <CreateTransactionModal onClose={() => setShowCreateModal(false)} />}
    </div>
  );
}
