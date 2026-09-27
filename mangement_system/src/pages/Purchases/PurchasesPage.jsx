import { useMemo, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  DollarSign,
  FileText,
  Filter,
  Loader2,
  MapPin,
  MapPinned,
  MoreVertical,
  Plus,
  Search,
  User,
  Warehouse,
} from "lucide-react";
import PageHeader from "../../components/PageHeader/PageHeader";
import Pagination from "../../components/Pagination/Pagination";
import SortControl from "../../components/SortControl/SortControl";
import usePurchases from "../../hooks/usePurchases";
import { formatCurrency, formatDate, getPurchasedToName, sumInvoiceItemsCost } from "../../utils/invoiceHelpers";
import { getEntityTypeLabel } from "../../utils/entityType";
import PurchaseModal from "./PurchaseModal";
import CreateInvoiceModal from "./CreateInvoiceModal";
import "./PurchasesPage.css";

const PAGE_SIZE = 10;

// "الكل" fetches /invoice/active, "المسودات" fetches /invoice/draft — see usePurchases.
const STATUS_TABS = [
  { value: "active", label: "الكل" },
  { value: "draft", label: "المسودات" },
];

// Matches the model: purchaseToType: { enum: ["Sites", "Inventories"] }
const PURCHASE_TYPE_OPTIONS = [
  { value: "all", label: "الكل" },
  { value: "Inventories", label: "مخزن" },
  { value: "Sites", label: "موقع" },
];

const getTypeLabel = getEntityTypeLabel;

const SORT_OPTIONS = [
  { value: "date", label: "التاريخ" },
  { value: "user", label: "المستخدم" },
  { value: "destination", label: "الموقع / المخزن" },
  { value: "type", label: "نوع الشراء" },
];

const COLUMNS = [
  { label: "التاريخ", icon: Calendar },
  { label: "تم الشراء إلى", icon: MapPinned },
  { label: "مخزن / موقع", icon: Warehouse },
  { label: "التكلفة الإجمالية", icon: DollarSign },
  { label: "مجموع عناصر الفاتورة", icon: FileText },
  { label: "المستخدم", icon: User },
  { label: "الحالة", icon: CheckCircle2 },
  { label: "إجراءات", icon: MoreVertical },
];

export default function PurchasesPage() {
  const [tab, setTab] = useState("active");
  const { status, invoices, reload } = usePurchases(tab);

  const [search, setSearch] = useState("");
  const [purchaseType, setPurchaseType] = useState("all");
  // Sorted by date (newest first) by default, per request.
  const [sortBy, setSortBy] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return invoices.filter((inv) => {
      if (purchaseType !== "all" && inv.purchaseToType !== purchaseType) return false;
      if (!q) return true;
      return (
        getPurchasedToName(inv.purchasedTo).toLowerCase().includes(q) ||
        getTypeLabel(inv.purchaseToType).toLowerCase().includes(q)
      );
    });
  }, [invoices, search, purchaseType]);

  const sorted = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    const list = [...filtered];
    list.sort((a, b) => {
      switch (sortBy) {
        case "user":
          // No user data yet (see the disabled column below) — this is a
          // stable no-op today and will start working once it's added.
          return String(a.user?.name ?? "").localeCompare(String(b.user?.name ?? ""), "ar") * dir;
        case "destination":
          return getPurchasedToName(a.purchasedTo).localeCompare(getPurchasedToName(b.purchasedTo), "ar") * dir;
        case "type":
          return getTypeLabel(a.purchaseToType).localeCompare(getTypeLabel(b.purchaseToType), "ar") * dir;
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
  const handlePurchaseType = (value) => {
    setPurchaseType(value);
    setPage(1);
  };
  const handleSortBy = (value) => {
    setSortBy(value);
    setPage(1);
  };
  const toggleSortDir = () => setSortDir((d) => (d === "asc" ? "desc" : "asc"));
  const handleCreateInvoice = () => setShowCreateModal(true);

  return (
    <div className="purchases-page">
      <PageHeader
        title="المشتريات"
        subtitle="إدارة جميع فواتير المشتريات"
        action={
          <button type="button" className="new-invoice-btn" onClick={handleCreateInvoice}>
            <Plus size={18} aria-hidden="true" />
            انشاء فاتورة
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
              placeholder="ابحث عن فاتورة..."
              aria-label="ابحث عن فاتورة"
            />
            <Search size={18} className="search__icon" aria-hidden="true" />
          </div>

          <div className="filters__type">
            <label htmlFor="purchase-type-filter">نوع الشراء:</label>
            <div className="select">
              <select
                id="purchase-type-filter"
                value={purchaseType}
                onChange={(e) => handlePurchaseType(e.target.value)}
              >
                {PURCHASE_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="select__chevron" aria-hidden="true" />
            </div>
            <Filter size={20} strokeWidth={1.6} aria-hidden="true" />
          </div>

          <SortControl
            id="purchases-sort-by"
            options={SORT_OPTIONS}
            value={sortBy}
            direction={sortDir}
            onChange={handleSortBy}
            onToggleDirection={toggleSortDir}
          />

          <div className="status-tabs">
            <span className="status-tabs__label">الحالة:</span>
            <div className="status-tabs__group" role="tablist" aria-label="حالة الفاتورة">
              {STATUS_TABS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.value}
                  className={`status-tabs__btn${tab === t.value ? " status-tabs__btn--active" : ""}`}
                  onClick={() => handleTab(t.value)}
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
                    جاري تحميل الفواتير...
                  </td>
                </tr>
              )}

              {status === "error" && (
                <tr>
                  <td colSpan={COLUMNS.length} className="table__message table__message--error">
                    تعذّر تحميل الفواتير. تأكد من تشغيل الخادم ثم أعد المحاولة.
                    <button type="button" className="retry-btn" onClick={reload}>
                      إعادة المحاولة
                    </button>
                  </td>
                </tr>
              )}

              {status === "success" && pageItems.length === 0 && (
                <tr>
                  <td colSpan={COLUMNS.length} className="table__message">
                    لا توجد فواتير مطابقة.
                  </td>
                </tr>
              )}

              {status === "success" &&
                pageItems.map((invoice) => {
                  const isSite = invoice.purchaseToType === "Sites";
                  const DestIcon = isSite ? MapPin : Warehouse;
                  const destName = getPurchasedToName(invoice.purchasedTo);
                  const totalCost = invoice.totalcost ?? invoice.totalCost;
                  const invoiceItems = invoice.InvoiceItems ?? invoice.invoiceItems;
                  return (
                    <tr key={invoice._id}>
                      <td>{formatDate(invoice.createdAt)}</td>
                      <td>
                        <button
                          type="button"
                          className="link-btn dest-cell"
                          onClick={() => setSelectedInvoiceId(invoice._id)}
                        >
                          <DestIcon size={15} aria-hidden="true" />
                          {destName}
                        </button>
                      </td>
                      <td>
                        <span className="type-badge">{getTypeLabel(invoice.purchaseToType)}</span>
                      </td>
                      <td>{formatCurrency(totalCost)}</td>
                      <td>{formatCurrency(sumInvoiceItemsCost(invoiceItems))}</td>
                      <td>
                        <span
                          className="user-cell-disabled"
                          title="سيتم تفعيل عرض المستخدم الذي أنشأ الفاتورة لاحقاً"
                        >
                          <User size={13} aria-hidden="true" />
                          غير مفعل
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${tab === "draft" ? "badge--draft" : "badge--active"}`}>
                          {tab === "draft" ? "مسودة" : "مفعل"}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => setSelectedInvoiceId(invoice._id)}
                          aria-label={`عرض تفاصيل الفاتورة الخاصة بـ ${destName}`}
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
            إجمالي الفواتير: <strong>{sorted.length}</strong>
          </span>
        </div>
      </section>

      {selectedInvoiceId && (
        <PurchaseModal invoiceId={selectedInvoiceId} onClose={() => setSelectedInvoiceId(null)} />
      )}

      {showCreateModal && (
        <CreateInvoiceModal onClose={() => setShowCreateModal(false)} onCreated={reload} />
      )}
    </div>
  );
}
