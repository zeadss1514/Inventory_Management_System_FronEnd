import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowLeftRight,
  CalendarDays,
  ClipboardList,
  Loader2,
  MapPin,
  MapPinned,
  Package,
  Plus,
  ShoppingCart,
  Warehouse,
} from "lucide-react";
import useHome from "../../hooks/useHome";
import { formatCurrency, formatDate, getPurchasedToName } from "../../utils/invoiceHelpers";
import { getEntityTypeLabel } from "../../utils/entityType";
import {
  getLineQuantity,
  getUsageItems,
  getUsageTargetName,
  getUsageTargetType,
  sumUsageQuantity,
} from "../../utils/usageHelpers";
import "./HomePage.css";

const QUICK_LINKS = [
  { to: "/purchases", label: "المشتريات", hint: "فواتير الشراء وتفعيلها", icon: ShoppingCart },
  { to: "/transfers", label: "التنقلات", hint: "نقل الأصناف بين الأماكن", icon: ArrowLeftRight },
  { to: "/usage", label: "الاستخدام", hint: "تسجيل ما يُستهلك من الأصناف", icon: ClipboardList },
  { to: "/warehouses", label: "المخازن", hint: "عرض المخازن ومخزونها", icon: Warehouse },
  { to: "/locations", label: "المواقع", hint: "عرض المواقع ومخزونها", icon: MapPin },
  { to: "/products", label: "الأصناف", hint: "قائمة الأصناف ووحداتها", icon: Package },
];

const todayLabel = () =>
  new Date().toLocaleDateString("ar-EG-u-nu-latn", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const typeIcon = (type) => (type === "Sites" ? MapPin : Warehouse);

function ActivityCard({ icon: Icon, title, to, status, error, onRetry, items, emptyText, renderRow }) {
  return (
    <section className="home-activity">
      <header className="home-activity__header">
        <h3>
          <Icon size={18} aria-hidden="true" />
          {title}
        </h3>
        <Link to={to} className="home-activity__all">
          عرض الكل
          <ArrowLeft size={14} aria-hidden="true" />
        </Link>
      </header>

      {status === "loading" && (
        <p className="home-activity__state">
          <Loader2 size={16} className="home-spin" aria-hidden="true" />
          جاري التحميل...
        </p>
      )}

      {status === "error" && (
        <p className="home-activity__state home-activity__state--error">
          {error?.message || "تعذّر تحميل البيانات."}
          <button type="button" className="home-retry-btn" onClick={onRetry}>
            إعادة المحاولة
          </button>
        </p>
      )}

      {status === "success" && items.length === 0 && <p className="home-activity__state">{emptyText}</p>}

      {status === "success" && items.length > 0 && <ul className="home-activity__list">{items.map(renderRow)}</ul>}
    </section>
  );
}

function Row({ icon: Icon, title, meta, value }) {
  return (
    <li className="home-row">
      <span className="home-row__icon">
        <Icon size={16} aria-hidden="true" />
      </span>
      <div className="home-row__main">
        <span className="home-row__title">{title}</span>
        <span className="home-row__meta">{meta}</span>
      </div>
      {value && <span className="home-row__value">{value}</span>}
    </li>
  );
}

export default function HomePage() {
  const { status, invoices, transactions, usages, error, reload } = useHome();

  return (
    <div className="home-page">
      {/* ---------- Hero ---------- */}
      <section className="home-hero">
        <div className="home-hero__text">
          <span className="home-hero__date">
            <CalendarDays size={15} aria-hidden="true" />
            {todayLabel()}
          </span>
          <h1>مرحباً بك في نظام إدارة المخزون</h1>
          <p>تابع مشترياتك وتنقلات صنفاتك واستخدامها بين المخازن والمواقع من مكان واحد.</p>
        </div>
        <div className="home-hero__actions">
          <Link to="/purchases" className="home-hero__btn home-hero__btn--primary">
            <Plus size={16} aria-hidden="true" />
            فاتورة مشتريات
          </Link>
          <Link to="/transfers" className="home-hero__btn">
            <ArrowLeftRight size={16} aria-hidden="true" />
            تنقل جديد
          </Link>
          <Link to="/usage" className="home-hero__btn">
            <ClipboardList size={16} aria-hidden="true" />
            عملية استخدام
          </Link>
        </div>
      </section>

      {/* ---------- Quick links ---------- */}
      <nav className="home-quick" aria-label="اختصارات">
        {QUICK_LINKS.map(({ to, label, hint, icon: Icon }) => (
          <Link key={to} to={to} className="home-quick__item">
            <span className="home-quick__icon">
              <Icon size={20} aria-hidden="true" />
            </span>
            <span className="home-quick__label">{label}</span>
            <span className="home-quick__hint">{hint}</span>
          </Link>
        ))}
      </nav>

      {/* ---------- Middle text ---------- */}
      <section className="home-about">
        <h2>كل ما يخص مخزونك في مكان واحد</h2>
        <p>
          يساعدك النظام على معرفة ما تم شراؤه، وما انتقل من مكان إلى آخر، وما تم استخدامه فعلياً، حتى تبقى أرصدة المخازن
          والمواقع واضحة ومحدّثة في أي وقت.
        </p>
        <p className="home-about__note">
          تظهر في الأسفل آخر العمليات المفعّلة فقط، أما العمليات المحفوظة كمسودة فتجدها داخل صفحتها تحت تبويب «المسودات».
        </p>
      </section>

      {/* ---------- Recent activity ---------- */}
      <div className="home-grid">
        <ActivityCard
          icon={ShoppingCart}
          title="آخر المشتريات"
          to="/purchases"
          status={status}
          error={error}
          onRetry={reload}
          items={invoices}
          emptyText="لا توجد فواتير مفعّلة بعد."
          renderRow={(inv) => {
            const type = inv.purchaseToType;
            return (
              <Row
                key={inv._id}
                icon={typeIcon(type)}
                title={getPurchasedToName(inv.purchasedTo)}
                meta={`${getEntityTypeLabel(type)} · ${formatDate(inv.createdAt)}`}
                value={formatCurrency(inv.totalcost ?? inv.totalCost)}
              />
            );
          }}
        />

        <ActivityCard
          icon={ArrowLeftRight}
          title="آخر التنقلات"
          to="/transfers"
          status={status}
          error={error}
          onRetry={reload}
          items={transactions}
          emptyText="لا توجد تنقلات مفعّلة بعد."
          renderRow={(t) => {
            const qty = (Array.isArray(t.TransactedItems) ? t.TransactedItems : []).reduce(
              (sum, line) => sum + getLineQuantity(line),
              0,
            );
            return (
              <Row
                key={t._id}
                icon={MapPinned}
                title={
                  <span className="home-flow">
                    {getPurchasedToName(t.TransactedFrom)}
                    <ArrowLeft size={13} aria-hidden="true" />
                    {getPurchasedToName(t.TransactedTo)}
                  </span>
                }
                meta={`${getEntityTypeLabel(t.FromType)} ← ${getEntityTypeLabel(t.ToType)} · ${formatDate(t.createdAt)}`}
                value={qty > 0 ? `الكمية ${qty}` : null}
              />
            );
          }}
        />

        <ActivityCard
          icon={ClipboardList}
          title="آخر عمليات الاستخدام"
          to="/usage"
          status={status}
          error={error}
          onRetry={reload}
          items={usages}
          emptyText="لا توجد عمليات استخدام مفعّلة بعد."
          renderRow={(u) => {
            const type = getUsageTargetType(u);
            const qty = sumUsageQuantity(getUsageItems(u));
            return (
              <Row
                key={u._id}
                icon={type ? typeIcon(type) : Package}
                title={getUsageTargetName(u)}
                meta={`${type ? `${getEntityTypeLabel(type)} · ` : ""}${formatDate(u.createdAt)}`}
                value={qty > 0 ? `الكمية ${qty}` : null}
              />
            );
          }}
        />
      </div>

      {/* ---------- Footer ---------- */}
      <footer className="home-footer">
        <span>
          تم التطوير بواسطة <strong dir="ltr">microSystems</strong>
        </span>
        <span dir="ltr">© {new Date().getFullYear()} microSystems</span>
      </footer>
    </div>
  );
}
