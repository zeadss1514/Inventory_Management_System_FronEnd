import { useCallback, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Calendar,
  ChevronDown,
  ExternalLink,
  FileText,
  Filter,
  Loader2,
  Search,
  Tag,
} from "lucide-react";
import PageHeader from "../../components/PageHeader/PageHeader";
import Pagination from "../../components/Pagination/Pagination";
import SortControl from "../../components/SortControl/SortControl";
import useLogs from "../../hooks/useLogs";
import {
  LOG_TYPE_OPTIONS,
  OPENABLE_LOG_TYPES,
  buildLogParts,
  formatDateTime,
  getLogDate,
  getLogDirection,
  getLogPlace,
  getLogProduct,
  getLogRefId,
  getLogTypeLabel,
  normalizeLogType,
} from "../../utils/logHelpers";
// Existing detail modals, reused as they are.
import PurchaseModal from "../Purchases/PurchaseModal";
import UsageModal from "../Usage/UsageModal";
import TransactionModal from "../Transactions/TransactionModal";
import "./LogsPage.css";

const PAGE_SIZE = 15;

const DIRECTION_OPTIONS = [
  { value: "all", label: "الكل" },
  { value: "in", label: "دخول" },
  { value: "out", label: "خروج" },
];

const SORT_OPTIONS = [
  { value: "date", label: "التاريخ" },
  { value: "type", label: "النوع" },
];

// Order on the page: date, direction (IncomingStock), type, then the sentence.
const COLUMNS = [
  { label: "التاريخ", icon: Calendar },
  { label: "الحركة", icon: ArrowLeftRight },
  { label: "النوع", icon: Tag },
  { label: "السجل", icon: FileText },
];

// Unique { value, label } options (sorted by name) from { id, name } refs.
function uniqueOptions(refs) {
  const byId = new Map();
  for (const ref of refs) if (ref) byId.set(ref.id, ref.name);
  return [...byId.entries()]
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label, "ar"));
}

// Newest first; logs without a date last; equal times -> newer id first
// (a Mongo ObjectId grows with time, so it breaks ties correctly).
const newestFirst = (a, b) => {
  if (a.time == null && b.time == null) return String(b.id).localeCompare(String(a.id));
  if (a.time == null) return 1;
  if (b.time == null) return -1;
  return b.time - a.time || String(b.id).localeCompare(String(a.id));
};

function FilterSelect({ id, label, value, onChange, options }) {
  return (
    <div className="logs-filter">
      <label htmlFor={id}>{label}:</label>
      <div className="logs-select">
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="all">الكل</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown size={16} className="logs-select__chevron" aria-hidden="true" />
      </div>
    </div>
  );
}

// Built once per record, not on every keystroke of the search box.
function toRow(log, index) {
  const time = getLogDate(log);
  const parts = buildLogParts(log);
  const refId = getLogRefId(log);
  const type = normalizeLogType(log.typeOfInvoice);
  return {
    id: log._id ?? `log-${index}`,
    type,
    typeLabel: getLogTypeLabel(type),
    direction: getLogDirection(log),
    parts,
    place: getLogPlace(log),
    product: getLogProduct(log),
    text: parts.map((p) => p.text).join(" "),
    time,
    timeLabel: formatDateTime(time),
    // The type badge opens the details only when we know which document it is.
    refId: OPENABLE_LOG_TYPES.includes(type) ? refId : null,
  };
}

function Sentence({ parts, type }) {
  return (
    <p className={`logs-sentence logs-sentence--${type ?? "unknown"}`} dir="rtl">
      {parts.map((part, i) =>
        part.kind === "text" ? (
          <span key={i} className="logs-word">
            {part.text}
          </span>
        ) : (
          // <bdi> keeps Latin names / numbers from scrambling the Arabic order
          <bdi key={i} className={`logs-chip logs-chip--${part.kind}${part.missing ? " logs-chip--missing" : ""}`}>
            {part.text}
          </bdi>
        ),
      )}
    </p>
  );
}

export default function LogsPage() {
  const { status, logs, error, reload } = useLogs();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [directionFilter, setDirectionFilter] = useState("all");
  const [placeFilter, setPlaceFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [opened, setOpened] = useState(null); // { type, id }

  const closeModal = useCallback(() => setOpened(null), []);

  const rows = useMemo(() => logs.map(toRow), [logs]);
  const placeOptions = useMemo(() => uniqueOptions(rows.map((r) => r.place)), [rows]);
  const productOptions = useMemo(() => uniqueOptions(rows.map((r) => r.product)), [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (typeFilter !== "all" && r.type !== typeFilter) return false;
      if (typeFilter === "TransactionsInvoices" && directionFilter !== "all" && r.direction !== directionFilter) {
        return false;
      }
      if (placeFilter !== "all" && r.place?.id !== placeFilter) return false;
      if (productFilter !== "all" && r.product?.id !== productFilter) return false;
      return !q || r.text.toLowerCase().includes(q);
    });
  }, [rows, search, typeFilter, directionFilter, placeFilter, productFilter]);

  const sorted = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    const list = [...filtered];
    list.sort((a, b) => {
      if (sortBy === "type") {
        return a.typeLabel.localeCompare(b.typeLabel, "ar") * dir || newestFirst(a, b);
      }
      // default: by date in the chosen direction (desc = latest first)
      if (a.time != null && b.time != null && a.time !== b.time) return (a.time - b.time) * dir;
      return newestFirst(a, b);
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
  const handleType = (value) => {
    setTypeFilter(value);
    setDirectionFilter("all");
    setPage(1);
  };
  const handleDirection = (value) => {
    setDirectionFilter(value);
    setPage(1);
  };
  const handlePlace = (value) => {
    setPlaceFilter(value);
    setPage(1);
  };
  const handleProduct = (value) => {
    setProductFilter(value);
    setPage(1);
  };
  const handleSortBy = (value) => {
    setSortBy(value);
    setPage(1);
  };
  const toggleSortDir = () => setSortDir((d) => (d === "asc" ? "desc" : "asc"));

  return (
    <div className="logs-page">
      <PageHeader title="السجلات" subtitle="سجل عمليات الشراء والنقل والاستهلاك" icon={FileText} />

      <section className="logs-card">
        <div className="logs-filters">
          <div className="logs-search">
            <input
              type="search"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="ابحث في السجلات..."
              aria-label="ابحث في السجلات"
            />
            <Search size={18} className="logs-search__icon" aria-hidden="true" />
          </div>

          <div className="logs-filter">
            <label htmlFor="logs-type-filter">النوع:</label>
            <div className="logs-select">
              <select id="logs-type-filter" value={typeFilter} onChange={(e) => handleType(e.target.value)}>
                {LOG_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="logs-select__chevron" aria-hidden="true" />
            </div>
            <Filter size={20} strokeWidth={1.6} aria-hidden="true" />
          </div>

          {/* Only transfers have a direction (IncomingStock). */}
          {typeFilter === "TransactionsInvoices" && (
            <div className="logs-filter">
              <label htmlFor="logs-direction-filter">الحركة:</label>
              <div className="logs-select">
                <select
                  id="logs-direction-filter"
                  value={directionFilter}
                  onChange={(e) => handleDirection(e.target.value)}
                >
                  {DIRECTION_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="logs-select__chevron" aria-hidden="true" />
              </div>
            </div>
          )}

          <FilterSelect
            id="logs-place-filter"
            label="المكان"
            value={placeFilter}
            onChange={handlePlace}
            options={placeOptions}
          />

          <FilterSelect
            id="logs-product-filter"
            label="الصنف"
            value={productFilter}
            onChange={handleProduct}
            options={productOptions}
          />

          <SortControl
            id="logs-sort-by"
            options={SORT_OPTIONS}
            value={sortBy}
            direction={sortDir}
            onChange={handleSortBy}
            onToggleDirection={toggleSortDir}
          />
        </div>

        <div className="logs-table-wrap">
          <table className="logs-table">
            <thead>
              <tr>
                {COLUMNS.map(({ label, icon: Icon }) => (
                  <th key={label}>
                    <span className="logs-th-label">
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
                  <td colSpan={COLUMNS.length} className="logs-table__message">
                    <Loader2 size={18} className="logs-spin" aria-hidden="true" />
                    جاري تحميل السجلات...
                  </td>
                </tr>
              )}

              {status === "error" && (
                <tr>
                  <td colSpan={COLUMNS.length} className="logs-table__message logs-table__message--error">
                    {error?.message || "تعذّر تحميل السجلات. تأكد من تشغيل الخادم ثم أعد المحاولة."}
                    <button type="button" className="logs-retry-btn" onClick={reload}>
                      إعادة المحاولة
                    </button>
                  </td>
                </tr>
              )}

              {status === "success" && pageItems.length === 0 && (
                <tr>
                  <td colSpan={COLUMNS.length} className="logs-table__message">
                    لا توجد سجلات مطابقة.
                  </td>
                </tr>
              )}

              {status === "success" &&
                pageItems.map((row) => (
                  <tr key={row.id}>
                    {/* 1. date */}
                    <td className="logs-date">
                      <bdi dir="ltr">{row.timeLabel}</bdi>
                    </td>

                    {/* 2. direction (IncomingStock) */}
                    <td>
                      {row.direction === "in" && (
                        <span className="logs-dir logs-dir--in">
                          <ArrowDownLeft size={14} aria-hidden="true" />
                          دخول
                        </span>
                      )}
                      {row.direction === "out" && (
                        <span className="logs-dir logs-dir--out">
                          <ArrowUpRight size={14} aria-hidden="true" />
                          خروج
                        </span>
                      )}
                      {!row.direction && "—"}
                    </td>

                    {/* 3. type — opens the matching details modal */}
                    <td>
                      {row.refId ? (
                        <button
                          type="button"
                          className={`logs-type logs-type--${row.type} logs-type--link`}
                          onClick={() => setOpened({ type: row.type, id: row.refId })}
                          title="عرض تفاصيل العملية"
                          aria-label={`عرض تفاصيل عملية ${row.typeLabel}`}
                        >
                          {row.typeLabel}
                          <ExternalLink size={12} aria-hidden="true" />
                        </button>
                      ) : (
                        <span className={`logs-type logs-type--${row.type ?? "unknown"}`}>{row.typeLabel}</span>
                      )}
                    </td>

                    {/* 4. the sentence */}
                    <td className="logs-text">
                      <Sentence parts={row.parts} type={row.type} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="logs-footer">
          <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
          <span>
            إجمالي السجلات: <strong>{sorted.length}</strong>
          </span>
        </div>
      </section>

      {opened?.type === "Invoices" && <PurchaseModal key={opened.id} invoiceId={opened.id} onClose={closeModal} />}
      {opened?.type === "Usage" && <UsageModal key={opened.id} usageId={opened.id} onClose={closeModal} />}
      {opened?.type === "TransactionsInvoices" && (
        <TransactionModal key={opened.id} transactionId={opened.id} onClose={closeModal} />
      )}
    </div>
  );
}
